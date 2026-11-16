// Rule-based crop-condition classifier.
// Faithful port of classify_crop_issues() from Nubaria_Crop_Health_Corrected.ipynb
// (cell 8) with ONE deliberate change: open water is its own class.
//
// In the notebook, "fix 6" sets water_score[waterbody] = 1.0 - but water_score is
// the water-STRESS class, so canals and ponds come out labelled "water stress"
// (i.e. drought). Here those pixels get class OPEN_WATER instead.
// Everything else is identical, which tools/parity_test.py verifies against the
// notebook's own code on real pixels.

export const CLS = {
  EMPTY: 0, BARE: 1, OPEN_WATER: 2, WATER_STRESS: 3, NUTRIENT: 4, DISEASE: 5, HEALTHY: 6,
};
export const CLASS_KEYS = ['empty', 'bare_soil', 'open_water', 'water_stress', 'nutrient', 'disease', 'healthy'];
export const CLASS_INFO = [
  { key: 'empty',        color: '#8a8a8a', label: 'No data' },
  { key: 'bare_soil',    color: '#D2B48C', label: 'Bare soil' },
  { key: 'open_water',   color: '#00C2C7', label: 'Open water' },
  { key: 'water_stress', color: '#0050FF', label: 'Water stress' },
  { key: 'nutrient',     color: '#FFD700', label: 'Nutrient deficiency / low vegetation' },
  { key: 'disease',      color: '#FF0000', label: 'Disease / senescence' },
  { key: 'healthy',      color: '#00A000', label: 'Healthy' },
];

export const SOIL_THRESHOLDS = {
  old_delta_clay:   { B11: 0.22, B12: 0.18, BSI: 0.05 },
  reclaimed_sandy:  { B11: 0.30, B12: 0.26, BSI: 0.12 },
  calcareous_sandy: { B11: 0.34, B12: 0.30, BSI: 0.15 },
};
export const THERMAL_BANDS = {
  winter: { mild: 30.0, severe: 38.0 },
  summer: { mild: 34.0, severe: 42.0 },
};
export const DEFAULT_CLASSIFIER = { soilClass: 'calcareous_sandy', season: 'summer' };

const ramp = (x, lo, hi) => {
  if (x !== x) return NaN;
  if (hi === lo) return 0;
  const v = (x - lo) / (hi - lo);
  return v < 0 ? 0 : v > 1 ? 1 : v;
};
const inv = (x, hi, lo) => {
  if (x !== x) return NaN;
  if (hi === lo) return 0;
  const v = (hi - x) / (hi - lo);
  return v < 0 ? 0 : v > 1 ? 1 : v;
};

// nan-aware mean; 0 when nothing is finite (notebook calc_score)
function mean(buf, n) {
  let s = 0, c = 0;
  for (let k = 0; k < n; k++) {
    const v = buf[k];
    if (v === v) { s += v; c++; }
  }
  return c ? s / c : 0;
}

/** Season that fits a calendar date in Egypt: Nov-Mar cool, Apr-Oct hot. */
export function seasonForDate(dateStr) {
  const m = Number(dateStr.slice(5, 7));
  return m >= 11 || m <= 3 ? 'winter' : 'summer';
}

/**
 * @param {ReturnType<import('./indices.mjs').computeIndices>} ind
 * @returns {{cls:Uint8Array, conf:Uint8Array, probs:Uint8Array}}
 *   probs: 6 planes [soil, water, nutrient, disease, healthy, empty] scaled 0..255
 */
export function classify(ind, opts = DEFAULT_CLASSIFIER) {
  const { N, idx } = ind;
  const SOIL = SOIL_THRESHOLDS[opts.soilClass] || SOIL_THRESHOLDS.calcareous_sandy;
  const T = THERMAL_BANDS[opts.season] || THERMAL_BANDS.summer;

  const cls = new Uint8Array(N);
  const conf = new Uint8Array(N);
  const probs = new Uint8Array(N * 6);
  const buf = new Float64Array(8);

  const NDVI = idx.NDVI, EVI = idx.EVI, SAVI = idx.SAVI, NDRE = idx.NDRE, GCI = idx.GCI,
    NDMI = idx.NDMI, BSI = idx.BSI, MSI = idx.MSI, GVMI = idx.GVMI, CIre = idx.CIre,
    SIPI = idx.SIPI, PSRI = idx.PSRI, ARI = idx.ARI, NDWI = idx.NDWI, TH = idx.LST;
  const B11 = ind.B11, B12 = ind.B12;

  for (let i = 0; i < N; i++) {
    const ndvi = NDVI[i], ndwi = NDWI[i], bsi = BSI[i], b11 = B11[i], b12 = B12[i];

    // ---- healthy
    buf[0] = ramp(ndvi, 0.45, 0.80); buf[1] = ramp(EVI[i], 0.25, 0.60); buf[2] = ramp(SAVI[i], 0.35, 0.65);
    buf[3] = ramp(NDRE[i], 0.20, 0.45); buf[4] = ramp(GCI[i], 2.0, 6.0); buf[5] = ramp(NDMI[i], 0.10, 0.35);
    let healthy = mean(buf, 6);

    // ---- bare soil
    buf[0] = inv(ndvi, 0.25, 0.05); buf[1] = inv(SAVI[i], 0.22, 0.05);
    buf[2] = ramp(bsi, SOIL.BSI - 0.10, SOIL.BSI + 0.15);
    buf[3] = ramp(b11, SOIL.B11 - 0.05, SOIL.B11 + 0.12);
    buf[4] = ramp(b12, SOIL.B12 - 0.05, SOIL.B12 + 0.12);
    let soil = mean(buf, 5);

    // ---- water stress (NDMI counted twice)
    const ndmiInv = inv(NDMI[i], 0.20, -0.10);
    buf[0] = ramp(TH[i], T.mild, T.severe); buf[1] = ndmiInv; buf[2] = ndmiInv;
    buf[3] = ramp(MSI[i], 0.9, 1.8); buf[4] = inv(GVMI[i], 0.30, 0.0);
    buf[5] = ramp(b11, SOIL.B11 * 0.75, SOIL.B11 * 1.15);
    let water = mean(buf, 6);

    // ---- nutrient (SIPI direction corrected, damped by senescence)
    buf[0] = inv(NDRE[i], 0.35, 0.12); buf[1] = inv(GCI[i], 5.0, 1.5);
    buf[2] = inv(CIre[i], 3.0, 0.5); buf[3] = ramp(SIPI[i], 1.05, 1.70);
    const psriRamp = ramp(PSRI[i], 0.18, 0.38);
    let nutrient = mean(buf, 4) * (1.0 - 0.55 * psriRamp);       // NaN if PSRI is NaN (as in the notebook)

    // ---- disease (PSRI weighted twice)
    buf[0] = inv(ndvi, 0.75, 0.30); buf[1] = psriRamp; buf[2] = psriRamp;
    buf[3] = ramp(ARI[i], 2.0, 7.0); buf[4] = inv(EVI[i], 0.55, 0.20);
    let disease = mean(buf, 5);

    // ---- overrides, in the notebook's order
    const waterbody = ndwi > 0.30;
    const genBare = ndvi < 0.20 && !waterbody;
    if (genBare) { nutrient = 0; disease = 0; healthy = 0; water = 0; soil = 1; }
    if (ndvi < 0.12 && bsi > SOIL.BSI && !waterbody) soil = 1;
    if (waterbody) { soil = 0; nutrient = 0; disease = 0; healthy = 0; water = 1; }

    // ---- normalise (nan_to_num then divide)
    const s0 = soil !== soil ? 0 : soil, s1 = water !== water ? 0 : water,
      s2 = nutrient !== nutrient ? 0 : nutrient, s3 = disease !== disease ? 0 : disease,
      s4 = healthy !== healthy ? 0 : healthy;
    const sum = s0 + s1 + s2 + s3 + s4;
    let p0 = s0 / (sum + 1e-9), p1 = s1 / (sum + 1e-9), p2 = s2 / (sum + 1e-9),
      p3 = s3 / (sum + 1e-9), p4 = s4 / (sum + 1e-9), p5 = sum < 0.08 ? 0.5 : 0;

    // handle_null: >= 5 of 9 core columns NaN. B4, B8, B11 are never NaN (0 when invalid).
    let nn = 0;
    if (ndvi !== ndvi) nn++;
    if (EVI[i] !== EVI[i]) nn++;
    if (SAVI[i] !== SAVI[i]) nn++;
    if (ndwi !== ndwi) nn++;
    if (NDRE[i] !== NDRE[i]) nn++;
    if (TH[i] !== TH[i]) nn++;
    if (nn >= 5) { p0 = p1 = p2 = p3 = p4 = 0; p5 = 1; }

    const tot = p0 + p1 + p2 + p3 + p4 + p5 + 1e-9;
    p0 /= tot; p1 /= tot; p2 /= tot; p3 /= tot; p4 /= tot; p5 /= tot;

    // argmax in the notebook's order [soil, water, nutrient, disease, healthy, empty]; first max wins
    let best = 0, bv = p0;
    if (p1 > bv) { best = 1; bv = p1; }
    if (p2 > bv) { best = 2; bv = p2; }
    if (p3 > bv) { best = 3; bv = p3; }
    if (p4 > bv) { best = 4; bv = p4; }
    if (p5 > bv) { best = 5; bv = p5; }

    cls[i] = best === 0 ? CLS.BARE
      : best === 1 ? (waterbody ? CLS.OPEN_WATER : CLS.WATER_STRESS)
      : best === 2 ? CLS.NUTRIENT
      : best === 3 ? CLS.DISEASE
      : best === 4 ? CLS.HEALTHY : CLS.EMPTY;
    conf[i] = Math.round(bv * 255);
    const o = i * 6;
    probs[o] = Math.round(p0 * 255); probs[o + 1] = Math.round(p1 * 255); probs[o + 2] = Math.round(p2 * 255);
    probs[o + 3] = Math.round(p3 * 255); probs[o + 4] = Math.round(p4 * 255); probs[o + 5] = Math.round(p5 * 255);
  }
  return { cls, conf, probs };
}
