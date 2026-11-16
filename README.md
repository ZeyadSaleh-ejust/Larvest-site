# Larvest site

```
Backend/     Django REST API (tile generation, time series, farm areas)
Frontend/    Next.js 14 site (English / Arabic), static export in production
notebooks/   Nubaria_Crop_Health.ipynb  - the analysis the Crop Health Explorer is based on
tools/       data-pack builder, parity / smoke / browser tests
```

## Run it locally

```powershell
.\start-backend.ps1      # Django on http://127.0.0.1:8000  (needs Backend\LarvestVenv, see the script)
.\start-frontend.ps1     # Next.js on http://localhost:3000
```

The Crop Health Explorer is at **http://localhost:3000/en/crop-health** (Arabic: `/ar/crop-health`).
It needs **no backend**: it is a static page plus a small data pack.

## Crop Health Explorer

Pick a satellite date, a method and the polygons you care about; the map, numbers and
trend chart update immediately.

| You choose | Options |
|---|---|
| Date | 22 cloud-free Sentinel-2 dates (Nov 2025 - Oct 2026), step or play |
| Method | **Health classes** (healthy / water stress / nutrient / disease / bare soil / open water), **Healthy or not**, **Within-field anomaly** (each pixel vs. the rest of its own field the same day), or any of 20 **spectral indices** |
| Polygons | the 15 crop-labelled fields, filter by crop, "problem fields", **draw** your own, or **upload KML / GeoJSON** (owner names in KML are ignored) |
| Tuning | soil type, season, anomaly thresholds, edge buffer, colour scale, opacity, basemap |

### Why it is fast

`Frontend/public/crop-health/` holds **real** Sentinel-2 surface reflectance (Cloud Score+ and SCL
masked) and Landsat 8/9 Level-2 surface temperature for a ~45 000-pixel block, no synthetic data.
The browser computes every index, the classification and the anomaly screening itself
(`Frontend/app/[locale]/crop-health/_engine/`), so changing a selection never touches the
network. Measured: re-colour about 1 ms, full recompute 15-25 ms, date change about 40 ms.

> The data files are JSON-wrapped on purpose. Download-manager browser extensions (IDM and
> friends) hijack `.gz` / `.bin` URLs and answer `fetch()` with an empty response.

### How accurate is it?

It is **rule-based screening**, not a validated diagnosis. Class scores are relative weights, not
calibrated probabilities, and have not been compared with field scouting. Use it to decide where
to look first. The classifier is a port of the notebook (with one fix: canals are `open_water`
instead of "water stress"), and `tools/parity_test.py` proves the JavaScript and the notebook's
Python agree on **100 %** of 993 366 real pixel classifications.

## Reproduce everything

```powershell
pip install -r tools/requirements.txt
earthengine authenticate            # once; project from $env:EE_PROJECT_ID (default larvest-zeyad)

# 1. rebuild the data pack from Earth Engine (a few minutes)
python tools/build_crop_health_pack.py            # --kml my.kml  --start 2025-11-01 --end 2026-11-11

# 2. JavaScript engine == notebook classifier, on every real pixel of every date
python tools/parity_test.py                       # needs Node 18+

# 3. run the whole notebook end-to-end on real data and sanity-check the outputs
python tools/notebook_smoke_test.py

# 4. browser test of the page (start the frontend first); uses Playwright's own Chromium
python tools/ui_test.py
```

Production build: `cd Frontend && npm ci && npm run build` (static export to `Frontend/out`).

To use the full 63-parcel Nubaria block, run the builder with `--kml Nubarya_63_Parcels_GroundTruth.kml`
or upload that file in the page.

## Notebook

`notebooks/Nubaria_Crop_Health.ipynb` is committed **without outputs**. Beyond the original six
classifier bugs it now also fixes: canals labelled as drought, thermal from real Landsat L2 land-surface
temperature (was top-of-atmosphere brightness temperature), season taken from the image date, per-parcel
maps that actually zoom to the parcel, half-pixel overlay offset, pandas 3 crash, leftover Turkish titles /
file names, and an owner name in a markdown cell.
