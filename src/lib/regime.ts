export type RegimeKind = "bull" | "bear" | "ranging";
export type RegimeSource = "supabase" | "demo";
export type RegimeSeverity = "constructive" | "neutral" | "defensive";

export interface RegimeDay {
  date: string;
  regime: RegimeKind;
  bull_prob: number;
  bear_prob: number;
  ranging_prob: number;
  set_return_5d?: number | null;
  set_vol_20d?: number | null;
  vix?: number | null;
}

export interface RegimeSummary {
  today: RegimeDay;
  regime_counts_60d: Record<RegimeKind, number>;
  history: RegimeDay[];
  run_date: string;
  note: string;
  source: RegimeSource;
}

export interface RegimeEvidence {
  label: string;
  state: string;
  value: string;
  detail: string;
  severity: RegimeSeverity;
}

export interface AllocationStance {
  label: string;
  equity: number;
  bonds: number;
  cash: number;
  realAssets: number;
  tradeRisk: string;
  portfolioAction: string;
  planningAction: string;
}

export const REGIME_LABEL: Record<RegimeKind, string> = {
  bull: "BULL",
  bear: "BEAR",
  ranging: "RANGE",
};

export const REGIME_COLOR: Record<RegimeKind, string> = {
  bull: "var(--bull)",
  bear: "var(--bear)",
  ranging: "var(--caution)",
};

export const SEVERITY_COLOR: Record<RegimeSeverity, string> = {
  constructive: "var(--bull)",
  neutral: "var(--caution)",
  defensive: "var(--bear)",
};

const MS_DAY = 86_400_000;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcDateOnly(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function tradingDaysEnding(asOf: Date, count: number): Date[] {
  const days: Date[] = [];
  let cursor = utcDateOnly(asOf);
  while (days.length < count) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) days.unshift(new Date(cursor));
    cursor = new Date(cursor.getTime() - MS_DAY);
  }
  return days;
}

function normalizedCounts(history: RegimeDay[], lookback = 60): Record<RegimeKind, number> {
  const counts: Record<RegimeKind, number> = { bull: 0, bear: 0, ranging: 0 };
  history.slice(-lookback).forEach(day => {
    counts[day.regime] += 1;
  });
  return counts;
}

function pickRegime(bull: number, bear: number, ranging: number): RegimeKind {
  if (bull >= bear && bull >= ranging) return "bull";
  if (bear >= ranging) return "bear";
  return "ranging";
}

function demoProbabilities(index: number): Pick<RegimeDay, "regime" | "bull_prob" | "bear_prob" | "ranging_prob" | "set_return_5d" | "set_vol_20d" | "vix"> {
  const phase = index / 59;
  const cycle = Math.sin(index * 0.37);
  const stress = Math.max(0, phase - 0.58);
  const bullRaw = 0.55 - stress * 0.42 + cycle * 0.08;
  const bearRaw = 0.18 + stress * 0.48 - cycle * 0.05;
  const rangeRaw = 0.27 + Math.cos(index * 0.22) * 0.08;
  const total = Math.max(0.01, bullRaw + bearRaw + rangeRaw);
  const bull = clamp01(bullRaw / total);
  const bear = clamp01(bearRaw / total);
  const ranging = clamp01(1 - bull - bear);

  return {
    regime: pickRegime(bull, bear, ranging),
    bull_prob: round2(bull),
    bear_prob: round2(bear),
    ranging_prob: round2(ranging),
    set_return_5d: round2((bull - bear) * 5.8 + cycle * 0.6),
    set_vol_20d: round2(0.13 + bear * 0.16 + Math.abs(cycle) * 0.02),
    vix: round2(14 + bear * 18 + Math.abs(cycle) * 2),
  };
}

export function buildFallbackRegimeSummary(asOf = new Date()): RegimeSummary {
  const days = tradingDaysEnding(asOf, 60);
  const history = days.map((day, index) => ({
    date: isoDate(day),
    ...demoProbabilities(index),
  }));
  const today = history[history.length - 1];

  return {
    today,
    regime_counts_60d: normalizedCounts(history),
    history,
    run_date: today.date,
    note: "Demo fallback. Populate market_regimes with the ingestion/regime.py GMM classifier for live classification.",
    source: "demo",
  };
}

export function normalizeRegimeSummary(summary: Omit<RegimeSummary, "regime_counts_60d" | "source"> & Partial<Pick<RegimeSummary, "regime_counts_60d" | "source">>): RegimeSummary {
  const history = summary.history.map(day => ({
    ...day,
    bull_prob: round2(clamp01(day.bull_prob)),
    bear_prob: round2(clamp01(day.bear_prob)),
    ranging_prob: round2(clamp01(day.ranging_prob)),
  }));
  const today = history.find(day => day.date === summary.today.date) ?? summary.today;
  return {
    ...summary,
    today,
    history,
    regime_counts_60d: summary.regime_counts_60d ?? normalizedCounts(history),
    source: summary.source ?? "demo",
  };
}

export function dominantProbability(day: RegimeDay): number {
  return Math.max(day.bull_prob, day.bear_prob, day.ranging_prob);
}

export function confidenceLabel(day: RegimeDay): string {
  const confidence = dominantProbability(day);
  if (confidence >= 0.7) return "HIGH CONFIDENCE";
  if (confidence >= 0.52) return "MODERATE CONFIDENCE";
  return "LOW CONFIDENCE";
}

export function sourceLabel(source: RegimeSource): string {
  return source === "supabase" ? "LIVE MODEL" : "DEMO FALLBACK";
}

export function sourceDetail(summary: RegimeSummary): string {
  return summary.source === "supabase"
    ? "Supabase market_regimes table. 3-component GMM on SET returns, volatility, VIX, THB and macro context."
    : "Deterministic demo sequence. Replace with ingestion/regime.py output before treating signals as live.";
}

export function regimeDescription(kind: RegimeKind): string {
  if (kind === "bull") return "Trend and liquidity are constructive. Risk can be taken, but entries still need valuation and price confirmation.";
  if (kind === "bear") return "Capital preservation dominates. Graham margin of safety and cash discipline matter more than prediction.";
  return "Direction is unresolved. Trade smaller, fade extremes, and wait for either trend confirmation or value dislocation.";
}

export function allocationStance(kind: RegimeKind): AllocationStance {
  if (kind === "bull") {
    return {
      label: "GROWTH WITH GUARDRAILS",
      equity: 60,
      bonds: 20,
      cash: 10,
      realAssets: 10,
      tradeRisk: "Full planned size only when trend, volume and stop distance align.",
      portfolioAction: "Let winners run, rebalance away from concentration, avoid late-cycle leverage.",
      planningAction: "Automate contributions and keep emergency cash untouched.",
    };
  }
  if (kind === "bear") {
    return {
      label: "DEFENSIVE GRAHAM SPLIT",
      equity: 35,
      bonds: 35,
      cash: 20,
      realAssets: 10,
      tradeRisk: "Half size or less. No averaging down without a written margin-of-safety thesis.",
      portfolioAction: "Raise quality, reduce overlap, keep cash as an option on future dislocation.",
      planningAction: "Protect runway first. Delay speculative buys until valuation and regime both improve.",
    };
  }
  return {
    label: "RANGE DISCIPLINE",
    equity: 45,
    bonds: 25,
    cash: 20,
    realAssets: 10,
    tradeRisk: "Smaller size. Take profits near range edges instead of waiting for heroic continuation.",
    portfolioAction: "Prefer diversified quality and tax-advantaged accumulation over theme chasing.",
    planningAction: "Build the plan, fund the plan, and wait for a cleaner regime before pressing risk.",
  };
}

export function buildEvidence(summary: RegimeSummary): RegimeEvidence[] {
  const { today, regime_counts_60d: counts } = summary;
  const total = Math.max(1, counts.bull + counts.bear + counts.ranging);
  const bearShare = counts.bear / total;
  const bullShare = counts.bull / total;
  const vol = today.set_vol_20d ?? null;
  const vix = today.vix ?? null;
  const ret = today.set_return_5d ?? null;

  return [
    {
      label: "MODEL VOTE",
      state: `${REGIME_LABEL[today.regime]} ${Math.round(dominantProbability(today) * 100)}%`,
      value: `${Math.round(today.bull_prob * 100)} / ${Math.round(today.ranging_prob * 100)} / ${Math.round(today.bear_prob * 100)}`,
      detail: "Bull / range / bear probability from the current classifier row.",
      severity: today.regime === "bull" ? "constructive" : today.regime === "bear" ? "defensive" : "neutral",
    },
    {
      label: "60D TAPE",
      state: bearShare > 0.38 ? "DEFENSIVE SKEW" : bullShare > 0.45 ? "BULLISH SKEW" : "MIXED TAPE",
      value: `${counts.bull}B ${counts.ranging}R ${counts.bear}D`,
      detail: "How often each regime appeared in the latest 60 trading sessions.",
      severity: bearShare > 0.38 ? "defensive" : bullShare > 0.45 ? "constructive" : "neutral",
    },
    {
      label: "VOLATILITY",
      state: vix != null && vix >= 25 ? "STRESS" : vix != null && vix <= 16 ? "CALM" : "WATCH",
      value: vix == null ? "N/A" : vix.toFixed(1),
      detail: "VIX proxy from the classifier row. Calm volatility can still coexist with fragile valuations.",
      severity: vix != null && vix >= 25 ? "defensive" : vix != null && vix <= 16 ? "constructive" : "neutral",
    },
    {
      label: "SET MOMENTUM",
      state: ret != null && ret > 2 ? "BID" : ret != null && ret < -2 ? "OFFERED" : "FLAT",
      value: ret == null ? "N/A" : `${ret > 0 ? "+" : ""}${ret.toFixed(2)}%`,
      detail: "Five-day SET return context. This informs timing, not intrinsic value.",
      severity: ret != null && ret > 2 ? "constructive" : ret != null && ret < -2 ? "defensive" : "neutral",
    },
    {
      label: "REALIZED VOL",
      state: vol != null && vol >= 0.24 ? "WIDE STOPS" : vol != null && vol <= 0.16 ? "NORMAL" : "ELEVATED",
      value: vol == null ? "N/A" : `${Math.round(vol * 100)}%`,
      detail: "20-day SET volatility estimate. Wider volatility lowers allowable position size.",
      severity: vol != null && vol >= 0.24 ? "defensive" : vol != null && vol <= 0.16 ? "constructive" : "neutral",
    },
  ];
}

export function marketMoodFromRegime(kind: RegimeKind): { label: string; detail: string; color: string } {
  if (kind === "bull") return { label: "RISK-ON", detail: "Mr. Market is paying up for growth.", color: "var(--bull)" };
  if (kind === "bear") return { label: "DEFENSIVE", detail: "Mr. Market is punishing weak balance sheets.", color: "var(--bear)" };
  return { label: "INDECISIVE", detail: "Mr. Market is moving sideways and changing his mind.", color: "var(--caution)" };
}
