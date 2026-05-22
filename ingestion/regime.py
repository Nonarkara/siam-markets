"""
regime.py — Market regime classification using Gaussian Mixture Model.

What it does
────────────
1. Builds a feature matrix from daily SET + macro data:
   • SET 5d return, SET 20d return, SET rolling 20d vol
   • VIX level, THB 5d change, DXY 5d change
2. Fits a 3-component GMM (Bull / Bear / Ranging) on the training window
3. Assigns regime labels and probabilities to every date
4. Identifies today's regime + confidence
5. Stores in Supabase table `market_regimes`
6. Outputs a JSON for the dashboard `/api/regime` fallback

Run daily after market close: python3 ingestion/regime.py

Performance note
────────────────
The model is re-fitted weekly (on Mondays) using the full 2-year window.
On other days, it runs inference-only against stored weights (pickle).
This prevents regime label drift mid-week.

Why GMM not HMM?
────────────────
- GMM: faster, stable, Scikit-learn maintained, soft assignments (probabilities)
- HMM (hmmlearn): slow, harder to tune, maintenance warnings as of 2024
For a first implementation, GMM is better. Upgrade to HMM if temporal
autocorrelation matters (the GMM ignores the Markov property).
"""

import os
import json
import pickle
import warnings
from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

try:
    from sklearn.mixture import GaussianMixture
    from sklearn.preprocessing import StandardScaler
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    print("[regime] scikit-learn not installed — pip install scikit-learn")

try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

from causal_data import fetch_causal_data

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")

MODEL_PATH   = os.path.join(os.path.dirname(__file__), "regime_model.pkl")
LOOKBACK     = 504   # ~2 trading years
N_COMPONENTS = 3     # Bull / Bear / Ranging


# ─── Feature engineering ─────────────────────────────────────────────

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Construct the feature matrix for GMM:
        SET_ret_5d   — 5-day SET log return (momentum)
        SET_ret_20d  — 20-day SET log return (trend)
        SET_vol_20d  — 20-day rolling volatility of SET daily ret
        VIX_level    — raw VIX (absolute fear)
        USDTHB_5d    — 5-day THB/USD return (capital flow proxy)
        DXY_5d       — 5-day USD Index return
    """
    out = pd.DataFrame(index=df.index)

    if "SET_ret" in df.columns:
        set_ret = df["SET_ret"]
        out["SET_ret_5d"]  = set_ret.rolling(5).sum()   # sum of daily log rets ≈ 5d return
        out["SET_ret_20d"] = set_ret.rolling(20).sum()
        out["SET_vol_20d"] = set_ret.rolling(20).std() * np.sqrt(252)  # annualised vol

    if "VIX_level" in df.columns:
        out["VIX_level"] = df["VIX_level"]
    elif "VIX_ret" in df.columns:
        out["VIX_level"] = df["VIX_ret"].expanding().mean()  # fallback

    if "USDTHB_ret" in df.columns:
        out["USDTHB_5d"] = df["USDTHB_ret"].rolling(5).sum()

    if "DXY_ret" in df.columns:
        out["DXY_5d"] = df["DXY_ret"].rolling(5).sum()

    return out.dropna()


# ─── Label assignment ─────────────────────────────────────────────────

def assign_regime_labels(gmm: GaussianMixture,
                          scaler: StandardScaler,
                          features: pd.DataFrame) -> dict[int, str]:
    """
    Determine which GMM component corresponds to Bull/Bear/Ranging
    by comparing component mean SET return (highest = bull, lowest = bear).
    Returns mapping {component_index: label}.
    """
    # Map back means to original scale
    means_scaled = gmm.means_
    means_orig   = scaler.inverse_transform(means_scaled)
    feat_cols    = features.columns.tolist()

    try:
        set_5d_idx = feat_cols.index("SET_ret_5d")
    except ValueError:
        set_5d_idx = 0

    mean_returns = [(i, means_orig[i, set_5d_idx]) for i in range(N_COMPONENTS)]
    mean_returns.sort(key=lambda x: x[1])  # ascending: [bear, ranging, bull] or similar

    # Lowest mean return → bear, highest → bull, middle → ranging
    labels = {
        mean_returns[0][0]: "bear",
        mean_returns[-1][0]: "bull",
    }
    # Middle component(s) → ranging
    for i in range(N_COMPONENTS):
        if i not in labels:
            labels[i] = "ranging"

    return labels


# ─── Fit or load GMM ──────────────────────────────────────────────────

def fit_gmm(features: pd.DataFrame) -> tuple[GaussianMixture, StandardScaler]:
    """Fit and save a GMM model. Returns (gmm, scaler)."""
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(features.values)

    gmm = GaussianMixture(
        n_components=N_COMPONENTS,
        covariance_type="full",
        n_init=10,
        max_iter=300,
        random_state=42,
    )
    gmm.fit(X_scaled)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump((gmm, scaler), f)
    print(f"[regime] Model saved → {MODEL_PATH}")

    return gmm, scaler


def load_or_fit(features: pd.DataFrame) -> tuple[GaussianMixture, StandardScaler]:
    """Load existing model; re-fit on Mondays or if not found."""
    today = date.today()
    should_refit = (today.weekday() == 0)  # Monday = re-fit

    if not should_refit and os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                gmm, scaler = pickle.load(f)
            print("[regime] Loaded existing model (non-Monday — no refit)")
            return gmm, scaler
        except Exception:
            pass

    print("[regime] Fitting new GMM model...")
    return fit_gmm(features)


# ─── Main pipeline ────────────────────────────────────────────────────

def run_regime_classification() -> list[dict]:
    """
    Full pipeline: build features, classify regimes, return row dicts.
    """
    if not HAS_SKLEARN:
        return []

    print("[regime] Fetching data...")
    df = fetch_causal_data(lookback_days=LOOKBACK)
    if df.empty:
        print("[regime] No data — aborting")
        return []

    print("[regime] Building features...")
    features = build_features(df)
    if len(features) < 60:
        print(f"[regime] Too few rows ({len(features)}) — aborting")
        return []

    # Fit/load model
    gmm, scaler = load_or_fit(features)

    # Predict
    X_scaled    = scaler.transform(features.values)
    components  = gmm.predict(X_scaled)
    proba       = gmm.predict_proba(X_scaled)   # shape: (n, 3)

    # Assign labels
    labels = assign_regime_labels(gmm, scaler, features)

    # Build rows
    today_str = date.today().isoformat()
    rows = []
    for i, idx in enumerate(features.index):
        comp   = int(components[i])
        regime = labels[comp]
        p      = proba[i]

        # Map component index to label probability
        bull_p    = float(p[{v: k for k, v in labels.items()}["bull"]])    if "bull"    in labels.values() else 0.0
        bear_p    = float(p[{v: k for k, v in labels.items()}["bear"]])    if "bear"    in labels.values() else 0.0
        ranging_p = float(p[{v: k for k, v in labels.items()}["ranging"]]) if "ranging" in labels.values() else 0.0

        row_date = idx.date() if hasattr(idx, "date") else idx

        rows.append({
            "date":           str(row_date),
            "regime":         regime,
            "bull_prob":      round(bull_p,    4),
            "bear_prob":      round(bear_p,    4),
            "ranging_prob":   round(ranging_p, 4),
            "set_return_5d":  round(float(features.iloc[i]["SET_ret_5d"]),  6) if "SET_ret_5d"  in features.columns else None,
            "set_return_20d": round(float(features.iloc[i]["SET_ret_20d"]), 6) if "SET_ret_20d" in features.columns else None,
            "set_vol_20d":    round(float(features.iloc[i]["SET_vol_20d"]), 4) if "SET_vol_20d" in features.columns else None,
            "vix":            round(float(features.iloc[i]["VIX_level"]),   2) if "VIX_level"   in features.columns else None,
            "thb_change_5d":  round(float(features.iloc[i]["USDTHB_5d"]),   6) if "USDTHB_5d"   in features.columns else None,
            "dxy_change_5d":  round(float(features.iloc[i]["DXY_5d"]),       6) if "DXY_5d"       in features.columns else None,
        })

    return rows


# ─── Supabase store ────────────────────────────────────────────────────

def store_results(rows: list[dict]) -> bool:
    if not rows:
        return True
    if not HAS_SUPABASE or not SUPABASE_URL:
        today_row = rows[-1]
        print(f"[regime] Latest: {today_row['date']} → {today_row['regime'].upper()} "
              f"(bull={today_row['bull_prob']:.0%}, bear={today_row['bear_prob']:.0%}, "
              f"ranging={today_row['ranging_prob']:.0%})")
        return False

    try:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Upsert on (date) unique key
        for i in range(0, len(rows), 50):
            sb.table("market_regimes").upsert(
                rows[i:i+50], on_conflict="date"
            ).execute()
        print(f"[regime] ✓ Stored {len(rows)} regime rows to Supabase")
        return True
    except Exception as e:
        print(f"[regime] Supabase error: {e}")
        return False


# ─── Summary ──────────────────────────────────────────────────────────

def build_summary(rows: list[dict]) -> dict:
    if not rows:
        return {}

    today = rows[-1]
    recent = rows[-60:]
    regime_counts = {"bull": 0, "bear": 0, "ranging": 0}
    for r in recent:
        regime_counts[r["regime"]] = regime_counts.get(r["regime"], 0) + 1

    return {
        "today":          today,
        "regime_counts_60d": regime_counts,
        "history":        rows[-252:],   # 1 year for chart
        "run_date":       date.today().isoformat(),
        "note":           "3-component GMM on SET returns, vol, VIX, THB. Soft assignments.",
    }


# ─── Entry point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    if not HAS_SKLEARN:
        print("Install: pip install scikit-learn")
        raise SystemExit(1)

    print("=" * 60)
    print("MARKET REGIME CLASSIFICATION (GMM)")
    print(f"Run: {datetime.now().isoformat()}")
    print("=" * 60)

    rows = run_regime_classification()
    store_results(rows)

    summary = build_summary(rows)
    if summary:
        t = summary["today"]
        print(f"\n── TODAY: {t['date']} ──")
        print(f"  Regime:  {t['regime'].upper()}")
        print(f"  Bull:    {t['bull_prob']:.1%}   Bear: {t['bear_prob']:.1%}   Ranging: {t['ranging_prob']:.1%}")

    out_path = os.path.join(os.path.dirname(__file__), "regime_latest.json")
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\n[regime] Summary → {out_path}")
