"use client";

/**
 * GrangerTable — p-value heatmap of which macro variables
 * Granger-cause SET returns at each lag.
 *
 * Layout:
 *   Rows  = macro drivers (sorted by lowest p-value)
 *   Cols  = lags: 1d · 3d · 5d · 10d
 *   Cell  = p-value coloured by significance:
 *           p < 0.01 → strong (bull)
 *           p < 0.05 → significant (caution)
 *           p ≥ 0.05 → not significant (dim)
 *
 * Reverse direction (SET → driver) shown as a small badge
 * on cells where the forward relationship is significant.
 */

import { useEffect, useMemo, useState } from "react";
import type { GrangerSummary, GrangerRow } from "@/app/api/granger/route";

const LAGS = [1, 3, 5, 10];

function pColor(p: number): string {
  if (p < 0.01) return "var(--bull)";
  if (p < 0.05) return "var(--caution)";
  return "var(--dim)";
}

function pBg(p: number): string {
  if (p < 0.01) return "rgba(0,200,150,0.18)";
  if (p < 0.05) return "rgba(255,149,0,0.12)";
  return "transparent";
}

function sigLabel(p: number): string {
  if (p < 0.001) return "***";
  if (p < 0.01)  return "**";
  if (p < 0.05)  return "*";
  return "";
}

export function GrangerTable() {
  const [data, setData] = useState<GrangerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ driver: string; lag: number; p: number; f: number } | null>(null);

  useEffect(() => {
    fetch("/api/granger")
      .then(r => r.json())
      .then((d: GrangerSummary) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Build lookup: driver|lag → row data
  const cellMap = useMemo(() => {
    const map: Record<string, { fwd: GrangerRow | null; rev: GrangerRow | null }> = {};
    if (!data?.matrix) return map;
    for (const row of data.matrix) {
      const key = `${row.driver}|${row.lag_days}`;
      if (!map[key]) map[key] = { fwd: null, rev: null };
      if (row.direction === "driver→SET")  map[key].fwd = row;
      if (row.direction === "SET→driver") map[key].rev = row;
    }
    return map;
  }, [data]);

  const drivers = data?.top_drivers ?? [];

  if (loading) {
    return (
      <div>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="shimmer" style={{ height: 32, marginBottom: 4 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="t-body" style={{ fontWeight: 700, fontSize: "0.875rem" }}>
            Macro → SET Granger Causality
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
            Which variables <em>predict</em> SET returns? (F-test p-value · * p&lt;0.05 · ** p&lt;0.01)
          </div>
        </div>
        {data?.run_date && (
          <div className="t-micro" style={{ color: "var(--dim)" }}>
            Run {data.run_date}
          </div>
        )}
      </div>

      {/* Heatmap table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-raised)" }}>
              <th className="t-micro" style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--line)", width: "45%" }}>
                DRIVER
              </th>
              {LAGS.map(l => (
                <th key={l} className="t-micro" style={{ textAlign: "center", padding: "6px 10px", borderBottom: "1px solid var(--line)" }}>
                  {l}d LAG
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 && (
              <tr>
                <td colSpan={5} className="t-micro" style={{ padding: "16px 10px", color: "var(--dim)", textAlign: "center" }}>
                  No data yet — run python3 ingestion/granger.py
                </td>
              </tr>
            )}
            {drivers.map(drv => (
              <tr
                key={drv.driver}
                style={{
                  borderBottom: "1px solid var(--line)",
                  background: drv.significant ? "rgba(255,149,0,0.04)" : "transparent",
                }}
              >
                <td style={{ padding: "7px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 8, height: 8,
                        background: drv.significant ? "var(--bull)" : "var(--dim)",
                        flexShrink: 0,
                      }}
                    />
                    <span className="t-body" style={{ fontSize: "0.75rem", fontWeight: drv.significant ? 700 : 500 }}>
                      {drv.label}
                    </span>
                  </div>
                </td>
                {LAGS.map(lag => {
                  const cell = cellMap[`${drv.driver}|${lag}`];
                  const fwd = cell?.fwd;
                  const rev = cell?.rev;
                  const p = fwd?.p_value ?? null;
                  const f = fwd?.f_stat ?? null;
                  return (
                    <td
                      key={lag}
                      style={{
                        padding: "6px 8px",
                        textAlign: "center",
                        background: p !== null ? pBg(p) : "transparent",
                        cursor: p !== null ? "help" : "default",
                      }}
                      onMouseEnter={() => p !== null ? setTooltip({ driver: drv.label, lag, p, f: f ?? 0 }) : undefined}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {p !== null ? (
                        <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: pColor(p) }}>
                            {p.toFixed(3)}{sigLabel(p)}
                          </span>
                          {rev && rev.p_value < 0.05 && (
                            <span className="t-micro" style={{ color: "var(--muted)", fontSize: "0.5rem" }} title="Reverse also significant (bidirectional)">
                              ↔
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="t-micro" style={{ color: "var(--line)" }}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--caution)",
            padding: "8px 12px",
            maxWidth: 320,
          }}
        >
          <div className="t-body" style={{ fontWeight: 700, fontSize: "0.75rem" }}>{tooltip.driver}</div>
          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
            Lag {tooltip.lag}d · F-stat {tooltip.f.toFixed(2)} · p={tooltip.p.toFixed(4)}
          </div>
          <div className="t-body" style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
            {tooltip.p < 0.05
              ? `This driver significantly precedes SET returns at a ${tooltip.lag}-day lag. Granger = predictive precedence — not proof of causation.`
              : `Not significant at 5% level. This driver does not reliably predict SET ${tooltip.lag} days ahead in this window.`}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { label: "p < 0.01 — strong signal", color: "var(--bull)" },
          { label: "p < 0.05 — significant", color: "var(--caution)" },
          { label: "p ≥ 0.05 — not significant", color: "var(--dim)" },
          { label: "↔ bidirectional", color: "var(--muted)" },
        ].map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, background: l.color }} />
            <span className="t-micro" style={{ color: "var(--muted)" }}>{l.label}</span>
          </span>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5, paddingTop: 4, borderTop: "1px solid var(--line)" }}>
        {data?.note}
      </div>
    </div>
  );
}
