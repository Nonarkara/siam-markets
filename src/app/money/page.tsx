"use client";

/**
 * MONEY — viewport-locked, tabbed Portfolio Statement.
 *
 *   SUMMARY · HOLDINGS · PERFORMANCE · TAX · PROJECTION
 *
 * Sources Dr Non's real Phillip Fund SuperMart statement (acct G7159).
 * Layout mirrors the Phillip PDF schema but is denser, viewport-fit,
 * Braun-themed, and sortable.
 */

import { useMemo } from "react";
import { Tabs } from "@/components/Tabs/Tabs";
import { TaxCalc } from "@/components/Portfolio/TaxCalc";
import { ProjectionChart } from "@/components/Portfolio/ProjectionChart";
import { PerfectPortfolio } from "@/components/Portfolio/PerfectPortfolio";
import { DreamPortfolio } from "@/components/Portfolio/DreamPortfolio";
import { MrMarketMood } from "@/components/MrMarketMood";
import {
  PortfolioSummaryView,
  HoldingsTableView,
  PerformanceView,
} from "@/components/Portfolio/PortfolioStatement";
import {
  HOLDINGS,
  computeSummary,
  PORTFOLIO_AS_OF,
  PORTFOLIO_ACCOUNT,
  PORTFOLIO_OWNER,
  PORTFOLIO_DISCLAIMER,
} from "@/lib/portfolio-data";

const CONCEPTS = [
  { id: "ssf",  label: "SSF",  full: "Super Savings Fund",       cap: "฿200k or 30% income · whichever lower", lock: "10 years · withdrawable after 10y from purchase",  who: "Anyone with taxable income", color: "var(--tech)" },
  { id: "rmf",  label: "RMF",  full: "Retirement Mutual Fund",   cap: "฿500k or 30% income · whichever lower", lock: "Until age 55 · 5y minimum holding",                who: "Long horizon · retirement",   color: "var(--bear)" },
  { id: "tesg", label: "TESG", full: "Thai ESG Fund",            cap: "฿300k or 30% income · whichever lower", lock: "8 years from purchase",                            who: "Domestic ESG mandate",        color: "var(--caution)" },
  { id: "ltf",  label: "LTF",  full: "Long-Term Equity (legacy)", cap: "Discontinued for new buys (2020)",      lock: "5–7 years depending on issue year",                who: "Existing holders only",       color: "var(--violet)" },
  { id: "fee",  label: "FEE",  full: "What you actually pay",    cap: "Front-end 0–1.5% on purchase",          lock: "Yearly TER 0.5–2.0% — quiet drag",                 who: "Always check the fact-sheet", color: "var(--muted)" },
];

const fmtTHB = (n: number) => `฿${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function Scroller({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16 }}>{children}</div>;
}

export default function MoneyPage() {
  const summary = useMemo(() => computeSummary(HOLDINGS), []);
  const gainColor = summary.totalGain >= 0 ? "var(--bull)" : "var(--bear)";

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-page__header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <h1 className="t-display" style={{ fontSize: "1.25rem", lineHeight: 1.1 }}>Dream Portfolio</h1>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "var(--braun-yellow, #ffd000)",
                  border: "1px solid var(--braun-yellow, #ffd000)",
                  padding: "2px 7px",
                }}
              >
                EDUCATIONAL
              </span>
            </div>
            <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4 }}>
              {PORTFOLIO_OWNER} · {PORTFOLIO_ACCOUNT} · as of {PORTFOLIO_AS_OF}
            </div>
            <div className="t-micro" style={{ color: "var(--dim)", marginTop: 2, fontSize: "0.5625rem" }}>
              {PORTFOLIO_DISCLAIMER}
            </div>
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "baseline" }}>
            <Mini label="Value"   value={fmtTHB(summary.totalValue)} />
            <Mini label="Cost"    value={fmtTHB(summary.totalCost)} />
            <Mini label="Gain ฿"  value={`${summary.totalGain >= 0 ? "+" : ""}${fmtTHB(summary.totalGain)}`} color={gainColor} />
            <Mini label="Gain %"  value={`${summary.totalGain >= 0 ? "+" : ""}${summary.totalGainPct.toFixed(2)}%`} color={gainColor} bold />
          </div>
        </div>
      </div>

      <div className="dashboard-page__body">
        <div style={{ padding: "12px 16px 0" }}>
          <MrMarketMood />
        </div>
        <Tabs
          defaultId="analysis"
          tabs={[
            {
              id: "analysis", label: "MINE vs DREAM", badge: "ANALYSIS",
              content: <Scroller><DreamPortfolio /></Scroller>,
            },
            {
              id: "summary", label: "SUMMARY", badge: `${HOLDINGS.length} funds`,
              content: <Scroller><PortfolioSummaryView /></Scroller>,
            },
            {
              id: "holdings", label: "HOLDINGS", badge: "FULL TABLE",
              content: (
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 16 }}>
                  <HoldingsTableView />
                </div>
              ),
            },
            {
              id: "performance", label: "PERFORMANCE", badge: `${summary.totalGain >= 0 ? "+" : ""}${summary.totalGainPct.toFixed(1)}%`,
              content: <Scroller><PerformanceView /></Scroller>,
            },
            {
              id: "tax", label: "TAX", badge: "RMF/SSF/TESG",
              content: (
                <Scroller>
                  <div style={{ display: "grid", gap: 14 }}>
                    <TaxCalc />
                    <div>
                      <div className="t-micro" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>TAX-BUCKET REFERENCE</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                        {CONCEPTS.map(c => (
                          <div key={c.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", borderTop: `3px solid ${c.color}`, padding: 12 }}>
                            <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700, color: c.color, letterSpacing: "0.08em" }}>{c.label}</div>
                            <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>{c.full}</div>
                            <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                              <Bit label="Cap"  text={c.cap} />
                              <Bit label="Lock" text={c.lock} />
                              <Bit label="Who"  text={c.who} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Scroller>
              ),
            },
            {
              id: "projection", label: "PROJECTION", badge: "10-YR",
              content: (
                <Scroller>
                  <div className="t-micro" style={{ color: "var(--muted)", marginBottom: 10 }}>
                    Starting from current value (฿{Math.round(summary.totalValue).toLocaleString()}) · ฿10,000/mo additional · 6 / 8 / 10% compound rates
                  </div>
                  <ProjectionChart initialAmount={Math.round(summary.totalValue)} monthlyContribution={10_000} />
                </Scroller>
              ),
            },
            {
              id: "perfect", label: "PERFECT PORTFOLIO", badge: "ROCHE",
              content: (
                <Scroller>
                  <PerfectPortfolio />
                </Scroller>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function Mini({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div>
      <div className="t-micro">{label}</div>
      <div className="t-mono" style={{ fontSize: bold ? "1rem" : "0.875rem", fontWeight: 700, color: color ?? "var(--ink)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function Bit({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ fontSize: "0.6875rem", lineHeight: 1.45 }}>
      <span className="t-micro" style={{ color: "var(--dim)", marginRight: 6 }}>{label}</span>
      <span style={{ color: "var(--ink)" }}>{text}</span>
    </div>
  );
}
