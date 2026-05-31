"use client";

import { useMemo } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   Mr. Market Mood — a composite market-weather gauge.

   Based on Graham's parable: Mr. Market shows up every day offering to buy
   or sell. Sometimes he's euphoric (greedy), sometimes despondent (fearful).
   Your job is not to predict his mood, but to recognize it — and trade only
   when it favors you.

   Composite score from:
   • VIX (volatility / fear)
   • Fear & Greed Index
   • Buffett Indicator (market cap / GDP)
   • S&P 500 Forward P/E
   • Yield Curve spread
   • Credit spreads (HY - Treasury)

   Each signal is scored -2 (greedy/overvalued) to +2 (fearful/undervalued).
   Sum → mood: MANIC (+4 to +8), OKAY (-3 to +3), DEPRESSED (-8 to -4).
   ══════════════════════════════════════════════════════════════════════════════ */

interface MarketSignal {
  label: string;
  value: string;
  raw: number;      // -2 to +2, negative = greedy/overvalued, positive = fearful/undervalued
  note: string;
}

const SIGNALS: MarketSignal[] = [
  {
    label: "VIX",
    value: "14.2",
    raw: -1.5,       // low VIX = complacency = greedy
    note: "Complacency zone. Fear is dormant.",
  },
  {
    label: "Fear & Greed",
    value: "72",
    raw: -1.5,       // high score = greed
    note: "Greed territory. Retail is piling in.",
  },
  {
    label: "Buffett Indicator",
    value: "227%",
    raw: -2.0,       // extreme overvaluation
    note: "Danger zone. Stocks vs GDP at dot-com extremes.",
  },
  {
    label: "S&P Forward P/E",
    value: "28x",
    raw: -1.5,       // well above historical 17x
    note: "Premium to 100-year average of 17x.",
  },
  {
    label: "Yield Curve",
    value: "Inverted",
    raw: +1.0,       // inverted = recession fear = some fear exists
    note: "16 months inverted. Bond market is worried.",
  },
  {
    label: "Credit Spreads",
    value: "3.2%",
    raw: -1.0,       // tight spreads = complacency
    note: "Near 27-year lows. Investors underpricing risk.",
  },
];

type Mood = "manic" | "okay" | "depressed";

const MOOD_META: Record<
  Mood,
  { label: string; color: string; bg: string; advice: string; grahamQuote: string }
> = {
  manic: {
    label: "MANIC — MR. MARKET IS EUPHORIC",
    color: "var(--bear)",
    bg: "rgba(255,59,48,0.08)",
    advice: "He's offering crazy prices. Sell to him, or wait. Don't buy.",
    grahamQuote: "The investor's chief problem — and even his worst enemy — is likely to be himself.",
  },
  okay: {
    label: "OKAY — MR. MARKET IS REASONABLE",
    color: "var(--caution)",
    bg: "rgba(255,149,0,0.06)",
    advice: "Prices are fair. Hold what you have. Wait for extremes.",
    grahamQuote: "In the short run, the market is a voting machine. In the long run, a weighing machine.",
  },
  depressed: {
    label: "DEPRESSED — MR. MARKET IS DESPONDENT",
    color: "var(--bull)",
    bg: "rgba(0,200,150,0.08)",
    advice: "He's selling bargains. Buy from him. Be greedy when others are fearful.",
    grahamQuote: "Buy not on optimism, but on arithmetic.",
  },
};

export function MrMarketMood({ compact = false }: { compact?: boolean }) {
  const { score, mood, signals } = useMemo(() => {
    const s = SIGNALS.reduce((sum, sig) => sum + sig.raw, 0);
    const m: Mood = s >= 4 ? "depressed" : s <= -4 ? "manic" : "okay";
    return { score: s, mood: m, signals: SIGNALS };
  }, []);

  const meta = MOOD_META[mood];

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          background: meta.bg,
          border: `1px solid ${meta.color}`,
          borderLeft: `3px solid ${meta.color}`,
        }}
      >
        <div style={{ width: 8, height: 8, background: meta.color, flexShrink: 0 }} />
        <span className="t-micro" style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
        <span className="t-micro" style={{ color: "var(--muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {meta.advice}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 16,
        background: "var(--bg-raised)",
        border: "1px solid var(--line)",
        borderLeft: `3px solid ${meta.color}`,
      }}
    >
      {/* Mood header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div className="t-micro" style={{ color: meta.color, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>
            {meta.label}
          </div>
          <div className="t-body" style={{ color: "var(--ink)", lineHeight: 1.5, maxWidth: "50ch" }}>
            {meta.advice}
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-display)",
            fontWeight: 700,
            color: meta.color,
            lineHeight: 1,
            textAlign: "right",
          }}
        >
          {score > 0 ? "+" : ""}{score}
        </div>
      </div>

      {/* Signal grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {signals.map((s) => (
          <div
            key={s.label}
            style={{
              padding: "8px 10px",
              background: "var(--bg)",
              border: "1px solid var(--line)",
            }}
          >
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>{s.label}</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-body)",
                fontWeight: 700,
                color: s.raw < 0 ? "var(--bear)" : s.raw > 0 ? "var(--bull)" : "var(--caution)",
                marginBottom: 3,
              }}
            >
              {s.value}
            </div>
            <div className="t-micro" style={{ color: "var(--muted)", lineHeight: 1.4 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Graham quote */}
      <div
        style={{
          padding: 10,
          background: meta.bg,
          border: `1px solid ${meta.color}`,
        }}
      >
        <div className="t-serif" style={{ color: "var(--muted)", fontStyle: "italic", lineHeight: 1.55 }}>
          "{meta.grahamQuote}"
        </div>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 4 }}>— Benjamin Graham</div>
      </div>
    </div>
  );
}
