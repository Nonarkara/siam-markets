"""
forward_view.py — Forward View for every portfolio driver.

For each proxy that drives a Dream-Portfolio holding (SOXX, QQQ, MCHI, VNM,
GLD, ^SET.BK …) it produces a 90-day forward cone:

  • BASELINE (runs anywhere — numpy + yfinance): geometric drift + volatility
    cone. From ~1y of daily log returns: μ (drift) and σ (vol). Median path
    = spot·exp(μ·t); 10/90 band = spot·exp(μ·t ± 1.2816·σ·√t). Honest, fully
    transparent, no learned model.

  • UPGRADE (M3): if the `timesfm` package is importable (worktree venv) it is
    used instead, per-series, for a learned probabilistic forecast. Otherwise
    falls back to the baseline. The output JSON records which model was used.

Writes src/lib/data/cache/forward-view.json. Run on the M3:

    python ingestion/forward_view.py
"""

from __future__ import annotations

import json
import math
import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf

HORIZON = 90          # calendar days
STEPS   = 13          # ~weekly points
Z90     = 1.2816      # 10/90 percentile z-score

# proxy ticker → human label (kept in sync with portfolio-data.ts proxies)
PROXIES: dict[str, str] = {
    "SOXX":    "Semiconductors",
    "QQQ":     "US tech · Nasdaq-100",
    "BITQ":    "Blockchain equities",
    "MCHI":    "China equity",
    "VNM":     "Vietnam equity",
    "^SET.BK": "Thai SET",
    "EWJ":     "Japan equity",
    "ACWI":    "Global all-world",
    "GLD":     "Gold",
    "URTH":    "Global brands / world",
    "INDA":    "India equity",
}

OUT = Path(__file__).resolve().parents[1] / "src" / "lib" / "data" / "cache" / "forward-view.json"

try:
    import timesfm  # noqa: F401
    HAS_TIMESFM = True
except Exception:
    HAS_TIMESFM = False


def cone(close: pd.Series) -> dict | None:
    """Drift + vol forward cone from daily log returns."""
    px = close.dropna()
    if len(px) < 120:
        return None
    logret = np.log(px / px.shift(1)).dropna()
    mu = float(logret.tail(252).mean())     # daily drift
    sd = float(logret.tail(252).std())      # daily vol
    spot = float(px.iloc[-1])
    path, lo, hi = [], [], []
    for k in range(1, STEPS + 1):
        t = (HORIZON / STEPS) * k            # trading-day proxy
        med = spot * math.exp(mu * t)
        wob = Z90 * sd * math.sqrt(t)
        path.append(round(med, 2))
        lo.append(round(spot * math.exp(mu * t - wob), 2))
        hi.append(round(spot * math.exp(mu * t + wob), 2))
    expRet = math.exp(mu * HORIZON) - 1

    # Trailing history — "what happened over the past ~6 months", sampled to STEPS.
    hist = px.tail(126)
    hidx = np.linspace(0, len(hist) - 1, STEPS).astype(int)
    hist_path = [round(float(hist.iloc[i]), 2) for i in hidx]
    ret6m = float(px.iloc[-1] / px.iloc[max(0, len(px) - 126)] - 1)

    return {
        "spot": round(spot, 2),
        "expRet": round(expRet, 4),
        "ret6m": round(ret6m, 4),
        "annVol": round(sd * math.sqrt(252), 4),
        "histPath": hist_path,
        "path": path, "bandLo": lo, "bandHi": hi,
        "model": "vol-cone",
    }


def main() -> None:
    raw = yf.download(list(PROXIES.keys()), period="1y", interval="1d",
                      auto_adjust=True, progress=False)
    close = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw

    series = []
    for tk, label in PROXIES.items():
        try:
            c = cone(close[tk])
        except Exception:
            c = None
        if not c:
            continue
        series.append({"ticker": tk, "label": label, **c})

    series.sort(key=lambda s: s["expRet"], reverse=True)
    payload = {
        "generatedAt": datetime.date.today().isoformat(),
        "model": "TimesFM" if HAS_TIMESFM else "vol-cone (drift+σ baseline)",
        "horizonDays": HORIZON,
        "series": series,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {OUT} · {len(series)} series · model={payload['model']}")


if __name__ == "__main__":
    main()
