"use client";

import { useState, useMemo } from "react";
import { MOCK_FUNDS, type MutualFund } from "@/lib/api/mock-funds";
import { FundDetailModal } from "./FundDetailModal";

const CATEGORIES = ["ALL", "EQUITY", "FIXED_INCOME", "MIXED", "RMF", "SSF", "THAI_ESG", "GLOBAL"] as const;
const AMCS = ["ALL", ...Array.from(new Set(MOCK_FUNDS.map(f => f.amc)))];

interface Props {
  onSelect: (fund: MutualFund) => void;
  selectedCodes: string[];
}

export function FundSearch({ onSelect, selectedCodes }: Props) {
  const [detail, setDetail] = useState<MutualFund | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [amc, setAmc] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return MOCK_FUNDS.filter(f => {
      const q = query.toLowerCase();
      const matchesQuery = !q || f.code.toLowerCase().includes(q) || f.name.toLowerCase().includes(q) || f.amc.toLowerCase().includes(q);
      const matchesCat = category === "ALL" || f.category === category;
      const matchesAmc = amc === "ALL" || f.amc === amc;
      return matchesQuery && matchesCat && matchesAmc;
    });
  }, [query, category, amc]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Search + filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          aria-label="Search funds"
          placeholder="Search funds..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1, minWidth: 200,
            background: "var(--bg)", border: "1px solid var(--line)",
            color: "var(--ink)", fontFamily: "var(--font-body)", fontSize: "var(--text-body)",
            padding: "8px 12px", outline: "none", minHeight: 44,
          }}
        />
        <select
          aria-label="Filter by category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            background: "var(--bg)", border: "1px solid var(--line)",
            color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
            padding: "8px", outline: "none", minHeight: 44,
          }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          aria-label="Filter by AMC"
          value={amc}
          onChange={e => setAmc(e.target.value)}
          style={{
            background: "var(--bg)", border: "1px solid var(--line)",
            color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
            padding: "8px", outline: "none", minHeight: 44,
          }}
        >
          {AMCS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="t-micro" style={{ color: "var(--dim)" }}>{filtered.length} FUNDS</div>

      {/* Results */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.map(fund => {
          const isSelected = selectedCodes.includes(fund.code);
          return (
            <div
              key={fund.code}
              className="fund-row"
              style={{
                background: isSelected ? "var(--bull-10)" : "var(--bg-raised)",
                border: `1px solid ${isSelected ? "var(--bull)" : "var(--line)"}`,
                padding: "10px 14px",
              }}
            >
              <button
                type="button"
                onClick={() => setDetail(fund)}
                aria-label={`View ${fund.code} chart and details`}
                className="fund-row__info"
                style={{
                  background: "transparent", border: "none", padding: 0,
                  cursor: "pointer", textAlign: "left", color: "inherit", font: "inherit",
                  minWidth: 0,
                }}
              >
                <div className="t-mono" style={{ fontWeight: 700, color: "var(--ink)", textDecoration: "underline", textDecorationColor: "var(--line)", textUnderlineOffset: 3 }}>
                  {fund.code}
                </div>
                <div className="t-body" style={{ color: "var(--muted)" }}>{fund.name}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                  <span className="t-micro" style={{ color: "var(--dim)" }}>{fund.amc}</span>
                  <span className="t-micro chip-tag" style={{ color: "var(--tech)", borderColor: "var(--tech)" }}>
                    {fund.category}
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
                </div>
              </button>
              <div className="fund-row__metric">
                <div className="t-micro" style={{ color: "var(--dim)" }}>NAV</div>
                <div className="t-mono" style={{ fontWeight: 700 }}>฿{fund.nav.toFixed(2)}</div>
              </div>
              <div className="fund-row__metric">
                <div className="t-micro" style={{ color: "var(--dim)" }}>EXPENSE</div>
                <div className="t-mono" style={{ color: fund.expenseRatio < 0.7 ? "var(--bull)" : fund.expenseRatio < 1.2 ? "var(--caution)" : "var(--bear)" }}>
                  {fund.expenseRatio.toFixed(2)}%
                </div>
              </div>
              <div className="fund-row__metric">
                <div className="t-micro" style={{ color: "var(--dim)" }}>1Y</div>
                <div className="t-mono" style={{ color: fund.return1y > 0 ? "var(--bull)" : "var(--bear)" }}>
                  {fund.return1y > 0 ? "+" : ""}{fund.return1y.toFixed(1)}%
                </div>
              </div>
              <div className="fund-row__metric">
                <div className="t-micro" style={{ color: "var(--dim)" }}>5Y</div>
                <div className="t-mono" style={{ color: fund.return5y > 0 ? "var(--bull)" : "var(--bear)" }}>
                  {fund.return5y > 0 ? "+" : ""}{fund.return5y.toFixed(1)}%
                </div>
              </div>
              <div className="fund-row__check">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`${isSelected ? "Remove" : "Add"} ${fund.code} ${isSelected ? "from" : "to"} portfolio`}
                  onClick={() => onSelect(fund)}
                  style={{
                    width: 32, height: 32,
                    border: `1px solid ${isSelected ? "var(--bull)" : "var(--line-dim)"}`,
                    background: isSelected ? "var(--bull)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {isSelected ? <span className="t-micro" style={{ color: "var(--bg)" }}>✓</span> : <span className="t-micro" style={{ color: "var(--muted)" }}>+</span>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <FundDetailModal
        fund={detail}
        isSelected={detail ? selectedCodes.includes(detail.code) : false}
        onToggle={(f) => { onSelect(f); }}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
