"use client";

/**
 * Google Trends Thailand panel — top searches, financial first.
 * Pulls from /api/trends-feed (cached 15 min). Each row shows the query,
 * traffic estimate, and 2-3 related queries the crowd is associating.
 */

import { useEffect, useState } from "react";
import type { TrendItem } from "@/app/api/trends-feed/route";

export function TrendsPanel() {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trends-feed")
      .then(r => r.json())
      .then((data: TrendItem[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--line)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "var(--bg-raised)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            background: "var(--braun-yellow, #ffd000)",
            display: "inline-block",
            animation: "tvpulse 2s ease-in-out infinite",
          }}
        />
        <span className="t-body" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
          GOOGLE TRENDS · THAILAND
        </span>
        <span className="t-micro" style={{ color: "var(--muted)", marginLeft: "auto" }}>
          REAL-TIME · FINANCIAL FIRST
        </span>
      </div>

      <div>
        {loading && (
          <div style={{ padding: 16 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="shimmer" style={{ height: 36, marginBottom: 4 }} />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ padding: 20, textAlign: "center" }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>NO TRENDS AVAILABLE</span>
          </div>
        )}

        {!loading && items.map((t, i) => (
          <div
            key={t.title + i}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 12,
              alignItems: "center",
              padding: "10px 14px",
              borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none",
              background: t.isFinancial ? "rgba(255, 208, 0, 0.04)" : "transparent",
            }}
          >
            <span
              className="t-mono"
              style={{
                fontSize: "0.6875rem",
                color: t.isFinancial ? "var(--braun-yellow, #ffd000)" : "var(--dim)",
                width: 26,
                textAlign: "right",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span
                  className="t-body"
                  style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}
                >
                  {t.title}
                </span>
                {t.isFinancial && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.5rem",
                      letterSpacing: "0.14em",
                      color: "var(--braun-yellow, #ffd000)",
                      border: "1px solid var(--braun-yellow, #ffd000)",
                      padding: "1px 4px",
                      fontWeight: 700,
                    }}
                  >
                    FIN
                  </span>
                )}
              </div>
              {t.relatedQueries.length > 0 && (
                <div className="t-micro" style={{ color: "var(--muted)", marginTop: 3 }}>
                  {t.relatedQueries.slice(0, 3).join(" · ")}
                </div>
              )}
            </div>

            <span
              className="t-mono"
              style={{
                fontSize: "0.75rem",
                color: t.isFinancial ? "var(--braun-yellow, #ffd000)" : "var(--muted)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {t.trafficLabel}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tvpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
