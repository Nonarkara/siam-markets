"use client";

import { useState } from "react";
import { CURRICULUM, type Station, type TransitLine } from "@/lib/curriculum";

export default function SchoolClient({ todaySignal, todayContext }: { todaySignal: string, todayContext: string }) {
  const [activeStation, setActiveStation] = useState<Station>(CURRICULUM[0].stations[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)", minHeight: "80vh" }}>
      <div style={{ marginBottom: 10 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Trading School</h1>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          From value investing foundations to professional day trading techniques.
        </p>
      </div>

      {/* Today's signal */}
      <div
        className="card"
        style={{ background: "var(--bg-surface)", borderColor: "var(--caution)" }}
      >
        <div className="t-micro" style={{ color: "var(--caution)", marginBottom: 6 }}>TODAY&apos;S SIGNAL</div>
        <div className="t-body">{todayContext}</div>
        <div className="divider" style={{ margin: "10px 0" }} />
        <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{todaySignal}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--gap)", flexGrow: 1, marginTop: 20 }}>
        
        {/* Left Pane: Transit Map */}
        <div className="card" style={{ padding: "24px 16px", background: "var(--bg-surface)", borderRight: "1px solid var(--line)" }}>
          <div className="t-micro" style={{ marginBottom: 24, color: "var(--muted)" }}>CURRICULUM MAP</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {CURRICULUM.map(line => (
              <div key={line.id}>
                <div className="t-mono" style={{ fontSize: "0.75rem", color: line.color, marginBottom: 12, fontWeight: 700 }}>
                  ━━ {line.name.toUpperCase()}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
                  {/* The Subway Line Track */}
                  <div style={{
                    position: "absolute",
                    left: 7,
                    top: 10,
                    bottom: 10,
                    width: 2,
                    background: line.color,
                    opacity: 0.5
                  }} />

                  {line.stations.map((station, idx) => {
                    const isActive = activeStation.id === station.id;
                    return (
                      <div 
                        key={station.id}
                        onClick={() => setActiveStation(station)}
                        style={{
                          display: "flex", 
                          alignItems: "flex-start", 
                          gap: 12, 
                          padding: "8px 0",
                          cursor: "pointer",
                          position: "relative",
                          zIndex: 2,
                          opacity: isActive ? 1 : 0.6,
                          transition: "opacity 0.2s ease"
                        }}
                      >
                        {/* Station Node */}
                        <div style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: isActive ? "var(--bg)" : line.color,
                          border: `4px solid ${line.color}`,
                          marginTop: 2,
                          flexShrink: 0
                        }} />
                        
                        <div>
                          <div className="t-body" style={{ fontWeight: isActive ? 700 : 400, color: isActive ? "var(--ink)" : "var(--muted)" }}>
                            {station.title}
                          </div>
                          {isActive && (
                            <div className="t-micro" style={{ color: line.color, marginTop: 4 }}>
                              {station.kanji} · {station.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Reading Pane */}
        <div className="card" style={{ padding: "40px", background: "var(--bg-surface)", position: "relative" }}>
          <div style={{ position: "absolute", top: 20, right: 30, opacity: 0.05, fontSize: "8rem", fontWeight: 700, pointerEvents: "none" }}>
            {activeStation.kanji}
          </div>
          
          <div className="t-micro" style={{ color: "var(--muted)", marginBottom: 16 }}>
            CONCEPT // {activeStation.id.toUpperCase().replace(/-/g, " ")}
          </div>
          
          <h2 className="t-display" style={{ fontSize: "2.5rem", marginBottom: 8, lineHeight: 1.1 }}>
            {activeStation.title}
          </h2>
          
          <div className="t-serif" style={{ fontSize: "1.25rem", color: "var(--muted)", marginBottom: 32 }}>
            {activeStation.subtitle}
          </div>

          <div className="divider" style={{ margin: "24px 0" }} />

          <div className="t-serif" style={{ fontSize: "1.125rem", lineHeight: 1.8, marginBottom: 32 }}>
            {activeStation.definition}
          </div>

          {/* Signal Box - Braun Style */}
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--line)",
            padding: "20px",
            marginBottom: 32,
            position: "relative"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--caution)" }} />
            <div className="t-mono" style={{ fontSize: "0.75rem", color: "var(--caution)", marginBottom: 8, fontWeight: 700 }}>
              PRACTICAL APPLICATION
            </div>
            <div className="t-mono" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
              {activeStation.signal}
            </div>
          </div>

          <div className="t-serif" style={{ fontSize: "1.125rem", lineHeight: 1.8, marginBottom: 40, color: "var(--muted)" }}>
            {activeStation.learnMore}
          </div>

          {/* Quote Block */}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 24 }}>
            <blockquote className="t-serif" style={{ fontSize: "1.25rem", fontStyle: "italic", marginBottom: 12, borderLeft: "2px solid var(--dim)", paddingLeft: 16 }}>
              "{activeStation.quote}"
            </blockquote>
            <div className="t-micro" style={{ paddingLeft: 16 }}>
              — {activeStation.quoteAuthor}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
