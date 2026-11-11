#!/usr/bin/env python
"""
Parity test: the browser engine (JS) vs the notebook's own Python classifier.

For every date in the pack it runs BOTH implementations on the same real pixels
and compares the indices and the final class of every pixel.

The notebook's classifier cell (notebooks/Nubaria_Crop_Health.ipynb) is executed
unmodified and compared pixel by pixel with the JavaScript engine in
Frontend/app/[locale]/crop-health/_engine/. They must agree exactly.

    python tools/parity_test.py [--dates 2026-01-25 2026-07-24] [--notebook PATH]
"""
import argparse
import gzip
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "Frontend" / "public" / "crop-health"
NOTEBOOK = ROOT / "notebooks" / "Nubaria_Crop_Health.ipynb"

# JS class code -> notebook label
JS2PY = {0: "empty", 1: "bare_soil", 2: "open_water", 3: "water_stress",
         4: "nutrient_def or low_veg", 5: "disease", 6: "healthy"}


def load_notebook_functions(nb_path):
    nb = json.load(open(nb_path, encoding="utf-8"))
    ns = {"np": np, "pd": pd}
    cell = next(c for c in nb["cells"]
                if c["cell_type"] == "code" and "def classify_crop_issues" in "".join(c["source"]))
    exec("".join(cell["source"]), ns)             # compute_indices + classify_crop_issues
    return ns


def season_for(date):
    m = int(date[5:7])
    return "winter" if (m >= 11 or m <= 3) else "summer"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dates", nargs="*")
    ap.add_argument("--notebook", default=str(NOTEBOOK))
    ap.add_argument("--soil", default="calcareous_sandy")
    args = ap.parse_args()

    manifest = json.load(open(PACK / "manifest.json"))
    W, H = manifest["grid"]["width"], manifest["grid"]["height"]
    N = W * H
    dates = args.dates or [d["date"] for d in manifest["dates"]]
    ns = load_notebook_functions(args.notebook)

    worst = 1.0
    tot_px = tot_diff = 0
    for date in dates:
        season = season_for(date)
        payload = gzip.decompress(__import__("base64").b64decode(json.load(open(PACK / "dates" / f"{date}.json"))["gzip_b64"]))
        raw = np.frombuffer(payload[:16 * N], "<u2").reshape(8, N).astype(float)
        lst = np.frombuffer(payload[16 * N:], np.uint8).astype(float)
        thermal = np.where(lst > 0, lst / manifest["lst"]["scale"] + manifest["lst"]["offset_c"], np.nan)

        df = pd.DataFrame({b: raw[i] for i, b in enumerate(manifest["bands"])})
        for b in ("B1", "B7", "B8A", "B9"):
            df[b] = 1000.0
        df["thermal"] = thermal
        df = ns["compute_indices"](df)
        df = ns["classify_crop_issues"](df, soil_class=args.soil, season=season)

        out = Path(tempfile.gettempdir()) / f"parity_{date}.bin"
        r = subprocess.run(["node", str(ROOT / "tools" / "parity_dump.mjs"), date, args.soil, season, str(out)],
                           capture_output=True, text=True, check=True)
        timing = json.loads(r.stdout.strip().splitlines()[-1])
        blob = out.read_bytes()
        js_cls = np.frombuffer(blob[:N], np.uint8)
        feats = {}
        for k, name in enumerate(["NDVI", "NDRE", "NDMI", "PSRI", "BSI", "SIPI", "NDWI"]):
            feats[name] = np.frombuffer(blob[N + k * 4 * N: N + (k + 1) * 4 * N], "<f4")

        # index agreement
        idx_err = {}
        for name, js in feats.items():
            py = df[name].to_numpy(float)
            both = np.isfinite(py) & np.isfinite(js)
            nan_mismatch = int((np.isfinite(py) != np.isfinite(js)).sum())
            idx_err[name] = (float(np.abs(py[both] - js[both]).max()) if both.any() else 0.0, nan_mismatch)

        # class agreement (open water is the one intended relabel)
        py_lab = df["prediction"].to_numpy(object)
        js_lab = np.array([JS2PY[c] for c in js_cls], dtype=object)
        same = py_lab == js_lab
        n_diff = int((~same).sum())
        tot_px += N
        tot_diff += n_diff
        worst = min(worst, same.mean())

        water_fix = int(((js_cls == 2)).sum())
        print(f"{date} [{season:6s}] class agreement {same.mean()*100:7.3f}%  ({n_diff} of {N} px differ)"
              f" | open-water px relabelled {water_fix}"
              f" | max |idx err| " + " ".join(f"{k}:{v[0]:.1e}/nan{v[1]}" for k, v in idx_err.items())
              + f" | JS {timing['indices_ms']+timing['classify_ms']:.1f} ms")
        if n_diff:
            d = pd.crosstab(pd.Series(py_lab[~same], name="python"), pd.Series(js_lab[~same], name="js"))
            print(d.to_string())

    print(f"\nOVERALL {100*(1-tot_diff/tot_px):.4f}% of {tot_px:,} pixel-classifications identical "
          f"(worst date {worst*100:.3f}%)")
    sys.exit(0 if tot_diff / tot_px < 0.001 else 1)


if __name__ == "__main__":
    main()
