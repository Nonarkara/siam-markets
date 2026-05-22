"""
breaks.py — Structural break detection on SET returns and volatility.

What it does
────────────
1. Fetches ~3 years of daily SET price data
2. Runs ruptures.Pelt (change-point detection) on:
   • SET daily log returns   → level/mean breaks
   • SET rolling 20d vol     → volatility regime breaks
3. For each detected break, looks back 1–7 calendar days in GDELT
   events to annotate what potentially triggered the regime change
4. Stores results in Supabase table `structural_breaks`
5. Saves a JSON for the dashboard `/api/breaks` fallback

Run weekly: python3 ingestion/breaks.py

Visual output: breaks annotated on a SET price chart — the closest
thing to a "causation timeline" achievable without proprietary data.
"""

import os
import json
import warnings
from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd
import requests

warnings.filterwarnings("ignore")

try:
    import ruptures as rpt
    HAS_RUPTURES = True
except ImportError:
    HAS_RUPTURES = False
    print("[breaks] ruptures not installed — pip install ruptures")

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

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")

LOOKBACK_DAYS = 756       # ~3 trading years
MIN_BREAK_GAP = 30        # minimum days between breaks (avoid choppy noise)
PENALTY       = 2.0       # ruptures rbf penalty — higher = fewer breaks
GDELT_URL     = "https://api.gdeltproject.org/api/v2/doc/doc"


# ─── Fetch SET price history ──────────────────────────────────────────

def fetch_set_history(lookback_days: int = LOOKBACK_DAYS) -> pd.DataFrame:
    """Return daily SET OHLCV DataFrame."""
    if not HAS_YF:
        return pd.DataFrame()
    end   = datetime.today()
    start = end - timedelta(days=lookback_days + 60)
    try:
        df = yf.download("^SET.BK", start=start, end=end,
                         auto_adjust=True, progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        df.index = pd.to_datetime(df.index)
        df = df.sort_index()
        return df
    except Exception as e:
        print(f"[breaks] yfinance error: {e}")
        return pd.DataFrame()


# ─── Ruptures: detect break dates ─────────────────────────────────────

def detect_breaks(signal: np.ndarray, penalty: float = PENALTY,
                  min_gap: int = MIN_BREAK_GAP) -> list[int]:
    """
    Run Pelt algorithm with RBF cost.
    Returns sorted list of break indices (0-based) into `signal`.
    """
    if not HAS_RUPTURES:
        return []
    if len(signal) < 60:
        return []

    try:
        algo = rpt.Pelt(model="rbf", jump=1, min_size=min_gap)
        algo.fit(signal.reshape(-1, 1))
        bkps = algo.predict(pen=penalty)
        # bkps includes the final index (== len(signal)); remove it
        bkps = [b for b in bkps if 0 < b < len(signal)]
        return sorted(bkps)
    except Exception as e:
        print(f"[breaks] ruptures error: {e}")
        return []


# ─── Classify regime around a break ───────────────────────────────────

def classify_segment(returns: np.ndarray) -> str:
    """Label a segment of returns as bull/bear/ranging/volatile."""
    if len(returns) < 5:
        return "unknown"
    mean = float(np.mean(returns))
    vol  = float(np.std(returns))
    ann_ret = mean * 252
    ann_vol = vol  * np.sqrt(252)
    if ann_ret > 0.15 and ann_vol < 0.25:
        return "bull"
    if ann_ret < -0.10:
        return "bear"
    if ann_vol > 0.30:
        return "volatile"
    return "ranging"


# ─── GDELT: events preceding a break ──────────────────────────────────

def fetch_gdelt_events(break_date: date, lookback: int = 7,
                       theme: str = "THAILAND|ECON|FIN") -> list[dict]:
    """
    Query GDELT DOC 2.0 for news events in the window
    [break_date − lookback_days, break_date] with Thai/economic tone.
    Returns list of headline dicts.
    """
    end_dt   = break_date
    start_dt = break_date - timedelta(days=lookback)
    try:
        r = requests.get(
            GDELT_URL,
            params={
                "query":      f"Thailand market economy",
                "mode":       "artlist",
                "maxrecords": "10",
                "startdatetime": start_dt.strftime("%Y%m%d%H%M%S"),
                "enddatetime":   end_dt.strftime("%Y%m%d%H%M%S"),
                "format":    "json",
                "sort":      "tonedesc",
            },
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        articles = data.get("articles", [])
        return [
            {
                "title":  a.get("title", ""),
                "source": a.get("domain", ""),
                "date":   a.get("seendate", "")[:8],
                "tone":   a.get("tone", 0),
                "url":    a.get("url", ""),
            }
            for a in articles[:5]
        ]
    except Exception as e:
        print(f"  [gdelt] Warning: {e}")
        return []


# ─── Main pipeline ─────────────────────────────────────────────────────

def run_break_detection() -> list[dict]:
    """
    Full pipeline: fetch SET data, detect breaks on returns and
    volatility, annotate with GDELT events, return list of row dicts.
    """
    today_str = date.today().isoformat()

    print("[breaks] Fetching SET price history...")
    df = fetch_set_history()
    if df.empty or "Close" not in df.columns:
        print("[breaks] No SET data — aborting")
        return []

    close = df["Close"].dropna()
    returns = np.log(close / close.shift(1)).dropna().values
    rolling_vol = pd.Series(returns).rolling(20).std().dropna().values

    dates = close.index[1:]  # align with returns
    dates_arr = np.array([d.date() for d in dates])

    all_rows = []

    for series_name, signal, signal_label in [
        ("returns",    returns,     "Daily log returns"),
        ("volatility", rolling_vol, "Rolling 20d std"),
    ]:
        print(f"\n[breaks] Detecting breaks in SET {series_name} ...")

        # Use slightly higher penalty for volatility (smoother)
        pen = PENALTY if series_name == "returns" else PENALTY * 1.5
        bkp_indices = detect_breaks(signal, penalty=pen)

        # For returns-based breaks, align dates
        signal_dates = dates_arr[-len(signal):]

        print(f"  → {len(bkp_indices)} breaks detected")

        for idx in bkp_indices:
            if idx >= len(signal_dates):
                continue

            break_date = signal_dates[idx]

            # Segment before/after
            window = min(30, idx)
            seg_before = signal[max(0, idx - window): idx]
            seg_after  = signal[idx: min(len(signal), idx + window)]

            regime_before = classify_segment(seg_before)
            regime_after  = classify_segment(seg_after)

            mean_before = float(np.mean(seg_before)) if len(seg_before) else None
            mean_after  = float(np.mean(seg_after))  if len(seg_after)  else None
            std_before  = float(np.std(seg_before))  if len(seg_before) else None
            std_after   = float(np.std(seg_after))   if len(seg_after)  else None

            # GDELT lookup
            print(f"  Annotating break {break_date} — fetching GDELT events...", end="", flush=True)
            events = fetch_gdelt_events(break_date, lookback=7)
            print(f" {len(events)} events found")

            all_rows.append({
                "run_date":         today_str,
                "break_date":       str(break_date),
                "series":           "SET",
                "break_series":     series_name,
                "cost_model":       "rbf",
                "penalty":          pen,
                "regime_before":    regime_before,
                "regime_after":     regime_after,
                "mean_before":      round(mean_before * 252, 4) if mean_before else None,  # annualised
                "mean_after":       round(mean_after  * 252, 4) if mean_after  else None,
                "std_before":       round(std_before  * 252**0.5, 4) if std_before else None,  # annualised vol
                "std_after":        round(std_after   * 252**0.5, 4) if std_after  else None,
                "preceding_events": events,
            })

    return all_rows


# ─── Supabase store ────────────────────────────────────────────────────

def store_results(rows: list[dict]) -> bool:
    if not rows:
        print("[breaks] No rows to store")
        return True

    if not HAS_SUPABASE or not SUPABASE_URL:
        print(f"[breaks] No Supabase — {len(rows)} rows computed. Sample:")
        for r in rows[:3]:
            print(f"  {r['break_date']} | {r['break_series']} | {r['regime_before']}→{r['regime_after']}")
        return False

    try:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        today = date.today().isoformat()
        sb.table("structural_breaks").delete().eq("run_date", today).execute()
        for i in range(0, len(rows), 20):
            sb.table("structural_breaks").insert(rows[i:i+20]).execute()
        print(f"[breaks] ✓ Stored {len(rows)} breaks to Supabase")
        return True
    except Exception as e:
        print(f"[breaks] Supabase error: {e}")
        return False


# ─── Summary builder ──────────────────────────────────────────────────

def build_summary(rows: list[dict]) -> dict:
    """Build dashboard-ready summary sorted by date desc."""
    sorted_rows = sorted(rows, key=lambda r: r["break_date"], reverse=True)
    return {
        "run_date":  date.today().isoformat(),
        "breaks":    sorted_rows,
        "count":     len(rows),
        "note":      "Ruptures Pelt (rbf) change-point detection. GDELT events are correlational, not causal.",
    }


# ─── Entry point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    if not HAS_RUPTURES:
        print("Install: pip install ruptures")
        raise SystemExit(1)

    print("=" * 60)
    print("STRUCTURAL BREAK DETECTION")
    print(f"Run: {datetime.now().isoformat()}")
    print("=" * 60)

    rows = run_break_detection()
    store_results(rows)

    summary = build_summary(rows)
    out_path = os.path.join(os.path.dirname(__file__), "breaks_latest.json")
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\n[breaks] Summary → {out_path}")
    print(f"[breaks] Total breaks detected: {len(rows)}")
    for r in rows[:5]:
        print(f"  {r['break_date']}  {r['break_series']:<12}  {r['regime_before']}→{r['regime_after']}")
