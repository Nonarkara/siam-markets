import os
import json
from datetime import datetime, timedelta

try:
    import yfinance as yf
except ImportError:
    print("Please install yfinance: pip install yfinance")
    exit(1)

SET50_TICKERS = [
    "PTT.BK", "ADVANC.BK", "KBANK.BK", "SCB.BK", "BBL.BK",
    "CPALL.BK", "GULF.BK", "PTTGC.BK", "SCC.BK", "MINT.BK",
    "CPN.BK", "HMPRO.BK", "AOT.BK", "TRUE.BK", "RATCH.BK",
    "KTC.BK", "BH.BK", "DELTA.BK", "TIDLOR.BK", "WHA.BK",
    "BDMS.BK", "BJC.BK", "CPAXT.BK", "BGRIM.BK", "PTTEP.BK",
]
GLOBAL_TICKERS = ["^GSPC", "^N225", "^HSI", "^ESTI", "^SET.BK"]

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "lib", "data", "cache")

def ensure_dir():
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

def fetch_prices():
    print("Fetching OHLCV Prices...")
    today = datetime.utcnow().strftime("%Y-%m-%d")
    start = (datetime.utcnow() - timedelta(days=90)).strftime("%Y-%m-%d")

    all_tickers = SET50_TICKERS + GLOBAL_TICKERS
    data = yf.download(all_tickers, start=start, end=today, progress=False)

    prices_dict = {}
    for ticker in all_tickers:
        try:
            # yf.download with multiple tickers returns a MultiIndex column DataFrame
            df = data.xs(ticker, axis=1, level=1).dropna()
            points = []
            for date, row in df.iterrows():
                points.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                    "volume": float(row["Volume"])
                })
            prices_dict[ticker] = points
            print(f"  ✓ {ticker}: {len(points)} bars")
        except Exception as e:
            print(f"  x Failed {ticker}: {e}")

    out_file = os.path.join(CACHE_DIR, "prices.json")
    with open(out_file, "w") as f:
        json.dump(prices_dict, f, indent=2)
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    ensure_dir()
    fetch_prices()
    # Mocking Fundamentals and Macro for now to ensure system boots
    with open(os.path.join(CACHE_DIR, "macro.json"), "w") as f:
        json.dump({"US_FED_RATE": 5.25, "TH_BOT_RATE": 2.50, "THB_USD": 36.5}, f, indent=2)
    with open(os.path.join(CACHE_DIR, "fundamentals.json"), "w") as f:
        json.dump({"PTT.BK": {"pe": 10.5, "pb": 0.8, "roe": 12.0}}, f, indent=2)
