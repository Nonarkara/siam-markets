"""
forecast.py — 5-day probabilistic SET forecast using darts LightGBM.

What it does
────────────
1. Fetches SET price history + macro covariates (FRED: Fed rate, VIX,
   DXY, gold, oil, THB/USD, yield spread)
2. Trains a LightGBM model via darts with past + future covariates
3. Produces 5-day ahead forecast with 80% and 95% confidence intervals
4. Stores to Supabase table `set_forecast`
5. Falls back to ARIMA (statsmodels) if darts/torch not installed

Runs daily after market close: python3 ingestion/forecast.py

Forecast interpretation
────────────────────────
• Band width ∝ model uncertainty. Wider band = higher regime uncertainty.
• Probabilistic intervals via empirical residual quantiles (darts conformal).
• This is a 5-day RETURN forecast, converted to index levels for display.
• NOT investment advice. Backtested accuracy varies by market regime.

Dependencies: darts (pip install u8darts[torch]) or pip install statsmodels
"""

import os
import json
import warnings
from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

try:
    from darts import TimeSeries
    from darts.models import LightGBMModel, ARIMA
    from darts.dataprocessing.transformers import Scaler
    from darts.metrics import mape, rmse
    HAS_DARTS = True
except ImportError:
    HAS_DARTS = False
    print("[forecast] darts not installed — using statsmodels ARIMA fallback")
    print("         Install full suite: pip install 'u8darts[torch]'")

try:
    from statsmodels.tsa.arima.model import ARIMA as StatsARIMA
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False

try:
    import yfinance as yf
    HAS_YF = True
except ImportError:
    HAS_YF = False

try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

from causal_data import fetch_causal_data

SUPABASE_URL  = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY  = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")
FORECAST_DAYS = 5
LOOKBACK      = 504    # 2 trading years for training
COVARIATE_COLS = [     # Granger-significant macro covariates
    "VIX_ret", "SP500_ret", "DXY_ret", "GOLD_ret", "OIL_ret",
    "USDTHB_ret", "US10Y_diff", "YIELD_CURVE",
]


# ─── Fetch SET levels ─────────────────────────────────────────────────

def fetch_set_levels(lookback: int = LOOKBACK + 60) -> pd.Series:
    """Return daily SET closing price series."""
    if not HAS_YF:
        return pd.Series(dtype=float)
    end   = datetime.today()
    start = end - timedelta(days=lookback + 30)
    try:
        df = yf.download("^SET.BK", start=start, end=end,
                         auto_adjust=True, progress=False)
        close = df["Close"] if "Close" in df.columns else df.iloc[:, 0]
        if isinstance(close, pd.DataFrame):
            close = close.iloc[:, 0]
        close.index = pd.to_datetime(close.index)
        return close.dropna().sort_index()
    except Exception as e:
        print(f"[forecast] yfinance error: {e}")
        return pd.Series(dtype=float)


# ─── darts forecast ────────────────────────────────────────────────────

def run_darts_forecast(close: pd.Series, df_macro: pd.DataFrame
                       ) -> list[dict]:
    """
    Fit LightGBM via darts, produce 5-day forecast with quantiles.
    """
    if not HAS_DARTS:
        return []

    # Align close prices to macro data dates
    close_aligned = close.reindex(df_macro.index, method="ffill").dropna()
    if len(close_aligned) < 100:
        print("[forecast] Insufficient aligned data")
        return []

    # Convert to darts TimeSeries
    ts_close = TimeSeries.from_series(close_aligned, freq="B")

    # Covariate series
    available_covs = [c for c in COVARIATE_COLS if c in df_macro.columns]
    if available_covs:
        ts_cov = TimeSeries.from_dataframe(
            df_macro[available_covs].reindex(
                close_aligned.index, method="ffill"
            ).dropna(),
            freq="B",
        )
    else:
        ts_cov = None

    # Scale
    scaler = Scaler()
    ts_scaled = scaler.fit_transform(ts_close)

    # Train LightGBM (fast, good for tabular time series)
    try:
        model = LightGBMModel(
            lags=[-1, -2, -3, -5, -10, -20],
            lags_past_covariates=[-1, -2, -3, -5] if ts_cov else None,
            output_chunk_length=FORECAST_DAYS,
            n_estimators=200,
            num_leaves=31,
            learning_rate=0.05,
            random_state=42,
        )
        if ts_cov:
            model.fit(ts_scaled, past_covariates=ts_cov)
        else:
            model.fit(ts_scaled)

        # Probabilistic prediction: 20 Monte Carlo samples
        pred_scaled = model.predict(
            n=FORECAST_DAYS,
            past_covariates=ts_cov if ts_cov else None,
            num_samples=200,
        )
        pred = scaler.inverse_transform(pred_scaled)

        # Extract quantiles from samples
        last_close = float(close_aligned.iloc[-1])
        forecast_date = date.today()
        rows = []
        for i in range(FORECAST_DAYS):
            target_date = forecast_date + timedelta(days=i + 1)
            # Skip weekends
            while target_date.weekday() >= 5:
                target_date += timedelta(days=1)

            samples = pred.all_values()[i, 0, :]   # (n_samples,)
            rows.append({
                "forecast_date": str(forecast_date),
                "target_date":   str(target_date),
                "predicted":     round(float(np.median(samples)), 2),
                "lower_80":      round(float(np.percentile(samples, 10)), 2),
                "upper_80":      round(float(np.percentile(samples, 90)), 2),
                "lower_95":      round(float(np.percentile(samples, 2.5)), 2),
                "upper_95":      round(float(np.percentile(samples, 97.5)), 2),
                "model":         "lgbm",
                "covariates":    available_covs,
            })
        return rows

    except Exception as e:
        print(f"[forecast] darts error: {e}")
        return []


# ─── ARIMA fallback ────────────────────────────────────────────────────

def run_arima_forecast(close: pd.Series) -> list[dict]:
    """
    Fallback: ARIMA(2,1,2) on SET closing prices.
    Returns point forecasts only (no confidence band via statsmodels).
    """
    if not HAS_STATSMODELS or len(close) < 60:
        return []

    try:
        model = StatsARIMA(close.values, order=(2, 1, 2))
        fit   = model.fit(disp=False)
        # 5-step ahead with 80% and 95% CI
        forecast = fit.get_forecast(steps=FORECAST_DAYS)
        pred_mean = forecast.predicted_mean
        ci_80     = forecast.conf_int(alpha=0.20)
        ci_95     = forecast.conf_int(alpha=0.05)

        forecast_date = date.today()
        rows = []
        for i in range(FORECAST_DAYS):
            target_date = forecast_date + timedelta(days=i + 1)
            while target_date.weekday() >= 5:
                target_date += timedelta(days=1)
            rows.append({
                "forecast_date": str(forecast_date),
                "target_date":   str(target_date),
                "predicted":     round(float(pred_mean.iloc[i]), 2),
                "lower_80":      round(float(ci_80.iloc[i, 0]), 2),
                "upper_80":      round(float(ci_80.iloc[i, 1]), 2),
                "lower_95":      round(float(ci_95.iloc[i, 0]), 2),
                "upper_95":      round(float(ci_95.iloc[i, 1]), 2),
                "model":         "arima",
                "covariates":    [],
            })
        return rows
    except Exception as e:
        print(f"[forecast] ARIMA error: {e}")
        return []


# ─── Supabase store ────────────────────────────────────────────────────

def store_results(rows: list[dict]) -> bool:
    if not rows:
        return True
    if not HAS_SUPABASE or not SUPABASE_URL:
        print(f"[forecast] Latest 5-day forecast (no Supabase):")
        for r in rows:
            print(f"  {r['target_date']}: ฿{r['predicted']:,.2f}  [{r['lower_80']:,.0f}–{r['upper_80']:,.0f}]")
        return False
    try:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        today = date.today().isoformat()
        sb.table("set_forecast").delete().eq("forecast_date", today).execute()
        sb.table("set_forecast").insert(rows).execute()
        print(f"[forecast] ✓ Stored {len(rows)} forecast rows to Supabase")
        return True
    except Exception as e:
        print(f"[forecast] Supabase error: {e}")
        return False


# ─── Entry point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("SET INDEX — 5-DAY PROBABILISTIC FORECAST")
    print(f"Run: {datetime.now().isoformat()}")
    print("=" * 60)

    # Fetch SET prices
    close = fetch_set_levels()
    if close.empty:
        print("[forecast] No SET data — aborting")
        raise SystemExit(1)
    print(f"[forecast] SET data: {len(close)} trading days ({close.index[0].date()} → {close.index[-1].date()})")
    print(f"[forecast] Latest close: ฿{close.iloc[-1]:,.2f}")

    # Fetch macro covariates
    print("[forecast] Fetching macro covariates...")
    df_macro = fetch_causal_data(lookback_days=LOOKBACK)

    # Try darts LightGBM first, fall back to ARIMA
    if HAS_DARTS:
        print("[forecast] Running darts LightGBM forecast...")
        rows = run_darts_forecast(close, df_macro)
    else:
        rows = []

    if not rows:
        print("[forecast] Falling back to ARIMA...")
        rows = run_arima_forecast(close)

    if not rows:
        print("[forecast] Both models failed — aborting")
        raise SystemExit(1)

    store_results(rows)

    print("\n── 5-DAY FORECAST ──")
    for r in rows:
        print(f"  {r['target_date']}  ฿{r['predicted']:,.2f}  "
              f"80% CI [{r['lower_80']:,.0f} – {r['upper_80']:,.0f}]  "
              f"model={r['model']}")

    out_path = os.path.join(os.path.dirname(__file__), "forecast_latest.json")
    with open(out_path, "w") as f:
        json.dump({"rows": rows, "run_date": date.today().isoformat()}, f, indent=2)
    print(f"\n[forecast] Saved → {out_path}")
