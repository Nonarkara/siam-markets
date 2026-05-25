"use client";

interface Props {
  topic: string;
  narrativeTone: number;
  narrativeVolume: number;
  measuredValue: string;
  measuredContext: string;
  verdict: "CONFIRMED" | "UNDERSTATED" | "OVERSTATED" | "CALM";
  verdictColor: string;
}

const verdictLabels: Record<string, { label: string; desc: string }> = {
  CONFIRMED: { label: "CONFIRMED", desc: "Narrative matches measured reality" },
  UNDERSTATED: { label: "UNDERSTATED", desc: "Problem exists but public hasn't noticed" },
  OVERSTATED: { label: "OVERSTATED", desc: "Panic without basis in data" },
  CALM: { label: "CALM", desc: "Quiet on both fronts" },
};

export function NarrativeReality({
  topic,
  narrativeTone,
  narrativeVolume,
  measuredValue,
  measuredContext,
  verdict,
  verdictColor,
}: Props) {
  const vd = verdictLabels[verdict] ?? verdictLabels.CALM;

  // Tone bar: -10 to +10 mapped to 0-100%
  const tonePct = ((narrativeTone + 10) / 20) * 100;

  return (
    <div>
      <div className="t-micro" style={{ marginBottom: 10 }}>REALITY CHECK · {topic}</div>

      {/* Two-column comparison */}
      <div style={{ display: "flex", gap: 1, background: "var(--line)", marginBottom: 12 }}>
        <div style={{ flex: 1, background: "var(--bg-surface)", padding: 12 }}>
          <div className="t-micro" style={{ marginBottom: 6, color: "var(--tech)" }}>NARRATIVE</div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--muted)",
            marginBottom: 8,
          }}>
            {narrativeVolume} stories · tone {narrativeTone > 0 ? "+" : ""}{narrativeTone}
          </div>
          {/* Tone mini-bar */}
          <div style={{ height: 3, background: "var(--bg-hover)", position: "relative" }}>
            <div style={{
              position: "absolute",
              left: `${tonePct}%`,
              top: -2,
              width: 4,
              height: 7,
              background: narrativeTone < -2 ? "var(--bear)" : narrativeTone > 2 ? "var(--bull)" : "var(--caution)",
              transform: "translateX(-50%)",
            }} />
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.5rem",
            color: "var(--dim)",
            marginTop: 4,
            fontFamily: "var(--font-mono)",
          }}>
            <span>NEG</span>
            <span>NEU</span>
            <span>POS</span>
          </div>
        </div>

        <div style={{ flex: 1, background: "var(--bg-surface)", padding: 12 }}>
          <div className="t-micro" style={{ marginBottom: 6, color: "var(--bull)" }}>MEASURED</div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: 4,
          }}>
            {measuredValue}
          </div>
          <div style={{
            fontSize: "0.6875rem",
            color: "var(--muted)",
            lineHeight: 1.4,
          }}>
            {measuredContext}
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        border: `1px solid ${verdictColor}30`,
        background: `${verdictColor}08`,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.875rem",
          fontWeight: 700,
          color: verdictColor,
          letterSpacing: "0.08em",
        }}>
          {vd.label}
        </span>
        <span style={{
          fontSize: "0.75rem",
          color: "var(--muted)",
          lineHeight: 1.4,
        }}>
          {vd.desc}
        </span>
      </div>
    </div>
  );
}
