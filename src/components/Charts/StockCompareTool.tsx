"use client";

import { useState, useEffect } from "react";
import { TerminalChart, TERMINAL } from "./TerminalChart";
import type { HistoricalPoint } from "@/lib/api/yahoo";
import { COMPARISON_GROUPS } from "@/lib/api/yahoo";

type Range = "1mo" | "3mo" | "6mo" | "1y";

const RANGES: { label: string; value: Range }[] = [
  { label: "1M",  value: "1mo" },
  { label: "3M",  value: "3mo" },
  { label: "6M",  value: "6mo" },
  { label: "1Y",  value: "1y"  },
];

const ALL_STOCKS = [
  { symbol: "KBANK.BK",  name: "KBANK",  sector: "Banking"   },
  { symbol: "SCB.BK",    name: "SCB",    sector: "Banking"   },
  { symbol: "BBL.BK",    name: "BBL",    sector: "Banking"   },
  { symbol: "PTT.BK",    name: "PTT",    sector: "Energy"    },
  { symbol: "PTTEP.BK",  name: "PTTEP",  sector: "Energy"    },
  { symbol: "GULF.BK",   name: "GULF",   sector: "Energy"    },
  { symbol: "RATCH.BK",  name: "RATCH",  sector: "Energy"    },
  { symbol: "CPALL.BK",  name: "CPALL",  sector: "Consumer"  },
  { symbol: "HMPRO.BK",  name: "HMPRO",  sector: "Consumer"  },
  { symbol: "MINT.BK",   name: "MINT",   sector: "Consumer"  },
  { symbol: "ADVANC.BK", name: "ADVANC", sector: "Telecom"   },
  { symbol: "TRUE.BK",   name: "TRUE",   sector: "Telecom"   },
  { symbol: "SCC.BK",    name: "SCC",    sector: "Materials" },
  { symbol: "AOT.BK",    name: "AOT",    sector: "Transport" },
  { symbol: "CPN.BK",    name: "CPN",    sector: "Real Est." },
  { symbol: "^SET.BK",   name: "SET",    sector: "Index"     },
];

// Generate mock historical data for a stock (production: replace with fetchHistoricalPrices)
function generateMockHistory(symbol: string, range: Range): HistoricalPoint[] {
  const days: Record<Range, number> = { "1mo": 22, "3mo": 65, "6mo": 130, "1y": 252 };
  const count = days[range];

  // Seed different characteristics per stock from mock fundamentals
  const seeds: Record<string, { base: number; vol: number; drift: number }> = {
    "KBANK.BK":  { base: 141.0,  vol: 0.012, drift: 0.0003  },
    "SCB.BK":    { base: 108.5,  vol: 0.013, drift: 0.0002  },
    "BBL.BK":    { base: 157.0,  vol: 0.011, drift: 0.0004  },
    "PTT.BK":    { base: 35.5,   vol: 0.014, drift: -0.0001 },
    "PTTEP.BK":  { base: 155.0,  vol: 0.016, drift: 0.0002  },
    "GULF.BK":   { base: 44.75,  vol: 0.018, drift: 0.0005  },
    "RATCH.BK":  { base: 35.5,   vol: 0.010, drift: 0.0001  },
    "CPALL.BK":  { base: 64.5,   vol: 0.013, drift: 0.0006  },
    "HMPRO.BK":  { base: 14.8,   vol: 0.015, drift: 0.0003  },
    "MINT.BK":   { base: 33.25,  vol: 0.017, drift: 0.0004  },
    "ADVANC.BK": { base: 232.0,  vol: 0.009, drift: 0.0002  },
    "TRUE.BK":   { base: 9.15,   vol: 0.020, drift: -0.0002 },
    "SCC.BK":    { base: 360.0,  vol: 0.011, drift: 0.0001  },
    "AOT.BK":    { base: 63.25,  vol: 0.014, drift: 0.0007  },
    "CPN.BK":    { base: 58.75,  vol: 0.012, drift: 0.0005  },
    "^SET.BK":   { base: 1518.0, vol: 0.008, drift: 0.0002  },
  };

  const { base, vol, drift } = seeds[symbol] ?? { base: 100, vol: 0.012, drift: 0.0002 };
  const points: HistoricalPoint[] = [];
  let price = base * (1 - (count / 252) * drift * 80); // rough historical back-calculation

  // Seeded deterministic noise using symbol hash
  const seed = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const now = new Date();
  for (let i = count; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Pseudo-random walk using linear congruential generator
    const s = (seed * 1103515245 + (i * 12345)) & 0x7fffffff;
    const noise = ((s % 1000) / 1000 - 0.49) * vol;
    price = price * (1 + drift + noise);

    points.push({
      date: date.toISOString().split("T")[0],
      close: Math.max(0.01, Math.round(price * 100) / 100),
      volume: Math.floor(1_000_000 + (s % 5_000_000)),
    });
  }
  return points;
}

export function StockCompareTool() {
  const [range, setRange] = useState<Range>("3mo");
  const [mode, setMode] = useState<"compare" | "single">("compare");
  const [activeGroup, setActiveGroup] = useState<string>("banking");
  const [selected, setSelected] = useState<string[]>(["KBANK.BK", "SCB.BK", "BBL.BK"]);
  const [singleSymbol, setSingleSymbol] = useState("KBANK.BK");
  const [histories, setHistories] = useState<Record<string, HistoricalPoint[]>>({});
  const [loading, setLoading] = useState(false);

  // Load data when selection or range changes
  useEffect(() => {
    const symbols = mode === "compare" ? selected : [singleSymbol];
    setLoading(true);

    const newHistories: Record<string, HistoricalPoint[]> = {};
    for (const sym of symbols) {
      newHistories[sym] = generateMockHistory(sym, range);
    }
    setHistories(newHistories);
    setLoading(false);
  }, [selected, singleSymbol, range, mode]);

  function selectGroup(groupKey: string) {
    setActiveGroup(groupKey);
    const group = COMPARISON_GROUPS[groupKey];
    if (group) setSelected(group.symbols.map(s => s.symbol));
  }

  function toggleStock(symbol: string) {
    setSelected(prev => {
      if (prev.includes(symbol)) return prev.length > 1 ? prev.filter(s => s !== symbol) : prev;
      return prev.length < 5 ? [...prev, symbol] : prev;
    });
  }

  const compareData = selected
    .filter(sym => histories[sym]?.length > 0)
    .map(sym => ({
      label: ALL_STOCKS.find(s => s.symbol === sym)?.name ?? sym.replace(".BK", ""),
      points: histories[sym] ?? [],
    }));

  const singleData = histories[singleSymbol] ?? [];
  const singleStock = ALL_STOCKS.find(s => s.symbol === singleSymbol);

  const ButtonStyle = (active: boolean, color = TERMINAL.green) => ({
    background: active ? color : "transparent",
    border: `1px solid ${active ? color : TERMINAL.greenDim}`,
    color: active ? "#000" : (active ? color : TERMINAL.textDim),
    fontFamily: TERMINAL.font,
    fontSize: "0.55rem",
    fontWeight: 700 as const,
    letterSpacing: "0.08em",
    padding: "4px 10px",
    cursor: "pointer" as const,
    minHeight: 28,
    transition: "all 150ms ease",
  });

  return (
    <div style={{ background: TERMINAL.bg, border: `1px solid ${TERMINAL.greenDim}` }}>

      {/* ── Terminal top bar ─────────────────────────────────── */}
      <div style={{
        padding: "6px 12px",
        borderBottom: `1px solid ${TERMINAL.greenDim}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(0,255,65,0.04)",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <div style={{ fontFamily: TERMINAL.font, fontSize: "0.7rem", color: TERMINAL.green, letterSpacing: "0.1em", fontWeight: 700 }}>
          SET50 CHART TERMINAL
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {/* Mode switcher */}
          <button style={ButtonStyle(mode === "compare")} onClick={() => setMode("compare")}>COMPARE</button>
          <button style={ButtonStyle(mode === "single")} onClick={() => setMode("single")}>SINGLE</button>
        </div>
      </div>

      {/* ── Control strip ────────────────────────────────────── */}
      <div style={{
        padding: "6px 12px",
        borderBottom: `1px solid ${TERMINAL.greenDim}`,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        background: "rgba(0,255,65,0.02)",
      }}>
        {/* Range */}
        <div style={{ display: "flex", gap: 2 }}>
          {RANGES.map(r => (
            <button key={r.value} style={ButtonStyle(range === r.value)} onClick={() => setRange(r.value)}>
              {r.label}
            </button>
          ))}
        </div>

        {mode === "compare" && (
          /* Preset groups */
          <div style={{ display: "flex", gap: 2 }}>
            {Object.entries(COMPARISON_GROUPS).map(([key, g]) => (
              <button
                key={key}
                style={ButtonStyle(activeGroup === key, TERMINAL.amber)}
                onClick={() => selectGroup(key)}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}

        {mode === "single" && (
          /* Single stock selector */
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {ALL_STOCKS.filter(s => !s.symbol.startsWith("^")).map(s => (
              <button
                key={s.symbol}
                style={ButtonStyle(singleSymbol === s.symbol, TERMINAL.cyan)}
                onClick={() => setSingleSymbol(s.symbol)}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Compare mode: stock toggles + chart ──────────────── */}
      {mode === "compare" && (
        <>
          {/* Active stock toggles */}
          <div style={{
            padding: "6px 12px",
            borderBottom: `1px solid ${TERMINAL.greenDim}`,
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
          }}>
            <span style={{ fontFamily: TERMINAL.font, fontSize: "0.5rem", color: TERMINAL.textDim, alignSelf: "center", marginRight: 4 }}>
              ACTIVE:
            </span>
            {ALL_STOCKS.filter(s => !s.symbol.startsWith("^")).map((s, i) => {
              const isActive = selected.includes(s.symbol);
              const colorIdx = selected.indexOf(s.symbol);
              const col = isActive && colorIdx >= 0 ? { line: ["#00ff41","#ffb800","#00d4ff","#ff4444","#bf80ff"][colorIdx], dim: "" } : null;
              return (
                <button
                  key={s.symbol}
                  onClick={() => toggleStock(s.symbol)}
                  style={{
                    background: isActive && col ? `${col.line}22` : "transparent",
                    border: `1px solid ${isActive && col ? col.line : TERMINAL.greenDim}`,
                    color: isActive && col ? col.line : TERMINAL.textDim,
                    fontFamily: TERMINAL.font,
                    fontSize: "0.55rem",
                    fontWeight: isActive ? 700 : 400,
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    cursor: "pointer",
                    minHeight: 26,
                    transition: "all 150ms ease",
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>

          {/* Comparison chart */}
          <div style={{ padding: "0" }}>
            {compareData.length > 0 ? (
              <TerminalChart
                data={{ mode: "compare", datasets: compareData }}
                height={260}
                title={`PERFORMANCE COMPARISON · ${range.toUpperCase()}`}
                subtitle="INDEXED TO 0% AT START OF PERIOD · ALL STOCKS ON SAME AXIS"
              />
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: TERMINAL.textDim, fontFamily: TERMINAL.font, fontSize: "0.6rem" }}>
                NO DATA — SELECT STOCKS ABOVE
              </div>
            )}
          </div>

          {/* Performance table */}
          {compareData.length > 0 && (
            <div style={{ borderTop: `1px solid ${TERMINAL.greenDim}` }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: `2fr repeat(${Math.min(compareData.length, 5)}, 1fr)`,
                padding: "5px 12px",
                background: "rgba(0,255,65,0.04)",
                borderBottom: `1px solid ${TERMINAL.greenDim}`,
                gap: 4,
              }}>
                <span style={{ fontFamily: TERMINAL.font, fontSize: "0.5rem", color: TERMINAL.textDim }}>METRIC</span>
                {compareData.slice(0, 5).map((ds, i) => (
                  <span key={ds.label} style={{ fontFamily: TERMINAL.font, fontSize: "0.55rem", color: ["#00ff41","#ffb800","#00d4ff","#ff4444","#bf80ff"][i], fontWeight: 700 }}>
                    {ds.label}
                  </span>
                ))}
              </div>
              {[
                { label: "CURRENT",   fn: (pts: HistoricalPoint[]) => `฿${pts[pts.length-1]?.close.toFixed(2)}` },
                { label: "PERIOD CHG",fn: (pts: HistoricalPoint[]) => { const c = ((pts[pts.length-1]?.close - pts[0]?.close) / pts[0]?.close) * 100; return `${c > 0 ? "+" : ""}${c.toFixed(2)}%`; } },
                { label: "PERIOD HI", fn: (pts: HistoricalPoint[]) => `฿${Math.max(...pts.map(p => p.close)).toFixed(2)}` },
                { label: "PERIOD LO", fn: (pts: HistoricalPoint[]) => `฿${Math.min(...pts.map(p => p.close)).toFixed(2)}` },
              ].map((row, ri) => (
                <div key={row.label} style={{
                  display: "grid",
                  gridTemplateColumns: `2fr repeat(${Math.min(compareData.length, 5)}, 1fr)`,
                  padding: "5px 12px",
                  borderBottom: ri < 3 ? `1px solid ${TERMINAL.greenDim}22` : "none",
                  gap: 4,
                }}>
                  <span style={{ fontFamily: TERMINAL.font, fontSize: "0.5rem", color: TERMINAL.textDim }}>{row.label}</span>
                  {compareData.slice(0, 5).map((ds, i) => {
                    const val = row.fn(ds.points);
                    const isChg = row.label === "PERIOD CHG";
                    const pct = isChg ? parseFloat(val) : 0;
                    return (
                      <span key={ds.label} style={{
                        fontFamily: TERMINAL.font, fontSize: "0.6rem", fontWeight: 700,
                        color: isChg ? (pct >= 0 ? TERMINAL.green : TERMINAL.red) : ["#00ff41","#ffb800","#00d4ff","#ff4444","#bf80ff"][i],
                      }}>
                        {val}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Single stock mode ─────────────────────────────────── */}
      {mode === "single" && singleData.length > 0 && (
        <>
          <TerminalChart
            data={{ mode: "single", label: singleStock?.name ?? singleSymbol, points: singleData }}
            height={260}
            title={`${singleStock?.name ?? ""} · ${singleSymbol}`}
            subtitle={`${singleStock?.sector ?? ""} · ${range.toUpperCase()} PRICE HISTORY`}
          />

          {/* Stats bar */}
          <div style={{
            borderTop: `1px solid ${TERMINAL.greenDim}`,
            padding: "8px 12px",
            display: "flex",
            gap: 0,
            background: "rgba(0,255,65,0.02)",
            flexWrap: "wrap",
          }}>
            {[
              { label: "OPEN",    value: `฿${singleData[0]?.close.toFixed(2)}` },
              { label: "CURRENT", value: `฿${singleData[singleData.length-1]?.close.toFixed(2)}` },
              { label: "HIGH",    value: `฿${Math.max(...singleData.map(p => p.close)).toFixed(2)}` },
              { label: "LOW",     value: `฿${Math.min(...singleData.map(p => p.close)).toFixed(2)}` },
              { label: "CHANGE",  value: (() => { const c = ((singleData[singleData.length-1]?.close - singleData[0]?.close) / singleData[0]?.close) * 100; return `${c > 0 ? "+" : ""}${c.toFixed(2)}%`; })() },
              { label: "POINTS",  value: singleData.length.toString() },
            ].map((item, i, arr) => (
              <div key={item.label} style={{
                flex: "1 0 80px",
                padding: "6px 10px",
                borderRight: i < arr.length - 1 ? `1px solid ${TERMINAL.greenDim}22` : "none",
              }}>
                <div style={{ fontFamily: TERMINAL.font, fontSize: "0.45rem", color: TERMINAL.textDim, letterSpacing: "0.06em", marginBottom: 3 }}>{item.label}</div>
                <div style={{
                  fontFamily: TERMINAL.font, fontSize: "0.65rem", fontWeight: 700,
                  color: item.label === "CHANGE" ? (parseFloat(item.value) >= 0 ? TERMINAL.green : TERMINAL.red) : TERMINAL.green,
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {loading && (
        <div style={{ padding: 20, textAlign: "center", fontFamily: TERMINAL.font, fontSize: "0.6rem", color: TERMINAL.textDim }}>
          LOADING DATA...
        </div>
      )}
    </div>
  );
}
