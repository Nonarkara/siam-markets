"use client";

import { useState, useEffect } from "react";
import { EventTimeline } from "@/components/Events/EventTimeline";
import type { WorldEvent } from "@/lib/types";
import { MOCK_EVENTS } from "@/lib/api/mock";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "TH",  label: "🇹🇭 Thailand" },
  { key: "US",  label: "🇺🇸 US" },
  { key: "CN",  label: "🇨🇳 China" },
  { key: "JP",  label: "🇯🇵 Japan" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

export default function EventsPage() {
  const [filter, setFilter]   = useState<FilterKey>("all");
  const [events, setEvents]   = useState<WorldEvent[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = filter === "all" ? "/api/events" : `/api/events?country=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.length > 0) setEvents(json.data);
      })
      .catch(() => {/* keep mock data */})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>World × Markets</h1>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          What happened in the world — and what markets did next.
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className="card"
        style={{
          background: "var(--caution-10)",
          borderColor: "var(--caution)",
          marginBottom: "var(--gap)",
          padding: "12px 16px",
        }}
      >
        <div className="t-body" style={{ color: "var(--caution)", fontSize: "0.8rem" }}>
          Correlation, not causation. Events and market moves are shown together — but events do not directly cause price changes. Use this for pattern recognition, not prediction.
        </div>
      </div>

      {/* Filter chips */}
      <div className="scroll-row" style={{ marginBottom: "var(--gap)" }}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`chip ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card shimmer" style={{ height: 120 }} />
          ))}
        </div>
      ) : (
        <EventTimeline events={events} />
      )}
    </div>
  );
}
