"use client";

import { useState } from "react";
import { TaxCalc } from "@/components/Portfolio/TaxCalc";
import { ProjectionChart } from "@/components/Portfolio/ProjectionChart";

const TABS = ["Tax Calculator", "10-Year Projection"] as const;
type Tab = typeof TABS[number];

export default function PortfolioPage() {
  const [tab, setTab] = useState<Tab>("Tax Calculator");

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Portfolio & Tax</h1>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          How much tax do your fund investments save? How does patience compound your money?
        </p>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          marginBottom: "var(--gap)",
          border: "1px solid var(--line)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "12px 8px",
              minHeight: 44,
              background: tab === t ? "var(--bg-hover)" : "transparent",
              border: "none",
              borderRight: t === "Tax Calculator" ? "1px solid var(--line)" : "none",
              color: tab === t ? "var(--bull)" : "var(--muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-micro)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: tab === t ? 600 : 400,
              cursor: "pointer",
              transition: "all 200ms var(--ease)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Tax Calculator" && <TaxCalc />}

      {tab === "10-Year Projection" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          <ProjectionChart initialAmount={500_000} monthlyContribution={10_000} />

          {/* Context */}
          <div className="card" style={{ padding: "16px" }}>
            <div className="t-body" style={{ fontWeight: 600, marginBottom: 8 }}>
              What ฿10,000/month becomes
            </div>
            <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: "0.875rem" }}>
              Starting with ฿500,000 and adding ฿10,000 per month. The chart shows three compounding scenarios. The difference between 6% and 10% over 10 years is not small — it is the gap between patience and discipline.
            </div>
            <div className="divider" style={{ margin: "12px 0" }} />
            <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--ink)" }}>Buffett&apos;s rule:</span> &ldquo;Time in the market beats timing the market. The stock market is a device for transferring money from the impatient to the patient.&rdquo;
            </div>
          </div>

          {/* Adjust */}
          <div className="card" style={{ padding: "16px" }}>
            <div className="t-micro" style={{ marginBottom: 8 }}>EDIT ASSUMPTIONS</div>
            <div style={{ color: "var(--muted)", fontSize: "0.8rem", fontFamily: "var(--font-body)" }}>
              The chart above uses ฿500,000 lump sum + ฿10,000/month. Adjust the Tax Calculator tab to model your actual situation — tax savings can be reinvested to increase the monthly contribution.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
