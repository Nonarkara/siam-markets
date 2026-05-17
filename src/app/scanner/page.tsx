"use client";

import { useState } from "react";
import { GrahamMetrics } from "@/components/Value/GrahamMetrics";
import { MOCK_STOCKS } from "@/lib/api/mock";
import { safetyZone, setValuationContext } from "@/lib/graham";
import { fmtNum, pctColor } from "@/lib/format";
import type { StockFundamentals } from "@/lib/types";

const SET_PE = 15.4;

export default function ScannerPage() {
  const [grahamOnly, setGrahamOnly] = useState(false);
  const [selected, setSelected]     = useState<StockFundamentals | null>(null);

  let stocks = MOCK_STOCKS;
  if (grahamOnly) {
    stocks = stocks.filter((s) => s.pe <= 15 && s.pb <= 1.5 && s.marginOfSafety > 0);
  }
  // Sort by MOS descending
  stocks = [...stocks].sort((a, b) => b.marginOfSafety - a.marginOfSafety);

  function rowColor(s: StockFundamentals): string {
    const zone = safetyZone(s.marginOfSafety);
    if (zone === "strong" || zone === "moderate") return "var(--bull-10)";
    if (s.pe > 25 || s.pb > 3) return "var(--bear-10)";
    return "transparent";
  }

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Value Scanner</h1>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          {setValuationContext(SET_PE)}
        </p>
      </div>

      {/* Graham filter toggle */}
      <div
        className="card"
        style={{ marginBottom: "var(--gap)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <div className="t-body" style={{ fontWeight: 600 }}>Graham-Approved Only</div>
          <div className="t-micro" style={{ marginTop: 2 }}>P/E ≤15 · P/B ≤1.5 · Positive margin of safety</div>
        </div>
        <button
          onClick={() => setGrahamOnly(!grahamOnly)}
          style={{
            width: 48, height: 28,
            background: grahamOnly ? "var(--bull)" : "var(--line)",
            border: "none", cursor: "pointer",
            position: "relative", transition: "background 200ms var(--ease)",
            minHeight: 44,
          }}
          aria-label="Toggle Graham-only filter"
          role="switch"
          aria-checked={grahamOnly}
        >
          <div style={{
            position: "absolute",
            top: "50%",
            left: grahamOnly ? "54%" : "6%",
            transform: "translateY(-50%)",
            width: 20, height: 20,
            background: "var(--ink)",
            transition: "left 200ms var(--ease)",
          }} />
        </button>
      </div>

      {/* Stock detail panel */}
      {selected && (
        <div style={{ marginBottom: "var(--gap)" }}>
          <GrahamMetrics stock={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
          gap: 4,
          padding: "8px 12px",
          background: "var(--bg-raised)",
          border: "1px solid var(--line)",
          borderBottom: "none",
        }}
      >
        {["STOCK", "P/E", "P/B", "ROE%", "MOS%"].map((h) => (
          <div key={h} className="t-micro">{h}</div>
        ))}
      </div>

      {/* Stock rows */}
      <div style={{ border: "1px solid var(--line)", overflow: "hidden" }}>
        {stocks.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
            <div className="t-body">No stocks pass all Graham criteria today.</div>
            <div className="t-micro" style={{ marginTop: 6 }}>
              This is normal — Graham&apos;s standards are deliberately strict.
            </div>
          </div>
        ) : (
          stocks.map((stock, i) => {
            const isSelected = selected?.symbol === stock.symbol;
            const peColor = stock.pe <= 15 ? "var(--bull)" : stock.pe <= 20 ? "var(--caution)" : "var(--bear)";
            const pbColor = stock.pb <= 1.5 ? "var(--bull)" : stock.pb <= 2.5 ? "var(--caution)" : "var(--bear)";
            const mosColor = pctColor(stock.marginOfSafety);

            return (
              <button
                key={stock.symbol}
                onClick={() => setSelected(isSelected ? null : stock)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  gap: 4,
                  padding: "10px 12px",
                  width: "100%",
                  background: isSelected ? "var(--bg-hover)" : rowColor(stock),
                  border: "none",
                  borderBottom: i < stocks.length - 1 ? "1px solid var(--line)" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  minHeight: 44,
                  transition: "background 150ms var(--ease)",
                }}
              >
                <div>
                  <div className="t-mono" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {stock.symbol.replace(".BK", "")}
                  </div>
                  <div className="t-micro" style={{ marginTop: 1 }}>{stock.sector}</div>
                </div>
                <div className="t-mono" style={{ color: peColor, fontSize: "0.875rem", alignSelf: "center" }}>
                  {fmtNum(stock.pe, 1)}
                </div>
                <div className="t-mono" style={{ color: pbColor, fontSize: "0.875rem", alignSelf: "center" }}>
                  {fmtNum(stock.pb, 2)}
                </div>
                <div className="t-mono" style={{ color: stock.roe >= 15 ? "var(--bull)" : "var(--caution)", fontSize: "0.875rem", alignSelf: "center" }}>
                  {fmtNum(stock.roe, 1)}
                </div>
                <div className="t-mono" style={{ color: mosColor, fontSize: "0.875rem", alignSelf: "center" }}>
                  {stock.marginOfSafety > 0 ? "+" : ""}{fmtNum(stock.marginOfSafety, 0)}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="t-micro" style={{ textAlign: "center", marginTop: 12 }}>
        Tap any row to see full Graham/Buffett analysis · {stocks.length} stocks shown
      </div>
    </div>
  );
}
