"""
optimize.py — Offline portfolio optimization → static JSON for the edge app.

Runs Riskfolio-Lib over 3 years of SET50 daily returns and writes
src/lib/data/cache/allocation.json. The Cloudflare-edge app imports that JSON
at build time (same pattern as prices.json) — no Python ever runs at runtime.

Output is a REFERENCE ("what cold math wants"), not a recommendation. Mean-
variance optimizers trust their inputs blindly; the edge component frames the
fragility honestly.

Usage:
    pip install -r ingestion/requirements_opt.txt
    python ingestion/optimize.py
"""

from __future__ import annotations

import json
import math
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf
import riskfolio as rp

from prices import SET50_TICKERS  # reuse the canonical universe

LOOKBACK = "3y"
MAX_HEATMAP = 12  # cap correlation matrix for mobile legibility
OUT_PATH = Path(__file__).resolve().parents[1] / "src" / "lib" / "data" / "cache" / "allocation.json"


def fetch_returns() -> pd.DataFrame:
    """Daily simple returns for the SET50 universe, columns = tickers."""
    raw = yf.download(SET50_TICKERS, period=LOOKBACK, interval="1d", auto_adjust=True, progress=False)
    close = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw
    close = close.dropna(axis=1, thresh=int(len(close) * 0.8))  # drop names with too little history
    rets = close.pct_change().dropna(how="all")
    return rets.dropna(axis=1)  # keep only fully-populated columns for a clean covariance


def weights_list(w: pd.DataFrame) -> list[dict]:
    """Riskfolio weights frame → sorted [{symbol, w}] (drops dust < 0.5%)."""
    series = w.iloc[:, 0]
    out = [{"symbol": str(k), "w": round(float(v), 4)} for k, v in series.items() if float(v) >= 0.005]
    out.sort(key=lambda d: d["w"], reverse=True)
    return out


def main() -> None:
    rets = fetch_returns()
    if rets.shape[1] < 5:
        raise SystemExit(f"Not enough usable tickers ({rets.shape[1]}) — aborting.")

    port = rp.Portfolio(returns=rets)
    # Ledoit-Wolf shrinkage covariance — more robust than the raw sample estimate.
    port.assets_stats(method_mu="hist", method_cov="ledoit")

    rm = "MV"  # mean-variance risk measure
    w_sharpe = port.optimization(model="Classic", rm=rm, obj="Sharpe", hist=True)
    w_minvol = port.optimization(model="Classic", rm=rm, obj="MinRisk", hist=True)

    # Hierarchical Risk Parity — estimation-error-robust, no expected-returns input.
    hc = rp.HCPortfolio(returns=rets)
    w_hrp = hc.optimization(model="HRP", rm=rm, rf=0.0, linkage="ward")

    # Efficient frontier (annualized return/vol pairs).
    frontier = port.efficient_frontier(model="Classic", rm=rm, points=24, hist=True)
    mu = port.mu          # daily expected returns (1 x N)
    cov = port.cov        # daily covariance (N x N)
    TR = 252
    fr_points = []
    for col in frontier.columns:
        w = frontier[col].values.reshape(-1, 1)
        r = float((mu.values @ w)[0, 0]) * TR
        v = float(math.sqrt((w.T @ cov.values @ w)[0, 0]) * math.sqrt(TR))
        fr_points.append({"ret": round(r, 4), "vol": round(v, 4)})

    # The max-Sharpe "picked" point, annualized.
    ws = w_sharpe.values.reshape(-1, 1)
    picked_ret = float((mu.values @ ws)[0, 0]) * TR
    picked_vol = float(math.sqrt((ws.T @ cov.values @ ws)[0, 0]) * math.sqrt(TR))
    picked = {
        "ret": round(picked_ret, 4),
        "vol": round(picked_vol, 4),
        "sharpe": round(picked_ret / picked_vol, 2) if picked_vol else 0.0,
    }

    # Correlation heatmap, capped to the max-Sharpe constituents.
    sharpe_names = [d["symbol"] for d in weights_list(w_sharpe)][:MAX_HEATMAP]
    corr = rets[sharpe_names].corr()
    corr_block = {
        "labels": sharpe_names,
        "matrix": [[round(float(corr.iloc[i, j]), 2) for j in range(len(sharpe_names))]
                   for i in range(len(sharpe_names))],
    }

    payload = {
        "generatedAt": date.today().isoformat(),
        "universe": "SET50",
        "lookbackDays": int(len(rets)),
        "weights": {
            "maxSharpe": weights_list(w_sharpe),
            "minVol": weights_list(w_minvol),
            "hrp": weights_list(w_hrp),
        },
        "frontier": sorted(fr_points, key=lambda p: p["vol"]),
        "picked": picked,
        "corr": corr_block,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {OUT_PATH} · {len(rets)} bars · "
          f"{len(payload['weights']['maxSharpe'])} max-Sharpe names · "
          f"picked Sharpe {picked['sharpe']}")


if __name__ == "__main__":
    main()
