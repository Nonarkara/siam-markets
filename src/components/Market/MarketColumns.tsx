"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchYahooQuote } from "@/lib/api/yahoo";
import type { YahooQuote, HistoryPoint } from "@/lib/api/yahoo";

// ─── Market definitions + hardcoded constituents ──────────────────

interface Constituent { symbol: string; label: string }

interface MarketDef {
  symbol: string;
  name: string;
  flag: string;
  exchange: string;
  constituents: Constituent[];
}

const MARKETS: MarketDef[] = [
  {
    symbol: "^GSPC", name: "S&P 500", flag: "🇺🇸", exchange: "NYSE",
    constituents: [
      { symbol: "AAPL",  label: "AAPL"  },
      { symbol: "MSFT",  label: "MSFT"  },
      { symbol: "NVDA",  label: "NVDA"  },
    ],
  },
  {
    symbol: "^IXIC", name: "Nasdaq", flag: "🇺🇸", exchange: "NASDAQ",
    constituents: [
      { symbol: "GOOGL", label: "GOOGL" },
      { symbol: "AMZN",  label: "AMZN"  },
      { symbol: "META",  label: "META"  },
    ],
  },
  {
    symbol: "^FTSE", name: "FTSE 100", flag: "🇬🇧", exchange: "LSE",
    constituents: [
      { symbol: "SHEL.L", label: "SHEL" },
      { symbol: "HSBA.L", label: "HSBA" },
      { symbol: "BP.L",   label: "BP"   },
    ],
  },
  {
    symbol: "^GDAXI", name: "DAX", flag: "🇩🇪", exchange: "XETRA",
    constituents: [
      { symbol: "SAP.DE",  label: "SAP"  },
      { symbol: "SIE.DE",  label: "SIE"  },
      { symbol: "BAYN.DE", label: "BAYN" },
    ],
  },
  {
    symbol: "^N225", name: "Nikkei", flag: "🇯🇵", exchange: "TSE",
    constituents: [
      { symbol: "7203.T", label: "TOYOTA" },
      { symbol: "9984.T", label: "SOFTBK" },
      { symbol: "6861.T", label: "KEYENC" },
    ],
  },
  {
    symbol: "^HSI", name: "Hang Seng", flag: "🇭🇰", exchange: "HKEX",
    constituents: [
      { symbol: "0700.HK", label: "TENCENT" },
      { symbol: "9988.HK", label: "ALIBABA" },
      { symbol: "0941.HK", label: "CML"     },
    ],
  },
  {
    symbol: "000001.SS", name: "Shanghai", flag: "🇨🇳", exchange: "SSE",
    constituents: [
      { symbol: "600519.SS", label: "KWEICHOW" },
      { symbol: "601318.SS", label: "PINGAN"   },
      { symbol: "600036.SS", label: "CMB"      },
    ],
  },
  {
    symbol: "^AXJO", name: "ASX 200", flag: "🇦🇺", exchange: "ASX",
    constituents: [
      { symbol: "BHP.AX", label: "BHP" },
      { symbol: "CBA.AX", label: "CBA" },
      { symbol: "CSL.AX", label: "CSL" },
    ],
  },
  {
    symbol: "^SET.BK", name: "SET", flag: "🇹🇭", exchange: "SET",
    constituents: [
      { symbol: "PTT.BK",    label: "PTT"    },
      { symbol: "KBANK.BK",  label: "KBANK"  },
      { symbol: "ADVANC.BK", label: "ADVANC" },
    ],
  },
  {
    symbol: "^BVSP", name: "Bovespa", flag: "🇧🇷", exchange: "B3",
    constituents: [
      { symbol: "VALE3.SA",  label: "VALE"  },
      { symbol: "PETR4.SA",  label: "PETR4" },
      { symbol: "ITUB4.SA",  label: "ITUB4" },
    ],
  },
];

// ─── YTD sparkline (SVG) ──────────────────────────────────────────

function YtdSparkline({ points, color }: { points: HistoryPoint[]; color: string }) {
  if (points.length < 2) {
    return (
      <div
        style={{
          height: 40,
          background: "var(--bg-raised)",
          border: "1px solid var(--line-dim)",
        }}
      />
    );
  }
  const W = 160;
  const H = 40;
  const vals = points.map(p => p.c);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / span) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block", height: 40 }}
      aria-hidden="true"
    >
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

// ─── Single constituent stock row ─────────────────────────────────

function ConstituentRow({ symbol, label }: { symbol: string; label: string }) {
  const [quote, setQuote] = useState<YahooQuote | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchYahooQuote(symbol, label).then(q => {
      if (!cancelled && q) setQuote(q);
    });
    return () => { cancelled = true; };
  }, [symbol, label]);

  const color = quote
    ? quote.changePct >= 0 ? "var(--bull)" : "var(--bear)"
    : "var(--muted)";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 4,
        minHeight: 18,
      }}
    >
      <span
        className="t-mono"
        style={{ fontSize: "var(--text-micro)", color: "var(--ink)", letterSpacing: "0.03em" }}
      >
        {label}
      </span>
      <span
        className="t-mono"
        style={{ fontSize: "var(--text-micro)", color }}
      >
        {quote
          ? `${quote.changePct >= 0 ? "+" : ""}${quote.changePct.toFixed(1)}%`
          : "—"}
      </span>
    </div>
  );
}

// ─── Intelligence strip (regime + forecast) ───────────────────────

function IntelligenceStrip({ setQuote }: { setQuote: YahooQuote | undefined }) {
  const [regime, setRegime] = useState<{ regime: string; bull_prob: number; bear_prob: number; ranging_prob: number } | null>(null);
  const [forecast, setForecast] = useState<{ rows?: Array<{ predicted: number }> } | null>(null);

  useEffect(() => {
    fetch("/api/regime").then(r => r.json()).then((d: { today?: { regime: string; bull_prob: number; bear_prob: number; ranging_prob: number } }) => {
      if (d.today) setRegime(d.today);
    }).catch(() => {});
    fetch("/api/forecast-set").then(r => r.json()).then((d: { rows?: Array<{ predicted: number }> }) => setForecast(d)).catch(() => {});
  }, []);

  const regimeColor = regime
    ? regime.regime === "bull" ? "var(--bull)" : regime.regime === "bear" ? "var(--bear)" : "var(--caution)"
    : "var(--dim)";

  const forecastDir = useMemo(() => {
    const lastPred = forecast?.rows?.[forecast.rows.length - 1]?.predicted;
    const curPrice = setQuote?.price;
    if (!lastPred || !curPrice) return null;
    return (lastPred - curPrice) / curPrice * 100;
  }, [forecast, setQuote]);

  if (!regime && forecastDir === null) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {regime && (
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 5, height: 5, background: regimeColor, display: "inline-block", flexShrink: 0 }} />
          <span className="t-mono" style={{ fontSize: "var(--text-micro)", color: regimeColor, letterSpacing: "0.06em" }}>
            {regime.regime.toUpperCase()} {(Math.max(regime.bull_prob, regime.bear_prob, regime.ranging_prob) * 100).toFixed(0)}%
          </span>
        </span>
      )}
      {forecastDir !== null && (
        <span className="t-mono" style={{
          fontSize: "var(--text-micro)",
          color: forecastDir >= 0 ? "var(--bull)" : "var(--bear)",
        }}>
          SET T+5 {forecastDir >= 0 ? "+" : ""}{forecastDir.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

// ─── Single market card ───────────────────────────────────────────

function MarketCard({
  market,
  quote,
  ytdPoints,
  foreignFlow,
}: {
  market: MarketDef;
  quote: YahooQuote | undefined;
  ytdPoints: HistoryPoint[];
  foreignFlow?: { d5: number; d20: number };
}) {
  const todayColor = quote
    ? quote.changePct >= 0 ? "var(--bull)" : "var(--bear)"
    : "var(--muted)";

  const ytdColor = useMemo(() => {
    if (ytdPoints.length < 2) return "var(--muted)";
    return ytdPoints[ytdPoints.length - 1].c >= ytdPoints[0].c
      ? "var(--bull)"
      : "var(--bear)";
  }, [ytdPoints]);

  const ytdPct = useMemo(() => {
    if (ytdPoints.length < 2) return null;
    const first = ytdPoints[0].c;
    const last  = ytdPoints[ytdPoints.length - 1].c;
    return (last / first - 1) * 100;
  }, [ytdPoints]);

  return (
    <div
      style={{
        width: 180,
        flexShrink: 0,
        borderRight: "1px solid var(--line-dim)",
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        background: "var(--bg)",
        transition: "background 0.12s",
        minHeight: 44,
        scrollSnapAlign: "start",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-raised)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg)"; }}
    >
      {/* Header: flag · name · exchange badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, overflow: "hidden" }}>
          <span style={{ fontSize: "0.875rem", flexShrink: 0, lineHeight: 1 }}>{market.flag}</span>
          <span
            className="t-micro"
            style={{ color: "var(--ink)", fontWeight: 700, letterSpacing: "0.06em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {market.name.toUpperCase()}
          </span>
        </div>
        <span
          className="t-micro"
          style={{
            color: "var(--muted)",
            border: "1px solid var(--line-dim)",
            padding: "0 3px",
            letterSpacing: "0.04em",
            flexShrink: 0,
            lineHeight: "1.6",
          }}
        >
          {market.exchange}
        </span>
      </div>

      {/* Index price — large mono */}
      <div
        className="t-mono"
        style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.1, marginTop: 2 }}
      >
        {quote
          ? quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : "—"}
      </div>

      {/* Today % change + absolute pts */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div
          className="t-mono"
          style={{ fontSize: "var(--text-body)", color: todayColor, lineHeight: 1 }}
        >
          {quote
            ? `${quote.changePct >= 0 ? "+" : ""}${quote.changePct.toFixed(2)}%`
            : "—"}
        </div>
        {quote?.change != null && (
          <span className="t-mono" style={{ fontSize: "var(--text-micro)", color: todayColor, opacity: 0.75 }}>
            {quote.change >= 0 ? "+" : ""}{Math.abs(quote.change) >= 1000
              ? (quote.change / 1000).toFixed(1) + "k"
              : quote.change.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
        )}
      </div>

      {/* 52-week range bar */}
      {quote && quote.high52w > 0 && quote.low52w > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 3 }}>
          {/* Bar track */}
          <div style={{ position: "relative", height: 3, background: "var(--line-dim)" }}>
            {(() => {
              const span = quote.high52w - quote.low52w;
              const pct  = span > 0 ? Math.min(100, Math.max(0, ((quote.price - quote.low52w) / span) * 100)) : 50;
              return (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    width: `${pct}%`,
                    height: "100%",
                    background: todayColor,
                  }}
                />
              );
            })()}
          </div>
          {/* H / L labels */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="t-mono" style={{ fontSize: "0.6rem", color: "var(--muted)" }}>
              {quote.low52w.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="t-micro" style={{ color: "var(--muted)", letterSpacing: "0.05em" }}>52W</span>
            <span className="t-mono" style={{ fontSize: "0.6rem", color: "var(--muted)" }}>
              {quote.high52w.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* Hairline divider */}
      <div style={{ borderTop: "1px solid var(--line-dim)", margin: "3px 0" }} />

      {/* YTD sparkline */}
      <YtdSparkline points={ytdPoints} color={ytdColor} />

      {/* YTD % */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
        <span className="t-micro" style={{ color: "var(--muted)", letterSpacing: "0.08em" }}>YTD</span>
        <span
          className="t-mono"
          style={{ fontSize: "var(--text-micro)", color: ytdColor, fontWeight: 600 }}
        >
          {ytdPct != null
            ? `${ytdPct >= 0 ? "+" : ""}${ytdPct.toFixed(1)}%`
            : "—"}
        </span>
      </div>

      {/* Hairline divider */}
      <div style={{ borderTop: "1px solid var(--line-dim)", margin: "3px 0" }} />

      {/* Constituent stocks — lazy-fetched */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {market.constituents.map(c => (
          <ConstituentRow key={c.symbol} symbol={c.symbol} label={c.label} />
        ))}
      </div>

      {/* Foreign flow — SET only */}
      {foreignFlow && market.symbol === "^SET.BK" && (
        <>
          <div style={{ borderTop: "1px solid var(--line-dim)", margin: "3px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span className="t-micro" style={{ color: "var(--muted)", letterSpacing: "0.08em" }}>FOREIGN FLOW</span>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="t-mono" style={{ fontSize: "var(--text-micro)", color: "var(--dim)" }}>5D</span>
              <span className="t-mono" style={{ fontSize: "var(--text-micro)", color: foreignFlow.d5 >= 0 ? "var(--bull)" : "var(--bear)" }}>
                {foreignFlow.d5 >= 0 ? "+" : ""}{foreignFlow.d5.toLocaleString()}M
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="t-mono" style={{ fontSize: "var(--text-micro)", color: "var(--dim)" }}>20D</span>
              <span className="t-mono" style={{ fontSize: "var(--text-micro)", color: foreignFlow.d20 >= 0 ? "var(--bull)" : "var(--bear)" }}>
                {foreignFlow.d20 >= 0 ? "+" : ""}{foreignFlow.d20.toLocaleString()}M
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────

interface Props {
  quotes?: YahooQuote[];
  histories?: Record<string, HistoryPoint[]>;
  foreignFlow?: { d5: number; d20: number };
}

export function MarketColumns({ quotes = [], histories = {}, foreignFlow }: Props) {
  const JAN1_MS = useMemo(
    () => new Date(`${new Date().getFullYear()}-01-01T00:00:00Z`).getTime(),
    [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Strip header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          padding: "5px 10px",
          borderBottom: "1px solid var(--line-dim)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="t-micro" style={{ color: "var(--muted)", letterSpacing: "0.14em" }}>
            MAJOR MARKETS · YTD
          </span>
          <span className="t-mono" style={{ fontSize: "var(--text-micro)", color: "var(--dim)" }}>
            ← SWIPE →
          </span>
        </div>
        <IntelligenceStrip setQuote={quotes.find(q => q.symbol === "^SET.BK")} />
      </div>

      {/* Horizontal scroll strip */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowX: "auto",
          overflowY: "hidden",
          display: "flex",
          alignItems: "stretch",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
        }}
      >
        {MARKETS.map(m => {
          const quote      = quotes.find(q => q.symbol === m.symbol);
          const allPoints  = histories[m.symbol] ?? [];
          const ytdPoints  = allPoints.filter(p => p.t >= JAN1_MS);
          return (
            <MarketCard
              key={m.symbol}
              market={m}
              quote={quote}
              ytdPoints={ytdPoints}
              foreignFlow={m.symbol === "^SET.BK" ? foreignFlow : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
