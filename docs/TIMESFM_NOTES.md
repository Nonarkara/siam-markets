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

```
client (MorningSignal)
   ↓ fetch /api/forecast?symbol=^SET.BK&horizon=5
edge route src/app/api/forecast/route.ts
   ↓ fetchHistoricalPrices() — Yahoo, no key
   ↓ forecast() — src/lib/api/timesfm.ts
       └─ Forecaster interface
              ├─ HuggingFaceForecaster  (when HUGGINGFACE_API_TOKEN set)
              └─ StubForecaster          (naive last-value baseline, no key)
```

The `Forecaster` interface keeps the backend swappable. Today: HF Inference
API. Tomorrow: a self-hosted FastAPI/Cloud Run microservice running TimesFM
locally for cost/latency control. Call sites do not change.

Returned shape:

```ts
{
  median: number[],
  quantiles: { p10, p25, p50, p75, p90 },
  source: "timesfm-hf" | "stub",
  model: string,         // HF model id, or "stub-naive"
  generatedAt: ISO8601,
}
```

A helper `probabilityAtOrAbove(result, threshold)` derives `P(touch ≥ X)` at
horizon end via piecewise linear interpolation over the five quantiles —
adequate for UI framing, not for risk pricing.

## Environment variables

| Var | Purpose | Default |
|---|---|---|
| `HUGGINGFACE_API_TOKEN` | HF Inference auth. Missing → stub backend. | unset |
| `TIMESFM_MODEL` | HF model id, lets you bump versions without code changes. | `google/timesfm-2.0-500m-pytorch` |
| `TIMESFM_BACKEND` | `auto` \| `hf` \| `stub`. `auto` picks HF when token is present. | `auto` |

Without any env var the app boots and the projection block renders against
the stub backend — naive last-value with √t-scaled band — so the end-to-end
pipeline is exercisable in CI and on a fresh checkout.

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

The HF model id is environment-driven. To move to TimesFM 2.5 / 3.0 when it
ships:

```bash
# .env.local
TIMESFM_MODEL=google/timesfm-2.5-500m-pytorch
```

No code changes needed. The defensive normaliser in `timesfm.ts` tolerates
the common HF response shapes (`{ quantiles: { "0.5": [...] }}`, flat array,
keyed objects).

## How to swap the backend later

Today's HF Inference API is fastest to try, costs per request, and is rate-
limited. When forecast volume grows, swap to a self-hosted microservice:

1. Run TimesFM on Cloud Run or a small Render GPU box. FastAPI server,
   `/forecast` endpoint accepting `{ history, horizon, frequency }`,
   returning `{ quantiles: { p10, p25, p50, p75, p90 } }`.
2. In `src/lib/api/timesfm.ts`, add a third class implementing `Forecaster`,
   e.g. `MicroserviceForecaster(url, token)`.
3. Extend `selectForecaster()`:
   ```ts
   if (backend === "microservice") return new MicroserviceForecaster(url, token);
   ```
4. Add `TIMESFM_BACKEND=microservice` and `TIMESFM_SERVICE_URL=…` to env.

Call sites — Morning Signal, `/api/forecast`, future Scanner column — do
not change.

## Open questions

- HF Inference API for TimesFM has historically been slow to warm up
  (`wait_for_model: true` can take 20–60s on first hit). Acceptable for a
  morning brief; not acceptable for the simulator's 1,000-path Monte Carlo.
  That feature should wait for the microservice swap.
- Quantile calibration on Thai equities is unknown. Add a calibration job
  that compares realised vs. predicted quantile coverage over a 1-year
  backtest before relying on the bands for risk sizing.
- Decide a cache TTL policy: SET closes daily, so 1h on the client and 30m
  on the edge route is sane. If the model is ever called on weekly closes
  the TTL should rise to a day.
