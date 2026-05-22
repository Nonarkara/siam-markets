"use client";

import { useMemo } from "react";

interface SentimentPoint {
  date: string;
  newsSentiment: number;   // -1 to +1
  socialSentiment: number; // -1 to +1
  priceChange: number;     // %
  volumeRatio: number;     // vs 20-day avg
}

interface Props {
  data: SentimentPoint[];
  assetName?: string;
}

function detectDivergence(points: SentimentPoint[]): {
  divergence: "bullish" | "bearish" | "neutral";
  strength: number; // 0-100
  explanation: string;
} {
  if (points.length < 5) {
    return { divergence: "neutral", strength: 0, explanation: "Insufficient data for divergence analysis." };
  }

  const recent = points.slice(-5);
  const avgNews = recent.reduce((s, p) => s + p.newsSentiment, 0) / recent.length;
  const avgSocial = recent.reduce((s, p) => s + p.socialSentiment, 0) / recent.length;
  const avgPrice = recent.reduce((s, p) => s + p.priceChange, 0) / recent.length;
  const avgVolume = recent.reduce((s, p) => s + p.volumeRatio, 0) / recent.length;

  const sentimentScore = (avgNews + avgSocial) / 2; // -1 to +1
  const priceScore = Math.tanh(avgPrice * 2); // normalize to roughly -1 to +1

  const diff = sentimentScore - priceScore;

  // Bullish divergence: sentiment negative but price holding/stable or rising
  // Bearish divergence: sentiment positive but price falling
  let divergence: "bullish" | "bearish" | "neutral" = "neutral";
  let strength = 0;

  if (diff < -0.3 && avgPrice < 0) {
    divergence = "bullish";
    strength = Math.min(100, Math.round(Math.abs(diff) * 100));
  } else if (diff > 0.3 && avgPrice > 0) {
    divergence = "bearish";
    strength = Math.min(100, Math.round(Math.abs(diff) * 100));
  } else {
    strength = Math.min(100, Math.round(Math.abs(diff) * 50));
  }

  let explanation = "";
  if (divergence === "bullish") {
    explanation = `News is ${avgNews < 0 ? "negative" : "mixed"} and social mood is down, yet price is holding. This often marks capitulation — when weak hands sell to strong hands.`;
  } else if (divergence === "bearish") {
    explanation = `Media is ${avgNews > 0 ? "optimistic" : "mixed"} and social sentiment is up, but price is not following. Classic setup for a reality check.`;
  } else {
    explanation = `Sentiment and price are roughly aligned. No strong divergence signal right now.`;
  }

  if (avgVolume > 1.3 && divergence !== "neutral") {
    explanation += ` Volume is ${avgVolume.toFixed(1)}× average — this divergence has conviction.`;
    strength = Math.min(100, strength + 10);
  }

  return { divergence, strength, explanation };
}

export function SentimentDivergence({ data, assetName = "SET50" }: Props) {
  const result = useMemo(() => detectDivergence(data), [data]);

  const color = result.divergence === "bullish"
    ? "var(--bull)"
    : result.divergence === "bearish"
    ? "var(--bear)"
    : "var(--muted)";

  const bg = result.divergence === "bullish"
    ? "var(--bull-10)"
    : result.divergence === "bearish"
    ? "var(--bear-10)"
    : "transparent";

  const label = result.divergence === "bullish"
    ? "CAPITULATION DIVERGENCE"
    : result.divergence === "bearish"
    ? "EUPHORIA DIVERGENCE"
    : "NO DIVERGENCE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          background: bg,
          border: `1px solid ${color}`,
        }}
      >
        <div style={{ textAlign: "center", minWidth: 50 }}>
          <div className="t-mono" style={{ fontSize: "1.25rem", fontWeight: 700, color }}>
            {result.strength}
          </div>
          <div className="t-micro" style={{ color }}>PWR</div>
        </div>
        <div>
          <div className="t-body" style={{ fontWeight: 600, fontSize: "0.8125rem", color }}>
            {label}
          </div>
          <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
            {assetName} · Narrative vs Reality
          </div>
        </div>
      </div>

      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--dim)", lineHeight: 1.5 }}>
        {result.explanation}
      </div>

      {/* Mini sparkline bars */}
      {data.length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32, padding: "4px 0" }}>
          {data.slice(-14).map((p, i) => {
            const h = Math.min(28, Math.max(4, Math.abs(p.newsSentiment) * 28));
            const isPos = p.newsSentiment >= 0;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  background: isPos ? "var(--bull)" : "var(--bear)",
                  opacity: 0.5 + Math.abs(p.priceChange) * 0.5,
                }}
                title={`${p.date}: news ${p.newsSentiment.toFixed(2)}, price ${p.priceChange.toFixed(2)}%`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
