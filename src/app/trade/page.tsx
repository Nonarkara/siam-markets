"use client";

/**
 * Trade Desk · viewport-locked, 6-tab Bloomberg-style command center.
 *
 *   SIGNAL · INDICATORS · LEVELS · FUNDAMENTALS · FLOW · MACRO
 *
 * Every retail pain-point we can compute locally is exposed:
 *   • Multi-MA trend stack + ADX / Stochastic / Williams %R / OBV
 *   • Pivot points, 52w range percentile, volume profile (POC/VAH/VAL)
 *   • Per-symbol fundamentals + peer comparison + dividend / earnings
 *     calendar + analyst consensus
 *   • Foreign flow snapshot + unusual volume + day-of-week pattern
 *   • Macro sensitivity (Brent / yields / USD/THB) with rationale
 */

import { useState, useMemo, useEffect } from "react";
import { Tabs } from "@/components/Tabs/Tabs";
import { RegimeGauge } from "@/components/Causal/RegimeGauge";
import {
  ema, rsi, macd, bollingerBands, vwap, detectRegime,
  detectPattern, findSupportResistance, generateSignal,
  regimeLabel, regimeColor, patternLabel,
} from "@/lib/technical";
import {
  adx, stochastic, williamsR, obv, pivotPoints, rangePercentile,
  volumeProfile, recentReturns, realizedVol, sharpeLite, gapStats,
  dayOfWeekStats, maDistances, streak, unusualVolume, projectedRange,
  indicatorSummary,
} from "@/lib/trade-insights";
import { getReference, peersOf } from "@/lib/trade-reference";
import { calculatePositionSize } from "@/lib/trading";
import { MOCK_OHLCV_PTT, MOCK_OHLCV_ADVANC, MOCK_OHLCV_KBANK, MOCK_TRADING_NEWS } from "@/lib/api/mock";
import { fmtNum, pctColor } from "@/lib/format";
import { DataFreshness } from "@/components/DataFreshness/DataFreshness";
import type { OHLCV } from "@/lib/types";
import type { OhlcvResponse } from "@/app/api/ohlcv/route";

// Canonical 3 SET tickers wired to live OHLCV via /api/ohlcv.
// `data` starts as the mock fallback; useEffect swaps it to live data on mount.
const STOCKS: { symbol: string; name: string; mock: OHLCV[] }[] = [
  { symbol: "PTT.BK",    name: "PTT",            mock: MOCK_OHLCV_PTT    },
  { symbol: "ADVANC.BK", name: "Advanced Info",  mock: MOCK_OHLCV_ADVANC },
  { symbol: "KBANK.BK",  name: "Kasikorn Bank",  mock: MOCK_OHLCV_KBANK  },
];

// ─── Page ───────────────────────────────────────────────────────

export default function TradePage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [accountSize, setAccountSize] = useState(100_000);
  const [riskPct, setRiskPct] = useState(1);

  const stock = STOCKS[selectedIdx];

  // Live OHLCV fetch with mock fallback. State lives per-symbol via key in
  // a Map so switching tabs doesn't re-fetch what we already have.
  const [ohlcvBySymbol, setOhlcvBySymbol] = useState<Record<string, { data: OHLCV[]; source: "live"|"mock"; lastUpdated: string; note: string }>>({});

  useEffect(() => {
    if (ohlcvBySymbol[stock.symbol]) return;     // already loaded
    let cancelled = false;
    fetch(`/api/ohlcv?symbol=${encodeURIComponent(stock.symbol)}&range=3mo&interval=1d`)
      .then(r => r.json() as Promise<OhlcvResponse>)
      .then(payload => {
        if (cancelled) return;
        setOhlcvBySymbol(prev => ({
          ...prev,
          [stock.symbol]: {
            data:        payload.points,
            source:      payload.source,
            lastUpdated: payload.lastUpdated,
            note:        payload.note,
          },
        }));
      })
      .catch(() => {
        if (cancelled) return;
        // Network-level failure — fall back to mock
        setOhlcvBySymbol(prev => ({
          ...prev,
          [stock.symbol]: {
            data:        stock.mock,
            source:      "mock",
            lastUpdated: stock.mock[stock.mock.length - 1]?.date ?? new Date().toISOString(),
            note:        "Network error — using synthetic OHLCV. Do not trade on this data.",
          },
        }));
      });
    return () => { cancelled = true; };
  }, [stock.symbol]);

  const live = ohlcvBySymbol[stock.symbol];
  const data = live?.data ?? stock.mock;     // graceful fallback while loading
  const dataSource: "live" | "mock" = live?.source ?? "mock";
  const lastUpdated = live?.lastUpdated ?? null;
  const current = data[data.length - 1];
  const ref = getReference(stock.symbol);
  const peers = peersOf(stock.symbol);

  const tech = useMemo(() => {
    const closes = data.map(d => d.close);
    return {
      ema9:  ema(closes, 9)[closes.length - 1],
      ema21: ema(closes, 21)[closes.length - 1],
      rsi:   rsi(closes, 14)[closes.length - 1],
      macd:  macd(closes),
      bb:    bollingerBands(closes),
      vwap:  vwap(data)[data.length - 1],
      regime:  detectRegime(data),
      pattern: detectPattern(data),
      sr:      findSupportResistance(data),
      signal:  generateSignal(data, findSupportResistance(data)),
      adx:        adx(data, 14),
      stoch:      stochastic(data, 14, 3),
      williams:   williamsR(data, 14),
      obv:        obv(data),
      pivots:     pivotPoints(data),
      range:      rangePercentile(data),
      profile:    volumeProfile(data, 12),
      returns:    recentReturns(data),
      vol:        realizedVol(data, 20),
      sharpe:     sharpeLite(data),
      gaps:       gapStats(data),
      dow:        dayOfWeekStats(data),
      mas:        maDistances(data),
      streak:     streak(data),
      unusualVol: unusualVolume(data),
      projected:  projectedRange(data),
      summary:    indicatorSummary(data),
    };
  }, [data]);

  const sizing = useMemo(() => {
    if (!tech.signal.entry || !tech.signal.stopLoss) return null;
    return calculatePositionSize({
      accountSize, riskPct,
      entryPrice: tech.signal.entry, stopLoss: tech.signal.stopLoss,
    }, tech.signal.target);
  }, [tech.signal, accountSize, riskPct]);

  const priceChange = ((current.close - data[data.length - 2].close) / data[data.length - 2].close) * 100;

  return (
    <div className="dashboard-page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="dashboard-page__header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Title */}
          <div>
            <div className="t-micro">DAY TRADING COMMAND CENTER</div>
            <h1 className="t-display" style={{ fontSize: "1.25rem", lineHeight: 1.1, marginTop: 2 }}>
              Trade Desk
            </h1>
            <div style={{ marginTop: 6 }}>
              <DataFreshness
                timestamp={lastUpdated}
                source={dataSource}
                label="Yahoo Finance · OHLCV"
                warnAfterMinutes={1440}   // EOD data — 1d before "stale"
                staleAfterMinutes={4320}  // 3d before "offline"
              />
            </div>
          </div>

          {/* Symbol + price hero — compact row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 320, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {STOCKS.map((s, i) => (
              <button
                key={s.symbol}
                onClick={() => setSelectedIdx(i)}
                style={{
                  background: selectedIdx === i ? "var(--bg-hover)" : "transparent",
                  border: `1px solid ${selectedIdx === i ? "var(--bull)" : "var(--line)"}`,
                  color: selectedIdx === i ? "var(--bull)" : "var(--muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "6px 12px",
                  cursor: "pointer",
                  minHeight: 36,
                }}
              >
                {s.symbol.replace(".BK", "")}
              </button>
            ))}
            <div style={{
              borderLeft: "1px solid var(--line)",
              paddingLeft: 14,
              marginLeft: 4,
              display: "flex",
              alignItems: "baseline",
              gap: 10,
            }}>
              <div className="t-mono" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                ฿{fmtNum(current.close, 2)}
              </div>
              <div className="t-mono" style={{ fontSize: "0.9375rem", color: pctColor(priceChange), fontWeight: 600 }}>
                {priceChange >= 0 ? "+" : ""}{fmtNum(priceChange, 2)}%
              </div>
              <div className="t-micro" style={{ color: "var(--muted)" }}>
                vol {tech.unusualVol.ratio.toFixed(1)}× · {tech.unusualVol.label.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs body ──────────────────────────────────────────── */}
      <div className="dashboard-page__body">
        <Tabs
          defaultId="signal"
          tabs={[
            { id: "signal",       label: "SIGNAL",       badge: `${tech.summary.bullish}↑${tech.summary.bearish}↓`, content: <SignalTab tech={tech} current={current} sizing={sizing} accountSize={accountSize} riskPct={riskPct} onAccount={setAccountSize} onRisk={setRiskPct} /> },
            { id: "indicators",   label: "INDICATORS",   badge: `${tech.summary.bullish}/${tech.summary.total}`,    content: <IndicatorsTab tech={tech} current={current} /> },
            { id: "levels",       label: "LEVELS",       badge: `${tech.range.percentile.toFixed(0)}%`,             content: <LevelsTab tech={tech} current={current} /> },
            { id: "fundamentals", label: "FUNDAMENTALS", badge: ref ? `${ref.pe.toFixed(1)}x` : "—",                content: <FundamentalsTab ref={ref} peers={peers} current={current.close} /> },
            { id: "flow",         label: "FLOW",         badge: ref ? `${ref.foreignFlow.d20Net >= 0 ? "+" : ""}${ref.foreignFlow.d20Net}M` : "—", content: <FlowTab tech={tech} ref={ref} /> },
            { id: "macro",        label: "MACRO",        badge: ref ? `β${ref.beta.toFixed(2)}` : "—",              content: <MacroTab ref={ref} /> },
          ]}
        />
      </div>
    </div>
  );
}

// ─── Reusable ──────────────────────────────────────────────────

function Scroller({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16 }}>{children}</div>;
}

function Card({ children, accent, style }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties }) {
  return (
    <div className="card" style={{ borderLeft: accent ? `3px solid ${accent}` : undefined, padding: 12, ...style }}>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <div className="t-micro">{label}</div>
      <div className="t-mono" style={{ fontSize: "0.9375rem", fontWeight: 700, color: color ?? "var(--ink)", marginTop: 2 }}>
        {value}
      </div>
      {sub && <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatusBar({ pct, label, color }: { pct: number; label?: string; color?: string }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg-raised)", border: "1px solid var(--line)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, width: `${w}%`, background: color ?? "var(--tech)" }} />
      </div>
      {label && <span className="t-mono" style={{ fontSize: "0.6875rem", color: color ?? "var(--muted)", minWidth: 40, textAlign: "right" }}>{label}</span>}
    </div>
  );
}

type Tech = ReturnType<typeof useTech>;
// (helper alias for inner-function typings — we only use the structure)
function useTech() {
  return null as unknown as {
    ema9: number; ema21: number; rsi: number;
    macd: ReturnType<typeof macd>;
    bb: ReturnType<typeof bollingerBands>;
    vwap: number;
    regime: ReturnType<typeof detectRegime>;
    pattern: ReturnType<typeof detectPattern>;
    sr: ReturnType<typeof findSupportResistance>;
    signal: ReturnType<typeof generateSignal>;
    adx: ReturnType<typeof adx>;
    stoch: ReturnType<typeof stochastic>;
    williams: number;
    obv: ReturnType<typeof obv>;
    pivots: ReturnType<typeof pivotPoints>;
    range: ReturnType<typeof rangePercentile>;
    profile: ReturnType<typeof volumeProfile>;
    returns: ReturnType<typeof recentReturns>;
    vol: number;
    sharpe: number;
    gaps: ReturnType<typeof gapStats>;
    dow: ReturnType<typeof dayOfWeekStats>;
    mas: ReturnType<typeof maDistances>;
    streak: ReturnType<typeof streak>;
    unusualVol: ReturnType<typeof unusualVolume>;
    projected: ReturnType<typeof projectedRange>;
    summary: ReturnType<typeof indicatorSummary>;
  };
}

// ─── SIGNAL tab ────────────────────────────────────────────────

function SignalTab({
  tech, current, sizing, accountSize, riskPct, onAccount, onRisk,
}: {
  tech: Tech;
  current: OHLCV;
  sizing: ReturnType<typeof calculatePositionSize> | null;
  accountSize: number;
  riskPct: number;
  onAccount: (n: number) => void;
  onRisk: (n: number) => void;
}) {
  const signalColor = tech.signal.type === "buy" ? "var(--bull)" : tech.signal.type === "sell" ? "var(--bear)" : "var(--muted)";
  const biasColor = tech.summary.bias === "bullish" ? "var(--bull)" : tech.summary.bias === "bearish" ? "var(--bear)" : "var(--muted)";

  return (
    <Scroller>
      <div className="grid-2" style={{ gap: 12 }}>
        {/* Snapshot */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>SNAPSHOT</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <Stat label="Open"   value={`฿${fmtNum(current.open, 2)}`} />
            <Stat label="High"   value={`฿${fmtNum(current.high, 2)}`} />
            <Stat label="Low"    value={`฿${fmtNum(current.low, 2)}`} />
            <Stat label="Volume" value={`${(current.volume / 1_000_000).toFixed(1)}M`} sub={`${tech.unusualVol.ratio.toFixed(1)}× avg`} color={tech.unusualVol.color} />
            <Stat label="Range"  value={`${(((current.high - current.low) / current.close) * 100).toFixed(2)}%`} sub={`ATR ${fmtNum(tech.projected.atr, 2)}`} />
            <Stat label="Pattern" value={patternLabel(tech.pattern).split(" — ")[0]} color="var(--caution)" />
          </div>
        </Card>

        {/* Regime + AI Signal */}
        <Card accent={regimeColor(tech.regime.regime)}>
          <div className="t-micro" style={{ marginBottom: 8 }}>MARKET REGIME · AI SIGNAL</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="t-body" style={{ fontWeight: 700, color: regimeColor(tech.regime.regime), fontSize: "0.9375rem" }}>
                {regimeLabel(tech.regime.regime)}
              </div>
              <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4 }}>
                Trend {tech.regime.trendStrength} · Vol {tech.regime.volatility.toFixed(2)}%
              </div>
              <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4 }}>
                ADX {tech.adx.adx.toFixed(0)} · streak {tech.streak.length}d {tech.streak.direction}
              </div>
            </div>
            <div>
              <div className="t-body" style={{ fontWeight: 700, color: signalColor, textTransform: "uppercase", fontSize: "0.9375rem" }}>
                {tech.signal.type} · {tech.signal.confidence}%
              </div>
              <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
                {tech.signal.reasons[0] ?? "Analyzing..."}
              </div>
              <div className="t-micro" style={{ color: biasColor, marginTop: 4, letterSpacing: "0.1em" }}>
                INDICATOR BIAS · {tech.summary.bullish}↑ / {tech.summary.bearish}↓ → {tech.summary.bias.toUpperCase()}
              </div>
            </div>
          </div>
        </Card>

        {/* Position sizer */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <div className="t-micro" style={{ marginBottom: 8 }}>POSITION SIZER · 1% RISK RULE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "end" }}>
            <div>
              <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>ACCOUNT (฿)</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => onAccount(Number(e.target.value))}
                className="t-mono"
                style={{ width: "100%", background: "var(--bg-raised)", border: "1px solid var(--line)", color: "var(--ink)", padding: "8px 10px", fontSize: "0.8125rem", minHeight: 36 }}
              />
            </div>
            <div>
              <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>RISK %</label>
              <input
                type="number" step="0.25"
                value={riskPct}
                onChange={(e) => onRisk(Number(e.target.value))}
                className="t-mono"
                style={{ width: "100%", background: "var(--bg-raised)", border: "1px solid var(--line)", color: "var(--ink)", padding: "8px 10px", fontSize: "0.8125rem", minHeight: 36 }}
              />
            </div>
            {sizing && tech.signal.entry ? (
              <>
                <Stat label="Entry"  value={`฿${fmtNum(tech.signal.entry, 2)}`}    />
                <Stat label="Stop"   value={`฿${fmtNum(tech.signal.stopLoss!, 2)}`} color="var(--bear)" />
                <Stat label="Target" value={`฿${fmtNum(tech.signal.target!, 2)}`}  color="var(--bull)" />
                <Stat label={`R:R · ${sizing.shares}sh`}
                      value={`1 : ${sizing.riskReward?.toFixed(2) ?? "0"}`}
                      sub={`฿${fmtNum(sizing.notional, 0)} · risk ฿${fmtNum(sizing.riskAmount, 0)}`}
                      color="var(--caution)" />
              </>
            ) : (
              <div style={{ gridColumn: "3 / -1" }}>
                <div className="t-micro" style={{ color: "var(--muted)" }}>
                  No actionable entry from current signal — wait for setup
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* News */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <div className="t-micro" style={{ marginBottom: 8 }}>SYMBOL NEWS · SENTIMENT</div>
          <div style={{ display: "grid", gap: 6 }}>
            {MOCK_TRADING_NEWS.slice(0, 4).map((n, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, padding: "8px 10px", background: "var(--bg-raised)", border: "1px solid var(--line)", alignItems: "center" }}>
                <div className="t-body" style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>{n.headline}</div>
                <div className="t-micro" style={{ color: "var(--muted)" }}>{n.time} · {n.impact.toUpperCase()}</div>
                <div className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 600, color: n.sentiment > 0 ? "var(--bull)" : n.sentiment < 0 ? "var(--bear)" : "var(--muted)" }}>
                  {n.sentiment > 0 ? "+" : ""}{n.sentiment.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Disclaimer */}
        <div className="card" style={{ background: "var(--bear-10)", borderColor: "var(--bear)", gridColumn: "1 / -1", padding: "10px 14px" }}>
          <div className="t-body" style={{ color: "var(--bear)", fontSize: "0.75rem", lineHeight: 1.5 }}>
            <strong>WARNING:</strong> ~90% of day traders lose money. Never risk more than 1–2% per trade. Always paper trade first.
          </div>
        </div>
      </div>
    </Scroller>
  );
}

// ─── INDICATORS tab ────────────────────────────────────────────

function IndicatorsTab({ tech, current }: { tech: Tech; current: OHLCV }) {
  const cards: { group: string; items: { label: string; value: string; status: string; color: string }[] }[] = [
    {
      group: "TREND",
      items: [
        { label: "EMA 9 / 21",      value: `${fmtNum(tech.ema9, 2)} / ${fmtNum(tech.ema21, 2)}`,             status: tech.ema9 > tech.ema21 ? "Bullish cross" : "Bearish cross",       color: tech.ema9 > tech.ema21 ? "var(--bull)" : "var(--bear)" },
        { label: "EMA 50",          value: `฿${fmtNum(tech.mas.ma50.value, 2)}`,                              status: `${tech.mas.ma50.pct >= 0 ? "+" : ""}${tech.mas.ma50.pct.toFixed(2)}% above`, color: tech.mas.ma50.pct >= 0 ? "var(--bull)" : "var(--bear)" },
        { label: "EMA 200",         value: `฿${fmtNum(tech.mas.ma200.value, 2)}`,                             status: `${tech.mas.ma200.pct >= 0 ? "+" : ""}${tech.mas.ma200.pct.toFixed(2)}% above`, color: tech.mas.ma200.pct >= 0 ? "var(--bull)" : "var(--bear)" },
        { label: "ADX (14)",        value: tech.adx.adx.toFixed(1),                                            status: tech.adx.adx > 25 ? "Strong trend" : tech.adx.adx > 20 ? "Trending" : "Ranging", color: tech.adx.adx > 25 ? "var(--bull)" : "var(--muted)" },
        { label: "+DI / −DI",       value: `${tech.adx.plusDI.toFixed(1)} / ${tech.adx.minusDI.toFixed(1)}`,   status: tech.adx.plusDI > tech.adx.minusDI ? "Bull pressure" : "Bear pressure",   color: tech.adx.plusDI > tech.adx.minusDI ? "var(--bull)" : "var(--bear)" },
        { label: "Streak",          value: `${tech.streak.length} day(s)`,                                     status: tech.streak.direction.toUpperCase(),                                       color: tech.streak.direction === "up" ? "var(--bull)" : tech.streak.direction === "down" ? "var(--bear)" : "var(--muted)" },
      ],
    },
    {
      group: "MOMENTUM",
      items: [
        { label: "RSI (14)",        value: tech.rsi.toFixed(1),                                                status: tech.rsi > 70 ? "Overbought" : tech.rsi < 30 ? "Oversold" : "Neutral",     color: tech.rsi > 70 ? "var(--bear)" : tech.rsi < 30 ? "var(--bull)" : "var(--muted)" },
        { label: "MACD",            value: fmtNum(tech.macd.macd[tech.macd.macd.length - 1] ?? 0, 3),          status: (tech.macd.macd[tech.macd.macd.length - 1] ?? 0) > (tech.macd.signal[tech.macd.signal.length - 1] ?? 0) ? "Above signal" : "Below signal", color: (tech.macd.macd[tech.macd.macd.length - 1] ?? 0) > (tech.macd.signal[tech.macd.signal.length - 1] ?? 0) ? "var(--bull)" : "var(--bear)" },
        { label: "Stochastic %K",   value: tech.stoch.k.toFixed(1),                                            status: tech.stoch.k > 80 ? "Overbought" : tech.stoch.k < 20 ? "Oversold" : "Neutral", color: tech.stoch.k > 80 ? "var(--bear)" : tech.stoch.k < 20 ? "var(--bull)" : "var(--muted)" },
        { label: "Stochastic %D",   value: tech.stoch.d.toFixed(1),                                            status: tech.stoch.k > tech.stoch.d ? "%K above %D" : "%K below %D",                color: tech.stoch.k > tech.stoch.d ? "var(--bull)" : "var(--bear)" },
        { label: "Williams %R",     value: tech.williams.toFixed(1),                                           status: tech.williams > -20 ? "Overbought" : tech.williams < -80 ? "Oversold" : "Neutral", color: tech.williams > -20 ? "var(--bear)" : tech.williams < -80 ? "var(--bull)" : "var(--muted)" },
        { label: "Sharpe-lite (60d)", value: tech.sharpe.toFixed(2),                                           status: tech.sharpe > 1 ? "Strong" : tech.sharpe > 0 ? "Modest" : "Negative",       color: tech.sharpe > 1 ? "var(--bull)" : tech.sharpe > 0 ? "var(--muted)" : "var(--bear)" },
      ],
    },
    {
      group: "VOLATILITY · VOLUME",
      items: [
        { label: "Bollinger",       value: `฿${fmtNum(tech.bb.lower[tech.bb.lower.length - 1] ?? 0, 2)} – ฿${fmtNum(tech.bb.upper[tech.bb.upper.length - 1] ?? 0, 2)}`, status: current.close < (tech.bb.lower[tech.bb.lower.length - 1] ?? 0) ? "Below" : current.close > (tech.bb.upper[tech.bb.upper.length - 1] ?? 0) ? "Above" : "Inside", color: current.close < (tech.bb.lower[tech.bb.lower.length - 1] ?? 0) ? "var(--bull)" : current.close > (tech.bb.upper[tech.bb.upper.length - 1] ?? 0) ? "var(--bear)" : "var(--muted)" },
        { label: "BB Width",        value: `${fmtNum(tech.bb.bandwidth[tech.bb.bandwidth.length - 1] ?? 0, 2)}%`, status: (tech.bb.bandwidth[tech.bb.bandwidth.length - 1] ?? 0) < 2 ? "Squeeze" : (tech.bb.bandwidth[tech.bb.bandwidth.length - 1] ?? 0) > 6 ? "Expansion" : "Normal", color: (tech.bb.bandwidth[tech.bb.bandwidth.length - 1] ?? 0) < 2 ? "var(--caution)" : "var(--muted)" },
        { label: "ATR (14)",        value: `฿${fmtNum(tech.projected.atr, 2)}`,                                status: `±${((tech.projected.atr / current.close) * 100).toFixed(2)}% / day`,    color: "var(--muted)" },
        { label: "Realized Vol",    value: `${tech.vol.toFixed(1)}%`,                                          status: tech.vol > 30 ? "High" : tech.vol > 18 ? "Average" : "Calm",               color: tech.vol > 30 ? "var(--bear)" : "var(--muted)" },
        { label: "VWAP",            value: `฿${fmtNum(tech.vwap, 2)}`,                                         status: current.close > tech.vwap ? "Above (bull)" : "Below (bear)",              color: current.close > tech.vwap ? "var(--bull)" : "var(--bear)" },
        { label: "OBV trend",       value: `${tech.obv.pctChange >= 0 ? "+" : ""}${tech.obv.pctChange.toFixed(1)}%`, status: tech.obv.trend.toUpperCase(),                                       color: tech.obv.trend === "rising" ? "var(--bull)" : tech.obv.trend === "falling" ? "var(--bear)" : "var(--muted)" },
      ],
    },
  ];

  return (
    <Scroller>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Indicator bias summary */}
        <Card accent={tech.summary.bias === "bullish" ? "var(--bull)" : tech.summary.bias === "bearish" ? "var(--bear)" : "var(--muted)"}>
          <div className="t-micro" style={{ marginBottom: 6 }}>INDICATOR SUMMARY</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center" }}>
            <div className="t-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: tech.summary.bias === "bullish" ? "var(--bull)" : tech.summary.bias === "bearish" ? "var(--bear)" : "var(--muted)" }}>
              {tech.summary.bullish}↑ {tech.summary.bearish}↓
            </div>
            <div>
              <StatusBar pct={(tech.summary.bullish / tech.summary.total) * 100} color="var(--bull)" />
              <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4 }}>
                {tech.summary.bullish} of {tech.summary.total} signals bullish · bias {tech.summary.bias.toUpperCase()}
              </div>
            </div>
          </div>
        </Card>

        {cards.map(g => (
          <div key={g.group}>
            <div className="t-micro" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>{g.group}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {g.items.map(it => (
                <div key={it.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", padding: "10px 12px" }}>
                  <div className="t-micro">{it.label}</div>
                  <div className="t-mono" style={{ fontSize: "0.9375rem", fontWeight: 700, marginTop: 2 }}>{it.value}</div>
                  <div className="t-micro" style={{ color: it.color, marginTop: 2 }}>{it.status}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Scroller>
  );
}

// ─── LEVELS tab ────────────────────────────────────────────────

function LevelsTab({ tech, current }: { tech: Tech; current: OHLCV }) {
  // Range bar
  const r = tech.range;

  // Volume profile max for scaling
  const maxBin = Math.max(...tech.profile.bins.map(b => b.volume));

  return (
    <Scroller>
      <div className="grid-2" style={{ gap: 12, alignItems: "start" }}>
        {/* 52w range + percentile */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>52-WEEK RANGE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
            <Stat label="Low"  value={`฿${fmtNum(r.low52, 2)}`}  sub={`${r.distFromLow >= 0 ? "+" : ""}${r.distFromLow.toFixed(1)}% from low`}  color="var(--bull)" />
            <Stat label="Now"  value={`฿${fmtNum(r.current, 2)}`} sub={`${r.percentile.toFixed(0)}th percentile`} color="var(--ink)" />
            <Stat label="High" value={`฿${fmtNum(r.high52, 2)}`} sub={`${r.distFromHigh.toFixed(1)}% from high`}  color="var(--bear)" />
          </div>
          <StatusBar
            pct={r.percentile}
            color={r.percentile > 80 ? "var(--bear)" : r.percentile < 20 ? "var(--bull)" : "var(--tech)"}
            label={`${r.percentile.toFixed(0)}%`}
          />
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 6 }}>
            {r.percentile > 80
              ? "Near 52-week highs — momentum buyers active, mean-revert risk"
              : r.percentile < 20
              ? "Near 52-week lows — value entry, but catch-knife risk"
              : "Mid-range — directionless zone, wait for breakout/breakdown"}
          </div>
        </Card>

        {/* Pivot points */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>CLASSIC PIVOTS · INTRADAY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <Row label="R3" value={tech.pivots.r3} current={current.close} hi />
              <Row label="R2" value={tech.pivots.r2} current={current.close} hi />
              <Row label="R1" value={tech.pivots.r1} current={current.close} hi />
            </div>
            <div>
              <Row label="P"  value={tech.pivots.p}  current={current.close} mid />
              <Row label="S1" value={tech.pivots.s1} current={current.close} lo />
              <Row label="S2" value={tech.pivots.s2} current={current.close} lo />
              <Row label="S3" value={tech.pivots.s3} current={current.close} lo />
            </div>
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 10 }}>
            ATR projection today: ฿{fmtNum(tech.projected.low, 2)} – ฿{fmtNum(tech.projected.high, 2)}
          </div>
        </Card>

        {/* Support & resistance zones */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>SUPPORT & RESISTANCE ZONES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="t-micro" style={{ color: "var(--bull)", marginBottom: 6 }}>SUPPORT</div>
              {tech.sr.support.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
                  <span className="t-mono" style={{ fontSize: "0.8125rem" }}>฿{fmtNum(s.price, 2)}</span>
                  <span className="t-micro" style={{ color: "var(--muted)" }}>{s.touches}× · {s.strength}</span>
                </div>
              ))}
              {tech.sr.support.length === 0 && <div className="t-micro" style={{ color: "var(--dim)" }}>No clear support</div>}
            </div>
            <div>
              <div className="t-micro" style={{ color: "var(--bear)", marginBottom: 6 }}>RESISTANCE</div>
              {tech.sr.resistance.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
                  <span className="t-mono" style={{ fontSize: "0.8125rem" }}>฿{fmtNum(s.price, 2)}</span>
                  <span className="t-micro" style={{ color: "var(--muted)" }}>{s.touches}× · {s.strength}</span>
                </div>
              ))}
              {tech.sr.resistance.length === 0 && <div className="t-micro" style={{ color: "var(--dim)" }}>No clear resistance</div>}
            </div>
          </div>
        </Card>

        {/* Volume profile */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>VOLUME PROFILE · PRICE BY VOLUME</div>
          <div style={{ display: "flex", flexDirection: "column-reverse", gap: 2, marginBottom: 10 }}>
            {tech.profile.bins.map((b, i) => {
              const isCurrent = current.close >= b.priceLow && current.close < b.priceHigh;
              const isPOC = (tech.profile.poc >= b.priceLow && tech.profile.poc < b.priceHigh);
              const w = maxBin ? (b.volume / maxBin) * 100 : 0;
              const inVA = tech.profile.val < tech.profile.vah && (b.priceLow + b.priceHigh) / 2 >= tech.profile.val && (b.priceLow + b.priceHigh) / 2 <= tech.profile.vah;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 8, alignItems: "center" }}>
                  <span className="t-mono" style={{ fontSize: "0.625rem", color: isPOC ? "var(--braun-yellow, #ffd000)" : isCurrent ? "var(--tech)" : "var(--muted)", textAlign: "right" }}>
                    ฿{((b.priceLow + b.priceHigh) / 2).toFixed(2)}
                  </span>
                  <div style={{ position: "relative", height: 14, background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
                    <div style={{ position: "absolute", inset: 0, width: `${w}%`, background: isPOC ? "var(--braun-yellow, #ffd000)" : inVA ? "var(--tech)" : "var(--dim)", opacity: isPOC ? 0.85 : inVA ? 0.7 : 0.45 }} />
                    {isCurrent && <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 2, background: "var(--bear)" }} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <Stat label="POC"  value={`฿${fmtNum(tech.profile.poc, 2)}`} color="var(--braun-yellow, #ffd000)" />
            <Stat label="VAH"  value={`฿${fmtNum(tech.profile.vah, 2)}`} color="var(--bear)" />
            <Stat label="VAL"  value={`฿${fmtNum(tech.profile.val, 2)}`} color="var(--bull)" />
          </div>
        </Card>
      </div>
    </Scroller>
  );
}

function Row({ label, value, current, hi, lo, mid }: { label: string; value: number; current: number; hi?: boolean; lo?: boolean; mid?: boolean }) {
  const isNear = Math.abs(value - current) / current < 0.005;
  const color = hi ? "var(--bear)" : lo ? "var(--bull)" : "var(--ink)";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--line)", background: isNear ? "var(--tech-10)" : "transparent" }}>
      <span className="t-micro" style={{ color: mid ? "var(--caution)" : color, fontWeight: mid ? 700 : 500 }}>{label}</span>
      <span className="t-mono" style={{ fontSize: "0.8125rem", color: isNear ? "var(--tech)" : "var(--ink)", fontWeight: isNear ? 700 : 500 }}>฿{fmtNum(value, 2)}</span>
    </div>
  );
}

// ─── FUNDAMENTALS tab ──────────────────────────────────────────

function FundamentalsTab({ ref, peers, current }: { ref: ReturnType<typeof getReference>; peers: ReturnType<typeof peersOf>; current: number }) {
  if (!ref) {
    return <Scroller><Card><div className="t-body" style={{ color: "var(--muted)" }}>No fundamentals on file.</div></Card></Scroller>;
  }

  const a = ref.analyst;
  const totalRatings = a.buy + a.hold + a.sell;
  const buyPct  = (a.buy  / totalRatings) * 100;
  const holdPct = (a.hold / totalRatings) * 100;
  const sellPct = (a.sell / totalRatings) * 100;
  const upsidePct = ((a.priceTargetAvg / current) - 1) * 100;

  return (
    <Scroller>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Thesis + identity */}
        <Card accent="var(--bull)">
          <div className="t-micro" style={{ marginBottom: 4 }}>{ref.sector.toUpperCase()} · {ref.industry.toUpperCase()}</div>
          <div className="t-body" style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 4 }}>{ref.name}</div>
          <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: 8 }}>{ref.nameTh}</div>
          <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--ink)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--bull)" }}>Bull case:</strong> {ref.thesis}
          </div>
          <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5, marginTop: 8 }}>
            <strong style={{ color: "var(--bear)" }}>Risks:</strong>
            <ul style={{ margin: "4px 0 0 18px" }}>
              {ref.risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </Card>

        {/* Valuation grid */}
        <div>
          <div className="t-micro" style={{ marginBottom: 8 }}>VALUATION · PROFITABILITY · LEVERAGE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            <Cell label="Market Cap" value={`฿${ref.marketCapBn.toFixed(0)}B`} />
            <Cell label="P/E"         value={`${ref.pe.toFixed(1)}x`}        color={ref.pe < 15 ? "var(--bull)" : ref.pe > 25 ? "var(--bear)" : "var(--ink)"} sub="SET avg 17.9" />
            <Cell label="Fwd P/E"     value={`${ref.forwardPe.toFixed(1)}x`} color={ref.forwardPe < ref.pe ? "var(--bull)" : "var(--bear)"} sub={ref.forwardPe < ref.pe ? "Earnings rising" : "Earnings falling"} />
            <Cell label="P/B"         value={`${ref.pb.toFixed(2)}x`}        color={ref.pb < 1 ? "var(--bull)" : ref.pb > 3 ? "var(--bear)" : "var(--ink)"} sub={ref.pb < 1 ? "Below book" : ""} />
            <Cell label="ROE"         value={`${ref.roe.toFixed(1)}%`}       color={ref.roe > 15 ? "var(--bull)" : ref.roe < 8 ? "var(--bear)" : "var(--ink)"} />
            <Cell label="ROA"         value={`${ref.roa.toFixed(1)}%`}       color={ref.roa > 5 ? "var(--bull)" : "var(--muted)"} />
            <Cell label="Debt/Equity" value={`${ref.debtEquity.toFixed(2)}`} color={ref.debtEquity < 1 ? "var(--bull)" : ref.debtEquity > 2 ? "var(--bear)" : "var(--ink)"} />
            <Cell label="FCF Yield"   value={ref.fcfYield ? `${ref.fcfYield.toFixed(1)}%` : "n/a"} color={ref.fcfYield > 6 ? "var(--bull)" : "var(--muted)"} />
            <Cell label="Div Yield"   value={`${ref.dividendYield.toFixed(1)}%`} color={ref.dividendYield > 4 ? "var(--bull)" : "var(--muted)"} sub={`Payout ${ref.payoutRatio}%`} />
            <Cell label="Rev 3y CAGR" value={`${ref.rev3yCagr >= 0 ? "+" : ""}${ref.rev3yCagr.toFixed(1)}%`} color={ref.rev3yCagr > 5 ? "var(--bull)" : ref.rev3yCagr < 0 ? "var(--bear)" : "var(--muted)"} />
            <Cell label="EPS 3y CAGR" value={`${ref.eps3yCagr >= 0 ? "+" : ""}${ref.eps3yCagr.toFixed(1)}%`} color={ref.eps3yCagr > 5 ? "var(--bull)" : ref.eps3yCagr < 0 ? "var(--bear)" : "var(--muted)"} />
            <Cell label="Beta vs SET" value={ref.beta.toFixed(2)} color="var(--muted)" />
            <Cell label="Free Float"  value={`${ref.freeFloat}%`} color="var(--muted)" />
            <Cell label="Foreign Own" value={`${ref.foreignFlow.ownership.toFixed(1)}%`} sub={`limit ${ref.foreignFlow.foreignLimit}%`} color="var(--muted)" />
          </div>
        </div>

        {/* Analyst consensus + price target */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>ANALYST CONSENSUS · {totalRatings} RATINGS</div>
          <div style={{ display: "flex", height: 12, border: "1px solid var(--line)", marginBottom: 8 }}>
            <div style={{ width: `${buyPct}%`,  background: "var(--bull)" }}    title={`Buy ${a.buy}`}  />
            <div style={{ width: `${holdPct}%`, background: "var(--caution)" }} title={`Hold ${a.hold}`} />
            <div style={{ width: `${sellPct}%`, background: "var(--bear)" }}    title={`Sell ${a.sell}`} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            <Stat label="Buy"  value={`${a.buy}`}  sub={`${buyPct.toFixed(0)}%`}  color="var(--bull)" />
            <Stat label="Hold" value={`${a.hold}`} sub={`${holdPct.toFixed(0)}%`} color="var(--caution)" />
            <Stat label="Sell" value={`${a.sell}`} sub={`${sellPct.toFixed(0)}%`} color="var(--bear)" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <Stat label="PT Low"  value={`฿${fmtNum(a.priceTargetLow, 0)}`} />
            <Stat label="PT Avg"  value={`฿${fmtNum(a.priceTargetAvg, 1)}`} sub={`${upsidePct >= 0 ? "+" : ""}${upsidePct.toFixed(1)}% upside`} color={upsidePct >= 0 ? "var(--bull)" : "var(--bear)"} />
            <Stat label="PT High" value={`฿${fmtNum(a.priceTargetHigh, 0)}`} />
          </div>
        </Card>

        {/* Peer comparison */}
        {peers.length > 0 && (
          <Card>
            <div className="t-micro" style={{ marginBottom: 8 }}>PEER COMPARISON · {ref.sector.toUpperCase()}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-raised)" }}>
                    {["Symbol", "Mcap (฿B)", "P/E", "P/B", "ROE", "Div Yld", "Debt/Eq"].map(h => (
                      <th key={h} className="t-micro" style={{ textAlign: h === "Symbol" ? "left" : "right", padding: "6px 8px", borderBottom: "1px solid var(--line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: "var(--bull-10)" }}>
                    <td className="t-mono" style={{ padding: "6px 8px", fontWeight: 700 }}>{ref.symbol.replace(".BK", "")} <span className="t-micro" style={{ color: "var(--bull)" }}>(this)</span></td>
                    <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{ref.marketCapBn.toFixed(0)}</td>
                    <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{ref.pe.toFixed(1)}</td>
                    <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{ref.pb.toFixed(2)}</td>
                    <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{ref.roe.toFixed(1)}%</td>
                    <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{ref.dividendYield.toFixed(1)}%</td>
                    <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{ref.debtEquity.toFixed(2)}</td>
                  </tr>
                  {peers.map(p => (
                    <tr key={p.symbol}>
                      <td className="t-mono" style={{ padding: "6px 8px" }}>{p.symbol.replace(".BK", "")}</td>
                      <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{p.marketCapBn.toFixed(0)}</td>
                      <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{p.pe.toFixed(1)}</td>
                      <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{p.pb.toFixed(2)}</td>
                      <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{p.roe.toFixed(1)}%</td>
                      <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{p.dividendYield.toFixed(1)}%</td>
                      <td className="t-mono" style={{ padding: "6px 8px", textAlign: "right" }}>{p.debtEquity.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="t-micro" style={{ color: "var(--muted)", marginTop: 8 }}>
              Compare value (lower P/E, P/B), profitability (higher ROE), and balance sheet (lower Debt/Equity) across the sector.
            </div>
          </Card>
        )}
      </div>
    </Scroller>
  );
}

function Cell({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", padding: "10px 12px" }}>
      <div className="t-micro">{label}</div>
      <div className="t-mono" style={{ fontSize: "0.9375rem", fontWeight: 700, color: color ?? "var(--ink)", marginTop: 2 }}>{value}</div>
      {sub && <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── FLOW tab ──────────────────────────────────────────────────

function FlowTab({ tech, ref }: { tech: Tech; ref: ReturnType<typeof getReference> }) {
  return (
    <Scroller>
      <div className="grid-2" style={{ gap: 12, alignItems: "start" }}>
        {/* Foreign flow */}
        {ref && (
          <Card accent={ref.foreignFlow.d20Net > 0 ? "var(--bull)" : "var(--bear)"}>
            <div className="t-micro" style={{ marginBottom: 8 }}>FOREIGN FLOW · INSTITUTIONAL FOOTPRINT</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
              <Stat label="5-day Net"   value={`${ref.foreignFlow.d5Net  >= 0 ? "+" : ""}฿${fmtNum(ref.foreignFlow.d5Net, 0)}M`}  color={ref.foreignFlow.d5Net  >= 0 ? "var(--bull)" : "var(--bear)"} />
              <Stat label="20-day Net"  value={`${ref.foreignFlow.d20Net >= 0 ? "+" : ""}฿${fmtNum(ref.foreignFlow.d20Net, 0)}M`} color={ref.foreignFlow.d20Net >= 0 ? "var(--bull)" : "var(--bear)"} />
              <Stat label="Block (5d)"  value={`${ref.foreignFlow.d5Block >= 0 ? "+" : ""}฿${fmtNum(ref.foreignFlow.d5Block, 0)}M`} />
              <Stat label="Foreign Own" value={`${ref.foreignFlow.ownership.toFixed(1)}%`} sub={`limit ${ref.foreignFlow.foreignLimit}%`} />
            </div>
            <div className="t-micro" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
              {ref.foreignFlow.d20Net > 0
                ? "Foreigners net buying — smart money is positive. Often persists for weeks."
                : "Foreigners net selling — distribution phase. Tighten stops, raise cash."}
            </div>
          </Card>
        )}

        {/* Unusual volume + streaks */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>VOLUME · ANOMALY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <Stat label="Today vs 20d avg" value={`${tech.unusualVol.ratio.toFixed(2)}×`} sub={tech.unusualVol.label} color={tech.unusualVol.color} />
            <Stat label="OBV trend (20d)"  value={`${tech.obv.pctChange >= 0 ? "+" : ""}${tech.obv.pctChange.toFixed(1)}%`} sub={tech.obv.trend.toUpperCase()} color={tech.obv.trend === "rising" ? "var(--bull)" : tech.obv.trend === "falling" ? "var(--bear)" : "var(--muted)"} />
            <Stat label="Gap risk (60d)"   value={`${tech.gaps.avgGapPct.toFixed(2)}%`}      sub={`${tech.gaps.upGaps}↑ / ${tech.gaps.downGaps}↓`} />
            <Stat label="Intraday range"   value={`${tech.gaps.avgIntradayPct.toFixed(2)}%`} sub="avg open-to-close" />
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
            Unusual volume often precedes a move — confirm direction with price. OBV divergence vs price signals weakening trend.
          </div>
        </Card>

        {/* Recent returns distribution */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>RECENT RETURNS · {tech.returns.lookback}d LOOKBACK</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 8 }}>
            {[
              { l: "1D",  v: tech.returns.d1 },
              { l: "5D",  v: tech.returns.d5 },
              { l: "20D", v: tech.returns.d20 },
              { l: "60D", v: tech.returns.d60 },
              { l: "YTD", v: tech.returns.ytd },
            ].map(r => (
              <Stat key={r.l} label={r.l} value={`${r.v >= 0 ? "+" : ""}${r.v.toFixed(1)}%`} color={pctColor(r.v)} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <Stat label="Best day"  value={`+${tech.returns.bestDay.toFixed(2)}%`}  color="var(--bull)" />
            <Stat label="Worst day" value={`${tech.returns.worstDay.toFixed(2)}%`} color="var(--bear)" />
            <Stat label="Up days"   value={`${tech.returns.upDays}`}   sub={`${((tech.returns.upDays / tech.returns.lookback) * 100).toFixed(0)}%`} color="var(--bull)" />
            <Stat label="Down days" value={`${tech.returns.downDays}`} sub={`${((tech.returns.downDays / tech.returns.lookback) * 100).toFixed(0)}%`} color="var(--bear)" />
          </div>
        </Card>

        {/* Day-of-week heatmap */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>DAY-OF-WEEK SEASONALITY</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {tech.dow.map(d => {
              const color = d.avg > 0.05 ? "var(--bull)" : d.avg < -0.05 ? "var(--bear)" : "var(--muted)";
              const bg = d.avg > 0 ? "var(--bull-10)" : d.avg < 0 ? "var(--bear-10)" : "var(--bg-raised)";
              return (
                <div key={d.day} style={{ background: bg, border: "1px solid var(--line)", padding: "10px 8px", textAlign: "center" }}>
                  <div className="t-micro" style={{ marginBottom: 4 }}>{d.day}</div>
                  <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700, color }}>
                    {d.avg >= 0 ? "+" : ""}{d.avg.toFixed(2)}%
                  </div>
                  <div className="t-micro" style={{ color: "var(--dim)", marginTop: 2 }}>n={d.count}</div>
                </div>
              );
            })}
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
            Average return per day-of-week. Strong seasonality (consistent green or red) may justify timing bias.
          </div>
        </Card>
      </div>
    </Scroller>
  );
}

// ─── MACRO tab ─────────────────────────────────────────────────

function MacroTab({ ref }: { ref: ReturnType<typeof getReference> }) {
  if (!ref) {
    return <Scroller><Card><div className="t-body" style={{ color: "var(--muted)" }}>No macro sensitivity on file.</div></Card></Scroller>;
  }

  return (
    <Scroller>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Market regime — context for every trade */}
        <div>
          <div className="t-micro" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>MARKET REGIME · SET GMM CLASSIFICATION</div>
          <RegimeGauge />
        </div>

        <Card accent="var(--tech)">
          <div className="t-micro" style={{ marginBottom: 8 }}>WHAT MOVES THIS STOCK · MACRO BETA</div>
          <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
            Sensitivity coefficient β: how much this stock moves for each 1% move in the driver, holding everything else constant.
            Positive β → moves together. Negative β → moves opposite.
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {ref.macro.map(m => {
              const w = Math.min(100, Math.abs(m.beta) * 100);
              const color = m.beta > 0 ? "var(--bull)" : "var(--bear)";
              return (
                <div key={m.driver} style={{ display: "grid", gridTemplateColumns: "180px 80px 1fr", gap: 12, alignItems: "center", padding: "10px 12px", background: "var(--bg-surface)", border: "1px solid var(--line)" }}>
                  <div>
                    <div className="t-body" style={{ fontSize: "0.875rem", fontWeight: 700 }}>{m.driver}</div>
                    <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>β coefficient</div>
                  </div>
                  <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700, color }}>
                    {m.beta >= 0 ? "+" : ""}{m.beta.toFixed(2)}
                  </div>
                  <div>
                    <StatusBar pct={w} color={color} />
                    <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>{m.rationale}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming catalysts */}
        <Card>
          <div className="t-micro" style={{ marginBottom: 8 }}>UPCOMING CATALYSTS · 90-DAY HORIZON</div>
          <div style={{ display: "grid", gap: 6 }}>
            {ref.upcoming.map((e, i) => {
              const days = Math.round((Date.parse(e.date) - Date.now()) / (1000 * 60 * 60 * 24));
              const color = e.type === "earnings" ? "var(--caution)" : e.type === "ex-dividend" ? "var(--bull)" : "var(--tech)";
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 100px 1fr 80px", gap: 12, padding: "10px 12px", background: "var(--bg-surface)", border: "1px solid var(--line)", borderLeft: `3px solid ${color}`, alignItems: "center" }}>
                  <span className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{e.date}</span>
                  <span className="t-micro" style={{ color, letterSpacing: "0.1em" }}>{e.type.toUpperCase()}</span>
                  <span className="t-body" style={{ fontSize: "0.8125rem" }}>{e.label}</span>
                  <span className="t-mono" style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "right" }}>
                    {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "today" : `in ${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Scroller>
  );
}
