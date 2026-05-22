"use client";

import { useState } from "react";
import { StockDetailModal } from "./StockDetailModal";
import type { StockFundamentals } from "@/lib/types";

interface Props {
  stocks: StockFundamentals[];
}

export function StockScannerTable({ stocks }: Props) {
  const [selected, setSelected] = useState<StockFundamentals | null>(null);

  return (
    <>
      <div style={{ borderBottom: "1px solid var(--line-dim)" }}>
        <div className="scanner-row t-micro" style={{
          padding: "3px 10px", background: "var(--bg)", borderBottom: "1px solid var(--line-dim)",
        }}>
          <span>STOCK</span>
          <span className="hide-mobile">P/E</span>
          <span className="hide-mobile">P/B</span>
          <span>MOS</span>
          <span className="hide-mobile">YLD</span>
        </div>
        {stocks.slice(0, 12).map((stock, i) => (
          <button
            key={stock.symbol}
            type="button"
            onClick={() => setSelected(stock)}
            aria-label={`View detail for ${stock.symbol.replace(".BK", "")}`}
            className="scanner-row"
            style={{
              padding: "3px 10px",
              borderBottom: i < 11 ? "1px solid var(--line-dim)" : "none",
              minHeight: 28,
              background: stock.marginOfSafety >= 30 ? "var(--bull-10)" : "transparent",
              cursor: "pointer",
              textAlign: "left",
              border: "none",
              borderRadius: 0,
              color: "inherit",
              font: "inherit",
              width: "100%",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = stock.marginOfSafety >= 30 ? "var(--bull-10)" : "transparent"; }}
          >
            <span className="mono-body" style={{ fontWeight: 700 }}>{stock.symbol.replace(".BK", "")}</span>
            <span className="mono-body hide-mobile" style={{ color: stock.pe <= 15 ? "var(--bull)" : stock.pe <= 20 ? "var(--caution)" : "var(--bear)" }}>{stock.pe.toFixed(1)}</span>
            <span className="mono-body hide-mobile" style={{ color: stock.pb <= 1.5 ? "var(--bull)" : "var(--muted)" }}>{stock.pb.toFixed(2)}</span>
            <span className="mono-body" style={{ fontWeight: 700, color: stock.marginOfSafety >= 30 ? "var(--bull)" : stock.marginOfSafety >= 0 ? "var(--caution)" : "var(--bear)" }}>
              {stock.marginOfSafety > 0 ? "+" : ""}{stock.marginOfSafety.toFixed(0)}%
            </span>
            <span className="mono-body hide-mobile" style={{ color: stock.dividendYield > 3 ? "var(--bull)" : "var(--dim)" }}>
              {stock.dividendYield.toFixed(1)}%
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <StockDetailModal stock={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
