"use client";

/**
 * VIXCurve — Volatility term structure panel.
 *
 * Shows VIX9D / VIX / VIX3M / VIX6M / VIX1Y as a line chart.
 * Classifies the curve shape:
 *   CONTANGO    → normal / calm → neutral
 *   FLAT        → no signal
 *   BACKWARDATION → near-term fear spike → contrarian buy signal
 *
 * Also shows: VVIX (vol of vol), SKEW index.
 */

import { useEffect, useState } from "react";

interface VIXPoint { tenor: string; days: number; value: number | null; }
interface VIXResponse {
  curve:          VIXPoint[];
  shape:          string;
  shapeNote:      string;
  signalStrength: number;
  signal:         string;
  frontSpot:      number | null;
  spot:           number | null;
  vvix:           number | null;
  skew:           number | null;
  as_of:          string;
}

const SIGNAL_COLOR: Record<string, string> = {
  strong_buy: "var(--bull)",
  buy:        "var(--bull)",
  neutral:    "var(--muted)",
  caution:    "var(--caution)",
  sell:       "var(--bear)",
};

export function VIXCurve({ compact = false }: { compact?: boolean }) {
  const [data, setData]   = useState<VIXResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vix-curve")
      .then(r => r.json())
      .then((d: VIXResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="shimmer" style={{ height: compact ? 100 : 160 }} />;
  if (!data)   return null;

  const points    = data.curve.filter(p => p.value !== null);
  const minV      = Math.min(...points.map(p => p.value!));
  const maxV      = Math.max(...points.map(p => p.value!));
  const range     = maxV - minV || 1;
  const W = 300; const H = 80;
  const pad = { l: 32, r: 8, t: 8, b: 20 };
  const scaleX    = (i: number) => pad.l + (i / (points.length - 1 || 1)) * (W - pad.l - pad.r);
  const scaleY    = (v: number) => pad.t + ((maxV - v) / range) * (H - pad.t - pad.b);
  const linePath  = points.map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i).toFixed(1)} ${scaleY(p.value!).toFixed(1)}`).join(" ");

  const signalColor = SIGNAL_COLOR[data.signal] ?? "var(--muted)";
  const shapeColor  = data.shape === "backwardation" ? "var(--bear)" : data.shape === "contango" ? "var(--bull)" : "var(--muted)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="t-body" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            VIX Term Structure
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
            Volatility curve 9d → 1y · shape = fear topology
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700, color: signalColor }}>
            {data.signal.replace("_", " ").toUpperCase()}
          </div>
          <div className="t-micro" style={{ color: shapeColor, marginTop: 2 }}>
            {data.shape.toUpperCase()} · strength {data.signalStrength}
          </div>
        </div>
      </div>

      {/* SVG curve */}
      {points.length >= 2 && (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          {/* Grid lines */}
          {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
            <g key={i}>
              <line x1={pad.l} y1={scaleY(v)} x2={W - pad.r} y2={scaleY(v)}
                stroke="var(--line)" strokeWidth={0.4} />
              <text x={pad.l - 4} y={scaleY(v) + 3} fontFamily="var(--font-mono)"
                fontSize={7} fill="var(--muted)" textAnchor="end">
                {v.toFixed(0)}
              </text>
            </g>
          ))}
          {/* Area fill */}
          <path
            d={`${linePath} L ${scaleX(points.length - 1)} ${H - pad.b} L ${scaleX(0)} ${H - pad.b} Z`}
            fill={shapeColor} fillOpacity={0.08}
          />
          {/* Line */}
          <path d={linePath} fill="none" stroke={shapeColor} strokeWidth={2} />
          {/* Points */}
          {points.map((p, i) => (
            <g key={p.tenor}>
              <circle cx={scaleX(i)} cy={scaleY(p.value!)} r={3} fill={shapeColor} stroke="var(--bg)" strokeWidth={1.2} />
              <text x={scaleX(i)} y={H - pad.b + 12} fontFamily="var(--font-mono)" fontSize={7} fill="var(--muted)" textAnchor="middle">
                {p.tenor}
              </text>
              <text x={scaleX(i)} y={scaleY(p.value!) - 6} fontFamily="var(--font-mono)" fontSize={7.5} fill={shapeColor} textAnchor="middle" fontWeight={600}>
                {p.value!.toFixed(1)}
              </text>
            </g>
          ))}
        </svg>
      )}

      {/* Interpretation */}
      {!compact && (
        <div style={{ padding: "8px 12px", background: "var(--bg-surface)", border: `1px solid ${shapeColor}`, borderLeft: `3px solid ${shapeColor}` }}>
          <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--ink)", lineHeight: 1.5 }}>
            {data.shapeNote}
          </div>
        </div>
      )}

      {/* VVIX + SKEW + Spot */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        <VixStat label="VIX SPOT" value={data.spot} decimals={1} color={data.spot && data.spot > 25 ? "var(--bear)" : "var(--muted)"} />
        <VixStat label="VVIX" value={data.vvix} decimals={1} color={(data.vvix ?? 0) > 100 ? "var(--bear)" : "var(--muted)"} note="vol of vol" />
        <VixStat label="SKEW" value={data.skew} decimals={1} color={(data.skew ?? 0) > 140 ? "var(--caution)" : "var(--muted)"} note="tail risk" />
      </div>
    </div>
  );
}

function VixStat({ label, value, decimals = 2, color, note }: { label: string; value: number | null; decimals?: number; color: string; note?: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", padding: "8px 10px" }}>
      <div className="t-micro">{label}</div>
      <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700, color, marginTop: 2 }}>
        {value !== null ? value.toFixed(decimals) : "—"}
      </div>
      {note && <div className="t-micro" style={{ color: "var(--dim)" }}>{note}</div>}
    </div>
  );
}
