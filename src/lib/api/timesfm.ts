/**
 * TimesFM client — Google Research's time-series foundation model.
 *
 * Probabilistic context only. Returns median + quantile band so the caller
 * can never accidentally render a point estimate without uncertainty.
 *
 * Backend is swappable behind the `Forecaster` interface:
 *   - HuggingFaceForecaster — calls the HF Inference API. Needs HUGGINGFACE_API_TOKEN.
 *   - StubForecaster        — naive last-value baseline with a noise band.
 *                             Used when no token is present so the rest of
 *                             the app can be exercised end-to-end.
 *
 * To swap to a self-hosted FastAPI/Cloud Run microservice later, add a
 * third class implementing `Forecaster` and route via TIMESFM_BACKEND.
 *
 * See docs/TIMESFM_NOTES.md for the fit/no-fit analysis.
 */

export type Frequency = "D" | "W" | "M";

export interface ForecastInput {
  series: number[];
  horizon?: number;       // default 5 (trading days)
  frequency?: Frequency;  // default "D"
}

export interface ForecastQuantiles {
  p10: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p90: number[];
}

export interface ForecastResult {
  median: number[];               // == quantiles.p50, exposed for convenience
  quantiles: ForecastQuantiles;
  horizon: number;
  frequency: Frequency;
  source: "timesfm-hf" | "stub";
  model: string;                  // HF model id, or "stub-naive"
  generatedAt: string;
}

interface Forecaster {
  readonly name: ForecastResult["source"];
  readonly model: string;
  forecast(input: Required<ForecastInput>): Promise<{
    median: number[];
    quantiles: ForecastQuantiles;
  }>;
}

const DEFAULT_HORIZON: number = 5;
const DEFAULT_FREQUENCY: Frequency = "D";
const DEFAULT_HF_MODEL = "google/timesfm-2.0-500m-pytorch";

// ─── HuggingFace Inference API backend ──────────────────────────────
//
// The HF Inference API for TimesFM accepts a JSON payload with the
// history series and returns quantile forecasts. The exact response
// shape depends on the model card; we normalise here defensively so
// the rest of the app can be tolerant of upstream changes.

class HuggingFaceForecaster implements Forecaster {
  readonly name = "timesfm-hf" as const;
  readonly model: string;
  private readonly token: string;

  constructor(token: string, model: string = DEFAULT_HF_MODEL) {
    this.token = token;
    this.model = model;
  }

  async forecast(input: Required<ForecastInput>) {
    const url = `https://api-inference.huggingface.co/models/${this.model}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          history: input.series,
          horizon: input.horizon,
          frequency: input.frequency,
        },
        options: { wait_for_model: true },
      }),
      // Force fresh each call; this is a forecast, not a cached read.
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`TimesFM HF error ${res.status}: ${await res.text().catch(() => "")}`);
    }

    const json = await res.json();
    return normaliseHfResponse(json, input.horizon);
  }
}

// Defensive normaliser — TimesFM HF endpoints have historically returned
// either an object with quantile keys or a 2D array indexed by quantile.
function normaliseHfResponse(
  raw: unknown,
  horizon: number,
): { median: number[]; quantiles: ForecastQuantiles } {
  // Shape A: { quantiles: { "0.1": [...], "0.5": [...], ... } }
  const r = raw as Record<string, unknown>;
  const q = (r?.quantiles ?? r) as Record<string, unknown> | undefined;

  function pick(keys: string[]): number[] | null {
    if (!q) return null;
    for (const k of keys) {
      const v = q[k];
      if (Array.isArray(v) && v.every((n) => typeof n === "number")) {
        return v as number[];
      }
    }
    return null;
  }

  const p10 = pick(["0.1", "p10", "q10"]);
  const p25 = pick(["0.25", "p25", "q25"]);
  const p50 = pick(["0.5", "p50", "q50", "median", "mean"]);
  const p75 = pick(["0.75", "p75", "q75"]);
  const p90 = pick(["0.9", "p90", "q90"]);

  // Shape B: a flat array — treat as median, derive a wider/narrower band.
  if (!p50 && Array.isArray(raw) && raw.every((n) => typeof n === "number")) {
    const med = raw as number[];
    return widenAroundMedian(med, horizon);
  }

  if (!p50) {
    throw new Error("TimesFM response missing median (p50)");
  }

  return {
    median: p50.slice(0, horizon),
    quantiles: {
      p10: (p10 ?? p50.map((v) => v * 0.97)).slice(0, horizon),
      p25: (p25 ?? p50.map((v) => v * 0.985)).slice(0, horizon),
      p50: p50.slice(0, horizon),
      p75: (p75 ?? p50.map((v) => v * 1.015)).slice(0, horizon),
      p90: (p90 ?? p50.map((v) => v * 1.03)).slice(0, horizon),
    },
  };
}

// ─── Stub backend (used when HUGGINGFACE_API_TOKEN is missing) ─────
//
// Naive baseline: last value carried forward, with a band that widens
// linearly with horizon. This is *deliberately weak* — it exists so the
// dashboard can render and so type/build verification works without a
// network call. The UI must never confuse this with real model output;
// the `source: "stub"` field is the contract.

class StubForecaster implements Forecaster {
  readonly name = "stub" as const;
  readonly model = "stub-naive";

  async forecast(input: Required<ForecastInput>) {
    return Promise.resolve(naiveBaseline(input.series, input.horizon));
  }
}

function naiveBaseline(series: number[], horizon: number) {
  if (series.length === 0) {
    const zeros = new Array(horizon).fill(0);
    return {
      median: zeros,
      quantiles: { p10: zeros, p25: zeros, p50: zeros, p75: zeros, p90: zeros },
    };
  }

  const last = series[series.length - 1];

  // Sample std of recent log-returns (lookback up to 60).
  const lookback = Math.min(60, series.length - 1);
  let stdRet = 0.01;
  if (lookback > 1) {
    const rets: number[] = [];
    for (let i = series.length - lookback; i < series.length; i++) {
      const a = series[i - 1];
      const b = series[i];
      if (a > 0 && b > 0) rets.push(Math.log(b / a));
    }
    const mean = rets.reduce((s, x) => s + x, 0) / rets.length;
    const variance = rets.reduce((s, x) => s + (x - mean) * (x - mean), 0) / Math.max(1, rets.length - 1);
    stdRet = Math.sqrt(variance);
  }

  const median: number[] = [];
  const p10: number[] = [], p25: number[] = [], p75: number[] = [], p90: number[] = [];

  for (let h = 1; h <= horizon; h++) {
    median.push(last);
    // Sqrt-time scaling — band widens with horizon, in line with
    // a random-walk null hypothesis.
    const w = stdRet * Math.sqrt(h);
    p10.push(last * Math.exp(-1.2816 * w));
    p25.push(last * Math.exp(-0.6745 * w));
    p75.push(last * Math.exp( 0.6745 * w));
    p90.push(last * Math.exp( 1.2816 * w));
  }

  return {
    median,
    quantiles: { p10, p25, p50: median, p75, p90 },
  };
}

function widenAroundMedian(med: number[], horizon: number) {
  const stub = naiveBaseline(med.length ? med : [1], horizon);
  // Use HF median, stub band shape, anchored to the HF median.
  const safe = med.slice(0, horizon);
  const baseline = stub.median[0] || 1;
  const ratio = (v: number) => v / baseline;
  return {
    median: safe,
    quantiles: {
      p10: stub.quantiles.p10.map((v, i) => safe[i] * ratio(v)),
      p25: stub.quantiles.p25.map((v, i) => safe[i] * ratio(v)),
      p50: safe,
      p75: stub.quantiles.p75.map((v, i) => safe[i] * ratio(v)),
      p90: stub.quantiles.p90.map((v, i) => safe[i] * ratio(v)),
    },
  };
}

// ─── Backend selection ──────────────────────────────────────────────

function selectForecaster(): Forecaster {
  const backend = (process.env.TIMESFM_BACKEND ?? "auto").toLowerCase();
  const token = process.env.HUGGINGFACE_API_TOKEN;
  const model = process.env.TIMESFM_MODEL ?? DEFAULT_HF_MODEL;

  if (backend === "stub") return new StubForecaster();
  if (backend === "hf" || backend === "huggingface") {
    if (!token) throw new Error("TIMESFM_BACKEND=hf but HUGGINGFACE_API_TOKEN is missing");
    return new HuggingFaceForecaster(token, model);
  }
  // auto: HF if token present, else stub.
  if (token) return new HuggingFaceForecaster(token, model);
  return new StubForecaster();
}

// ─── Public surface ─────────────────────────────────────────────────

export async function forecast(input: ForecastInput): Promise<ForecastResult> {
  const horizon = input.horizon ?? DEFAULT_HORIZON;
  const frequency = input.frequency ?? DEFAULT_FREQUENCY;
  const series = sanitiseSeries(input.series);

  if (series.length < 8) {
    // Too short for any model to say anything useful — fall back to stub
    // and surface the source so the UI can downgrade messaging.
    const { median, quantiles } = await new StubForecaster().forecast({ series, horizon, frequency });
    return {
      median, quantiles, horizon, frequency,
      source: "stub", model: "stub-naive",
      generatedAt: new Date().toISOString(),
    };
  }

  const f = selectForecaster();
  try {
    const out = await f.forecast({ series, horizon, frequency });
    return {
      median: out.median,
      quantiles: out.quantiles,
      horizon, frequency,
      source: f.name,
      model: f.model,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    // Network or model failure → stub fallback, but tag the source honestly.
    const stub = new StubForecaster();
    const out = await stub.forecast({ series, horizon, frequency });
    return {
      median: out.median,
      quantiles: out.quantiles,
      horizon, frequency,
      source: "stub",
      model: `stub-naive (fallback: ${(err as Error).message.slice(0, 80)})`,
      generatedAt: new Date().toISOString(),
    };
  }
}

function sanitiseSeries(series: number[]): number[] {
  return series.filter((v) => typeof v === "number" && Number.isFinite(v) && v > 0);
}

// ─── Helpers callers commonly need ──────────────────────────────────

/**
 * Probability that the path touches above a threshold by horizon end,
 * approximated from the empirical CDF defined by the five quantiles.
 * Linear interpolation between (p10, p25, p50, p75, p90) — adequate for
 * UI framing, not for risk pricing.
 */
export function probabilityAtOrAbove(
  result: ForecastResult,
  threshold: number,
  horizonStep?: number,
): number {
  const i = (horizonStep ?? result.horizon) - 1;
  const q = result.quantiles;
  const pts: Array<[number, number]> = ([
    [q.p10[i], 0.10],
    [q.p25[i], 0.25],
    [q.p50[i], 0.50],
    [q.p75[i], 0.75],
    [q.p90[i], 0.90],
  ] as Array<[number, number]>).sort((a, b) => a[0] - b[0]);

  // CDF(threshold) via piecewise linear interp on the sorted (value → quantile) points.
  if (threshold <= pts[0][0]) return 1 - pts[0][1] * (threshold / pts[0][0]);
  if (threshold >= pts[pts.length - 1][0]) {
    return Math.max(0, 1 - pts[pts.length - 1][1]) * 0.5;
  }
  let cdf = pts[0][1];
  for (let k = 1; k < pts.length; k++) {
    const [v0, c0] = pts[k - 1];
    const [v1, c1] = pts[k];
    if (threshold >= v0 && threshold <= v1) {
      const t = (threshold - v0) / (v1 - v0 || 1);
      cdf = c0 + t * (c1 - c0);
      break;
    }
  }
  return Math.max(0, Math.min(1, 1 - cdf));
}
