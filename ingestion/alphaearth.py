"""
alphaearth.py — AlphaEarth (DeepMind Satellite Embedding) economic signal.

For each Thai economic site in src/lib/data/cache/earth-signal.json it reads
the GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL image collection (AlphaEarth
Foundations — 64-dim per-pixel embeddings), takes the mean embedding vector
over the area for the two most recent years, and measures the change as the
cosine distance between them. A larger shift = more physical change on the
ground (new factories, expanded apron, crop turnover) — a satellite-derived
activity signal mapped to the SET tickers exposed to that site.

Writes the change magnitude back into earth-signal.json (changeYoY 0–1 + an
up/flat/down trend vs the AOI median). No fabrication — if Earth Engine is not
authenticated the file is left in its "pending-gee-auth" state.

ONE-TIME SETUP on the M3 (free for non-commercial use):
    pip install earthengine-api
    earthengine authenticate
    # set your Cloud project:
    export EE_PROJECT="your-gee-project-id"

RUN (annual dataset → monthly cron is plenty):
    python ingestion/alphaearth.py
"""

from __future__ import annotations

import os
import json
import math
import datetime
from pathlib import Path

SIGNAL = Path(__file__).resolve().parents[1] / "src" / "lib" / "data" / "cache" / "earth-signal.json"
DATASET = "GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL"
RADIUS_M = 2500  # sampling radius around each AOI centroid

try:
    import ee
    HAS_EE = True
except Exception:
    HAS_EE = False


def mean_embedding(ee_mod, geom, year: int):
    """Mean 64-dim AlphaEarth embedding over `geom` for the given year."""
    img = (ee_mod.ImageCollection(DATASET)
           .filterDate(f"{year}-01-01", f"{year}-12-31")
           .filterBounds(geom)
           .first())
    if img is None:
        return None
    stats = img.reduceRegion(reducer=ee_mod.Reducer.mean(), geometry=geom,
                             scale=10, maxPixels=1e9, bestEffort=True)
    info = stats.getInfo() or {}
    vec = [v for k, v in sorted(info.items()) if v is not None]
    return vec or None


def cosine_distance(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return round(max(0.0, 1 - dot / (na * nb)), 4)


def main() -> None:
    data = json.loads(SIGNAL.read_text())

    if not HAS_EE:
        print("[alphaearth] earthengine-api not installed — leaving file pending.")
        print("             pip install earthengine-api && earthengine authenticate")
        return

    try:
        ee.Initialize(project=os.getenv("EE_PROJECT") or None)
    except Exception as e:
        print(f"[alphaearth] Earth Engine not authenticated ({e}) — leaving file pending.")
        return

    now_year = datetime.date.today().year
    yr_new, yr_old = now_year - 1, now_year - 2  # annual dataset lags ~1y

    changes = []
    for aoi in data["aois"]:
        geom = ee.Geometry.Point([aoi["lon"], aoi["lat"]]).buffer(RADIUS_M)
        try:
            a = mean_embedding(ee, geom, yr_new)
            b = mean_embedding(ee, geom, yr_old)
            aoi["changeYoY"] = cosine_distance(a, b) if (a and b) else None
        except Exception as e:
            print(f"[alphaearth] {aoi['id']}: {e}")
            aoi["changeYoY"] = None
        if aoi["changeYoY"] is not None:
            changes.append(aoi["changeYoY"])

    # trend = vs the cross-AOI median (relative "more change than peers")
    if changes:
        changes_sorted = sorted(changes)
        med = changes_sorted[len(changes_sorted) // 2]
        for aoi in data["aois"]:
            c = aoi.get("changeYoY")
            aoi["trend"] = None if c is None else ("up" if c > med * 1.15 else "down" if c < med * 0.85 else "flat")

    data["generatedAt"] = datetime.date.today().isoformat()
    data["status"] = "live" if changes else "pending-gee-auth"
    data["yearsCompared"] = [yr_old, yr_new]
    SIGNAL.write_text(json.dumps(data, indent=2))
    print(f"[alphaearth] Wrote {SIGNAL} · {len(changes)}/{len(data['aois'])} AOIs · {yr_old}→{yr_new}")


if __name__ == "__main__":
    main()
