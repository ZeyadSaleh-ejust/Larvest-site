#!/usr/bin/env python
"""
Runs notebooks/Nubaria_Crop_Health.ipynb end-to-end (every code cell except the
`!pip` install and the saved-image viewer) against REAL data from Google Earth
Engine, and then checks that the results make sense.

The 63-parcel KML is not in this repository, so the 15 crop-labelled polygons in
tools/inputs/fields.kml are copied to the file name the notebook asks for.
Pass --kml PATH to use the real 63-parcel file instead.

Only presentation settings are changed for speed (smaller PNG dpi, no PDF, no
basemap tile downloads); no analysis code is touched.

    python tools/notebook_smoke_test.py
Needs: earthengine-api (credentials cached), geopandas, rasterio, folium,
       contextily, adjustText, arabic-reshaper, python-bidi, matplotlib.
"""
import argparse
import json
import os
import shutil
import sys
import tempfile
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NB = ROOT / "notebooks" / "Nubaria_Crop_Health.ipynb"
DEFAULT_KML = ROOT / "tools" / "inputs" / "fields.kml"

ap = argparse.ArgumentParser()
ap.add_argument("--kml", default=str(DEFAULT_KML))
ap.add_argument("--keep", action="store_true", help="keep the temporary working directory")
args = ap.parse_args()

import matplotlib
matplotlib.use("Agg")

work = Path(tempfile.mkdtemp(prefix="nubaria_smoke_"))
shutil.copy(args.kml, work / "Nubarya_63_Parcels_GroundTruth.kml")
os.chdir(work)
print("working dir:", work)

nb = json.load(open(NB, encoding="utf-8"))
ns = {"__name__": "__main__", "display": lambda *a, **k: None}

# no network tiles, faster saves (presentation only)
import contextily as cx
cx.add_basemap = lambda *a, **k: None

SKIP = {"!pip"}
t_all = time.time()
for i, c in enumerate(nb["cells"]):
    if c["cell_type"] != "code":
        continue
    code = "".join(c["source"])
    if code.lstrip().startswith("# Run once per Colab session") or code.lstrip().startswith("!pip"):
        continue
    if "glob.glob(os.path.join(OUT_DIR, '*', 'heatmaps'))" in code:      # re-viewer cell
        continue
    code = code.replace("SAVE_DPI     = 300", "SAVE_DPI     = 60").replace("SAVE_PDF     = True", "SAVE_PDF     = False")
    t = time.time()
    try:
        exec(compile(code, f"<cell {i}>", "exec"), ns)
    except Exception:
        print(f"\nFAIL in cell {i}")
        traceback.print_exc()
        sys.exit(1)
    print(f"cell {i:2d} ok  ({time.time() - t:5.1f}s)", flush=True)
print(f"all cells ran in {time.time() - t_all:.0f}s")

# ---------------------------------------------------------------- sanity checks
import numpy as np
fails = []


def check(name, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail else ""))
    if not cond:
        fails.append(name)


bd, sd, pg = ns["block_df"], ns["summary_df"], ns["parcels_gdf"]
check("every parcel summarised", len(sd) == len(pg), f"{len(sd)}/{len(pg)}")
check("labels are the expected set", set(bd["prediction"]).issubset(
    {"bare_soil", "open_water", "water_stress", "nutrient_def or low_veg", "disease", "healthy", "empty"}))
check("canals are never 'water_stress' via the water-body rule",
      not ((bd["prediction"] == "water_stress") & (bd["NDWI"] > 0.30)).any())
pct = sd[["pct_healthy", "pct_bare_soil", "pct_water_stress", "pct_open_water", "pct_nutrient_def", "pct_disease", "pct_empty"]].sum(axis=1)
check("class percentages add to 100", np.allclose(pct, 100, atol=0.01), f"{pct.min():.2f}..{pct.max():.2f}")
_th = bd["thermal"].dropna()
check("thermal is real LST in a plausible range (or absent)",
      _th.empty or _th.between(10, 75).all(),
      "none" if _th.empty else f"{_th.min():.1f}..{_th.max():.1f} C, {100 * len(_th) / len(bd):.0f}% of pixels")
check("season follows the image date", ns["BLOCK_SEASON"] == ns["season_for_date"](ns["BLOCK_S2_DATE"]), ns["BLOCK_SEASON"])
check("raster edges extend half a pixel past centres",
      abs((ns["BLOCK_LON_E"][1] - ns["BLOCK_LON_E"][0]) - (bd["longitude"].max() - bd["longitude"].min() + ns["BLOCK_DX"])) < 1e-9)
maps = list(Path("nubaria_parcels_data").rglob("*_health_classification_map.png"))
check("per-parcel maps written", len(maps) == len(pg), f"{len(maps)} files")
check("block maps written", all(Path("nubaria_parcels_data", f).exists() for f in (
    "block_health_classification.png", "block_dominant_class.png", "block_NDVI.png")))
check("owner report written", Path("nubaria_parcels_data/owner_report.csv").exists())
check("web map written", Path("nubaria_crop_health_map.html").exists())
print("\nscene date:", ns["BLOCK_S2_DATE"], "| LST:", ns.get("BLOCK_LS_DATE"), "| class mix over all parcels:")
print(sd[["pct_healthy", "pct_bare_soil", "pct_water_stress", "pct_open_water", "pct_nutrient_def", "pct_disease"]].mean().round(1).to_string())

if not args.keep:
    shutil.rmtree(work, ignore_errors=True)
sys.exit(1 if fails else 0)
