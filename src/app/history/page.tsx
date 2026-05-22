export const dynamic = "force-static";

const milestones = [
  { date: "2024-11", label: "Genesis", desc: "Concept born — a Bloomberg Terminal for the 99%. Dark mode, zero chrome, pure signal." },
  { date: "2024-12", label: "Data Pipelines", desc: "Built Python ingestion layer: yfinance, FRED, BOT, GISTDA. Granger causality + regime detection + changepoint analysis." },
  { date: "2025-01", label: "Design System", desc: "Braun/Dieter Rams dark theme locked. Zero border-radius. Three font sizes. Green=positive, red=negative, yellow=caution." },
  { date: "2025-02", label: "Newsroom TV", desc: "Live financial TV from 11+ countries. Signal detection, NO SIGNAL fallback, trilingual ticker." },
  { date: "2025-03", label: "Trade Desk", desc: "Bloomberg-style 6-tab command center: Signal, Indicators, Levels, Fundamentals, Flow, Macro. ADX, Stochastic, Williams %R, OBV, pivot points." },
  { date: "2025-04", label: "Dream Portfolio", desc: "Phillip Fund SuperMart schema. Sortable holdings, 4 SVG donuts, Cullen Roche framework, tax tracking, 30-year projection." },
  { date: "2025-05", label: "Subway Density", desc: "Dashboard rebuilt as a subway map. Express status bar, quadrant lines, no-scroll mandate for 16–17\" laptops." },
  { date: "2025-06", label: "Mutual Funds + Planner", desc: "Thai fund search with overlap analysis, tax benefits (RMF/SSF/Thai ESG). Gamified wealth planner with Kiyosaki Gap." },
  { date: "2025-07", label: "Causality + Satellite", desc: "Granger tables, structural break timelines, regime gauges, GISTDA satellite overlay for Thai macro monitoring." },
  { date: "2025-08", label: "Markets Shell", desc: "9-tab global markets: Map, Regional, Global, Macro, Sectors, Events, Causality, World News, Commodities, Satellite." },
  { date: "2025-09", label: "Graham Scanner", desc: "Value scanner with Buffett-style verdicts. Price vs Graham Number overlay, 8-metric grid, company timeline." },
  { date: "2025-10", label: "Legal + Polish", desc: "Research preview disclaimers, privacy policy, development history. Claude polish pass: gradients removed, tokens locked, aria-labels, mobile collapses." },
  { date: "2025-11", label: "V2 Roadmap", desc: "Live order-book simulation, social sentiment layers, options flow, and predictive regime switching." },
];

export default function HistoryPage() {
  return (
    <div className="max-w-3xl mx-auto p-6" style={{ fontFamily: "var(--font-body)" }}>
      <h1 className="t-display" style={{ marginBottom: "0.75rem" }}>
        Development History
      </h1>
      <p className="t-micro" style={{ color: "var(--dim)", marginBottom: "2rem" }}>
        A record of how daytrade.town was built, milestone by milestone.
      </p>

      <div style={{ position: "relative", paddingLeft: 24 }}>
        {/* Timeline line */}
        <div style={{
          position: "absolute", left: 5, top: 4, bottom: 4, width: 2, background: "var(--line)",
        }} />

        {milestones.map((m, i) => (
          <div key={i} style={{ position: "relative", marginBottom: "1.5rem" }}>
            <div style={{
              position: "absolute", left: -22, top: 4, width: 8, height: 8,
              background: i === milestones.length - 1 ? "var(--caution)" : "var(--bull)",
              border: `2px solid ${i === milestones.length - 1 ? "var(--caution)" : "var(--bull)"}`,
            }} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <span className="t-mono" style={{ fontSize: "0.625rem", color: "var(--dim)", minWidth: 60 }}>
                {m.date}
              </span>
              <span className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>
                {m.label}
              </span>
            </div>
            <p className="t-body" style={{ lineHeight: 1.6, color: "var(--ink-dim)", fontSize: "0.8125rem" }}>
              {m.desc}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--line-dim)" }}>
        <p className="t-micro" style={{ color: "var(--dim)" }}>
          Built by a solo developer in Bangkok, Thailand. No VC. No ads. No tracking. Open to collaboration.
        </p>
      </div>
    </div>
  );
}
