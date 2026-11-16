// Loading of the real-data pack (see tools/build_crop_health_pack.py).
//
// Date files are JSON-wrapped base64 gzip payloads on purpose: download-manager
// browser extensions (IDM and friends) hijack binary-looking URLs (.gz / .bin)
// and answer fetch() with an empty 204 or a download prompt.

async function gunzip(buf) {
  const u8 = new Uint8Array(buf);
  if (u8[0] !== 0x1f || u8[1] !== 0x8b) return buf;          // already decompressed by a proxy
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser does not support DecompressionStream');
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

async function getBin(url) {
  const r = await fetch(url);
  if (!r.ok || r.status === 204) throw new Error(`${url}: HTTP ${r.status}`);
  const { gzip_b64: b64 } = await r.json();
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
  return gunzip(u8.buffer);
}

export async function loadPack(base) {
  const [manifest, parcels] = await Promise.all([
    fetch(`${base}/manifest.json`).then((r) => { if (!r.ok) throw new Error('manifest.json missing'); return r.json(); }),
    fetch(`${base}/parcels.geojson`).then((r) => r.json()),
  ]);
  return { manifest, parcels };
}

/** one acquisition: 8 reflectance bands (uint16, planar) + LST code (uint8) */
export async function loadDate(base, manifest, date) {
  const { width: W, height: H } = manifest.grid;
  const N = W * H;
  const buf = await getBin(`${base}/dates/${date}.json`);
  if (buf.byteLength !== 17 * N) throw new Error(`${date}: unexpected size ${buf.byteLength}`);
  return { raw: new Uint16Array(buf, 0, 8 * N), lst: new Uint8Array(buf, 16 * N, N) };
}
