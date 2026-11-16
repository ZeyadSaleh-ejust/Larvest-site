"use client";
import { useEffect, useRef, useState } from 'react';
import { createPixelLayer, latLngToIndex } from './pixelLayer';

const BASEMAPS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics', maxNativeZoom: 19,
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap contributors', maxNativeZoom: 19,
  },
};

export default function MapView({
  grid, polys, selMask, onTogglePoly, paint, paintKey, opacity, basemap, showOutlines, showLabels,
  onHover, drawing, onDrawDone, onDrawCancel, labels, focus,
}) {
  const hostRef = useRef(null);
  const st = useRef({});               // leaflet objects live here, outside React state
  const [ready, setReady] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  // keep latest callbacks reachable from long-lived leaflet handlers
  const cb = useRef({});
  cb.current = { onTogglePoly, onHover, drawing };

  // ---- init (once) --------------------------------------------------------
  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (dead || !hostRef.current) return;

      const map = L.map(hostRef.current, { zoomControl: true, attributionControl: true, maxZoom: 21, doubleClickZoom: true });
      const layer = createPixelLayer(L, grid);
      layer.addTo(map);
      map.fitBounds(layer.getBounds(), { padding: [10, 10] });
      Object.assign(st.current, { L, map, layer, polyLayers: [], labelLayers: [], draft: [] });

      map.on('mousemove', (e) => {
        const i = latLngToIndex(grid, e.latlng.lat, e.latlng.lng);
        cb.current.onHover(i, e.containerPoint);
      });
      map.on('mouseout', () => cb.current.onHover(-1, null));

      map.on('click', (e) => {
        if (!cb.current.drawing) return;
        const s = st.current;
        s.draft.push([e.latlng.lng, e.latlng.lat]);
        redrawDraft();
        setDraftCount(s.draft.length);
      });
      map.on('dblclick', (e) => {
        if (!cb.current.drawing) return;
        L.DomEvent.stop(e);
      });

      function redrawDraft() {
        const s = st.current;
        if (s.draftLayer) { s.draftLayer.remove(); s.draftLayer = null; }
        if (!s.draft.length) return;
        const ll = s.draft.map(([x, y]) => [y, x]);
        s.draftLayer = (s.draft.length >= 3
          ? L.polygon(ll, { color: '#f59e0b', weight: 2, fillOpacity: 0.15, dashArray: '5 4' })
          : L.polyline(ll, { color: '#f59e0b', weight: 2, dashArray: '5 4' })).addTo(map);
      }
      st.current.redrawDraft = redrawDraft;

      setReady(true);
    })();
    return () => {
      dead = true;
      if (st.current.map) { st.current.map.remove(); st.current = {}; }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- resize ---------------------------------------------------------------------
  useEffect(() => {
    if (!ready || !hostRef.current) return;
    const ro = new ResizeObserver(() => st.current.map && st.current.map.invalidateSize());
    ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, [ready]);

  // ---- basemap -----------------------------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    const { L, map } = st.current;
    if (st.current.base) st.current.base.remove();
    const b = BASEMAPS[basemap] || BASEMAPS.satellite;
    st.current.base = L.tileLayer(b.url, { attribution: b.attr, maxZoom: 21, maxNativeZoom: b.maxNativeZoom }).addTo(map);
    st.current.base.bringToBack();
  }, [ready, basemap]);

  // ---- polygons (rebuild when the set changes) --------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    const { L, map } = st.current;
    st.current.polyLayers.forEach((l) => l.remove());
    st.current.labelLayers.forEach((l) => l.remove());
    st.current.polyLayers = polys.map((p) => {
      const ll = p.rings.map((r) => r.map(([x, y]) => [y, x]));
      const pl = L.polygon(ll, { weight: 2, color: '#ffffff', fillOpacity: 0, interactive: true });
      pl.on('click', (e) => { if (cb.current.drawing) return; L.DomEvent.stopPropagation(e); cb.current.onTogglePoly(p.id); });
      pl.bindTooltip(`${p.name}${p.crop ? ` · ${p.crop}` : ''}`, { sticky: true, direction: 'top', opacity: 0.95 });
      pl._pid = p.id;
      return pl;
    });
    st.current.labelLayers = polys.length <= 120 ? polys.map((p) => {
      const ring = p.rings[0];
      const cx = ring.reduce((a, c) => a + c[0], 0) / ring.length, cy = ring.reduce((a, c) => a + c[1], 0) / ring.length;
      return L.marker([cy, cx], {
        interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'crop-health-label', html: `<span>${p.id}</span>`, iconSize: [0, 0] }),
      });
    }) : [];
    st.current.polysVersion = polys;
    applyPolyStyle();
  }, [ready, polys]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- selection / outline style -----------------------------------------------------------------
  function applyPolyStyle() {
    const s = st.current;
    if (!s.map) return;
    s.polyLayers.forEach((pl) => {
      const sel = selMask[pl._pid];
      if (showOutlines) {
        if (!s.map.hasLayer(pl)) pl.addTo(s.map);
        pl.setStyle(sel
          ? { color: '#ffffff', weight: 2.2, opacity: 0.95, fillOpacity: 0 }
          : { color: '#ffffff', weight: 1, opacity: 0.45, dashArray: '3 4', fillOpacity: 0 });
        pl.bringToFront();
      } else if (s.map.hasLayer(pl)) pl.remove();
    });
    s.labelLayers.forEach((m, k) => {
      const want = showOutlines && showLabels && selMask[s.polyLayers[k]?._pid];
      if (want && !s.map.hasLayer(m)) m.addTo(s.map);
      if (!want && s.map.hasLayer(m)) m.remove();
    });
  }
  useEffect(() => { if (ready) applyPolyStyle(); }, [ready, selMask, showOutlines, showLabels, polys]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- pixel painting ------------------------------------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    const { layer } = st.current;
    paint(layer.getBuffer());
    layer.repaint();
  }, [ready, paint, paintKey]);

  useEffect(() => { if (ready) st.current.layer.setOpacity(opacity); }, [ready, opacity]);

  // ---- zoom to a polygon (clicked in the results table) ------------------------------
  useEffect(() => {
    if (!ready || !focus) return;
    const pl = st.current.polyLayers.find((l) => l._pid === focus.id);
    if (pl) st.current.map.fitBounds(pl.getBounds(), { padding: [60, 60], maxZoom: 19 });
  }, [ready, focus]);

  // ---- drawing mode ---------------------------------------------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    const { map, L } = st.current;
    if (drawing) {
      st.current.draft = [];
      setDraftCount(0);
      map.doubleClickZoom.disable();
      L.DomUtil.addClass(map.getContainer(), 'crop-health-drawing');
    } else {
      map.doubleClickZoom.enable();
      L.DomUtil.removeClass(map.getContainer(), 'crop-health-drawing');
      if (st.current.draftLayer) { st.current.draftLayer.remove(); st.current.draftLayer = null; }
      st.current.draft = [];
    }
  }, [ready, drawing]);

  const finish = () => {
    const d = st.current.draft;
    if (d.length < 3) return;
    onDrawDone([[...d, d[0]]]);
  };
  const undo = () => {
    st.current.draft.pop();
    st.current.redrawDraft();
    setDraftCount(st.current.draft.length);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full rounded-xl" style={{ background: '#1c2a22', cursor: drawing ? 'crosshair' : undefined }} />
      {drawing && (
        <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs shadow-lg dark:bg-gray-900/95 dark:text-gray-100">
          <span>{labels.drawHint} ({draftCount})</span>
          <button onClick={undo} disabled={!draftCount} className="rounded bg-gray-200 px-2 py-1 disabled:opacity-40 dark:bg-gray-700">{labels.undo}</button>
          <button onClick={finish} disabled={draftCount < 3} className="rounded bg-emerald-600 px-2 py-1 text-white disabled:opacity-40">{labels.finish}</button>
          <button onClick={onDrawCancel} className="rounded bg-red-600 px-2 py-1 text-white">{labels.cancel}</button>
        </div>
      )}
      <style jsx global>{`
        .crop-health-label { pointer-events: none; }
        .crop-health-label span {
          position: absolute; transform: translate(-50%, -50%); color: #fff; font: 700 11px/1 system-ui, sans-serif;
          text-shadow: 0 0 3px #000, 0 0 3px #000, 0 0 2px #000; white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
