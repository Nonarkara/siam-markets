"""
granger.py — Granger causality analysis: which macro variables
             Granger-cause SET returns?

What it does
────────────
1. Fetches ~2 years of daily stationary time series (causal_data.py)
2. Tests every driver → SET pair at lags [1, 3, 5, 10] days
3. Also tests the reverse (SET → driver) to flag bidirectionality
4. Runs ADF stationarity check on each series before testing
5. Stores results in Supabase table `granger_signals`
6. Returns a JSON summary for display in the dashboard

Key warnings baked in
─────────────────────
• Granger causality = predictive precedence, NOT true causality
• All series MUST be I(0) — we ADF-test and warn if not
• Spurious significance common with short windows — use n ≥ 200
• p < 0.05 is suggestive only; p < 0.01 is more reliable

Run daily: python3 ingestion/granger.py
"""

import os
import json
import warnings
from datetime import date, datetime

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

try:
    from statsmodels.tsa.stattools import grangercausalitytests, adfuller
    from statsmodels.tsa.api import VAR
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False
    print("[granger] statsmodels not installed — pip install statsmodels")

try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

from causal_data import fetch_causal_data

# ─── Config ───────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")

LAGS_TO_TEST = [1, 3, 5, 10]
LOOKBACK_DAYS = 504      # ~2 trading years
MIN_OBS = 120            # don't test with fewer observations

# Drivers to test → SET
DRIVER_LABELS = {
    "VIX_ret":        "CBOE VIX (fear gauge)",
    "SP500_ret":      "S&P 500 (US equities)",
    "NIKKEI_ret":     "Nikkei 225 (Japan)",
    "HSI_ret":        "Hang Seng (HK/China)",
    "DXY_ret":        "USD Index (dollar strength)",
    "GOLD_ret":       "Gold (safe haven)",
    "OIL_ret":        "WTI Crude (energy)",
    "COPPER_ret":     "Copper (global growth proxy)",
    "USDTHB_ret":     "USD/THB (baht weakness)",
    "USDJPY_ret":     "USD/JPY (yen carry trade)",
    "US10Y_diff":     "US 10Y yield change",
    "US2Y_diff":      "US 2Y yield change",
    "YIELD_CURVE":    "Yield curve spread (10y−2y)",
    "FED_RATE_diff":  "Fed funds rate change",
    "BTC_ret":        "Bitcoin (risk appetite)",
}


# ─── Stationarity check ───────────────────────────────────────────────

def check_stationarity(s: pd.Series, name: str) -> bool:
    """Return True if series passes ADF test at 5% level."""
    clean = s.dropna()
    if len(clean) < 30:
        return False
    try:
        p = adfuller(clean, maxlag=5, autolag="AIC")[1]
        if p > 0.05:
            print(f"  ⚠  {name}: ADF p={p:.3f} (NOT stationary — results unreliable)")
            return False
        return True
    except Exception:
        return False


# ─── Core Granger test ─────────────────────────────────────────────────

def run_granger_pair(driver: pd.Series, target: pd.Series,
                     driver_name: str, target_name: str,
                     max_lag: int) -> list[dict]:
    """
    Run bivariate Granger causality test for a single driver→target pair
    at lags 1..max_lag.
    Returns a list of dicts (one per lag) with f_stat and p_value.
    """
    if not HAS_STATSMODELS:
        return []

    # Align + drop NaN
    both = pd.concat([target, driver], axis=1).dropna()
    both.columns = ["target", "driver"]

    if len(both) < MIN_OBS:
        print(f"  [granger] Skipping {driver_name}→{target_name}: only {len(both)} obs")
        return []

    try:
        # statsmodels expects [target, driver] order
        result = grangercausalitytests(both[["target", "driver"]],
                                        maxlag=max_lag, verbose=False)
    except Exception as e:
        print(f"  [granger] Error {driver_name}→{target_name}: {e}")
        return []

    rows = []
    for lag in LAGS_TO_TEST:
        if lag > max_lag:
            continue
        tests = result[lag][0]
        # Use F-test (most common, robust to normality deviations)
        f_stat = float(tests["ssr_ftest"][0])
        p_val  = float(tests["ssr_ftest"][1])
        rows.append({
            "lag_days":  lag,
            "f_stat":    round(f_stat, 4),
            "p_value":   round(p_val, 6),
        })

    return rows


# ─── Optimal lag selection via VAR AIC ────────────────────────────────

def select_var_lag(df: pd.DataFrame, max_lag: int = 15) -> int:
    """Select VAR order via AIC. Falls back to 5 on error."""
    try:
        model = VAR(df.dropna())
        lag_order = model.select_order(max_lag)
        return max(1, lag_order.aic)
    except Exception:
        return 5


# ─── Main pipeline ────────────────────────────────────────────────────

def run_granger_analysis(df: pd.DataFrame) -> list[dict]:
    """
    Full Granger analysis: every driver in DRIVER_LABELS → SET_ret.
    Also tests SET_ret → each driver (reverse direction).

    Returns list of row dicts ready to insert into granger_signals.
    """
    if "SET_ret" not in df.columns:
        print("[granger] SET_ret column missing — aborting")
        return []

    today = date.today().isoformat()
    set_series = df["SET_ret"]

    # Check SET stationarity
    if not check_stationarity(set_series, "SET_ret"):
        print("[granger] ⚠  SET_ret may not be stationary — proceed with caution")

    # Optimal max lag via SET vs SP500 bivariate VAR
    if "SP500_ret" in df.columns:
        max_lag = select_var_lag(df[["SET_ret", "SP500_ret"]].dropna())
        max_lag = min(max(max_lag, max(LAGS_TO_TEST)), 15)
    else:
        max_lag = 10

    print(f"[granger] Max lag selected: {max_lag}")

    all_rows = []
    data_from = str(df.index.min().date()) if hasattr(df.index.min(), "date") else str(df.index.min())
    data_to   = str(df.index.max().date()) if hasattr(df.index.max(), "date") else str(df.index.max())
    n_obs = len(df.dropna(subset=["SET_ret"]))

    for driver_col, driver_label in DRIVER_LABELS.items():
        if driver_col not in df.columns:
            continue

        driver_series = df[driver_col]

        # Stationarity check
        check_stationarity(driver_series, driver_col)

        print(f"  Testing {driver_col} → SET_ret ...", end="", flush=True)

        # Forward: driver → SET
        fwd = run_granger_pair(driver_series, set_series,
                                driver_col, "SET_ret", max_lag)
        for row in fwd:
            row.update({
                "run_date":    today,
                "driver":      driver_col,
                "driver_label": driver_label,
                "target":      "SET",
                "direction":   "driver→SET",
                "n_obs":       n_obs,
                "data_from":   data_from,
                "data_to":     data_to,
            })
        all_rows.extend(fwd)

        # Reverse: SET → driver (test for bidirectionality)
        rev = run_granger_pair(set_series, driver_series,
                                "SET_ret", driver_col, max_lag)
        for row in rev:
            row.update({
                "run_date":    today,
                "driver":      driver_col,
                "driver_label": driver_label,
                "target":      "SET",
                "direction":   "SET→driver",
                "n_obs":       n_obs,
                "data_from":   data_from,
                "data_to":     data_to,
            })
        all_rows.extend(rev)

        sig_fwd = [r for r in fwd if r["p_value"] < 0.05]
        print(f" → {len(sig_fwd)}/{len(LAGS_TO_TEST)} lags significant")

    return all_rows


# ─── Supabase upsert ──────────────────────────────────────────────────

def store_results(rows: list[dict]) -> bool:
    """Insert Granger results into Supabase."""
    if not rows:
        return True
    if not HAS_SUPABASE or not SUPABASE_URL:
        print("[granger] No Supabase config — skipping write. Results:")
        sig = [r for r in rows if r.get("p_value", 1) < 0.05]
        for r in sig:
            print(f"  {r['driver']} → {r['target']} lag={r['lag_days']}d p={r['p_value']:.4f}")
        return False

    try:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        today = date.today().isoformat()
        # Delete today's run first (idempotent)
        sb.table("granger_signals").delete().eq("run_date", today).execute()
        # Insert in batches of 50
        for i in range(0, len(rows), 50):
            sb.table("granger_signals").insert(rows[i:i+50]).execute()
        print(f"[granger] ✓ Stored {len(rows)} rows to Supabase (granger_signals)")
        return True
    except Exception as e:
        print(f"[granger] Supabase error: {e}")
        return False


# ─── Summary output (for API / dashboard) ─────────────────────────────

def build_summary(rows: list[dict]) -> dict:
    """
    Distil results to a structured summary for the dashboard.
    Returns:
        - top_drivers: sorted by min p_value across lags (forward direction only)
        - full_table: matrix ready for heatmap rendering
    """
    fwd = [r for r in rows if r["direction"] == "driver→SET"]

    # Best p-value per driver (across all lags)
    by_driver: dict[str, dict] = {}
    for r in fwd:
        driver = r["driver"]
        if driver not in by_driver or r["p_value"] < by_driver[driver]["best_p"]:
            by_driver[driver] = {
                "driver":       driver,
                "label":        r["driver_label"],
                "best_p":       r["p_value"],
                "best_lag":     r["lag_days"],
                "best_f":       r["f_stat"],
                "significant":  r["p_value"] < 0.05,
            }

    top_drivers = sorted(by_driver.values(), key=lambda x: x["best_p"])

    # Full matrix: driver × lag
    matrix = {}
    for r in fwd:
        key = f"{r['driver']}|{r['lag_days']}"
        matrix[key] = {
            "driver":     r["driver"],
            "label":      r["driver_label"],
            "lag":        r["lag_days"],
            "p_value":    r["p_value"],
            "f_stat":     r["f_stat"],
            "sig":        r["p_value"] < 0.05,
        }

    return {
        "run_date":    date.today().isoformat(),
        "top_drivers": top_drivers,
        "matrix":      list(matrix.values()),
        "n_rows":      len(rows),
        "note":        "Granger = predictive precedence, not true causation. ADF-tested for stationarity.",
    }


# ─── Entry point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    if not HAS_STATSMODELS:
        print("Install: pip install statsmodels")
        raise SystemExit(1)

    print("=" * 60)
    print("GRANGER CAUSALITY ANALYSIS")
    print(f"Run: {datetime.now().isoformat()}")
    print("=" * 60)

    # 1. Fetch data
    df = fetch_causal_data(lookback_days=LOOKBACK_DAYS)

    # 2. Run analysis
    print(f"\n[granger] Testing {len(DRIVER_LABELS)} drivers × {len(LAGS_TO_TEST)} lags × 2 directions ...")
    rows = run_granger_analysis(df)

    # 3. Store to Supabase
    store_results(rows)

    # 4. Print summary
    summary = build_summary(rows)
    print("\n── TOP DRIVERS (forward: driver → SET) ──")
    for d in summary["top_drivers"][:8]:
        sig = "✓" if d["significant"] else "✗"
        print(f"  {sig}  {d['label']:<40} best lag={d['best_lag']}d  p={d['best_p']:.4f}  F={d['best_f']:.2f}")

    # 5. Save summary JSON for API fallback
    summary_path = os.path.join(os.path.dirname(__file__), "granger_latest.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\n[granger] Summary saved → {summary_path}")
