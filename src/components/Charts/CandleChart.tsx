"use client";

/**
 * CandleChart — Trade Desk visual anchor.
 *
 * TradingView's lightweight-charts engine, dressed in the
 * project's Braun/Rams design vocabulary.
 *
 * Overlays (all computed from technical.ts pure functions):
 *   • EMA 9  — short-term momentum (var(--tech) blue)
 *   • EMA 21 — medium-term trend   (var(--caution) orange)
 *   • VWAP   — institutional anchor (var(--ink) white, dashed)
 *   • BB upper/lower — volatility envelope (var(--muted), dotted)
 *   • S/R lines — top 2 support (bull) + top 2 resistance (bear)
 *
 * Spec: zero border-radius, hairline borders, IBM Plex Mono numerals,
 * near-black backgrounds. Compatible with Braun heritage tokens.
 */

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type CandlestickData,
  type LineData,
  type Time,
} from "lightweight-charts";
import type { OHLCV } from "@/lib/types";
import {
  ema,
  bollingerBands,
  vwap,
  findSupportResistance,
} from "@/lib/technical";

interface Props {
  data: OHLCV[];
  height?: number;
}

// ── Colour tokens (resolved at runtime from the CSS vars) ─────────
const getVar = (name: string): string =>
  typeof window !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || name
    : name;

// ── Legend item ───────────────────────────────────────────────────
function LegendDot({
  label,
  color,
  dashed,
}: {
  label: string;
  color: string;
  dashed?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <svg width="14" height="8" style={{ flexShrink: 0 }}>
        <line
          x1="0"
          y1="4"
          x2="14"
          y2="4"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dashed ? "3,2" : undefined}
        />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-micro)",
          color: "var(--muted)",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export function CandleChart({ data, height = 360 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || data.length === 0) return;

    // ── Chart scaffold ───────────────────────────────────────────
    const chart = createChart(el, {
      height,
      layout: {
        background: { color: "transparent" },
        textColor: getVar("--muted"),
        fontFamily: getVar("--font-mono"),
        fontSize: 10,
      },
      grid: {
        vertLines: { color: getVar("--line"), style: 2 },
        horzLines: { color: getVar("--line"), style: 2 },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: getVar("--ink"),
          width: 1,
          style: 3,
          labelBackgroundColor: getVar("--bg-raised"),
        },
        horzLine: {
          color: getVar("--ink"),
          width: 1,
          style: 3,
          labelBackgroundColor: getVar("--bg-raised"),
        },
      },
      rightPriceScale: {
        borderColor: getVar("--line"),
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: getVar("--line"),
        timeVisible: false,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // ── 1. Candlesticks ──────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: getVar("--bull"),
      downColor: getVar("--bear"),
      borderUpColor: getVar("--bull"),
      borderDownColor: getVar("--bear"),
      wickUpColor: getVar("--bull"),
      wickDownColor: getVar("--bear"),
    });

    const candleData: CandlestickData<Time>[] = data.map((d) => ({
      time: d.date.split("T")[0] as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(candleData);

    // ── 2. Compute indicators (pure, no side-effects) ────────────
    const closes = data.map((d) => d.close);
    const ema9Vals  = ema(closes, 9);
    const ema21Vals = ema(closes, 21);
    const vwapVals  = vwap(data);
    const bb        = bollingerBands(closes, 20, 2);
    const sr        = findSupportResistance(data);

    /**
     * lightweight-charts line data must have dates in ascending order
     * and each array of indicator values is right-aligned to the data
     * array (i.e., the last value in indicators[n] matches data[last]).
     */
    const toLineData = (values: number[]): LineData<Time>[] => {
      const offset = data.length - values.length;
      return values
        .map((value, i) => ({
          time: data[offset + i].date.split("T")[0] as Time,
          value,
        }))
        .filter((d) => Number.isFinite(d.value));
    };

    // ── 3. EMA 9 — tech/blue ────────────────────────────────────
    const ema9Series = chart.addSeries(LineSeries, {
      color: getVar("--tech"),
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    ema9Series.setData(toLineData(ema9Vals));

    // ── 4. EMA 21 — caution/orange ───────────────────────────────
    const ema21Series = chart.addSeries(LineSeries, {
      color: getVar("--caution"),
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    ema21Series.setData(toLineData(ema21Vals));

    // ── 5. VWAP — ink/white, dashed ─────────────────────────────
    const vwapSeries = chart.addSeries(LineSeries, {
      color: getVar("--ink"),
      lineWidth: 1,
      lineStyle: 2, // dashed
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    vwapSeries.setData(toLineData(vwapVals));

    // ── 6. Bollinger Bands — muted, dotted ──────────────────────
    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: getVar("--muted"),
      lineWidth: 1,
      lineStyle: 3, // dotted
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    bbUpperSeries.setData(toLineData(bb.upper));

    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: getVar("--muted"),
      lineWidth: 1,
      lineStyle: 3, // dotted
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    bbLowerSeries.setData(toLineData(bb.lower));

    // ── 7. Support / Resistance price lines ─────────────────────
    // Top 2 of each, drawn on the candlestick series so they
    // share the same price axis without adding extra series.
    sr.support.slice(0, 2).forEach((level) => {
      candleSeries.createPriceLine({
        price: level.price,
        color: getVar("--bull"),
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "SUP",
      });
    });

    sr.resistance.slice(0, 2).forEach((level) => {
      candleSeries.createPriceLine({
        price: level.price,
        color: getVar("--bear"),
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "RES",
      });
    });

    chart.timeScale().fitContent();

    // ── Responsive resize ────────────────────────────────────────
    const onResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  // ── Legend ────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--line)",
      }}
    >
      {/* Top label bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "7px 12px",
          borderBottom: "1px solid var(--line)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro)",
            color: "var(--dim)",
            letterSpacing: "0.14em",
            fontWeight: 700,
            marginRight: 4,
          }}
        >
          TERMINAL CHART
        </span>

        <LegendDot label="EMA 9"     color="var(--tech)"    />
        <LegendDot label="EMA 21"    color="var(--caution)" />
        <LegendDot label="VWAP"      color="var(--ink)"     dashed />
        <LegendDot label="BB(20,2)"  color="var(--muted)"   dashed />

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <LegendDot label="SUP"  color="var(--bull)" dashed />
          <LegendDot label="RES"  color="var(--bear)" dashed />
        </div>
      </div>

      {/* Chart canvas */}
      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}
