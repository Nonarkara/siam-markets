"use client";

import { useState } from "react";
import { GrahamMetrics } from "@/components/Value/GrahamMetrics";
import { RiskMetricsTable } from "@/components/Market/RiskMetricsTable";
import { SectorHeatmap } from "@/components/Market/SectorHeatmap";
import { AnalysisPanel } from "@/components/AI/AnalysisPanel";
import { MOCK_STOCKS } from "@/lib/api/mock";
import { safetyZone, setValuationContext } from "@/lib/graham";
import { fmtNum, pctColor } from "@/lib/format";
import type { StockFundamentals } from "@/lib/types";

const SET_PE = 15.4;

const TABS = ["VALUE SCANNER", "RISK METRICS", "SECTORS", "AI ANALYSIS"] as const;
type Tab = typeof TABS[number];

export default function ScanPage() {
  const [tab, setTab]         = useState<Tab>("VALUE SCANNER");
  const [grahamOnly, setGO]   = useState(false);
  const [selected, setSelected] = useState<StockFundamentals | null>(null);

  let stocks = MOCK_STOCKS;
  if (grahamOnly) stocks = stocks.filter(s => s.pe <= 15 && s.pb <= 1.5 && s.marginOfSafety > 0);
  const sorted = [...stocks].sort((a, b) => b.marginOfSafety - a.marginOfSafety);

  return (
    <div className="page page-enter" style={{ paddingTop: 16 }}>
      <div className="t-display" style={{ marginBottom: 4 }}>Scan</div>
      <div className="t-body" style={{ color: "var(--muted)", marginBottom: 16 }}>
        {setValuationContext(SET_PE)}
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 14px",
              minHeight: 44,
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--bull)" : "2px solid transparent",
              color: tab === t ? "var(--bull)" : "var(--muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-micro)",
              letterSpacing: "0.08em",
              fontWeight: tab === t ? 700 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "VALUE SCANNER" && (
        <>
          {/* Graham toggle */}
          <div className="card" style={{ marginBottom: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="t-body" style={{ fontWeight: 600 }}>Graham-Approved Only</div>
              <div className="t-micro" style={{ marginTop: 2 }}>P/E ≤15 · P/B ≤1.5 · Positive MOS</div>
            </div>
            <button
              onClick={() => setGO(!grahamOnly)}
              aria-role="switch"
              style={{
                width: 44, height: 26,
                background: grahamOnly ? "var(--bull)" : "var(--line)",
                border: "none", cursor: "pointer",
                position: "relative",
                minHeight: 44,
                minWidth: 44,
              }}
            >
              <div style={{
                position: "absolute",
                top: "50%", left: grahamOnly ? "52%" : "4%",
                transform: "translateY(-50%)",
                width: 18, height: 18,
                background: "var(--ink)",
                transition: "left 180ms var(--ease)",
              }} />
            </button>
          </div>

          {/* Selected stock detail */}
          {selected && (
            <div style={{ marginBottom: 12 }}>
              <GrahamMetrics stock={selected} onClose={() => setSelected(null)} />
            </div>
          )}

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 4, padding: "6px 12px", background: "var(--bg-raised)", border: "1px solid var(--line)", borderBottom: "none" }}>
            {["STOCK", "P/E", "P/B", "ROE%", "MOS%"].map(h => <div key={h} className="t-micro">{h}</div>)}
          </div>

          <div style={{ border: "1px solid var(--line)", marginBottom: 16 }}>
            {sorted.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
                <div className="t-body">No stocks pass all Graham criteria today.</div>
              </div>
            ) : sorted.map((stock, i) => {
              const isSelected = selected?.symbol === stock.symbol;
              const peColor = stock.pe <= 15 ? "var(--bull)" : stock.pe <= 20 ? "var(--caution)" : "var(--bear)";
              const pbColor = stock.pb <= 1.5 ? "var(--bull)" : stock.pb <= 2.5 ? "var(--caution)" : "var(--bear)";
              return (
                <button
                  key={stock.symbol}
                  onClick={() => setSelected(isSelected ? null : stock)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    gap: 4,
                    padding: "9px 12px",
                    width: "100%",
                    background: isSelected ? "var(--bg-hover)" : stock.marginOfSafety >= 30 ? "var(--bull-10)" : "transparent",
                    border: "none",
                    borderBottom: i < sorted.length - 1 ? "1px solid var(--line)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: 44,
                  }}
                >
                  <div>
                    <div className="t-mono" style={{ fontWeight: 600, fontSize: "0.875rem" }}>{stock.symbol.replace(".BK", "")}</div>
                    <div className="t-micro">{stock.sector}</div>
                  </div>
                  <div className="t-mono" style={{ color: peColor, fontSize: "0.875rem", alignSelf: "center" }}>{fmtNum(stock.pe, 1)}</div>
                  <div className="t-mono" style={{ color: pbColor, fontSize: "0.875rem", alignSelf: "center" }}>{fmtNum(stock.pb, 2)}</div>
                  <div className="t-mono" style={{ color: stock.roe >= 15 ? "var(--bull)" : "var(--caution)", fontSize: "0.875rem", alignSelf: "center" }}>{fmtNum(stock.roe, 1)}</div>
                  <div className="t-mono" style={{ color: pctColor(stock.marginOfSafety), fontSize: "0.875rem", fontWeight: 700, alignSelf: "center" }}>
                    {stock.marginOfSafety > 0 ? "+" : ""}{fmtNum(stock.marginOfSafety, 0)}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="t-micro" style={{ textAlign: "center" }}>{sorted.length} stocks · Tap any row for full analysis</div>
        </>
      )}

      {tab === "RISK METRICS" && <RiskMetricsTable stocks={MOCK_STOCKS} topN={15} />}
      {tab === "SECTORS" && <SectorHeatmap stocks={MOCK_STOCKS} />}
      {tab === "AI ANALYSIS" && (
        <div style={{ height: "calc(100dvh - 240px)", minHeight: 400 }}>
          <AnalysisPanel />
        </div>
      )}
    </div>
  );
}
