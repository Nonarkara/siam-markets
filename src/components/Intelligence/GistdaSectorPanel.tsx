"use client";

/**
 * GistdaSectorPanel — GISTDA Thailand satellite-derived sector risk signals.
 *
 * Four sector risk meters, each driven by satellite + sensor data:
 *
 *   AGRICULTURE  ← fire hotspot density + NE flood extent
 *   TOURISM      ← Northern Thailand PM2.5 (haze season indicator)
 *   INDUSTRIAL   ← Central plain flood extent
 *   ENERGY       ← Total fire hotspot count (field burning signal)
 *
 * Source: GISTDA ArcGIS Portal (no API key) + Sphere API.
 * The earth is the data source. SET stocks are the output.
 */

import { useEffect, useState } from "react";
import type { GistdaSignalResponse, SectorSignal } from "@/app/api/gistda-signals/route";

const SECTOR_ICONS: Record<string, string> = {
  AGRICULTURE: "🌾",
  TOURISM:     "✈️",
  INDUSTRIAL:  "🏭",
  ENERGY:      "⚡",
};

function RiskMeter({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div style={{ position: "relative", height: 8, background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${pct}%`,
          background: color,
          transition: "width 600ms ease",
        }}
      />
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 48;
  const r    = 20;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(1, score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={4} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="square"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text
        x={size/2} y={size/2 + 4}
        fontFamily="var(--font-mono)"
        fontSize={11}
        fontWeight={700}
        fill={color}
        textAnchor="middle"
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}

export function GistdaSectorPanel() {
  const [data, setData] = useState<GistdaSignalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gistda-signals")
      .then(r => r.json())
      .then((d: GistdaSignalResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
        {[0, 1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 100 }} />)}
      </div>
    );
  }

  const signals = data?.sector_signals ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="t-body" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            🛰 GISTDA Sector Risk Signals
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
            Satellite + sensor derived · fire hotspots · flood extent · PM2.5 · daily
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {data?.source && (
            <span
              className="t-mono"
              style={{
                fontSize: "0.5625rem",
                color: data.source === "supabase" ? "var(--bull)" : "var(--caution)",
                border: `1px solid ${data.source === "supabase" ? "var(--bull)" : "var(--caution)"}`,
                padding: "1px 6px",
                letterSpacing: "0.1em",
              }}
            >
              {data.source === "supabase" ? "DAILY RUN" : "LIVE PORTAL"}
            </span>
          )}
          {data?.as_of && (
            <span className="t-micro" style={{ color: "var(--dim)" }}>{data.as_of}</span>
          )}
        </div>
      </div>

      {/* Sector signal cards */}
      <div className="gistda-grid">
        {Object.entries(signals).map(([sector, sig]) => (
          <div
            key={sector}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--line)",
              borderTop: `2px solid ${sig.color}`,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Title + score ring */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ScoreRing score={sig.score} color={sig.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: "0.875rem" }}>{SECTOR_ICONS[sector]}</span>
                  <span className="t-body" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{sector}</span>
                </div>
                <div
                  className="t-mono"
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: sig.color,
                    letterSpacing: "0.1em",
                    marginTop: 2,
                  }}
                >
                  {sig.score < 15 ? "LOW RISK" : sig.score < 40 ? "ELEVATED" : sig.score < 70 ? "HIGH RISK" : "CRITICAL"}
                </div>
              </div>
            </div>

            {/* Risk meter */}
            <RiskMeter score={sig.score} color={sig.color} />

            {/* Reason */}
            <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.5 }}>
              {sig.reason}
            </div>

            {/* Affected tickers */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {sig.affected.map(t => (
                <span
                  key={t}
                  className="t-mono"
                  style={{
                    fontSize: "0.5625rem",
                    fontWeight: 700,
                    color: sig.color,
                    border: `1px solid ${sig.color}`,
                    padding: "1px 5px",
                    letterSpacing: "0.08em",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Context notes */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--line)",
          borderLeft: "3px solid var(--braun-yellow, #ffd000)",
          padding: "10px 14px",
        }}
      >
        <div className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", marginBottom: 4, letterSpacing: "0.14em" }}>
          READING THE SIGNALS
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div className="t-body" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
            <strong>Agriculture risk ↑</strong> when fire hotspots appear in sugarcane/rubber provinces (Feb–May). Leading earnings indicator for KSL, KTIS, TVO by 4–8 weeks.
          </div>
          <div className="t-body" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
            <strong>Tourism risk ↑</strong> when Northern Thailand PM2.5 exceeds 75 µg/m³. Tourist arrivals drop 2–4 weeks later → CENTEL, MINT, ERW revenue pressure.
          </div>
          <div className="t-body" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
            <strong>Industrial risk ↑</strong> during central plain flooding (Aug–Nov). Check WHA/AMATA factory locations against flood polygons.
          </div>
        </div>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 8 }}>
          {data?.note}
        </div>
      </div>

      <style>{`
        .gistda-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 640px)  { .gistda-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .gistda-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>
    </div>
  );
}
