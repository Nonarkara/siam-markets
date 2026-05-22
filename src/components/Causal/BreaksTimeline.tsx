"use client";

/**
 * BreaksTimeline — the causation visualization.
 *
 * Shows SET structural breaks (regime change dates from ruptures)
 * annotated with GDELT events that preceded each break by 1–7 days.
 *
 * Each card:
 *   DATE  |  BEFORE → AFTER (regime labels)
 *          |  annualised return change + vol change
 *          |  GDELT events (tone-sorted, 1–7 days prior)
 *
 * Colour coding:
 *   bear → volatile   = danger (red accent)
 *   bull → ranging    = caution
 *   ranging/bull → bull = positive (green)
 */

import { useEffect, useState } from "react";
import type { BreaksSummary, StructuralBreak } from "@/app/api/breaks/route";

const REGIME_COLOR: Record<string, string> = {
  bull:     "var(--bull)",
  bear:     "var(--bear)",
  ranging:  "var(--caution)",
  volatile: "var(--bear)",
  unknown:  "var(--dim)",
};

const REGIME_EMOJI: Record<string, string> = {
  bull: "↑", bear: "↓", ranging: "↔", volatile: "⚡", unknown: "?",
};

function breakAccent(before: string, after: string): string {
  if (after === "bear" || after === "volatile") return "var(--bear)";
  if (before === "bear" && after === "bull")     return "var(--bull)";
  return "var(--caution)";
}

function pctFmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
}

export function BreaksTimeline() {
  const [data, setData] = useState<BreaksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/breaks")
      .then(r => r.json())
      .then((d: BreaksSummary) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: string) =>
    setExpanded(e => ({ ...e, [id]: !e[id] }));

  if (loading) {
    return <div>{[0, 1, 2].map(i => <div key={i} className="shimmer" style={{ height: 80, marginBottom: 8 }} />)}</div>;
  }

  const breaks: StructuralBreak[] = data?.breaks ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div>
        <div className="t-body" style={{ fontWeight: 700, fontSize: "0.875rem" }}>
          SET Structural Breaks
        </div>
        <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
          Regime change dates (ruptures) · GDELT events 1–7 days prior ·{" "}
          {data?.count ?? 0} breaks detected
        </div>
      </div>

      {breaks.length === 0 && (
        <div className="t-micro" style={{ color: "var(--dim)", padding: "16px 0" }}>
          No breaks yet — run: python3 ingestion/breaks.py
        </div>
      )}

      {breaks.map((brk, i) => {
        const key = `${brk.break_date}-${brk.break_series}`;
        const isOpen = expanded[key];
        const accent = breakAccent(brk.regime_before, brk.regime_after);
        const returnImproved = (brk.mean_after ?? 0) > (brk.mean_before ?? 0);
        const volIncreased   = (brk.std_after  ?? 0) > (brk.std_before  ?? 0);

        return (
          <div
            key={key}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--line)",
              borderLeft: `3px solid ${accent}`,
            }}
          >
            {/* Card header */}
            <button
              onClick={() => toggle(key)}
              style={{
                all: "unset", cursor: "pointer", display: "grid",
                gridTemplateColumns: "90px 1fr auto",
                gap: 12,
                padding: "10px 12px",
                width: "100%",
                alignItems: "center",
              }}
            >
              {/* Date + series */}
              <div>
                <div className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                  {brk.break_date}
                </div>
                <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
                  {brk.break_series}
                </div>
              </div>

              {/* Regime transition */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="t-body" style={{ fontSize: "0.8125rem", color: REGIME_COLOR[brk.regime_before] }}>
                  {REGIME_EMOJI[brk.regime_before]} {brk.regime_before}
                </span>
                <span style={{ color: accent, fontSize: "0.875rem" }}>→</span>
                <span className="t-body" style={{ fontSize: "0.8125rem", fontWeight: 700, color: REGIME_COLOR[brk.regime_after] }}>
                  {REGIME_EMOJI[brk.regime_after]} {brk.regime_after}
                </span>

                {/* Return / vol change */}
                <span className="t-mono" style={{ fontSize: "0.6875rem", color: returnImproved ? "var(--bull)" : "var(--bear)" }}>
                  ann. return {pctFmt(brk.mean_before)} → {pctFmt(brk.mean_after)}
                </span>
                {brk.std_before !== null && (
                  <span className="t-mono" style={{ fontSize: "0.6875rem", color: volIncreased ? "var(--bear)" : "var(--bull)" }}>
                    vol {pctFmt(brk.std_before)} → {pctFmt(brk.std_after)}
                  </span>
                )}
              </div>

              {/* Events count + expand */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {brk.preceding_events.length > 0 && (
                  <span
                    className="t-mono"
                    style={{
                      fontSize: "0.5rem",
                      color: "var(--caution)",
                      border: "1px solid var(--caution)",
                      padding: "1px 5px",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {brk.preceding_events.length} EVENTS
                  </span>
                )}
                <span className="t-mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>
            </button>

            {/* Expanded: GDELT events */}
            {isOpen && (
              <div
                style={{
                  borderTop: "1px solid var(--line)",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div className="t-micro" style={{ color: "var(--caution)", letterSpacing: "0.14em" }}>
                  GDELT EVENTS · 1–7 DAYS BEFORE THIS BREAK
                </div>
                {brk.preceding_events.length === 0 && (
                  <div className="t-micro" style={{ color: "var(--dim)" }}>
                    No GDELT events returned for this window.
                  </div>
                )}
                {brk.preceding_events.map((ev, j) => (
                  <div
                    key={j}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 60px",
                      gap: 10,
                      padding: "7px 10px",
                      background: "var(--bg-raised)",
                      border: "1px solid var(--line)",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div className="t-mono" style={{ fontSize: "0.625rem", color: "var(--muted)" }}>{ev.date}</div>
                      <div className="t-micro" style={{ color: "var(--dim)", marginTop: 2 }}>{ev.source}</div>
                    </div>
                    <div className="t-body" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                      {ev.url && ev.url !== "#" ? (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer"
                           style={{ color: "var(--ink)", textDecoration: "none" }}
                           onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = "var(--tech)"; }}
                           onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = "var(--ink)"; }}>
                          {ev.title}
                        </a>
                      ) : ev.title}
                    </div>
                    <div
                      className="t-mono"
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textAlign: "right",
                        color: ev.tone > 0 ? "var(--bull)" : ev.tone < 0 ? "var(--bear)" : "var(--muted)",
                      }}
                    >
                      {ev.tone > 0 ? "+" : ""}{ev.tone.toFixed(1)}
                    </div>
                  </div>
                ))}
                <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5, paddingTop: 4 }}>
                  Tone scores from GDELT (negative = more alarming language). These events
                  <em> correlate</em> with the break in timing — they do not prove causation.
                </div>
              </div>
            )}
          </div>
        );
      })}

      {data?.note && (
        <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5, paddingTop: 4, borderTop: "1px solid var(--line)" }}>
          {data.note}
        </div>
      )}
    </div>
  );
}
