// Runs the browser engine in Node on one real date and dumps its outputs so
// tools/parity_test.py can compare them with the notebook's own Python code.
//   node tools/parity_dump.mjs <date> <soilClass> <season> <outfile>
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { computeIndices, INDEX_NAMES } from '../Frontend/app/[locale]/crop-health/_engine/indices.mjs';
import { classify } from '../Frontend/app/[locale]/crop-health/_engine/classifier.mjs';

const [date, soilClass, season, out] = process.argv.slice(2);
const pack = path.resolve(import.meta.dirname, '../Frontend/public/crop-health');
const manifest = JSON.parse(fs.readFileSync(path.join(pack, 'manifest.json'), 'utf8'));
const { width: W, height: H } = manifest.grid;
const N = W * H;
const buf = zlib.gunzipSync(Buffer.from(JSON.parse(fs.readFileSync(path.join(pack, 'dates', `${date}.json`), 'utf8')).gzip_b64, 'base64'));
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const raw = new Uint16Array(ab, 0, 8 * N);
const lst = new Uint8Array(ab, 16 * N, N);

const t0 = performance.now();
const ind = computeIndices(raw, lst, manifest.lst, N);
const t1 = performance.now();
const res = classify(ind, { soilClass, season });
const t2 = performance.now();

// layout: cls(N u8) | NDVI, NDRE, NDMI, PSRI, BSI (f32 each)
const parts = [Buffer.from(res.cls)];
for (const k of ['NDVI', 'NDRE', 'NDMI', 'PSRI', 'BSI', 'SIPI', 'NDWI']) parts.push(Buffer.from(Float32Array.from(ind.idx[k]).buffer));
fs.writeFileSync(out, Buffer.concat(parts));
console.log(JSON.stringify({ indices_ms: +(t1 - t0).toFixed(2), classify_ms: +(t2 - t1).toFixed(2), N }));
