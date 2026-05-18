"use client";

import { useState } from "react";
import { TaxCalc } from "@/components/Portfolio/TaxCalc";
import { ProjectionChart } from "@/components/Portfolio/ProjectionChart";
import { PortfolioTracker } from "@/components/Portfolio/PortfolioTracker";

const TABS = ["MY PORTFOLIO", "TAX CALCULATOR", "10-YEAR PROJECTION", "INVESTMENT SCHOOL"] as const;
type Tab = typeof TABS[number];

// Compact school concepts — 5 cards in accordion style
const CONCEPTS = [
  {
    id: "mos",
    label: "MARGIN OF SAFETY",
    author: "Graham",
    color: "var(--bull)",
    definition: "Buy only when price is significantly below intrinsic value — your protection against being wrong.",
    signal: "SET stocks with MOS ≥30% are in the strong buy zone. See /scan.",
    quote: "The margin of safety is always dependent on the price paid.",
  },
  {
    id: "mr-market",
    label: "MR. MARKET",
    author: "Graham",
    color: "var(--caution)",
    definition: "The market is a moody partner offering daily prices. Exploit his panic — never follow his enthusiasm.",
    signal: "F&G below 25 = Mr. Market is panicking. Historically the best time to buy quality.",
    quote: "Mr. Market is there to serve you, not to guide you.",
  },
  {
    id: "moat",
    label: "ECONOMIC MOAT",
    author: "Buffett",
    color: "var(--tech)",
    definition: "A durable competitive advantage. 4 types: cost advantage, switching costs, network effect, intangible assets.",
    signal: "ADVANC (switching), AOT (scale), CPALL (network) — these are wide moat Thai stocks.",
    quote: "The key is determining the competitive advantage and the durability of that advantage.",
  },
  {
    id: "1pct",
    label: "THE 1% RULE",
    author: "Risk Management",
    color: "var(--bear)",
    definition: "Never risk more than 1% of account per trade. 10 losses in a row still leaves 90% of capital.",
    signal: "Position size = (Account × 1%) ÷ (Entry − Stop). The simulator enforces this.",
    quote: "Survival is the first law of trading. You can't make money if you're out of the game.",
  },
  {
    id: "regime",
    label: "MARKET REGIME",
    author: "Technical",
    color: "var(--caution)",
    definition: "Trending markets reward trend-following. Ranging markets punish it. Know which you're in.",
    signal: "Trade desk shows current regime. Trending = full size. Ranging = half size or stay out.",
    quote: "The trend is your friend — until it ends.",
  },
];

export default function MoneyPage() {
  const [tab, setTab] = useState<Tab>("TAX CALCULATOR");
  const [openConcept, setOpenConcept] = useState<string | null>(null);

  return (
    <div className="page page-enter" style={{ paddingTop: 16 }}>
      <div className="t-display" style={{ marginBottom: 4 }}>Money</div>
      <div className="t-body" style={{ color: "var(--muted)", marginBottom: 16 }}>
        Tax, projection, and the frameworks that made Buffett a billionaire.
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--line)", marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 14px",
              minHeight: 44,
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--bull)" : "2px solid transparent",
              color: tab === t ? "var(--bull)" : "var(--muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-micro)",
              letterSpacing: "0.08em",
              fontWeight: tab === t ? 700 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "MY PORTFOLIO" && <PortfolioTracker />}
      {tab === "TAX CALCULATOR" && <TaxCalc />}

      {tab === "10-YEAR PROJECTION" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ProjectionChart initialAmount={500_000} monthlyContribution={10_000} />
          <div className="card" style={{ padding: 16 }}>
            <div className="t-body" style={{ fontWeight: 600, marginBottom: 6 }}>Patience is the edge.</div>
            <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Starting with ฿500K + ฿10K/month. The gap between 6% and 10% over 10 years is the difference between discipline and drift. The money you save on taxes via RMF/Thai ESG can be reinvested — move that savings directly into the monthly contribution slider.
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <div className="t-body" style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--ink)" }}>
                &ldquo;The stock market is a device for transferring money from the impatient to the patient.&rdquo;
              </div>
              <div className="t-micro" style={{ marginTop: 4 }}>Warren Buffett</div>
            </div>
          </div>
        </div>
      )}

      {tab === "INVESTMENT SCHOOL" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {CONCEPTS.map(c => (
            <details
              key={c.id}
              style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", borderLeft: `3px solid ${c.color}` }}
              open={openConcept === c.id}
              onToggle={(e) => setOpenConcept((e.target as HTMLDetailsElement).open ? c.id : null)}
            >
              <summary style={{
                padding: "14px 16px",
                cursor: "pointer",
                listStyle: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: 52,
              }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: c.color, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>
                    {c.label}
                  </div>
                  <div className="t-micro">{c.author}</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--dim)" }}>▾</span>
              </summary>
              <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--line)" }}>
                <div className="t-body" style={{ marginTop: 12, lineHeight: 1.6 }}>{c.definition}</div>
                <div style={{ background: "var(--bg-hover)", padding: "10px 12px", margin: "10px 0", borderLeft: `2px solid ${c.color}` }}>
                  <div className="t-micro" style={{ color: c.color, marginBottom: 3 }}>TODAY&apos;S SIGNAL</div>
                  <div className="t-body" style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{c.signal}</div>
                </div>
                <div style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <div className="t-body" style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--ink)" }}>&ldquo;{c.quote}&rdquo;</div>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
