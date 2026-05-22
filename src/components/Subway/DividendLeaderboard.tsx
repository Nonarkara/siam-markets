"use client";

import { useMemo } from "react";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  dividendYield: number;
  pe: number;
}

interface Props {
  stocks: Stock[];
  topN?: number;
}

export function DividendLeaderboard({ stocks, topN = 5 }: Props) {
  const leaders = useMemo(() => {
    return [...stocks]
      .filter(s => s.dividendYield > 0)
      .sort((a, b) => b.dividendYield - a.dividendYield)
      .slice(0, topN);
  }, [stocks, topN]);

  if (!leaders.length) return null;
  const maxYield = leaders[0].dividendYield;

  return (
    <div style={{ borderBottom: "1px solid var(--line-dim)" }}>
      <div className="t-micro" style={{ padding: "4px 10px", color: "var(--dim)", letterSpacing: "0.14em" }}>
        DIVIDEND YIELD · TOP {topN}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {leaders.map((stock, i) => {
          const barPct = (stock.dividendYield / maxYield) * 100;
          const yieldColor = stock.dividendYield > 5 ? "var(--bull)" : stock.dividendYield > 3 ? "var(--caution)" : "var(--muted)";
          return (
            <div key={stock.symbol} style={{
              display: "grid",
              gridTemplateColumns: "1fr 50px 50px 50px",
              gap: 8,
              alignItems: "center",
              padding: "3px 10px",
              borderBottom: i < leaders.length - 1 ? "1px solid var(--line-dim)" : "none",
              minHeight: 24,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: `${barPct}%`, height: 3, background: yieldColor, maxWidth: 60 }} />
                <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--ink)" }}>
                  {stock.symbol.replace(".BK", "")}
                </span>
              </div>
              <span className="t-mono" style={{ fontSize: "0.625rem", color: yieldColor, textAlign: "right" }}>
                {stock.dividendYield.toFixed(1)}%
              </span>
              <span className="t-mono" style={{ fontSize: "0.625rem", color: "var(--dim)", textAlign: "right" }}>
                P/E {stock.pe.toFixed(0)}
              </span>
              <span className="t-mono" style={{ fontSize: "0.625rem", color: "var(--dim)", textAlign: "right" }}>
                ฿{stock.price.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
