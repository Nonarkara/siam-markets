"""
forecast.py — Generate TimesFM 5-day probabilistic forecasts for SET.

Runs on Dr Non's M5 Max (or any host with the `timesfm` package available)
nightly. Output is committed to public/data/forecasts.json and served
statically by the dashboard. No inference at request time.

Run:    python3 ingestion/forecast.py
Schedule: daily after 18:00 Bangkok time (after SET close, 16:30 BKK)

The `timesfm` Python package pulls model weights from HuggingFace on first
run (~2 GB, cached locally afterwards). It uses the custom TimesFM
inference path — not transformers — which is why HuggingFace Inference API
cannot serve this model directly.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "forecasts.json"

# Symbols to forecast. Schema is keyed by symbol so expansion is trivial.
SYMBOLS = [
    "^SET.BK",
]

HORIZON = 5
QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9]
HISTORY_PERIOD = "2y"  # TimesFM-2.0 context window is ~512 daily points
MODEL_ID = "google/timesfm-2.0-500m-pytorch"


def load_model():
    """Lazy-load TimesFM. Fails loudly if the package is missing."""
    try:
        import timesfm
    except ImportError:
        print("ERROR: pip install -r ingestion/requirements.txt", file=sys.stderr)
        sys.exit(1)

    print(f"Loading {MODEL_ID} (first run downloads ~2GB)...", flush=True)
    # TimesFM-2.0-500m architecture: 50 layers, 2048 context, no positional embedding.
    tfm = timesfm.TimesFm(
        hparams=timesfm.TimesFmHparams(
            backend="cpu",
            per_core_batch_size=32,
            horizon_len=HORIZON,
            num_layers=50,
            use_positional_embedding=False,
            context_len=2048,
        ),
        checkpoint=timesfm.TimesFmCheckpoint(huggingface_repo_id=MODEL_ID),
    )
    return tfm


def fetch_history(symbol: str) -> list[float]:
    """Pull daily closes from yfinance. Returns ascending-by-date floats."""
    try:
        import yfinance as yf
    except ImportError:
        print("ERROR: pip install -r ingestion/requirements.txt", file=sys.stderr)
        sys.exit(1)

    df = yf.download(symbol, period=HISTORY_PERIOD, interval="1d", progress=False, auto_adjust=False)
    if df is None or df.empty:
        return []
    # yfinance >=0.2.x can return a MultiIndex with the ticker as the second
    # level. Pick the Close column, flatten if needed, drop NaNs, cast.
    close = df["Close"]
    if hasattr(close, "columns"):
        close = close.iloc[:, 0]
    return [float(x) for x in close.dropna().tolist()]


def forecast_one(tfm, series: list[float]) -> dict:
    """Run TimesFM on a single series. Returns median + 5 quantile bands."""
    point_forecast, quantile_forecast = tfm.forecast(
        inputs=[series],
        freq=[0],  # 0 = daily / high-frequency in TimesFM convention
    )

    # quantile_forecast has shape [1, horizon, 10] for the 9 quantiles + mean.
    # TimesFM-2.0 returns quantiles at [0.1, 0.2, ..., 0.9].
    qf = quantile_forecast[0]  # → shape [horizon, 10]

    # Index map for TimesFM quantiles: column 0 is mean, columns 1..9 are
    # quantiles 0.1, 0.2, ..., 0.9.
    def col(q: float) -> list[float]:
        # q ∈ {0.1, 0.25, 0.5, 0.75, 0.9}
        # 0.1 → 1, 0.25 → interpolate(1, 2), 0.5 → 5, 0.75 → interpolate(7, 8), 0.9 → 9
        if q in (0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9):
            idx = int(round(q * 10))
            return [float(row[idx]) for row in qf]
        # Linear interp between neighbouring deciles for 0.25 / 0.75
        lo, hi = (0.2, 0.3) if q == 0.25 else (0.7, 0.8)
        lo_idx, hi_idx = int(round(lo * 10)), int(round(hi * 10))
        return [
            float(row[lo_idx] + (row[hi_idx] - row[lo_idx]) * 0.5)
            for row in qf
        ]

    median = col(0.5)
    return {
        "median": median,
        "quantiles": {
            "p10": col(0.1),
            "p25": col(0.25),
            "p50": median,
            "p75": col(0.75),
            "p90": col(0.9),
        },
    }


def main() -> int:
    tfm = load_model()
    series_out: dict[str, dict] = {}

    for symbol in SYMBOLS:
        print(f"  fetching {symbol}...", flush=True)
        series = fetch_history(symbol)
        if len(series) < 64:
            print(f"  skip {symbol}: only {len(series)} points")
            continue

        print(f"  forecasting {symbol} ({len(series)} pts → {HORIZON})...", flush=True)
        result = forecast_one(tfm, series)
        result["lastClose"] = series[-1]
        series_out[symbol] = result
        print(f"  ✓ {symbol}: median {result['median'][-1]:.2f}, p10 {result['quantiles']['p10'][-1]:.2f}, p90 {result['quantiles']['p90'][-1]:.2f}")

    payload = {
        "asOf": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "model": MODEL_ID,
        "horizon": HORIZON,
        "frequency": "D",
        "series": series_out,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    print(f"wrote {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
