"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, type IChartApi, type ISeriesApi, type LineData, type Time } from "lightweight-charts";

export interface HistoryPoint {
  time: string; // YYYY-MM-DD
  price: number;
  grahamNumber: number;
}

interface Props {
  data: HistoryPoint[];
  height?: number;
}

export function GrahamOverlayChart({ data, height = 240 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || data.length === 0) return;

    const h = el.clientHeight > 0 ? el.clientHeight : height;

    const chart = createChart(el, {
      height: h,
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

    const priceSeries = chart.addSeries(LineSeries, {
      color: "var(--ink)",
      lineWidth: 2,
      title: "PRICE",
      lastValueVisible: false,
    });

    const grahamSeries = chart.addSeries(LineSeries, {
      color: "var(--bull)",
      lineWidth: 2,
      lineStyle: 2,
      title: "GRAHAM №",
      lastValueVisible: false,
    });

    const priceData: LineData<Time>[] = data.map(d => ({ time: d.time as Time, value: d.price }));
    const grahamData: LineData<Time>[] = data.map(d => ({ time: d.time as Time, value: d.grahamNumber }));

    priceSeries.setData(priceData);
    grahamSeries.setData(grahamData);
    chart.timeScale().fitContent();

    const resize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [data, height]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
