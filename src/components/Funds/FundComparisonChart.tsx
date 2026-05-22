"use client";

import { useMemo } from "react";
import { NavLineChart, type NavLine } from "@/components/Charts/NavLineChart";
import { getFundHistory } from "@/lib/api/mock-fund-history";
import type { MutualFund } from "@/lib/api/mock-funds";

// Six-color palette for overlays. One amber max (workspace §14) — the rest
// are the project palette colors. Cycles if more than 6 funds.
const PALETTE = [
  "var(--tech)",
  "var(--bull)",
  "var(--bear)",
  "var(--braun-yellow)",
  "var(--caution)",
  "var(--muted)",
];

interface Props {
  funds: MutualFund[];
  height?: number;
}

/**
 * Overlay chart that normalizes every selected fund's NAV to 100 at the
 * earliest common timestamp. Apples-to-apples — answers "if I had put
 * ฿100 in each three years ago, how would they compare today?"
 *
 * Single fund → solo line (still useful as a portfolio "your one fund" view).
 * Zero funds → renders nothing (caller handles the empty state).
 */
export function FundComparisonChart({ funds, height = 280 }: Props) {
  const series = useMemo<NavLine[]>(() => {
    return funds.map((fund, i) => {
      const hist = getFundHistory(fund.code);
      const base = hist[0]?.nav ?? 1;
      return {
        label: fund.code,
        color: PALETTE[i % PALETTE.length],
        data: hist.map(p => ({ time: p.time, value: (p.nav / base) * 100 })),
      };
    });
  }, [funds]);

  if (series.length === 0 || series.every(s => s.data.length === 0)) return null;

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em" }}>
          {series.length === 1 ? "NAV HISTORY" : `${series.length}-FUND COMPARISON · INDEXED TO 100`}
        </div>
        <div className="t-micro" style={{ color: "var(--dim)" }}>
          Last 36 months
        </div>
      </div>

      <NavLineChart series={series} height={height} showLegend yLabel={series.length === 1 ? "nav" : "indexed"} />

      {series.length > 1 && (
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 6, lineHeight: 1.5 }}>
          Each line starts at 100. A line at 130 means a ฿100 investment is now worth ฿130.
          Steeper climbs mean higher returns. Bigger dips mean larger losses along the way.
        </div>
      )}
    </div>
  );
}
