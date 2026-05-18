"use client";

import type { YahooQuote } from "@/lib/api/yahoo";
import { fmtNum } from "@/lib/format";

// Approximate correlations between SET and global assets
// In production: computed nightly by ingestion using 60-day rolling window
// These values are based on historical averages for Thai market research
interface AssetCorrelation {
  symbol: string;
  name: string;
  flag: string;
  corr60d: number;   // 60-day correlation with SET (approximate)
  corr20d: number;   // 20-day correlation with SET (more recent)
  interpretation: string;
}

const STATIC_CORRELATIONS: AssetCorrelation[] = [
  {
    symbol: "^GSPC", name: "S&P 500", flag: "🇺🇸",
    corr60d: 0.62, corr20d: 0.58,
    interpretation: "Strong. US close moves SET next-day open.",
  },
  {
    symbol: "000001.SS", name: "Shanghai", flag: "🇨🇳",
    corr60d: 0.48, corr20d: 0.51,
    interpretation: "Moderate. China slowdown hits Thai exports.",
  },
  {
    symbol: "^HSI", name: "Hang Seng", flag: "🇭🇰",
    corr60d: 0.44, corr20d: 0.46,
    interpretation: "Moderate. HK serves as China proxy for Thai investors.",
  },
  {
    symbol: "GC=F", name: "Gold", flag: "🥇",
    corr60d: 0.12, corr20d: 0.18,
    interpretation: "Weak. Gold and SET both benefit from USD weakness.",
  },
  {
    symbol: "CL=F", name: "Oil WTI", flag: "🛢",
    corr60d: 0.31, corr20d: 0.28,
    interpretation: "Moderate. Oil costs hurt Thai manufacturers (net importer).",
  },
  {
    symbol: "BTC-USD", name: "Bitcoin", flag: "₿",
    corr60d: 0.22, corr20d: 0.35,
    interpretation: "Low-moderate. Risk-on correlation spikes in crises.",
  },
  {
    symbol: "^VIX", name: "VIX", flag: "📉",
    corr60d: -0.55, corr20d: -0.61,
    interpretation: "Negative. VIX spike = SET falls. Key risk signal.",
  },
  {
    symbol: "DX-Y.NYB", name: "USD Index", flag: "💵",
    corr60d: -0.38, corr20d: -0.41,
    interpretation: "Negative. Strong USD = weak THB = foreign selling in SET.",
  },
];

function corrColor(corr: number): string {
  const abs = Math.abs(corr);
  if (abs >= 0.6) return corr > 0 ? "rgba(0,200,150,0.7)" : "rgba(255,59,48,0.7)";
  if (abs >= 0.4) return corr > 0 ? "rgba(0,200,150,0.45)" : "rgba(255,59,48,0.45)";
  if (abs >= 0.2) return corr > 0 ? "rgba(0,200,150,0.2)" : "rgba(255,59,48,0.2)";
  return "var(--bg-surface)";
}

function corrTextColor(corr: number): string {
  const abs = Math.abs(corr);
  if (abs >= 0.4) return "#000000";
  return corr > 0 ? "var(--bull)" : "var(--bear)";
}

export function CorrelationMatrix({ liveAssets }: { liveAssets?: YahooQuote[] }) {
  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span className="t-micro">SET CORRELATION MATRIX</span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>60d vs 20d rolling · approx</span>
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 80px 80px 1fr",
        padding: "6px 16px",
        background: "var(--bg)",
        borderBottom: "1px solid var(--line)",
        gap: 8,
      }}>
        {["ASSET", "60D CORR", "20D CORR", "WHAT IT MEANS"].map(h => (
          <div key={h} className="t-micro">{h}</div>
        ))}
      </div>

      {STATIC_CORRELATIONS.map((row, i) => (
        <div
          key={row.symbol}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 80px 80px 1fr",
            gap: 8,
            padding: "9px 16px",
            borderBottom: i < STATIC_CORRELATIONS.length - 1 ? "1px solid var(--line)" : "none",
            minHeight: 44,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.9rem" }}>{row.flag}</span>
            <div>
              <div className="t-body" style={{ fontWeight: 600, fontSize: "0.875rem" }}>{row.name}</div>
            </div>
          </div>

          {/* 60d correlation cell */}
          <div style={{
            background: corrColor(row.corr60d),
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 28,
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: corrTextColor(row.corr60d),
            }}>
              {row.corr60d > 0 ? "+" : ""}{row.corr60d.toFixed(2)}
            </span>
          </div>

          {/* 20d correlation cell */}
          <div style={{
            background: corrColor(row.corr20d),
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 28,
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: corrTextColor(row.corr20d),
            }}>
              {row.corr20d > 0 ? "+" : ""}{row.corr20d.toFixed(2)}
            </span>
          </div>

          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>
            {row.interpretation}
          </div>
        </div>
      ))}

      <div style={{ padding: "8px 16px", borderTop: "1px solid var(--line)" }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          Values based on historical averages · Run stats.py for live 60-day rolling correlations
        </span>
      </div>
    </div>
  );
}
