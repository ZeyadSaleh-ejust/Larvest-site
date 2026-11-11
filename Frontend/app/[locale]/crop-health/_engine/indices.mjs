// Spectral indices, computed per pixel from the real Sentinel-2 / Landsat pack.
// Mirrors compute_indices() in Nubaria_Crop_Health_Corrected.ipynb (cell 8).
// Reflectance is stored x10000 as uint16, 0 = invalid (cloud / shadow / no scene).

export const BAND_ORDER = ['B2', 'B3', 'B4', 'B5', 'B6', 'B8', 'B11', 'B12'];

// name -> { label, reverse (low = good), range (fixed display range) , group }
export const INDEX_INFO = {
  NDVI:  { label: 'NDVI',  desc: 'Greenness / canopy vigour',            range: [0, 0.9],   group: 'vigour' },
  EVI:   { label: 'EVI',   desc: 'Enhanced vegetation index',             range: [0, 0.8],   group: 'vigour' },
  SAVI:  { label: 'SAVI',  desc: 'Soil-adjusted vegetation index',        range: [0, 0.9],   group: 'vigour' },
  OSAVI: { label: 'OSAVI', desc: 'Optimised soil-adjusted index',         range: [0, 0.9],   group: 'vigour' },
  MSAVI: { label: 'MSAVI', desc: 'Modified soil-adjusted index',          range: [0, 0.8],   group: 'vigour' },
  GNDVI: { label: 'GNDVI', desc: 'Green NDVI (chlorophyll)',              range: [0, 0.85],  group: 'vigour' },
  NDRE:  { label: 'NDRE',  desc: 'Red-edge nitrogen / chlorophyll status', range: [0, 0.6],  group: 'nitrogen' },
  CIre:  { label: 'CIre',  desc: 'Red-edge chlorophyll index',            range: [0, 6],     group: 'nitrogen' },
  GCI:   { label: 'GCI',   desc: 'Green chlorophyll index',               range: [0, 9],     group: 'nitrogen' },
  MCARI: { label: 'MCARI', desc: 'Chlorophyll absorption ratio',          range: [0, 0.6],   group: 'nitrogen' },
  NDMI:  { label: 'NDMI',  desc: 'Canopy water content',                  range: [-0.2, 0.5], group: 'water' },
  NDWI:  { label: 'NDWI',  desc: 'Open-water mask index',                 range: [-0.8, 0.4], group: 'water' },
  MSI:   { label: 'MSI',   desc: 'Moisture stress index (high = dry)',    range: [0.2, 1.8], group: 'water', reverse: true },
  GVMI:  { label: 'GVMI',  desc: 'Global vegetation moisture index',      range: [0, 0.7],   group: 'water' },
  SIPI:  { label: 'SIPI',  desc: 'Pigment ratio (high = stress)',         range: [0.8, 1.8], group: 'stress', reverse: true },
  PSRI:  { label: 'PSRI',  desc: 'Senescence (high = dying tissue)',      range: [-0.1, 0.5], group: 'stress', reverse: true },
  ARI:   { label: 'ARI',   desc: 'Anthocyanin (stress pigment)',          range: [0, 8],     group: 'stress', reverse: true },
  CRI1:  { label: 'CRI1',  desc: 'Carotenoid reflectance',                range: [0, 14],    group: 'stress', reverse: true },
  BSI:   { label: 'BSI',   desc: 'Bare-soil index',                       range: [-0.4, 0.3], group: 'soil', reverse: true },
  BI:    { label: 'BI',    desc: 'Brightness index',                      range: [0.05, 0.45], group: 'soil', reverse: true },
  LST:   { label: 'LST (°C)', desc: 'Landsat land-surface temperature',   range: [15, 50],   group: 'thermal', reverse: true },
};
export const INDEX_NAMES = Object.keys(INDEX_INFO);

const nan = NaN;

/**
 * @param {Uint16Array} raw  8 bands planar, length 8*N (reflectance*10000)
 * @param {Uint8Array|null} lstCode  length N, 0 = none, else LST = code/scale + offset
 * @param {{offset_c:number, scale:number}} lstMeta
 * @returns {{N:number, valid:Uint8Array, idx:Record<string,Float32Array>, B11:Float32Array, B12:Float32Array, thermal:Float32Array}}
 */
export function computeIndices(raw, lstCode, lstMeta, N) {
  const idx = {};
  // NDVI / NDWI / BSI feed hard thresholds (<0.20, >0.30, >soil BSI), so they stay
  // in double precision; float32 rounding flipped a handful of boundary pixels.
  const F64 = new Set(['NDVI', 'NDWI', 'BSI']);
  for (const k of INDEX_NAMES) idx[k] = (F64.has(k) ? new Float64Array(N) : new Float32Array(N)).fill(nan);
  const valid = new Uint8Array(N);
  const B11s = new Float32Array(N);
  const B12s = new Float32Array(N);
  const thermal = idx.LST;

  const o2 = N, o3 = 2 * N, o4 = 3 * N, o5 = 4 * N, o6 = 5 * N, o11 = 6 * N, o12 = 7 * N;

  for (let i = 0; i < N; i++) {
    const rB = raw[i], rG = raw[o2 + i], rR = raw[o3 + i], rRE1 = raw[o4 + i], rRE2 = raw[o5 + i],
      rN = raw[o6 + i], rS = raw[o11 + i], rS2 = raw[o12 + i];

    B11s[i] = rS / 10000;
    B12s[i] = rS2 / 10000;

    if (lstCode) {
      const c = lstCode[i];
      if (c > 0) thermal[i] = c / lstMeta.scale + lstMeta.offset_c;
    }

    // a band is invalid when ref <= 0 or ref > 1 (notebook rule)
    const ok = (v) => v > 0 && v <= 10000;
    const okB = ok(rB), okG = ok(rG), okR = ok(rR), okRE1 = ok(rRE1), okRE2 = ok(rRE2),
      okN = ok(rN), okS = ok(rS), okS2 = ok(rS2);
    if (okR && okN) valid[i] = 1;

    // x * 0.0001 (not / 10000) on purpose: it is what the notebook does, and the two
    // differ in the last bit - enough to flip pixels sitting exactly on a threshold.
    const B = okB ? rB * 0.0001 : nan, G = okG ? rG * 0.0001 : nan, R = okR ? rR * 0.0001 : nan,
      RE1 = okRE1 ? rRE1 * 0.0001 : nan, RE2 = okRE2 ? rRE2 * 0.0001 : nan, N_ = okN ? rN * 0.0001 : nan,
      S = okS ? rS * 0.0001 : nan, S2 = okS2 ? rS2 * 0.0001 : nan;
    const S2x = okS2 ? S2 : S; // notebook: SWIR2 falls back to SWIR only if the column is absent

    idx.NDVI[i] = (N_ - R) / (N_ + R);
    idx.EVI[i] = 2.5 * (N_ - R) / (N_ + 6.0 * R - 7.5 * B + 1.0);
    idx.SAVI[i] = ((N_ - R) / (N_ + R + 0.5)) * 1.5;
    idx.OSAVI[i] = (N_ - R) / (N_ + R + 0.16);
    const term = Math.sqrt(Math.max((2 * N_ + 1) ** 2 - 8 * (N_ - R), 0));
    idx.MSAVI[i] = 0.5 * ((2 * N_ + 1) - term);
    idx.GNDVI[i] = (N_ - G) / (N_ + G);

    idx.NDWI[i] = (G - N_) / (G + N_);
    idx.NDMI[i] = (N_ - S) / (N_ + S);
    const msi = S / N_;
    idx.MSI[i] = msi !== msi ? nan : Math.min(3, Math.max(0, msi));
    idx.GVMI[i] = (N_ + 0.1 - S2x + 0.02) / (N_ + 0.1 + S2x + 0.02);

    idx.NDRE[i] = (N_ - RE1) / (N_ + RE1);
    idx.CIre[i] = (N_ / RE1) - 1;
    idx.GCI[i] = (N_ / G) - 1;
    idx.MCARI[i] = ((RE1 - R) - 0.2 * (RE1 - G)) * (RE1 / R);

    const den = N_ - R;
    const sipi = Math.abs(den) > 1e-6 ? (N_ - B) / den : nan;
    idx.SIPI[i] = sipi !== sipi ? nan : Math.min(2, Math.max(0, sipi));
    idx.PSRI[i] = (R - B) / RE2;
    const ari = (1.0 / G) - (1.0 / RE1);
    idx.ARI[i] = ari !== ari ? nan : Math.min(20, Math.max(-5, ari));
    const cri = (1.0 / B) - (1.0 / G);
    idx.CRI1[i] = cri !== cri ? nan : Math.min(30, Math.max(0, cri));

    idx.BI[i] = Math.sqrt((R * R + N_ * N_) / 2);
    idx.BSI[i] = ((S + R) - (N_ + B)) / ((S + R) + (N_ + B));
  }

  // inf -> NaN (notebook: df.replace([inf,-inf], nan))
  for (const k of INDEX_NAMES) {
    const a = idx[k];
    for (let i = 0; i < N; i++) if (a[i] === Infinity || a[i] === -Infinity) a[i] = nan;
  }
  return { N, valid, idx, B11: B11s, B12: B12s, thermal };
}
