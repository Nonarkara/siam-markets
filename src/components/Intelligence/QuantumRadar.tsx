"use client";

interface Props {
  dimensions: string[];
  scores: number[];
  historicalAvg: number[];
  regime: string;
  confidence: number;
}

export function QuantumRadar({ dimensions, scores, historicalAvg, regime, confidence }: Props) {
  const glowColor = confidence > 70 ? "var(--bull)" : confidence > 45 ? "var(--caution)" : "var(--bear)";

  return (
    <div>
      {/* Regime header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 6,
      }}>
        <span className="t-mono" style={{ fontSize: "0.625rem", fontWeight: 700, color: glowColor, letterSpacing: "0.1em" }}>
          {regime.toUpperCase()}
        </span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>{confidence}% MATCH</span>
      </div>

      {/* Dimension rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {dimensions.map((dim, i) => {
          const score = scores[i] ?? 0;
          const avg = historicalAvg[i] ?? 50;
          const delta = score - avg;
          const deltaColor = delta > 5 ? "var(--bull)" : delta < -5 ? "var(--bear)" : "var(--dim)";
          const barColor = score > 70 ? "var(--bull)" : score < 30 ? "var(--bear)" : "var(--caution)";

          return (
            <div key={dim}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                <span className="t-micro" style={{ color: "var(--muted)", fontSize: "0.5rem", letterSpacing: "0.06em" }}>{dim.toUpperCase()}</span>
                <span className="t-mono" style={{ fontSize: "0.5625rem", color: deltaColor }}>
                  {score} <span style={{ color: "var(--dim)" }}>/ {avg}</span>
                </span>
              </div>
              <div style={{ position: "relative", height: 3, background: "var(--line-dim)", width: "100%" }}>
                {/* Historical avg marker */}
                <div style={{
                  position: "absolute", left: `${avg}%`, top: -1, width: 1, height: 5,
                  background: "var(--dim)", transform: "translateX(-50%)",
                }} />
                {/* Current score bar */}
                <div style={{
                  position: "absolute", left: 0, top: 0, height: 3,
                  width: `${Math.min(score, 100)}%`, background: barColor,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
