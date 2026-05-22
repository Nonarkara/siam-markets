"use client";

import { useState, useMemo } from "react";
import { GrahamOverlayChart } from "@/components/Charts/GrahamOverlayChart";
import { generateFundamentalHistory } from "@/lib/api/mock-history";
import { MOCK_STOCKS, MOCK_GLOBAL_STOCKS } from "@/lib/api/mock";
import type { StockFundamentals } from "@/lib/types";

const SECTORS = ["all", "Energy", "Financials", "Technology", "Consumer", "Healthcare", "Industrials", "Materials", "Real Estate", "Communication", "Utilities"];

function aiReasoning(stock: StockFundamentals): string {
  const pts: string[] = [];
  if (stock.marginOfSafety > 30) pts.push(`${stock.marginOfSafety.toFixed(0)}% below Graham value.`);
  else if (stock.marginOfSafety > 0) pts.push(`${stock.marginOfSafety.toFixed(0)}% discount to value.`);
  if (stock.pe <= 15) pts.push(`P/E ${stock.pe.toFixed(1)} ≤ 15.`);
  if (stock.pb <= 1.5) pts.push(`P/B ${stock.pb.toFixed(2)} ≤ 1.5.`);
  if (stock.roe > 15) pts.push(`ROE ${stock.roe.toFixed(1)}% strong.`);
  if (stock.dividendYield > 3) pts.push(`${stock.dividendYield.toFixed(1)}% dividend.`);
  return pts.join(" ") || "No clear value signal.";
}

function buffettLabel(stock: StockFundamentals): { text: string; color: string } {
  let s = 0;
  if (stock.roe > 15) s += 2;
  if (stock.debtToEquity < 0.5) s += 2;
  if (stock.pe < 20) s += 1;
  if (stock.marginOfSafety > 20) s += 2;
  if (stock.dividendYield > 2) s += 1;
  if (s >= 6) return { text: "STRONG BUY", color: "var(--bull)" };
  if (s >= 4) return { text: "BUY", color: "var(--bull)" };
  if (s >= 2) return { text: "HOLD", color: "var(--caution)" };
  return { text: "PASS", color: "var(--bear)" };
}

/** Compact horizontal timeline for scan page */
function CompactTimeline({ symbol, name, sector }: { symbol: string; name: string; sector: string }) {
  const years = useMemo(() => {
    const base = 1990 + Math.floor((symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1)) % 20);
    return [
      { year: base, label: "IPO", c: "var(--tech)" },
      { year: base + 3, label: "DIV", c: "var(--bull)" },
      { year: base + 8, label: "EXPAND", c: "var(--caution)" },
      { year: 1997, label: "CRISIS", c: "var(--bear)" },
      { year: base + 18, label: "CEO", c: "var(--ink)" },
      { year: 2020, label: "COVID", c: "var(--bear)" },
      { year: 2024, label: "RECORD", c: "var(--bull)" },
      { year: 2025, label: "ESG", c: "var(--caution)" },
    ];
  }, [symbol]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 12px", borderTop: "1px solid var(--line-dim)", overflowX: "auto" }}>
      <span className="t-micro" style={{ color: "var(--dim)", marginRight: 6, flexShrink: 0 }}>TIMELINE</span>
      {years.map((y, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, background: y.c }} />
          <span className="t-micro" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.5rem" }}>
            {y.year}
          </span>
          <span className="t-micro" style={{ color: y.c, fontSize: "0.5rem" }}>{y.label}</span>
          {i < years.length - 1 && <span style={{ color: "var(--line-dim)", margin: "0 3px" }}>·</span>}
        </div>
      ))}
    </div>
  );
}

export function ScanShell() {
  const [market, setMarket] = useState<"thai" | "global">("thai");
  const [sector, setSector] = useState("all");
  const [selected, setSelected] = useState<StockFundamentals | null>(null);

  const stocks = market === "thai" ? MOCK_STOCKS : MOCK_GLOBAL_STOCKS;
  const filtered = sector === "all" ? stocks : stocks.filter(s => s.sector.toLowerCase() === sector.toLowerCase());
  const sorted = [...filtered].sort((a, b) => b.marginOfSafety - a.marginOfSafety);

  const active = selected ?? sorted[0];

  const fundHistory = useMemo(() => {
    if (!active) return [];
    return generateFundamentalHistory(active.symbol, 3, active.price, active.eps, active.bvps);
  }, [active]);

  const grahamData = useMemo(() =>
    fundHistory.map(d => ({ time: d.time, price: d.price, grahamNumber: d.grahamNumber })),
    [fundHistory],
  );

  const peers = sorted.filter(s => s.sector === active?.sector && s.symbol !== active?.symbol).slice(0, 3);
  const verdict = active ? buffettLabel(active) : { text: "—", color: "var(--dim)" };
  const reasoning = active ? aiReasoning(active) : "";

  return (
    <div className="dashboard-page" style={{ height: "calc(100dvh - var(--top-h))" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "5px 12px",
        borderBottom: "1px solid var(--line)", flexShrink: 0, flexWrap: "wrap",
      }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>MARKET</span>
        {(["thai", "global"] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMarket(m); setSelected(null); }}
            style={{
              background: market === m ? "var(--bg-surface)" : "transparent",
              border: `1px solid ${market === m ? "var(--bull)" : "var(--line-dim)"}`,
              color: market === m ? "var(--bull)" : "var(--muted)",
              fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.1em",
              padding: "2px 8px", cursor: "pointer",
            }}
          >
            {m.toUpperCase()}
          </button>
        ))}
        <div style={{ width: 1, height: 14, background: "var(--line-dim)" }} />
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          style={{
            background: "var(--bg)", border: "1px solid var(--line-dim)", color: "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: "0.5625rem", padding: "2px 6px", outline: "none",
          }}
        >
          {SECTORS.map(s => <option key={s} value={s}>{s === "all" ? "ALL SECTORS" : s.toUpperCase()}</option>)}
        </select>
        <span className="t-micro" style={{ color: "var(--dim)", marginLeft: "auto" }}>
          {filtered.length} STOCKS · {filtered.filter(s => s.marginOfSafety > 0).length} BUY ZONES
        </span>
      </div>

      {/* Main: Chart left, Numbers right */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1.2fr 1fr", overflow: "hidden" }}>
        {/* LEFT — Chart + timeline */}
        <div style={{ borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {active && (
            <>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                padding: "5px 12px", borderBottom: "1px solid var(--line-dim)", flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700 }}>{active.symbol.replace(".BK", "")}</span>
                  <span className="t-body" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{active.name}</span>
                  <span className="t-micro" style={{ color: verdict.color, border: `1px solid ${verdict.color}`, padding: "0 3px", fontSize: "0.5rem" }}>{verdict.text}</span>
                </div>
                <span className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>฿{active.price.toFixed(2)}</span>
              </div>
              <div style={{ flex: 1, minHeight: 0, padding: "2px 6px" }}>
                <GrahamOverlayChart data={grahamData} />
              </div>
              <CompactTimeline symbol={active.symbol} name={active.name} sector={active.sector} />
              <div style={{ padding: "3px 12px", borderTop: "1px solid var(--line-dim)", flexShrink: 0 }}>
                <span className="t-micro" style={{ color: "var(--dim)", fontSize: "0.5rem" }}>
                  Solid = price · Dashed = Graham intrinsic value · {reasoning}
                </span>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — Dense numbers */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          {/* 4-col metric grid */}
          {active && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
              borderBottom: "1px solid var(--line-dim)", flexShrink: 0,
            }}>
              <Metric label="P/E" value={active.pe.toFixed(1)} good={active.pe <= 15} />
              <Metric label="P/B" value={active.pb.toFixed(2)} good={active.pb <= 1.5} />
              <Metric label="MOS" value={`${active.marginOfSafety > 0 ? "+" : ""}${active.marginOfSafety.toFixed(0)}%`} good={active.marginOfSafety >= 30} />
              <Metric label="ROE" value={`${active.roe.toFixed(1)}%`} good={active.roe > 15} />
              <Metric label="DEBT/EQ" value={active.debtToEquity.toFixed(2)} good={active.debtToEquity < 0.5} />
              <Metric label="DIV YIELD" value={`${active.dividendYield.toFixed(1)}%`} good={active.dividendYield > 3} />
              <Metric label="EPS" value={active.eps.toFixed(2)} good />
              <Metric label="BVPS" value={active.bvps.toFixed(2)} good />
              <Metric label="MARKET CAP" value={`${(active.marketCap / 1e9).toFixed(1)}B`} good />
              <Metric label="GRAHAM №" value={`฿${Math.sqrt(22.5 * active.eps * active.bvps).toFixed(0)}`} good />
              <Metric label="SECTOR" value={active.sector.toUpperCase().slice(0, 8)} good />
              <Metric label="MOAT" value={active.moat.toUpperCase()} good={active.moat !== "none"} />
            </div>
          )}

          {/* Peers */}
          {peers.length > 0 && (
            <div style={{ padding: "4px 10px", borderBottom: "1px solid var(--line-dim)", flexShrink: 0 }}>
              <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 3, fontSize: "0.5rem" }}>SECTOR PEERS</div>
              <div style={{ display: "flex", gap: 6 }}>
                {peers.map(p => (
                  <button
                    key={p.symbol}
                    onClick={() => setSelected(p)}
                    style={{
                      background: "var(--bg)", border: "1px solid var(--line-dim)",
                      color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.5625rem",
                      padding: "2px 6px", cursor: "pointer",
                    }}
                  >
                    {p.symbol.replace(".BK", "")} MOS {p.marginOfSafety > 0 ? "+" : ""}{p.marginOfSafety.toFixed(0)}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI reasoning */}
          {active && (
            <div style={{ padding: "4px 10px", borderBottom: "1px solid var(--line-dim)", flexShrink: 0 }}>
              <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 2, fontSize: "0.5rem" }}>ANALYSIS</div>
              <div className="t-body" style={{ fontSize: "0.6875rem", color: "var(--muted)", lineHeight: 1.35 }}>
                {reasoning}
              </div>
            </div>
          )}

          {/* Graham checklist */}
          {active && (
            <div style={{ padding: "4px 10px", flex: 1, minHeight: 0, overflow: "hidden" }}>
              <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 3, fontSize: "0.5rem" }}>GRAHAM CHECKLIST</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
                <CheckRow label="P/E ≤ 15" pass={active.pe <= 15} />
                <CheckRow label="P/B ≤ 1.5" pass={active.pb <= 1.5} />
                <CheckRow label="Positive EPS" pass={active.eps > 0} />
                <CheckRow label="Debt/Eq < 1.0" pass={active.debtToEquity < 1} />
                <CheckRow label="Dividend record" pass={active.dividendYield > 0} />
                <CheckRow label="MOS ≥ 30%" pass={active.marginOfSafety >= 30} />
                <CheckRow label="ROE > 15%" pass={active.roe > 15} />
                <CheckRow label="Moat exists" pass={active.moat !== "none"} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom film strip */}
      <div style={{
        borderTop: "1px solid var(--line)", padding: "3px 10px",
        flexShrink: 0, overflowX: "auto", scrollbarWidth: "none",
        display: "flex", gap: 3,
      }}>
        {sorted.map(stock => {
          const isActive = stock.symbol === active?.symbol;
          return (
            <button
              key={stock.symbol}
              onClick={() => setSelected(stock)}
              style={{
                flexShrink: 0,
                background: isActive ? "var(--bg-surface)" : "var(--bg-raised)",
                border: `1px solid ${isActive ? "var(--bull)" : "var(--line-dim)"}`,
                padding: "3px 8px", cursor: "pointer", textAlign: "left", minWidth: 90,
              }}
            >
              <div className="t-mono" style={{ fontSize: "0.625rem", fontWeight: 700, color: isActive ? "var(--bull)" : "var(--ink)" }}>
                {stock.symbol.replace(".BK", "")}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 1 }}>
                <span className="t-mono" style={{ fontSize: "0.5rem", color: stock.pe <= 15 ? "var(--bull)" : "var(--dim)" }}>
                  P/E {stock.pe.toFixed(1)}
                </span>
                <span className="t-mono" style={{ fontSize: "0.5rem", color: stock.marginOfSafety >= 30 ? "var(--bull)" : stock.marginOfSafety >= 0 ? "var(--caution)" : "var(--bear)" }}>
                  MOS {stock.marginOfSafety > 0 ? "+" : ""}{stock.marginOfSafety.toFixed(0)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div style={{ padding: "4px 6px", borderRight: "1px solid var(--line-dim)", borderBottom: "1px solid var(--line-dim)" }}>
      <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 1, fontSize: "0.4375rem", letterSpacing: "0.06em" }}>{label}</div>
      <div className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: good ? "var(--bull)" : "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function CheckRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span className="t-micro" style={{ color: "var(--muted)", fontSize: "0.5rem" }}>{label}</span>
      <span className="t-mono" style={{ fontSize: "0.5625rem", color: pass ? "var(--bull)" : "var(--bear)" }}>
        {pass ? "✓" : "✗"}
      </span>
    </div>
  );
}
