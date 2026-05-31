"use client";

import { useState, useMemo } from "react";
import {
  REAL_HOLDINGS, REAL_PORTFOLIO_AS_OF,
  HOLDINGS, PORTFOLIO_AS_OF,
  computeSummary, allocationByTheme,
  type FundHolding,
} from "@/lib/portfolio-data";
import dreamHistory from "@/lib/data/cache/dream-history.json";

// Live proxy 1-month moves, refreshed by ingestion/track_dream.py.
const PROXY_MTD = (dreamHistory as { lastRun: string; proxies: Record<string, { mtdPct: number; label: string }> });

/* ══════════════════════════════════════════════════════════════════════════════
   DreamPortfolio — track two books over time and read WHY each holding moves.
   • EXAMPLE 1 · REAL — the actual held fund book (Fund SuperMart statement).
   • DREAM · IDEAL — the hindsight long-term allocation already in the repo.
   Each fund carries a yfinance proxy (its driver) + a one-line thesis. The
   ingestion cron (ingestion/track_dream.py) appends proxy NAVs to a history
   file so the patterns compound visibly over time.
   ══════════════════════════════════════════════════════════════════════════════ */

const PORTFOLIOS = {
  real:  { label: "EXAMPLE 1 · REAL",  holdings: REAL_HOLDINGS, asOf: REAL_PORTFOLIO_AS_OF },
  dream: { label: "DREAM · IDEAL",     holdings: HOLDINGS,      asOf: PORTFOLIO_AS_OF },
} as const;
type Which = keyof typeof PORTFOLIOS;

function fmtB(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000)     return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${Math.round(v).toLocaleString()}`;
}

export function DreamPortfolio() {
  const [which, setWhich] = useState<Which>("real");
  const P = PORTFOLIOS[which];

  const summary = useMemo(() => computeSummary(P.holdings), [P]);
  const themes  = useMemo(() => allocationByTheme(P.holdings), [P]);
  const sorted  = useMemo(() => [...P.holdings].sort((a, b) => b.gainLossPct - a.gainLossPct), [P]);
  const maxAbs  = useMemo(() => Math.max(...P.holdings.map(h => Math.abs(h.gainLossPct)), 1), [P]);

  const winners = sorted.filter(h => h.gainLossPct > 0).slice(0, 3);
  const losers  = sorted.filter(h => h.gainLossPct < 0).slice(-3).reverse();
  const themeMax = Math.max(...themes.map(t => t.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

      {/* Portfolio toggle */}
      <div style={{ display: "flex", border: "1px solid var(--line)" }}>
        {(Object.keys(PORTFOLIOS) as Which[]).map((k, i) => (
          <button key={k} onClick={() => setWhich(k)} style={{
            flex: 1, padding: "12px 8px", minHeight: 44,
            background: which === k ? "var(--bg-hover)" : "transparent",
            border: "none", borderRight: i === 0 ? "1px solid var(--line)" : "none",
            color: which === k ? "var(--caution)" : "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
            letterSpacing: "0.08em", fontWeight: which === k ? 700 : 400, cursor: "pointer",
          }}>{PORTFOLIOS[k].label}</button>
        ))}
      </div>

      {/* KPI summary */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
          <Kpi label="INVESTED"  value={fmtB(summary.totalCost)}  col="var(--muted)" />
          <Kpi label="VALUE NOW" value={fmtB(summary.totalValue)} col="var(--ink)" />
          <Kpi label="GAIN"      value={`${summary.totalGain >= 0 ? "+" : ""}${fmtB(summary.totalGain)}`} col={summary.totalGain >= 0 ? "var(--bull)" : "var(--bear)"} />
          <Kpi label="RETURN"    value={`${summary.totalGainPct >= 0 ? "+" : ""}${summary.totalGainPct.toFixed(2)}%`} col={summary.totalGainPct >= 0 ? "var(--bull)" : "var(--bear)"} />
        </div>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 12, textTransform: "none", letterSpacing: 0 }}>
          {summary.count} funds · as of {P.asOf} · best {summary.bestPerformer.code} +{summary.bestPerformer.gainLossPct.toFixed(0)}% · worst {summary.worstPerformer.code} {summary.worstPerformer.gainLossPct.toFixed(0)}%
        </div>
      </div>

      {/* Performance ladder — the whole story at a glance */}
      <div className="card" style={{ padding: 16 }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 14 }}>PERFORMANCE LADDER · return since cost</div>
        {sorted.map(h => {
          const pos = h.gainLossPct >= 0;
          const w = (Math.abs(h.gainLossPct) / maxAbs) * 50; // % of half-width
          return (
            <div key={h.code} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", width: 118, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.code}</div>
              <div style={{ flex: 1, height: 14, background: "var(--bg)", position: "relative", display: "flex" }}>
                <div style={{ width: "50%", height: "100%", display: "flex", justifyContent: "flex-end" }}>
                  {!pos && <div style={{ width: `${w * 2}%`, height: "100%", background: "var(--bear)", opacity: 0.7 }} />}
                </div>
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--line)" }} />
                <div style={{ width: "50%", height: "100%" }}>
                  {pos && <div style={{ width: `${w * 2}%`, height: "100%", background: "var(--bull)", opacity: 0.7 }} />}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: pos ? "var(--bull)" : "var(--bear)", width: 52, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>
                {pos ? "+" : ""}{h.gainLossPct.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Why winning / why lagging — the analysis */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--gap)" }}>
        <WhyCard title="WHY THESE ARE WINNING" tint="var(--bull)" rows={winners} />
        <WhyCard title="WHY THESE ARE LAGGING" tint="var(--bear)" rows={losers} />
      </div>

      {/* Theme allocation */}
      <div className="card" style={{ padding: 16 }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 14 }}>ALLOCATION BY THEME</div>
        {themes.map(t => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--muted)", width: 110, flexShrink: 0 }}>{t.label}</div>
            <div style={{ flex: 1, height: 10, background: "var(--bg)" }}>
              <div style={{ height: "100%", width: `${(t.value / themeMax) * 100}%`, background: "var(--tech)", opacity: 0.55 }} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", width: 56, textAlign: "right", flexShrink: 0 }}>{fmtB(t.value)}</div>
          </div>
        ))}
      </div>

      {/* Tracking note */}
      <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.6, textTransform: "none", letterSpacing: 0, paddingTop: 4 }}>
        Proxy trends last refreshed {PROXY_MTD.lastRun} via <code style={{ fontFamily: "var(--font-mono)" }}>ingestion/track_dream.py</code> — each fund&apos;s proxy index is fetched and appended to a history file so the patterns compound over time. Real-book figures are from the Fund SuperMart statement; proxies approximate the driver, not the exact NAV. Not investment advice.
      </div>
    </div>
  );
}

function Kpi({ label, value, col }: { label: string; value: string; col: string }) {
  return (
    <div>
      <div className="t-micro" style={{ color: "var(--dim)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: col, lineHeight: 1, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function WhyCard({ title, tint, rows }: { title: string; tint: string; rows: FundHolding[] }) {
  return (
    <div className="card" style={{ padding: 16, borderLeft: `3px solid ${tint}` }}>
      <div className="t-micro" style={{ color: tint, marginBottom: 12 }}>{title}</div>
      {rows.map(h => (
        <div key={h.code} style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>{h.code}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: tint, fontWeight: 700, flexShrink: 0 }}>
              {h.gainLossPct >= 0 ? "+" : ""}{h.gainLossPct.toFixed(1)}%
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginTop: 2, flexWrap: "wrap" }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>{h.theme}{h.proxy ? ` · ${h.proxy}` : ""}</span>
            {h.proxy && PROXY_MTD.proxies[h.proxy] && (
              <span className="t-micro" style={{ color: PROXY_MTD.proxies[h.proxy].mtdPct >= 0 ? "var(--bull)" : "var(--bear)" }}>
                proxy 1mo {PROXY_MTD.proxies[h.proxy].mtdPct >= 0 ? "+" : ""}{PROXY_MTD.proxies[h.proxy].mtdPct.toFixed(1)}%
              </span>
            )}
          </div>
          {h.thesis && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5, marginTop: 4 }}>{h.thesis}</div>
          )}
        </div>
      ))}
    </div>
  );
}
