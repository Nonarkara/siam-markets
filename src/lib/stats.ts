/**
 * Financial statistics engine — inspired by quantstats, empyrical, ffn.
 * Pure TypeScript. No external dependencies. Fully testable.
 *
 * Implements: Sharpe, Sortino, Calmar, Max Drawdown, Volatility,
 *             Pearson Correlation, Rolling Correlation, VaR, CVaR.
 */

// ─── Core return calculations ─────────────────────────────────────

export function pctReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// ─── Risk-adjusted metrics ────────────────────────────────────────

/** Annualized Sharpe Ratio (risk-free rate in daily terms) */
export function sharpeRatio(returns: number[], riskFreeAnnual = 0.03): number {
  if (returns.length < 5) return 0;
  const dailyRf = riskFreeAnnual / 252;
  const excess  = returns.map(r => r - dailyRf);
  const s = std(excess);
  if (s === 0) return 0;
  return (mean(excess) / s) * Math.sqrt(252);
}

/** Annualized Sortino Ratio — penalizes only downside volatility */
export function sortinoRatio(returns: number[], riskFreeAnnual = 0.03): number {
  if (returns.length < 5) return 0;
  const dailyRf      = riskFreeAnnual / 252;
  const excess       = returns.map(r => r - dailyRf);
  const downside     = excess.filter(r => r < 0);
  const downsideStd  = downside.length > 0 ? std(downside) : 0;
  if (downsideStd === 0) return mean(excess) > 0 ? 99 : 0;
  return (mean(excess) / downsideStd) * Math.sqrt(252);
}

/** Maximum drawdown from peak */
export function maxDrawdown(prices: number[]): number {
  let peak = prices[0];
  let maxDD = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (p - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD; // negative number, e.g. -0.32
}

/** Calmar Ratio — annualized return / |max drawdown| */
export function calmarRatio(prices: number[]): number {
  if (prices.length < 2) return 0;
  const totalReturn = (prices[prices.length - 1] / prices[0]) - 1;
  const periods     = prices.length / 252;
  const annualReturn = Math.pow(1 + totalReturn, 1 / periods) - 1;
  const dd = Math.abs(maxDrawdown(prices));
  if (dd === 0) return 0;
  return annualReturn / dd;
}

/** Annualized volatility */
export function annualizedVol(returns: number[]): number {
  return std(returns) * Math.sqrt(252);
}

/** Value at Risk — parametric, confidence 95% */
export function var95(returns: number[]): number {
  if (returns.length < 10) return 0;
  const m   = mean(returns);
  const s   = std(returns);
  return m - 1.645 * s; // 95% parametric VaR (negative = loss)
}

/** Conditional VaR (Expected Shortfall) at 95% */
export function cvar95(returns: number[]): number {
  if (returns.length < 10) return 0;
  const sorted  = [...returns].sort((a, b) => a - b);
  const cutoff  = Math.floor(sorted.length * 0.05);
  const tail    = sorted.slice(0, cutoff);
  return tail.length > 0 ? mean(tail) : sorted[0];
}

// ─── Correlation ──────────────────────────────────────────────────

/** Pearson correlation coefficient between two return series */
export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;
  const aN = a.slice(-n);
  const bN = b.slice(-n);
  const mA = mean(aN);
  const mB = mean(bN);
  let num = 0, dA = 0, dB = 0;
  for (let i = 0; i < n; i++) {
    num += (aN[i] - mA) * (bN[i] - mB);
    dA  += (aN[i] - mA) ** 2;
    dB  += (bN[i] - mB) ** 2;
  }
  const denom = Math.sqrt(dA * dB);
  return denom === 0 ? 0 : num / denom;
}

/** Rolling correlation using last `window` observations */
export function rollingCorrelation(a: number[], b: number[], window: number): number[] {
  const n = Math.min(a.length, b.length);
  const result: number[] = [];
  for (let i = window; i <= n; i++) {
    result.push(correlation(a.slice(i - window, i), b.slice(i - window, i)));
  }
  return result;
}

// ─── Yield curve interpretation ───────────────────────────────────

export type YieldCurveSignal = "inverted" | "flat" | "normal" | "steep";

export function yieldCurveSignal(spread: number): YieldCurveSignal {
  if (spread < -0.2) return "inverted";
  if (spread < 0.5)  return "flat";
  if (spread < 1.5)  return "normal";
  return "steep";
}

export interface YieldCurveContext {
  signal: YieldCurveSignal;
  spread: number;
  color: string;
  title: string;
  implication: string;
  recessionProb: string;
}

export function yieldCurveContext(spread: number): YieldCurveContext {
  const signal = yieldCurveSignal(spread);
  const spreadStr = spread >= 0 ? `+${spread.toFixed(2)}%` : `${spread.toFixed(2)}%`;

  switch (signal) {
    case "inverted":
      return {
        signal, spread, color: "var(--bear)",
        title: `Yield Curve INVERTED (${spreadStr})`,
        implication: "10Y yields below 2Y. This has preceded 6 of 7 US recessions since 1976 with ~14-month lead time. Risk-off posture warranted.",
        recessionProb: "High (>70%)",
      };
    case "flat":
      return {
        signal, spread, color: "var(--caution)",
        title: `Yield Curve FLAT (${spreadStr})`,
        implication: "Narrow spread signals slowing growth and tightening credit conditions. Not yet a recession signal, but worth monitoring monthly.",
        recessionProb: "Moderate (30–50%)",
      };
    case "normal":
      return {
        signal, spread, color: "var(--bull)",
        title: `Yield Curve NORMAL (${spreadStr})`,
        implication: "Healthy spread. Economy is in growth mode. Long-term bonds compensate for locking up money longer — the baseline healthy state.",
        recessionProb: "Low (<20%)",
      };
    case "steep":
      return {
        signal, spread, color: "var(--bull)",
        title: `Yield Curve STEEP (${spreadStr})`,
        implication: "Wide spread signals strong growth expectations and often precedes an equity bull run. Cyclical stocks tend to outperform.",
        recessionProb: "Very Low (<10%)",
      };
  }
}

// ─── VIX interpretation ───────────────────────────────────────────

export type VixSignal = "panic" | "elevated" | "calm" | "complacent";

export function vixSignal(vix: number): VixSignal {
  if (vix >= 30) return "panic";
  if (vix >= 20) return "elevated";
  if (vix >= 12) return "calm";
  return "complacent";
}

export function vixContext(vix: number): { label: string; color: string; implication: string } {
  const s = vixSignal(vix);
  switch (s) {
    case "panic":
      return { label: "PANIC", color: "var(--bear)", implication: "Extreme fear. Options are pricing in large moves. Historically a contrarian buy zone — markets often bottom within 20–40 trading days of VIX peaks." };
    case "elevated":
      return { label: "ELEVATED", color: "var(--caution)", implication: "Above-average fear. Market expects volatility. Wait for VIX to start declining before adding positions." };
    case "calm":
      return { label: "CALM", color: "var(--bull)", implication: "Normal volatility. Good environment for trend-following strategies. Options are fairly priced." };
    case "complacent":
      return { label: "COMPLACENT", color: "var(--caution)", implication: "Suspiciously low fear. VIX below 12 historically precedes volatility spikes. This is when markets get blindsided." };
  }
}

// ─── CFNAI interpretation ─────────────────────────────────────────

export function cfnaiContext(cfnai: number): { label: string; color: string; implication: string } {
  if (cfnai >= 0.70) return { label: "ABOVE TREND", color: "var(--bull)", implication: "Strong economic momentum. Above 0.70 has historically marked inflationary pressure — watch for tightening." };
  if (cfnai >= 0)    return { label: "AT TREND", color: "var(--bull)", implication: "Economy growing at potential. Healthy baseline — neither hot nor cold." };
  if (cfnai >= -0.70) return { label: "BELOW TREND", color: "var(--caution)", implication: "Slowing growth. Not yet recessionary, but momentum is fading. Watch next 2 months for confirmation." };
  return { label: "RECESSION SIGNAL", color: "var(--bear)", implication: "Three consecutive readings below -0.70 signal expansion has ended. Historical accuracy: ~85% of recessions." };
}
