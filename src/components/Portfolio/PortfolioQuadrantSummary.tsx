"use client";

/**
 * Compact portfolio summary for the MONEY quadrant on DESK.
 * Mirrors the Phillip statement's first-page KPIs in a quadrant-friendly
 * footprint — top totals, mini donut by scope, top winners/laggards row.
 */

import { useMemo } from "react";
import Link from "next/link";
import {
  HOLDINGS,
  computeSummary,
  allocationByScope,
  PORTFOLIO_AS_OF,
} from "@/lib/portfolio-data";
import { Donut } from "./Donut";
import { pctColor } from "@/lib/format";

const fmtTHB = (n: number) => `฿${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function PortfolioQuadrantSummary() {
  const summary = useMemo(() => computeSummary(HOLDINGS), []);
  const byScope = useMemo(() => allocationByScope(HOLDINGS), []);

  const winners = useMemo(() => [...HOLDINGS].sort((a, b) => b.gainLossPct - a.gainLossPct).slice(0, 3), []);
  const laggards = useMemo(() => [...HOLDINGS].sort((a, b) => a.gainLossPct - b.gainLossPct).slice(0, 3), []);

  const gainColor = summary.totalGain >= 0 ? "var(--bull)" : "var(--bear)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* ── KPI strip ──────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "var(--line)",
          border: "1px solid var(--line)",
        }}
      >
        <Cell label="Cost"           value={fmtTHB(summary.totalCost)}                                                                sub={`${summary.count} funds`} />
        <Cell label="Value"          value={fmtTHB(summary.totalValue)}                                                              sub={`as ${PORTFOLIO_AS_OF}`} />
        <Cell label="Gain ฿"         value={`${summary.totalGain >= 0 ? "+" : ""}${fmtTHB(summary.totalGain)}`}                       color={gainColor} />
        <Cell label="Gain %"         value={`${summary.totalGain >= 0 ? "+" : ""}${summary.totalGainPct.toFixed(2)}%`}                color={gainColor} bold />
      </div>

      {/* ── Donut + scope legend ──────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 12,
          alignItems: "center",
          padding: 10,
          background: "var(--bg-surface)",
          border: "1px solid var(--line)",
        }}
      >
        <Donut
          data={byScope}
          size={110}
          thickness={20}
          center={
            <div>
              <div className="t-micro" style={{ color: "var(--muted)" }}>TAX-ADV</div>
              <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                {byScope.filter(s => s.key === "SSF" || s.key === "TESG" || s.key === "RMF").reduce((sum, s) => sum + s.pct, 0).toFixed(0)}%
              </div>
            </div>
          }
        />
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          {byScope.map(b => (
            <div key={b.key} style={{ display: "grid", gridTemplateColumns: "8px 60px 1fr 50px", gap: 8, alignItems: "center" }}>
              <span style={{ width: 8, height: 8, background: b.color }} />
              <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: b.color }}>{b.label}</span>
              <span className="t-micro" style={{ color: "var(--muted)" }}>{b.count} fund{(b.count ?? 0) === 1 ? "" : "s"}</span>
              <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, textAlign: "right" }}>{b.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Winners + Laggards ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <PerfBlock title="WINNERS" color="var(--bull)" data={winners} />
        <PerfBlock title="LAGGARDS" color="var(--bear)" data={laggards} />
      </div>

      <Link
        href="/money"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.625rem",
          color: "var(--tech)",
          textDecoration: "none",
          letterSpacing: "0.16em",
          padding: "6px 0",
          textAlign: "center",
          border: "1px solid var(--line)",
          background: "var(--bg-surface)",
        }}
      >
        OPEN FULL STATEMENT →
      </Link>
    </div>
  );
}

function Cell({ label, value, sub, color, bold }: { label: string; value: string; sub?: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ background: "var(--bg-surface)", padding: "8px 10px" }}>
      <div className="t-micro">{label}</div>
      <div
        className="t-mono"
        style={{
          fontSize: bold ? "0.9375rem" : "0.8125rem",
          fontWeight: 700,
          color: color ?? "var(--ink)",
          marginTop: 2,
        }}
      >
        {value}
      </div>
      {sub && <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2, fontSize: "0.5625rem" }}>{sub}</div>}
    </div>
  );
}

function PerfBlock({ title, color, data }: { title: string; color: string; data: { code: string; gainLossPct: number }[] }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", padding: "8px 10px" }}>
      <div className="t-micro" style={{ color, letterSpacing: "0.14em", marginBottom: 6 }}>{title}</div>
      {data.map(h => (
        <div key={h.code} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid var(--line-dim)" }}>
          <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
            {h.code}
          </span>
          <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: pctColor(h.gainLossPct) }}>
            {h.gainLossPct >= 0 ? "+" : ""}{h.gainLossPct.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
