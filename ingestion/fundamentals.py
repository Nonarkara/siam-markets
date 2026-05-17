"""
fundamentals.py — Ingest SET50 Graham/Buffett metrics → Supabase via FMP
Run: python3 ingestion/fundamentals.py
Schedule: daily (FMP fundamentals update quarterly; daily is fine)
"""

import os
import math
import requests
from datetime import datetime

try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

FMP_BASE = "https://financialmodelingprep.com/api/v3"

SET50_TICKERS = [
    "PTT.BK", "ADVANC.BK", "KBANK.BK", "SCB.BK", "BBL.BK",
    "CPALL.BK", "GULF.BK", "PTTGC.BK", "SCC.BK", "MINT.BK",
    "CPN.BK", "HMPRO.BK", "AOT.BK", "TRUE.BK", "RATCH.BK",
]


def graham_number(eps: float, bvps: float) -> float:
    if eps <= 0 or bvps <= 0:
        return 0.0
    return math.sqrt(22.5 * eps * bvps)


def margin_of_safety(price: float, gn: float) -> float:
    if gn <= 0:
        return -100.0
    return ((gn - price) / gn) * 100


def fmp_get(path: str, api_key: str) -> dict | list | None:
    url = f"{FMP_BASE}{path}"
    sep = "&" if "?" in path else "?"
    try:
        r = requests.get(f"{url}{sep}apikey={api_key}", timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  FMP error {path}: {e}")
        return None


def ingest_fundamentals():
    fmp_key = os.environ.get("FMP_API_KEY", "")
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not fmp_key:
        print("Set FMP_API_KEY env var (free at financialmodelingprep.com)")
        return

    db = create_client(supabase_url, supabase_key) if (HAS_SUPABASE and supabase_url) else None

    rows = []
    for symbol in SET50_TICKERS:
        print(f"  Fetching {symbol}...")

        profile_data = fmp_get(f"/profile/{symbol}", fmp_key)
        metrics_data = fmp_get(f"/key-metrics/{symbol}?limit=1", fmp_key)

        profile  = profile_data[0] if isinstance(profile_data, list) and profile_data else {}
        metrics  = metrics_data[0] if isinstance(metrics_data, list) and metrics_data else {}

        price  = float(profile.get("price", 0))
        eps    = float(profile.get("eps", 0))
        bvps   = float(metrics.get("bookValuePerShare", 0))
        pe     = float(metrics.get("peRatio", metrics.get("pe", 0)) or 0)
        pb     = float(metrics.get("pbRatio", metrics.get("pb", 0)) or 0)
        roe    = float(metrics.get("roe", 0)) * 100  # convert to %
        de     = float(metrics.get("debtToEquity", 0))
        divY   = float(metrics.get("dividendYield", 0)) * 100
        gm     = float(metrics.get("grossProfitMargin", 0)) * 100

        gn  = graham_number(eps, bvps)
        mos = margin_of_safety(price, gn)

        row = {
            "symbol": symbol,
            "name": profile.get("companyName", symbol),
            "sector": profile.get("sector", ""),
            "price": price,
            "eps": eps,
            "bvps": bvps,
            "pe": pe,
            "pb": pb,
            "roe": roe,
            "dividend_yield": divY,
            "debt_to_equity": de,
            "gross_margin": gm,
            "graham_number": round(gn, 2),
            "margin_of_safety": round(mos, 2),
            "market_cap": float(profile.get("mktCap", 0)),
            "updated_at": datetime.utcnow().isoformat(),
        }
        rows.append(row)
        print(f"    Price={price:.2f} GN={gn:.2f} MOS={mos:.1f}%")

    if db and rows:
        db.table("fundamentals").upsert(rows, on_conflict="symbol").execute()
        print(f"\nUpserted {len(rows)} fundamental rows")
    else:
        print(f"\nDry run — {len(rows)} rows computed (no DB write)")


if __name__ == "__main__":
    ingest_fundamentals()
