"""
prices.py — Ingest SET50 daily price data → Supabase
Run: python3 ingestion/prices.py
Schedule: daily after 18:00 Bangkok time (SET closes at 16:30)
"""

import os
import json
from datetime import datetime, timedelta

try:
    import yfinance as yf
    from supabase import create_client
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False
    print("Install: pip install yfinance supabase")

SET50_TICKERS = [
    "PTT.BK", "ADVANC.BK", "KBANK.BK", "SCB.BK", "BBL.BK",
    "CPALL.BK", "GULF.BK", "PTTGC.BK", "SCC.BK", "MINT.BK",
    "CPN.BK", "HMPRO.BK", "AOT.BK", "TRUE.BK", "RATCH.BK",
    "KTC.BK", "BH.BK", "DELTA.BK", "TIDLOR.BK", "WHA.BK",
    "BDMS.BK", "BJC.BK", "CPAXT.BK", "BGRIM.BK", "PTTEP.BK",
]

GLOBAL_TICKERS = ["^GSPC", "^N225", "^HSI", "^ESTI", "^SET.BK"]


def ingest_prices():
    if not HAS_DEPS:
        return

    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not supabase_url or not supabase_key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars")
        return

    db = create_client(supabase_url, supabase_key)
    today = datetime.utcnow().strftime("%Y-%m-%d")
    start = (datetime.utcnow() - timedelta(days=35)).strftime("%Y-%m-%d")

    all_tickers = SET50_TICKERS + GLOBAL_TICKERS
    print(f"Downloading {len(all_tickers)} tickers from {start} to {today}...")

    data = yf.download(all_tickers, start=start, end=today, progress=False)

    rows = []
    for ticker in all_tickers:
        try:
            closes = data["Close"][ticker].dropna()
            for date, price in closes.items():
                rows.append({
                    "symbol": ticker,
                    "date": date.strftime("%Y-%m-%d"),
                    "close": float(price),
                    "updated_at": datetime.utcnow().isoformat(),
                })
        except Exception as e:
            print(f"  Skipped {ticker}: {e}")

    if rows:
        # Upsert — safe to run repeatedly
        db.table("prices").upsert(rows, on_conflict="symbol,date").execute()
        print(f"Upserted {len(rows)} price rows")
    else:
        print("No price rows to insert")


if __name__ == "__main__":
    ingest_prices()
