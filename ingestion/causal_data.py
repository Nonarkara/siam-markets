"""
causal_data.py — Fetch and align all time-series needed by the
causal intelligence pipeline.

Returns a single wide DataFrame where every column is a daily I(0)
or near-I(0) series, indexed by date, spanning the requested lookback.

All series are converted to returns / changes before stationarity testing:
  • Price series  (SET, VIX, Gold, Oil)  → log returns
  • Rate series   (Fed rate, Thai CPI)   → absolute first-differences
  • FX series     (THB/USD, DXY)         → log returns
  • Ratio series  (P/E)                  → log returns on monthly data

Usage:
    from causal_data import fetch_causal_data
    df = fetch_causal_data(lookback_days=504)
"""

import os
import sys
import warnings
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import requests

warnings.filterwarnings("ignore")

try:
    import yfinance as yf
    HAS_YF = True
except ImportError:
    HAS_YF = False
    print("[causal_data] yfinance not installed — pip install yfinance")

try:
    from fredapi import Fred
    HAS_FRED = True
except ImportError:
    HAS_FRED = False
    # Fallback: use plain requests to FRED API

# ─── Config ───────────────────────────────────────────────────────────

FRED_API_KEY = os.getenv("FRED_API_KEY", "")
BOT_API_KEY  = os.getenv("BOT_API_KEY",  "")

YAHOO_SYMBOLS = {
    "SET":   "^SET.BK",
    "VIX":   "^VIX",
    "SP500": "^GSPC",
    "NIKKEI":"^N225",
    "HSI":   "^HSI",
    "DXY":   "DX-Y.NYB",
    "GOLD":  "GC=F",
    "OIL":   "CL=F",
    "COPPER":"HG=F",
    "USDTHB":"USDTHB=X",
    "USDJPY":"USDJPY=X",
    "USDCNY":"USDCNY=X",
    "US10Y": "^TNX",
    "US2Y":  "^IRX",
    "BTC":   "BTC-USD",
}

FRED_SERIES = {
    "FED_RATE":    "FEDFUNDS",
    "US_CPI_YOY":  "CPIAUCSL",     # need to compute YoY ourselves
    "US_UNEMP":    "UNRATE",
}

WORLDBANK_INDICATORS = {
    "TH_GDP":  ("TH", "NY.GDP.MKTP.KD.ZG"),
    "TH_CPI":  ("TH", "FP.CPI.TOTL.ZG"),
    "TH_EXP":  ("TH", "NE.EXP.GNFS.ZS"),  # exports as % GDP
}

# ─── Yahoo Finance fetcher ─────────────────────────────────────────────

def fetch_yahoo_series(lookback_days: int = 756) -> pd.DataFrame:
    """Download price levels for all symbols; return wide DataFrame of
    adjusted close prices, indexed by date."""
    if not HAS_YF:
        return pd.DataFrame()

    end   = datetime.today()
    start = end - timedelta(days=lookback_days + 60)  # buffer for alignment

    tickers = list(YAHOO_SYMBOLS.values())
    try:
        raw = yf.download(tickers, start=start, end=end,
                          auto_adjust=True, progress=False, threads=True)
        if isinstance(raw.columns, pd.MultiIndex):
            closes = raw["Close"].copy()
        else:
            closes = raw[["Close"]].copy() if "Close" in raw.columns else raw.copy()

        # Rename columns from symbol to label
        sym_to_label = {v: k for k, v in YAHOO_SYMBOLS.items()}
        closes.columns = [sym_to_label.get(c, c) for c in closes.columns]
        closes.index = pd.to_datetime(closes.index).date
        return closes
    except Exception as e:
        print(f"[causal_data] Yahoo download error: {e}")
        return pd.DataFrame()


# ─── FRED fetcher ──────────────────────────────────────────────────────

def fetch_fred_series(lookback_days: int = 756) -> pd.DataFrame:
    """Fetch macro series from FRED; return wide DataFrame of monthly values
    forward-filled to daily."""
    results = {}
    start = (datetime.today() - timedelta(days=lookback_days + 400)).strftime("%Y-%m-%d")

    for label, series_id in FRED_SERIES.items():
        try:
            if HAS_FRED and FRED_API_KEY:
                fred = Fred(api_key=FRED_API_KEY)
                s = fred.get_series(series_id, observation_start=start)
                results[label] = s
            else:
                # Fallback: plain FRED REST API
                r = requests.get(
                    "https://api.stlouisfed.org/fred/series/observations",
                    params={
                        "series_id": series_id,
                        "api_key": FRED_API_KEY,
                        "file_type": "json",
                        "observation_start": start,
                        "sort_order": "asc",
                    }, timeout=10,
                )
                r.raise_for_status()
                obs = r.json().get("observations", [])
                dates  = [o["date"] for o in obs if o["value"] != "."]
                values = [float(o["value"]) for o in obs if o["value"] != "."]
                results[label] = pd.Series(values, index=pd.to_datetime(dates).date)
        except Exception as e:
            print(f"[causal_data] FRED error {series_id}: {e}")

    if not results:
        return pd.DataFrame()

    df = pd.DataFrame(results)
    return df


# ─── World Bank fetcher ────────────────────────────────────────────────

def fetch_worldbank_series() -> pd.DataFrame:
    """Fetch annual World Bank indicators for Thailand; return quarterly-
    interpolated series for use as low-frequency regressors."""
    results = {}
    for label, (country, indicator) in WORLDBANK_INDICATORS.items():
        try:
            r = requests.get(
                f"https://api.worldbank.org/v2/country/{country}/indicator/{indicator}",
                params={"format": "json", "per_page": 20, "mrv": 10},
                timeout=10,
            )
            r.raise_for_status()
            data = r.json()
            if not data or len(data) < 2:
                continue
            entries = data[1] or []
            dates, vals = [], []
            for e in entries:
                if e.get("value") is not None:
                    dates.append(pd.Timestamp(str(e["date"])))
                    vals.append(float(e["value"]))
            if dates:
                s = pd.Series(vals, index=pd.DatetimeIndex(dates)).sort_index()
                results[label] = s
        except Exception as e:
            print(f"[causal_data] WorldBank error {indicator}: {e}")

    if not results:
        return pd.DataFrame()

    df = pd.DataFrame(results)
    return df


# ─── Stationarity helpers ──────────────────────────────────────────────

def to_log_returns(s: pd.Series) -> pd.Series:
    """Daily log return: ln(P_t / P_{t-1})."""
    return np.log(s / s.shift(1))

def to_first_diff(s: pd.Series) -> pd.Series:
    """First difference."""
    return s.diff()

def adf_pvalue(s: pd.Series) -> float:
    """Augmented Dickey-Fuller test p-value. <0.05 = stationary."""
    try:
        from statsmodels.tsa.stattools import adfuller
        clean = s.dropna()
        if len(clean) < 20:
            return 1.0
        result = adfuller(clean, maxlag=5, autolag="AIC")
        return float(result[1])
    except Exception:
        return 1.0


# ─── Main builder ──────────────────────────────────────────────────────

def fetch_causal_data(lookback_days: int = 504) -> pd.DataFrame:
    """
    Return a wide DataFrame of *stationary* daily series, aligned by date,
    spanning approximately `lookback_days` of trading days.

    Columns returned (all in daily units unless noted):
        SET_ret     — SET log return
        VIX_ret     — VIX log return (proxy for VIX change)
        VIX_level   — raw VIX level (kept for regime detection)
        SP500_ret   — S&P 500 log return
        NIKKEI_ret  — Nikkei 225 log return
        HSI_ret     — Hang Seng log return
        DXY_ret     — USD Index log return
        GOLD_ret    — Gold futures log return
        OIL_ret     — WTI Crude log return
        COPPER_ret  — Copper log return
        USDTHB_ret  — USD/THB log return (positive = THB weakening)
        US10Y_diff  — US 10Y yield daily difference
        US2Y_diff   — US 2Y yield daily difference
        YIELD_CURVE — US10Y − US2Y level (spread, not differenced)
        FED_RATE_diff — Fed funds rate monthly diff, ffilled to daily
        BTC_ret     — Bitcoin log return
    """
    print("[causal_data] Fetching price data from Yahoo Finance...")
    prices = fetch_yahoo_series(lookback_days + 120)

    print("[causal_data] Fetching macro series from FRED...")
    fred   = fetch_fred_series(lookback_days + 400)

    # ── Convert prices to returns ─────────────────────────────────────

    result = pd.DataFrame(index=pd.DatetimeIndex(
        [pd.Timestamp(d) for d in prices.index] if not prices.empty else []
    ))

    log_ret_cols = ["SET", "VIX", "SP500", "NIKKEI", "HSI",
                    "DXY", "GOLD", "OIL", "COPPER", "USDTHB",
                    "USDJPY", "USDCNY", "BTC"]

    for col in log_ret_cols:
        if col in prices.columns:
            result[f"{col}_ret"] = to_log_returns(prices[col])

    # Keep raw VIX level for regime features
    if "VIX" in prices.columns:
        result["VIX_level"] = prices["VIX"]

    # Yield curve level and spread
    if "US10Y" in prices.columns and "US2Y" in prices.columns:
        result["US10Y_diff"]   = to_first_diff(prices["US10Y"])
        result["US2Y_diff"]    = to_first_diff(prices["US2Y"])
        result["YIELD_CURVE"]  = prices["US10Y"] - prices["US2Y"]  # level

    # ── FRED macro (forward-fill monthly to daily) ────────────────────

    if not fred.empty:
        fred_daily = fred.reindex(result.index, method="ffill")
        for col in fred.columns:
            result[f"{col}_diff"] = to_first_diff(fred_daily[col])

    # ── Trim to requested lookback ────────────────────────────────────

    result = result.sort_index()
    cutoff = result.index.max() - pd.Timedelta(days=lookback_days * 1.6)
    result = result[result.index >= cutoff]

    # ── Drop rows where SET return is missing (non-trading days) ─────

    if "SET_ret" in result.columns:
        result = result.dropna(subset=["SET_ret"])

    # ── Drop leading/trailing NaN for most columns ─────────────────

    # Allow up to 20% missing per column
    min_obs = len(result) * 0.8
    result = result.dropna(axis=1, thresh=int(min_obs))

    # Forward-fill sporadic gaps (weekends in FX data etc.)
    result = result.ffill().bfill()

    print(f"[causal_data] Done. Shape: {result.shape} ({result.index.min().date()} → {result.index.max().date()})")
    return result


if __name__ == "__main__":
    df = fetch_causal_data(lookback_days=504)
    print(df.tail())
    print("\nColumns:", list(df.columns))
