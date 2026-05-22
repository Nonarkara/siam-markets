"use client";

/**
 * ThaiCommodities — commodity prices relevant to SET sectors.
 *
 * WTI/Brent/Nat Gas → PTT, PTTEP, GULF
 * Sugar, Rubber, Corn, Soy, Wheat → CPF, KTIS, STA, GFPT
 * Gold, Silver, Copper → metals/risk
 * LNG Asia (FRED) → GULF, BGRIM
 * ENSO phase (NOAA ONI) → crop season risk signal
 */

import { useEffect, useState } from "react";

interface CommodityItem {
  id:         string;
  name:       string;
  category:   string;
  unit:       string;
  price:      number | null;
  changePct:  number | null;
  color:      string;
  setStocks:  string[];
  signal:     string;
  source:     string;
}

interface ENSOData {
  phase:  string;
  oni:    number | null;
  note:   string;
}

interface CommoditiesResponse {
  items:  CommodityItem[];
  enso:   ENSOData;
  as_of:  string;
}

const CATEGORY_ORDER = ["energy", "agriculture", "metals", "crypto"];

const CATEGORY_LABEL: Record<string, string> = {
  energy:      "⚡ Energy",
  agriculture: "🌾 Agriculture",
  metals:      "⛏ Metals",
  crypto:      "₿ Crypto",
};

const ENSO_COLOR: Record<string, string> = {
  "Strong El Niño": "var(--bear)",
  "El Niño":        "var(--caution)",
  "Strong La Niña": "var(--tech)",
  "La Niña":        "var(--tech)",
  "Neutral":        "var(--muted)",
  "unknown":        "var(--dim)",
};

export function ThaiCommodities() {
  const [data, setData]       = useState<CommoditiesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/commodities-th")
      .then(r => r.json())
      .then((d: CommoditiesResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="shimmer" style={{ height: 200 }} />;

  const items     = data?.items ?? [];
  const enso      = data?.enso;
  const byCategory: Record<string, CommodityItem[]> = {};
  for (const it of items) {
    if (!byCategory[it.category]) byCategory[it.category] = [];
    byCategory[it.category].push(it);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ENSO banner */}
      {enso && enso.phase !== "unknown" && (
        <div style={{
          padding: "8px 14px",
          background: `color-mix(in srgb, ${ENSO_COLOR[enso.phase] ?? "var(--muted)"} 12%, var(--bg-surface))`,
          border: `1px solid ${ENSO_COLOR[enso.phase] ?? "var(--line)"}`,
          borderLeft: `3px solid ${ENSO_COLOR[enso.phase] ?? "var(--muted)"}`,
          display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
        }}>
          <div>
            <div className="t-mono" style={{ fontWeight: 700, fontSize: "0.75rem", color: ENSO_COLOR[enso.phase] }}>
              🌊 ENSO · {enso.phase.toUpperCase()}
              {enso.oni !== null && ` · ONI ${enso.oni > 0 ? "+" : ""}${enso.oni}`}
            </div>
          </div>
          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--ink)", flex: 1, lineHeight: 1.5 }}>
            {enso.note}
          </div>
        </div>
      )}

      {/* Commodity groups */}
      {CATEGORY_ORDER.map(cat => {
        const catItems = byCategory[cat];
        if (!catItems?.length) return null;
        return (
          <div key={cat}>
            <div className="t-micro" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>
              {CATEGORY_LABEL[cat] ?? cat.toUpperCase()}
            </div>
            <div className="commodity-grid">
              {catItems.map(item => {
                const up = (item.changePct ?? 0) > 0;
                const dn = (item.changePct ?? 0) < 0;
                return (
                  <div
                    key={item.id}
                    title={item.signal}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--line)",
                      borderTop: `2px solid ${item.color}`,
                      padding: "10px 12px",
                    }}
                  >
                    <div className="t-body" style={{ fontSize: "0.75rem", fontWeight: 700, color: item.color }}>{item.name}</div>
                    <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 6 }}>{item.unit}</div>

                    <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700 }}>
                      {item.price !== null
                        ? item.price > 1000 ? item.price.toLocaleString() : item.price.toFixed(2)
                        : "—"}
                    </div>
                    {item.changePct !== null && (
                      <div className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: up ? "var(--bull)" : dn ? "var(--bear)" : "var(--muted)" }}>
                        {up ? "+" : ""}{item.changePct.toFixed(2)}%
                      </div>
                    )}

                    {/* Affected SET tickers */}
                    <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                      {item.setStocks.slice(0, 4).map(t => (
                        <span key={t} className="t-mono" style={{ fontSize: "0.45rem", fontWeight: 700, color: item.color, border: `1px solid ${item.color}`, padding: "0 3px", letterSpacing: "0.06em" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <style>{`
        .commodity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
