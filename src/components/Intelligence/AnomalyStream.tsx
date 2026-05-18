"use client";

import { useState } from "react";

interface Anomaly {
  id: string;
  severity: "critical" | "warning" | "notice";
  title: string;
  description: string;
  metric: string;
  expectation: string;
}

interface Props {
  anomalies: Anomaly[];
}

const severityConfig = {
  critical: { color: "#ff3b6f", bg: "rgba(255,59,111,0.08)", label: "CRITICAL" },
  warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "WARNING" },
  notice: { color: "#00f0ff", bg: "rgba(0,240,255,0.06)", label: "NOTICE" },
};

export function AnomalyStream({ anomalies }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (anomalies.length === 0) {
    return (
      <div style={{
        padding: 24,
        textAlign: "center",
        color: "var(--dim)",
        fontSize: "0.8125rem",
        border: "1px dashed var(--line)",
      }}>
        No anomalies detected. All systems nominal.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {anomalies.map((a) => {
        const cfg = severityConfig[a.severity];
        const isOpen = expanded === a.id;

        return (
          <div
            key={a.id}
            onClick={() => setExpanded(isOpen ? null : a.id)}
            style={{
              background: isOpen ? cfg.bg : "var(--bg-raised)",
              borderLeft: `3px solid ${cfg.color}`,
              borderTop: "1px solid var(--line)",
              borderRight: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
              padding: "10px 12px",
              cursor: "pointer",
              transition: "background 200ms ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                fontWeight: 700,
                color: cfg.color,
                border: `1px solid ${cfg.color}60`,
                padding: "1px 5px",
                letterSpacing: "0.08em",
              }}>
                {cfg.label}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: cfg.color,
                opacity: 0.8,
              }}>
                {a.metric}
              </span>
            </div>

            <div style={{
              fontWeight: 600,
              fontSize: "0.8125rem",
              lineHeight: 1.3,
              marginBottom: isOpen ? 8 : 0,
            }}>
              {a.title}
            </div>

            {isOpen && (
              <div style={{ animation: "fadeIn 200ms ease" }}>
                <div style={{
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}>
                  {a.description}
                </div>
                <div style={{
                  fontSize: "0.6875rem",
                  color: "var(--dim)",
                  lineHeight: 1.4,
                  borderTop: "1px solid var(--line)",
                  paddingTop: 8,
                  fontFamily: "var(--font-body)",
                }}>
                  <span style={{ color: cfg.color, fontWeight: 600 }}>→ EXPECTATION: </span>
                  {a.expectation}
                </div>
              </div>
            )}

            {!isOpen && (
              <div style={{
                fontSize: "0.6rem",
                color: "var(--dim)",
                marginTop: 2,
                fontFamily: "var(--font-body)",
              }}>
                Tap to expand
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
