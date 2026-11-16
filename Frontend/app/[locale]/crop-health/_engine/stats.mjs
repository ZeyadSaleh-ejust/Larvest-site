// Per-polygon summaries and CSV export. Each is a single typed-array pass.
import { CLASS_INFO, CLS } from './classifier.mjs';

export function percentile(sorted, p) {
  if (!sorted.length) return NaN;
  const k = (sorted.length - 1) * p, f = Math.floor(k), c = Math.min(sorted.length - 1, f + 1);
  return sorted[f] + (sorted[c] - sorted[f]) * (k - f);
}

/** ctx = { ids, nIds, N } -> rows[id] = { n, counts[7], ndviSum, ndviN } */
export function summarizeClasses(ctx, cls, ndvi) {
  const { ids, nIds, N } = ctx;
  const rows = Array.from({ length: nIds + 1 }, () => ({ n: 0, counts: new Array(CLASS_INFO.length).fill(0), ndviSum: 0, ndviN: 0 }));
  for (let i = 0; i < N; i++) {
    const id = ids[i];
    if (!id) continue;
    const r = rows[id];
    r.counts[cls[i]]++;
    if (cls[i] !== CLS.EMPTY) r.n++;
    const v = ndvi[i];
    if (v === v) { r.ndviSum += v; r.ndviN++; }
  }
  return rows;
}

export function summarizeAnomaly(ctx, status, score) {
  const { ids, nIds, N } = ctx;
  const rows = Array.from({ length: nIds + 1 }, () => ({ counts: new Array(6).fill(0), scoreSum: 0, scoreN: 0 }));
  for (let i = 0; i < N; i++) {
    const id = ids[i];
    if (!id) continue;
    rows[id].counts[status[i]]++;
    const s = score[i];
    if (s === s) { rows[id].scoreSum += s; rows[id].scoreN++; }
  }
  return rows;
}

export function summarizeIndex(ctx, arr) {
  const { ids, nIds, N } = ctx;
  const vals = Array.from({ length: nIds + 1 }, () => []);
  for (let i = 0; i < N; i++) { const id = ids[i]; if (id && arr[i] === arr[i]) vals[id].push(arr[i]); }
  return vals.map((v) => {
    if (!v.length) return { n: 0, mean: NaN, p10: NaN, p50: NaN, p90: NaN };
    const s = Float64Array.from(v).sort();
    let sum = 0; for (const x of v) sum += x;
    return { n: v.length, mean: sum / v.length, p10: percentile(s, 0.1), p50: percentile(s, 0.5), p90: percentile(s, 0.9) };
  });
}

export function toCSV(headers, rows) {
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}
