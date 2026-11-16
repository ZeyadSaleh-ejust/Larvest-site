import fs from 'node:fs'; import zlib from 'node:zlib'; import path from 'node:path';
import { computeIndices } from '../Frontend/app/[locale]/crop-health/_engine/indices.mjs';
import { classify } from '../Frontend/app/[locale]/crop-health/_engine/classifier.mjs';
import { anomalyScreen, interiorMask, ANOM } from '../Frontend/app/[locale]/crop-health/_engine/anomaly.mjs';
import { rasterize } from '../Frontend/app/[locale]/crop-health/_engine/geo.mjs';
const pack = path.resolve(import.meta.dirname, '../Frontend/public/crop-health');
const m = JSON.parse(fs.readFileSync(`${pack}/manifest.json`)); const g = m.grid; const N = g.width * g.height;
const gj = JSON.parse(fs.readFileSync(`${pack}/parcels.geojson`));
let t = performance.now();
const { ids } = rasterize(gj.features.map((f) => ({ rings: f.geometry.coordinates })), g);
console.log('rasterize', (performance.now() - t).toFixed(1), 'ms; inside px', ids.filter(Boolean).length);
const date = '2026-07-24';
const b = zlib.gunzipSync(Buffer.from(JSON.parse(fs.readFileSync(`${pack}/dates/${date}.json`)).gzip_b64, 'base64'));
const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const raw = new Uint16Array(ab, 0, 8 * N), lst = new Uint8Array(ab, 16 * N, N);
for (let r = 0; r < 3; r++) {
  t = performance.now(); const ind = computeIndices(raw, lst, m.lst, N); const a = performance.now() - t;
  t = performance.now(); classify(ind, { soilClass: 'calcareous_sandy', season: 'summer' }); const c = performance.now() - t;
  const inter = interiorMask(ids, g.width, g.height, 1);
  t = performance.now(); const an = anomalyScreen(ind, ids, inter, gj.features.length, 3, undefined ?? (await import('../Frontend/app/[locale]/crop-health/_engine/anomaly.mjs')).DEFAULT_ANOMALY); const d = performance.now() - t;
  if (r === 2) { const cnt = [0,0,0,0,0,0]; an.status.forEach((s) => cnt[s]++); console.log('status counts', cnt.join(','), 'fields', an.fields.slice(1).map((f) => f.state[0]).join('')); }
  console.log(`run ${r}: indices ${a.toFixed(1)} ms | classify ${c.toFixed(1)} ms | anomaly ${d.toFixed(1)} ms`);
}
