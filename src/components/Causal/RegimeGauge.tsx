"use client";

/**
 * RegimeGauge — current market regime + 60-day history sparkline.
 *
 * Shows:
 *   • Today's regime (BULL / BEAR / RANGING) with probability bars
 *   • 60-day rolling regime history as a colour-coded bar chart
 *   • Regime counts for context
 */

import { useEffect, useState } from "react";
import type { RegimeSummary, RegimeDay } from "@/app/api/regime/route";

const REGIME_COLOR: Record<string, string> = {
  bull:    "var(--bull)",
  bear:    "var(--bear)",
  ranging: "var(--caution)",
};

const REGIME_LABEL: Record<string, string> = {
  bull:    "BULL MARKET",
  bear:    "BEAR MARKET",
  ranging: "RANGING / CONSOLIDATING",
};

const REGIME_DESC: Record<string, string> = {
  bull:    "Strong positive trend. Full position sizing. Technical breakouts have higher follow-through.",
  bear:    "Negative trend. Reduce size. Focus on capital preservation. Short opportunities for traders.",
  ranging: "No directional edge. Reduce position size. Mean-reversion setups preferred. Await a breakout.",
};

function ProbBar({ label, prob, color }: { label: string; prob: number; color: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 40px", gap: 8, alignItems: "center" }}>
      <span className="t-micro">{label}</span>
      <div style={{ position: "relative", height: 8, background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
        <div style={{ position: "absolute", inset: 0, width: `${prob * 100}%`, background: color }} />
      </div>
      <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color, textAlign: "right" }}>
        {(prob * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export function RegimeGauge() {
  const [data, setData] = useState<RegimeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/regime")
      .then(r => r.json())
      .then((d: RegimeSummary) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="shimmer" style={{ height: 160 }} />;
  }

  const today  = data?.today;
  const history = data?.history?.slice(-60) ?? [];
  const counts  = data?.regime_counts_60d ?? {};

  if (!today) {
    return <div className="t-micro" style={{ color: "var(--dim)" }}>No regime data</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Today's regime */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          padding: "12px 14px",
          background: "var(--bg-raised)",
          border: `1px solid ${REGIME_COLOR[today.regime] ?? "var(--line)"}`,
          borderLeft: `3px solid ${REGIME_COLOR[today.regime] ?? "var(--caution)"}`,
        }}
      >
        <div>
          <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700, color: REGIME_COLOR[today.regime] }}>
            {REGIME_LABEL[today.regime] ?? today.regime.toUpperCase()}
          </div>
          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>
            {REGIME_DESC[today.regime]}
          </div>
        </div>
        <div className="t-micro" style={{ color: "var(--muted)", textAlign: "right" }}>
          {today.date}
          {today.vix !== null && today.vix !== undefined && (
            <div className="t-mono" style={{ fontSize: "0.75rem", color: (today.vix ?? 0) > 25 ? "var(--bear)" : "var(--muted)", marginTop: 4 }}>
              VIX {today.vix?.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {/* Probability bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ProbBar label="BULL"    prob={today.bull_prob}    color="var(--bull)" />
        <ProbBar label="RANGING" prob={today.ranging_prob} color="var(--caution)" />
        <ProbBar label="BEAR"    prob={today.bear_prob}    color="var(--bear)" />
      </div>

      {/* 60-day history sparkline */}
      {history.length > 0 && (
        <div>
          <div className="t-micro" style={{ marginBottom: 6 }}>60-DAY REGIME HISTORY</div>
          <div style={{ display: "flex", gap: 1, height: 20, alignItems: "stretch" }}>
            {history.map((d: RegimeDay, i: number) => (
              <div
                key={i}
                title={`${d.date}: ${d.regime}`}
                style={{
                  flex: 1,
                  background: REGIME_COLOR[d.regime] ?? "var(--dim)",
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>{history[0]?.date}</span>
            <span className="t-micro" style={{ color: "var(--dim)" }}>{history[history.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* 60-day counts */}
      {Object.keys(counts).length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {(["bull", "ranging", "bear"] as const).map(r => (
            <span key={r} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, background: REGIME_COLOR[r] }} />
              <span className="t-mono" style={{ fontSize: "0.6875rem", color: REGIME_COLOR[r] }}>
                {counts[r] ?? 0}d
              </span>
              <span className="t-micro" style={{ color: "var(--muted)" }}>{r}</span>
            </span>
          ))}
          <span className="t-micro" style={{ color: "var(--dim)" }}>last 60 sessions</span>
        </div>
      )}

      {data?.note && (
        <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5, paddingTop: 4, borderTop: "1px solid var(--line)" }}>
          {data.note}
        </div>
      )}
    </div>
  );
}
