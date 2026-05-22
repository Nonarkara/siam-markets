/**
 * Mock 3-year monthly NAV history per mutual fund.
 *
 * Deterministic per fund code (seeded PRNG) so the chart is stable across
 * reloads. The series respects each fund's current NAV and 3-year
 * annualized return — historical NAV is reconstructed *backwards* from
 * today using the annualized return + category-typical volatility.
 *
 * Replace with a real /api/fund-history endpoint when SEC data is wired up.
 */

import { MOCK_FUNDS, type MutualFund } from "./mock-funds";

export interface NavPoint {
  time: string;  // YYYY-MM-DD
  nav: number;
}

const MONTHS = 36;

// Category-typical monthly vol (sigma of monthly log returns).
const VOL_BY_CATEGORY: Record<MutualFund["category"], number> = {
  EQUITY:        0.045,
  FIXED_INCOME:  0.012,
  MIXED:         0.028,
  RMF:           0.035,
  SSF:           0.038,
  THAI_ESG:      0.038,
  GLOBAL:        0.040,
};

// Deterministic PRNG (mulberry32) seeded from the fund code.
function makeRng(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller for standard normal samples.
function gaussian(rng: () => number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function isoMonthBack(monthsAgo: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Generate the 36-month NAV history for one fund.
 * The most recent point matches the fund's current NAV; earlier points
 * are walked backwards using the 3y annualized return + monthly vol.
 */
export function generateFundHistory(fund: MutualFund, months: number = MONTHS): NavPoint[] {
  const rng = makeRng(fund.code);
  const muMonthly = Math.log(1 + (fund.return3y ?? 0) / 100) / 12;
  const sigma = VOL_BY_CATEGORY[fund.category] ?? 0.03;

  // Walk backwards from current NAV.
  const points: NavPoint[] = [];
  let nav = fund.nav;
  for (let i = 0; i < months; i++) {
    points.push({ time: isoMonthBack(i), nav });
    const shock = gaussian(rng);
    // Reverse step: divide by (1 + return) for the prior month.
    nav = nav / Math.exp(muMonthly + sigma * shock);
  }
  return points.reverse();
}

/**
 * Convenience lookup — used by detail / comparison views.
 * Cached per process so repeated comparison renders don't re-seed.
 */
const cache = new Map<string, NavPoint[]>();
export function getFundHistory(code: string): NavPoint[] {
  const cached = cache.get(code);
  if (cached) return cached;
  const fund = MOCK_FUNDS.find((f) => f.code === code);
  if (!fund) return [];
  const series = generateFundHistory(fund);
  cache.set(code, series);
  return series;
}

/** Computed summary stats over the history series. */
export interface FundHistoryStats {
  totalReturn: number;   // % over the whole window
  bestMonth: { time: string; pct: number };
  worstMonth: { time: string; pct: number };
  maxDrawdown: number;   // % peak-to-trough
}

export function statsForHistory(history: NavPoint[]): FundHistoryStats {
  if (history.length < 2) {
    return { totalReturn: 0, bestMonth: { time: "", pct: 0 }, worstMonth: { time: "", pct: 0 }, maxDrawdown: 0 };
  }
  const first = history[0].nav;
  const last  = history[history.length - 1].nav;
  const totalReturn = (last / first - 1) * 100;

  let best = { time: history[1].time, pct: 0 };
  let worst = { time: history[1].time, pct: 0 };
  for (let i = 1; i < history.length; i++) {
    const r = (history[i].nav / history[i - 1].nav - 1) * 100;
    if (r > best.pct)  best  = { time: history[i].time, pct: r };
    if (r < worst.pct) worst = { time: history[i].time, pct: r };
  }

  let peak = history[0].nav;
  let maxDD = 0;
  for (const p of history) {
    if (p.nav > peak) peak = p.nav;
    const dd = (peak - p.nav) / peak * 100;
    if (dd > maxDD) maxDD = dd;
  }

  return { totalReturn, bestMonth: best, worstMonth: worst, maxDrawdown: maxDD };
}
