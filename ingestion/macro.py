"""
macro.py — Ingest macro indicators (FRED + World Bank) → Supabase
Run: python3 ingestion/macro.py
Schedule: daily (macro data is slow-moving)
"""

import os
import requests
from datetime import datetime

try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
WB_BASE   = "https://api.worldbank.org/v2/country/TH/indicator"

FRED_SERIES = {
    "us_fed_rate":      "FEDFUNDS",
    "us_10y_treasury":  "GS10",
    "us_unemployment":  "UNRATE",
    "us_cpi_index":     "CPIAUCSL",
    "usd_index":        "DTWEXBGS",
}

WORLDBANK_INDICATORS = {
    "th_gdp_growth":   "NY.GDP.MKTP.KD.ZG",
    "th_cpi_inflation":"FP.CPI.TOTL.ZG",
}


def fred_latest(series_id: str, api_key: str) -> float | None:
    try:
        r = requests.get(FRED_BASE, params={
            "series_id": series_id,
            "api_key": api_key,
            "file_type": "json",
            "sort_order": "desc",
            "limit": 1,
        }, timeout=10)
        r.raise_for_status()
        obs = r.json().get("observations", [])
        val = obs[0].get("value") if obs else None
        return float(val) if val and val != "." else None
    except Exception as e:
        print(f"  FRED error {series_id}: {e}")
        return None


def worldbank_latest(indicator: str) -> float | None:
    try:
        r = requests.get(f"{WB_BASE}/{indicator}", params={
            "format": "json", "mrv": 1, "per_page": 1,
        }, timeout=10)
        r.raise_for_status()
        data = r.json()
        value = data[1][0].get("value") if len(data) > 1 and data[1] else None
        return float(value) if value is not None else None
    except Exception as e:
        print(f"  World Bank error {indicator}: {e}")
        return None


def ingest_macro():
    fred_key = os.environ.get("FRED_API_KEY", "")
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    db = create_client(supabase_url, supabase_key) if (HAS_SUPABASE and supabase_url) else None

    rows = []
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # FRED
    if fred_key:
        for key, series_id in FRED_SERIES.items():
            value = fred_latest(series_id, fred_key)
            if value is not None:
                rows.append({
                    "key": key,
                    "value": value,
                    "date": today,
                    "updated_at": datetime.utcnow().isoformat(),
                })
                print(f"  {key}: {value}")
    else:
        print("  FRED_API_KEY not set — skipping FRED")

    # World Bank
    for key, indicator in WORLDBANK_INDICATORS.items():
        value = worldbank_latest(indicator)
        if value is not None:
            rows.append({
                "key": key,
                "value": value,
                "date": today,
                "updated_at": datetime.utcnow().isoformat(),
            })
            print(f"  {key}: {value}")

    if db and rows:
        db.table("macro_indicators").upsert(rows, on_conflict="key").execute()
        print(f"\nUpserted {len(rows)} macro rows")
    else:
        print(f"\nDry run — {len(rows)} indicators fetched")


if __name__ == "__main__":
    ingest_macro()
