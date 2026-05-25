"use client";

interface Props {
  bestMatch: {
    id: string;
    name: string;
    date: string;
    description: string;
    whatHappenedNext: string;
  };
  similarity: number;
  allMatches: Array<{ regime: { name: string; date: string }; similarity: number }>;
}

export function PatternResonance({ bestMatch, similarity, allMatches }: Props) {
  const barColor = similarity > 70 ? "var(--tech)" : similarity > 45 ? "var(--caution)" : "var(--bear)";

  return (
    <div>
      {/* Similarity gauge */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}>
          <span className="t-micro">PATTERN RESONANCE</span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: barColor,
          }}>
            {similarity}%
          </span>
        </div>
        <div style={{
          height: 4,
          background: "var(--bg-hover)",
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            height: "100%",
            width: `${similarity}%`,
            background: barColor,
            transition: "width 1s cubic-bezier(0.23,1,0.32,1)",
          }} />
        </div>
      </div>

      {/* Best match card */}
      <div style={{
        border: `1px solid ${barColor}30`,
        background: `${barColor}06`,
        padding: 14,
        marginBottom: 14,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: barColor,
            letterSpacing: "0.06em",
          }}>
            {bestMatch.name.toUpperCase()}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            color: "var(--dim)",
          }}>
            {bestMatch.date}
          </span>
        </div>

        <div style={{
          fontSize: "0.8125rem",
          color: "var(--muted)",
          lineHeight: 1.5,
          marginBottom: 10,
        }}>
          {bestMatch.description}
        </div>

        <div style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 10,
        }}>
          <div className="t-micro" style={{ marginBottom: 4, color: barColor }}>WHAT HAPPENED NEXT</div>
          <div style={{
            fontSize: "0.75rem",
            color: "var(--ink)",
            lineHeight: 1.5,
            fontWeight: 500,
          }}>
            {bestMatch.whatHappenedNext}
          </div>
        </div>
      </div>

      {/* Runner-up matches */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="t-micro" style={{ marginBottom: 2 }}>OTHER RESONANCES</span>
        {allMatches.slice(1, 4).map((m) => (
          <div key={m.regime.name} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 10px",
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
          }}>
            <span style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-body)",
              color: "var(--muted)",
            }}>
              {m.regime.name} <span style={{ color: "var(--dim)", fontSize: "0.6rem" }}>({m.regime.date})</span>
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: m.similarity > 50 ? "var(--caution)" : "var(--dim)",
              fontWeight: 600,
            }}>
              {m.similarity}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
