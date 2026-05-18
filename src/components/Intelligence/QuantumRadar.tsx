"use client";

import { useMemo } from "react";

interface Props {
  dimensions: string[];
  scores: number[];
  historicalAvg: number[];
  regime: string;
  confidence: number;
}

export function QuantumRadar({ dimensions, scores, historicalAvg, regime, confidence }: Props) {
  const size = 320;
  const center = size / 2;
  const radius = 110;
  const levels = 4;

  const angleFor = (i: number) => (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;

  const gridPoints = useMemo(() => {
    const rings: string[] = [];
    for (let l = 1; l <= levels; l++) {
      const r = (radius * l) / levels;
      const pts = dimensions.map((_, i) => {
        const a = angleFor(i);
        return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`;
      });
      rings.push(pts.join(" "));
    }
    return rings;
  }, [dimensions.length]);

  const axisLines = useMemo(() => {
    return dimensions.map((_, i) => {
      const a = angleFor(i);
      return {
        x2: center + radius * Math.cos(a),
        y2: center + radius * Math.sin(a),
        labelX: center + (radius + 22) * Math.cos(a),
        labelY: center + (radius + 22) * Math.sin(a),
      };
    });
  }, [dimensions.length]);

  function polyFor(values: number[]) {
    return values
      .map((v, i) => {
        const a = angleFor(i);
        const r = (radius * v) / 100;
        return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`;
      })
      .join(" ");
  }

  const scorePoly = polyFor(scores);
  const avgPoly = polyFor(historicalAvg);

  // Glow color based on regime confidence
  const glowColor = confidence > 70 ? "#00f0ff" : confidence > 45 ? "#f59e0b" : "#ff3b6f";

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 12px ${glowColor}30)` }}>
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Background glow */}
        <circle cx={center} cy={center} r={radius + 10} fill="url(#radarGlow)" />

        {/* Grid rings */}
        {gridPoints.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray={i === levels - 1 ? "none" : "3,3"}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--line)"
            strokeWidth={1}
          />
        ))}

        {/* Historical average (ghost) */}
        <polygon
          points={avgPoly}
          fill="none"
          stroke="var(--dim)"
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.5}
        />

        {/* Current scores */}
        <polygon
          points={scorePoly}
          fill="url(#scoreGrad)"
          fillOpacity={0.25}
          stroke="url(#scoreGrad)"
          strokeWidth={2}
        />

        {/* Data points */}
        {scores.map((v, i) => {
          const a = angleFor(i);
          const r = (radius * v) / 100;
          const x = center + r * Math.cos(a);
          const y = center + r * Math.sin(a);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill="#00f0ff" stroke="#050508" strokeWidth={2} />
              <circle cx={x} cy={y} r={8} fill="none" stroke="#00f0ff" strokeWidth={1} opacity={0.3}>
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Labels */}
        {dimensions.map((label, i) => {
          const a = angleFor(i);
          const x = center + (radius + 34) * Math.cos(a);
          const y = center + (radius + 34) * Math.sin(a);
          const anchor = Math.abs(a) < 0.5 || Math.abs(a - Math.PI) < 0.5 ? "middle" : a > 0 ? "start" : "end";
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor={anchor as "middle" | "start" | "end"}
              dominantBaseline="middle"
              fill="var(--muted)"
              fontSize={8}
              fontFamily="var(--font-mono)"
              letterSpacing={0.06}
            >
              {label.toUpperCase()}
            </text>
          );
        })}
      </svg>

      {/* Regime label */}
      <div style={{
        marginTop: -8,
        textAlign: "center",
        padding: "8px 16px",
        border: `1px solid ${glowColor}40`,
        background: `${glowColor}08`,
      }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.625rem",
          color: glowColor,
          letterSpacing: "0.1em",
          fontWeight: 700,
        }}>
          {regime.toUpperCase()} · {confidence}% MATCH
        </div>
        <div style={{
          fontSize: "0.6rem",
          color: "var(--dim)",
          marginTop: 2,
          fontFamily: "var(--font-body)",
        }}>
          Market DNA fingerprint vs historical regimes
        </div>
      </div>
    </div>
  );
}
