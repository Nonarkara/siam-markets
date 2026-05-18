"use client";

interface Flow {
  from: string;
  to: string;
  strength: number;
  label: string;
}

interface Props {
  flows: Flow[];
}

const labelColors: Record<string, string> = {
  "INFLOW": "#00f0ff",
  "OUTFLOW": "#ff3b6f",
  "NEUTRAL": "var(--dim)",
  "ROTATION IN": "#00f0ff",
  "ROTATION OUT": "#ff3b6f",
  "STABLE": "var(--dim)",
  "RISK-ON": "#00f0ff",
  "RISK-OFF": "#f59e0b",
  "BALANCED": "var(--dim)",
  "LEADING UP": "#00f0ff",
  "LEADING DOWN": "#ff3b6f",
  "DECOUPLED": "var(--caution)",
};

export function FlowMatrix({ flows }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {flows.map((flow, i) => {
        const color = labelColors[flow.label] ?? "var(--muted)";
        const isPositive = flow.strength > 0;
        const barWidth = Math.abs(flow.strength) * 100;

        return (
          <div key={i} style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            padding: "10px 12px",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  fontWeight: 500,
                }}>{flow.from}</span>
                <span style={{
                  fontSize: "0.6rem",
                  color: "var(--dim)",
                }}>→</span>
                <span style={{
                  fontSize: "0.75rem",
                  color: "var(--ink)",
                  fontWeight: 600,
                }}>{flow.to}</span>
              </div>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                fontWeight: 700,
                color,
                border: `1px solid ${color}50`,
                padding: "1px 5px",
                letterSpacing: "0.06em",
              }}>
                {flow.label}
              </span>
            </div>

            {/* Strength bar */}
            <div style={{
              height: 3,
              background: "var(--bg-hover)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                left: isPositive ? "50%" : `${50 - barWidth / 2}%`,
                right: isPositive ? `${50 - barWidth / 2}%` : "50%",
                top: 0,
                bottom: 0,
                background: color,
                opacity: 0.7,
                boxShadow: `0 0 6px ${color}40`,
              }} />
              <div style={{
                position: "absolute",
                left: "50%",
                top: -1,
                width: 1,
                height: 5,
                background: "var(--dim)",
                transform: "translateX(-50%)",
              }} />
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.5rem",
              color: "var(--dim)",
              marginTop: 3,
              fontFamily: "var(--font-mono)",
            }}>
              <span>OUTFLOW</span>
              <span>NEUTRAL</span>
              <span>INFLOW</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
