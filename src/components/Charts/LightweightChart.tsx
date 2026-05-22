"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from "lightweight-charts";

export interface OHLC {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface Props {
  data: OHLC[];
  height?: number;
}

export function LightweightChart({ data, height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || data.length === 0) return;

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
        vertLine: { color: "var(--tech)", width: 1, style: 3, labelBackgroundColor: "var(--tech)" },
        horzLine: { color: "var(--tech)", width: 1, style: 3, labelBackgroundColor: "var(--tech)" },
      },
      rightPriceScale: {
        borderColor: "var(--line-dim)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "var(--line-dim)",
        timeVisible: false,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "var(--bull)",
      downColor: "var(--bear)",
      borderUpColor: "var(--bull)",
      borderDownColor: "var(--bear)",
      wickUpColor: "var(--bull)",
      wickDownColor: "var(--bear)",
    });

    const formatted: CandlestickData<Time>[] = data.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    series.setData(formatted);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [data, height]);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}
