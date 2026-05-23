/**
 * Unit tests for src/lib/technical.ts — the indicators that drive
 * Trade Desk signals. These lock in correctness; a regression here
 * would silently corrupt every buy/sell recommendation.
 */

import { describe, it, expect } from "vitest";
import { ema, sma, rsi, macd } from "../technical";
import { adx } from "../trade-insights";
import type { OHLCV } from "../types";

/** Build a synthetic OHLCV series with the given closes (open=close=hi=lo for simplicity). */
function ohlcv(closes: number[]): OHLCV[] {
  return closes.map((c, i) => ({
    date:   `2026-01-${String(i + 1).padStart(2, "0")}`,
    open:   c, high: c + 0.5, low: c - 0.5, close: c, volume: 1_000_000,
  }));
}

describe("sma", () => {
  it("returns length = N - period + 1 (no left-pad)", () => {
    const out = sma([1, 2, 3, 4, 5], 3);
    expect(out).toHaveLength(3);  // 5 - 3 + 1
  });

  it("returns rolling 3-period mean in order", () => {
    const out = sma([10, 20, 30, 40, 50], 3);
    expect(out[0]).toBe(20);  // (10+20+30)/3
    expect(out[1]).toBe(30);  // (20+30+40)/3
    expect(out[2]).toBe(40);  // (30+40+50)/3
  });

  it("returns empty array when input too short", () => {
    expect(sma([1, 2], 3)).toEqual([]);
  });
});

describe("ema", () => {
  it("returns a value for every input element", () => {
    const out = ema([1, 2, 3, 4, 5], 3);
    expect(out).toHaveLength(5);
  });

  it("seeds with the first value (zero lag at index 0)", () => {
    const out = ema([10, 20, 30], 3);
    expect(out[0]).toBe(10);
  });

  it("trends toward the input when input is constant", () => {
    const out = ema([5, 5, 5, 5, 5, 5, 5, 5, 5, 5], 3);
    expect(out[out.length - 1]).toBeCloseTo(5, 5);
  });
});

describe("rsi", () => {
  it("returns 100 when every change is a gain", () => {
    // 20 monotonically increasing values — pure-gain series
    const monotonic = Array.from({ length: 20 }, (_, i) => 10 + i);
    const out = rsi(monotonic, 14);
    expect(out[out.length - 1]).toBe(100);
  });

  it("returns 0 when every change is a loss", () => {
    const monotonic = Array.from({ length: 20 }, (_, i) => 100 - i);
    const out = rsi(monotonic, 14);
    expect(out[out.length - 1]).toBe(0);
  });

  it("returns ~50 on a noisy flat series", () => {
    // alternating ±1 around 100 — should converge near 50
    const noisy = Array.from({ length: 30 }, (_, i) => 100 + (i % 2 === 0 ? 1 : -1));
    const out = rsi(noisy, 14);
    expect(out[out.length - 1]).toBeGreaterThan(30);
    expect(out[out.length - 1]).toBeLessThan(70);
  });
});

describe("macd", () => {
  it("returns empty arrays when input is too short (length guard)", () => {
    const out = macd([1, 2, 3, 4, 5]);
    expect(out.macd).toEqual([]);
    expect(out.signal).toEqual([]);
    expect(out.histogram).toEqual([]);
  });

  it("returns empty arrays for empty input", () => {
    const out = macd([]);
    expect(out.macd).toEqual([]);
    expect(out.signal).toEqual([]);
    expect(out.histogram).toEqual([]);
  });

  it("filters NaN/Infinity inputs without throwing", () => {
    const data = Array.from({ length: 40 }, (_, i) => i % 5 === 0 ? NaN : 100 + i);
    const out = macd(data);
    // Should not throw, and produce arrays of valid numbers
    out.macd.forEach(v => expect(Number.isFinite(v)).toBe(true));
    out.signal.forEach(v => expect(Number.isFinite(v)).toBe(true));
  });

  it("histogram length matches signal line length", () => {
    const data = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 5) * 5);
    const out = macd(data);
    expect(out.histogram.length).toBe(out.signal.length);
  });
});

describe("adx (post-Wilder-smoothing fix)", () => {
  it("returns 0 ADX on insufficient data without throwing", () => {
    const out = adx(ohlcv([10, 11, 12]), 14);
    expect(out.adx).toBe(0);
    expect(out.plusDI).toBe(0);
    expect(out.minusDI).toBe(0);
  });

  it("produces a finite ADX in [0, 100] on a strong trend", () => {
    // 40 bars of pure uptrend → ADX should be high but bounded
    const data = ohlcv(Array.from({ length: 40 }, (_, i) => 50 + i));
    const out = adx(data, 14);
    expect(Number.isFinite(out.adx)).toBe(true);
    expect(out.adx).toBeGreaterThanOrEqual(0);
    expect(out.adx).toBeLessThanOrEqual(100);
    // In a clean uptrend +DI should dominate -DI
    expect(out.plusDI).toBeGreaterThan(out.minusDI);
  });

  it("+DI < -DI in a clean downtrend", () => {
    const data = ohlcv(Array.from({ length: 40 }, (_, i) => 100 - i));
    const out = adx(data, 14);
    expect(out.minusDI).toBeGreaterThan(out.plusDI);
  });
});
