# DayTraders — Dev Log

One entry per meaningful session. Newest at the top.

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
