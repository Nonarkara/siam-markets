"use client";

import { useState, useMemo } from "react";
import {
  ema, rsi, macd, bollingerBands, vwap, detectRegime,
  detectPattern, findSupportResistance, generateSignal,
  regimeLabel, regimeColor, patternLabel,
} from "@/lib/technical";
import { calculatePositionSize } from "@/lib/trading";
import { MOCK_OHLCV_PTT, MOCK_OHLCV_ADVANC, MOCK_OHLCV_KBANK, MOCK_TRADING_NEWS } from "@/lib/api/mock";
import { fmtNum, pctColor } from "@/lib/format";
import type { OHLCV } from "@/lib/types";

const STOCKS: { symbol: string; name: string; data: OHLCV[]; price: number }[] = [
  { symbol: "PTT.BK", name: "PTT", data: MOCK_OHLCV_PTT, price: 35.5 },
  { symbol: "ADVANC.BK", name: "Advanced Info", data: MOCK_OHLCV_ADVANC, price: 232.0 },
  { symbol: "KBANK.BK", name: "Kasikorn Bank", data: MOCK_OHLCV_KBANK, price: 141.0 },
];

export default function TradePage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [accountSize, setAccountSize] = useState(100_000);
  const [riskPct, setRiskPct] = useState(1);

  const stock = STOCKS[selectedIdx];
  const data = stock.data;
  const current = data[data.length - 1];

  const analysis = useMemo(() => {
    const closes = data.map((d) => d.close);
    const ema9 = ema(closes, 9);
    const ema21 = ema(closes, 21);
    const rsiValues = rsi(closes, 14);
    const macdResult = macd(closes);
    const bb = bollingerBands(closes);
    const vwapValues = vwap(data);
    const regime = detectRegime(data);
    const pattern = detectPattern(data);
    const sr = findSupportResistance(data);
    const signal = generateSignal(data, sr);

    return {
      ema9: ema9[ema9.length - 1],
      ema21: ema21[ema21.length - 1],
      rsi: rsiValues[rsiValues.length - 1],
      macd: macdResult.macd[macdResult.macd.length - 1],
      macdSignal: macdResult.signal[macdResult.signal.length - 1],
      bbUpper: bb.upper[bb.upper.length - 1],
      bbLower: bb.lower[bb.lower.length - 1],
      bbWidth: bb.bandwidth[bb.bandwidth.length - 1],
      vwap: vwapValues[vwapValues.length - 1],
      regime,
      pattern,
      sr,
      signal,
    };
  }, [data]);

  const sizing = useMemo(() => {
    if (!analysis.signal.entry || !analysis.signal.stopLoss) return null;
    return calculatePositionSize({
      accountSize,
      riskPct,
      entryPrice: analysis.signal.entry,
      stopLoss: analysis.signal.stopLoss,
    }, analysis.signal.target);
  }, [analysis.signal, accountSize, riskPct]);

  const priceChange = ((current.close - data[data.length - 2].close) / data[data.length - 2].close) * 100;

  return (
    <div className="page page-enter">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div className="t-micro" style={{ marginBottom: 6 }}>DAY TRADING COMMAND CENTER</div>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Trade Desk</h1>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          Technical analysis + risk management. Quality filter first, then timing.
        </p>
      </div>

      {/* Stock selector */}
      <div className="scroll-row" style={{ marginBottom: "var(--gap)" }}>
        {STOCKS.map((s, i) => (
          <button
            key={s.symbol}
            onClick={() => setSelectedIdx(i)}
            className="card"
            style={{
              minWidth: 140,
              padding: "12px 16px",
              borderColor: selectedIdx === i ? "var(--bull)" : "var(--line)",
              background: selectedIdx === i ? "var(--bg-hover)" : "var(--bg-surface)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div className="t-mono" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {s.symbol.replace(".BK", "")}
            </div>
            <div className="t-micro" style={{ marginTop: 2 }}>{s.name}</div>
          </button>
        ))}
      </div>

      {/* Price hero */}
      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="t-mono" style={{ fontSize: "2rem", fontWeight: 700 }}>
              ฿{fmtNum(current.close, 2)}
            </div>
            <div className="t-micro" style={{ marginTop: 4 }}>
              {stock.name} · {stock.symbol}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="t-mono" style={{ fontSize: "1.25rem", color: pctColor(priceChange) }}>
              {priceChange >= 0 ? "+" : ""}{fmtNum(priceChange, 2)}%
            </div>
            <div className="t-micro">Today</div>
          </div>
        </div>
        <div className="divider" style={{ margin: "12px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Metric label="Open" value={`฿${fmtNum(current.open, 2)}`} />
          <Metric label="High" value={`฿${fmtNum(current.high, 2)}`} />
          <Metric label="Low" value={`฿${fmtNum(current.low, 2)}`} />
          <Metric label="Volume" value={`${(current.volume / 1_000_000).toFixed(1)}M`} />
          <Metric label="Range" value={`${(((current.high - current.low) / current.close) * 100).toFixed(2)}%`} />
          <Metric label="Pattern" value={patternLabel(analysis.pattern).split(" — ")[0]} color="var(--caution)" />
        </div>
      </div>

      {/* Regime + Signal */}
      <div className="grid-2" style={{ marginBottom: "var(--gap)" }}>
        <div className="card" style={{ borderLeft: `3px solid ${regimeColor(analysis.regime.regime)}` }}>
          <div className="t-micro" style={{ marginBottom: 6 }}>MARKET REGIME</div>
          <div className="t-body" style={{ fontWeight: 700, color: regimeColor(analysis.regime.regime) }}>
            {regimeLabel(analysis.regime.regime)}
          </div>
          <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 4 }}>
            Trend: {analysis.regime.trendStrength} · Volatility: {analysis.regime.volatility.toFixed(2)}%
          </div>
        </div>

        <div
          className="card"
          style={{
            borderLeft: `3px solid ${
              analysis.signal.type === "buy" ? "var(--bull)" : analysis.signal.type === "sell" ? "var(--bear)" : "var(--muted)"
            }`,
          }}
        >
          <div className="t-micro" style={{ marginBottom: 6 }}>AI SIGNAL</div>
          <div
            className="t-body"
            style={{
              fontWeight: 700,
              color: analysis.signal.type === "buy" ? "var(--bull)" : analysis.signal.type === "sell" ? "var(--bear)" : "var(--muted)",
              textTransform: "uppercase",
            }}
          >
            {analysis.signal.type} · {analysis.signal.confidence}%
          </div>
          <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 4 }}>
            {analysis.signal.reasons[0] ?? "Analyzing..."}
          </div>
        </div>
      </div>

      {/* Technical indicators grid */}
      <div className="t-micro" style={{ marginBottom: 8 }}>TECHNICAL INDICATORS</div>
      <div className="grid-2" style={{ marginBottom: "var(--gap)" }}>
        <IndicatorCard
          label="EMA 9 / 21"
          value={`${fmtNum(analysis.ema9, 2)} / ${fmtNum(analysis.ema21, 2)}`}
          status={analysis.ema9 > analysis.ema21 ? "Bullish" : "Bearish"}
          color={analysis.ema9 > analysis.ema21 ? "var(--bull)" : "var(--bear)"}
        />
        <IndicatorCard
          label="RSI (14)"
          value={fmtNum(analysis.rsi, 1)}
          status={analysis.rsi > 70 ? "Overbought" : analysis.rsi < 30 ? "Oversold" : "Neutral"}
          color={analysis.rsi > 70 ? "var(--bear)" : analysis.rsi < 30 ? "var(--bull)" : "var(--muted)"}
        />
        <IndicatorCard
          label="MACD"
          value={fmtNum(analysis.macd, 3)}
          status={analysis.macd > (analysis.macdSignal ?? 0) ? "Bullish" : "Bearish"}
          color={analysis.macd > (analysis.macdSignal ?? 0) ? "var(--bull)" : "var(--bear)"}
        />
        <IndicatorCard
          label="VWAP"
          value={`฿${fmtNum(analysis.vwap, 2)}`}
          status={current.close > analysis.vwap ? "Above" : "Below"}
          color={current.close > analysis.vwap ? "var(--bull)" : "var(--bear)"}
        />
        <IndicatorCard
          label="Bollinger Bands"
          value={`฿${fmtNum(analysis.bbLower, 2)} – ฿${fmtNum(analysis.bbUpper, 2)}`}
          status={current.close < (analysis.bbLower ?? 0) ? "Below" : current.close > (analysis.bbUpper ?? 0) ? "Above" : "Inside"}
          color={current.close < (analysis.bbLower ?? 0) ? "var(--bull)" : current.close > (analysis.bbUpper ?? 0) ? "var(--bear)" : "var(--muted)"}
        />
        <IndicatorCard
          label="BB Width"
          value={`${fmtNum(analysis.bbWidth, 2)}%`}
          status={analysis.bbWidth < 2 ? "Squeeze" : analysis.bbWidth > 6 ? "Expansion" : "Normal"}
          color={analysis.bbWidth < 2 ? "var(--caution)" : "var(--muted)"}
        />
      </div>

      {/* Support / Resistance */}
      <div className="t-micro" style={{ marginBottom: 8 }}>SUPPORT & RESISTANCE ZONES</div>
      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div className="t-micro" style={{ color: "var(--bull)", marginBottom: 6 }}>SUPPORT</div>
            {analysis.sr.support.slice(0, 3).map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
                <span className="t-mono" style={{ fontSize: "0.875rem" }}>฿{fmtNum(s.price, 2)}</span>
                <span className="t-micro" style={{ color: "var(--muted)" }}>{s.touches} touches · {s.strength}</span>
              </div>
            ))}
            {analysis.sr.support.length === 0 && <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No clear support found</div>}
          </div>
          <div>
            <div className="t-micro" style={{ color: "var(--bear)", marginBottom: 6 }}>RESISTANCE</div>
            {analysis.sr.resistance.slice(0, 3).map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
                <span className="t-mono" style={{ fontSize: "0.875rem" }}>฿{fmtNum(r.price, 2)}</span>
                <span className="t-micro" style={{ color: "var(--muted)" }}>{r.touches} touches · {r.strength}</span>
              </div>
            ))}
            {analysis.sr.resistance.length === 0 && <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No clear resistance found</div>}
          </div>
        </div>
      </div>

      {/* Position Sizer */}
      <div className="t-micro" style={{ marginBottom: 8 }}>POSITION SIZER</div>
      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>ACCOUNT SIZE (THB)</label>
            <input
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(Number(e.target.value))}
              className="t-mono"
              style={{
                width: "100%",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "8px 12px",
                fontSize: "0.875rem",
              }}
            />
          </div>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>RISK PER TRADE (%)</label>
            <input
              type="number"
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
              className="t-mono"
              style={{
                width: "100%",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "8px 12px",
                fontSize: "0.875rem",
              }}
            />
          </div>
        </div>

        {sizing && analysis.signal.entry && (
          <div style={{ background: "var(--bg-raised)", padding: 12, border: "1px solid var(--line)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <Metric label="Entry" value={`฿${fmtNum(analysis.signal.entry, 2)}`} />
              <Metric label="Stop" value={`฿${fmtNum(analysis.signal.stopLoss!, 2)}`} color="var(--bear)" />
              <Metric label="Target" value={`฿${fmtNum(analysis.signal.target!, 2)}`} color="var(--bull)" />
              <Metric label="Shares" value={`${sizing.shares}`} />
              <Metric label="Notional" value={`฿${fmtNum(sizing.notional, 0)}`} />
              <Metric label="R:R" value={`1:${sizing.riskReward?.toFixed(2) ?? "0"}`} color="var(--caution)" />
            </div>
            <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: 8 }}>
              Risking ฿{fmtNum(sizing.riskAmount, 0)} ({riskPct}%) · Stop distance: ฿{fmtNum(sizing.riskPerShare, 2)}
            </div>
          </div>
        )}
      </div>

      {/* News feed */}
      <div className="t-micro" style={{ marginBottom: 8 }}>NEWS & SENTIMENT</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)", marginBottom: "var(--gap)" }}>
        {MOCK_TRADING_NEWS.map((news, i) => (
          <div key={i} className="card" style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div className="t-body" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>{news.headline}</div>
                <div className="t-micro" style={{ marginTop: 4 }}>
                  {news.time} · {news.impact.toUpperCase()} IMPACT
                </div>
              </div>
              <div
                className="t-mono"
                style={{
                  fontSize: "0.875rem",
                  color: news.sentiment > 0 ? "var(--bull)" : news.sentiment < 0 ? "var(--bear)" : "var(--muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {news.sentiment > 0 ? "+" : ""}{news.sentiment.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Signal reasons */}
      {analysis.signal.reasons.length > 1 && (
        <>
          <div className="t-micro" style={{ marginBottom: 8 }}>SIGNAL BREAKDOWN</div>
          <div className="card" style={{ marginBottom: "var(--gap)" }}>
            {analysis.signal.reasons.map((reason, i) => (
              <div
                key={i}
                className="t-body"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  padding: "6px 0",
                  borderBottom: i < analysis.signal.reasons.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                {i + 1}. {reason}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div
        className="card"
        style={{
          background: "var(--bear-10)",
          borderColor: "var(--bear)",
          marginBottom: "var(--gap)",
        }}
      >
        <div className="t-body" style={{ color: "var(--bear)", fontSize: "0.75rem", lineHeight: 1.6 }}>
          <strong>WARNING:</strong> These signals are for educational purposes only. ~90% of day traders lose money.
          Never risk more than 1-2% per trade. Always paper trade first. Past performance does not predict future results.
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="t-micro" style={{ marginBottom: 2 }}>{label}</div>
      <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 600, color: color ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function IndicatorCard({ label, value, status, color }: { label: string; value: string; status: string; color: string }) {
  return (
    <div className="card" style={{ padding: "12px 16px" }}>
      <div className="t-micro" style={{ marginBottom: 4 }}>{label}</div>
      <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 2 }}>{value}</div>
      <div className="t-micro" style={{ color }}>{status}</div>
    </div>
  );
}
