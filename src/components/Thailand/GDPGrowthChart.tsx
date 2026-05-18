"use client";

import { useEffect, useRef } from "react";
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler,
  type ChartDataset, type Plugin,
} from "chart.js";
import type { GdpPoint } from "@/lib/api/thailand-economy";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

interface Props {
  data: GdpPoint[];
  height?: number;
}

// Major events to annotate on the chart — let the line tell a story
const EVENTS: { year: number; label: string; abbreviation: string }[] = [
  { year: 1997, label: "Asian Financial Crisis (Tom Yum Goong)", abbreviation: "TYG" },
  { year: 2004, label: "Boxing Day Tsunami",                     abbreviation: "TSUNAMI" },
  { year: 2008, label: "Global Financial Crisis",                abbreviation: "GFC" },
  { year: 2011, label: "Great Bangkok Flood",                    abbreviation: "FLOOD" },
  { year: 2014, label: "Military Coup",                          abbreviation: "COUP" },
  { year: 2020, label: "COVID-19 Lockdown",                      abbreviation: "COVID" },
];

export function GDPGrowthChart({ data, height = 240 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Build gradient fill above/below zero
    const labels = data.map(d => d.year.toString());
    const values = data.map(d => d.growthPct ?? 0);

    // Event annotation plugin
    const eventAnnotations: Plugin<"line"> = {
      id: "eventAnnotations",
      afterDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales.x) return;
        ctx.save();
        ctx.strokeStyle = "rgba(255, 149, 0, 0.35)";
        ctx.fillStyle   = "rgba(255, 149, 0, 0.85)";
        ctx.font        = "9px 'IBM Plex Mono', monospace";
        ctx.setLineDash([3, 3]);

        for (const ev of EVENTS) {
          const xPos = scales.x.getPixelForValue(labels.indexOf(ev.year.toString()));
          if (xPos < chartArea.left || xPos > chartArea.right) continue;
          ctx.beginPath();
          ctx.moveTo(xPos, chartArea.top + 16);
          ctx.lineTo(xPos, chartArea.bottom);
          ctx.stroke();
          ctx.fillText(ev.abbreviation, xPos + 3, chartArea.top + 12);
        }
        ctx.restore();
      },
    };

    const datasets: ChartDataset<"line">[] = [{
      label: "GDP Growth %",
      data: values,
      borderColor: "#00c896",
      backgroundColor: (ctxPoint) => {
        const v = ctxPoint.parsed?.y ?? 0;
        return v < 0 ? "rgba(255, 59, 48, 0.18)" : "rgba(0, 200, 150, 0.14)";
      },
      borderWidth: 1.8,
      pointRadius: (ctxPoint) => {
        const v = ctxPoint.parsed?.y ?? 0;
        return Math.abs(v) > 5 ? 3 : 0; // emphasize crisis + boom years
      },
      pointBackgroundColor: (ctxPoint) => {
        const v = ctxPoint.parsed?.y ?? 0;
        return v < 0 ? "#ff3b30" : "#00c896";
      },
      fill: true,
      tension: 0,
      segment: {
        borderColor: ctxSeg => {
          const v = ctxSeg.p1.parsed?.y ?? 0;
          return v < 0 ? "#ff3b30" : "#00c896";
        },
      },
    }];

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: "easeInOutQuart" },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "rgba(255,255,255,0.4)",
              font: { family: "IBM Plex Mono", size: 9 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12,
            },
          },
          y: {
            position: "right",
            grid: {
              color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.04)",
            },
            ticks: {
              color: "rgba(255,255,255,0.45)",
              font: { family: "IBM Plex Mono", size: 9 },
              callback: (v) => `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(0)}%`,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.92)",
            titleFont: { family: "IBM Plex Mono", size: 11 },
            bodyFont:  { family: "IBM Plex Mono", size: 10 },
            borderColor: "rgba(0,200,150,0.6)",
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: (ctxItem) => {
                const yr = parseInt(labels[ctxItem.dataIndex]);
                const v = values[ctxItem.dataIndex];
                const event = EVENTS.find(e => e.year === yr);
                const lines = [`GDP Growth: ${v > 0 ? "+" : ""}${v.toFixed(2)}%`];
                if (event) lines.push(`⚠ ${event.label}`);
                return lines;
              },
            },
          },
        },
      },
      plugins: [eventAnnotations],
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
