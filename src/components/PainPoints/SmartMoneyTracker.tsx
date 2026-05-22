"use client";

import { useMemo } from "react";
import { fmtNum, pctColor } from "@/lib/format";

interface FlowData {
  foreignBuy: number;      // millions THB
  foreignSell: number;
  blockBuy: number;
  blockSell: number;
  institutionalBuy: number;
  institutionalSell: number;
  date: string;
}

interface Props {
  flows: FlowData[];
}

function computeSmartMoneyScore(flows: FlowData[]): {
  score: number;
  trend: "accumulating" | "distributing" | "neutral";
  foreignNet: number;
  blockNet: number;
  instNet: number;
  foreignTrend: number;
  days: number;
} {
  if (flows.length === 0) {
    return { score: 50, trend: "neutral", foreignNet: 0, blockNet: 0, instNet: 0, foreignTrend: 0, days: 0 };
  }

  const foreignNet = flows.reduce((s, f) => s + (f.foreignBuy - f.foreignSell), 0);
  const blockNet = flows.reduce((s, f) => s + (f.blockBuy - f.blockSell), 0);
  const instNet = flows.reduce((s, f) => s + (f.institutionalBuy - f.institutionalSell), 0);

  const totalVol = flows.reduce((s, f) => s + f.foreignBuy + f.foreignSell + f.blockBuy + f.blockSell, 0);
  const netPct = totalVol > 0 ? ((foreignNet + blockNet + instNet) / totalVol) * 100 : 0;

  // Trend: compare first half vs second half
  const mid = Math.floor(flows.length / 2);
  const firstHalf = flows.slice(0, mid).reduce((s, f) => s + (f.foreignBuy - f.foreignSell), 0);
  const secondHalf = flows.slice(mid).reduce((s, f) => s + (f.foreignBuy - f.foreignSell), 0);
  const foreignTrend = firstHalf !== 0 ? ((secondHalf - firstHalf) / Math.abs(firstHalf)) * 100 : 0;

  // Score 0-100: 50 = neutral, >50 = smart money buying, <50 = selling
  let score = 50 + netPct * 2;
  score = Math.max(10, Math.min(90, score));

  let trend: "accumulating" | "distributing" | "neutral" = "neutral";
  if (score >= 60 && foreignTrend > 10) trend = "accumulating";
  else if (score <= 40 && foreignTrend < -10) trend = "distributing";
  else if (score >= 55) trend = "accumulating";
  else if (score <= 45) trend = "distributing";

  return { score, trend, foreignNet, blockNet, instNet, foreignTrend, days: flows.length };
}

export function SmartMoneyTracker({ flows }: Props) {
  const analysis = useMemo(() => computeSmartMoneyScore(flows), [flows]);

  const trendColor = analysis.trend === "accumulating"
    ? "var(--bull)"
    : analysis.trend === "distributing"
    ? "var(--bear)"
    : "var(--muted)";

  const trendBg = analysis.trend === "accumulating"
    ? "var(--bull-10)"
    : analysis.trend === "distributing"
    ? "var(--bear-10)"
    : "transparent";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Score hero */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 14px",
          background: trendBg,
          border: `1px solid ${trendColor}`,
        }}
      >
        <div style={{ textAlign: "center", minWidth: 56 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: trendColor,
              lineHeight: 1,
            }}
          >
            {analysis.score}
          </div>
          <div className="t-micro" style={{ color: trendColor, marginTop: 3 }}>SCORE</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="t-body" style={{ fontWeight: 600, fontSize: "0.875rem", color: trendColor }}>
            SMART MONEY {analysis.trend.toUpperCase()}
          </div>
          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
            {analysis.days}-day flow composite. Foreign + Block + Institutional net.
          </div>
        </div>
      </div>

      {/* Flow breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--line)" }}>
        {[
          { label: "FOREIGN", net: analysis.foreignNet, trend: analysis.foreignTrend },
          { label: "BLOCK", net: analysis.blockNet, trend: 0 },
          { label: "INSTITUTIONAL", net: analysis.instNet, trend: 0 },
        ].map((item) => {
          const color = item.net > 0 ? "var(--bull)" : item.net < 0 ? "var(--bear)" : "var(--muted)";
          return (
            <div key={item.label} style={{ background: "var(--bg-surface)", padding: "10px 8px", textAlign: "center" }}>
              <div className="t-micro" style={{ marginBottom: 4 }}>{item.label}</div>
              <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700, color }}>
                {item.net > 0 ? "+" : ""}฿{fmtNum(Math.abs(item.net), 0)}M
              </div>
              <div className="t-mono" style={{ fontSize: "0.6rem", color, marginTop: 2 }}>
                {item.net > 0 ? "NET BUY" : item.net < 0 ? "NET SELL" : "BALANCED"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Context */}
      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--dim)", lineHeight: 1.5 }}>
        {analysis.trend === "accumulating"
          ? "Foreign + institutional net buyers. This is the signal retail investors rarely see. When smart money buys, consider following — but only at good prices."
          : analysis.trend === "distributing"
          ? "Foreign + institutional net sellers. They may see risks ahead. Tighten stops, raise cash, or wait for better entry."
          : "No clear directional bias from institutional flows. Price action is likely retail-driven — be cautious."}
      </div>
    </div>
  );
}
