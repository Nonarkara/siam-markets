/**
 * Unit tests for src/lib/graham.ts — the value math that the Scanner
 * and Trade Desk both depend on for buy-zone classification.
 */

import { describe, it, expect } from "vitest";
import {
  grahamNumber, marginOfSafety, safetyZone, defensiveScore, defensiveRating,
} from "../graham";

describe("grahamNumber", () => {
  it("returns sqrt(22.5 * EPS * BVPS) for valid inputs", () => {
    // EPS=2, BVPS=10 → sqrt(22.5*2*10) = sqrt(450) ≈ 21.2132
    expect(grahamNumber(2, 10)).toBeCloseTo(Math.sqrt(450), 5);
  });

  it("returns 0 when EPS ≤ 0 (loss-making company)", () => {
    expect(grahamNumber(0,   10)).toBe(0);
    expect(grahamNumber(-2,  10)).toBe(0);
  });

  it("returns 0 when BVPS ≤ 0 (negative book value)", () => {
    expect(grahamNumber(2, 0)).toBe(0);
    expect(grahamNumber(2, -5)).toBe(0);
  });

  it("scales with sqrt of inputs", () => {
    const a = grahamNumber(4, 16);   // sqrt(22.5*64) = sqrt(1440)
    const b = grahamNumber(1, 4);    // sqrt(22.5*4)  = sqrt(90)
    // a should be 4x b (since 4*16 = 16 * (1*4))
    expect(a / b).toBeCloseTo(4, 5);
  });
});

describe("marginOfSafety", () => {
  it("computes positive MOS when price below Graham number", () => {
    // Graham = 100, price = 70 → MOS = 30%
    expect(marginOfSafety(70, 100)).toBeCloseTo(30, 5);
  });

  it("computes negative MOS when price above Graham number", () => {
    // Graham = 100, price = 120 → MOS = -20%
    expect(marginOfSafety(120, 100)).toBeCloseTo(-20, 5);
  });

  it("returns -100 when Graham number is 0 (no fair value computable)", () => {
    expect(marginOfSafety(50, 0)).toBe(-100);
  });
});

describe("safetyZone", () => {
  it("classifies into Graham's bands", () => {
    expect(safetyZone(40)).toBe("strong");
    expect(safetyZone(30)).toBe("strong");
    expect(safetyZone(20)).toBe("moderate");
    expect(safetyZone(5)).toBe("thin");
    expect(safetyZone(-10)).toBe("overvalued");
  });
});

describe("defensiveScore + rating", () => {
  it("scores 0 when no criteria met", () => {
    const s = defensiveScore({
      adequateSize: false, financialStrength: false, earningsStability: false,
      dividendRecord: false, earningsGrowth: false, lowPe: false, lowPb: false,
    });
    expect(s).toBe(0);
    expect(defensiveRating(s)).toBe("speculative");
  });

  it("scores 7 when all criteria met → defensive", () => {
    const s = defensiveScore({
      adequateSize: true, financialStrength: true, earningsStability: true,
      dividendRecord: true, earningsGrowth: true, lowPe: true, lowPb: true,
    });
    expect(s).toBe(7);
    expect(defensiveRating(s)).toBe("defensive");
  });

  it("rates 5/7 as semi-defensive (between thresholds)", () => {
    expect(defensiveRating(5)).toBe("semi-defensive");
    expect(defensiveRating(4)).toBe("semi-defensive");
    expect(defensiveRating(3)).toBe("speculative");
    expect(defensiveRating(6)).toBe("defensive");
  });
});
