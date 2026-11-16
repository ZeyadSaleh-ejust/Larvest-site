#!/usr/bin/env python
"""
Build the static "crop-health pack" that the website renders in the browser.

Everything in the pack is REAL data pulled from Google Earth Engine - there is
no synthetic or simulated pixel anywhere:

  * Sentinel-2 SR Harmonized   B2 B3 B4 B5 B6 B8 B11 B12   (10 m grid)
      masked per pixel with Cloud Score+ (cs >= 0.6) AND the SCL layer
  * Landsat 8/9 Collection-2 Level-2 surface temperature (ST_B10), nearest
      acquisition within +/- LST_MAX_GAP_DAYS of each Sentinel-2 date

The pack is deliberately tiny (a ~280 x 170 px block) so the browser can
recompute every index and the whole health classification locally in a few
milliseconds - no server round-trip when the user changes a selection.

Output (Frontend/public/crop-health/):
    manifest.json        grid geometry, band layout, list of dates
    parcels.geojson      polygons (+ crop info)
    dates/<date>.json {"gzip_b64"}: planar: 8 x uint16 reflectance*10000 (0 = invalid)
                         then 1 x uint8 LST code (0 = no data,
                         LST_C = code / 4 + 10)

Run (uses the Earth Engine credentials already cached on this machine):
    python tools/build_crop_health_pack.py
Optional:
    --kml  path/to/Nubarya_63_Parcels_GroundTruth.kml   (replaces polygons)
    --start 2025-11-01 --end 2026-11-11
"""
import argparse
import base64
import os
import gzip
import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

EE_PROJECT = os.environ.get("EE_PROJECT_ID", "larvest-zeyad")
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Frontend" / "public" / "crop-health"
DEFAULT_KML = ROOT / "tools" / "inputs" / "fields.kml"
DEFAULT_XLSX = ROOT / "tools" / "inputs" / "crops.xlsx"

S2_BANDS = ["B2", "B3", "B4", "B5", "B6", "B8", "B11", "B12"]
BANDS_10M = ["B2", "B3", "B4", "B8"]
BANDS_20M = ["B5", "B6", "B11", "B12"]

# Nominal 63-parcel Nubaria block (from the notebook header). The imagery AOI is
# the union of this box and every polygon, so an uploaded 63-parcel KML fits.
NOMINAL_BLOCK = dict(lon=29.6712, lat=30.7796, w_m=2231, h_m=1342)
AOI_BUFFER_M = 180
MIN_CLEAR_FRACTION = 0.90
MIN_GAP_DAYS = 14
MAX_DATES = 26
LST_MAX_GAP_DAYS = 8
LST_CODE_OFFSET_C = 10.0
LST_CODE_SCALE = 4.0


# --------------------------------------------------------------------------
# polygons
# --------------------------------------------------------------------------
def _coords(text):
    pts = []
    for tok in text.replace("\n", " ").split():
        p = tok.split(",")
        if len(p) >= 2:
            pts.append((float(p[0]), float(p[1])))
    return pts


def load_kml_polygons(path, xlsx=None):
    ns = "{http://www.opengis.net/kml/2.2}"
    root = ET.parse(path).getroot()
    crops = None
    if xlsx and Path(xlsx).exists():
        import pandas as pd
        crops = pd.read_excel(xlsx)

    seen, polys = set(), []
    for pm in root.iter(ns + "Placemark"):
        poly = pm.find(f".//{ns}Polygon")
        if poly is None:
            continue
        ob = poly.find(f".//{ns}outerBoundaryIs//{ns}coordinates")
        if ob is None or not ob.text:
            continue
        ring = _coords(ob.text)
        if len(ring) < 4:
            continue
        key = tuple(sorted((round(x, 7), round(y, 7)) for x, y in ring[:-1]))
        if key in seen:                      # exact duplicate coordinates
            continue
        seen.add(key)
        name = (pm.findtext(ns + "name") or "").strip()
        props = {"name": name}
        for d in pm.iter(ns + "Data"):
            v = d.find(ns + "value")
            if d.get("name") and v is not None and v.text:
                props[d.get("name")] = v.text.strip()
        crop = re.split(r"\s+[\u2014\u2013-]\s+|\s+Excel", name)[0].strip() or name
        props["crop"] = crop
        m = re.search(r"rows?\s+(\d+)\s*-\s*(\d+)", name)
        if m and crops is not None:
            r0 = int(m.group(1)) - 2          # excel row 2 == pandas index 0
            if 0 <= r0 < len(crops):
                cc, pc = crops.iloc[r0].get("CCrop"), crops.iloc[r0].get("PCrop")
                props["crop_now"] = None if cc != cc else str(cc)
                props["crop_previous"] = None if pc != pc else str(pc)
        polys.append((props, ring))
    return polys


def poly_area_m2(ring):
    from pyproj import Transformer
    t = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)
    xs, ys = t.transform([p[0] for p in ring], [p[1] for p in ring])
    return abs(0.5 * sum(xs[i] * ys[i + 1] - xs[i + 1] * ys[i] for i in range(len(xs) - 1)))


# --------------------------------------------------------------------------
# Earth Engine
# --------------------------------------------------------------------------
def ee_init():
    import ee
    ee.Initialize(project=EE_PROJECT)
    return ee


def s2_daily(ee, aoi, day):
    """Cloud-masked mosaic of every Sentinel-2 tile acquired on `day`."""
    d0 = ee.Date(day)
    coll = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi).filterDate(d0, d0.advance(1, "day"))
            .linkCollection(ee.ImageCollection("GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED"), ["cs"]))

    def prep(img):
        scl = img.select("SCL")
        bad = (scl.eq(0).Or(scl.eq(1)).Or(scl.eq(3)).Or(scl.eq(8))
               .Or(scl.eq(9)).Or(scl.eq(10)).Or(scl.eq(11)))
        clear = img.select("cs").gte(0.6).And(bad.Not())
        b10 = img.select(BANDS_10M)
        b20 = img.select(BANDS_20M).resample("bilinear")
        out = b10.addBands(b20).select(S2_BANDS)
        return out.updateMask(clear).addBands(clear.rename("clear").unmask(0))

    return coll.map(prep).mosaic()


def candidate_dates(ee, aoi, start, end):
    coll = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi).filterDate(start, end))
    stamps = coll.aggregate_array("system:time_start").getInfo()
    days = sorted({datetime.fromtimestamp(s / 1000, tz=timezone.utc).strftime("%Y-%m-%d") for s in stamps})
    return days


def clear_fractions(ee, aoi, days):
    feats = []
    for d in days:
        img = s2_daily(ee, aoi, d)
        frac = img.select("clear").reduceRegion(
            reducer=ee.Reducer.mean(), geometry=aoi, scale=20, maxPixels=1e8)
        feats.append(ee.Feature(None, {"day": d, "frac": frac.get("clear")}))
    out = ee.FeatureCollection(feats).getInfo()["features"]
    return {f["properties"]["day"]: (f["properties"]["frac"] or 0.0) for f in out}


def landsat_lst_for(ee, aoi, day):
    """Closest cloud-free Landsat 8/9 L2 scene to `day` -> (image, gap_days, sensing_date)."""
    t0 = ee.Date(day)
    cols = []
    for cid in ("LANDSAT/LC08/C02/T1_L2", "LANDSAT/LC09/C02/T1_L2"):
        cols.append(ee.ImageCollection(cid).filterBounds(aoi)
                    .filterDate(t0.advance(-LST_MAX_GAP_DAYS, "day"), t0.advance(LST_MAX_GAP_DAYS + 1, "day"))
                    .filter(ee.Filter.lt("CLOUD_COVER", 70)))
    coll = cols[0].merge(cols[1])
    coll = coll.map(lambda i: i.set("dt", ee.Number(i.get("system:time_start")).subtract(t0.millis()).abs()))
    coll = coll.sort("dt")
    n = coll.size().getInfo()
    if n == 0:
        return None, None, None
    img = ee.Image(coll.first())
    sensed = datetime.fromtimestamp(img.get("system:time_start").getInfo() / 1000, tz=timezone.utc)
    gap = abs((sensed.date() - datetime.strptime(day, "%Y-%m-%d").date()).days)
    qa = img.select("QA_PIXEL")
    cloudy = qa.bitwiseAnd(0b11110).neq(0)           # dilated, cirrus, cloud, shadow
    lst = (img.select("ST_B10").multiply(0.00341802).add(149.0).subtract(273.15)
           .updateMask(cloudy.Not()).updateMask(img.select("ST_QA").multiply(0.01).lte(3.0))
           .resample("bilinear").rename("LST_C"))
    return lst, gap, sensed.strftime("%Y-%m-%d")


def download_tif(image, aoi, crs_transform, tmp, W, H):
    """Fetch a GeoTIFF on EXACTLY the W x H grid (Earth Engine otherwise pads the
    region by a pixel and different layers can come back with different sizes)."""
    import requests
    import rasterio
    url = image.getDownloadURL({
        "crs": "EPSG:4326", "crs_transform": crs_transform,
        "dimensions": f"{W}x{H}", "format": "GEO_TIFF"})
    r = requests.get(url, timeout=300)
    r.raise_for_status()
    tmp.write_bytes(r.content)
    with rasterio.open(tmp) as src:
        t = src.transform
        ok = (src.height, src.width) == (H, W) and all(
            abs(a - b) < 1e-9 for a, b in zip((t.a, t.c, t.e, t.f),
                                               (crs_transform[0], crs_transform[2], crs_transform[4], crs_transform[5])))
    if not ok:
        raise RuntimeError(f"downloaded grid {src.height}x{src.width} / {t} != expected {H}x{W} {crs_transform}")
    return tmp


# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kml", default=str(DEFAULT_KML))
    ap.add_argument("--xlsx", default=str(DEFAULT_XLSX))
    ap.add_argument("--start", default=None)
    ap.add_argument("--end", default=None)
    args = ap.parse_args()

    end = args.end or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    start = args.start or (datetime.strptime(end, "%Y-%m-%d") - timedelta(days=365)).strftime("%Y-%m-%d")

    polys = load_kml_polygons(args.kml, args.xlsx)
    if not polys:
        sys.exit("no polygons found")
    print(f"{len(polys)} distinct polygons from {args.kml}")

    # ---- AOI + pixel grid (EPSG:4326, ~10 m square pixels) -------------
    allx = [p[0] for _, r in polys for p in r]
    ally = [p[1] for _, r in polys for p in r]
    lat0 = NOMINAL_BLOCK["lat"]
    m_lon = 111320 * math.cos(math.radians(lat0))
    m_lat = 110574
    nb = NOMINAL_BLOCK
    minx = min(min(allx), nb["lon"] - nb["w_m"] / 2 / m_lon)
    maxx = max(max(allx), nb["lon"] + nb["w_m"] / 2 / m_lon)
    miny = min(min(ally), nb["lat"] - nb["h_m"] / 2 / m_lat)
    maxy = max(max(ally), nb["lat"] + nb["h_m"] / 2 / m_lat)
    bx, by = AOI_BUFFER_M / m_lon, AOI_BUFFER_M / m_lat
    minx, maxx, miny, maxy = minx - bx, maxx + bx, miny - by, maxy + by

    dx, dy = 10 / m_lon, 10 / m_lat
    x0 = math.floor(minx / dx) * dx
    y0 = math.ceil(maxy / dy) * dy
    W = int(math.ceil((maxx - x0) / dx))
    H = int(math.ceil((y0 - miny) / dy))
    crs_transform = [dx, 0, x0, 0, -dy, y0]
    print(f"grid {W} x {H} px  ({W*H:,} px)  pixel {dx:.7f} x {dy:.7f} deg")

    ee = ee_init()
    aoi = ee.Geometry.Rectangle([x0, y0 - H * dy, x0 + W * dx, y0], proj="EPSG:4326", geodesic=False)

    # ---- dates -----------------------------------------------------------
    days = candidate_dates(ee, aoi, start, end)
    print(f"{len(days)} Sentinel-2 acquisition days between {start} and {end}")
    fracs = clear_fractions(ee, aoi, days)
    good = [d for d in days if fracs.get(d, 0) >= MIN_CLEAR_FRACTION]
    kept, last = [], None
    for d in good:
        dd = datetime.strptime(d, "%Y-%m-%d")
        if last is None or (dd - last).days >= MIN_GAP_DAYS:
            kept.append(d)
            last = dd
    kept = kept[-MAX_DATES:]
    print(f"{len(good)} dates >= {MIN_CLEAR_FRACTION:.0%} clear -> keeping {len(kept)}: {kept}")

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "dates").mkdir(exist_ok=True)
    for old in (OUT / "dates").glob("*.json"):
        old.unlink()

    import rasterio
    tmp = OUT / "_tmp.tif"
    dates_meta, shape, transform = [], (H, W), None
    for d in kept:
        img = s2_daily(ee, aoi, d).select(S2_BANDS)
        download_tif(img.unmask(0).toUint16(), aoi, crs_transform, tmp, W, H)
        with rasterio.open(tmp) as src:
            arr = src.read().astype(np.uint16)
            shape, transform = arr.shape[1:], src.transform
            assert shape == (H, W), "grid changed between downloads"
        refl = arr[:8]
        valid_frac = float((refl[2] > 0).mean())

        lst_img, gap, lst_date = landsat_lst_for(ee, aoi, d)
        lst_code = np.zeros(shape, dtype=np.uint8)
        lst_valid = 0.0
        if lst_img is not None:
            download_tif(lst_img.unmask(-999).toFloat(), aoi, crs_transform, tmp, W, H)
            with rasterio.open(tmp) as src:
                t = src.read(1)
            assert t.shape == shape
            ok = (t > -100) & (t < 90)
            lst_valid = float(ok.mean())
            code = np.clip(np.round((t - LST_CODE_OFFSET_C) * LST_CODE_SCALE), 1, 255)
            lst_code = np.where(ok, code, 0).astype(np.uint8)
            if lst_valid < 0.5:
                lst_code[:] = 0
                gap, lst_date = None, None
        else:
            gap, lst_date = None, None

        payload = refl.astype("<u2").tobytes() + lst_code.tobytes()
        # JSON-wrapped base64 on purpose: download-manager extensions (IDM...) hijack
        # binary-looking URLs (.gz/.bin) and answer fetch() with an empty 204.
        (OUT / "dates" / f"{d}.json").write_text(json.dumps(
            {"gzip_b64": base64.b64encode(gzip.compress(payload, 9)).decode()}), encoding="utf-8")
        dates_meta.append({
            "date": d, "s2_valid_fraction": round(valid_frac, 4),
            "lst_date": lst_date, "lst_gap_days": gap,
            "lst_valid_fraction": round(lst_valid, 4)})
        print(f"  {d}  valid {valid_frac:.0%}  LST {lst_date} gap {gap}  ({len(payload)/1e6:.2f} MB raw)")
    tmp.unlink(missing_ok=True)

    H, W = shape
    x0t, y0t = transform.c, transform.f
    dxt, dyt = transform.a, -transform.e

    # ---- rasterise polygons onto the grid -------------------------------
    from matplotlib.path import Path as MPath
    xs = x0t + (np.arange(W) + 0.5) * dxt
    ys = y0t - (np.arange(H) + 0.5) * dyt
    gx, gy = np.meshgrid(xs, ys)
    pts = np.column_stack([gx.ravel(), gy.ravel()])
    ids = np.zeros(H * W, dtype=np.uint8)
    feats = []
    for k, (props, ring) in enumerate(polys, start=1):
        inside = MPath(np.array(ring)).contains_points(pts)
        inside &= ids == 0
        ids[inside] = k
        p = dict(props)
        p.update({"id": k, "area_m2": round(poly_area_m2(ring), 1), "n_pixels": int(inside.sum())})
        feats.append({"type": "Feature", "properties": p,
                      "geometry": {"type": "Polygon", "coordinates": [[list(c) for c in ring]]}})
    (OUT / "parcels.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False), encoding="utf-8")

    manifest = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "Sentinel-2 SR Harmonized + Cloud Score+ (cs>=0.6); Landsat 8/9 C2 L2 ST_B10",
        "grid": {"width": W, "height": H, "lon0": x0t, "lat0": y0t, "dlon": dxt, "dlat": dyt,
                 "pixel_area_m2": round(dxt * m_lon * dyt * m_lat, 2)},
        "bands": S2_BANDS, "reflectance_scale": 10000,
        "lst": {"offset_c": LST_CODE_OFFSET_C, "scale": LST_CODE_SCALE, "max_gap_days": LST_MAX_GAP_DAYS},
        "n_parcels": len(feats),
        "dates": dates_meta,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    print(f"done -> {OUT}  ({W}x{H}, {len(dates_meta)} dates, {len(feats)} polygons)")


if __name__ == "__main__":
    main()
