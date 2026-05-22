"use client";

import { fmtPct, pctColor } from "@/lib/format";

interface Props {
  setChange: number;
  setPe: number;
  vix: number | null;
  thbUsd: number;
  fearGreed: number;
  fedRate: number;
  us10y: number | null;
  us2y: number | null;
  yieldSpread: number | null;
  cape: number;
  grahamCount: number;
  bestMos: number;
  bestMosSymbol: string;
  anomalyCount: number;
  narrativeVerdict?: string;
  macroEventsToday?: number;
}

function StatusDot({ color }: { color: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: 6, height: 6,
      background: color,
      marginRight: 6,
      verticalAlign: "middle",
    }} />
  );
}

function StatusItem({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4, whiteSpace: "nowrap" }}>
      <span className="t-micro" style={{ color: "var(--dim)", fontSize: "0.5rem", letterSpacing: "0.08em" }}>{label}</span>
      <span className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      {sub && <span className="t-micro" style={{ color: "var(--dim)", fontSize: "0.5rem" }}>{sub}</span>}
    </span>
  );
}

export function SubwayStatusBar({
  setChange, setPe, vix, thbUsd, fearGreed, fedRate, us10y, us2y, yieldSpread, cape,
  grahamCount, bestMos, bestMosSymbol, anomalyCount, narrativeVerdict, macroEventsToday,
}: Props) {
  const spread = yieldSpread ?? (us10y && us2y ? us10y - us2y : null);
  const ycInverted = spread !== null && spread < 0;
  const vixHigh = vix !== null && vix > 20;
  const fgZoneLabel = fearGreed <= 25 ? "EF" : fearGreed <= 45 ? "F" : fearGreed <= 55 ? "N" : fearGreed <= 75 ? "G" : "EG";

  return (
    <div style={{
      background: "var(--bg-raised)",
      borderBottom: "1px solid var(--line)",
      display: "flex",
      alignItems: "stretch",
      overflowX: "auto",
      scrollbarWidth: "none",
      minHeight: 34,
    }}>
      {/* PULSE LINE */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "4px 14px",
        borderRight: "1px solid var(--line-dim)",
        flexShrink: 0,
      }}>
        <StatusDot color="var(--bull)" />
        <StatusItem label="SET" value={fmtPct(setChange)} color={pctColor(setChange)} />
        <StatusItem label="P/E" value={setPe.toFixed(1)} color={setPe < 15 ? "var(--bull)" : setPe < 18 ? "var(--caution)" : "var(--bear)"} />
        <StatusItem label="VIX" value={vix !== null ? vix.toFixed(1) : "—"} color={vixHigh ? "var(--bear)" : "var(--muted)"} sub={vixHigh ? "HIGH" : undefined} />
        <StatusItem label="THB" value={thbUsd.toFixed(2)} color={thbUsd > 35 ? "var(--bear)" : thbUsd < 32 ? "var(--bull)" : "var(--muted)"} />
        <StatusItem label="F&G" value={`${fearGreed}`} color={fearGreed <= 25 ? "var(--bull)" : fearGreed >= 75 ? "var(--caution)" : "var(--muted)"} sub={fgZoneLabel} />
        <StatusItem label="FED" value={`${fedRate.toFixed(2)}%`} color="var(--ink)" />
        <StatusItem label="10Y" value={us10y !== null ? `${us10y.toFixed(2)}%` : "—"} color="var(--ink)" />
        <StatusItem label="10Y−2Y" value={spread !== null ? `${spread > 0 ? "+" : ""}${spread.toFixed(2)}%` : "—"} color={ycInverted ? "var(--bear)" : "var(--muted)"} sub={ycInverted ? "INV" : undefined} />
        <StatusItem label="CAPE" value={cape.toFixed(1)} color={cape > 30 ? "var(--bear)" : "var(--muted)"} />
      </div>

      {/* SCAN LINE */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "4px 14px",
        borderRight: "1px solid var(--line-dim)",
        flexShrink: 0,
      }}>
        <StatusDot color="var(--tech)" />
        <StatusItem label="GRAHAM" value={`${grahamCount}`} color={grahamCount >= 3 ? "var(--bull)" : "var(--muted)"} />
        <StatusItem label="BEST MOS" value={`${bestMos > 0 ? "+" : ""}${bestMos.toFixed(0)}%`} color={bestMos >= 30 ? "var(--bull)" : bestMos >= 0 ? "var(--caution)" : "var(--bear)"} sub={bestMosSymbol.replace(".BK", "")} />
      </div>

      {/* INTEL LINE */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "4px 14px",
        borderRight: "1px solid var(--line-dim)",
        flexShrink: 0,
      }}>
        <StatusDot color="var(--braun-yellow, #ffd000)" />
        <StatusItem label="ALERTS" value={`${anomalyCount}`} color={anomalyCount > 0 ? "var(--bear)" : "var(--muted)"} />
        {narrativeVerdict && (
          <span className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", fontSize: "0.5rem", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {narrativeVerdict.toUpperCase()}
          </span>
        )}
        {!!macroEventsToday && (
          <StatusItem label="TODAY" value={`${macroEventsToday}`} color={macroEventsToday > 2 ? "var(--caution)" : "var(--muted)"} sub="EVENTS" />
        )}
      </div>

      {/* MONEY LINE */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "4px 14px",
        flexShrink: 0,
      }}>
        <StatusDot color="var(--caution)" />
        <span className="t-micro" style={{ color: "var(--dim)", fontSize: "0.5rem" }}>MONEY</span>
        <span className="t-mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>TRACK IN /PLAN</span>
      </div>
    </div>
  );
}
