"use client";

import { useState, useMemo } from "react";
import { generateBacktestData, GRAHAM_RULES, runBacktest } from "@/lib/api/mock-backtest";
import { GrahamOverlayChart } from "@/components/Charts/GrahamOverlayChart";
import type { BacktestResult } from "@/lib/api/mock-backtest";

export function BacktestEngine() {
  const [selectedRule, setSelectedRule] = useState(0);
  const [capital, setCapital] = useState(1_000_000);
  const data = useMemo(() => generateBacktestData(), []);

  const result = useMemo<BacktestResult>(() => {
    return runBacktest(data, GRAHAM_RULES[selectedRule], capital);
  }, [data, selectedRule, capital]);

  const equityData = useMemo(() =>
    result.equityCurve.map(p => ({ time: p.date + "-01", price: p.value, grahamNumber: p.value })),
    [result],
  );

  const outperformed = result.totalReturn > result.benchmarkReturn;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Rule selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {GRAHAM_RULES.map((rule, i) => (
          <button
            key={rule.name}
            onClick={() => setSelectedRule(i)}
            style={{
              background: selectedRule === i ? "var(--bg-surface)" : "transparent",
              border: `1px solid ${selectedRule === i ? "var(--bull)" : "var(--line)"}`,
              color: selectedRule === i ? "var(--bull)" : "var(--muted)",
              fontFamily: "var(--font-mono)", fontSize: "0.75rem",
              padding: "8px 14px", cursor: "pointer",
            }}
          >
            {rule.name.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5 }}>
        {GRAHAM_RULES[selectedRule].description}
      </div>

      {/* Capital slider */}
      <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "10px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="t-micro">STARTING CAPITAL</span>
          <span className="t-mono" style={{ fontWeight: 700 }}>฿{capital.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={100_000}
          max={10_000_000}
          step={100_000}
          value={capital}
          onChange={e => setCapital(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--bull)", cursor: "pointer" }}
        />
      </div>

      {/* Result stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        background: "var(--bg-raised)", border: "1px solid var(--line)",
      }}>
        <StatBox label="STRATEGY RETURN" value={`${result.totalReturn > 0 ? "+" : ""}${result.totalReturn.toFixed(1)}%`} color={result.totalReturn > 0 ? "var(--bull)" : "var(--bear)"} />
        <StatBox label="SET50 B&H" value={`${result.benchmarkReturn > 0 ? "+" : ""}${result.benchmarkReturn.toFixed(1)}%`} color={result.benchmarkReturn > 0 ? "var(--bull)" : "var(--bear)"} />
        <StatBox label="ALPHA" value={`${outperformed ? "+" : ""}${(result.totalReturn - result.benchmarkReturn).toFixed(1)}%`} color={outperformed ? "var(--bull)" : "var(--bear)"} />
        <StatBox label="ANNUALIZED" value={`${result.annualizedReturn.toFixed(1)}%`} color={result.annualizedReturn > 7 ? "var(--bull)" : "var(--caution)"} />
        <StatBox label="MAX DRAWDOWN" value={`${result.maxDrawdown.toFixed(0)}%`} color={result.maxDrawdown > 20 ? "var(--bear)" : "var(--caution)"} />
        <StatBox label="WIN RATE" value={`${result.winRate}%`} color={result.winRate > 55 ? "var(--bull)" : "var(--caution)"} />
      </div>

      {/* Equity curve */}
      <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "12px 14px" }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 8 }}>EQUITY CURVE · 5 YEARS</div>
        <GrahamOverlayChart data={equityData} height={200} />
      </div>

      {/* Trade log summary */}
      <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "10px 14px" }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 6 }}>STRATEGY SUMMARY</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <SummaryRow label="Starting Capital" value={`฿${result.startingCapital.toLocaleString()}`} />
          <SummaryRow label="Final Capital" value={`฿${result.finalCapital.toLocaleString()}`} />
          <SummaryRow label="Portfolio Rebalances" value={`${result.trades}`} />
          <SummaryRow label="Positive Months" value={`${result.winRate}%`} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5 }}>
        Past performance does not guarantee future results. This backtest uses simulated historical data and simplified rebalance logic. Real-world returns would differ due to transaction costs, taxes, slippage, and market impact.
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "10px 14px", borderRight: "1px solid var(--line-dim)", borderBottom: "1px solid var(--line-dim)", textAlign: "center" }}>
      <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 2 }}>{label}</div>
      <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span className="t-micro" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="t-mono" style={{ fontSize: "0.8125rem", color: "var(--ink)" }}>{value}</span>
    </div>
  );
}
