/**
 * Unit tests for src/lib/trading.ts — position sizing, R:R, Kelly.
 * The math here is what stands between a user and the wrong size.
 */

import { describe, it, expect } from "vitest";
import { calculatePositionSize, kellyCriterion, quarterKelly } from "../trading";

describe("calculatePositionSize", () => {
  it("classic 1% rule: 100k account, 1% risk, 2pt stop → 500 shares", () => {
    const r = calculatePositionSize({
      accountSize: 100_000,
      riskPct:     1,
      entryPrice:  50,
      stopLoss:    48,
    });
    expect(r.shares).toBe(500);
    expect(r.riskAmount).toBe(1_000);
    expect(r.riskPerShare).toBe(2);
    expect(r.notional).toBe(25_000);
  });

  it("returns 0 shares when entry equals stop (divide-by-zero guard)", () => {
    const r = calculatePositionSize({
      accountSize: 100_000,
      riskPct:     1,
      entryPrice:  50,
      stopLoss:    50,
    });
    expect(r.shares).toBe(0);
    expect(r.riskPerShare).toBe(0);
  });

  it("R:R ratio = |target − entry| / |entry − stop|", () => {
    const r = calculatePositionSize({
      accountSize: 100_000,
      riskPct:     1,
      entryPrice:  50,
      stopLoss:    48,
    }, 56);
    // Reward = 6, Risk = 2 → R:R = 3
    expect(r.riskReward).toBeCloseTo(3, 5);
  });

  it("rounds shares down (never long more risk than budget)", () => {
    // riskAmount = 1000, riskPerShare = 3 → 333.33 → must round to 333
    const r = calculatePositionSize({
      accountSize: 100_000,
      riskPct:     1,
      entryPrice:  50,
      stopLoss:    47,
    });
    expect(r.shares).toBe(333);
  });

  it("zero account → zero shares (no NaN)", () => {
    const r = calculatePositionSize({
      accountSize: 0,
      riskPct:     1,
      entryPrice:  50,
      stopLoss:    48,
    });
    expect(r.shares).toBe(0);
    expect(r.riskAmount).toBe(0);
  });
});

describe("kellyCriterion", () => {
  // Note: winRate is expressed as a percentage (60 = 60%), not fraction.
  // The function also clamps the result to [0, 1].

  it("returns 0 when avgLoss is 0 (divide-by-zero guard)", () => {
    expect(kellyCriterion(60, 100, 0)).toBe(0);
  });

  it("returns the textbook K = (b·p − q)/b for a profitable edge", () => {
    // 60% win rate, avg win 2× avg loss
    // b = 2, p = 0.6, q = 0.4 → K = (2·0.6 − 0.4)/2 = 0.4
    const k = kellyCriterion(60, 200, 100);
    expect(k).toBeCloseTo(0.4, 5);
  });

  it("clamps to 0 for a losing edge (never bet negative)", () => {
    // 30% wins, avg win = avg loss → expectancy negative, K < 0 → clamped to 0
    expect(kellyCriterion(30, 100, 100)).toBe(0);
  });

  it("clamps to 1 even when textbook K would exceed 1 (no leverage)", () => {
    // 95% win rate with 10× win/loss → very high K, should clamp at 1
    expect(kellyCriterion(95, 1000, 100)).toBeLessThanOrEqual(1);
  });
});

describe("quarterKelly", () => {
  it("is exactly one-quarter of full Kelly", () => {
    const k = kellyCriterion(60, 200, 100);
    expect(quarterKelly(60, 200, 100)).toBeCloseTo(k / 4, 5);
  });
});
