"use client";

import type { StockFundamentals } from "@/lib/types";
import { fmtNum, fmtPct, pctClass } from "@/lib/format";

interface Props {
  stocks: StockFundamentals[];
}

export function TopMovers({ stocks }: Props) {
  // Sort by absolute % change (simulated from changePct — for mock use defensiveScore as proxy)
  const sorted = [...stocks]
    .sort((a, b) => Math.abs(b.pe - 15) - Math.abs(a.pe - 15))
    .slice(0, 5);

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
        <span className="t-micro">TOP SET50 MOVERS</span>
      </div>
      {sorted.map((stock, i) => {
        const mockPct = ((stock.defensiveScore - 3.5) * 0.8); // simulate daily move
        return (
          <div
            key={stock.symbol}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: i < sorted.length - 1 ? "1px solid var(--line)" : "none",
              minHeight: 44,
            }}
          >
            <div>
              <div className="t-mono" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                {stock.symbol.replace(".BK", "")}
              </div>
              <div className="t-micro" style={{ marginTop: 2 }}>
                {stock.sector}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="t-mono" style={{ fontSize: "0.875rem" }}>
                ฿{fmtNum(stock.price, 2)}
              </div>
              <div className={`t-mono ${pctClass(mockPct)}`} style={{ fontSize: "0.75rem", marginTop: 2 }}>
                {fmtPct(mockPct)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
