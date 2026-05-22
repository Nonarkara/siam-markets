"use client";

/**
 * EconCalendar — live macro event calendar.
 *
 * Shows the next 14 days of high/medium impact events
 * (ForexFactory via JBlanked + Thai BOT + NESDC static events).
 *
 * Each event shows: date, time, country flag, impact badge,
 * forecast vs previous, and which SET sectors to watch.
 * TODAY events highlighted. SET-moving events get a ★ marker.
 */

import { useEffect, useState } from "react";

interface CalendarEvent {
  id:         string;
  date:       string;
  time:       string;
  country:    string;
  flag:       string;
  event:      string;
  impact:     "high" | "medium" | "low";
  actual?:    string;
  forecast?:  string;
  previous?:  string;
  daysUntil:  number;
  isToday:    boolean;
  setPacted:  boolean;
  sectorTips: string[];
}

interface CalendarResponse {
  events: CalendarEvent[];
  source: string;
  as_of:  string;
}

const IMPACT_COLOR: Record<string, string> = {
  high:   "var(--bear)",
  medium: "var(--caution)",
  low:    "var(--dim)",
};

function daysLabel(d: number): string {
  if (d === 0) return "TODAY";
  if (d === 1) return "TOMORROW";
  if (d < 0)  return `${Math.abs(d)}d AGO`;
  return `in ${d}d`;
}

export function EconCalendar({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/api/econ-calendar")
      .then(r => r.json())
      .then((d: CalendarResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const events = data?.events ?? [];
  const toShow = showAll ? events : events.slice(0, compact ? 5 : 10);
  const todayCount = events.filter(e => e.isToday).length;

  if (loading) return <div className="shimmer" style={{ height: 160 }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="t-body" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            Economic Calendar
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
            {events.length} events · {todayCount} today · {data?.source === "live" ? "ForexFactory live" : "Thai static"} data
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="t-micro" style={{ color: "var(--dim)" }}>
          No events — add JBLANKED_API_KEY to unlock live ForexFactory data
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {toShow.map(ev => (
              <div
                key={ev.id}
                style={{
                  display:     "grid",
                  gridTemplateColumns: "80px 32px 1fr auto",
                  gap:         10,
                  padding:     "8px 12px",
                  background:  ev.isToday ? "var(--caution-10)" : "var(--bg-surface)",
                  border:      `1px solid ${ev.isToday ? "var(--caution)" : "var(--line)"}`,
                  borderLeft:  `3px solid ${IMPACT_COLOR[ev.impact]}`,
                  alignItems:  "center",
                }}
              >
                {/* Date / time */}
                <div>
                  <div className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: ev.isToday ? "var(--caution)" : "var(--muted)", letterSpacing: "0.1em" }}>
                    {daysLabel(ev.daysUntil)}
                  </div>
                  <div className="t-mono" style={{ fontSize: "0.5625rem", color: "var(--dim)", marginTop: 2 }}>
                    {ev.time}
                  </div>
                </div>

                {/* Flag */}
                <span style={{ fontSize: "1.1rem" }}>{ev.flag}</span>

                {/* Event + sectors */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span className="t-body" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{ev.event}</span>
                    {ev.setPacted && <span style={{ fontSize: "0.75rem" }} title="This event typically moves the SET index">★</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                    {ev.sectorTips.slice(0, 3).map(s => (
                      <span key={s} className="t-mono" style={{ fontSize: "0.5rem", color: "var(--muted)", border: "1px solid var(--line)", padding: "0 4px" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Forecast vs prev */}
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  {ev.actual ? (
                    <div className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--bull)" }}>
                      A: {ev.actual}
                    </div>
                  ) : ev.forecast ? (
                    <div className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
                      F: {ev.forecast}
                    </div>
                  ) : null}
                  {ev.previous && (
                    <div className="t-micro" style={{ color: "var(--dim)" }}>Prev: {ev.previous}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {events.length > toShow.length && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                background: "transparent",
                border: "1px solid var(--line)",
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                letterSpacing: "0.14em",
                padding: "6px 0",
                cursor: "pointer",
                minHeight: 32,
              }}
            >
              SHOW ALL {events.length} EVENTS ↓
            </button>
          )}
        </>
      )}

      <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5 }}>
        ★ = typically moves SET within 30 min · High impact USD events travel to SET via risk-off / foreign fund flows
      </div>
    </div>
  );
}
