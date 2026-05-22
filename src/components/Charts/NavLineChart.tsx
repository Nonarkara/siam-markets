"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, type LineData, type Time } from "lightweight-charts";

export interface NavLine {
  label: string;
  color: string;
  data: { time: string; value: number }[];
}

interface Props {
  series: NavLine[];      // 1+ series; multiple = comparison overlay
  height?: number;
  showLegend?: boolean;
  yLabel?: "nav" | "indexed";  // "indexed" displays as 100-based percentage
}

/**
 * Generic line / multi-line chart. Used for:
 *  - single fund 3y NAV (FundDetailModal)
 *  - multi-fund normalized comparison (FundComparisonChart)
 *
 * Honors the project's Braun-aesthetic chart settings — transparent
 * background, mono font, hairline grid.
 */
export function NavLineChart({ series, height = 240, showLegend = false, yLabel = "nav" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || series.length === 0 || series.every(s => s.data.length === 0)) return;

    const chart = createChart(el, {
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "var(--muted)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "var(--line-dim)", style: 2 },
        horzLines: { color: "var(--line-dim)", style: 2 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "var(--tech)", width: 1, style: 3 },
        horzLine: { color: "var(--tech)", width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: "var(--line-dim)",
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        borderColor: "var(--line-dim)",
        timeVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    for (const s of series) {
      const lineSeries = chart.addSeries(LineSeries, {
        color: s.color,
        lineWidth: 2,
        title: s.label,
        lastValueVisible: false,
        priceFormat: yLabel === "indexed"
          ? { type: "custom", formatter: (v: number) => v.toFixed(1) }
          : { type: "price", precision: 2, minMove: 0.01 },
      });
      const formatted: LineData<Time>[] = s.data.map(d => ({ time: d.time as Time, value: d.value }));
      lineSeries.setData(formatted);
    }

    chart.timeScale().fitContent();

    const resize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [series, height, yLabel]);

  return (
    <div style={{ width: "100%" }}>
      <div ref={containerRef} style={{ width: "100%" }} />
      {showLegend && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
          {series.map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, height: 2, background: s.color, display: "inline-block" }} />
              <span className="t-micro" style={{ color: "var(--muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
