"use client";

import { useMemo } from "react";
import { fmtNum } from "@/lib/format";

interface OptionsChain {
  strikes: number[];
  callOi: number[];
  putOi: number[];
  underlyingPrice: number;
}

interface Props {
  chain: OptionsChain;
  underlyingName?: string;
}

function computeGammaExposure(chain: OptionsChain): {
  callWall: number | null;
  putWall: number | null;
  pinRisk: number | null;
  gammaRegime: "positive" | "negative" | "neutral";
  keyLevels: { strike: number; gamma: number; type: "call" | "put" | "pin" }[];
} {
  const { strikes, callOi, putOi, underlyingPrice } = chain;

  if (strikes.length === 0 || !underlyingPrice) {
    return { callWall: null, putWall: null, pinRisk: null, gammaRegime: "neutral", keyLevels: [] };
  }

  // Approximate gamma exposure: OI × distance from underlying
  // High call OI above price = call wall (resistance)
  // High put OI below price = put wall (support)
  const levels = strikes.map((strike, i) => {
    const distance = Math.abs(strike - underlyingPrice);
    const callGamma = callOi[i] * Math.exp(-distance * 0.1);
    const putGamma = putOi[i] * Math.exp(-distance * 0.1);
    return { strike, callGamma, putGamma, totalGamma: callGamma + putGamma };
  });

  // Find call wall: highest call gamma ABOVE price
  const above = levels.filter(l => l.strike > underlyingPrice);
  const callWall = above.length > 0
    ? above.reduce((max, l) => l.callGamma > max.callGamma ? l : max, above[0]).strike
    : null;

  // Find put wall: highest put gamma BELOW price
  const below = levels.filter(l => l.strike < underlyingPrice);
  const putWall = below.length > 0
    ? below.reduce((max, l) => l.putGamma > max.putGamma ? l : max, below[0]).strike
    : null;

  // Pin risk: strike closest to underlying with highest total gamma
  const pinRisk = levels.reduce((max, l) => l.totalGamma > max.totalGamma ? l : max, levels[0]).strike;

  // Gamma regime: if there's more call gamma above than put gamma below = positive gamma (mean-reverting)
  const totalCallAbove = above.reduce((s, l) => s + l.callGamma, 0);
  const totalPutBelow = below.reduce((s, l) => s + l.putGamma, 0);
  const ratio = totalPutBelow > 0 ? totalCallAbove / totalPutBelow : 1;

  let gammaRegime: "positive" | "negative" | "neutral" = "neutral";
  if (ratio > 1.3) gammaRegime = "positive";
  else if (ratio < 0.7) gammaRegime = "negative";

  const keyLevels = [
    ...(putWall ? [{ strike: putWall, gamma: levels.find(l => l.strike === putWall)?.putGamma ?? 0, type: "put" as const }] : []),
    ...(pinRisk ? [{ strike: pinRisk, gamma: levels.find(l => l.strike === pinRisk)?.totalGamma ?? 0, type: "pin" as const }] : []),
    ...(callWall ? [{ strike: callWall, gamma: levels.find(l => l.strike === callWall)?.callGamma ?? 0, type: "call" as const }] : []),
  ].sort((a, b) => a.strike - b.strike);

  return { callWall, putWall, pinRisk, gammaRegime, keyLevels };
}

export function GammaExposureProxy({ chain, underlyingName = "SET50" }: Props) {
  const gex = useMemo(() => computeGammaExposure(chain), [chain]);

  const regimeColor = gex.gammaRegime === "positive"
    ? "var(--bull)"
    : gex.gammaRegime === "negative"
    ? "var(--bear)"
    : "var(--muted)";

  const regimeLabel = gex.gammaRegime === "positive"
    ? "MEAN-REVERTING"
    : gex.gammaRegime === "negative"
    ? "TREND-AMPLIFYING"
    : "BALANCED";

  const regimeDesc = gex.gammaRegime === "positive"
    ? "Dealers are long gamma. They hedge by selling highs and buying lows — this compresses moves."
    : gex.gammaRegime === "negative"
    ? "Dealers are short gamma. They chase price — rallies accelerate, selloffs snowball."
    : "Gamma exposure is roughly balanced. Price can move freely in either direction.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Regime badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "var(--bg-raised)",
          border: `1px solid ${regimeColor}`,
        }}
      >
        <div>
          <div className="t-micro" style={{ color: regimeColor }}>GAMMA REGIME</div>
          <div className="t-body" style={{ fontWeight: 600, fontSize: "0.875rem", color: regimeColor }}>
            {regimeLabel}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-mono" style={{ fontSize: "0.875rem", color: "var(--ink)" }}>
            {underlyingName}
          </div>
          <div className="t-micro">{fmtNum(chain.underlyingPrice, 2)}</div>
        </div>
      </div>

      {/* Key levels */}
      {gex.keyLevels.length > 0 && (
        <div>
          <div className="t-micro" style={{ marginBottom: 6 }}>KEY LEVELS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--line)" }}>
            {gex.keyLevels.map((level) => {
              const color = level.type === "call" ? "var(--bear)" : level.type === "put" ? "var(--bull)" : "var(--caution)";
              const label = level.type === "call" ? "CALL WALL" : level.type === "put" ? "PUT WALL" : "PIN RISK";
              return (
                <div
                  key={level.strike}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "var(--bg-surface)",
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div>
                    <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      {fmtNum(level.strike, 2)}
                    </div>
                    <div className="t-micro" style={{ color }}>{label}</div>
                  </div>
                  <div className="t-mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {level.type === "call" ? "Resistance" : level.type === "put" ? "Support" : "Magnet"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--dim)", lineHeight: 1.5 }}>
        {regimeDesc}
      </div>
    </div>
  );
}
