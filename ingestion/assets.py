"""
assets.py — Ingest global asset class data + compute risk metrics → Supabase
Uses: yfinance + pandas-ta + empyrical (inspired by quantstats/ffn/pyfolio)

Install: pip install yfinance pandas pandas-ta empyrical supabase requests
Run: python3 ingestion/assets.py
Schedule: daily 18:30 Bangkok time
"""

import os
from datetime import datetime, timedelta

try:
    import yfinance as yf
    import pandas as pd
    import numpy as np
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False
    print("Install: pip install yfinance pandas numpy")

try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

# ─── Asset symbols ────────────────────────────────────────────────

ASSET_SYMBOLS = {
    "Gold":        "GC=F",
    "Silver":      "SI=F",
    "Oil WTI":     "CL=F",
    "Natural Gas": "NG=F",
    "Copper":      "HG=F",
    "Bitcoin":     "BTC-USD",
    "VIX":         "^VIX",
    "US 10Y":      "^TNX",
    "US 2Y":       "^IRX",
    "USD Index":   "DX-Y.NYB",
}

SET50_SYMBOLS = [
    "PTT.BK", "ADVANC.BK", "KBANK.BK", "SCB.BK", "BBL.BK",
    "CPALL.BK", "GULF.BK", "PTTGC.BK", "SCC.BK", "MINT.BK",
    "CPN.BK", "HMPRO.BK", "AOT.BK", "TRUE.BK", "RATCH.BK",
]

# ─── Risk metrics (from empyrical / quantstats concepts) ──────────

def sharpe_ratio(returns: pd.Series, risk_free_annual: float = 0.03) -> float:
    """Annualized Sharpe ratio — excess return per unit of total risk."""
    if len(returns) < 10:
        return 0.0
    daily_rf = risk_free_annual / 252
    excess = returns - daily_rf
    std = excess.std()
    if std == 0:
        return 0.0
    return (excess.mean() / std) * (252 ** 0.5)


def sortino_ratio(returns: pd.Series, risk_free_annual: float = 0.03) -> float:
    """Sortino ratio — penalizes only downside volatility."""
    if len(returns) < 10:
        return 0.0
    daily_rf = risk_free_annual / 252
    excess = returns - daily_rf
    downside = excess[excess < 0]
    downside_std = downside.std() if len(downside) > 1 else 0.0
    if downside_std == 0:
        return excess.mean() * 252 if excess.mean() > 0 else 0.0
    return (excess.mean() / downside_std) * (252 ** 0.5)


def max_drawdown(prices: pd.Series) -> float:
    """Maximum drawdown from peak. Returns negative number."""
    rolling_max = prices.cummax()
    drawdown = (prices - rolling_max) / rolling_max
    return drawdown.min()


def calmar_ratio(prices: pd.Series) -> float:
    """Annualized return / |max drawdown| — recovery speed metric."""
    returns = prices.pct_change().dropna()
    if len(prices) < 2:
        return 0.0
    total_return = (prices.iloc[-1] / prices.iloc[0]) - 1
    periods = len(prices) / 252
    annualized = (1 + total_return) ** (1 / max(periods, 0.01)) - 1
    dd = abs(max_drawdown(prices))
    return annualized / dd if dd > 0 else 0.0


def annualized_vol(returns: pd.Series) -> float:
    """Annualized volatility."""
    return returns.std() * (252 ** 0.5)


def var_95(returns: pd.Series) -> float:
    """Value at Risk at 95% confidence (parametric)."""
    return returns.mean() - 1.645 * returns.std()


def rolling_correlation(a: pd.Series, b: pd.Series, window: int = 60) -> float:
    """Rolling Pearson correlation over last `window` periods."""
    n = min(len(a), len(b), window)
    if n < 10:
        return 0.0
    return a.iloc[-n:].corr(b.iloc[-n:])


# ─── Main ingestion ───────────────────────────────────────────────

def ingest_assets():
    if not HAS_DEPS:
        return

    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    db = create_client(supabase_url, supabase_key) if (HAS_SUPABASE and supabase_url) else None

    end   = datetime.utcnow()
    start = end - timedelta(days=365)

    print(f"Downloading {len(ASSET_SYMBOLS)} asset symbols...")

    # Download all asset class data
    symbols_list = list(ASSET_SYMBOLS.values()) + [f"^SET.BK"] + SET50_SYMBOLS[:5]
    raw = yf.download(symbols_list, start=start.strftime("%Y-%m-%d"), end=end.strftime("%Y-%m-%d"),
                      progress=False, auto_adjust=True)

    closes = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw

    # ── Asset class quotes ────────────────────────────────────────
    asset_rows = []
    for name, sym in ASSET_SYMBOLS.items():
        try:
            series = closes[sym].dropna()
            if len(series) < 2:
                continue
            price     = float(series.iloc[-1])
            prev      = float(series.iloc[-2])
            pct_chg   = (price - prev) / prev * 100
            returns   = series.pct_change().dropna()
            sharpe    = sharpe_ratio(returns)
            vol_ann   = annualized_vol(returns)

            asset_rows.append({
                "symbol":       sym,
                "name":         name,
                "price":        round(price, 4),
                "change_pct":   round(pct_chg, 4),
                "sharpe_252d":  round(sharpe, 3),
                "vol_ann":      round(vol_ann, 4),
                "date":         series.index[-1].strftime("%Y-%m-%d"),
                "updated_at":   datetime.utcnow().isoformat(),
            })
            print(f"  {name:15} {price:12.3f}  {pct_chg:+.2f}%  sharpe={sharpe:.2f}")
        except Exception as e:
            print(f"  {name}: error — {e}")

    # ── SET50 risk metrics ────────────────────────────────────────
    risk_rows = []
    for sym in SET50_SYMBOLS[:10]:
        try:
            if sym not in closes.columns:
                continue
            prices  = closes[sym].dropna()
            returns = prices.pct_change().dropna()
            if len(prices) < 50:
                continue

            risk_rows.append({
                "symbol":       sym,
                "sharpe_252d":  round(sharpe_ratio(returns), 3),
                "sortino_252d": round(sortino_ratio(returns), 3),
                "max_dd":       round(float(max_drawdown(prices)), 4),
                "calmar":       round(calmar_ratio(prices), 3),
                "vol_ann":      round(annualized_vol(returns), 4),
                "var_95":       round(float(var_95(returns)), 5),
                "date":         prices.index[-1].strftime("%Y-%m-%d"),
                "updated_at":   datetime.utcnow().isoformat(),
            })
            print(f"  {sym:15} sharpe={risk_rows[-1]['sharpe_252d']:.2f}  "
                  f"sortino={risk_rows[-1]['sortino_252d']:.2f}  "
                  f"maxdd={risk_rows[-1]['max_dd']*100:.1f}%")
        except Exception as e:
            print(f"  {sym}: risk error — {e}")

    # ── SET correlations ──────────────────────────────────────────
    corr_rows = []
    try:
        set_series = closes.get("^SET.BK", pd.Series(dtype=float)).dropna()
        if len(set_series) > 20:
            set_ret = set_series.pct_change().dropna()
            for name, sym in ASSET_SYMBOLS.items():
                if sym not in closes.columns:
                    continue
                asset_ret = closes[sym].pct_change().dropna()
                corr_60d  = rolling_correlation(set_ret, asset_ret, 60)
                corr_20d  = rolling_correlation(set_ret, asset_ret, 20)
                corr_rows.append({
                    "base_symbol":   "^SET.BK",
                    "quote_symbol":  sym,
                    "quote_name":    name,
                    "corr_60d":      round(corr_60d, 4),
                    "corr_20d":      round(corr_20d, 4),
                    "date":          set_series.index[-1].strftime("%Y-%m-%d"),
                    "updated_at":    datetime.utcnow().isoformat(),
                })
                print(f"  SET vs {name:15} 60d={corr_60d:+.3f}  20d={corr_20d:+.3f}")
    except Exception as e:
        print(f"  Correlation error: {e}")

    # ── Write to Supabase ─────────────────────────────────────────
    if db:
        if asset_rows:
            db.table("asset_quotes").upsert(asset_rows, on_conflict="symbol").execute()
            print(f"\n✓ Upserted {len(asset_rows)} asset quotes")
        if risk_rows:
            db.table("risk_metrics").upsert(risk_rows, on_conflict="symbol").execute()
            print(f"✓ Upserted {len(risk_rows)} risk metric rows")
        if corr_rows:
            db.table("correlations").upsert(corr_rows, on_conflict="base_symbol,quote_symbol").execute()
            print(f"✓ Upserted {len(corr_rows)} correlation rows")
    else:
        print(f"\nDry run — {len(asset_rows)} assets, {len(risk_rows)} risk rows, {len(corr_rows)} correlation rows")


if __name__ == "__main__":
    ingest_assets()
