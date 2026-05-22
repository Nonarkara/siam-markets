"use client";

import { useEffect, useMemo } from "react";
import { NavLineChart } from "@/components/Charts/NavLineChart";
import { getFundHistory, statsForHistory } from "@/lib/api/mock-fund-history";
import type { MutualFund } from "@/lib/api/mock-funds";

interface Props {
  fund: MutualFund | null;
  isSelected: boolean;
  onToggle: (fund: MutualFund) => void;
  onClose: () => void;
}

function fmtPct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtMonth(iso: string): string {
  if (!iso) return "—";
  const [y, m] = iso.split("-");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
}

export function FundDetailModal({ fund, isSelected, onToggle, onClose }: Props) {
  useEffect(() => {
    if (!fund) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [fund, onClose]);

  const history = useMemo(() => fund ? getFundHistory(fund.code) : [], [fund]);
  const stats   = useMemo(() => statsForHistory(history), [history]);

  if (!fund) return null;

  const series = [{
    label: fund.code,
    color: "var(--tech)",
    data: history.map(p => ({ time: p.time, value: p.nav })),
  }];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${fund.code} fund detail`}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 880, maxHeight: "90vh",
          background: "var(--bg-raised)",
          border: "1px solid var(--line)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid var(--line)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
            <span className="t-mono-display" style={{ color: "var(--ink)" }}>
              {fund.code}
            </span>
            <span className="t-body" style={{ color: "var(--muted)" }}>{fund.name}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close fund detail"
            style={{
              background: "transparent", border: "1px solid var(--line)", color: "var(--muted)",
              fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", cursor: "pointer",
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {/* Chip row */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-dim)", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="t-micro chip-tag" style={{ color: "var(--tech)", borderColor: "var(--tech)" }}>
              {fund.category}
            </span>
            <span className="t-micro chip-tag" style={{ color: "var(--muted)", borderColor: "var(--line)" }}>
              {fund.amc}
            </span>
            {fund.taxBenefit.rmf && (
              <span className="t-micro chip-tag" style={{ color: "var(--bull)", borderColor: "var(--bull)" }}>RMF</span>
            )}
            {fund.taxBenefit.ssf && (
              <span className="t-micro chip-tag" style={{ color: "var(--caution)", borderColor: "var(--caution)" }}>SSF</span>
            )}
            {fund.taxBenefit.thaiEsg && (
              <span className="t-micro chip-tag" style={{ color: "var(--braun-yellow)", borderColor: "var(--braun-yellow)" }}>ESG</span>
            )}
            <span className="t-micro chip-tag" style={{ color: "var(--dim)", borderColor: "var(--line)" }}>
              RISK {fund.riskLevel}/8
            </span>
          </div>

          {/* Headline stats grid */}
          <div className="metric-grid" style={{ borderBottom: "1px solid var(--line-dim)" }}>
            <StatCell label="NAV"           value={`฿${fund.nav.toFixed(2)}`} accent="var(--ink)" />
            <StatCell label="EXPENSE"       value={`${fund.expenseRatio.toFixed(2)}%`} accent={fund.expenseRatio < 1 ? "var(--bull)" : "var(--caution)"} />
            <StatCell label="1Y RETURN"     value={fmtPct(fund.return1y)} accent={fund.return1y > 0 ? "var(--bull)" : "var(--bear)"} />
            <StatCell label="3Y ANNUAL"     value={fmtPct(fund.return3y)} accent={fund.return3y > 0 ? "var(--bull)" : "var(--bear)"} />
          </div>

          {/* Chart */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 6 }}>
              NAV · LAST {history.length} MONTHS
            </div>
            <NavLineChart series={series} height={240} />
            <div className="t-micro" style={{ color: "var(--dim)", marginTop: 4 }}>
              Solid line = monthly net asset value · Dips show where the fund lost ground · Climbs show recovery and growth
            </div>
          </div>

          {/* Performance stats */}
          <div className="metric-grid" style={{ borderBottom: "1px solid var(--line-dim)" }}>
            <StatCell
              label="3Y TOTAL RETURN"
              value={fmtPct(stats.totalReturn)}
              accent={stats.totalReturn > 0 ? "var(--bull)" : "var(--bear)"}
            />
            <StatCell
              label="MAX DRAWDOWN"
              value={`−${stats.maxDrawdown.toFixed(1)}%`}
              accent="var(--bear)"
            />
            <StatCell
              label="BEST MONTH"
              value={fmtPct(stats.bestMonth.pct)}
              sub={fmtMonth(stats.bestMonth.time)}
              accent="var(--bull)"
            />
            <StatCell
              label="WORST MONTH"
              value={fmtPct(stats.worstMonth.pct)}
              sub={fmtMonth(stats.worstMonth.time)}
              accent="var(--bear)"
            />
          </div>

          {/* Top holdings */}
          {fund.topHoldings.length > 0 && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-dim)" }}>
              <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 8 }}>
                TOP HOLDINGS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {fund.topHoldings.slice(0, 8).map(h => (
                  <div key={h.stock} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      height: 4,
                      width: `${Math.min(100, h.weight * 4)}px`,
                      background: "var(--tech)",
                    }} />
                    <span className="t-mono" style={{ color: "var(--ink)" }}>{h.stock}</span>
                    <span className="t-micro" style={{ color: "var(--dim)" }}>{h.weight.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer / action */}
          <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div className="t-micro" style={{ color: "var(--dim)" }}>
              AUM ฿{(fund.aum).toLocaleString()}M · MIN ฿{fund.minInvestment.toLocaleString()} · {fund.dividendPolicy}
            </div>
            <button
              type="button"
              onClick={() => onToggle(fund)}
              style={{
                background: isSelected ? "transparent" : "var(--bull-10)",
                border: `1px solid ${isSelected ? "var(--line)" : "var(--bull)"}`,
                color: isSelected ? "var(--muted)" : "var(--bull)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro)",
                letterSpacing: "0.08em",
                padding: "8px 14px",
                minHeight: 36,
                cursor: "pointer",
              }}
            >
              {isSelected ? "REMOVE FROM PORTFOLIO" : "+ ADD TO PORTFOLIO"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{
      padding: "10px 12px",
      borderTop: "1px solid var(--line-dim)",
      borderLeft: "1px solid var(--line-dim)",
    }}>
      <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 2 }}>{label}</div>
      <div className="t-mono" style={{ fontWeight: 700, color: accent }}>{value}</div>
      {sub && <div className="t-micro" style={{ color: "var(--dim)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}
