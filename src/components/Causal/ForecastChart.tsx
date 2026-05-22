"use client";

/**
 * ForecastChart — 5-day probabilistic SET forecast with confidence bands.
 *
 * Renders as a simple SVG:
 *   • 30-day historical SET close (from Yahoo, passed as prop or fetched)
 *   • 5-day forecast ribbon: 95% band (faint) + 80% band + median line
 *   • Vertical "today" divider
 *   • Confidence label on each forecast day
 */

import { useEffect, useMemo, useState } from "react";
import type { ForecastSummary, ForecastRow } from "@/app/api/forecast-set/route";

const W = 500;
const H = 140;
const PAD = { left: 8, right: 8, top: 10, bottom: 20 };

interface Props {
  /** Optional: pass historical close data to avoid a second fetch */
  historicalClose?: Array<{ date: string; close: number }>;
}

export function ForecastChart({ historicalClose }: Props) {
  const [data, setData] = useState<ForecastSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/forecast-set")
      .then(r => r.json())
      .then((d: ForecastSummary) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Build the point series for the SVG
  const { allPoints, minV, maxV, xScale, yScale } = useMemo(() => {
    if (!data) return { allPoints: [], minV: 0, maxV: 0, xScale: () => 0, yScale: () => 0 };

    const hist = historicalClose?.slice(-30) ?? [];
    const forecast = data.rows ?? [];

    // Combine all y values for scale
    const allY: number[] = [
      ...hist.map(h => h.close),
      ...forecast.map(r => r.upper_95),
      ...forecast.map(r => r.lower_95),
      ...forecast.map(r => r.predicted),
    ];
    const minV = Math.min(...allY) * 0.995;
    const maxV = Math.max(...allY) * 1.005;

    const totalPoints = hist.length + forecast.length;

    const xScale = (i: number) =>
      PAD.left + (i / Math.max(1, totalPoints - 1)) * (W - PAD.left - PAD.right);
    const yScale = (v: number) =>
      PAD.top + ((maxV - v) / (maxV - minV)) * (H - PAD.top - PAD.bottom);

    const allPoints = [
      ...hist.map((h, i) => ({ i, date: h.date, v: h.close, type: "hist" as const })),
      ...forecast.map((r, i) => ({
        i: hist.length + i,
        date: r.target_date,
        v: r.predicted,
        type: "forecast" as const,
        r,
      })),
    ];

    return { allPoints, minV, maxV, xScale, yScale };
  }, [data, historicalClose]);

  const histPoints    = allPoints.filter(p => p.type === "hist");
  const forecastPoints = allPoints.filter(p => p.type === "forecast");
  const dividerX = histPoints.length > 0 ? xScale(histPoints[histPoints.length - 1].i) : W / 2;

  if (loading) {
    return <div className="shimmer" style={{ height: H + 40 }} />;
  }

  const histLinePath = histPoints.length > 1
    ? histPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.i).toFixed(1)} ${yScale(p.v).toFixed(1)}`).join(" ")
    : "";

  const medPath = forecastPoints.length > 0
    ? forecastPoints.map((p, i) =>
        `${i === 0 ? `M ${xScale(histPoints[histPoints.length - 1]?.i ?? p.i).toFixed(1)} ${yScale(histPoints[histPoints.length - 1]?.v ?? p.v).toFixed(1)} L` : "L"} ${xScale(p.i).toFixed(1)} ${yScale(p.v).toFixed(1)}`
      ).join(" ")
    : "";

  // 80% band path (upper + reverse lower)
  const band80Path = forecastPoints.length > 0
    ? [
        ...forecastPoints.map((p, i) =>
          `${i === 0 ? "M" : "L"} ${xScale(p.i).toFixed(1)} ${yScale((p as { r: ForecastRow }).r.upper_80).toFixed(1)}`
        ),
        ...forecastPoints.slice().reverse().map(p =>
          `L ${xScale(p.i).toFixed(1)} ${yScale((p as { r: ForecastRow }).r.lower_80).toFixed(1)}`
        ),
        "Z",
      ].join(" ")
    : "";

  const band95Path = forecastPoints.length > 0
    ? [
        ...forecastPoints.map((p, i) =>
          `${i === 0 ? "M" : "L"} ${xScale(p.i).toFixed(1)} ${yScale((p as { r: ForecastRow }).r.upper_95).toFixed(1)}`
        ),
        ...forecastPoints.slice().reverse().map(p =>
          `L ${xScale(p.i).toFixed(1)} ${yScale((p as { r: ForecastRow }).r.lower_95).toFixed(1)}`
        ),
        "Z",
      ].join(" ")
    : "";

  const lastPredicted  = forecastPoints[forecastPoints.length - 1];
  const lastHistClose  = histPoints[histPoints.length - 1]?.v;
  const direction      = lastPredicted && lastHistClose
    ? ((lastPredicted.v - lastHistClose) / lastHistClose) * 100
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span className="t-body" style={{ fontWeight: 700, fontSize: "0.875rem" }}>SET 5-Day Forecast</span>
          {direction !== null && (
            <span className="t-mono" style={{
              marginLeft: 8,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: direction >= 0 ? "var(--bull)" : "var(--bear)",
            }}>
              {direction >= 0 ? "+" : ""}{direction.toFixed(2)}%
            </span>
          )}
        </div>
        {data?.model && (
          <span className="t-micro" style={{ color: "var(--dim)" }}>
            {data.model.toUpperCase()} · {data.run_date}
          </span>
        )}
      </div>

      {/* SVG chart */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        {/* 95% band */}
        {band95Path && (
          <path d={band95Path} fill="var(--tech)" fillOpacity={0.08} />
        )}
        {/* 80% band */}
        {band80Path && (
          <path d={band80Path} fill="var(--tech)" fillOpacity={0.18} />
        )}
        {/* Historical line */}
        {histLinePath && (
          <path d={histLinePath} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeOpacity={0.8} />
        )}
        {/* Median forecast line */}
        {medPath && (
          <path d={medPath} fill="none" stroke="var(--tech)" strokeWidth={1.5}
            strokeDasharray="4 3" />
        )}
        {/* Today divider */}
        <line x1={dividerX} y1={PAD.top} x2={dividerX} y2={H - PAD.bottom}
          stroke="var(--braun-yellow, #ffd000)" strokeWidth={0.8} strokeOpacity={0.7}
          strokeDasharray="3 3" />
        <text x={dividerX + 3} y={PAD.top + 8}
          fontFamily="var(--font-mono)" fontSize={7}
          fill="var(--braun-yellow, #ffd000)" opacity={0.7}>
          TODAY
        </text>

        {/* Forecast dots with labels */}
        {forecastPoints.map(p => {
          const r = (p as { r: ForecastRow }).r;
          return (
            <g key={p.date}>
              <circle cx={xScale(p.i)} cy={yScale(p.v)} r={3}
                fill="var(--tech)" stroke="var(--bg)" strokeWidth={1} />
              <text
                x={xScale(p.i)}
                y={yScale(p.v) - 6}
                fontFamily="var(--font-mono)"
                fontSize={6.5}
                fill="var(--tech)"
                textAnchor="middle"
              >
                {r.predicted.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Y-axis labels */}
        {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
          <text key={i} x={2} y={yScale(v) + 3}
            fontFamily="var(--font-mono)" fontSize={7}
            fill="var(--muted)">
            {v.toFixed(0)}
          </text>
        ))}
      </svg>

      {/* Forecast table */}
      {forecastPoints.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${forecastPoints.length}, 1fr)`, gap: 4 }}>
          {forecastPoints.map(p => {
            const r = (p as { r: ForecastRow }).r;
            const chg = lastHistClose ? ((r.predicted / lastHistClose) - 1) * 100 : null;
            return (
              <div
                key={p.date}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--line)",
                  padding: "6px 8px",
                  textAlign: "center",
                }}
              >
                <div className="t-micro" style={{ color: "var(--muted)", fontSize: "0.5625rem" }}>
                  {r.target_date.slice(5)}
                </div>
                <div className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 700, marginTop: 2 }}>
                  {r.predicted.toFixed(0)}
                </div>
                {chg !== null && (
                  <div className="t-mono" style={{ fontSize: "0.625rem", color: chg >= 0 ? "var(--bull)" : "var(--bear)" }}>
                    {chg >= 0 ? "+" : ""}{chg.toFixed(1)}%
                  </div>
                )}
                <div className="t-micro" style={{ color: "var(--dim)", fontSize: "0.5rem", marginTop: 2 }}>
                  [{r.lower_80.toFixed(0)}–{r.upper_80.toFixed(0)}]
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.note && (
        <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5 }}>
          {data.note}
        </div>
      )}
    </div>
  );
}
