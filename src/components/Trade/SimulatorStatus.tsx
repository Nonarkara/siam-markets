"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { calculateMetrics } from "@/lib/trading";
import { fmtNum, pctColor } from "@/lib/format";
import type { SimPortfolio } from "@/lib/types";

const STORAGE_KEY = "siam_sim_portfolio";

function loadPortfolio(): SimPortfolio | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SimPortfolio;
  } catch {
    return null;
  }
}

export function SimulatorStatus() {
  const [portfolio, setPortfolio] = useState<SimPortfolio | null>(null);

  useEffect(() => {
    setPortfolio(loadPortfolio());
  }, []);

  if (!portfolio) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 16 }}>
        <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          No paper trading data yet.
        </div>
        <div className="t-micro" style={{ marginTop: 6 }}>
          <Link href="/simulate" style={{ color: "var(--tech)" }}>Start simulator →</Link>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics(portfolio);
  const openTrades = portfolio.trades.filter(t => t.status === "open");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 1, background: "var(--line)" }}>
        <div style={{ flex: 1, background: "var(--bg-surface)", padding: "10px 12px" }}>
          <div className="t-micro" style={{ marginBottom: 2 }}>EQUITY</div>
          <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700 }}>
            ฿{fmtNum(metrics.currentEquity, 0)}
          </div>
        </div>
        <div style={{ flex: 1, background: "var(--bg-surface)", padding: "10px 12px" }}>
          <div className="t-micro" style={{ marginBottom: 2 }}>RETURN</div>
          <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700, color: pctColor(metrics.totalReturnPct) }}>
            {metrics.totalReturnPct >= 0 ? "+" : ""}{fmtNum(metrics.totalReturnPct, 2)}%
          </div>
        </div>
        <div style={{ flex: 1, background: "var(--bg-surface)", padding: "10px 12px" }}>
          <div className="t-micro" style={{ marginBottom: 2 }}>WIN RATE</div>
          <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700, color: metrics.winRate > 50 ? "var(--bull)" : "var(--bear)" }}>
            {fmtNum(metrics.winRate, 1)}%
          </div>
        </div>
      </div>

      {openTrades.length > 0 && (
        <div>
          <div className="t-micro" style={{ marginBottom: 4 }}>OPEN POSITIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--line)" }}>
            {openTrades.slice(0, 2).map(trade => {
              const pnl = trade.pnl ?? 0;
              const color = pnl > 0 ? "var(--bull)" : pnl < 0 ? "var(--bear)" : "var(--muted)";
              return (
                <div key={trade.id} style={{ background: "var(--bg-surface)", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      {trade.symbol.replace(".BK", "")}
                    </div>
                    <div className="t-micro">{trade.direction.toUpperCase()} · {trade.quantity} shares</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="t-mono" style={{ fontSize: "0.875rem", color }}>
                      {pnl >= 0 ? "+" : ""}฿{fmtNum(pnl, 0)}
                    </div>
                    <div className="t-micro" style={{ color }}>
                      R:R 1:{trade.riskReward.toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ textAlign: "right" }}>
        <Link href="/simulate" className="t-micro" style={{ color: "var(--tech)" }}>
          OPEN SIMULATOR →
        </Link>
      </div>
    </div>
  );
}
