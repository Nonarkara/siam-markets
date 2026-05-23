/**
 * Trade insights — the institutional-grade derivations retail investors
 * usually can't see. All pure functions, all driven by OHLCV + tiny
 * per-symbol fundamentals dictionaries. No live data needed.
 *
 * Layered on top of `technical.ts`. Anything that returns a number,
 * a band, or a percentile lives here.
 */

import type { OHLCV } from "./types";
import { ema, sma, rsi, atr } from "./technical";

// ─── Trend strength · ADX ─────────────────────────────────────────

/**
 * Wilder ADX with +DI / −DI. Returns the latest smoothed values.
 *
 * Implementation follows Wilder, *New Concepts in Technical Trading
 * Systems* (1978):
 *   1. Compute TR, +DM, −DM per period
 *   2. Wilder-smooth each (running sum: S = S − S/p + new)
 *   3. +DI = 100 × (smPlus / smTR)  ;  −DI = 100 × (smMinus / smTR)
 *   4. DX = 100 × |+DI − −DI| / (+DI + −DI)   — computed each period
 *   5. ADX = Wilder-smoothed DX (RMA over `period`)
 *
 * Previous implementation returned a single raw DX value — that is
 * not ADX. This version returns the proper smoothed series' latest
 * value, plus the latest +DI / −DI.
 *
 * Needs `period * 2` bars minimum (period for DI smoothing + period
 * for ADX smoothing of DX). Returns zeros if insufficient data.
 */
export function adx(data: OHLCV[], period = 14): { adx: number; plusDI: number; minusDI: number } {
  if (!data || data.length < period * 2) return { adx: 0, plusDI: 0, minusDI: 0 };

  // Step 1 — per-bar TR, +DM, −DM
  const trs:      number[] = [];
  const plusDMs:  number[] = [];
  const minusDMs: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const upMove   = data[i].high - data[i - 1].high;
    const downMove = data[i - 1].low - data[i].low;
    const plusDM   = upMove   > downMove && upMove   > 0 ? upMove   : 0;
    const minusDM  = downMove > upMove   && downMove > 0 ? downMove : 0;
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low  - data[i - 1].close),
    );
    trs.push(tr);
    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }
  if (trs.length < period) return { adx: 0, plusDI: 0, minusDI: 0 };

  // Step 2 — Wilder smoothing of TR / +DM / −DM as time SERIES
  // smTR[i] = sum of first `period` items (i == period-1), then
  // smTR[i] = smTR[i-1] − smTR[i-1]/period + value[i]
  const wilderSeries = (arr: number[], p: number): number[] => {
    if (arr.length < p) return [];
    const out: number[] = new Array(arr.length).fill(0);
    let s = 0;
    for (let i = 0; i < p; i++) s += arr[i];
    out[p - 1] = s;
    for (let i = p; i < arr.length; i++) {
      s = s - s / p + arr[i];
      out[i] = s;
    }
    return out;
  };

  const smTR    = wilderSeries(trs,      period);
  const smPlus  = wilderSeries(plusDMs,  period);
  const smMinus = wilderSeries(minusDMs, period);

  // Step 3-4 — Build DX series. Each DX needs the smoothed values at index i ≥ period-1.
  const dxSeries: number[] = [];
  for (let i = period - 1; i < smTR.length; i++) {
    const tr = smTR[i];
    if (!tr) { dxSeries.push(0); continue; }
    const plusDI  = (smPlus[i]  / tr) * 100;
    const minusDI = (smMinus[i] / tr) * 100;
    const denom = plusDI + minusDI;
    const dx = denom ? (Math.abs(plusDI - minusDI) / denom) * 100 : 0;
    dxSeries.push(dx);
  }

  if (dxSeries.length < period) return { adx: 0, plusDI: 0, minusDI: 0 };

  // Step 5 — Wilder-smooth the DX series → ADX
  // First ADX is simple average of first `period` DX values.
  // After that: ADX[i] = (ADX[i-1] * (period-1) + DX[i]) / period
  let adxVal = dxSeries.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < dxSeries.length; i++) {
    adxVal = (adxVal * (period - 1) + dxSeries[i]) / period;
  }

  // Latest +DI / −DI from the last smoothed bar
  const last = smTR.length - 1;
  const tr  = smTR[last];
  const plusDI  = tr ? (smPlus[last]  / tr) * 100 : 0;
  const minusDI = tr ? (smMinus[last] / tr) * 100 : 0;

  return { adx: adxVal, plusDI, minusDI };
}

// ─── Stochastic oscillator ────────────────────────────────────────

export function stochastic(data: OHLCV[], kPeriod = 14, dPeriod = 3): { k: number; d: number } {
  if (data.length < kPeriod) return { k: 0, d: 0 };
  const ks: number[] = [];
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const hi = Math.max(...slice.map(d => d.high));
    const lo = Math.min(...slice.map(d => d.low));
    const c = data[i].close;
    ks.push(hi === lo ? 50 : ((c - lo) / (hi - lo)) * 100);
  }
  const dArr = sma(ks, dPeriod);
  return { k: ks[ks.length - 1], d: dArr[dArr.length - 1] };
}

// ─── Williams %R ──────────────────────────────────────────────────

export function williamsR(data: OHLCV[], period = 14): number {
  if (data.length < period) return -50;
  const slice = data.slice(-period);
  const hi = Math.max(...slice.map(d => d.high));
  const lo = Math.min(...slice.map(d => d.low));
  const c = data[data.length - 1].close;
  return hi === lo ? -50 : ((hi - c) / (hi - lo)) * -100;
}

// ─── OBV (on-balance volume) ──────────────────────────────────────

export function obv(data: OHLCV[]): { last: number; trend: "rising" | "falling" | "flat"; pctChange: number } {
  if (data.length < 2) return { last: 0, trend: "flat", pctChange: 0 };
  const arr: number[] = [0];
  for (let i = 1; i < data.length; i++) {
    const prev = arr[i - 1];
    if (data[i].close > data[i - 1].close) arr.push(prev + data[i].volume);
    else if (data[i].close < data[i - 1].close) arr.push(prev - data[i].volume);
    else arr.push(prev);
  }
  const last = arr[arr.length - 1];
  const lookback = Math.min(20, arr.length - 1);
  const start = arr[arr.length - 1 - lookback] || 1;
  const pctChange = ((last - start) / Math.abs(start || 1)) * 100;
  let trend: "rising" | "falling" | "flat" = "flat";
  if (pctChange > 2) trend = "rising";
  else if (pctChange < -2) trend = "falling";
  return { last, trend, pctChange };
}

// ─── Pivot points (classic) ───────────────────────────────────────

export function pivotPoints(data: OHLCV[]): {
  p: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number;
} {
  const d = data[data.length - 1];
  const p = (d.high + d.low + d.close) / 3;
  const r1 = 2 * p - d.low;
  const s1 = 2 * p - d.high;
  const r2 = p + (d.high - d.low);
  const s2 = p - (d.high - d.low);
  const r3 = d.high + 2 * (p - d.low);
  const s3 = d.low - 2 * (d.high - p);
  return { p, r1, r2, r3, s1, s2, s3 };
}

// ─── 52-week range + percentile ───────────────────────────────────

export function rangePercentile(data: OHLCV[]): {
  high52: number; low52: number; current: number; percentile: number;
  distFromHigh: number; distFromLow: number;
} {
  const slice = data.slice(-252); // ~1y of trading days; falls back to all if shorter
  const high52 = Math.max(...slice.map(d => d.high));
  const low52 = Math.min(...slice.map(d => d.low));
  const current = data[data.length - 1].close;
  const range = high52 - low52;
  const percentile = range === 0 ? 50 : ((current - low52) / range) * 100;
  return {
    high52, low52, current, percentile,
    distFromHigh: ((current - high52) / high52) * 100,
    distFromLow:  ((current - low52)  / low52)  * 100,
  };
}

// ─── Volume profile (price-by-volume) ─────────────────────────────

/** Bucket trading days into N price bins, sum volume per bin.
    Returns the bin array + Point of Control (price with most volume),
    Value Area High/Low containing 70% of volume. */
export function volumeProfile(data: OHLCV[], bins = 12): {
  bins: { priceLow: number; priceHigh: number; volume: number }[];
  poc: number;
  vah: number;
  val: number;
} {
  const lo = Math.min(...data.map(d => d.low));
  const hi = Math.max(...data.map(d => d.high));
  const step = (hi - lo) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    priceLow: lo + i * step,
    priceHigh: lo + (i + 1) * step,
    volume: 0,
  }));
  for (const d of data) {
    const mid = (d.high + d.low) / 2;
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((mid - lo) / step)));
    buckets[idx].volume += d.volume;
  }
  // POC
  const pocBin = buckets.reduce((max, b) => (b.volume > max.volume ? b : max), buckets[0]);
  const poc = (pocBin.priceLow + pocBin.priceHigh) / 2;
  // Value area: expand from POC until 70% of volume captured
  const total = buckets.reduce((s, b) => s + b.volume, 0);
  const target = total * 0.7;
  let lower = buckets.indexOf(pocBin);
  let upper = lower;
  let captured = pocBin.volume;
  while (captured < target && (lower > 0 || upper < bins - 1)) {
    const nextLower = lower > 0 ? buckets[lower - 1].volume : -1;
    const nextUpper = upper < bins - 1 ? buckets[upper + 1].volume : -1;
    if (nextUpper >= nextLower) { upper += 1; captured += nextUpper; }
    else                        { lower -= 1; captured += nextLower; }
  }
  return { bins: buckets, poc, vah: buckets[upper].priceHigh, val: buckets[lower].priceLow };
}

// ─── Recent returns distribution ──────────────────────────────────

export function recentReturns(data: OHLCV[]): {
  d1: number; d5: number; d20: number; d60: number; ytd: number;
  bestDay: number; worstDay: number;
  upDays: number; downDays: number; lookback: number;
} {
  const c = data.map(d => d.close);
  const last = c[c.length - 1];
  const get = (back: number) => {
    if (c.length <= back) return 0;
    return ((last / c[c.length - 1 - back]) - 1) * 100;
  };
  // returns array over the last 60 days
  const lookback = Math.min(60, c.length - 1);
  const daily: number[] = [];
  for (let i = c.length - lookback; i < c.length; i++) {
    daily.push(((c[i] / c[i - 1]) - 1) * 100);
  }
  return {
    d1: get(1),
    d5: get(5),
    d20: get(20),
    d60: get(60),
    ytd: get(Math.min(c.length - 1, 250)),
    bestDay: Math.max(...daily),
    worstDay: Math.min(...daily),
    upDays: daily.filter(x => x > 0).length,
    downDays: daily.filter(x => x < 0).length,
    lookback,
  };
}

// ─── Realized volatility (annualised) ─────────────────────────────

export function realizedVol(data: OHLCV[], lookback = 20): number {
  const c = data.map(d => d.close);
  if (c.length < lookback + 1) return 0;
  const slice = c.slice(-lookback - 1);
  const rets: number[] = [];
  for (let i = 1; i < slice.length; i++) rets.push(Math.log(slice[i] / slice[i - 1]));
  const mean = rets.reduce((s, v) => s + v, 0) / rets.length;
  const variance = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

// ─── Sharpe-lite (recent return / realised vol) ───────────────────

export function sharpeLite(data: OHLCV[]): number {
  const r = recentReturns(data);
  const vol = realizedVol(data, 60);
  if (!vol) return 0;
  // Annualise the 60d return; then divide
  const annRet = r.d60 * (252 / 60);
  return annRet / vol;
}

// ─── Gap analysis (overnight vs intraday) ─────────────────────────

export function gapStats(data: OHLCV[]): {
  avgGapPct: number; avgIntradayPct: number; upGaps: number; downGaps: number;
} {
  const lookback = Math.min(60, data.length - 1);
  let gapSum = 0, intraSum = 0, upGaps = 0, downGaps = 0;
  for (let i = data.length - lookback; i < data.length; i++) {
    const gap = ((data[i].open - data[i - 1].close) / data[i - 1].close) * 100;
    const intra = ((data[i].close - data[i].open) / data[i].open) * 100;
    gapSum += Math.abs(gap);
    intraSum += Math.abs(intra);
    if (gap > 0.1) upGaps += 1;
    else if (gap < -0.1) downGaps += 1;
  }
  return {
    avgGapPct: gapSum / lookback,
    avgIntradayPct: intraSum / lookback,
    upGaps,
    downGaps,
  };
}

// ─── Day-of-week heatmap (avg %) ──────────────────────────────────

export function dayOfWeekStats(data: OHLCV[]): { day: string; avg: number; count: number }[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const buckets: number[][] = [[], [], [], [], []];
  for (let i = 1; i < data.length; i++) {
    const ret = ((data[i].close / data[i - 1].close) - 1) * 100;
    const dow = new Date(data[i].date).getDay(); // 0=Sun, 1=Mon, ... 5=Fri
    if (dow >= 1 && dow <= 5) buckets[dow - 1].push(ret);
  }
  return days.map((day, i) => ({
    day,
    avg: buckets[i].length ? buckets[i].reduce((s, v) => s + v, 0) / buckets[i].length : 0,
    count: buckets[i].length,
  }));
}

// ─── Distance from key moving averages ────────────────────────────

export function maDistances(data: OHLCV[]): {
  ma20: { value: number; pct: number };
  ma50: { value: number; pct: number };
  ma200: { value: number; pct: number };
} {
  const c = data.map(d => d.close);
  const last = c[c.length - 1];
  const e20  = ema(c, 20)[c.length - 1] ?? last;
  const e50  = ema(c, 50)[c.length - 1] ?? last;
  const e200 = ema(c, 200)[c.length - 1] ?? last;
  const pct = (v: number) => ((last / v) - 1) * 100;
  return {
    ma20:  { value: e20,  pct: pct(e20) },
    ma50:  { value: e50,  pct: pct(e50) },
    ma200: { value: e200, pct: pct(e200) },
  };
}

// ─── Streaks ──────────────────────────────────────────────────────

export function streak(data: OHLCV[]): { direction: "up" | "down" | "flat"; length: number } {
  const c = data.map(d => d.close);
  if (c.length < 2) return { direction: "flat", length: 0 };
  const up = c[c.length - 1] > c[c.length - 2];
  const down = c[c.length - 1] < c[c.length - 2];
  if (!up && !down) return { direction: "flat", length: 1 };
  let len = 1;
  for (let i = c.length - 2; i > 0; i--) {
    if (up && c[i] > c[i - 1]) len += 1;
    else if (down && c[i] < c[i - 1]) len += 1;
    else break;
  }
  return { direction: up ? "up" : "down", length: len };
}

// ─── Unusual volume ───────────────────────────────────────────────

export function unusualVolume(data: OHLCV[]): { ratio: number; label: string; color: string } {
  const lookback = Math.min(20, data.length - 1);
  const slice = data.slice(-lookback - 1, -1);
  const avg = slice.reduce((s, v) => s + v.volume, 0) / slice.length;
  const ratio = avg ? data[data.length - 1].volume / avg : 1;
  let label = "Normal";
  let color = "var(--muted)";
  if (ratio > 3)      { label = "Extreme"; color = "var(--bear)"; }
  else if (ratio > 2) { label = "High";    color = "var(--caution)"; }
  else if (ratio > 1.5) { label = "Elevated"; color = "var(--caution)"; }
  else if (ratio < 0.5) { label = "Dry";     color = "var(--dim)"; }
  return { ratio, label, color };
}

// ─── ATR-based projected intraday range ───────────────────────────

export function projectedRange(data: OHLCV[]): { low: number; high: number; atr: number } {
  const a = atr(data, 14);
  const last = a[a.length - 1] ?? 0;
  const close = data[data.length - 1].close;
  return { low: close - last, high: close + last, atr: last };
}

// ─── RSI snapshot ─────────────────────────────────────────────────

export function rsiSnapshot(data: OHLCV[]): number {
  const r = rsi(data.map(d => d.close), 14);
  return r[r.length - 1] ?? 50;
}

// ─── Indicator summary (bullish/bearish count) ────────────────────

export function indicatorSummary(data: OHLCV[]): {
  bullish: number; bearish: number; neutral: number; total: number; bias: "bullish" | "bearish" | "neutral";
} {
  const closes = data.map(d => d.close);
  const last = closes[closes.length - 1];
  const e9  = ema(closes, 9);
  const e21 = ema(closes, 21);
  const e50 = ema(closes, 50);
  const e200 = ema(closes, 200);
  const rsiV = rsi(closes, 14);
  const sto = stochastic(data, 14, 3);
  const a = adx(data, 14);

  const signals: ("bull" | "bear" | "neutral")[] = [
    e9[e9.length - 1] > e21[e21.length - 1] ? "bull" : "bear",
    last > e21[e21.length - 1] ? "bull" : "bear",
    last > e50[e50.length - 1] ? "bull" : "bear",
    last > e200[e200.length - 1] ? "bull" : "bear",
    rsiV[rsiV.length - 1] > 50 ? "bull" : rsiV[rsiV.length - 1] < 50 ? "bear" : "neutral",
    sto.k > sto.d ? "bull" : "bear",
    a.plusDI > a.minusDI ? "bull" : "bear",
  ];

  const bullish = signals.filter(s => s === "bull").length;
  const bearish = signals.filter(s => s === "bear").length;
  const neutral = signals.filter(s => s === "neutral").length;
  const bias = bullish > bearish + 1 ? "bullish" : bearish > bullish + 1 ? "bearish" : "neutral";

  return { bullish, bearish, neutral, total: signals.length, bias };
}
