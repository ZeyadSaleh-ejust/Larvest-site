"use client";
import { useMemo, useState } from 'react';
import TrendChart from './TrendChart';
import { seriesMetrics } from './useCropEngine';
import { CLASS_INFO, CLS } from '../_engine/classifier.mjs';
import { ANOM, ANOM_INFO } from '../_engine/anomaly.mjs';
import { INDEX_INFO } from '../_engine/indices.mjs';
import { toCSV } from '../_engine/stats.mjs';

const card = 'rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800';
const pct = (a, b) => (b > 0 ? (100 * a) / b : NaN);
const f1 = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');

function Stat({ label, value, sub, tone }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`mt-0.5 text-2xl font-bold tabular-nums ${tone || 'text-gray-900 dark:text-gray-100'}`}>{value}</div>
      {sub && <div className="text-[11px] text-gray-500 dark:text-gray-400">{sub}</div>}
    </div>
  );
}

export default function Results({ t, method, indexName, polys, selected, analysis, legendCounts, series, dates, currentDate, onPickDate, onFocus, computeMs, indexRange, metricKey, setMetricKey, pixelAreaM2, cachedCount }) {
  const [sort, setSort] = useState({ key: 'default', dir: 1 });

  const selPolys = useMemo(() => polys.filter((p) => selected.has(p.id)), [polys, selected]);
  const areaFd = selPolys.reduce((a, p) => a + p.feddan, 0);

  // ---- table model -------------------------------------------------------------
  const model = useMemo(() => {
    if (!analysis) return { cols: [], rows: [] };
    const rowsRaw = analysis.rows;
    const base = [
      { key: 'id', label: '#', get: (p) => p.id, align: 'left' },
      { key: 'name', label: t('col.field', 'Field'), get: (p) => p.name, align: 'left', focus: true },
      { key: 'crop', label: t('col.crop', 'Crop'), get: (p) => p.crop || '—', align: 'left' },
      { key: 'area', label: t('col.area', 'Area (fd)'), get: (p) => p.feddan, fmt: (v) => v.toFixed(2) },
    ];
    if (method === 'health' || method === 'binary') {
      const share = (id, k) => pct(rowsRaw[id].counts[k], rowsRaw[id].n);
      const cols = [...base,
        { key: 'dom', label: t('col.dominant', 'Dominant'), get: (p) => {
          const c = rowsRaw[p.id].counts; let best = -1, bi = 0;
          for (let k = 1; k < c.length; k++) if (c[k] > best) { best = c[k]; bi = k; }
          return best > 0 ? CLASS_INFO[bi].label.split(' / ')[0] : '—';
        }, align: 'left' },
        { key: 'healthy', label: '% ' + t('col.healthy', 'healthy'), get: (p) => share(p.id, CLS.HEALTHY), fmt: f1, heat: 'good' },
        { key: 'ws', label: '% ' + t('col.water', 'water stress'), get: (p) => share(p.id, CLS.WATER_STRESS), fmt: f1 },
        { key: 'nu', label: '% ' + t('col.nutrient', 'nutrient'), get: (p) => share(p.id, CLS.NUTRIENT), fmt: f1 },
        { key: 'di', label: '% ' + t('col.disease', 'disease'), get: (p) => share(p.id, CLS.DISEASE), fmt: f1 },
        { key: 'ba', label: '% ' + t('col.bare', 'bare'), get: (p) => share(p.id, CLS.BARE), fmt: f1 },
        { key: 'ndvi', label: 'NDVI', get: (p) => (rowsRaw[p.id].ndviN ? rowsRaw[p.id].ndviSum / rowsRaw[p.id].ndviN : NaN), fmt: (v) => f1(v, 2) },
      ];
      return { cols, rows: selPolys, defaultSort: { key: 'healthy', dir: 1 } };
    }
    if (method === 'anomaly') {
      const sc = (id) => { const c = rowsRaw[id].counts; return c[ANOM.TYPICAL] + c[ANOM.WATCH] + c[ANOM.HIGH]; };
      const cols = [...base,
        { key: 'state', label: t('col.state', 'State'), get: (p) => (analysis.anomRes.fields[p.id]?.state || '—').replace(/_/g, ' '), align: 'left' },
        { key: 'typ', label: '% ' + t('col.typical', 'typical'), get: (p) => pct(rowsRaw[p.id].counts[ANOM.TYPICAL], sc(p.id)), fmt: f1 },
        { key: 'wa', label: '% ' + t('col.watch', 'watch'), get: (p) => pct(rowsRaw[p.id].counts[ANOM.WATCH], sc(p.id)), fmt: f1 },
        { key: 'hi', label: '% ' + t('col.high', 'high'), get: (p) => pct(rowsRaw[p.id].counts[ANOM.HIGH], sc(p.id)), fmt: f1 },
        { key: 'score', label: t('col.score', 'Mean score'), get: (p) => (rowsRaw[p.id].scoreN ? rowsRaw[p.id].scoreSum / rowsRaw[p.id].scoreN : NaN), fmt: (v) => f1(v, 2) },
      ];
      return { cols, rows: selPolys, defaultSort: { key: 'hi', dir: -1 } };
    }
    const cols = [...base,
      { key: 'mean', label: t('col.mean', 'Mean'), get: (p) => rowsRaw[p.id].mean, fmt: (v) => f1(v, 3) },
      { key: 'p10', label: 'P10', get: (p) => rowsRaw[p.id].p10, fmt: (v) => f1(v, 3) },
      { key: 'p50', label: t('col.median', 'Median'), get: (p) => rowsRaw[p.id].p50, fmt: (v) => f1(v, 3) },
      { key: 'p90', label: 'P90', get: (p) => rowsRaw[p.id].p90, fmt: (v) => f1(v, 3) },
    ];
    return { cols, rows: selPolys, defaultSort: { key: 'mean', dir: 1 } };
  }, [analysis, method, selPolys, t]);

  const sorted = useMemo(() => {
    const ds = model.defaultSort || { key: 'id', dir: 1 };
    const s = sort.key === 'default' ? ds : sort;
    const col = model.cols.find((c) => c.key === s.key) || model.cols[0];
    if (!col) return [];
    return [...model.rows].sort((a, b) => {
      const va = col.get(a), vb = col.get(b);
      if (typeof va === 'string' || typeof vb === 'string') return String(va).localeCompare(String(vb)) * s.dir;
      const na = Number.isFinite(va), nb = Number.isFinite(vb);
      if (!na && !nb) return 0; if (!na) return 1; if (!nb) return -1;
      return (va - vb) * s.dir;
    });
  }, [model, sort]);

  const exportCsv = () => {
    const csv = toCSV(model.cols.map((c) => c.label), sorted.map((p) => model.cols.map((c) => { const v = c.get(p); return typeof v === 'number' && Number.isFinite(v) ? +v.toFixed(4) : (Number.isFinite(v) || typeof v === 'string' ? v : ''); })));
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `crop-health_${method}_${currentDate}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ---- headline numbers --------------------------------------------------------------
  const head = useMemo(() => {
    if (!analysis) return null;
    if ((method === 'health' || method === 'binary') && legendCounts) {
      const valid = legendCounts.reduce((a, v, k) => a + (k === CLS.EMPTY ? 0 : v), 0);
      const stress = legendCounts[CLS.WATER_STRESS] + legendCounts[CLS.NUTRIENT] + legendCounts[CLS.DISEASE];
      let ns = 0, nn = 0;
      for (const p of selPolys) { const r = analysis.rows[p.id]; ns += r.ndviSum; nn += r.ndviN; }
      return [
        { label: t('healthyPct', 'Healthy'), value: f1(pct(legendCounts[CLS.HEALTHY], valid)) + '%', tone: 'text-emerald-600 dark:text-emerald-400', sub: `${(legendCounts[CLS.HEALTHY] * 0.01 * (pixelAreaM2 / 100)).toFixed(1)} ha` },
        { label: t('stressedPct', 'Stressed crop'), value: f1(pct(stress, valid)) + '%', tone: 'text-red-600 dark:text-red-400', sub: t('stressedSub', 'water + nutrient + disease') },
        { label: t('bareWater', 'Bare soil / water'), value: f1(pct(legendCounts[CLS.BARE] + legendCounts[CLS.OPEN_WATER], valid)) + '%' },
        { label: t('meanNdvi', 'Mean NDVI'), value: nn ? (ns / nn).toFixed(2) : '—' },
      ];
    }
    if (method === 'anomaly' && legendCounts) {
      const scored = legendCounts[ANOM.TYPICAL] + legendCounts[ANOM.WATCH] + legendCounts[ANOM.HIGH];
      const notScored = legendCounts[ANOM.LOW_COVER] + legendCounts[ANOM.NOT_SCORED];
      return [
        { label: t('typicalPct', 'Typical'), value: f1(pct(legendCounts[ANOM.TYPICAL], scored)) + '%', tone: 'text-emerald-600 dark:text-emerald-400', sub: t('ofScored', 'of scored pixels') },
        { label: t('watchPct', 'Watch'), value: f1(pct(legendCounts[ANOM.WATCH], scored)) + '%', tone: 'text-amber-600 dark:text-amber-400' },
        { label: t('highPct', 'High anomaly'), value: f1(pct(legendCounts[ANOM.HIGH], scored)) + '%', tone: 'text-red-600 dark:text-red-400' },
        { label: t('notScored', 'Not scored'), value: String(notScored), sub: t('notScoredSub', 'pixels (low cover / small field)') },
      ];
    }
    if (method === 'index') {
      let a = 0, b = 0;
      for (const p of selPolys) { const r = analysis.rows[p.id]; if (r.n) { a += r.mean * r.n; b += r.n; } }
      return [
        { label: `${t('mean', 'Mean')} ${INDEX_INFO[indexName].label}`, value: b ? (a / b).toFixed(3) : '—', sub: INDEX_INFO[indexName].desc },
        { label: t('displayRange', 'Colour range'), value: indexRange ? `${indexRange[0].toFixed(2)} → ${indexRange[1].toFixed(2)}` : '—' },
      ];
    }
    return null;
  }, [analysis, method, legendCounts, selPolys, indexName, indexRange, t, pixelAreaM2]);

  const metrics = seriesMetrics(method);
  const mk = metrics.find((m) => m.key === metricKey) || metrics[0];
  const dist = (method === 'health' || method === 'binary') ? CLASS_INFO.map((c, k) => ({ ...c, v: legendCounts?.[k] || 0 })).filter((c, k) => k !== CLS.EMPTY)
    : method === 'anomaly' ? ANOM_INFO.map((c, k) => ({ ...c, v: legendCounts?.[k] || 0 })).filter((c, k) => k >= 1) : null;
  const distTotal = dist ? dist.reduce((a, c) => a + c.v, 0) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('selected', 'Selected')} value={String(selPolys.length)} sub={`${areaFd.toFixed(1)} feddan · ${(areaFd * 0.42).toFixed(1)} ha`} />
        {head?.map((h) => <Stat key={h.label} {...h} />)}
      </div>

      {dist && distTotal > 0 && (
        <div className={card}>
          <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{t('distribution', 'Pixel distribution (selected polygons)')}</div>
          <div className="flex h-5 w-full overflow-hidden rounded-md" role="img" aria-label="class distribution">
            {dist.map((c) => c.v > 0 && <div key={c.key} style={{ width: `${(100 * c.v) / distTotal}%`, background: c.color }} title={`${c.label}: ${((100 * c.v) / distTotal).toFixed(1)}%`} />)}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
            {dist.map((c) => c.v > 0 && (
              <span key={c.key} className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />{c.label} <b className="tabular-nums">{((100 * c.v) / distTotal).toFixed(1)}%</b></span>
            ))}
          </div>
        </div>
      )}

      <div className={card}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('trend', 'Trend over the season (selected polygons)')}</div>
          <div className="flex items-center gap-2">
            {metrics.length > 1 && (
              <select className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" value={mk.key} onChange={(e) => setMetricKey(e.target.value)}>
                {metrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            )}
            {!series.done && <span className="text-xs text-gray-500">{t('loadingHistory', 'loading history')} {Math.min(cachedCount, (Object.values(series.points)[0] || []).length)}/{dates.length}</span>}
          </div>
        </div>
        <TrendChart points={series.points[mk.key] || []} allDates={dates} current={currentDate} unit={mk.unit}
          digits={mk.unit === '%' ? 1 : 2} onPick={onPickDate} emptyText={t('trendEmpty', 'Select at least one polygon')} />
      </div>

      <div className={card}>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('perField', 'Per-field results')} <span className="font-normal text-gray-500">({sorted.length})</span></div>
          <button onClick={exportCsv} disabled={!sorted.length} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">⬇ CSV</button>
        </div>
        <div className="max-h-96 overflow-auto rounded-md border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
              <tr>
                {model.cols.map((c) => (
                  <th key={c.key} onClick={() => setSort({ key: c.key, dir: sort.key === c.key ? -sort.dir : 1 })}
                    className={`cursor-pointer whitespace-nowrap px-2 py-1.5 font-semibold text-gray-700 dark:text-gray-200 ${c.align === 'left' ? 'text-left' : 'text-right'}`}>
                    {c.label}{sort.key === c.key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:bg-gray-700/40">
                  {model.cols.map((c) => {
                    const v = c.get(p);
                    const txt = typeof v === 'number' ? (c.fmt ? c.fmt(v) : String(v)) : v;
                    return (
                      <td key={c.key} className={`whitespace-nowrap px-2 py-1 tabular-nums text-gray-800 dark:text-gray-100 ${c.align === 'left' ? 'text-left' : 'text-right'}`}>
                        {c.focus ? <button className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400" onClick={() => onFocus(p.id)}>{txt}</button> : txt}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!sorted.length && <tr><td className="px-2 py-4 text-center text-gray-500" colSpan={model.cols.length || 1}>{t('trendEmpty', 'Select at least one polygon')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
        {t('caveat', 'Rule-based screening from real Sentinel-2 and Landsat data. The class scores are relative weights, not calibrated probabilities, and have not been validated against field scouting. Use them to decide where to look first, not as a diagnosis.')}
        {' '}<span className="tabular-nums">· {t('computedIn', 'computed in your browser in')} {computeMs.toFixed(1)} ms</span>
      </p>
    </div>
  );
}
