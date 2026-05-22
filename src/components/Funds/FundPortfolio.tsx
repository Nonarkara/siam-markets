"use client";

import { useMemo } from "react";
import type { MutualFund } from "@/lib/api/mock-funds";

interface Props {
  funds: MutualFund[];
  onRemove: (code: string) => void;
}

export function FundPortfolio({ funds, onRemove }: Props) {
  const analysis = useMemo(() => {
    if (funds.length === 0) return null;
    const avgExpense = funds.reduce((s, f) => s + f.expenseRatio, 0) / funds.length;
    const weightedReturn1y = funds.reduce((s, f) => s + f.return1y, 0) / funds.length;
    const weightedReturn5y = funds.reduce((s, f) => s + f.return5y, 0) / funds.length;
    const totalAum = funds.reduce((s, f) => s + f.aum, 0);

    // Holdings overlap
    const holdingCounts = new Map<string, number>();
    for (const f of funds) {
      for (const h of f.topHoldings) {
        holdingCounts.set(h.stock, (holdingCounts.get(h.stock) ?? 0) + 1);
      }
    }
    const overlaps = Array.from(holdingCounts.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    // Tax benefits
    const rmfTotal = funds.filter(f => f.taxBenefit.rmf).length;
    const ssfTotal = funds.filter(f => f.taxBenefit.ssf).length;
    const esgTotal = funds.filter(f => f.taxBenefit.thaiEsg).length;

    return { avgExpense, weightedReturn1y, weightedReturn5y, totalAum, overlaps, rmfTotal, ssfTotal, esgTotal };
  }, [funds]);

  if (funds.length === 0) {
    return (
      <div style={{
        padding: "20px", textAlign: "center",
        background: "var(--bg-raised)", border: "1px solid var(--line)",
      }}>
        <div className="t-body" style={{ color: "var(--muted)" }}>
          No funds selected. Search above and click to add funds to your portfolio.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Summary stats */}
      <div className="portfolio-stats" style={{
        background: "var(--bg-raised)", border: "1px solid var(--line)",
      }}>
        <div style={{ padding: "10px 14px", borderRight: "1px solid var(--line-dim)" }}>
          <div className="t-micro" style={{ color: "var(--dim)" }}>FUNDS</div>
          <div className="mono-display" style={{ color: "var(--ink)" }}>{funds.length}</div>
        </div>
        <div style={{ padding: "10px 14px", borderRight: "1px solid var(--line-dim)" }}>
          <div className="t-micro" style={{ color: "var(--dim)" }}>AVG EXPENSE</div>
          <div className="mono-display" style={{ color: analysis!.avgExpense < 1.0 ? "var(--bull)" : "var(--caution)" }}>
            {analysis!.avgExpense.toFixed(2)}%
          </div>
        </div>
        <div style={{ padding: "10px 14px", borderRight: "1px solid var(--line-dim)" }}>
          <div className="t-micro" style={{ color: "var(--dim)" }}>1Y RETURN</div>
          <div className="mono-display" style={{ color: analysis!.weightedReturn1y > 0 ? "var(--bull)" : "var(--bear)" }}>
            {analysis!.weightedReturn1y > 0 ? "+" : ""}{analysis!.weightedReturn1y.toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div className="t-micro" style={{ color: "var(--dim)" }}>5Y RETURN</div>
          <div className="mono-display" style={{ color: analysis!.weightedReturn5y > 0 ? "var(--bull)" : "var(--bear)" }}>
            {analysis!.weightedReturn5y > 0 ? "+" : ""}{analysis!.weightedReturn5y.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Holdings overlap */}
      {analysis!.overlaps.length > 0 && (
        <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "12px 14px" }}>
          <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 8 }}>
            HOLDINGS OVERLAP · DIVERSIFICATION WARNING
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {analysis!.overlaps.slice(0, 6).map(([stock, count]) => (
              <div key={stock} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  height: 6,
                  width: `${Math.min(100, count * 20)}px`,
                  background: count >= 3 ? "var(--bear)" : "var(--caution)",
                }} />
                <span className="mono-body" style={{ color: "var(--ink)" }}>{stock}</span>
                <span className="t-micro" style={{ color: "var(--dim)" }}>in {count} funds</span>
              </div>
            ))}
          </div>
          <div className="t-body" style={{ color: "var(--muted)", marginTop: 8, lineHeight: 1.4 }}>
            Overlap means you are not as diversified as it looks. If PTT appears in 4 of your funds, a PTT crash hurts you 4 times.
          </div>
        </div>
      )}

      {/* Tax benefits */}
      <div className="portfolio-stats" style={{
        background: "var(--bg-raised)", border: "1px solid var(--line)",
        gridTemplateColumns: "repeat(3, 1fr)",
      }}>
        <div style={{ padding: "10px 14px", borderRight: "1px solid var(--line-dim)", textAlign: "center" }}>
          <div className="t-micro" style={{ color: "var(--dim)" }}>RMF</div>
          <div className="mono-display" style={{ color: analysis!.rmfTotal > 0 ? "var(--bull)" : "var(--dim)" }}>
            {analysis!.rmfTotal}
          </div>
          <div className="t-micro" style={{ color: "var(--dim)" }}>funds</div>
        </div>
        <div style={{ padding: "10px 14px", borderRight: "1px solid var(--line-dim)", textAlign: "center" }}>
          <div className="t-micro" style={{ color: "var(--dim)" }}>SSF</div>
          <div className="mono-display" style={{ color: analysis!.ssfTotal > 0 ? "var(--caution)" : "var(--dim)" }}>
            {analysis!.ssfTotal}
          </div>
          <div className="t-micro" style={{ color: "var(--dim)" }}>funds</div>
        </div>
        <div style={{ padding: "10px 14px", textAlign: "center" }}>
          <div className="t-micro" style={{ color: "var(--dim)" }}>THAI ESG</div>
          <div className="mono-display" style={{ color: analysis!.esgTotal > 0 ? "var(--braun-yellow)" : "var(--dim)" }}>
            {analysis!.esgTotal}
          </div>
          <div className="t-micro" style={{ color: "var(--dim)" }}>funds</div>
        </div>
      </div>

      {/* Selected fund list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {funds.map(fund => (
          <div key={fund.code} style={{
            background: "var(--bg-raised)", border: "1px solid var(--line)",
            padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono-body" style={{ fontWeight: 700 }}>{fund.code}</div>
              <div className="t-body" style={{ color: "var(--muted)" }}>{fund.name}</div>
            </div>
            <div className="mono-body" style={{ color: "var(--dim)" }}>
              ฿{fund.nav.toFixed(2)}
            </div>
            <div className="mono-body" style={{ color: fund.expenseRatio < 1.0 ? "var(--bull)" : "var(--caution)" }}>
              {fund.expenseRatio.toFixed(2)}%
            </div>
            <button
              onClick={() => onRemove(fund.code)}
              aria-label={`Remove ${fund.code} from portfolio`}
              style={{
                background: "transparent", border: "1px solid var(--line-dim)",
                color: "var(--dim)", fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
                cursor: "pointer", padding: "4px 8px", minHeight: 28,
              }}
            >
              REMOVE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
