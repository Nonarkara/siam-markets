"use client";

import { useMemo } from "react";
import { generateOHLC } from "@/lib/api/mock-history";

interface Market {
  symbol: string;
  name: string;
  flag: string;
  timezone: string;
}

const MAJOR_MARKETS: Market[] = [
  { symbol: "^GSPC", name: "S&P 500", flag: "🇺🇸", timezone: "EST" },
  { symbol: "^IXIC", name: "NASDAQ", flag: "🇺🇸", timezone: "EST" },
  { symbol: "^DJI", name: "DOW", flag: "🇺🇸", timezone: "EST" },
  { symbol: "^FTSE", name: "FTSE 100", flag: "🇬🇧", timezone: "GMT" },
  { symbol: "^GDAXI", name: "DAX", flag: "🇩🇪", timezone: "CET" },
  { symbol: "^N225", name: "NIKKEI 225", flag: "🇯🇵", timezone: "JST" },
  { symbol: "^HSI", name: "HANG SENG", flag: "🇭🇰", timezone: "HKT" },
  { symbol: "^SSEC", name: "SHANGHAI", flag: "🇨🇳", timezone: "CST" },
  { symbol: "^AXJO", name: "ASX 200", flag: "🇦🇺", timezone: "AEDT" },
  { symbol: "SET.BK", name: "SET", flag: "🇹🇭", timezone: "ICT" },
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div style={{ height: 24, background: "var(--bg-raised)" }} />;
  const w = 80;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.2} />
    </svg>
  );
}

interface Props {
  quotes?: Array<{ symbol: string; price?: number; changePct?: number }>;
}

export function MarketColumns({ quotes = [] }: Props) {
  const enriched = useMemo(() => {
    return MAJOR_MARKETS.map(m => {
      const q = quotes.find(q => q.symbol === m.symbol);
      const price = q?.price ?? 0;
      const change = q?.changePct ?? (Math.random() * 3 - 1.5);
      const history = generateOHLC(m.symbol, 65, price || 4000).map(d => d.close);
      const sessionSlice = history.slice(-10);
      const dayHigh = Math.max(...sessionSlice);
      const dayLow = Math.min(...sessionSlice);
      const pts = price * change / 100;
      return { ...m, price, change, history, dayHigh, dayLow, pts };
    });
  }, [quotes]);

  const topPerformer = enriched.reduce((best, m) => m.change > best.change ? m : best, enriched[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "4px 10px", borderBottom: "1px solid var(--line-dim)", flexShrink: 0,
      }}>
        <span className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em" }}>MAJOR MARKETS</span>
        <span className="t-mono" style={{ fontSize: "0.5rem", color: "var(--bull)" }}>
          TOP {topPerformer.flag} {topPerformer.name} {topPerformer.change >= 0 ? "+" : ""}{topPerformer.change.toFixed(2)}%
        </span>
      </div>
      <div style={{
        flex: 1, minHeight: 0, overflow: "hidden",
        display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 1,
      }}>
        {enriched.map(m => {
          const color = m.change >= 0 ? "var(--bull)" : "var(--bear)";
          return (
            <div key={m.symbol} style={{
              borderRight: "1px solid var(--line-dim)",
              padding: "4px 6px", display: "flex", flexDirection: "column", gap: 2,
              minWidth: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: "0.7rem" }}>{m.flag}</span>
                <span className="t-mono" style={{ fontSize: "0.5625rem", fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em" }}>
                  {m.name}
                </span>
              </div>
              <span className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color }}>
                {m.price ? m.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
              </span>
              <span className="t-mono" style={{ fontSize: "0.5625rem", color }}>
                {m.change >= 0 ? "+" : ""}{m.change.toFixed(2)}%
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                <span className="t-mono" style={{ fontSize: "0.5rem", color }}>
                  {m.pts >= 0 ? "+" : ""}{m.pts.toLocaleString(undefined, { maximumFractionDigits: 1 })} pts
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <span className="t-mono" style={{ fontSize: "0.4375rem", color: "var(--dim)" }}>
                    H&nbsp;{m.dayHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="t-mono" style={{ fontSize: "0.4375rem", color: "var(--dim)" }}>
                    L&nbsp;{m.dayLow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: "auto" }}>
                <MiniSparkline data={m.history} color={color} />
              </div>
              <span className="t-micro" style={{ fontSize: "0.4375rem", color: "var(--dim)", marginTop: 2 }}>
                {m.timezone}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
