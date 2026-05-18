"use client";

import { fmtNum, pctColor } from "@/lib/format";
import { yieldCurveContext, vixContext } from "@/lib/stats";

interface Props {
  fedRate: number;
  us10y: number | null;
  us2y: number | null;
  yieldSpread: number | null;
  vix: number | null;
  thbUsd: number;
  setPe: number;
  cape: number;
  fgScore: number;
}

export function CompactMacroStrip({ fedRate, us10y, us2y, yieldSpread, vix, thbUsd, setPe, cape, fgScore }: Props) {
  const spread = yieldSpread ?? (us10y && us2y ? us10y - us2y : null);
  const ycCtx  = spread !== null ? yieldCurveContext(spread) : null;
  const vixCtx = vix !== null ? vixContext(vix) : null;

  const items = [
    {
      label: "FED",
      value: `${fedRate.toFixed(2)}%`,
      sub: "policy rate",
      color: "var(--ink)",
    },
    {
      label: "10Y−2Y",
      value: spread !== null ? `${spread > 0 ? "+" : ""}${spread.toFixed(2)}%` : "—",
      sub: ycCtx?.signal ?? "",
      color: ycCtx?.color ?? "var(--muted)",
    },
    {
      label: "VIX",
      value: vix !== null ? vix.toFixed(1) : "—",
      sub: vixCtx?.label ?? "",
      color: vixCtx?.color ?? "var(--muted)",
    },
    {
      label: "THB",
      value: thbUsd.toFixed(2),
      sub: thbUsd > 35 ? "weak" : thbUsd < 32 ? "strong" : "stable",
      color: thbUsd > 37 ? "var(--bear)" : "var(--ink)",
    },
    {
      label: "SET P/E",
      value: setPe.toFixed(1),
      sub: setPe < 15 ? "fair value" : setPe < 18 ? "moderate" : "expensive",
      color: setPe < 15 ? "var(--bull)" : setPe < 18 ? "var(--caution)" : "var(--bear)",
    },
    {
      label: "CAPE",
      value: cape.toFixed(1),
      sub: cape > 30 ? "US expensive" : "fair",
      color: cape > 35 ? "var(--bear)" : "var(--caution)",
    },
    {
      label: "F&G",
      value: `${fgScore}`,
      sub: fgScore <= 25 ? "extreme fear" : fgScore <= 45 ? "fear" : fgScore <= 55 ? "neutral" : fgScore <= 75 ? "greed" : "extreme greed",
      color: fgScore <= 25 ? "var(--bull)" : fgScore >= 75 ? "var(--caution)" : "var(--muted)",
    },
  ];

  return (
    <div style={{
      display: "flex",
      overflowX: "auto",
      scrollbarWidth: "none",
      background: "var(--bg)",
      borderBottom: "1px solid var(--line)",
      paddingBottom: 0,
    }}>
      {items.map((item, i) => (
        <div
          key={item.label}
          style={{
            flex: "0 0 auto",
            padding: "8px 14px",
            borderRight: i < items.length - 1 ? "1px solid var(--line)" : "none",
            minWidth: 72,
          }}
        >
          <div className="t-micro" style={{ marginBottom: 2 }}>{item.label}</div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.875rem",
            fontWeight: 700,
            color: item.color,
            lineHeight: 1.2,
          }}>
            {item.value}
          </div>
          <div style={{
            fontSize: "0.6rem",
            fontFamily: "var(--font-body)",
            color: item.color === "var(--ink)" ? "var(--dim)" : item.color,
            marginTop: 2,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            opacity: 0.8,
          }}>
            {item.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
