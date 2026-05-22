"use client";

import { useState } from "react";
import { GrahamMetrics } from "@/components/Value/GrahamMetrics";
import { RiskMetricsTable } from "@/components/Market/RiskMetricsTable";
import { SectorHeatmap } from "@/components/Market/SectorHeatmap";
import { AnalysisPanel } from "@/components/AI/AnalysisPanel";
import { StockCompareTool } from "@/components/Charts/StockCompareTool";
import { MOCK_STOCKS } from "@/lib/api/mock";
import { safetyZone, setValuationContext } from "@/lib/graham";
import { fmtNum, pctColor } from "@/lib/format";
import type { StockFundamentals } from "@/lib/types";

const SET_PE = 15.4;

const TABS = ["VALUE SCANNER", "CHARTS", "RISK METRICS", "SECTORS", "AI ANALYSIS"] as const;
type Tab = typeof TABS[number];

const SECTORS = ["All", "Energy", "Financials", "Technology", "Consumer", "Healthcare", "Industrials", "Real Estate", "Materials", "Utilities"];
const MARKETS = ["Thailand SET50", "Global Top 100"];

// Mock global stocks for demonstration
const MOCK_GLOBAL_STOCKS: StockFundamentals[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", price: 185.50, eps: 6.13, bvps: 4.50, pe: 30.2, pb: 41.2, roe: 160.0, roe10: 45.0, dividendYield: 0.5, debtToEquity: 2.1, grossMargin: 45.0, fcf: 99000, netIncome: 97000, marketCap: 2800000000000, grahamNumber: 16.6, marginOfSafety: -1018.0, defensiveScore: 2, buffettScore: 8, moat: "wide", updatedAt: new Date().toISOString() },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", price: 420.30, eps: 11.80, bvps: 32.00, pe: 35.6, pb: 13.1, roe: 43.0, roe10: 38.0, dividendYield: 0.7, debtToEquity: 0.5, grossMargin: 69.0, fcf: 65000, netIncome: 72000, marketCap: 3100000000000, grahamNumber: 91.9, marginOfSafety: -357.0, defensiveScore: 3, buffettScore: 10, moat: "wide", updatedAt: new Date().toISOString() },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", price: 890.10, eps: 12.10, bvps: 22.50, pe: 73.5, pb: 39.5, roe: 65.0, roe10: 35.0, dividendYield: 0.03, debtToEquity: 0.3, grossMargin: 74.0, fcf: 27000, netIncome: 29800, marketCap: 2200000000000, grahamNumber: 78.2, marginOfSafety: -1038.0, defensiveScore: 1, buffettScore: 6, moat: "wide", updatedAt: new Date().toISOString() },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", price: 195.40, eps: 18.20, bvps: 110.00, pe: 10.7, pb: 1.8, roe: 16.5, roe10: 13.0, dividendYield: 2.3, debtToEquity: 1.8, grossMargin: 85.0, fcf: 0, netIncome: 49500, marketCap: 560000000000, grahamNumber: 212.3, marginOfSafety: 7.9, defensiveScore: 5, buffettScore: 6, moat: "narrow", updatedAt: new Date().toISOString() },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", price: 158.20, eps: 9.50, bvps: 52.00, pe: 16.6, pb: 3.0, roe: 18.0, roe10: 19.0, dividendYield: 3.0, debtToEquity: 0.6, grossMargin: 67.0, fcf: 23000, netIncome: 16700, marketCap: 380000000000, grahamNumber: 105.4, marginOfSafety: -50.1, defensiveScore: 5, buffettScore: 8, moat: "wide", updatedAt: new Date().toISOString() },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", price: 115.80, eps: 9.20, bvps: 48.00, pe: 12.6, pb: 2.4, roe: 19.0, roe10: 12.0, dividendYield: 3.2, debtToEquity: 0.2, grossMargin: 35.0, fcf: 36000, netIncome: 36000, marketCap: 460000000000, grahamNumber: 99.7, marginOfSafety: -16.1, defensiveScore: 5, buffettScore: 6, moat: "narrow", updatedAt: new Date().toISOString() },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer", price: 162.30, eps: 6.20, bvps: 22.00, pe: 26.1, pb: 7.4, roe: 32.0, roe10: 18.0, dividendYield: 2.4, debtToEquity: 0.7, grossMargin: 48.0, fcf: 18000, netIncome: 14800, marketCap: 380000000000, grahamNumber: 55.5, marginOfSafety: -192.0, defensiveScore: 3, buffettScore: 8, moat: "wide", updatedAt: new Date().toISOString() },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", price: 280.50, eps: 9.30, bvps: 20.00, pe: 30.1, pb: 14.0, roe: 46.0, roe10: 35.0, dividendYield: 0.7, debtToEquity: 0.6, grossMargin: 97.0, fcf: 19000, netIncome: 19000, marketCap: 590000000000, grahamNumber: 64.6, marginOfSafety: -334.0, defensiveScore: 2, buffettScore: 10, moat: "wide", updatedAt: new Date().toISOString() },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer", price: 165.40, eps: 5.70, bvps: 28.00, pe: 29.0, pb: 5.9, roe: 21.0, roe10: 16.0, dividendYield: 1.4, debtToEquity: 0.8, grossMargin: 25.0, fcf: 12000, netIncome: 15500, marketCap: 440000000000, grahamNumber: 59.9, marginOfSafety: -176.0, defensiveScore: 3, buffettScore: 6, moat: "wide", updatedAt: new Date().toISOString() },
  { symbol: "KO", name: "Coca-Cola", sector: "Consumer", price: 62.50, eps: 2.50, bvps: 19.00, pe: 25.0, pb: 3.3, roe: 40.0, roe10: 28.0, dividendYield: 3.1, debtToEquity: 1.8, grossMargin: 60.0, fcf: 9700, netIncome: 10700, marketCap: 270000000000, grahamNumber: 32.7, marginOfSafety: -91.0, defensiveScore: 3, buffettScore: 8, moat: "wide", updatedAt: new Date().toISOString() },
];

export default function ScanPage() {
  const [tab, setTab]         = useState<Tab>("VALUE SCANNER");
  const [grahamOnly, setGO]   = useState(false);
  const [selected, setSelected] = useState<StockFundamentals | null>(null);
  const [sector, setSector]   = useState("All");
  const [market, setMarket]   = useState("Thailand SET50");

  const baseStocks = market === "Thailand SET50" ? MOCK_STOCKS : MOCK_GLOBAL_STOCKS;
  let stocks = baseStocks;
  if (grahamOnly) stocks = stocks.filter(s => s.pe <= 15 && s.pb <= 1.5 && s.marginOfSafety > 0);
  if (sector !== "All") stocks = stocks.filter(s => s.sector === sector);
  const sorted = [...stocks].sort((a, b) => b.marginOfSafety - a.marginOfSafety);

  return (
    <div className="page page-enter" style={{ paddingTop: 16 }}>
      <div className="t-display" style={{ marginBottom: 4 }}>Scan</div>
      <div className="t-body" style={{ color: "var(--muted)", marginBottom: 16 }}>
        {setValuationContext(SET_PE)}
      </div>

      {/* Market + Sector filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select
          value={market}
          onChange={(e) => { setMarket(e.target.value); setSector("All"); }}
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            padding: "8px 12px",
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            minHeight: 40,
          }}
        >
          {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            padding: "8px 12px",
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            minHeight: 40,
          }}
        >
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div className="t-micro" style={{ alignSelf: "center", color: "var(--muted)" }}>
          {sorted.length} stocks
        </div>
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
          <div className="t-micro" style={{ textAlign: "center", color: "var(--muted)" }}>Tap any row for full analysis</div>
        </>
      )}

      {tab === "CHARTS" && <StockCompareTool />}
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
