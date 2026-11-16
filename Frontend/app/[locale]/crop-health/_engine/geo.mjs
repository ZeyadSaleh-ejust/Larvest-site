// Polygon helpers: rasterising onto the pixel grid, KML / GeoJSON import, areas.

export const M_PER_DEG_LAT = 110574;
export const mPerDegLon = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

/** Even-odd point-in-polygon over all rings (outer + holes). */
function inRings(x, y, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

/** features: [{rings}] -> { ids: Uint8Array (1-based, 0 = outside), counts } */
export function rasterize(features, grid) {
  const { width: W, height: H, lon0, lat0, dlon, dlat } = grid;
  const ids = new Uint8Array(W * H);
  const counts = new Array(features.length).fill(0);
  features.forEach((f, k) => {
    if (k >= 254) return;
    let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    for (const r of f.rings) for (const [x, y] of r) {
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
    }
    const c0 = Math.max(0, Math.floor((minx - lon0) / dlon)), c1 = Math.min(W - 1, Math.ceil((maxx - lon0) / dlon));
    const r0 = Math.max(0, Math.floor((lat0 - maxy) / dlat)), r1 = Math.min(H - 1, Math.ceil((lat0 - miny) / dlat));
    for (let r = r0; r <= r1; r++) {
      const y = lat0 - (r + 0.5) * dlat;
      for (let c = c0; c <= c1; c++) {
        const i = r * W + c;
        if (ids[i]) continue;
        if (inRings(lon0 + (c + 0.5) * dlon, y, f.rings)) { ids[i] = k + 1; counts[k]++; }
      }
    }
  });
  return { ids, counts };
}

export function ringAreaM2(ring) {
  const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const kx = mPerDegLon(lat), ky = M_PER_DEG_LAT;
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * kx * ring[i + 1][1] * ky - ring[i + 1][0] * kx * ring[i][1] * ky;
  }
  return Math.abs(a / 2);
}

/** GeoJSON (FeatureCollection / Feature / geometry) -> [{props, rings}] one entry per polygon */
export function fromGeoJSON(gj) {
  const feats = gj.type === 'FeatureCollection' ? gj.features
    : gj.type === 'Feature' ? [gj] : [{ type: 'Feature', properties: {}, geometry: gj }];
  const out = [];
  for (const f of feats) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const p of polys) out.push({ props: { ...(f.properties || {}) }, rings: p.map((r) => r.map((c) => [c[0], c[1]])) });
  }
  return out;
}

/** KML text -> same shape as fromGeoJSON. Owner names / HTML popups are deliberately NOT imported (personal data). */
export function fromKML(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid KML file');
  const out = [];
  const parseCoords = (s) => s.trim().split(/\s+/).map((t) => t.split(',').map(Number))
    .filter((p) => p.length >= 2 && p.every(Number.isFinite)).map((p) => [p[0], p[1]]);
  for (const pm of doc.getElementsByTagName('Placemark')) {
    const name = pm.getElementsByTagName('name')[0]?.textContent?.trim() || '';
    const props = { name };
    for (const d of pm.getElementsByTagName('Data')) {
      const k = d.getAttribute('name'), v = d.getElementsByTagName('value')[0]?.textContent;
      if (k && v != null && !/owner/i.test(k)) props[k] = v.trim();
    }
    for (const poly of pm.getElementsByTagName('Polygon')) {
      const rings = [];
      for (const b of poly.getElementsByTagName('coordinates')) rings.push(parseCoords(b.textContent));
      if (rings[0] && rings[0].length >= 4) out.push({ props: { ...props }, rings });
    }
  }
  if (!out.length) throw new Error('No polygons found in the KML');
  return out;
}

export function parseVectorFile(name, text) {
  if (/\.kml$/i.test(name)) return fromKML(text);
  const out = fromGeoJSON(JSON.parse(text));
  if (!out.length) throw new Error('No polygons found in the GeoJSON');
  return out;
}
