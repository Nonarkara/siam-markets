"use client";

import { useMemo, useState } from "react";
import { tenYearProjection } from "@/lib/graham";
import { fmtThb } from "@/lib/format";

interface Props {
  initialAmount: number;
  monthlyContribution: number;
}

export function ProjectionChart({ initialAmount, monthlyContribution }: Props) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const points = useMemo(
    () => tenYearProjection(initialAmount, monthlyContribution),
    [initialAmount, monthlyContribution],
  );

  const maxValue = points[10].optimistic;
  const h = 140;
  const w = 100; // percentage

  function yPos(value: number): number {
    return h - (value / maxValue) * h;
  }

  const scenarios: Array<{
    key: "conservative" | "moderate" | "optimistic";
    label: string;
    color: string;
    rate: string;
  }> = [
    { key: "conservative", label: "Conservative", color: "var(--muted)",  rate: "6%/yr" },
    { key: "moderate",     label: "Moderate",      color: "var(--caution)", rate: "8%/yr" },
    { key: "optimistic",   label: "Optimistic",    color: "var(--bull)",   rate: "10%/yr" },
  ];

  const hovered = hoveredYear !== null ? points[hoveredYear] : points[10];

  return (
    <div className="card" style={{ padding: "16px" }}>
      <div className="t-micro" style={{ marginBottom: 12 }}>10-YEAR COMPOUND PROJECTION</div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {scenarios.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 2, background: s.color }} />
            <span className="t-micro" style={{ color: s.color, textTransform: "none" }}>
              {s.label} ({s.rate})
            </span>
          </div>
        ))}
      </div>

      {/* SVG chart */}
      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${points.length * 10} ${h + 10}`}
          style={{ width: "100%", height: 160, overflow: "visible" }}
          preserveAspectRatio="none"
        >
          {scenarios.map((s) => {
            const pathD = points
              .map((p, i) => `${i === 0 ? "M" : "L"} ${i * 10} ${yPos(p[s.key])}`)
              .join(" ");
            return (
              <path
                key={s.key}
                d={pathD}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {/* Year tick lines */}
          {points.map((_, i) => (
            <line
              key={i}
              x1={i * 10}
              y1={0}
              x2={i * 10}
              y2={h + 10}
              stroke="var(--line)"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Year labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {points.map((p) => (
            <button
              key={p.year}
              onClick={() => setHoveredYear(p.year === hoveredYear ? null : p.year)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 2px", color: "var(--muted)",
                fontFamily: "var(--font-body)", fontSize: "var(--text-micro)",
                textTransform: "uppercase", letterSpacing: "0.04em",
                minHeight: 44, minWidth: 22,
              }}
            >
              {p.year === 0 ? "Now" : p.year === 5 ? "5yr" : p.year === 10 ? "10yr" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Values at hovered/final year */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4 }}>
        <div className="t-micro" style={{ marginBottom: 8 }}>
          YEAR {hoveredYear ?? 10} VALUES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {scenarios.map((s) => (
            <div key={s.key}>
              <div className="t-micro" style={{ color: s.color, textTransform: "none", fontSize: "0.6rem" }}>
                {s.label}
              </div>
              <div className="t-mono" style={{ color: s.color, marginTop: 4, fontSize: "0.875rem" }}>
                {fmtThb(hovered[s.key], true)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
