"use client";

/**
 * CycleIntelligencePanel
 *
 * Field note. Pattern match against Dalio Big Debt Cycles + Wyckoff VSA.
 * Source: RESEARCH_DEEP_MARKET_CYCLES.md, Kimi brief compiled 2026-05-26.
 *
 * Not a forecast. A structure recognition. The cycle has no fixed duration.
 * Historical dataset: Dutch Empire 1620s → present, ~16 major cycles.
 */

const STAGES = [
  { n: 1, l: "RISE"   },
  { n: 2, l: "BUBBLE" },
  { n: 3, l: "PEAK"   },
  { n: 4, l: "UNWIND" },
  { n: 5, l: "FRAG"   },
  { n: 6, l: "RESET"  },
] as const;

const NOW = 5;

const SIGNALS = [
  {
    label:     "WYCKOFF",
    value:     "DISTRIBUTION",
    qualifier: "large operators exiting · small money accumulating · confirmed by volume divergence",
    col:       "var(--bear)",
  },
  {
    label:     "RECESSION",
    value:     "35–45%",
    qualifier: "model consensus · 12–18 mo horizon · this is a probability, not a call",
    col:       "var(--caution)",
  },
  {
    label:     "SOLAR",
    value:     "SOLAR MAX",
    qualifier: "2025–26 · corr. with asset bubbles r≈0.6 · not causal · observed · noted",
    col:       "var(--caution)",
  },
  {
    label:     "DEPLOY",
    value:     "2028–2029",
    qualifier: "\"buy when there is blood in the streets\" — Dalio's words, not a guarantee",
    col:       "var(--bull)",
  },
] as const;

export function CycleIntelligencePanel() {
  return (
    <div style={{ fontFamily: "var(--font-mono)" }}>

      {/* Header row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 7,
      }}>
        <span style={{ fontSize: "0.4375rem", color: "var(--dim)", letterSpacing: "0.14em" }}>
          DALIO BIG DEBT CYCLE · WYCKOFF VSA
        </span>
        <span style={{ fontSize: "0.4375rem", color: "var(--bear)", letterSpacing: "0.1em" }}>
          ■ {NOW}/6
        </span>
      </div>

      {/* Stage map — inline text tokens, not a progress widget */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 3px", marginBottom: 8 }}>
        {STAGES.map(s => {
          const isCurrent = s.n === NOW;
          const isPast    = s.n < NOW;
          return (
            <span
              key={s.n}
              style={{
                fontSize:   "0.4375rem",
                padding:    "1px 5px",
                letterSpacing: "0.04em",
                color:      isCurrent ? "var(--bg)"  : isPast ? "var(--dim)" : "var(--line)",
                background: isCurrent ? "var(--bear)" : "transparent",
                border:     isCurrent ? "none" : "1px solid transparent",
              }}
            >
              {s.n}·{s.l}
            </span>
          );
        })}
      </div>

      {/* Field note — honest about what this is and isn't */}
      <div style={{
        borderLeft: "1px solid var(--bear)",
        paddingLeft: 7,
        marginBottom: 7,
      }}>
        <div style={{ fontSize: "0.5rem", color: "var(--muted)", lineHeight: 1.65, marginBottom: 3 }}>
          Debt/equity at historical maxima in the dominant powers.
          Internal political disorder rising. Stage 5 has no fixed duration —
          it lasted ~5 years before the Weimar collapse, ~12 before the 1930s reset.
        </div>
        <div style={{ fontSize: "0.4375rem", color: "var(--dim)", lineHeight: 1.5 }}>
          Pattern match only. ~16 historical cycles in dataset.
          This structure has not always ended in Stage 6.
          Ref: Dalio, <em>Big Debt Crises</em> (2018).
        </div>
      </div>

      {/* Signal rows — value + honest qualifier on second line */}
      {SIGNALS.map(row => (
        <div
          key={row.label}
          style={{
            borderTop: "1px solid var(--line-dim)",
            padding:   "4px 0",
            display:   "grid",
            gridTemplateColumns: "48px 1fr",
            gap:       "0 8px",
          }}
        >
          <span style={{ fontSize: "0.4375rem", color: "var(--dim)", paddingTop: 2, lineHeight: 1 }}>
            {row.label}
          </span>
          <div>
            <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: row.col, display: "block", lineHeight: 1.2 }}>
              {row.value}
            </span>
            <span style={{ fontSize: "0.375rem", color: "var(--dim)", lineHeight: 1.5, display: "block", marginTop: 1 }}>
              {row.qualifier}
            </span>
          </div>
        </div>
      ))}

    </div>
  );
}
