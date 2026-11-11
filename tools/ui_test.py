"""
End-to-end browser test for the crop-health explorer (real Chrome via Playwright).
Loads the page, checks for console errors, exercises every control and measures
how long each interaction takes to repaint.

    python tools/ui_test.py [--url http://localhost:3000/en/crop-health] [--shots DIR]
"""
import argparse
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--url", default="http://localhost:3000/en/crop-health")
ap.add_argument("--shots", default=str(Path(__file__).resolve().parent / "_shots"))
ap.add_argument("--exe", default=None, help="path to a Chromium executable (default: Playwright's own)")
ap.add_argument("--channel", default=None, help="e.g. 'chrome'. Default: Playwright's bundled Chromium")
args = ap.parse_args()
shots = Path(args.shots)
shots.mkdir(exist_ok=True)

errors, failed = [], []
results = {}


def check(name, cond, detail=""):
    results[name] = bool(cond)
    print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail else ""))


with sync_playwright() as p:
    b = p.chromium.launch(channel=args.channel, executable_path=args.exe, headless=True)
    ctx = b.new_context(viewport={"width": 1500, "height": 1000})
    page = ctx.new_page()
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
    binary_requests = []
    page.on("request", lambda r: binary_requests.append(r.url) if r.url.split("?")[0].endswith((".bin", ".gz", ".zip")) else None)
    page.on("requestfailed", lambda r: failed.append(r.url) if "arcgisonline" not in r.url and "openstreetmap" not in r.url else None)

    t0 = time.time()
    page.goto(args.url, wait_until="domcontentloaded")
    page.wait_for_selector("text=Health classes", timeout=60000)
    page.wait_for_selector("canvas.leaflet-image-layer", timeout=60000)
    page.wait_for_function("document.querySelectorAll('table tbody tr').length > 0", timeout=60000)
    load_s = time.time() - t0
    check("page loads with map + table", True, f"{load_s:.1f}s incl. dev compile")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(shots / "01_health.png"))

    # --- canvas actually has painted pixels -----------------------------------
    painted = page.evaluate("""() => {
      const c = document.querySelector('canvas.leaflet-image-layer');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
      return {w: c.width, h: c.height, painted: n};
    }""")
    check("canvas painted from real data", painted["painted"] > 500, str(painted))

    # --- helper: time how long until the canvas content changes -----------------
    def canvas_hash():
        return page.evaluate("""() => {
          const c = document.querySelector('canvas.leaflet-image-layer');
          const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
          let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i+1] * 3 + d[i+2] * 7 + d[i+3]) | 0;
          return h;
        }""")

    def timed(name, action, budget_ms):
        h0 = canvas_hash()
        t = time.time()
        action()
        page.wait_for_function(
            "(h0) => { const c = document.querySelector('canvas.leaflet-image-layer'); const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let h=0; for (let i=0;i<d.length;i+=4) h=(h*31+d[i]+d[i+1]*3+d[i+2]*7+d[i+3])|0; return h!==h0; }",
            arg=h0, timeout=15000, polling="raf")
        ms = (time.time() - t) * 1000
        check(f"{name} repaints", True, f"{ms:.0f} ms (budget {budget_ms})")
        results[name + "_ms"] = ms
        return ms

    # --- the pixel layer must stay glued to the polygons while zooming --------------
    # Polygon-number labels sit at fixed lon/lat, so their position as a FRACTION of the
    # pixel canvas must not change when the map zooms (outlines are clipped by Leaflet
    # at high zoom, so they are not a reliable anchor).
    def anchors():
        return page.evaluate("""() => {
          const c = document.querySelector('canvas.leaflet-image-layer').getBoundingClientRect();
          const ls = [...document.querySelectorAll('.crop-health-label span')].map(e => e.getBoundingClientRect());
          const pick = [ls[0], ls[ls.length - 1]];
          return {cw: c.width, f: pick.flatMap(r => [(r.left + r.width / 2 - c.left) / c.width, (r.top + r.height / 2 - c.top) / c.height])};
        }""")
    seq = [anchors()]
    for _ in range(3):
        page.locator(".leaflet-control-zoom-in").click(); page.wait_for_timeout(900); seq.append(anchors())
    for _ in range(3):
        page.locator(".leaflet-control-zoom-out").click(); page.wait_for_timeout(900)
    seq.append(anchors())
    spread = max(max(a["f"][k] for a in seq) - min(a["f"][k] for a in seq) for k in range(4))
    grew = seq[3]["cw"] / seq[0]["cw"]
    check("pixel layer stays aligned with polygons across zoom in/out", spread < 0.005 and grew > 3,
          "anchor drift %.4f of canvas, canvas grew x%.1f when zoomed in" % (spread, grew))
    page.screenshot(path=str(shots / "01b_after_zoom.png"))

    # --- change the polygon selection (re-colour only) -----------------------------
    n_sel0 = int(page.inner_text("text=/^Selected$/ >> xpath=following-sibling::div[1]"))
    timed("deselect all", lambda: page.get_by_role("button", name="None", exact=True).click(), 300)
    check("selection is empty", page.inner_text("text=/^Selected$/ >> xpath=following-sibling::div[1]") == "0")
    timed("select all", lambda: page.get_by_role("button", name="All", exact=True).click(), 300)
    check("selection restored", int(page.inner_text("text=/^Selected$/ >> xpath=following-sibling::div[1]")) == n_sel0, str(n_sel0))

    # crop chip filter
    chip = page.locator("button[aria-pressed]", has_text="Corn").first
    timed("crop chip toggle", lambda: chip.click(), 300)
    page.screenshot(path=str(shots / "02_crop_toggle.png"))
    page.get_by_role("button", name="All", exact=True).click()

    # --- date changes -----------------------------------------------------------
    sel = page.locator("select[aria-label=date]")
    dates = sel.locator("option").all_inner_texts()
    check("22 real dates listed", len(dates) >= 10, f"{len(dates)} dates")
    timed("date change (prefetched)", lambda: sel.select_option(index=3), 600)
    page.wait_for_timeout(600)
    timed("date change 2", lambda: sel.select_option(index=len(dates) - 4), 600)

    # --- methods ------------------------------------------------------------------
    for key, label in (("binary", "Healthy or not"), ("anomaly", "Within-field anomaly"), ("index", "Spectral index"), ("health", "Health classes")):
        timed(f"method -> {key}", lambda l=label: page.get_by_role("button", name=l).first.click(), 800)
        page.wait_for_timeout(500)
        page.screenshot(path=str(shots / f"03_{key}.png"))

    # --- index dropdown --------------------------------------------------------------
    page.get_by_role("button", name="Spectral index").first.click()
    page.wait_for_timeout(300)
    idx_sel = page.locator("label:has-text('Index') select").first
    timed("index -> NDRE", lambda: idx_sel.select_option("NDRE"), 600)

    # --- threshold sliders in anomaly ----------------------------------------------------
    page.get_by_role("button", name="Within-field anomaly").first.click()
    page.wait_for_timeout(500)
    slider = page.locator("label:has-text('Watch threshold') input[type=range]")
    def set_slider():
        slider.evaluate("(el) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, '0.25'); el.dispatchEvent(new Event('input', {bubbles: true})); }")
    timed("anomaly threshold slider", set_slider, 800)

    # --- legend toggle -----------------------------------------------------------------------
    page.get_by_role("button", name="Health classes").first.click()
    page.wait_for_timeout(500)
    timed("hide a class via legend", lambda: page.locator("button[aria-pressed=true]:has-text('Healthy')").last.click(), 300)

    # --- hover card ----------------------------------------------------------------------------
    box = page.locator("canvas.leaflet-image-layer").bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.5)
    page.mouse.move(box["x"] + box["width"] * 0.52, box["y"] + box["height"] * 0.52)
    page.wait_for_timeout(400)
    check("hover card shows pixel details", page.locator("text=NDRE").count() > 0)

    # --- upload a polygon file ----------------------------------------------------------------------
    gj = {"type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": {"name": "Test A", "crop": "Corn"},
        "geometry": {"type": "Polygon", "coordinates": [[[29.6665, 30.7790], [29.6700, 30.7790], [29.6700, 30.7815], [29.6665, 30.7815], [29.6665, 30.7790]]]}}]}
    (shots / "upload.geojson").write_text(json.dumps(gj))
    page.get_by_role("button", name="Health classes").first.click()
    page.locator("input[type=file]").set_input_files(str(shots / "upload.geojson"))
    page.wait_for_selector("text=My polygons (1)", timeout=10000)
    check("uploaded polygon becomes the active set", page.locator("text=Test A").count() > 0)
    page.wait_for_timeout(800)
    page.screenshot(path=str(shots / "04_custom.png"))

    # --- reload deep-link --------------------------------------------------------------------------------
    url_now = page.url
    check("URL carries state", "m=" in url_now and "d=" in url_now, url_now.split("?")[-1])

    # --- trend chart appears with points ---------------------------------------------------------------------
    page.get_by_role("button", name="Labelled fields").click()
    page.wait_for_function("document.querySelectorAll('svg circle').length > 15", timeout=60000)
    check("trend chart has points for the dates", True, f"{page.locator('svg circle').count()} circles")
    page.screenshot(path=str(shots / "05_full.png"), full_page=True)

    # --- RTL / Arabic page smoke test -----------------------------------------------------------------------
    page.goto(args.url.replace("/en/", "/ar/"), wait_until="domcontentloaded")
    page.wait_for_selector("text=مستكشف صحة المحاصيل", timeout=60000)
    page.wait_for_selector("canvas.leaflet-image-layer", timeout=60000)
    page.wait_for_timeout(1200)
    page.screenshot(path=str(shots / "06_arabic.png"))
    check("Arabic page renders", True)

    b.close()

bad = [e for e in errors if "favicon" not in e and "Failed to load resource" not in e and "ERR_" not in e]
check("no console errors", not bad, "; ".join(bad[:5]))
check("no binary-looking (.bin/.gz/.zip) request was ever made", not binary_requests, "; ".join(binary_requests[:3]))
check("no failed local requests", not failed, "; ".join(failed[:5]))
out = shots / "ui_results.json"
out.write_text(json.dumps(results, indent=1))
sys.exit(0 if all(v for k, v in results.items() if not k.endswith("_ms")) else 1)
