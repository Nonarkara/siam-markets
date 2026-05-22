"use client";

import { useEffect, useState, useMemo } from "react";
import { LightweightChart } from "@/components/Charts/LightweightChart";
import { GrahamOverlayChart } from "@/components/Charts/GrahamOverlayChart";
import { CompanyTimeline } from "./CompanyTimeline";
import { generateOHLC, generateFundamentalHistory } from "@/lib/api/mock-history";
import type { StockFundamentals } from "@/lib/types";
import { fmtPct, pctColor } from "@/lib/format";

interface Props {
  stock: StockFundamentals | null;
  onClose: () => void;
}

function aiReasoning(stock: StockFundamentals): string {
  const points: string[] = [];
  if (stock.marginOfSafety > 30) points.push(`Price is ${stock.marginOfSafety.toFixed(0)}% below Graham Number — deep value territory.`);
  else if (stock.marginOfSafety > 0) points.push(`Price is ${stock.marginOfSafety.toFixed(0)}% below Graham Number — modest discount.`);
  else points.push(`Price is at or above Graham Number — no margin of safety.`);

  if (stock.pe <= 15) points.push(`P/E of ${stock.pe.toFixed(1)} is below Graham's 15× threshold.`);
  if (stock.pb <= 1.5) points.push(`P/B of ${stock.pb.toFixed(2)} is below Graham's 1.5× threshold.`);
  if (stock.roe > 15) points.push(`ROE of ${stock.roe.toFixed(1)}% signals strong capital efficiency.`);
  if (stock.debtToEquity < 0.5) points.push(`Low debt/equity (${stock.debtToEquity.toFixed(2)}) reduces bankruptcy risk.`);
  if (stock.dividendYield > 3) points.push(`Dividend yield of ${stock.dividendYield.toFixed(1)}% provides income while waiting for appreciation.`);
  if (stock.moat !== "none") points.push(`${stock.moat} moat detected — competitive advantage may sustain returns.`);

  return points.join(" ");
}

function buffettVerdict(stock: StockFundamentals): { label: string; color: string } {
  let score = 0;
  if (stock.roe > 15) score += 2;
  if (stock.debtToEquity < 0.5) score += 2;
  if (stock.grossMargin > 30) score += 1;
  if (stock.pe < 20) score += 1;
  if (stock.marginOfSafety > 20) score += 2;
  if (stock.moat !== "none") score += 2;

  if (score >= 7) return { label: "STRONG BUY — Buffett would look twice", color: "var(--bull)" };
  if (score >= 5) return { label: "BUY — Meets most quality criteria", color: "var(--bull)" };
  if (score >= 3) return { label: "HOLD — Some positives, some concerns", color: "var(--caution)" };
  return { label: "PASS — Does not meet quality threshold", color: "var(--bear)" };
}

export function StockDetailModal({ stock, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const ohlc = useMemo(() => stock ? generateOHLC(stock.symbol, 90, stock.price) : [], [stock]);
  const fundHistory = useMemo(() => stock ? generateFundamentalHistory(stock.symbol, 3, stock.price, stock.eps, stock.bvps) : [], [stock]);
  const grahamData = useMemo(() => fundHistory.map(d => ({ time: d.time, price: d.price, grahamNumber: d.grahamNumber })), [fundHistory]);

  if (!stock) return null;
  const verdict = buffettVerdict(stock);
  const reasoning = aiReasoning(stock);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${stock.symbol.replace(".BK", "")} stock detail`}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        opacity: mounted ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
      onClick={onClose}
    >
      <div style={{
        width: "100%", maxWidth: 900, maxHeight: "90vh",
        background: "var(--bg-raised)",
        border: "1px solid var(--line)",
        display: "flex", flexDirection: "column",
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "transform 200ms ease",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--line)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span className="mono-display" style={{ color: "var(--ink)" }}>
              {stock.symbol.replace(".BK", "")}
            </span>
            <span className="t-body" style={{ color: "var(--muted)" }}>
              {stock.name}
            </span>
            <span className="t-micro chip-tag" style={{ color: "var(--tech)", borderColor: "var(--tech)" }}>
              {stock.sector.toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="mono-body" style={{ fontWeight: 700, color: "var(--ink)" }}>
              ฿{stock.price.toFixed(2)}
            </span>
            <span className="mono-body" style={{ fontWeight: 700, color: pctColor(stock.marginOfSafety) }}>
              MOS {stock.marginOfSafety > 0 ? "+" : ""}{stock.marginOfSafety.toFixed(0)}%
            </span>
            <button
              onClick={onClose}
              aria-label="Close stock detail"
              style={{
                background: "transparent", border: "1px solid var(--line)", color: "var(--muted)",
                fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", cursor: "pointer",
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

          {/* Verdict banner */}
          <div style={{
            padding: "8px 16px",
            background: `color-mix(in srgb, ${verdict.color} 8%, transparent)`,
            borderBottom: `1px solid ${verdict.color}`,
          }}>
            <span className="t-micro" style={{ color: verdict.color, fontWeight: 700 }}>{verdict.label}</span>
          </div>

          {/* AI Reasoning */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 6 }}>WHY THIS STOCK</div>
            <div className="t-body" style={{ lineHeight: 1.6, color: "var(--ink)" }}>
              {reasoning}
            </div>
          </div>

          {/* Metrics grid */}
          <div className="metric-grid" style={{ borderBottom: "1px solid var(--line-dim)" }}>
            {[
              { label: "P/E", value: stock.pe.toFixed(1), good: stock.pe <= 15 },
              { label: "P/B", value: stock.pb.toFixed(2), good: stock.pb <= 1.5 },
              { label: "ROE", value: `${stock.roe.toFixed(1)}%`, good: stock.roe > 15 },
              { label: "DEBT/EQ", value: stock.debtToEquity.toFixed(2), good: stock.debtToEquity < 0.5 },
              { label: "DIV YIELD", value: `${stock.dividendYield.toFixed(1)}%`, good: stock.dividendYield > 3 },
              { label: "EPS", value: stock.eps.toFixed(2), good: true },
              { label: "BVPS", value: stock.bvps.toFixed(2), good: true },
              { label: "MARKET CAP", value: `${(stock.marketCap / 1e9).toFixed(1)}B`, good: true },
            ].map((m) => (
              <div key={m.label} style={{
                padding: "8px 12px",
                borderTop: "1px solid var(--line-dim)",
                borderLeft: "1px solid var(--line-dim)",
              }}>
                <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 2 }}>{m.label}</div>
                <div className="mono-body" style={{
                  fontWeight: 700,
                  color: m.good ? "var(--bull)" : "var(--ink)",
                }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Candlestick chart */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 6 }}>90-DAY PRICE ACTION</div>
            <LightweightChart data={ohlc} height={220} />
          </div>

          {/* Graham overlay chart */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 6 }}>
              PRICE VS GRAHAM NUMBER · 3 YEARS
            </div>
            <GrahamOverlayChart data={grahamData} height={200} />
            <div className="t-micro" style={{ color: "var(--dim)", marginTop: 4 }}>
              Solid line = market price · Dashed line = Graham intrinsic value
            </div>
          </div>

          {/* Company timeline */}
          <div style={{ padding: "12px 16px" }}>
            <CompanyTimeline symbol={stock.symbol} name={stock.name} sector={stock.sector} />
          </div>
        </div>
      </div>
    </div>
  );
}
