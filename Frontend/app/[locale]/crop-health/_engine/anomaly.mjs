// Within-field anomaly screening.
// Port of the "field-aware" method in Crop_Health_Monitoring_Field_Aware.ipynb
// (field_directional_evidence + run_spatial_screening): every pixel is compared
// with ITS OWN field on the SAME day, so no crop-specific reference curve is
// needed. A "high" call needs the combined score AND >= 2 independent evidence
// families (vigour, moisture, heat) to agree.

export const ANOM = { NONE: 0, LOW_COVER: 1, TYPICAL: 2, WATCH: 3, HIGH: 4, NOT_SCORED: 5 };
export const ANOM_INFO = [
  { key: 'none',       color: '#00000000', label: 'Outside polygons / no data' },
  { key: 'low_cover',  color: '#9aa0a6',   label: 'Low cover / stage unknown (not scored)' },
  { key: 'typical',    color: '#2e9e4f',   label: 'Typical for this field' },
  { key: 'watch',      color: '#FFB300',   label: 'Watch: unusually weak vs. rest of field' },
  { key: 'high',       color: '#E53935',   label: 'High anomaly (>=2 signals agree)' },
  { key: 'not_scored', color: '#5f7a8a',   label: 'Field too small to score' },
];

export const DEFAULT_ANOMALY = {
  zStart: 1.0, zFull: 3.0,          // WITHIN_FIELD_Z_START / FULL
  watch: 0.40, high: 0.65,          // WATCH / HIGH_ANOMALY_THRESHOLD
  strong: 0.60,                     // STRONG_EVIDENCE_THRESHOLD
  minPixels: 40,                    // notebook: 80 (for 100+ ha pivots); fields here are 0.5-3 ha
  edgePx: 1,                        // pixels eroded from every field edge (notebook: 30 m buffer)
  activeNdvi: 0.20, lowCoverMedian: 0.35, lowCoverActive: 0.55,
};
const VIGOR_W = 0.55, MOIST_W = 0.45, THERMAL_BASE_W = 0.20;
const THERMAL_DECAY_DAYS = 4.0, THERMAL_MIN_RELIAB = 0.50;
const FLOORS = { NDVI: 0.03, NDRE: 0.02, NDMI: 0.03, LST: 1.0 };

/** pixels whose (2k+1)^2 neighbourhood is entirely inside the same polygon */
export function interiorMask(ids, W, H, k) {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, id = ids[i];
      if (!id) continue;
      let ok = 1;
      if (k > 0) {
        for (let dy = -k; dy <= k && ok; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= H) { ok = 0; break; }
          for (let dx = -k; dx <= k; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= W || ids[yy * W + xx] !== id) { ok = 0; break; }
          }
        }
      }
      out[i] = ok;
    }
  }
  return out;
}

function median(sortedCopy) {
  const n = sortedCopy.length;
  if (!n) return NaN;
  const m = n >> 1;
  return n % 2 ? sortedCopy[m] : 0.5 * (sortedCopy[m - 1] + sortedCopy[m]);
}
function robustSigma(vals) {
  if (!vals.length) return NaN;
  const s = Float64Array.from(vals).sort();
  const med = median(s);
  const dev = Float64Array.from(vals, (v) => Math.abs(v - med)).sort();
  return 1.4826 * median(dev);
}

/**
 * @param ind computeIndices() result
 * @param ids Uint8Array polygon id per pixel (0 = outside)
 * @param interior Uint8Array from interiorMask()
 * @param nIds number of polygons
 * @param lstGapDays null when no thermal scene is available for this date
 */
export function anomalyScreen(ind, ids, interior, nIds, lstGapDays, opts = DEFAULT_ANOMALY) {
  const { N, idx } = ind;
  const status = new Uint8Array(N);
  const score = new Float32Array(N).fill(NaN);
  const evid = { vigor: new Float32Array(N).fill(NaN), moisture: new Float32Array(N).fill(NaN), heat: new Float32Array(N).fill(NaN) };
  const fields = [];                       // per polygon diagnostics (index = id)
  for (let k = 0; k <= nIds; k++) fields.push({ id: k, state: 'empty', n: 0, medNdvi: NaN, activeFrac: NaN });

  // group pixels per field (interior + valid optical)
  const lists = Array.from({ length: nIds + 1 }, () => []);
  for (let i = 0; i < N; i++) {
    if (interior[i] && ind.valid[i] && idx.NDVI[i] === idx.NDVI[i]) lists[ids[i]].push(i);
  }

  const eligible = new Uint8Array(N);
  for (let id = 1; id <= nIds; id++) {
    const px = lists[id];
    const f = fields[id];
    f.n = px.length;
    if (!px.length) { f.state = 'no_valid_data'; continue; }
    const nd = Float64Array.from(px, (i) => idx.NDVI[i]).sort();
    f.medNdvi = median(nd);
    let act = 0; for (const i of px) if (idx.NDVI[i] >= opts.activeNdvi) act++;
    f.activeFrac = act / px.length;
    const state = (f.medNdvi < opts.lowCoverMedian || f.activeFrac < opts.lowCoverActive)
      ? 'low_cover_or_stage_unknown' : 'active_field';
    f.state = state;
    for (const i of px) status[i] = state === 'active_field' ? ANOM.TYPICAL : ANOM.LOW_COVER;
    if (state === 'active_field') {
      if (px.length < opts.minPixels) { f.state = 'too_small'; for (const i of px) status[i] = ANOM.NOT_SCORED; }
      else for (const i of px) eligible[i] = 1;
    }
  }

  const span = opts.zFull - opts.zStart;
  // directional evidence for one feature: 0..1 per eligible pixel
  function evidence(arr, bad, floor, extraMask) {
    const out = new Float32Array(N).fill(NaN);
    const pooled = [];
    for (let i = 0; i < N; i++) if (eligible[i] && arr[i] === arr[i] && (!extraMask || extraMask[i])) pooled.push(arr[i]);
    const gs = robustSigma(pooled);
    const scaleFloor = Number.isFinite(gs) ? Math.max(floor, 0.20 * gs) : floor;
    for (let id = 1; id <= nIds; id++) {
      const px = lists[id].filter((i) => eligible[i] && arr[i] === arr[i] && (!extraMask || extraMask[i]));
      if (px.length < opts.minPixels) continue;
      const vals = px.map((i) => arr[i]);
      const med = median(Float64Array.from(vals).sort());
      let sigma = robustSigma(vals);
      if (!Number.isFinite(sigma)) continue;
      sigma = Math.max(sigma, scaleFloor, 1e-9);
      for (const i of px) {
        const z = bad === 'low' ? (med - arr[i]) / sigma : (arr[i] - med) / sigma;
        const e = (z - opts.zStart) / span;
        out[i] = e < 0 ? 0 : e > 1 ? 1 : e;
      }
    }
    return out;
  }

  const ndviL = evidence(idx.NDVI, 'low', FLOORS.NDVI);
  const ndreL = evidence(idx.NDRE, 'low', FLOORS.NDRE);
  const ndmiL = evidence(idx.NDMI, 'low', FLOORS.NDMI);

  let reliab = 0, heatE = null;
  if (lstGapDays != null) {
    const lstOk = new Uint8Array(N);
    for (let i = 0; i < N; i++) lstOk[i] = idx.LST[i] === idx.LST[i] ? 1 : 0;
    heatE = evidence(idx.LST, 'high', FLOORS.LST, lstOk);
    reliab = Math.exp(-lstGapDays / THERMAL_DECAY_DAYS);
  }
  const wHeat = THERMAL_BASE_W * reliab;
  const heatStrongOk = reliab >= THERMAL_MIN_RELIAB;

  for (let i = 0; i < N; i++) {
    if (!eligible[i]) continue;
    // vigour = mean of available NDVI / NDRE evidence
    let vs = 0, vc = 0;
    if (ndviL[i] === ndviL[i]) { vs += ndviL[i]; vc++; }
    if (ndreL[i] === ndreL[i]) { vs += ndreL[i]; vc++; }
    const vig = vc ? vs / vc : NaN;
    const moi = ndmiL[i];
    const heat = heatE ? heatE[i] : NaN;
    evid.vigor[i] = vig; evid.moisture[i] = moi; evid.heat[i] = heat;

    let num = 0, den = 0;
    if (vig === vig) { num += vig * VIGOR_W; den += VIGOR_W; }
    if (moi === moi) { num += moi * MOIST_W; den += MOIST_W; }
    if (heat === heat && wHeat > 0) { num += heat * wHeat; den += wHeat; }
    if (den <= 0) continue;
    const sc = num / den;
    score[i] = sc;

    let strong = 0;
    if (vig >= opts.strong) strong++;
    if (moi >= opts.strong) strong++;
    if (heatStrongOk && heat * reliab >= opts.strong) strong++;

    let st = ANOM.TYPICAL;
    if (sc >= opts.watch) st = ANOM.WATCH;
    if (sc >= opts.high && strong >= 2) st = ANOM.HIGH;
    status[i] = st;
  }
  return { status, score, evid, fields, thermalReliability: reliab };
}
