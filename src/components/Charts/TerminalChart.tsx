"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { HistoricalPoint } from "@/lib/api/yahoo";
import { normalizeToPercentChange } from "@/lib/api/yahoo";

// Register Chart.js modules
Chart.register(
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler,
);

// ─── COBOL/Assembly terminal color palette ────────────────────────

export const TERMINAL = {
  bg:        "#000000",
  green:     "#00ff41",
  greenDim:  "rgba(0,255,65,0.35)",
  greenFaint:"rgba(0,255,65,0.06)",
  amber:     "#ffb800",
  amberDim:  "rgba(255,184,0,0.35)",
  cyan:      "#00d4ff",
  cyanDim:   "rgba(0,212,255,0.35)",
  red:       "#ff4444",
  redDim:    "rgba(255,68,68,0.35)",
  purple:    "#bf80ff",
  purpleDim: "rgba(191,128,255,0.35)",
  grid:      "rgba(0,255,65,0.07)",
  gridStrong:"rgba(0,255,65,0.14)",
  text:      "rgba(0,255,65,0.85)",
  textDim:   "rgba(0,255,65,0.4)",
  font:      "'IBM Plex Mono', 'Courier New', monospace",
};

// Colors for multi-stock comparison
const STOCK_COLORS = [
  { line: TERMINAL.green,  dim: TERMINAL.greenDim  },
  { line: TERMINAL.amber,  dim: TERMINAL.amberDim  },
  { line: TERMINAL.cyan,   dim: TERMINAL.cyanDim   },
  { line: TERMINAL.red,    dim: TERMINAL.redDim    },
  { line: TERMINAL.purple, dim: TERMINAL.purpleDim },
];

interface SingleDataset {
  mode: "single";
  label: string;
  points: HistoricalPoint[];
  color?: { line: string; dim: string };
}

interface CompareDataset {
  mode: "compare";
  datasets: {
    label: string;
    points: HistoricalPoint[];
  }[];
}

type ChartDataset = SingleDataset | CompareDataset;

interface Props {
  data: ChartDataset;
  height?: number;
  showVolume?: boolean;
  title?: string;
  subtitle?: string;
}

function formatDate(date: string, numPoints: number): string {
  const d = new Date(date);
  if (numPoints > 180) return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  if (numPoints > 60)  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TerminalChart({ data, height = 220, showVolume = false, title, subtitle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ date: string; values: { label: string; value: string; color: string }[] } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    let labels: string[] = [];
    let datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; fill?: boolean }[] = [];

    if (data.mode === "single") {
      const points = data.points;
      labels = points.map((p, i) => i % Math.max(1, Math.floor(points.length / 8)) === 0 ? formatDate(p.date, points.length) : "");
      const color = data.color ?? STOCK_COLORS[0];
      datasets = [{
        label: data.label,
        data: points.map(p => p.close),
        borderColor: color.line,
        backgroundColor: color.dim,
        fill: false,
      }];
    } else {
      // Compare mode: normalize all to % change
      if (data.datasets.length === 0 || data.datasets[0].points.length === 0) return;
      const refPoints = data.datasets[0].points;
      labels = refPoints.map((p, i) => i % Math.max(1, Math.floor(refPoints.length / 8)) === 0 ? formatDate(p.date, refPoints.length) : "");
      datasets = data.datasets.map((ds, i) => {
        const color = STOCK_COLORS[i % STOCK_COLORS.length];
        const normalized = normalizeToPercentChange(ds.points);
        return {
          label: ds.label,
          data: normalized.map(p => Math.round(p.pct * 100) / 100),
          borderColor: color.line,
          backgroundColor: color.dim,
          fill: false,
        };
      });
    }

    const isCompare = data.mode === "compare";

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: datasets.map(ds => ({
        ...ds,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: ds.borderColor,
        tension: 0,
      }))},
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: "easeInOutQuart" },
        interaction: {
          mode: "index",
          intersect: false,
        },
        onHover: (_, elements, chart) => {
          if (elements.length === 0) {
            setHoverInfo(null);
            return;
          }
          const idx = elements[0].index;
          const labelDate = chart.data.labels?.[idx] as string;
          const values = chart.data.datasets.map(ds => ({
            label: ds.label ?? "",
            value: isCompare
              ? `${(ds.data[idx] as number) > 0 ? "+" : ""}${(ds.data[idx] as number).toFixed(2)}%`
              : `฿${(ds.data[idx] as number).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            color: ds.borderColor as string,
          }));
          if (labelDate) setHoverInfo({ date: labelDate, values });
        },
        scales: {
          x: {
            grid: {
              color: TERMINAL.grid,
              tickColor: TERMINAL.gridStrong,
            },
            border: { color: TERMINAL.gridStrong },
            ticks: {
              color: TERMINAL.textDim,
              font: { family: TERMINAL.font, size: 9 },
              maxRotation: 0,
            },
          },
          y: {
            position: "right",
            grid: {
              color: TERMINAL.grid,
              tickColor: TERMINAL.gridStrong,
            },
            border: { color: TERMINAL.gridStrong },
            ticks: {
              color: TERMINAL.textDim,
              font: { family: TERMINAL.font, size: 9 },
              callback: (val) => isCompare
                ? `${Number(val) > 0 ? "+" : ""}${Number(val).toFixed(1)}%`
                : `฿${Number(val).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            },
          },
        },
        plugins: {
          legend: {
            display: data.mode === "compare" && (data as CompareDataset).datasets.length > 1,
            position: "top",
            labels: {
              color: TERMINAL.text,
              font: { family: TERMINAL.font, size: 9 },
              boxWidth: 12,
              boxHeight: 1,
              padding: 12,
              usePointStyle: false,
            },
          },
          tooltip: { enabled: false }, // use custom hover
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  const firstLast = data.mode === "single" && data.points.length > 1
    ? { first: data.points[0].close, last: data.points[data.points.length - 1].close }
    : null;
  const pct = firstLast ? ((firstLast.last - firstLast.first) / firstLast.first) * 100 : null;

  return (
    <div style={{
      background: TERMINAL.bg,
      border: `1px solid ${TERMINAL.greenDim}`,
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Terminal header */}
      <div style={{
        padding: "6px 12px",
        borderBottom: `1px solid ${TERMINAL.greenDim}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(0,255,65,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Phosphor blink */}
          <span style={{
            fontFamily: TERMINAL.font,
            fontSize: "0.55rem",
            color: TERMINAL.green,
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}>
            ■
          </span>
          <div>
            {title && (
              <div style={{
                fontFamily: TERMINAL.font,
                fontSize: "0.75rem",
                color: TERMINAL.green,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontFamily: TERMINAL.font, fontSize: "0.5rem", color: TERMINAL.textDim, letterSpacing: "0.06em" }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {pct !== null && (
          <div style={{
            fontFamily: TERMINAL.font,
            fontSize: "0.75rem",
            fontWeight: 700,
            color: pct >= 0 ? TERMINAL.green : TERMINAL.red,
            letterSpacing: "0.04em",
          }}>
            {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
          </div>
        )}
      </div>

      {/* Hover info strip */}
      {hoverInfo && (
        <div style={{
          padding: "4px 12px",
          borderBottom: `1px solid ${TERMINAL.greenDim}`,
          display: "flex",
          gap: 16,
          alignItems: "center",
          background: "rgba(0,255,65,0.04)",
          flexWrap: "wrap",
        }}>
          <span style={{ fontFamily: TERMINAL.font, fontSize: "0.55rem", color: TERMINAL.textDim }}>
            {hoverInfo.date}
          </span>
          {hoverInfo.values.map(v => (
            <span key={v.label} style={{ fontFamily: TERMINAL.font, fontSize: "0.6rem", color: v.color, fontWeight: 700 }}>
              {v.label}: {v.value}
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ padding: "8px 4px 4px 4px", height }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Terminal footer */}
      <div style={{
        padding: "3px 12px",
        borderTop: `1px solid ${TERMINAL.greenDim}`,
        display: "flex",
        justifyContent: "space-between",
        background: "rgba(0,255,65,0.03)",
      }}>
        <span style={{ fontFamily: TERMINAL.font, fontSize: "0.5rem", color: TERMINAL.textDim, letterSpacing: "0.06em" }}>
          SRC: YAHOO FINANCE · NO KEY · DELAY: 15MIN
        </span>
        <span style={{ fontFamily: TERMINAL.font, fontSize: "0.5rem", color: TERMINAL.textDim }}>
          {data.mode === "compare" ? "INDEXED TO 100 AT START" : "PRICE IN THB"}
        </span>
      </div>
    </div>
  );
}
