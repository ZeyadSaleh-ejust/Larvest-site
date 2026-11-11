// Colour helpers. Everything is packed into little-endian RGBA uint32 so a whole
// frame can be painted with a single Uint32Array pass.

export function hexToRGBA(hex, alpha = 255) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : alpha;
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

// ColorBrewer RdYlGn (11 classes), interpolated to a 256-entry lookup table.
const RDYLGN = ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'];

export function makeLUT(reverse = false) {
  const rgb = RDYLGN.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  if (reverse) rgb.reverse();
  const lut = new Uint32Array(256);
  for (let k = 0; k < 256; k++) {
    const t = (k / 255) * (rgb.length - 1);
    const i = Math.min(rgb.length - 2, Math.floor(t)), f = t - i;
    const r = Math.round(rgb[i][0] + (rgb[i + 1][0] - rgb[i][0]) * f);
    const g = Math.round(rgb[i][1] + (rgb[i + 1][1] - rgb[i][1]) * f);
    const b = Math.round(rgb[i][2] + (rgb[i + 1][2] - rgb[i][2]) * f);
    lut[k] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  return lut;
}

// CSS gradient for the legend colour bar
export function lutCss(reverse = false) {
  const s = reverse ? [...RDYLGN].reverse() : RDYLGN;
  return `linear-gradient(90deg, ${s.join(',')})`;
}

const LUT_FWD = makeLUT(false);
// bad (0) -> good (1) colour for SVG charts
export function rdylgn(t) {
  const c = LUT_FWD[Math.max(0, Math.min(255, Math.round(t * 255)))];
  return `rgb(${c & 255},${(c >> 8) & 255},${(c >> 16) & 255})`;
}
