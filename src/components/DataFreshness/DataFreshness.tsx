"use client";

/**
 * DataFreshness — universal data-provenance badge.
 *
 * Drops into any UI surface that displays tradeable numbers. Tells the
 * user, at a glance, whether the data is real, cached, or synthetic.
 *
 * States:
 *   source="mock"     → red    "DEMO DATA · NOT TRADEABLE"
 *   source="live"     → green  "LIVE · 2m ago"             when fresh
 *                       amber  "STALE · 22m ago"            past warnAfter
 *                       red    "OFFLINE · 4h ago — refresh" past staleAfter
 *   source="supabase" → blue   "CACHED · 1h ago"
 *   source="cached"   → grey   "CACHED · 1h ago"
 *
 * Heritage: zero radius, hairline border, single accent color per state.
 */

import { useEffect, useState } from "react";

export type FreshnessSource = "live" | "supabase" | "cached" | "mock";

interface Props {
  timestamp: string | null;
  source: FreshnessSource;
  /** Default 15 min. Beyond this → amber. */
  warnAfterMinutes?: number;
  /** Default 60 min. Beyond this → red. */
  staleAfterMinutes?: number;
  /** Optional source-name override e.g. "Yahoo Finance" */
  label?: string;
  /** Compact mode — single chip, no breakdown */
  compact?: boolean;
}

interface Display {
  text:    string;
  color:   string;
  bg:      string;
  symbol:  string;
}

function ageMinutes(timestamp: string | null): number | null {
  if (!timestamp) return null;
  const t = Date.parse(timestamp);
  if (isNaN(t)) return null;
  return Math.max(0, (Date.now() - t) / 60_000);
}

function ageLabel(mins: number): string {
  if (mins < 1)    return "< 1m ago";
  if (mins < 60)   return `${Math.round(mins)}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function compute(
  source: FreshnessSource,
  mins: number | null,
  warn: number,
  stale: number,
): Display {
  if (source === "mock") {
    return { text: "DEMO DATA · NOT TRADEABLE", color: "var(--bear)", bg: "var(--bear-10)", symbol: "✕" };
  }
  if (source === "supabase" || source === "cached") {
    const age = mins !== null ? ageLabel(mins) : "—";
    return { text: `CACHED · ${age}`, color: "var(--tech)", bg: "var(--tech-10)", symbol: "◐" };
  }
  // live
  if (mins === null) {
    return { text: "LIVE · time unknown", color: "var(--caution)", bg: "var(--caution-10)", symbol: "◌" };
  }
  if (mins < warn) {
    return { text: `LIVE · ${ageLabel(mins)}`, color: "var(--bull)", bg: "var(--bull-10)", symbol: "●" };
  }
  if (mins < stale) {
    return { text: `STALE · ${ageLabel(mins)}`, color: "var(--caution)", bg: "var(--caution-10)", symbol: "◐" };
  }
  return { text: `OFFLINE · ${ageLabel(mins)} — refresh`, color: "var(--bear)", bg: "var(--bear-10)", symbol: "✕" };
}

export function DataFreshness({
  timestamp,
  source,
  warnAfterMinutes = 15,
  staleAfterMinutes = 60,
  label,
  compact = false,
}: Props) {
  // Refresh ageLabel every 30s so "2m ago" doesn't stick when the page is left open
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const mins = ageMinutes(timestamp);
  const d = compute(source, mins, warnAfterMinutes, staleAfterMinutes);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: d.bg,
        border: `1px solid ${d.color}`,
        padding: compact ? "2px 6px" : "3px 9px",
        fontFamily: "var(--font-mono)",
        fontSize: compact ? "0.5rem" : "0.5625rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: d.color,
        whiteSpace: "nowrap",
      }}
      title={label ? `${label} · ${d.text}` : d.text}
    >
      <span style={{ fontSize: compact ? "0.55rem" : "0.625rem" }}>{d.symbol}</span>
      <span>{d.text}</span>
      {label && !compact && (
        <span style={{ color: "var(--dim)", fontWeight: 400, marginLeft: 2 }}>
          · {label}
        </span>
      )}
    </span>
  );
}
