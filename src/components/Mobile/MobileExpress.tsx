"use client";

import { useState, useEffect } from "react";
import { fmtPct, pctColor } from "@/lib/format";

interface QuadrantExpress {
  line: string;
  lineColor: string;
  headline: string;
  sub: string;
  detail: string;
  href: string;
}

interface Props {
  quadrants: QuadrantExpress[];
}

export function MobileExpress({ quadrants }: Props) {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) setIndex(i => Math.min(quadrants.length - 1, i + 1));
    if (diff < -50) setIndex(i => Math.max(0, i - 1));
    setTouchStart(null);
  };

  const q = quadrants[index];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 16px",
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--line)",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipeable card */}
      <div style={{
        background: "var(--bg)",
        border: `1px solid ${q.lineColor}`,
        borderLeft: `3px solid ${q.lineColor}`,
        padding: "12px 14px",
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span className="t-micro" style={{ color: q.lineColor, letterSpacing: "0.16em" }}>{q.line}</span>
          <span className="t-mono" style={{ fontSize: "0.625rem", color: "var(--dim)" }}>
            {index + 1}/{quadrants.length}
          </span>
        </div>
        <div className="t-mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
          {q.headline}
        </div>
        <div className="t-body" style={{ fontSize: "0.8125rem", color: q.lineColor, marginBottom: 2 }}>
          {q.sub}
        </div>
        <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.4 }}>
          {q.detail}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {quadrants.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show ${quadrants[i].line}`}
            style={{
              width: 8, height: 8,
              background: i === index ? quadrants[i].lineColor : "var(--line-dim)",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}
