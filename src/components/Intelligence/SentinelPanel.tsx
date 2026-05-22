"use client";

/**
 * SentinelPanel — Sentinel-2 satellite intelligence for Thai economic zones.
 *
 * Six zones mapped to SET sectors:
 *   • Laem Chabang Port        → logistics/shipping
 *   • Eastern Economic Corridor → industrial/tech
 *   • Chao Phraya agriculture  → agri commodities
 *   • Bangkok construction     → real estate
 *   • Central Thailand solar   → renewable energy
 *   • Upper Mekong hydro       → hydropower
 *
 * Each card shows last cloud-free acquisition date, cloud cover %,
 * freshness indicator, and a direct link to EO Browser for the
 * actual imagery.
 *
 * Data: Element84 Earth Search STAC API — free, no key required.
 * Cadence: Sentinel-2 revisits any point every 5 days (10m resolution).
 * Sentinel-1 SAR passes every 6–12 days regardless of cloud cover.
 */

import { useEffect, useState } from "react";
import type { SentinelZone } from "@/app/api/sentinel/route";

interface ApiResponse {
  zones:  SentinelZone[];
  as_of:  string;
  note:   string;
}

const SECTOR_COLOR: Record<string, string> = {
  "Logistics / Shipping (WHA, WHART)":      "var(--tech)",
  "Industrial / Tech (DELTA, WHA, AMATA)":  "var(--bull)",
  "Agriculture (Thai sugar, rubber export prices)": "var(--caution)",
  "Real Estate (CPN, LH, SPALI, MAJOR)":    "#a0a0ff",
  "Renewable Energy (GULF, BGRIM, RATCH, GPSC)": "#ffd000",
  "Hydropower (RATCH, EGCO, CKP)":          "#00b8ff",
};

function freshnessBadge(daysOld: number | null): { label: string; color: string } {
  if (daysOld === null)  return { label: "NO DATA",    color: "var(--dim)" };
  if (daysOld <= 5)      return { label: "FRESH",      color: "var(--bull)" };
  if (daysOld <= 12)     return { label: "RECENT",     color: "var(--caution)" };
  if (daysOld <= 20)     return { label: "AGING",      color: "#ff7a30" };
  return                        { label: "STALE",      color: "var(--bear)" };
}

function CloudBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="t-micro" style={{ color: "var(--dim)" }}>—</span>;
  const color = pct < 10 ? "var(--bull)" : pct < 25 ? "var(--caution)" : "var(--bear)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: "var(--line)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: color }} />
      </div>
      <span className="t-mono" style={{ fontSize: "0.625rem", color }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

export function SentinelPanel() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sentinel")
      .then(r => r.json())
      .then((d: ApiResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 140 }} />
        ))}
      </div>
    );
  }

  const zones = data?.zones ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="t-body" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            Sentinel-2 Satellite Intelligence
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
            6 Thai economic zones · 10m optical imagery · free via Element84 Earth Search STAC
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "≤ 5d", color: "var(--bull)",    text: "FRESH" },
            { label: "≤ 12d", color: "var(--caution)", text: "RECENT" },
            { label: "> 20d", color: "var(--bear)",    text: "STALE" },
          ].map(b => (
            <span key={b.text} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, background: b.color }} />
              <span className="t-micro" style={{ color: "var(--muted)" }}>{b.label} {b.text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Zone cards */}
      <div className="sentinel-grid">
        {zones.map(zone => {
          const badge  = freshnessBadge(zone.daysOld);
          const accent = SECTOR_COLOR[zone.sector] ?? "var(--muted)";
          return (
            <div
              key={zone.id}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--line)",
                borderTop: `2px solid ${accent}`,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Title row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div className="t-body" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{zone.name}</div>
                  <div className="t-micro" style={{ color: accent, marginTop: 2 }}>{zone.sector}</div>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.5rem",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: badge.color,
                    border: `1px solid ${badge.color}`,
                    padding: "2px 6px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {badge.label}
                </span>
              </div>

              {/* Metadata */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div className="t-micro" style={{ marginBottom: 2 }}>LAST CLEAR SCENE</div>
                  <div className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                    {zone.lastScene
                      ? zone.lastScene.slice(0, 10)
                      : "No data"}
                  </div>
                  {zone.daysOld !== null && (
                    <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
                      {zone.daysOld} day{zone.daysOld !== 1 ? "s" : ""} ago
                    </div>
                  )}
                </div>
                <div>
                  <div className="t-micro" style={{ marginBottom: 4 }}>CLOUD COVER</div>
                  <CloudBar pct={zone.cloudPct} />
                </div>
              </div>

              {/* What to look for */}
              <div className="t-micro" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
                {zone.indicator}
              </div>

              {/* Thumbnail if available */}
              {zone.thumbUrl && (
                <img
                  src={zone.thumbUrl}
                  alt={`Sentinel-2 thumbnail for ${zone.name}`}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: 80,
                    objectFit: "cover",
                    filter: "brightness(0.85) contrast(1.1)",
                  }}
                />
              )}

              {/* Action */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <a
                  href={zone.eoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: accent,
                    border: `1px solid ${accent}`,
                    padding: "4px 10px",
                    textDecoration: "none",
                    minHeight: 26,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  EO BROWSER ↗
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* How to read this */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--line)",
          borderLeft: "3px solid var(--braun-yellow, #ffd000)",
          padding: "10px 14px",
        }}
      >
        <div className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", marginBottom: 6, letterSpacing: "0.14em" }}>
          HOW TO USE
        </div>
        <div className="t-body" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
          Click <strong>EO Browser ↗</strong> for the actual satellite image. Use the NDVI layer (red/NIR bands)
          on the agriculture zone to check crop health before Thai export data is published — a leading indicator
          for soft commodity prices. Check Laem Chabang container yard fill rate visually when shipping stocks
          look unusual. Compare the EEC industrial zone between months to spot capacity expansion.
        </div>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 6 }}>
          {data?.note}
        </div>
      </div>

      <style>{`
        .sentinel-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 640px)  { .sentinel-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .sentinel-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </div>
  );
}
