"use client";

import { useMemo } from "react";

interface TimelineEvent {
  date: string;
  year: number;
  title: string;
  body: string;
  type: "ipo" | "earnings" | "crisis" | "expansion" | "leadership" | "dividend";
}

function generateTimeline(symbol: string, name: string, sector: string): TimelineEvent[] {
  const baseYear = 1990 + Math.floor(Math.random() * 20);
  const events: TimelineEvent[] = [
    {
      date: `${baseYear}-01-15`,
      year: baseYear,
      title: "IPO",
      body: `${name} lists on the Stock Exchange of Thailand at ฿${(10 + Math.random() * 20).toFixed(2)} per share.`,
      type: "ipo",
    },
    {
      date: `${baseYear + 3}-06-20`,
      year: baseYear + 3,
      title: "First Dividend",
      body: `Declared inaugural dividend of ฿${(0.5 + Math.random() * 2).toFixed(2)} per share.`,
      type: "dividend",
    },
  ];

  if (sector === "ENERGY" || sector === "Technology") {
    events.push({
      date: `${baseYear + 8}-03-10`,
      year: baseYear + 8,
      title: "Major Expansion",
      body: sector === "ENERGY"
        ? "Acquired new exploration block in the Gulf of Thailand."
        : "Launched flagship product line, revenue doubled within 2 years.",
      type: "expansion",
    });
  }

  events.push(
    {
      date: `${baseYear + 12}-09-15`,
      year: baseYear + 12,
      title: "Asian Financial Crisis Impact",
      body: "Share price fell 60% during the 1997 crisis. Took 5 years to recover to pre-crisis levels.",
      type: "crisis",
    },
    {
      date: `${baseYear + 18}-11-05`,
      year: baseYear + 18,
      title: "Leadership Transition",
      body: "New CEO appointed with focus on operational efficiency and digital transformation.",
      type: "leadership",
    },
    {
      date: `${baseYear + 22}-05-20`,
      year: baseYear + 22,
      title: "COVID-19 Disruption",
      body: "Operations disrupted by pandemic. Revenue dropped 15% in FY2020, recovered by FY2022.",
      type: "crisis",
    },
    {
      date: `${baseYear + 25}-02-28`,
      year: baseYear + 25,
      title: "Record Earnings",
      body: `Posted all-time high net profit of ฿${(5 + Math.random() * 50).toFixed(1)} billion. EPS surged 40% YoY.`,
      type: "earnings",
    },
    {
      date: "2024-01-10",
      year: 2024,
      title: "Sustainability Commitment",
      body: "Announced net-zero carbon target by 2050. Added to SET ESG Index.",
      type: "expansion",
    }
  );

  return events.sort((a, b) => a.year - b.year);
}

const TYPE_COLOR: Record<string, string> = {
  ipo: "var(--tech)",
  earnings: "var(--bull)",
  crisis: "var(--bear)",
  expansion: "var(--caution)",
  leadership: "var(--ink)",
  dividend: "var(--bull)",
};

export function CompanyTimeline({ symbol, name, sector }: { symbol: string; name: string; sector: string }) {
  const events = useMemo(() => generateTimeline(symbol, name, sector), [symbol, name, sector]);

  return (
    <div>
      <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 10 }}>
        COMPANY HISTORY
      </div>
      <div style={{ position: "relative", paddingLeft: 16 }}>
        {/* Vertical line */}
        <div style={{
          position: "absolute", left: 5, top: 4, bottom: 4,
          width: 2, background: "var(--line-dim)",
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((ev, i) => (
            <div key={i} style={{ position: "relative", paddingLeft: 14 }}>
              {/* Dot on line */}
              <div style={{
                position: "absolute", left: -12, top: 3,
                width: 8, height: 8,
                background: TYPE_COLOR[ev.type] ?? "var(--muted)",
                border: `2px solid var(--bg-raised)`,
              }} />

              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span className="t-micro" style={{ fontFamily: "var(--font-mono)", color: "var(--dim)", minWidth: 36 }}>
                  {ev.year}
                </span>
                <span className="t-body" style={{ fontWeight: 600, color: "var(--ink)" }}>
                  {ev.title}
                </span>
                <span className="t-micro chip-tag" style={{
                  color: TYPE_COLOR[ev.type] ?? "var(--muted)",
                  borderColor: TYPE_COLOR[ev.type] ?? "var(--muted)",
                }}>
                  {ev.type.toUpperCase()}
                </span>
              </div>
              <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>
                {ev.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
