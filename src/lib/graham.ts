/**
 * Graham/Buffett/Munger calculation engine.
 * Pure functions — no side effects, no API calls, fully testable.
 */

import type { StockFundamentals, TaxCalcInput, TaxCalcResult, MoatType } from "./types";

// ─── SET Market Constants (from research, 2026) ───────────────────

export const SET_CONSTANTS = {
  historicalPeAvg: 17.89,
  grahamFairPe: 15,
  grahamCheapPe: 12,
  shillerCapeWarning: 30,
  shillerCapeExtreme: 35,
  // Benchmark ROE (Buffett standard)
  roeTarget: 15,
  roeExcellent: 20,
} as const;

// ─── Graham Number ────────────────────────────────────────────────
// √(22.5 × EPS × BVPS)
// Only meaningful when P/E < 15 AND P/B < 1.5
export function grahamNumber(eps: number, bvps: number): number {
  if (eps <= 0 || bvps <= 0) return 0;
  return Math.sqrt(22.5 * eps * bvps);
}

// ─── Margin of Safety ─────────────────────────────────────────────
// (Graham Number − Price) / Graham Number × 100
// Positive = stock is below Graham fair value (safety margin)
export function marginOfSafety(price: number, grahamNum: number): number {
  if (grahamNum <= 0) return -100;
  return ((grahamNum - price) / grahamNum) * 100;
}

export type SafetyZone = "strong" | "moderate" | "thin" | "overvalued";

export function safetyZone(mos: number): SafetyZone {
  if (mos >= 30) return "strong";
  if (mos >= 15) return "moderate";
  if (mos >= 0)  return "thin";
  return "overvalued";
}

export function safetyLabel(zone: SafetyZone): string {
  switch (zone) {
    case "strong":     return "Strong Safety Margin";
    case "moderate":   return "Moderate Safety";
    case "thin":       return "Thin Margin";
    case "overvalued": return "No Safety — Overvalued";
  }
}

// ─── Graham Defensive Investor Score (0–7) ───────────────────────
// One point per criterion met
export interface DefensiveCriteria {
  adequateSize: boolean;      // market cap > 5B THB (~$140M)
  financialStrength: boolean; // current ratio > 2, D/E < 1
  earningsStability: boolean; // positive EPS for 10 consecutive years
  dividendRecord: boolean;    // dividends paid for ≥ 10 years (relaxed from 20 for Thai mkt)
  earningsGrowth: boolean;    // 3yr avg EPS > base EPS from 5yr ago
  lowPe: boolean;             // P/E ≤ 15
  lowPb: boolean;             // P/B ≤ 1.5
}

export function defensiveScore(criteria: DefensiveCriteria): number {
  return Object.values(criteria).filter(Boolean).length;
}

export type DefensiveRating = "defensive" | "semi-defensive" | "speculative";

export function defensiveRating(score: number): DefensiveRating {
  if (score >= 6) return "defensive";
  if (score >= 4) return "semi-defensive";
  return "speculative";
}

// ─── Buffett Quality Score (0–10) ────────────────────────────────
export interface BuffettCriteria {
  roe10Avg20plus: boolean;    // 10yr avg ROE ≥ 20%   (+2)
  roeNeverBelow15: boolean;   // ROE never dipped <15% (+2)
  lowDebt: boolean;           // D/E < 1.0            (+2)
  fcfExceedsIncome: boolean;  // FCF > Net Income     (+2)
  highGrossMargin: boolean;   // Gross margin > industry avg (+2)
}

export function buffettScore(criteria: BuffettCriteria): number {
  return Object.values(criteria).filter(Boolean).length * 2;
}

export type BuffettGrade = "A" | "B" | "C" | "D";

export function buffettGrade(score: number): BuffettGrade {
  if (score >= 8) return "A";
  if (score >= 6) return "B";
  if (score >= 4) return "C";
  return "D";
}

export function buffettGradeLabel(grade: BuffettGrade): string {
  switch (grade) {
    case "A": return "Buffett-Grade Quality";
    case "B": return "Good Quality";
    case "C": return "Fair Quality";
    case "D": return "Low Quality — needs deep discount";
  }
}

// ─── Fear & Greed Interpretation ─────────────────────────────────

export type FearGreedZone =
  | "extreme_fear"
  | "fear"
  | "neutral"
  | "greed"
  | "extreme_greed";

export function fgZone(score: number): FearGreedZone {
  if (score <= 20) return "extreme_fear";
  if (score <= 40) return "fear";
  if (score <= 60) return "neutral";
  if (score <= 80) return "greed";
  return "extreme_greed";
}

export function fgLabel(zone: FearGreedZone): string {
  switch (zone) {
    case "extreme_fear":  return "Extreme Fear";
    case "fear":          return "Fear";
    case "neutral":       return "Neutral";
    case "greed":         return "Greed";
    case "extreme_greed": return "Extreme Greed";
  }
}

export function fgBuffettAdvice(zone: FearGreedZone): string {
  switch (zone) {
    case "extreme_fear":
      return "\"Be greedy when others are fearful.\" This is Buffett's buying zone.";
    case "fear":
      return "Market is nervous. Quality stocks may be available at a discount.";
    case "neutral":
      return "Neither cheap nor expensive. Wait for a clear signal before adding positions.";
    case "greed":
      return "Market is optimistic. Be selective. Don't pay too much.";
    case "extreme_greed":
      return "\"Be fearful when others are greedy.\" This is Buffett's caution zone — lock in gains.";
  }
}

// ─── SET P/E Valuation Context ────────────────────────────────────

export type SetValuation = "cheap" | "fair" | "moderate" | "expensive" | "bubble";

export function setValuation(pe: number): SetValuation {
  if (pe < 12)   return "cheap";
  if (pe < 15)   return "fair";
  if (pe < 18)   return "moderate";
  if (pe < 22)   return "expensive";
  return "bubble";
}

export function setValuationLabel(v: SetValuation): string {
  switch (v) {
    case "cheap":     return "Cheap vs history";
    case "fair":      return "Graham fair value";
    case "moderate":  return "Moderately valued";
    case "expensive": return "Expensive";
    case "bubble":    return "Bubble territory";
  }
}

export function setValuationContext(pe: number): string {
  const v = setValuation(pe);
  const hist = SET_CONSTANTS.historicalPeAvg;
  const diff = ((pe - hist) / hist * 100).toFixed(1);
  const direction = pe > hist ? `${diff}% above` : `${Math.abs(Number(diff))}% below`;
  return `SET trading at P/E ${pe.toFixed(1)} — ${direction} the historical average of ${hist}. ${setValuationLabel(v)}.`;
}

// ─── Thai Tax Calculator ──────────────────────────────────────────

// 2025 Thai personal income tax rates
const TAX_BRACKETS = [
  { min: 0,         max: 150_000,   rate: 0 },
  { min: 150_001,   max: 300_000,   rate: 0.05 },
  { min: 300_001,   max: 500_000,   rate: 0.10 },
  { min: 500_001,   max: 750_000,   rate: 0.15 },
  { min: 750_001,   max: 1_000_000, rate: 0.20 },
  { min: 1_000_001, max: 2_000_000, rate: 0.25 },
  { min: 2_000_001, max: 5_000_000, rate: 0.30 },
  { min: 5_000_001, max: Infinity,  rate: 0.35 },
];

// Fund deduction limits (2025)
const FUND_LIMITS = {
  RMF:     { pctOfIncome: 0.30, maxBaht: 500_000 },
  ThaiESG: { pctOfIncome: 0.30, maxBaht: 300_000 },
  SSF:     { pctOfIncome: 0.30, maxBaht: 200_000 },
} as const;

function marginalRate(taxableIncome: number): number {
  for (let i = TAX_BRACKETS.length - 1; i >= 0; i--) {
    if (taxableIncome > TAX_BRACKETS[i].min) return TAX_BRACKETS[i].rate;
  }
  return 0;
}

function allowedDeduction(
  income: number,
  amount: number,
  pctLimit: number,
  maxBaht: number,
): number {
  return Math.min(amount, income * pctLimit, maxBaht);
}

export function calcThaiTax(input: TaxCalcInput): TaxCalcResult {
  const { annualIncome, rmfAmount, thaiEsgAmount, ssfAmount } = input;

  const rmfDeduction    = allowedDeduction(annualIncome, rmfAmount,    FUND_LIMITS.RMF.pctOfIncome,     FUND_LIMITS.RMF.maxBaht);
  const thaiEsgDeduction = allowedDeduction(annualIncome, thaiEsgAmount, FUND_LIMITS.ThaiESG.pctOfIncome, FUND_LIMITS.ThaiESG.maxBaht);
  const ssfDeduction    = allowedDeduction(annualIncome, ssfAmount,    FUND_LIMITS.SSF.pctOfIncome,     FUND_LIMITS.SSF.maxBaht);

  // Combined cap: 800,000 THB across all retirement/fund vehicles
  const rawTotal = rmfDeduction + thaiEsgDeduction + ssfDeduction;
  const totalDeduction = Math.min(rawTotal, 800_000);

  const rate = marginalRate(annualIncome);
  const estimatedTaxSaved = totalDeduction * rate;

  return {
    rmfDeduction,
    thaiEsgDeduction,
    ssfDeduction,
    totalDeduction,
    estimatedTaxSaved,
    marginalRate: rate * 100,
  };
}

// ─── 10-Year Compound Projection ─────────────────────────────────

export interface ProjectionPoint {
  year: number;
  conservative: number;  // 6% p.a.
  moderate: number;      // 8% p.a.
  optimistic: number;    // 10% p.a.
}

export function tenYearProjection(
  initialAmount: number,
  monthlyContribution: number,
): ProjectionPoint[] {
  const rates = { conservative: 0.06, moderate: 0.08, optimistic: 0.10 };
  const points: ProjectionPoint[] = [];

  for (let year = 0; year <= 10; year++) {
    const calc = (rate: number) => {
      // Future value of initial lump sum
      const lumpSum = initialAmount * Math.pow(1 + rate, year);
      // Future value of monthly contributions (annuity)
      const monthlyRate = rate / 12;
      const months = year * 12;
      const annuity = months === 0
        ? 0
        : monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      return lumpSum + annuity;
    };

    points.push({
      year,
      conservative: calc(rates.conservative),
      moderate:     calc(rates.moderate),
      optimistic:   calc(rates.optimistic),
    });
  }

  return points;
}

// ─── Moat classification helper ──────────────────────────────────

export function moatLabel(moat: MoatType): string {
  switch (moat) {
    case "wide":    return "Wide Moat";
    case "narrow":  return "Narrow Moat";
    case "none":    return "No Moat";
    case "unknown": return "Moat Unknown";
  }
}

export function moatColor(moat: MoatType): string {
  switch (moat) {
    case "wide":    return "var(--bull)";
    case "narrow":  return "var(--caution)";
    case "none":    return "var(--bear)";
    case "unknown": return "var(--muted)";
  }
}
