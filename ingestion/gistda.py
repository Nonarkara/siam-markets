"""
gistda.py — GISTDA Thailand geospatial data ingestion.

Three priority streams, all routed to Supabase:

  1. gistda_hotspots   — daily fire hotspots (MODIS + VIIRS 375m)
  2. gistda_floods     — daily flood extent polygons (current + historical)
  3. gistda_airquality — hourly PM2.5 / AQI by province

Why these three:
  • Hotspots: real-time leading indicator for agriculture/energy sector stocks
    (KSL, KTIS, TVO, TRUBB) and insurance premium risk.
  • Floods: polygon intersect against industrial/plantation zones → WHA, AMATA,
    KSL exposure flags before quarterly earnings.
  • Air quality: Northern Thailand PM2.5 spikes (Feb–Apr haze) → tourist arrivals
    fall → CENTEL, MINT, ERW, DELTA revenue risk 4–8 weeks later.

ArcGIS Portal endpoints require NO API KEY. Sphere services use GISTDA_API_KEY.

Run daily: python3 ingestion/gistda.py
"""

import os, json, requests
from datetime import date, datetime
from typing import Optional

GISTDA_KEY = os.getenv("GISTDA_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

PORTAL_BASE = "https://gistdaportal.gistda.or.th/data/rest/services"
SPHERE_BASE = "https://api.sphere.gistda.or.th/services"

# Thailand bounding box (WGS84)
THAILAND_BBOX = "97.539,5.772,105.443,20.315"

try:
    from supabase import create_client
    HAS_SUPABASE = bool(SUPABASE_URL)
except ImportError:
    HAS_SUPABASE = False


def portal_query(path: str, bbox: str = THAILAND_BBOX,
                  extra: Optional[dict] = None) -> dict:
    """Query GISTDA ArcGIS Portal FeatureServer/MapServer. No key needed."""
    url = f"{PORTAL_BASE}/{path}/query"
    params = {
        "where": "1=1",
        "outFields": "*",
        "geometry": bbox,
        "geometryType": "esriGeometryEnvelope",
        "spatialRel": "esriSpatialRelIntersects",
        "f": "geojson",
    }
    if extra:
        params.update(extra)
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  Portal error {path}: {e}")
        return {}


def sphere_get(endpoint: str, params: dict) -> dict:
    """Query GISTDA Sphere REST API with API key."""
    if not GISTDA_KEY:
        print("  GISTDA_API_KEY not set — skipping Sphere call")
        return {}
    params["key"] = GISTDA_KEY
    try:
        r = requests.get(f"{SPHERE_BASE}/{endpoint}", params=params, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  Sphere error {endpoint}: {e}")
        return {}


# ─── 1. Fire hotspots ─────────────────────────────────────────

def fetch_hotspots() -> list[dict]:
    """
    Fetch today's MODIS + VIIRS hotspots over Thailand.
    Returns simplified list for Supabase insertion.
    """
    today = date.today().isoformat()
    rows = []

    for source, path in [
        ("MODIS",  "FR_Fire/hotspot_daily/MapServer/0"),
        ("VIIRS",  "FR_Fire/hotspot_npp_daily/MapServer/0"),
    ]:
        data = portal_query(path)
        features = data.get("features", [])
        print(f"  {source}: {len(features)} hotspots")
        for f in features:
            p = f.get("properties", {})
            g = f.get("geometry", {})
            coords = g.get("coordinates", [])
            rows.append({
                "date":        today,
                "source":      source,
                "lon":         coords[0] if len(coords) > 0 else None,
                "lat":         coords[1] if len(coords) > 1 else None,
                "brightness":  p.get("BRIGHT_T31") or p.get("BRIGHT_TI4"),
                "confidence":  p.get("CONFIDENCE") or p.get("CONF"),
                "satellite":   p.get("SATELLITE") or p.get("SATELLITE_NAME"),
                "acq_date":    p.get("ACQ_DATE") or p.get("DATE") or today,
                "frp":         p.get("FRP"),   # fire radiative power
                "province":    p.get("PROV_NAM") or p.get("PROVINCE"),
                "raw":         json.dumps(p)[:500],   # truncated raw properties
            })

    return rows


def store_hotspots(rows: list[dict]) -> None:
    today = date.today().isoformat()
    if not rows:
        return
    if not HAS_SUPABASE:
        print(f"  [hotspots] {len(rows)} rows computed (no Supabase). Sample:")
        print(f"    {rows[0]}")
        return
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    sb.table("gistda_hotspots").delete().eq("date", today).execute()
    for i in range(0, len(rows), 100):
        sb.table("gistda_hotspots").insert(rows[i:i+100]).execute()
    print(f"  ✓ {len(rows)} hotspot rows stored")


# ─── 2. Flood extent ──────────────────────────────────────────

def fetch_flood_extent() -> list[dict]:
    """
    Fetch today's flood polygon extent.
    Returns province-level flood summary.
    """
    today = date.today().isoformat()
    rows = []

    for region, path in [
        ("national",  "FL_Flood/flood_daily/MapServer/0"),
        ("central",   "FL_Flood/flood_daily_c/MapServer/0"),
        ("northeast", "FL_Flood/flood_daily_ne/MapServer/0"),
    ]:
        data = portal_query(path)
        features = data.get("features", [])
        print(f"  Flood {region}: {len(features)} features")

        total_area_km2 = 0.0
        provinces = set()
        for f in features:
            p = f.get("properties", {})
            area = p.get("AREA_KM") or p.get("AREA") or p.get("Shape_Area") or 0
            try:
                total_area_km2 += float(area)
            except (TypeError, ValueError):
                pass
            prov = p.get("PROVINCE") or p.get("PROV_NAM") or p.get("ProvinceTH")
            if prov:
                provinces.add(str(prov))

        rows.append({
            "date":          today,
            "region":        region,
            "feature_count": len(features),
            "total_area_km2": round(total_area_km2, 2),
            "provinces":     list(provinces)[:30],
            "raw_sample":    json.dumps(features[0].get("properties", {}) if features else {})[:500],
        })

    return rows


def store_flood_extent(rows: list[dict]) -> None:
    today = date.today().isoformat()
    if not rows:
        return
    if not HAS_SUPABASE:
        print("  [flood] Rows computed (no Supabase):")
        for r in rows:
            print(f"    {r['region']}: {r['feature_count']} features, {r['total_area_km2']} km²")
        return
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    sb.table("gistda_floods").delete().eq("date", today).execute()
    sb.table("gistda_floods").insert(rows).execute()
    print(f"  ✓ {len(rows)} flood rows stored")


# ─── 3. Air quality ───────────────────────────────────────────

def fetch_air_quality() -> list[dict]:
    """
    Fetch latest hourly PM2.5 readings from all PCD stations in Thailand.
    """
    today = date.today().isoformat()
    data = portal_query("FR_Fire/AirQuality_hourly/MapServer/0")
    features = data.get("features", [])
    print(f"  Air quality: {len(features)} stations")

    rows = []
    for f in features:
        p = f.get("properties", {})
        g = f.get("geometry", {})
        coords = g.get("coordinates", [])

        # Different API versions use different field names
        pm25 = (p.get("PM2_5") or p.get("PM25") or
                p.get("pm2_5") or p.get("pm25") or
                p.get("VALUE") or p.get("value"))

        rows.append({
            "date":       today,
            "station_id": p.get("STATION_ID") or p.get("station_id") or p.get("ID"),
            "station":    p.get("STATION_NAME") or p.get("station_name") or p.get("NAME"),
            "province":   p.get("PROVINCE") or p.get("province") or p.get("PROV_NAM"),
            "lon":        coords[0] if len(coords) > 0 else None,
            "lat":        coords[1] if len(coords) > 1 else None,
            "pm25_ugm3":  float(pm25) if pm25 is not None else None,
            "aqi":        p.get("AQI") or p.get("aqi"),
            "aqi_level":  p.get("AQI_LEVEL") or p.get("LEVEL"),
            "timestamp":  p.get("DATETIMESTR") or p.get("DATETIME") or datetime.now().isoformat(),
            "raw":        json.dumps(p)[:300],
        })

    return rows


def store_air_quality(rows: list[dict]) -> None:
    today = date.today().isoformat()
    if not rows:
        return
    if not HAS_SUPABASE:
        if rows:
            highs = [r for r in rows if r.get("pm25_ugm3") and float(r["pm25_ugm3"]) > 50]
            print(f"  [air] {len(rows)} stations · {len(highs)} with PM2.5 > 50 µg/m³")
        return
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    sb.table("gistda_airquality").delete().eq("date", today).execute()
    for i in range(0, len(rows), 100):
        sb.table("gistda_airquality").insert(rows[i:i+100]).execute()
    print(f"  ✓ {len(rows)} air quality rows stored")


# ─── 4. Sphere elevation (single point, example usage) ────────

def get_elevation(lon: float, lat: float) -> Optional[float]:
    """Get elevation in metres for a coordinate. Requires GISTDA_API_KEY."""
    data = sphere_get("geo/elevation", {"lon": lon, "lat": lat})
    try:
        return float(data["data"]["elevation"])
    except (KeyError, TypeError, ValueError):
        return None


# ─── Derived sector signals ───────────────────────────────────

def compute_sector_signals(hotspots: list[dict], floods: list[dict],
                            airquality: list[dict]) -> dict:
    """
    Distil raw GISTDA data into sector-level risk flags.
    Returns a dict of {sector: {score, reason}} suitable for the dashboard.
    """
    signals = {}

    # AGRICULTURE — hotspot count + flood NE area
    agri_hotspots = len([h for h in hotspots if h.get("confidence") and
                         str(h["confidence"]).upper() in ("HIGH", "H", "100", "80", "NOMINAL")])
    ne_flood_km2 = next((f["total_area_km2"] for f in floods if f["region"] == "northeast"), 0)
    agri_score = min(100, agri_hotspots * 0.4 + ne_flood_km2 * 0.02)
    signals["AGRICULTURE"] = {
        "score": round(agri_score, 1),
        "color": "var(--bear)" if agri_score > 40 else "var(--caution)" if agri_score > 15 else "var(--bull)",
        "reason": f"{agri_hotspots} high-conf hotspots · {ne_flood_km2:.0f} km² NE flood",
        "affected": ["KSL", "KTIS", "TVO", "TRUBB", "CPF"],
    }

    # TOURISM — PM2.5 in Northern Thailand
    north_pm25 = []
    north_provinces = {"เชียงใหม่", "เชียงราย", "แม่ฮ่องสอน", "ลำพูน", "ลำปาง",
                        "Chiang Mai", "Chiang Rai", "Mae Hong Son", "Lamphun", "Lampang"}
    for aq in airquality:
        if aq.get("province") in north_provinces and aq.get("pm25_ugm3"):
            try:
                north_pm25.append(float(aq["pm25_ugm3"]))
            except (TypeError, ValueError):
                pass
    avg_pm25 = sum(north_pm25) / len(north_pm25) if north_pm25 else 0
    tourism_score = min(100, avg_pm25 * 1.2)
    signals["TOURISM"] = {
        "score": round(tourism_score, 1),
        "color": "var(--bear)" if avg_pm25 > 75 else "var(--caution)" if avg_pm25 > 37.5 else "var(--bull)",
        "reason": f"N.Thailand avg PM2.5: {avg_pm25:.1f} µg/m³",
        "affected": ["CENTEL", "MINT", "ERW", "DELTA"],
    }

    # INDUSTRIAL / LOGISTICS — central plain flood
    central_flood_km2 = next((f["total_area_km2"] for f in floods if f["region"] == "central"), 0)
    industrial_score = min(100, central_flood_km2 * 0.05)
    signals["INDUSTRIAL"] = {
        "score": round(industrial_score, 1),
        "color": "var(--bear)" if industrial_score > 30 else "var(--caution)" if industrial_score > 10 else "var(--bull)",
        "reason": f"{central_flood_km2:.0f} km² central plain flooded",
        "affected": ["WHA", "AMATA", "HANA", "DELTA"],
    }

    # ENERGY — total hotspot count (field fires → fuel supply disruption)
    total_hotspots = len(hotspots)
    energy_score = min(100, total_hotspots * 0.03)
    signals["ENERGY"] = {
        "score": round(energy_score, 1),
        "color": "var(--caution)" if energy_score > 20 else "var(--bull)",
        "reason": f"{total_hotspots} total hotspots (field burning → biomass/gas supply)",
        "affected": ["GULF", "BGRIM", "RATCH", "GPSC"],
    }

    return signals


# ─── Summary output ────────────────────────────────────────────

def build_summary(hotspots, floods, airquality) -> dict:
    signals = compute_sector_signals(hotspots, floods, airquality)
    return {
        "as_of":      date.today().isoformat(),
        "hotspots":   len(hotspots),
        "flood_regions": {f["region"]: f["total_area_km2"] for f in floods},
        "air_stations": len(airquality),
        "sector_signals": signals,
    }


# ─── Entry point ───────────────────────────────────────────────

if __name__ == "__main__":
    import sys, argparse

    parser = argparse.ArgumentParser(description="GISTDA data ingestion")
    parser.add_argument("--hotspots",    action="store_true")
    parser.add_argument("--floods",      action="store_true")
    parser.add_argument("--airquality",  action="store_true")
    parser.add_argument("--all",         action="store_true")
    parser.add_argument("--summary",     action="store_true",
                        help="Just compute sector risk signals, no Supabase write")
    args = parser.parse_args()

    print(f"GISTDA Ingestion — {datetime.now().isoformat()}")
    print("=" * 55)

    hotspots_rows = flood_rows = aq_rows = []

    if args.all or args.hotspots:
        print("\n[1] Fire Hotspots")
        hotspots_rows = fetch_hotspots()
        store_hotspots(hotspots_rows)

    if args.all or args.floods:
        print("\n[2] Flood Extent")
        flood_rows = fetch_flood_extent()
        store_flood_extent(flood_rows)

    if args.all or args.airquality:
        print("\n[3] Air Quality")
        aq_rows = fetch_air_quality()
        store_air_quality(aq_rows)

    if args.all or args.summary or (hotspots_rows or flood_rows or aq_rows):
        summary = build_summary(hotspots_rows or [], flood_rows or [], aq_rows or [])
        print("\n── SECTOR RISK SIGNALS ──")
        for sector, sig in summary["sector_signals"].items():
            bar = "█" * int(sig["score"] / 10)
            print(f"  {sector:<14} {bar:<10} {sig['score']:>5.1f}/100  {sig['reason']}")
            print(f"               Affected: {', '.join(sig['affected'])}")

        out = "/".join(__file__.split("/")[:-1]) + "/gistda_latest.json"
        with open(out, "w") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"\nSaved → gistda_latest.json")

    if not any(vars(args).values()):
        parser.print_help()
        print("\nQuick run: python3 ingestion/gistda.py --all")
