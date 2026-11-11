"use client";
// All data + computation for the crop-health explorer.
//
// Design for speed: the real Sentinel-2 / Landsat pack is tiny (~45k pixels per
// date), so every index, the full classification and the within-field anomaly
// screening are recomputed IN THE BROWSER from typed arrays. Changing a
// selection never touches the network:
//   * changing polygons / class visibility / opacity  -> re-colour only  (~1 ms)
//   * changing method, index, thresholds              -> recompute      (~10-40 ms)
//   * changing date                                   -> indices again  (~40 ms, data already prefetched)
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { loadPack, loadDate } from '../_engine/data.mjs';
import { computeIndices, INDEX_INFO } from '../_engine/indices.mjs';
import { classify, CLS, CLASS_INFO, seasonForDate } from '../_engine/classifier.mjs';
import { anomalyScreen, interiorMask, ANOM, ANOM_INFO } from '../_engine/anomaly.mjs';
import { rasterize, ringAreaM2 } from '../_engine/geo.mjs';
import { summarizeClasses, summarizeAnomaly, summarizeIndex, percentile } from '../_engine/stats.mjs';
import { hexToRGBA, makeLUT } from '../_engine/colors.mjs';

export const DATA_BASE = '/crop-health';
const FEDDAN_M2 = 4200;

const CLASS_RGBA = CLASS_INFO.map((c) => hexToRGBA(c.color));
const ANOM_RGBA = ANOM_INFO.map((c) => hexToRGBA(c.color));
const BIN_RGBA = { healthy: hexToRGBA('#16a34a'), unhealthy: hexToRGBA('#ef4444'), other: hexToRGBA('#a8a29e') };
const LUT_FWD = makeLUT(false);
const LUT_REV = makeLUT(true);
const dim = (c, a = 70) => ((c & 0x00ffffff) | (a << 24)) >>> 0;

const tick = () => new Promise((r) => setTimeout(r, 0));

// ---------------------------------------------------------------------------
// the analysis for one date -> per-polygon rows (used by table AND trend chart)
// ---------------------------------------------------------------------------
function analyze({ ind, method, indexName, soilClass, season, anomOpts, ctx, interior, lstGap }) {
  if (method === 'health' || method === 'binary') {
    const clsRes = classify(ind, { soilClass, season });
    return { clsRes, rows: summarizeClasses(ctx, clsRes.cls, ind.idx.NDVI) };
  }
  if (method === 'anomaly') {
    const anomRes = anomalyScreen(ind, ctx.ids, interior, ctx.nIds, lstGap, anomOpts);
    return { anomRes, rows: summarizeAnomaly(ctx, anomRes.status, anomRes.score) };
  }
  return { rows: summarizeIndex(ctx, ind.idx[indexName]) };
}

// aggregate rows over the selected polygons into the trend-chart metrics
export function seriesMetrics(method) {
  if (method === 'health' || method === 'binary') {
    return [
      { key: 'pct_healthy', label: '% healthy', unit: '%' },
      { key: 'pct_stress', label: '% stressed', unit: '%' },
      { key: 'ndvi', label: 'Mean NDVI', unit: '' },
    ];
  }
  if (method === 'anomaly') return [{ key: 'pct_flagged', label: '% flagged (watch + high)', unit: '%' }, { key: 'pct_high', label: '% high anomaly', unit: '%' }];
  return [{ key: 'mean', label: 'Mean value', unit: '' }];
}
export function metricFromRows(method, rows, selMask, key) {
  if (!rows) return NaN;
  let a = 0, b = 0;
  for (let id = 1; id < rows.length; id++) {
    if (!selMask[id]) continue;
    const r = rows[id];
    if (method === 'health' || method === 'binary') {
      const n = r.n;
      if (key === 'pct_healthy') { a += r.counts[CLS.HEALTHY]; b += n; }
      else if (key === 'pct_stress') { a += r.counts[CLS.WATER_STRESS] + r.counts[CLS.NUTRIENT] + r.counts[CLS.DISEASE]; b += n; }
      else { a += r.ndviSum; b += r.ndviN; }
    } else if (method === 'anomaly') {
      const scored = r.counts[ANOM.TYPICAL] + r.counts[ANOM.WATCH] + r.counts[ANOM.HIGH];
      b += scored;
      a += key === 'pct_high' ? r.counts[ANOM.HIGH] : r.counts[ANOM.WATCH] + r.counts[ANOM.HIGH];
    } else if (r.n) { a += r.mean * r.n; b += r.n; }
  }
  if (!b) return NaN;
  const v = a / b;
  return (method === 'index' || key === 'ndvi') ? v : v * 100;
}

export function useCropEngine(s) {
  const [pack, setPack] = useState(null);
  const [error, setError] = useState(null);
  const [raw, setRaw] = useState(null);
  const [loadingDate, setLoadingDate] = useState(false);
  const [cached, setCached] = useState(0);
  const rawCache = useRef(new Map());

  // ---- 1. pack ------------------------------------------------------------
  useEffect(() => {
    let dead = false;
    loadPack(DATA_BASE).then((p) => { if (!dead) setPack(p); }).catch((e) => !dead && setError(e.message));
    return () => { dead = true; };
  }, []);

  const manifest = pack?.manifest;
  const grid = manifest?.grid;
  const N = grid ? grid.width * grid.height : 0;
  const dates = manifest?.dates || [];

  // ---- 2. current date ------------------------------------------------------
  useEffect(() => {
    if (!pack || !dates.length) return;
    const meta = dates[Math.min(s.dateIdx, dates.length - 1)];
    const hit = rawCache.current.get(meta.date);
    if (hit) { setRaw(hit); return; }
    let dead = false;
    setLoadingDate(true);
    loadDate(DATA_BASE, manifest, meta.date).then((r) => {
      const e = { date: meta.date, ...r };
      rawCache.current.set(meta.date, e);
      setCached(rawCache.current.size);
      if (!dead) { setRaw(e); setLoadingDate(false); }
    }).catch((err) => { if (!dead) { setError(err.message); setLoadingDate(false); } });
    return () => { dead = true; };
  }, [pack, s.dateIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- 3. prefetch every other date in the background ----------------------
  useEffect(() => {
    if (!pack) return;
    let dead = false;
    (async () => {
      const order = dates.map((d, i) => ({ d, k: Math.abs(i - s.dateIdx) })).sort((a, b) => a.k - b.k).map((x) => x.d.date);
      for (let w = 0; w < order.length && !dead; w += 2) {
        await Promise.all(order.slice(w, w + 2).map(async (date) => {
          if (rawCache.current.has(date)) return;
          try {
            const r = await loadDate(DATA_BASE, manifest, date);
            rawCache.current.set(date, { date, ...r });
          } catch { /* a missing date just stays out of the trend */ }
        }));
        setCached(rawCache.current.size);
      }
    })();
    return () => { dead = true; };
  }, [pack]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- 4. polygons -----------------------------------------------------------
  const polyset = useMemo(() => {
    if (!pack) return { list: [], ids: null, version: 'none' };
    if (s.polySource === 'fields') {
      const list = pack.parcels.features.map((f) => ({
        id: f.properties.id,
        name: `Field ${f.properties.id}`,
        crop: f.properties.crop || '',
        cropNow: f.properties.crop_now || '', cropPrev: f.properties.crop_previous || '',
        area_m2: f.properties.area_m2, rings: f.geometry.coordinates,
      }));
      // polygon-id raster is derived in the browser (feature k -> id k+1), ~1 ms
      const { ids } = rasterize(list.map((q) => ({ rings: q.rings })), grid);
      return { list, ids, version: 'fields' };
    }
    const polys = s.customPolys;
    const { ids, counts } = rasterize(polys.map((p) => ({ rings: p.rings })), grid);
    const list = polys.map((p, k) => ({
      id: k + 1,
      name: p.props?.name || (p.props?.parcel_id ? `Parcel ${p.props.parcel_id}` : `Polygon ${k + 1}`),
      crop: p.props?.crop || '', cropNow: '', cropPrev: '',
      area_m2: ringAreaM2(p.rings[0]), rings: p.rings, nPixels: counts[k],
    }));
    return { list, ids, version: `custom:${s.customVersion}` };
  }, [pack, s.polySource, s.customPolys, s.customVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const nIds = polyset.list.length;
  const ctx = useMemo(() => ({ ids: polyset.ids, nIds, N }), [polyset, nIds, N]);

  const selMask = useMemo(() => {
    const m = new Uint8Array(nIds + 2);
    for (const id of s.selected) if (id <= nIds) m[id] = 1;
    return m;
  }, [s.selected, nIds]);

  // ---- 5. indices for the current date ---------------------------------------
  const ind = useMemo(() => (raw && pack ? computeIndices(raw.raw, raw.lst, manifest.lst, N) : null), [raw, pack]); // eslint-disable-line react-hooks/exhaustive-deps
  const dateMeta = useMemo(() => (raw ? dates.find((d) => d.date === raw.date) : null), [raw, dates]);
  const season = s.seasonMode === 'auto' ? (raw ? seasonForDate(raw.date) : 'summer') : s.seasonMode;
  const interior = useMemo(
    () => (polyset.ids && grid ? interiorMask(polyset.ids, grid.width, grid.height, s.anomOpts.edgePx) : null),
    [polyset, grid, s.anomOpts.edgePx]);

  // ---- 6. analysis for the current date --------------------------------------
  const analysis = useMemo(() => {
    if (!ind || !polyset.ids) return null;
    const t0 = performance.now();
    const out = analyze({
      ind, method: s.method, indexName: s.indexName, soilClass: s.soilClass, season, anomOpts: s.anomOpts,
      ctx, interior, lstGap: dateMeta?.lst_gap_days ?? null,
    });
    out.ms = performance.now() - t0;
    return out;
  }, [ind, ctx, interior, s.method, s.indexName, s.soilClass, season, s.anomOpts, dateMeta]);

  // ---- 7. display range for index maps ---------------------------------------
  const indexRange = useMemo(() => {
    if (s.method !== 'index' || !ind) return null;
    const info = INDEX_INFO[s.indexName];
    if (s.indexFixed) return info.range;
    const arr = ind.idx[s.indexName], vals = [];
    for (let i = 0; i < N; i++) {
      const id = ctx.ids[i];
      const inScope = s.scope === 'scene' ? ind.valid[i] : id && (s.scope === 'polygons' || selMask[id]);
      if (inScope && arr[i] === arr[i]) vals.push(arr[i]);
    }
    if (vals.length < 5) return info.range;
    const sorted = Float64Array.from(vals).sort();
    const lo = percentile(sorted, 0.02), hi = percentile(sorted, 0.98);
    return hi - lo < 1e-6 ? [lo - 0.01, hi + 0.01] : [lo, hi];
  }, [s.method, s.indexName, s.indexFixed, s.scope, ind, ctx, selMask, N]);

  // ---- 8. paint -------------------------------------------------------------------
  const paint = useCallback((buf) => {
    if (!ind || !analysis || !ctx.ids) { buf.fill(0); return 0; }
    const ids = ctx.ids;
    const scope = s.scope;
    const vis = s.visible;                          // Set of codes for the current method
    const info = INDEX_INFO[s.indexName];
    let lut = null, lo = 0, inv = 0, arr = null;
    if (s.method === 'index') {
      lut = info.reverse ? LUT_REV : LUT_FWD;
      [lo] = indexRange;
      inv = 255 / ((indexRange[1] - indexRange[0]) || 1);
      arr = ind.idx[s.indexName];
    }
    const cls = analysis.clsRes?.cls, st = analysis.anomRes?.status;
    const bareUnhealthy = s.bareAsUnhealthy;
    let shown = 0;
    for (let i = 0; i < N; i++) {
      const id = ids[i];
      let a = 0;                                    // 0 hidden, 1 full, 2 dimmed
      if (scope === 'scene') a = id && !selMask[id] ? 2 : 1;
      else if (id) a = selMask[id] ? 1 : scope === 'polygons' ? 2 : 0;
      if (!a) { buf[i] = 0; continue; }

      let c = 0;
      if (s.method === 'health') {
        const k = cls[i];
        if (k !== CLS.EMPTY && vis.has(k)) c = CLASS_RGBA[k];
      } else if (s.method === 'binary') {
        const k = cls[i];
        if (k !== CLS.EMPTY) {
          const grp = k === CLS.HEALTHY ? 'healthy'
            : (k === CLS.WATER_STRESS || k === CLS.NUTRIENT || k === CLS.DISEASE || (bareUnhealthy && k === CLS.BARE)) ? 'unhealthy' : 'other';
          if (vis.has(grp)) c = BIN_RGBA[grp];
        }
      } else if (s.method === 'anomaly') {
        const k = st[i];
        if (k !== ANOM.NONE && vis.has(k)) c = ANOM_RGBA[k];
      } else {
        const v = arr[i];
        if (v === v) c = lut[Math.max(0, Math.min(255, ((v - lo) * inv) | 0))];
      }
      if (!c) { buf[i] = 0; continue; }
      buf[i] = a === 2 ? dim(c) : c;
      if (a === 1) shown++;
    }
    return shown;
  }, [ind, analysis, ctx, selMask, s.scope, s.visible, s.method, s.indexName, s.bareAsUnhealthy, indexRange, N]);

  // ---- 9. legend counts + table rows (selected polygons) ------------------------
  const legendCounts = useMemo(() => {
    if (!analysis) return null;
    const rows = analysis.rows;
    if (s.method === 'health' || s.method === 'binary') {
      const c = new Array(CLASS_INFO.length).fill(0);
      for (let id = 1; id < rows.length; id++) if (selMask[id]) for (let k = 0; k < c.length; k++) c[k] += rows[id].counts[k];
      return c;
    }
    if (s.method === 'anomaly') {
      const c = new Array(6).fill(0);
      for (let id = 1; id < rows.length; id++) if (selMask[id]) for (let k = 0; k < 6; k++) c[k] += rows[id].counts[k];
      return c;
    }
    return null;
  }, [analysis, selMask, s.method]);

  // ---- 10. trend over all dates (per-polygon rows cached, aggregation is instant) ----
  const [seriesState, setSeriesState] = useState({ key: '', perDate: [], done: false });
  const seriesKey = [s.method, s.indexName, s.soilClass, s.seasonMode, polyset.version, JSON.stringify(s.anomOpts)].join('|');
  useEffect(() => {
    if (!pack || !polyset.ids) return;
    let dead = false;
    setSeriesState({ key: seriesKey, perDate: [], done: false });
    (async () => {
      const out = [];
      const pending = dates.map((d) => d.date);
      // wait for the prefetch to deliver each date, then analyse it (yielding to the UI in between)
      for (let guard = 0; guard < 4000 && !dead && pending.length; guard++) {
        const date = pending[0];
        const e = rawCache.current.get(date);
        if (!e) { await new Promise((r) => setTimeout(r, 120)); continue; }
        pending.shift();
        const meta = dates.find((d) => d.date === date);
        const indD = computeIndices(e.raw, e.lst, manifest.lst, N);
        const { rows } = analyze({
          ind: indD, method: s.method, indexName: s.indexName, soilClass: s.soilClass,
          season: s.seasonMode === 'auto' ? seasonForDate(date) : s.seasonMode,
          anomOpts: s.anomOpts, ctx, interior, lstGap: meta?.lst_gap_days ?? null,
        });
        out.push({ date, rows });
        if (out.length % 3 === 0 || !pending.length) setSeriesState({ key: seriesKey, perDate: [...out], done: !pending.length });
        await tick();
      }
    })();
    return () => { dead = true; };
  }, [pack, polyset, seriesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const series = useMemo(() => {
    if (seriesState.key !== seriesKey) return { points: {}, done: false };
    const points = {};
    for (const m of seriesMetrics(s.method)) {
      points[m.key] = seriesState.perDate.map((p) => ({ date: p.date, v: metricFromRows(s.method, p.rows, selMask, m.key) }));
    }
    return { points, done: seriesState.done };
  }, [seriesState, seriesKey, selMask, s.method]);

  // ---- 11. hover ------------------------------------------------------------------
  const describePixel = useCallback((i) => {
    if (!ind || i < 0) return null;
    const id = ctx.ids[i];
    const poly = id ? polyset.list[id - 1] : null;
    const f = (a) => (a[i] === a[i] ? a[i] : null);
    const o = {
      poly: poly ? { id, name: poly.name, crop: poly.crop } : null,
      valid: !!ind.valid[i],
      ndvi: f(ind.idx.NDVI), ndre: f(ind.idx.NDRE), ndmi: f(ind.idx.NDMI), lst: f(ind.idx.LST),
    };
    if (analysis?.clsRes) {
      const k = analysis.clsRes.cls[i];
      o.cls = CLASS_INFO[k].label;
      o.conf = analysis.clsRes.conf[i] / 255;
      const p = analysis.clsRes.probs;
      o.probs = ['bare_soil', 'water_stress', 'nutrient', 'disease', 'healthy'].map((n, j) => [n, p[i * 6 + j] / 255]);
    }
    if (analysis?.anomRes) {
      const k = analysis.anomRes.status[i];
      o.anom = ANOM_INFO[k].label;
      o.score = f(analysis.anomRes.score);
      const e = analysis.anomRes.evid;
      o.evid = { vigor: f(e.vigor), moisture: f(e.moisture), heat: f(e.heat) };
    }
    if (s.method === 'index') o.value = f(ind.idx[s.indexName]);
    return o;
  }, [ind, analysis, ctx, polyset, s.method, s.indexName]);

  // table-friendly polygon list (with area in feddan)
  const polyList = useMemo(() => polyset.list.map((p) => ({ ...p, feddan: p.area_m2 / FEDDAN_M2 })), [polyset]);

  return {
    error, pack, manifest, grid, dates, N,
    raw, dateMeta, season, loadingDate, cached,
    polys: polyList, ids: polyset.ids, nIds, selMask,
    ind, analysis, indexRange, paint, legendCounts, series, describePixel,
    computeMs: analysis?.ms ?? 0,
  };
}
