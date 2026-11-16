"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Controls from './Controls';
import Results from './Results';
import { useCropEngine, seriesMetrics } from './useCropEngine';
import { CLASS_INFO, CLS, DEFAULT_CLASSIFIER } from '../_engine/classifier.mjs';
import { ANOM_INFO, DEFAULT_ANOMALY, ANOM } from '../_engine/anomaly.mjs';
import { INDEX_INFO } from '../_engine/indices.mjs';
import { parseVectorFile } from '../_engine/geo.mjs';
import { lutCss } from '../_engine/colors.mjs';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" /> });

const DEFAULT_VISIBLE = {
  health: () => new Set([1, 2, 3, 4, 5, 6]),
  binary: () => new Set(['healthy', 'unhealthy', 'other']),
  anomaly: () => new Set([1, 2, 3, 4, 5]),
  index: () => new Set(),
};
const BIN_GROUPS = [
  ['healthy', '#16a34a', 'Healthy'],
  ['unhealthy', '#ef4444', 'Unhealthy crop (water stress, nutrient, disease)'],
  ['other', '#a8a29e', 'Not a crop (bare soil, water)'],
];

export default function CropHealthApp() {
  const { t, i18n } = useTranslation('cropHealth');
  const isRTL = i18n.language === 'ar';

  // ---- user selections -----------------------------------------------------------------
  const [dateIdx, setDateIdx] = useState(-1);                  // -1 = latest, resolved once the pack loads
  const [playing, setPlaying] = useState(false);
  const [method, setMethod] = useState('health');
  const [indexName, setIndexName] = useState('NDVI');
  const [indexFixed, setIndexFixed] = useState(false);
  const [soilClass, setSoilClass] = useState(DEFAULT_CLASSIFIER.soilClass);
  const [seasonMode, setSeasonMode] = useState('auto');
  const [bareAsUnhealthy, setBareAsUnhealthy] = useState(false);
  const [anomOpts, setAnomOpts] = useState({ ...DEFAULT_ANOMALY });
  const [polySource, setPolySource] = useState('fields');
  const [customPolys, setCustomPolys] = useState([]);
  const [customVersion, setCustomVersion] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [scope, setScope] = useState('selected');
  const [visByMethod, setVisByMethod] = useState({ health: DEFAULT_VISIBLE.health(), binary: DEFAULT_VISIBLE.binary(), anomaly: DEFAULT_VISIBLE.anomaly() });
  const [opacity, setOpacity] = useState(0.85);
  const [basemap, setBasemap] = useState('satellite');
  const [showOutlines, setShowOutlines] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [focus, setFocus] = useState(null);
  const [metricKey, setMetricKey] = useState('');
  const [hover, setHover] = useState(null);

  const visible = visByMethod[method] || DEFAULT_VISIBLE.index();

  const eng = useCropEngine({
    dateIdx: Math.max(0, dateIdx), method, indexName, indexFixed, soilClass, seasonMode, anomOpts, polySource, customPolys, customVersion,
    selected, scope, visible, bareAsUnhealthy,
  });

  // resolve "latest" + restore ?m= ?d= ?i= once the pack is known
  const restored = useRef(false);
  useEffect(() => {
    if (!eng.dates.length || restored.current) return;
    restored.current = true;
    const q = new URLSearchParams(window.location.search);
    const di = eng.dates.findIndex((d) => d.date === q.get('d'));
    setDateIdx(di >= 0 ? di : eng.dates.length - 1);
    if (['health', 'binary', 'anomaly', 'index'].includes(q.get('m'))) setMethod(q.get('m'));
    if (INDEX_INFO[q.get('i')]) setIndexName(q.get('i'));
  }, [eng.dates]);

  useEffect(() => {
    if (!restored.current || dateIdx < 0 || !eng.dates[dateIdx]) return;
    const q = new URLSearchParams({ d: eng.dates[dateIdx].date, m: method, ...(method === 'index' ? { i: indexName } : {}) });
    window.history.replaceState(null, '', `${window.location.pathname}?${q}`);
  }, [dateIdx, method, indexName, eng.dates]);

  // whenever the polygon set changes, select everything in it
  useEffect(() => { setSelected(new Set(eng.polys.map((p) => p.id))); }, [eng.polys]);
  useEffect(() => { if (method === 'anomaly' && scope === 'scene') setScope('polygons'); }, [method, scope]);
  useEffect(() => { setMetricKey(seriesMetrics(method)[0].key); }, [method]);

  // animation through the dates
  useEffect(() => {
    if (!playing || !eng.dates.length) return;
    const id = setInterval(() => setDateIdx((i) => (i + 1) % eng.dates.length), 1100);
    return () => clearInterval(id);
  }, [playing, eng.dates.length]);

  // ---- hover (one state update per animation frame) -----------------------------------------
  const hoverRef = useRef(null), raf = useRef(0);
  const onHover = useCallback((i, pt) => {
    hoverRef.current = i < 0 ? null : { i, pt };
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => { raf.current = 0; setHover(hoverRef.current); });
  }, []);
  const hoverInfo = useMemo(() => (hover ? eng.describePixel(hover.i) : null), [hover, eng.describePixel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- polygon actions -----------------------------------------------------------------------------
  const togglePoly = useCallback((id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);

  const inGrid = useCallback((rings) => {
    if (!eng.grid) return true;
    const g = eng.grid;
    const xs = rings[0].map((c) => c[0]), ys = rings[0].map((c) => c[1]);
    return Math.max(...xs) >= g.lon0 && Math.min(...xs) <= g.lon0 + g.width * g.dlon && Math.max(...ys) >= g.lat0 - g.height * g.dlat && Math.min(...ys) <= g.lat0;
  }, [eng.grid]);

  const addCustom = useCallback((items, replace) => {
    const ok = items.filter((it) => inGrid(it.rings));
    if (ok.length < items.length) toast(`${items.length - ok.length} ${t('outside', 'polygon(s) lie outside the satellite scene and were skipped')}`, { icon: '⚠️' });
    if (!ok.length) return;
    setCustomPolys((cur) => (replace ? ok : [...cur, ...ok]).slice(0, 254));
    setCustomVersion((v) => v + 1);
    setPolySource('custom');
  }, [inGrid, t]);

  const onUpload = useCallback(async (file) => {
    if (!file) return;
    try {
      const items = parseVectorFile(file.name, await file.text());
      if (items.length > 254) toast(t('tooMany', 'Only the first 254 polygons are used'), { icon: '⚠️' });
      addCustom(items.slice(0, 254), true);
      toast.success(`${Math.min(items.length, 254)} ${t('imported', 'polygon(s) imported')}`);
    } catch (e) { toast.error(`${t('importFail', 'Could not read the file')}: ${e.message}`); }
  }, [addCustom, t]);

  const onDrawDone = useCallback((rings) => {
    setDrawing(false);
    const n = polySource === 'custom' ? customPolys.length : 0;
    addCustom([{ props: { name: `${t('drawn', 'Drawn')} ${n + 1}` }, rings }], polySource !== 'custom');
  }, [addCustom, customPolys.length, polySource, t]);

  const clearCustom = useCallback(() => { setCustomPolys([]); setCustomVersion((v) => v + 1); setPolySource('fields'); }, []);

  // “problem fields”: less than half of the pixels healthy
  const canSelectProblem = (method === 'health' || method === 'binary') && !!eng.analysis;
  const selectProblem = () => {
    const rows = eng.analysis?.rows;
    if (!rows) return;
    const ids = eng.polys.filter((p) => rows[p.id].n > 0 && rows[p.id].counts[CLS.HEALTHY] / rows[p.id].n < 0.5).map((p) => p.id);
    if (!ids.length) { toast.success(t('noProblem', 'No field is below 50% healthy on this date')); return; }
    setSelected(new Set(ids));
  };

  // ---- legend --------------------------------------------------------------------------------------------
  const toggleVis = (code) => setVisByMethod((v) => {
    const cur = new Set(v[method]);
    cur.has(code) ? cur.delete(code) : cur.add(code);
    return { ...v, [method]: cur };
  });
  const lc = eng.legendCounts;
  const legend = useMemo(() => {
    if (method === 'health' && lc) {
      const tot = lc.reduce((a, v, k) => a + (k === CLS.EMPTY ? 0 : v), 0);
      return CLASS_INFO.map((c, k) => ({ code: k, color: c.color, label: c.label, share: tot ? lc[k] / tot : 0 })).filter((r) => r.code !== CLS.EMPTY);
    }
    if (method === 'binary' && lc) {
      const tot = lc.reduce((a, v, k) => a + (k === CLS.EMPTY ? 0 : v), 0);
      const hl = lc[CLS.HEALTHY], un = lc[CLS.WATER_STRESS] + lc[CLS.NUTRIENT] + lc[CLS.DISEASE] + (bareAsUnhealthy ? lc[CLS.BARE] : 0);
      const ot = tot - hl - un;
      return BIN_GROUPS.map(([code, color, label]) => ({ code, color, label, share: tot ? (code === 'healthy' ? hl : code === 'unhealthy' ? un : ot) / tot : 0 }));
    }
    if (method === 'anomaly' && lc) {
      const tot = lc.reduce((a, v, k) => a + (k === ANOM.NONE ? 0 : v), 0);
      return ANOM_INFO.map((c, k) => ({ code: k, color: c.color, label: c.label, share: tot ? lc[k] / tot : 0 })).filter((r) => r.code !== ANOM.NONE);
    }
    return null;
  }, [method, lc, bareAsUnhealthy]);

  const info = INDEX_INFO[indexName];
  const labels = { drawHint: t('drawHint', 'Click the map to add corners'), undo: t('undo', 'Undo'), finish: t('finish', 'Finish'), cancel: t('cancel', 'Cancel') };
  const resolvedDate = eng.raw?.date || '';

  if (eng.error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        <b>{t('loadError', 'Could not load the satellite data pack')}</b>: {eng.error}
        <p className="mt-2 text-sm">Run <code>python tools/build_crop_health_pack.py</code> to (re)generate <code>Frontend/public/crop-health/</code>.</p>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          {eng.pack ? (
            <Controls
              t={t} dates={eng.dates} dateIdx={Math.max(0, dateIdx)} setDateIdx={setDateIdx} dateMeta={eng.dateMeta} playing={playing} setPlaying={setPlaying}
              method={method} setMethod={setMethod} indexName={indexName} setIndexName={setIndexName} indexFixed={indexFixed} setIndexFixed={setIndexFixed}
              soilClass={soilClass} setSoilClass={setSoilClass} seasonMode={seasonMode} setSeasonMode={setSeasonMode} season={eng.season}
              anomOpts={anomOpts} setAnomOpts={setAnomOpts} bareAsUnhealthy={bareAsUnhealthy} setBareAsUnhealthy={setBareAsUnhealthy}
              polySource={polySource} setPolySource={setPolySource} polys={eng.polys} selected={selected} setSelected={setSelected}
              customCount={customPolys.length} onUpload={onUpload} startDraw={() => setDrawing((d) => !d)} drawing={drawing} clearCustom={clearCustom}
              scope={scope} setScope={setScope} opacity={opacity} setOpacity={setOpacity} basemap={basemap} setBasemap={setBasemap}
              showOutlines={showOutlines} setShowOutlines={setShowOutlines} showLabels={showLabels} setShowLabels={setShowLabels}
              selectProblem={selectProblem} canSelectProblem={canSelectProblem}
            />
          ) : <div className="h-96 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />}
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="relative h-[62vh] min-h-[420px] overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700">
            {eng.grid && (
              <MapView grid={eng.grid} polys={eng.polys} selMask={eng.selMask} onTogglePoly={togglePoly}
                paint={eng.paint} paintKey={resolvedDate + method} opacity={opacity} basemap={basemap}
                showOutlines={showOutlines} showLabels={showLabels} onHover={onHover}
                drawing={drawing} onDrawDone={onDrawDone} onDrawCancel={() => setDrawing(false)} labels={labels} focus={focus} />
            )}

            {/* date + status chip */}
            <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur">
              <b className="text-sm tabular-nums">{resolvedDate || '…'}</b>
              <span className="opacity-80">{t(`method.${method}.name`, method)}</span>
              {eng.loadingDate && <span className="animate-pulse">⏳</span>}
            </div>

            {/* legend */}
            <div className="absolute bottom-3 right-3 z-[500] max-w-[260px] rounded-lg bg-white/95 p-2.5 text-xs shadow-lg dark:bg-gray-900/95 dark:text-gray-100">
              {legend && (
                <ul className="space-y-1">
                  {legend.map((r) => {
                    const on = visible.has(r.code);
                    return (
                      <li key={r.code}>
                        <button onClick={() => toggleVis(r.code)} aria-pressed={on} className={`flex w-full items-center gap-2 text-left ${on ? '' : 'opacity-40'}`}>
                          <i className="inline-block h-3 w-3 shrink-0 rounded-sm border border-black/20" style={{ background: r.color }} />
                          <span className="flex-1 leading-tight">{r.label}</span>
                          <span className="tabular-nums text-gray-500 dark:text-gray-400">{(r.share * 100).toFixed(0)}%</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {method === 'index' && eng.indexRange && (
                <div className="w-48">
                  <div className="mb-1 font-semibold">{info.label}</div>
                  <div className="h-3 rounded" style={{ background: lutCss(!!info.reverse) }} />
                  <div className="mt-0.5 flex justify-between tabular-nums text-gray-600 dark:text-gray-300"><span>{eng.indexRange[0].toFixed(2)}</span><span>{eng.indexRange[1].toFixed(2)}</span></div>
                </div>
              )}
            </div>

            {/* hover card */}
            {hoverInfo && (
              <div className="pointer-events-none absolute bottom-3 left-3 z-[500] w-60 rounded-lg bg-black/80 p-2.5 text-xs text-white backdrop-blur">
                <div className="mb-1 font-semibold">{hoverInfo.poly ? `${hoverInfo.poly.name}${hoverInfo.poly.crop ? ` · ${hoverInfo.poly.crop}` : ''}` : t('outsidePoly', 'Outside the polygons')}</div>
                {!hoverInfo.valid ? <div className="opacity-80">{t('noData', 'No clear data (cloud / shadow)')}</div> : (
                  <>
                    {hoverInfo.cls && <div>{hoverInfo.cls} <span className="opacity-70">({Math.round(hoverInfo.conf * 100)}%)</span></div>}
                    {hoverInfo.anom && <div>{hoverInfo.anom}{hoverInfo.score != null && <span className="opacity-70"> · score {hoverInfo.score.toFixed(2)}</span>}</div>}
                    {hoverInfo.value != null && <div>{info.label}: <b>{hoverInfo.value.toFixed(3)}</b></div>}
                    <div className="mt-1 grid grid-cols-2 gap-x-3 tabular-nums opacity-90">
                      <span>NDVI {hoverInfo.ndvi?.toFixed(2) ?? '—'}</span><span>NDRE {hoverInfo.ndre?.toFixed(2) ?? '—'}</span>
                      <span>NDMI {hoverInfo.ndmi?.toFixed(2) ?? '—'}</span><span>LST {hoverInfo.lst != null ? hoverInfo.lst.toFixed(1) + ' °C' : '—'}</span>
                    </div>
                    {hoverInfo.probs && (
                      <div className="mt-1 flex h-1.5 overflow-hidden rounded">
                        {hoverInfo.probs.map(([n, p], j) => <div key={n} style={{ width: `${p * 100}%`, background: ['#D2B48C', '#0050FF', '#FFD700', '#FF0000', '#00A000'][j] }} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {eng.analysis && (
            <Results
              t={t} method={method} indexName={indexName} polys={eng.polys} selected={selected} analysis={eng.analysis} legendCounts={eng.legendCounts}
              series={eng.series} dates={eng.dates.map((d) => d.date)} currentDate={resolvedDate}
              onPickDate={(d) => setDateIdx(eng.dates.findIndex((x) => x.date === d))}
              onFocus={(id) => setFocus({ id, n: Date.now() })} computeMs={eng.computeMs} indexRange={eng.indexRange}
              metricKey={metricKey} setMetricKey={setMetricKey} pixelAreaM2={eng.manifest?.grid.pixel_area_m2 || 100} cachedCount={eng.cached}
            />
          )}
        </div>
      </div>
    </div>
  );
}
