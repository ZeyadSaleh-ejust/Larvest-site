"use client";
import { useMemo, useRef } from 'react';
import { INDEX_INFO } from '../_engine/indices.mjs';
import { SOIL_THRESHOLDS } from '../_engine/classifier.mjs';
import { DEFAULT_ANOMALY } from '../_engine/anomaly.mjs';

const card = 'rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800';
const h3 = 'mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100';
const lbl = 'block text-xs font-medium text-gray-600 dark:text-gray-300';
const sel = 'w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';
const btn = 'rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700';

function Slider({ label, value, min, max, step, onChange, fmt = (v) => v }) {
  return (
    <label className="block">
      <span className={`${lbl} flex justify-between`}><span>{label}</span><span className="tabular-nums text-gray-900 dark:text-gray-100">{fmt(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-emerald-600" />
    </label>
  );
}

export default function Controls(p) {
  const { t, dates, dateIdx, setDateIdx, dateMeta, playing, setPlaying, method, setMethod, indexName, setIndexName,
    indexFixed, setIndexFixed, soilClass, setSoilClass, seasonMode, setSeasonMode, season, anomOpts, setAnomOpts,
    bareAsUnhealthy, setBareAsUnhealthy, polySource, setPolySource, polys, selected, setSelected, customCount,
    onUpload, startDraw, drawing, clearCustom, scope, setScope, opacity, setOpacity, basemap, setBasemap,
    showOutlines, setShowOutlines, showLabels, setShowLabels, selectProblem, canSelectProblem, rows } = p;
  const fileRef = useRef(null);

  const crops = useMemo(() => {
    const m = new Map();
    for (const q of polys) if (q.crop) m.set(q.crop, [...(m.get(q.crop) || []), q.id]);
    return [...m.entries()];
  }, [polys]);

  const toggleCrop = (ids) => {
    const all = ids.every((i) => selected.has(i));
    const next = new Set(selected);
    ids.forEach((i) => (all ? next.delete(i) : next.add(i)));
    setSelected(next);
  };
  const toggleOne = (id) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const methods = [
    ['health', t('method.health.name', 'Health classes'), t('method.health.desc', 'Healthy, water stress, nutrient, disease, bare soil, water')],
    ['binary', t('method.binary.name', 'Healthy or not'), t('method.binary.desc', 'One simple verdict per pixel')],
    ['anomaly', t('method.anomaly.name', 'Within-field anomaly'), t('method.anomaly.desc', 'Each pixel vs. the rest of its own field, same day')],
    ['index', t('method.index.name', 'Spectral index'), t('method.index.desc', 'Any single index as a heat-map')],
  ];

  const groups = useMemo(() => {
    const g = {};
    for (const [k, v] of Object.entries(INDEX_INFO)) (g[v.group] ||= []).push(k);
    return g;
  }, []);

  const meta = dateMeta;

  return (
    <div className="space-y-4">
      {/* ---------------- WHEN ---------------- */}
      <section className={card}>
        <h3 className={h3}>1 · {t('when', 'Satellite date')}</h3>
        <div className="flex items-center gap-2">
          <button className={btn} onClick={() => setDateIdx(Math.max(0, dateIdx - 1))} disabled={dateIdx <= 0} aria-label="previous date">◀</button>
          <select className={sel} value={dateIdx} onChange={(e) => setDateIdx(Number(e.target.value))} aria-label="date">
            {dates.map((d, i) => <option key={d.date} value={i}>{d.date}</option>)}
          </select>
          <button className={btn} onClick={() => setDateIdx(Math.min(dates.length - 1, dateIdx + 1))} disabled={dateIdx >= dates.length - 1} aria-label="next date">▶</button>
          <button className={`${btn} ${playing ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`} onClick={() => setPlaying(!playing)}>{playing ? '■' : '▶▶'}</button>
        </div>
        <input type="range" min={0} max={Math.max(0, dates.length - 1)} value={dateIdx} onChange={(e) => setDateIdx(Number(e.target.value))} className="mt-3 w-full accent-emerald-600" aria-label="date slider" />
        {meta && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Sentinel-2 · {(meta.s2_valid_fraction * 100).toFixed(0)}% {t('clearPixels', 'clear pixels')}<br />
            {meta.lst_gap_days != null
              ? <>Landsat LST {meta.lst_date} ({meta.lst_gap_days} {t('dayGap', 'day gap')})</>
              : t('noLst', 'No Landsat thermal scene within ±8 days: heat evidence disabled')}
          </p>
        )}
      </section>

      {/* ---------------- WHAT ---------------- */}
      <section className={card}>
        <h3 className={h3}>2 · {t('what', 'What to show')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {methods.map(([k, name, desc]) => (
            <button key={k} onClick={() => setMethod(k)} aria-pressed={method === k}
              className={`rounded-lg border p-2 text-left transition ${method === k
                ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 dark:bg-emerald-900/30'
                : 'border-gray-200 hover:border-emerald-400 dark:border-gray-600'}`}>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-gray-500 dark:text-gray-400">{desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {(method === 'health' || method === 'binary') && (
            <>
              <label className="block"><span className={lbl}>{t('soil', 'Soil type (sets bare-soil brightness)')}</span>
                <select className={sel} value={soilClass} onChange={(e) => setSoilClass(e.target.value)}>
                  {Object.keys(SOIL_THRESHOLDS).map((k) => <option key={k} value={k}>{t(`soilOpt.${k}`, k.replace(/_/g, ' '))}</option>)}
                </select></label>
              <label className="block"><span className={lbl}>{t('seasonLabel', 'Season (sets heat thresholds)')}</span>
                <select className={sel} value={seasonMode} onChange={(e) => setSeasonMode(e.target.value)}>
                  <option value="auto">{t('seasonAuto', 'Automatic')} ({season})</option>
                  <option value="summer">{t('summer', 'Summer (34 / 42 °C)')}</option>
                  <option value="winter">{t('winter', 'Winter (30 / 38 °C)')}</option>
                </select></label>
              {method === 'binary' && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input type="checkbox" checked={bareAsUnhealthy} onChange={(e) => setBareAsUnhealthy(e.target.checked)} className="accent-emerald-600" />
                  {t('bareUnhealthy', 'Count bare soil as unhealthy')}
                </label>
              )}
            </>
          )}

          {method === 'index' && (
            <>
              <label className="block"><span className={lbl}>{t('indexLabel', 'Index')}</span>
                <select className={sel} value={indexName} onChange={(e) => setIndexName(e.target.value)}>
                  {Object.entries(groups).map(([g, names]) => (
                    <optgroup key={g} label={t(`group.${g}`, g)}>
                      {names.map((k) => <option key={k} value={k}>{INDEX_INFO[k].label} - {INDEX_INFO[k].desc}</option>)}
                    </optgroup>
                  ))}
                </select></label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" checked={indexFixed} onChange={(e) => setIndexFixed(e.target.checked)} className="accent-emerald-600" />
                {t('fixedScale', 'Fixed colour scale (otherwise stretched to the selection)')}
              </label>
            </>
          )}

          {method === 'anomaly' && (
            <details className="group" open>
              <summary className="cursor-pointer text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t('sensitivity', 'Sensitivity')}</summary>
              <div className="mt-2 space-y-2">
                <Slider label={t('watchT', 'Watch threshold')} value={anomOpts.watch} min={0.2} max={0.8} step={0.05} onChange={(v) => setAnomOpts({ ...anomOpts, watch: v })} fmt={(v) => v.toFixed(2)} />
                <Slider label={t('highT', 'High threshold')} value={anomOpts.high} min={0.4} max={0.95} step={0.05} onChange={(v) => setAnomOpts({ ...anomOpts, high: v })} fmt={(v) => v.toFixed(2)} />
                <Slider label={t('zStart', 'Deviation where evidence starts (σ)')} value={anomOpts.zStart} min={0.5} max={2.5} step={0.25} onChange={(v) => setAnomOpts({ ...anomOpts, zStart: v, zFull: Math.max(v + 0.5, anomOpts.zFull) })} fmt={(v) => v.toFixed(2)} />
                <Slider label={t('zFull', 'Deviation for full evidence (σ)')} value={anomOpts.zFull} min={1.5} max={5} step={0.25} onChange={(v) => setAnomOpts({ ...anomOpts, zFull: Math.max(v, anomOpts.zStart + 0.5) })} fmt={(v) => v.toFixed(2)} />
                <label className="block"><span className={lbl}>{t('edge', 'Ignore field-edge pixels')}</span>
                  <select className={sel} value={anomOpts.edgePx} onChange={(e) => setAnomOpts({ ...anomOpts, edgePx: Number(e.target.value) })}>
                    <option value={0}>{t('edge0', 'None (include mixed edge pixels)')}</option>
                    <option value={1}>{t('edge1', '1 pixel (10 m)')}</option>
                    <option value={2}>{t('edge2', '2 pixels (20 m)')}</option>
                  </select></label>
                <Slider label={t('minPx', 'Minimum pixels to score a field')} value={anomOpts.minPixels} min={10} max={120} step={5} onChange={(v) => setAnomOpts({ ...anomOpts, minPixels: v })} />
                <button className={btn} onClick={() => setAnomOpts({ ...DEFAULT_ANOMALY })}>{t('reset', 'Reset to defaults')}</button>
              </div>
            </details>
          )}
        </div>
      </section>

      {/* ---------------- WHERE ---------------- */}
      <section className={card}>
        <h3 className={h3}>3 · {t('where', 'Polygons')}</h3>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button onClick={() => setPolySource('fields')} aria-pressed={polySource === 'fields'}
            className={`rounded-md border px-2 py-1.5 text-xs font-medium ${polySource === 'fields' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'border-gray-300 dark:border-gray-600 dark:text-gray-200'}`}>
            {t('labelled', 'Labelled fields')}
          </button>
          <button onClick={() => customCount && setPolySource('custom')} disabled={!customCount} aria-pressed={polySource === 'custom'}
            className={`rounded-md border px-2 py-1.5 text-xs font-medium disabled:opacity-40 ${polySource === 'custom' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'border-gray-300 dark:border-gray-600 dark:text-gray-200'}`}>
            {t('mine', 'My polygons')} ({customCount})
          </button>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <button className={btn} onClick={startDraw}>{drawing ? t('drawing', 'Drawing…') : '✏️ ' + t('draw', 'Draw')}</button>
          <button className={btn} onClick={() => fileRef.current?.click()}>⬆ {t('upload', 'Upload KML / GeoJSON')}</button>
          {customCount > 0 && <button className={btn} onClick={clearCustom}>{t('clearMine', 'Clear mine')}</button>}
          <input ref={fileRef} type="file" accept=".kml,.geojson,.json" className="hidden" onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ''; }} />
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5">
          <button className={btn} onClick={() => setSelected(new Set(polys.map((q) => q.id)))}>{t('all', 'All')}</button>
          <button className={btn} onClick={() => setSelected(new Set())}>{t('none', 'None')}</button>
          <button className={btn} onClick={() => setSelected(new Set(polys.filter((q) => !selected.has(q.id)).map((q) => q.id)))}>{t('invert', 'Invert')}</button>
          <button className={btn} onClick={selectProblem} disabled={!canSelectProblem} title={t('problemHint', 'Fields with less than half of their pixels healthy')}>⚠ {t('problem', 'Problem fields')}</button>
        </div>
        {crops.length > 1 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {crops.map(([crop, ids]) => {
              const on = ids.every((i) => selected.has(i));
              return (
                <button key={crop} onClick={() => toggleCrop(ids)} aria-pressed={on}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${on ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'}`}>
                  {crop} <span className="opacity-70">{ids.length}</span>
                </button>
              );
            })}
          </div>
        )}
        <ul className="max-h-52 overflow-y-auto rounded-md border border-gray-200 text-sm dark:border-gray-700">
          {polys.map((q) => (
            <li key={q.id}>
              <label className="flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleOne(q.id)} className="accent-emerald-600" />
                <span className="w-6 text-xs tabular-nums text-gray-500">{q.id}</span>
                <span className="flex-1 truncate text-gray-900 dark:text-gray-100">{q.name}{q.crop ? ` · ${q.crop}` : ''}</span>
                <span className="text-xs tabular-nums text-gray-500">{q.feddan.toFixed(1)} fd</span>
              </label>
            </li>
          ))}
          {!polys.length && <li className="px-2 py-3 text-xs text-gray-500">{t('noPolys', 'No polygons yet: draw one or upload a KML / GeoJSON.')}</li>}
        </ul>
        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{t('uploadNote', 'Uploaded files stay in your browser. Owner names in KML popups are ignored.')}</p>
      </section>

      {/* ---------------- DISPLAY ---------------- */}
      <section className={card}>
        <h3 className={h3}>4 · {t('display', 'Display')}</h3>
        <div className="space-y-3">
          <label className="block"><span className={lbl}>{t('scope', 'Show pixels')}</span>
            <select className={sel} value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="selected">{t('scopeSelected', 'Selected polygons only')}</option>
              <option value="polygons">{t('scopePolygons', 'All polygons (others dimmed)')}</option>
              <option value="scene" disabled={method === 'anomaly'}>{t('scopeScene', 'Whole scene (incl. outside polygons)')}</option>
            </select></label>
          <Slider label={t('opacity', 'Opacity')} value={opacity} min={0.2} max={1} step={0.05} onChange={setOpacity} fmt={(v) => `${Math.round(v * 100)}%`} />
          <label className="block"><span className={lbl}>{t('basemap', 'Basemap')}</span>
            <select className={sel} value={basemap} onChange={(e) => setBasemap(e.target.value)}>
              <option value="satellite">{t('satellite', 'Satellite')}</option>
              <option value="streets">{t('streets', 'Streets')}</option>
            </select></label>
          <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-200">
            <label className="flex items-center gap-2"><input type="checkbox" checked={showOutlines} onChange={(e) => setShowOutlines(e.target.checked)} className="accent-emerald-600" />{t('outlines', 'Outlines')}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="accent-emerald-600" />{t('numbers', 'Numbers')}</label>
          </div>
        </div>
      </section>
    </div>
  );
}
