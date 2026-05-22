# DayTraders — Dev Log

One entry per meaningful session. Newest at the top.

---

## 2026-05-22 — Real TimesFM via local ingestion (v1.3.0)

**Why this changed**

We shipped a HuggingFace Inference API backend in v1.1.0 expecting that a
free HF token would unlock real TimesFM forecasts. It doesn't. Discovered
after the user pasted a valid token and the dashboard still showed
`BASELINE`. The model uses the custom `timesfm` Python package, not
standard `transformers` — HF's Serverless Inference doesn't route it.

**Shipped**

- `ingestion/forecast.py` — nightly script. Loads TimesFM-2.0-500m via the
  `timesfm` package, pulls 2y of SET closes from yfinance, generates 5-day
  probabilistic forecast at quantiles [.1, .25, .5, .75, .9], writes to
  `public/data/forecasts.json`.
- `ingestion/requirements.txt` — `timesfm`, `torch`, `yfinance`,
  `huggingface_hub`, `numpy`. Python 3.11.
- `src/lib/api/timesfm.ts` — removed `HuggingFaceForecaster` (dead code).
  Added `StaticJsonForecaster` that reads the committed JSON via a Next.js
  static import (works on Cloudflare edge). `selectForecaster()` picks it
  when the JSON is fresh (<48 h), else falls through to stub.
- `src/app/api/forecast/route.ts` — keeps the same response shape;
  history is still fetched for `lastClose` framing but the forecast comes
  from the static JSON.
- `MorningSignal.tsx` — disclaimer copy updated: stub now says
  "RUN npm run ingest:forecast FOR TIMESFM" instead of "ADD HF TOKEN".
- `.env.local` — stripped the now-unused `HUGGINGFACE_API_TOKEN`.
- `docs/TIMESFM_NOTES.md` — fully rewrote the wiring and why-not-HF
  sections. Microservice swap path preserved.
- Version 1.2.0 → **1.3.0**.

**First-run timing on M5 Max** — model download ~4 min (2 GB to HF cache),
forecast generation ~20 s wall clock. Subsequent runs skip the download:
~20 s end-to-end.

**Open**

- Move from `git push` deploy to a scheduled cron once stable.
- Expand `SYMBOLS` from just `^SET.BK` to a SET50 subset for the planned
  Scanner column. The JSON schema is keyed by symbol — one-line change.

---

## 2026-05-22 — STORY panel (v1.2.0)

**Shipped**

- `src/components/Story/StoryModal.tsx` — accessible modal (role=dialog,
  ESC to close, backdrop click, scroll lock). Four sections: genesis, what
  I was looking at, what we're trying to achieve, collaborate. Contacts:
  email, LinkedIn (/in/drnon), GitHub (@Nonarkara), repo link.
- `src/components/Story/StoryButton.tsx` — subtle `STORY` chip trigger,
  hairline-bordered, mono, matches the version-stamp register.
- Wired into TopNav (next to v stamp) on desktop, and into the
  fixed mobile chip in `layout.tsx`.
- Version 1.1.0 → **1.2.0**.

**Voice** — drafted in Dr Non's register per §12: mundane → philosophy
opening ("This started as a private dashboard. A friend wanted to
understand his Thai mutual funds…"), no motivational fluff, no
possessive copy, design-heritage paragraph names Rams/Bloomberg/Vignelli
as colleagues.

**Open**

- Copy is a draft — Dr Non may want to edit any of the four sections.
  All content sits in `StoryModal.tsx` as static JSX; trivial to revise.

---

## 2026-05-22 — TimesFM forecast source

**Shipped**

- `src/lib/api/timesfm.ts` — typed TimesFM client. `Forecaster` interface
  behind two implementations: `HuggingFaceForecaster` (HF Inference API)
  and `StubForecaster` (naive last-value baseline with √t-scaled band).
  Backend selected by `TIMESFM_BACKEND` (default `auto` → HF if
  `HUGGINGFACE_API_TOKEN` set, else stub). Defensive HF response normaliser
  tolerates the common quantile shapes. Single public surface:
  `forecast({ series, horizon, frequency })`. Defaults: horizon 5, freq D.
  Helper `probabilityAtOrAbove()` for `P(touch ≥ X)`.
- `src/app/api/forecast/route.ts` — edge route. Fetches SET history via
  Yahoo (no key), runs the forecast, returns median + quantiles +
  `P(above last close)`, `P(above +1%)`, `P(below −1%)`. 30-min revalidate.
- `src/components/Dashboard/MorningSignal.tsx` — added a probabilistic
  projection block inside the expanded brief. Lazy-loads the forecast
  the first time the panel opens. Renders TIMESFM / BASELINE source badge,
  median T+5, 80% band, P(touch > +1%), last close, P(break < −1%).
  No directional verb. Refresh button.
- `docs/TIMESFM_NOTES.md` — fit / no-fit analysis, env wiring, swap path.
- Version stamp surfaced in TopNav.
- Bumped package version.

**What's next**

- Add a forecast column to the SET50 scanner (separate from Graham screen,
  presented as context not signal).
- Calibration job: 1-year backtest of TimesFM quantile coverage on `^SET.BK`
  and three SET50 names before relying on the bands for risk sizing.
- When forecast volume grows past HF's free-tier rate limit, stand up the
  microservice path described in `TIMESFM_NOTES.md`.

**Open questions**

- HF Inference API cold-start latency on TimesFM (`wait_for_model: true`
  can be 20–60s). Acceptable for the morning brief, blocking for the
  simulator Monte Carlo idea — that feature waits for the microservice.
- Cache TTL: client 1h / edge 30m feels right for daily data. Re-evaluate
  once usage is observable.
- Confirm quantile keys returned by current TimesFM-2.0 HF endpoint match
  the normaliser's expected shapes — first live call may need a defensive
  adjustment if upstream renamed any keys.

**Judgment calls made**

- Lazy-load the forecast on panel open rather than eagerly on mount. The
  morning brief was already lazy; this matches the pattern and avoids
  costing every page load an HF round-trip.
- Show stub output with an explicit `BASELINE` badge instead of hiding it.
  The end-to-end exerciser only works if the projection block renders
  without credentials, and the source must be honest.
- Routed the forecast block into the existing `card--glow` Morning Signal
  container rather than a new card on the desk. Reuses the visual register
  and avoids adding a new top-level surface for a context-only feature.
- Probability framing fixed at ±1% from last close. Could be parameterised
  later; defaulting to the same threshold the technicals side uses for
  "meaningful move" keeps the language consistent across the dashboard.
