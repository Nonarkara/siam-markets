"""
track_dream.py — Daily tracker for the Dream Portfolio proxies.

Each fund in src/lib/portfolio-data.ts is paired with a yfinance PROXY (the
index / ETF that drives it). Thai mutual-fund NAVs aren't on yfinance, so we
track the proxy — the actual market driver — and let the patterns compound
over time. Appends to src/lib/data/cache/dream-history.json.

Run daily on the M3 (markets close late ICT, so evening is fine):

    0 22 * * 1-5  cd "<repo>" && python ingestion/track_dream.py

Deps: pip install -r ingestion/requirements_opt.txt  (yfinance, pandas)
"""

from __future__ import annotations

import json
import datetime
from pathlib import Path

import pandas as pd
import yfinance as yf

# Unique proxies across both books (real + dream). Keep in sync with the
# `proxy` fields in src/lib/portfolio-data.ts.
PROXIES: dict[str, str] = {
    "SOXX":    "Semiconductors",
    "BITQ":    "Blockchain equities",
    "QQQ":     "Nasdaq-100 / US tech",
    "MCHI":    "China equity",
    "VNM":     "Vietnam equity",
    "^SET.BK": "Thai SET",
    "EWJ":     "Japan equity",
    "ACWI":    "Global all-world",
    "GLD":     "Gold",
    "URTH":    "Global brands / world",
    "INDA":    "India equity",
}

OUT = Path(__file__).resolve().parents[1] / "src" / "lib" / "data" / "cache" / "dream-history.json"


def main() -> None:
    today = datetime.date.today().isoformat()
    existing: dict = {}
    if OUT.exists():
        existing = json.loads(OUT.read_text())
    series: dict[str, list] = existing.get("series", {})

    tickers = list(PROXIES.keys())
    raw = yf.download(tickers, period="1mo", interval="1d", auto_adjust=True, progress=False)
    close = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw

    latest: dict[str, dict] = {}
    for tk in tickers:
        try:
            col = close[tk].dropna()
            if col.empty:
                continue
            price = float(col.iloc[-1])
            mtd = float((col.iloc[-1] / col.iloc[0] - 1) * 100)
        except Exception:
            continue
        latest[tk] = {"close": round(price, 2), "mtdPct": round(mtd, 2), "label": PROXIES[tk]}
        s = series.setdefault(tk, [])
        if not s or s[-1]["date"] != today:
            s.append({"date": today, "close": round(price, 2)})
        series[tk] = s[-400:]  # cap ~18 months of trading days

    payload = {"lastRun": today, "proxies": latest, "series": series}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {OUT} · {len(latest)}/{len(tickers)} proxies · {today}")


if __name__ == "__main__":
    main()
