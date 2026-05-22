"""
run_daily.py — Daily orchestrator for the causal intelligence pipeline.

Schedule (Bangkok time ICT, UTC+7):
  17:00 — Market closes at 16:30. Run prices.py first.
  17:30 — Prices in Supabase. Run regime + forecast.
  18:00 — Run sentiment (slower, NLP models).
  Weekly (Monday 08:00): run granger + breaks.

Quickstart:
  python3 ingestion/run_daily.py --all       # run everything
  python3 ingestion/run_daily.py --regime    # just regime
  python3 ingestion/run_daily.py --forecast  # just forecast
  python3 ingestion/run_daily.py --sentiment # just sentiment
  python3 ingestion/run_daily.py --weekly    # Granger + breaks (slow)

Cron example (crontab -e):
  30 10 * * 1-5 cd /path/to/project && python3 ingestion/run_daily.py --regime --forecast
  0  11 * * 1-5 cd /path/to/project && python3 ingestion/run_daily.py --sentiment
  0   1 * * 1   cd /path/to/project && python3 ingestion/run_daily.py --weekly
"""

import sys
import os
import argparse
from datetime import datetime

# Ensure the ingestion directory is on the path
sys.path.insert(0, os.path.dirname(__file__))


def run_regime():
    print("\n" + "═"*50 + "\n REGIME CLASSIFICATION\n" + "═"*50)
    from regime import run_regime_classification, store_results, build_summary
    import json
    rows    = run_regime_classification()
    store_results(rows)
    summary = build_summary(rows)
    if summary:
        t = summary.get("today", {})
        print(f"\n  Today: {t.get('regime', '?').upper()} "
              f"Bull={t.get('bull_prob', 0):.0%} "
              f"Bear={t.get('bear_prob', 0):.0%} "
              f"Ranging={t.get('ranging_prob', 0):.0%}")


def run_forecast():
    print("\n" + "═"*50 + "\n 5-DAY SET FORECAST\n" + "═"*50)
    from forecast import fetch_set_levels, fetch_causal_data as _cd
    from forecast import run_darts_forecast, run_arima_forecast, store_results
    import forecast as fc
    close = fetch_set_levels()
    df_macro = fc.fetch_causal_data(lookback_days=fc.LOOKBACK) if close is not None and not close.empty else None
    if fc.HAS_DARTS and df_macro is not None:
        rows = run_darts_forecast(close, df_macro)
    else:
        rows = []
    if not rows:
        rows = run_arima_forecast(close)
    store_results(rows)


def run_sentiment():
    print("\n" + "═"*50 + "\n SENTIMENT PIPELINE\n" + "═"*50)
    from sentiment import run_sentiment_pipeline, store_results
    rows = run_sentiment_pipeline()
    store_results(rows)


def run_granger():
    print("\n" + "═"*50 + "\n GRANGER CAUSALITY\n" + "═"*50)
    from granger import run_granger_analysis, store_results, build_summary, fetch_causal_data
    import json, os
    df      = fetch_causal_data()
    rows    = run_granger_analysis(df)
    store_results(rows)
    summary = build_summary(rows)
    out_path = os.path.join(os.path.dirname(__file__), "granger_latest.json")
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)


def run_breaks():
    print("\n" + "═"*50 + "\n STRUCTURAL BREAK DETECTION\n" + "═"*50)
    from breaks import run_break_detection, store_results, build_summary
    import json, os
    rows    = run_break_detection()
    store_results(rows)
    summary = build_summary(rows)
    out_path = os.path.join(os.path.dirname(__file__), "breaks_latest.json")
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="DayTraders Causal Intelligence Pipeline")
    parser.add_argument("--regime",    action="store_true", help="Run GMM regime classification")
    parser.add_argument("--forecast",  action="store_true", help="Run 5-day SET forecast")
    parser.add_argument("--sentiment", action="store_true", help="Run news sentiment pipeline")
    parser.add_argument("--granger",   action="store_true", help="Run Granger causality analysis (slow)")
    parser.add_argument("--breaks",    action="store_true", help="Run structural break detection")
    parser.add_argument("--weekly",    action="store_true", help="Run weekly tasks (granger + breaks)")
    parser.add_argument("--all",       action="store_true", help="Run everything")
    args = parser.parse_args()

    start = datetime.now()
    print(f"\nDayTraders Causal Intelligence Pipeline — {start.isoformat()}")
    print(f"Working dir: {os.getcwd()}")

    if args.all or args.regime:
        try:
            run_regime()
        except Exception as e:
            print(f"\n[orchestrator] Regime error: {e}")

    if args.all or args.forecast:
        try:
            run_forecast()
        except Exception as e:
            print(f"\n[orchestrator] Forecast error: {e}")

    if args.all or args.sentiment:
        try:
            run_sentiment()
        except Exception as e:
            print(f"\n[orchestrator] Sentiment error: {e}")

    if args.all or args.weekly or args.granger:
        try:
            run_granger()
        except Exception as e:
            print(f"\n[orchestrator] Granger error: {e}")

    if args.all or args.weekly or args.breaks:
        try:
            run_breaks()
        except Exception as e:
            print(f"\n[orchestrator] Breaks error: {e}")

    if not any(vars(args).values()):
        print("\nNo task specified. Use --help to see options.")
        print("Quick start: python3 ingestion/run_daily.py --all")

    elapsed = (datetime.now() - start).seconds
    print(f"\n✓ Pipeline complete in {elapsed}s")


if __name__ == "__main__":
    main()
