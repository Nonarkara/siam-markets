# TimesFM — Fit, Wiring, and No-Fit

Google Research's open-source time-series foundation model, integrated into
the DayTraders dashboard as **probabilistic context** — never as a trade signal.

## What it is

- Decoder-only transformer, ~500M params (TimesFM-2.0 generation).
- Trained on ~100B real-world time-series points (energy, retail, finance, climate, etc.).
- Zero-shot probabilistic forecasting: feed any numeric history → get median + quantile bands.
- License: Apache 2.0. Model card: `google/timesfm-2.0-500m-pytorch` on HuggingFace.
- Context window: ~512 history points. Default horizon: 128 future points (we use 5).
- Frequency: trained on daily-ish series. **Sub-hour is out of distribution.**

## How it's wired here

Nightly local ingestion writes a static JSON. The web app serves it from
the edge — no model inference at request time.

```
ingestion (laptop, daily)                  serving (Cloudflare Pages edge)
─────────────────────────                  ─────────────────────────────
ingestion/forecast.py                      MorningSignal.tsx
  ↓ timesfm 1.3.0 (PyTorch)                  ↓ fetch /api/forecast?symbol=^SET.BK
  ↓ pulls SET history from yfinance        src/app/api/forecast/route.ts
  ↓ runs TimesFM-2.0-500m locally            ↓ forecast() — src/lib/api/timesfm.ts
  ↓ writes public/data/forecasts.json            └─ Forecaster interface
  ↓ git add / commit / push                        ├─ StaticJsonForecaster (real TimesFM)
                                                   └─ StubForecaster (naive baseline)
```

The `Forecaster` interface keeps the backend swappable. `StaticJsonForecaster`
reads the committed JSON via a Next.js static import (works on the
Cloudflare edge runtime). If the JSON is missing or older than 48 h,
`selectForecaster()` falls through to the stub so the dashboard never
breaks.

Returned shape:

```ts
{
  median: number[],
  quantiles: { p10, p25, p50, p75, p90 },
  source: "static-json" | "stub",
  model: string,         // "google/timesfm-2.0-500m-pytorch" or "stub-naive"
  generatedAt: ISO8601,
}
```

A helper `probabilityAtOrAbove(result, threshold)` derives `P(touch ≥ X)` at
horizon end via piecewise linear interpolation over the five quantiles —
adequate for UI framing, not for risk pricing.

## Running the ingestion

```bash
# First time — creates a venv, installs ~3 GB of deps (torch + timesfm + ...)
python3.11 -m venv .venv
.venv/bin/pip install -r ingestion/requirements.txt

# Run the forecast
.venv/bin/python ingestion/forecast.py
# or: npm run ingest:forecast (if .venv/bin/python is on PATH)
```

First model load downloads ~2 GB from HuggingFace into the local HF cache
(no token needed for public models). Subsequent runs reuse the cache and
take ~10–20 s for a single ticker on Apple Silicon.

After the script writes `public/data/forecasts.json`, commit and push —
Cloudflare Pages auto-rebuilds and the live URL picks up the new bands.

## Environment

No env vars are required. The HuggingFace token previously documented is
no longer used — HF's Serverless Inference API does **not** host TimesFM
(see "Why not HF Inference API" below).

## Why not HF Inference API

The model card lists `library_name: "timesfm"` — it uses the custom
`timesfm` Python package, not standard `transformers`. HF Serverless
Inference only auto-serves models with a standard pipeline. TimesFM is
not on that path. Even with a valid token, a POST to
`api-inference.huggingface.co/models/google/timesfm-2.0-500m-pytorch`
will not return a forecast.

The HF Inference Endpoints product (paid) would work, with a custom
inference handler — that's the "microservice swap path" in the section
below. Not justified for daily-frequency data on a single index.

## Where TimesFM slots in (fit list)

1. **Morning Signal (shipped)** — SET 5-day projection inside the morning
   brief. Median + 80% band + P(touch > +1%) + P(break < −1%).
2. **AnomalyStream baseline** — flag readings outside the 80–90% band as
   "out-of-model" anomalies, complementing the rule-based detections.
3. **Scanner forecast column** — for each SET50 ticker on the Graham screen,
   surface "expected close in 5d" as one extra context column. NOT a buy/sell
   column. Pair with margin-of-safety.
4. **Macro / Thailand panels** — short-horizon projections for THB, US 10Y,
   Fed funds path, SET P/E. Pure context for narrative reasoning.
5. **Simulator Monte Carlo** — sample 1,000 paths from the quantile bands to
   stress-test paper trades against probabilistic futures. Each path is
   one quantile draw at each horizon step.
6. **Sector divergence panel** — compare model-implied direction (median up
   vs. down) across sectors, surface divergence as a screen filter.

## Where TimesFM does NOT fit (no-fit list)

- **Intraday tick data.** Model is trained on daily-ish frequency. Sub-hour
  is out of distribution. Do not call from 1m/5m charts.
- **Event-driven moves.** No news intake. A central bank surprise, an
  earnings miss, a coup, a war — all invisible to TimesFM. The model assumes
  the future statistically resembles the past.
- **"Why is this happening" explanation tasks.** Univariate forecaster, no
  causal reasoning, no covariates by default. For "why", use the existing
  NarrativeReality and GDELT pipelines.
- **Wholesale replacement of technicals.** EMA/RSI/MACD/BB are decision-time
  signals on a known history. TimesFM is a probabilistic next-step. They
  answer different questions.
- **Anything labeled as a directional call.** No BUY / SELL / GO LONG verbs.
  If the UI ever surfaces the median without the band, the model gets blamed
  for things it never claimed.

## Critical caveat

**TimesFM forecasts ≠ profitable trades.** The model gives you the
statistical shape of the next 5 trading days conditioned on the recent past.
It does not see news, it does not see fundamentals, it does not anticipate
regime changes, and its bands are nominal — observed realised hit rates on
unfamiliar series can deviate from the labeled quantiles.

Surface it as:
- "expected close: 1340" → **only** when paired with "80% band: 1318–1362"
- "P(touch > +1%) = 22%" → fine — explicit probability, no verb
- "TimesFM says BUY KBANK" → **never**
- "Forecast is up, so the trend is bullish" → **never**

If you find yourself drafting copy that converts a probability into a verb,
stop — that drift is the regression.

## How to bump the model version

Change the `MODEL_ID` constant at the top of `ingestion/forecast.py`. The
ingestion script will pull the new weights on the next run. The
StaticJsonForecaster just trusts the `model` field in the JSON; no code
change in the web app.

## How to swap the backend later

Daily ingestion is enough for SET (one index, slow-moving). When the
project grows — many tickers, intraday, on-demand re-runs — stand up a
microservice:

1. Run `ingestion/forecast.py`'s core as a FastAPI server (Render / Cloud
   Run). Endpoint `/forecast` accepting `{ symbol, history, horizon }`,
   returning the same quantile shape.
2. In `src/lib/api/timesfm.ts`, add a third class implementing `Forecaster`,
   e.g. `MicroserviceForecaster(url, token)`.
3. Extend `selectForecaster()` to prefer it when a `TIMESFM_SERVICE_URL`
   env var is present.

Call sites — Morning Signal, `/api/forecast`, future Scanner column — do
not change.

## Open questions

- Quantile calibration on Thai equities is unknown. Add a calibration job
  that compares realised vs. predicted quantile coverage over a 1-year
  backtest before relying on the bands for risk sizing.
- Ingestion is currently manual. Automate via launchd / GitHub Action on
  a daily cron once the schema is stable.
- TimesFM-2.0 was trained on global daily series; explicit fine-tune on
  SET / SET50 may improve calibration. Open question whether the marginal
  gain is worth the engineering — the zero-shot baseline is likely fine
  for context-only use.
