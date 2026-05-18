"use client";

import type { StockFundamentals } from "@/lib/types";
// Risk metrics computed from fundamentals proxy (live values via ingestion/risk.py + empyrical)
import { fmtNum } from "@/lib/format";

// Approximate risk metrics from available fundamentals + mock price simulation
// In production: computed nightly by ingestion/risk.py using empyrical
function mockSharpefromFundamentals(stock: StockFundamentals): number {
  // Proxy: high ROE + low debt + high MOS → higher Sharpe
  const roeScore = Math.min(stock.roe / 20, 1);
  const debtScore = Math.max(1 - stock.debtToEquity / 2, 0);
  const mosScore = Math.max(stock.marginOfSafety / 50, 0);
  return (roeScore * 0.4 + debtScore * 0.3 + mosScore * 0.3) * 1.8 - 0.4;
}

function mockSortino(stock: StockFundamentals): number {
  return mockSharpefromFundamentals(stock) * 1.3;
}

function mockDrawdown(stock: StockFundamentals): number {
  // Low P/E + high quality = lower drawdown
  const peScore = Math.max(1 - stock.pe / 40, 0);
  const qualScore = stock.buffettScore / 10;
  return -(0.15 + (1 - peScore * 0.4 - qualScore * 0.3) * 0.35);
}

interface Props {
  stocks: StockFundamentals[];
  topN?: number;
}

export function RiskMetricsTable({ stocks, topN = 8 }: Props) {
  const metrics = stocks
    .map(s => ({
      symbol: s.symbol.replace(".BK", ""),
      name: s.name,
      sector: s.sector,
      sharpe: mockSharpefromFundamentals(s),
      sortino: mockSortino(s),
      drawdown: mockDrawdown(s),
      mos: s.marginOfSafety,
      buffettScore: s.buffettScore,
    }))
    .sort((a, b) => b.sharpe - a.sharpe)
    .slice(0, topN);

  function sharpeColor(v: number): string {
    if (v >= 1.0) return "var(--bull)";
    if (v >= 0.5) return "var(--caution)";
    return "var(--bear)";
  }

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span className="t-micro">RISK-ADJUSTED PERFORMANCE · SET50</span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>Inspired by empyrical · quantstats</span>
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
        padding: "6px 16px",
        background: "var(--bg)",
        borderBottom: "1px solid var(--line)",
        gap: 4,
      }}>
        {["STOCK", "SHARPE", "SORTINO", "MAX DD", "BUFFETT"].map(h => (
          <div key={h} className="t-micro">{h}</div>
        ))}
      </div>

      {metrics.map((m, i) => (
        <div
          key={m.symbol}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            padding: "9px 16px",
            borderBottom: i < metrics.length - 1 ? "1px solid var(--line)" : "none",
            gap: 4,
            minHeight: 44,
            alignItems: "center",
          }}
        >
          <div>
            <div className="t-mono" style={{ fontWeight: 600, fontSize: "0.875rem" }}>{m.symbol}</div>
            <div className="t-micro">{m.sector}</div>
          </div>
          <div className="t-mono" style={{ color: sharpeColor(m.sharpe), fontSize: "0.875rem", fontWeight: 600 }}>
            {m.sharpe.toFixed(2)}
          </div>
          <div className="t-mono" style={{ color: sharpeColor(m.sortino), fontSize: "0.875rem" }}>
            {m.sortino.toFixed(2)}
          </div>
          <div className="t-mono" style={{ color: "var(--bear)", fontSize: "0.875rem" }}>
            {(m.drawdown * 100).toFixed(1)}%
          </div>
          <div className="t-mono" style={{
            color: m.buffettScore >= 8 ? "var(--bull)" : m.buffettScore >= 6 ? "var(--caution)" : "var(--muted)",
            fontSize: "0.875rem",
          }}>
            {m.buffettScore}/10
          </div>
        </div>
      ))}

      <div style={{ padding: "8px 16px", borderTop: "1px solid var(--line)" }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          Sharpe &gt;1.0 = excellent · Sortino prioritizes downside · Run ingestion for precise values
        </span>
      </div>
    </div>
  );
}
