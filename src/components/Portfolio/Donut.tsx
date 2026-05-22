"use client";

/**
 * Compact SVG donut chart.
 *
 *   <Donut data={[{ key, label, value, pct, color }, ...]} size={180} />
 *
 * Pure SVG — no Chart.js, no canvas. Renders flat (no gradient, no glow)
 * to keep the Braun heritage. Center hole reserved for a summary slot.
 */

import { type ReactNode } from "react";
import type { AllocationSlice } from "@/lib/portfolio-data";

interface Props {
  data: AllocationSlice[];
  size?: number;
  thickness?: number;
  /** ReactNode rendered in the center hole. */
  center?: ReactNode;
  /** Highlight slice by key on hover. */
  highlightKey?: string | null;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, startRad: number, endRad: number) {
  const largeArc = endRad - startRad > Math.PI ? 1 : 0;
  const p1 = polarToCartesian(cx, cy, rOuter, startRad);
  const p2 = polarToCartesian(cx, cy, rOuter, endRad);
  const p3 = polarToCartesian(cx, cy, rInner, endRad);
  const p4 = polarToCartesian(cx, cy, rInner, startRad);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export function Donut({ data, size = 180, thickness = 28, center, highlightKey }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rInner = rOuter - thickness;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let cursor = -Math.PI / 2; // start at 12 o'clock
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    return { d, start, end, midAngle: (start + end) / 2 };
  });

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Allocation donut">
        {/* Track */}
        <circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="none" stroke="var(--line)" strokeWidth={thickness} />

        {slices.map(({ d, start, end }) => {
          const dimmed = highlightKey && highlightKey !== d.key;
          // SVG can't draw a 360° arc with one path; if a slice == 100% draw a circle
          if (end - start >= 2 * Math.PI - 0.001) {
            return (
              <circle
                key={d.key}
                cx={cx} cy={cy}
                r={(rOuter + rInner) / 2}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                opacity={dimmed ? 0.25 : 1}
              />
            );
          }
          return (
            <path
              key={d.key}
              d={arcPath(cx, cy, rOuter, rInner, start, end)}
              fill={d.color}
              opacity={dimmed ? 0.25 : 1}
              stroke="var(--bg)"
              strokeWidth={0.6}
            >
              <title>{`${d.label} · ${d.pct.toFixed(2)}% · ฿${d.value.toLocaleString()}`}</title>
            </path>
          );
        })}
      </svg>
      {center && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            padding: thickness + 4,
            textAlign: "center",
          }}
        >
          {center}
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ data, highlightKey, onHighlight }: {
  data: AllocationSlice[];
  highlightKey?: string | null;
  onHighlight?: (k: string | null) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
      {data.map(d => (
        <div
          key={d.key}
          onMouseEnter={() => onHighlight?.(d.key)}
          onMouseLeave={() => onHighlight?.(null)}
          style={{
            display: "grid",
            gridTemplateColumns: "10px 1fr auto",
            gap: 8,
            alignItems: "center",
            cursor: onHighlight ? "pointer" : "default",
            padding: "3px 2px",
            opacity: highlightKey && highlightKey !== d.key ? 0.4 : 1,
            transition: "opacity 140ms",
          }}
        >
          <span style={{ width: 10, height: 10, background: d.color }} />
          <span
            className="t-body"
            style={{
              fontSize: "0.6875rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={d.label}
          >
            {d.label}
          </span>
          <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: d.color }}>
            {d.pct.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
