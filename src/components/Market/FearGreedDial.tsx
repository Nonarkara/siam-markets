"use client";

import type { FearGreed } from "@/lib/types";
import { fgLabel, fgBuffettAdvice } from "@/lib/graham";

interface Props {
  data: FearGreed;
}

// SVG arc dial — 0–100 range, 180° sweep
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function scoreToAngle(score: number): number {
  // 0 = 180° (left), 100 = 0° (right), through top at 90°
  return 180 - score * 1.8;
}

function scoreColor(score: number): string {
  if (score <= 20) return "#ff3b30";
  if (score <= 40) return "#ff6b35";
  if (score <= 60) return "#ff9500";
  if (score <= 80) return "#86c83c";
  return "#00c896";
}

export function FearGreedDial({ data }: Props) {
  const { score } = data;
  const cx = 120, cy = 100, r = 80;
  const needleAngle = scoreToAngle(score);
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleX = cx + 68 * Math.cos(needleRad);
  const needleY = cy + 68 * Math.sin(needleRad);
  const color = scoreColor(score);

  const zones = [
    { label: "Fear",    start: 180, end: 144, color: "#ff3b30" },
    { label: "",        start: 144, end: 108, color: "#ff6b35" },
    { label: "Neutral", start: 108, end: 72,  color: "#ff9500" },
    { label: "",        start: 72,  end: 36,  color: "#86c83c" },
    { label: "Greed",   start: 36,  end: 0,   color: "#00c896" },
  ];

  return (
    <div className="card" style={{ padding: "20px" }}>
      <div className="t-micro" style={{ marginBottom: 16 }}>MR. MARKET&apos;S MOOD</div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={240} height={130} viewBox="0 0 240 130" role="img" aria-label={`Fear & Greed: ${score}`}>
          {/* Background track */}
          <path
            d={describeArc(cx, cy, r, 180, 0)}
            fill="none"
            stroke="var(--line)"
            strokeWidth={16}
            strokeLinecap="butt"
          />
          {/* Colored zone arcs */}
          {zones.map((z, i) => (
            <path
              key={i}
              d={describeArc(cx, cy, r, z.start, z.end)}
              fill="none"
              stroke={z.color}
              strokeWidth={16}
              opacity={0.25}
              strokeLinecap="butt"
            />
          ))}
          {/* Score arc */}
          <path
            d={describeArc(cx, cy, r, 180, scoreToAngle(score))}
            fill="none"
            stroke={color}
            strokeWidth={16}
            strokeLinecap="butt"
          />
          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={6} fill={color} />
          {/* Score label */}
          <text
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            fill={color}
            fontSize={28}
            fontFamily="IBM Plex Mono"
            fontWeight={600}
          >
            {score}
          </text>
          {/* Zone labels */}
          <text x={18} y={115} fill="var(--muted)" fontSize={9} fontFamily="Source Sans 3">FEAR</text>
          <text x={192} y={115} fill="var(--muted)" fontSize={9} fontFamily="Source Sans 3">GREED</text>
        </svg>
      </div>

      <div style={{ textAlign: "center" }}>
        <div
          className="t-body"
          style={{ fontWeight: 600, color, marginBottom: 8 }}
        >
          {fgLabel(data.label).toUpperCase()}
        </div>
        <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.4, fontSize: "0.8rem" }}>
          {fgBuffettAdvice(data.label)}
        </div>
      </div>
    </div>
  );
}
