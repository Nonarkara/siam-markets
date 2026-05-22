"use client";

import { useMemo } from "react";
import {
  ema, rsi, macd, bollingerBands, vwap, detectRegime,
  findSupportResistance, generateSignal,
  regimeLabel, regimeColor,
} from "@/lib/technical";
import { calculatePositionSize } from "@/lib/trading";
import { MOCK_OHLCV_PTT } from "@/lib/api/mock";
import { fmtNum, pctColor } from "@/lib/format";

export function CompactTradeSignal() {
  const data = MOCK_OHLCV_PTT;
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
      vwap: vwapValues[vwapValues.length - 1],
      regime,
      sr,
      signal,
    };
  }, [data]);

  const priceChange = ((current.close - data[data.length - 2].close) / data[data.length - 2].close) * 100;
  const accountSize = 1_000_000;
  const riskPct = 1;

  const sizing = useMemo(() => {
    if (!analysis.signal.entry || !analysis.signal.stopLoss) return null;
    return calculatePositionSize({
      accountSize,
      riskPct,
      entryPrice: analysis.signal.entry,
      stopLoss: analysis.signal.stopLoss,
    }, analysis.signal.target);
  }, [analysis.signal]);

  const signalColor = analysis.signal.type === "buy" ? "var(--bull)" : analysis.signal.type === "sell" ? "var(--bear)" : "var(--muted)";
  const signalBg = analysis.signal.type === "buy" ? "var(--bull-10)" : analysis.signal.type === "sell" ? "var(--bear-10)" : "transparent";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Price hero */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="t-mono" style={{ fontSize: "1.25rem", fontWeight: 700 }}>฿{fmtNum(current.close, 2)}</div>
          <div className="t-micro">PTT · PTT.BK</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-mono" style={{ fontSize: "1rem", color: pctColor(priceChange) }}>
            {priceChange >= 0 ? "+" : ""}{fmtNum(priceChange, 2)}%
          </div>
          <div className="t-micro">Today</div>
        </div>
      </div>

      {/* Signal badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px", background: signalBg, border: `1px solid ${signalColor}`,
      }}>
        <div style={{ textAlign: "center", minWidth: 50 }}>
          <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700, color: signalColor }}>
            {analysis.signal.confidence}%
          </div>
          <div className="t-micro" style={{ color: signalColor }}>CONF</div>
        </div>
        <div>
          <div className="t-body" style={{ fontWeight: 600, fontSize: "0.875rem", color: signalColor, textTransform: "uppercase" }}>
            {analysis.signal.type}
          </div>
          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            {analysis.signal.reasons[0] ?? "Analyzing..."}
          </div>
        </div>
      </div>

      {/* Key levels */}
      {sizing && analysis.signal.entry && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--line)" }}>
          {[
            { label: "ENTRY", value: `฿${fmtNum(analysis.signal.entry, 2)}`, color: "var(--ink)" },
            { label: "STOP", value: `฿${fmtNum(analysis.signal.stopLoss!, 2)}`, color: "var(--bear)" },
            { label: "TARGET", value: `฿${fmtNum(analysis.signal.target!, 2)}`, color: "var(--bull)" },
          ].map(item => (
            <div key={item.label} style={{ background: "var(--bg-surface)", padding: "8px", textAlign: "center" }}>
              <div className="t-micro" style={{ marginBottom: 2 }}>{item.label}</div>
              <div className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 600, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Position size */}
      {sizing && (
        <div style={{ background: "var(--bg-raised)", padding: "8px 12px", border: "1px solid var(--line)" }}>
          <div className="t-micro" style={{ color: "var(--caution)", marginBottom: 2 }}>POSITION SIZE (1% RISK)</div>
          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            {sizing.shares} shares · ฿{fmtNum(sizing.notional, 0)} notional · R:R 1:{sizing.riskReward?.toFixed(2) ?? "0"}
          </div>
        </div>
      )}

      {/* Regime + indicators */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--line)" }}>
        {[
          { label: "REGIME", value: regimeLabel(analysis.regime.regime), color: regimeColor(analysis.regime.regime) },
          { label: "RSI", value: analysis.rsi.toFixed(1), color: analysis.rsi > 70 ? "var(--bear)" : analysis.rsi < 30 ? "var(--bull)" : "var(--muted)" },
          { label: "EMA 9/21", value: analysis.ema9 > analysis.ema21 ? "BULLISH" : "BEARISH", color: analysis.ema9 > analysis.ema21 ? "var(--bull)" : "var(--bear)" },
          { label: "VWAP", value: current.close > analysis.vwap ? "ABOVE" : "BELOW", color: current.close > analysis.vwap ? "var(--bull)" : "var(--bear)" },
        ].map(item => (
          <div key={item.label} style={{ background: "var(--bg-surface)", padding: "8px 10px" }}>
            <div className="t-micro" style={{ marginBottom: 2 }}>{item.label}</div>
            <div className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
