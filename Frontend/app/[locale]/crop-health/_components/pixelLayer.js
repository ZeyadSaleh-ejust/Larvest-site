// Leaflet layer that shows the raw pixel grid on a <canvas>.
// Re-painting is one Uint32Array fill + putImageData (well under a millisecond
// for the ~45k-pixel block), and the browser scales the canvas with
// image-rendering: pixelated, so pixels stay crisp at every zoom level.

export function createPixelLayer(L, grid) {
  const { width: W, height: H, lon0, lat0, dlon, dlat } = grid;
  const bounds = L.latLngBounds([lat0 - H * dlat, lon0], [lat0, lon0 + W * dlon]);

  const PixelLayer = L.Layer.extend({
    options: { opacity: 1, pane: 'overlayPane' },

    initialize(options) {
      L.setOptions(this, options);
      this._img = new ImageData(W, H);
      this._buf = new Uint32Array(this._img.data.buffer);
    },

    onAdd(map) {
      const c = (this._canvas = L.DomUtil.create('canvas', 'leaflet-image-layer leaflet-zoom-animated'));
      c.width = W; c.height = H;
      c.style.imageRendering = 'pixelated';
      c.style.pointerEvents = 'none';
      c.style.opacity = this.options.opacity;
      this._ctx = c.getContext('2d');
      this.getPane().appendChild(c);
      map.on('viewreset zoom zoomend moveend', this._reset, this);
      map.on('zoomanim', this._animateZoom, this);
      this._reset();
      this._flush();
    },

    onRemove(map) {
      map.off('viewreset zoom zoomend moveend', this._reset, this);
      map.off('zoomanim', this._animateZoom, this);
      L.DomUtil.remove(this._canvas);
    },

    getBounds() { return bounds; },
    getBuffer() { return this._buf; },
    setOpacity(o) { this.options.opacity = o; if (this._canvas) this._canvas.style.opacity = o; },
    /** call after writing into getBuffer() */
    repaint() { this._flush(); },

    _flush() { if (this._ctx) this._ctx.putImageData(this._img, 0, 0); },

    _animateZoom(e) {
      const scale = this._map.getZoomScale(e.zoom);
      const offset = this._map._latLngBoundsToNewLayerBounds(bounds, e.zoom, e.center).min;
      L.DomUtil.setTransform(this._canvas, offset, scale);
    },

    _reset() {
      const c = this._canvas;
      const tl = this._map.latLngToLayerPoint(bounds.getNorthWest());
      const size = this._map.latLngToLayerPoint(bounds.getSouthEast())._subtract(tl);
      L.DomUtil.setPosition(c, tl);
      c.style.width = `${size.x}px`;
      c.style.height = `${size.y}px`;
    },
  });
  return new PixelLayer();
}

/** lat/lng -> pixel index (or -1 outside the grid) */
export function latLngToIndex(grid, lat, lng) {
  const c = Math.floor((lng - grid.lon0) / grid.dlon);
  const r = Math.floor((grid.lat0 - lat) / grid.dlat);
  if (c < 0 || r < 0 || c >= grid.width || r >= grid.height) return -1;
  return r * grid.width + c;
}
