"use client";

/**
 * World Market Clock — Braun GMT Weltzeit, banner edition.
 *
 * Single hairline row. Left: "GMT WELTZEIT" plate + live UTC/BKK clocks
 * (BKK in Braun yellow as the "second hand" of the workspace).
 * Right: 9 financial centers, ordered west → east, each showing
 * city · local time · index Δ% in vibe color.
 *
 * Inheritance: Dieter Rams (10 Principles), Braun travel clock.
 * "As little design as possible." No fills, no gradients, no shadows.
 * Single accent — Braun yellow #ffd000 — only for Bangkok and the
 * active-hour mark.
 *
 * Dr Non's design DNA — see CLAUDE.md "Design Heritage".
 */

import { useState, useEffect } from "react";

export interface FinancialCenter {
  id: string;
  city: string;
  flag: string;
  lon: number;
  tzOffset: number;
  indexLabel: string;
  price: number;
  changePct: number;
}

interface Props {
  centers: FinancialCenter[];
}

// ─── Vibe classification ──────────────────────────────────────────

type Vibe = "euphoria" | "bullish" | "cautious" | "bearish" | "panic" | "closed";

function vibeOf(pct: number): Vibe {
  if (pct === 0)   return "closed";
  if (pct >= 1.5)  return "euphoria";
  if (pct >= 0.5)  return "bullish";
  if (pct >= -0.5) return "cautious";
  if (pct >= -1.5) return "bearish";
  return "panic";
}

const VIBE_COLOR: Record<Vibe, string> = {
  euphoria: "#00c896",
  bullish:  "#00c896",
  cautious: "#ffd000",
  bearish:  "#ff7a6e",
  panic:    "#ff3b30",
  closed:   "rgba(255,255,255,0.35)",
};

// 9 anchor centers, ordered west → east (NY → Sydney)
const BANNER_ORDER = ["nyc", "lon", "fra", "mow", "dxb", "bkk", "hkg", "tyo", "syd"];

// ─── Helpers ──────────────────────────────────────────────────────

function formatTime(date: Date, tzOffset: number): { hh: string; mm: string; ss: string } {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  const local = new Date(utc + tzOffset * 3600_000);
  return {
    hh: String(local.getUTCHours()).padStart(2, "0"),
    mm: String(local.getUTCMinutes()).padStart(2, "0"),
    ss: String(local.getUTCSeconds()).padStart(2, "0"),
  };
}

// ─── Component ────────────────────────────────────────────────────

export function WorldMarketClock({ centers }: Props) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      setBlink(b => !b);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const utcTime = formatTime(now, 0);
  const bkkTime = formatTime(now, 7);

  // Order by BANNER_ORDER; fall back to the input order for any extras
  const orderedCenters = BANNER_ORDER
    .map(id => centers.find(c => c.id === id))
    .filter((c): c is FinancialCenter => Boolean(c));

  const colon = (
    <span style={{ opacity: blink ? 1 : 0.25 }}>:</span>
  );

  return (
    <div
      role="region"
      aria-label="World market clock"
      style={{
        display: "flex",
        alignItems: "stretch",
        background: "#0a0a0a",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        height: 56,
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "thin",
      }}
    >
      {/* GMT plate + UTC/BKK */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 18px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.625rem",
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.85)",
            textTransform: "uppercase",
          }}
        >
          GMT&nbsp;Weltzeit
        </span>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.1em",
            }}
          >
            UTC
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.95)",
              letterSpacing: "0.02em",
            }}
          >
            {utcTime.hh}{colon}{utcTime.mm}{colon}{utcTime.ss}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              color: "var(--braun-yellow, #ffd000)",
              letterSpacing: "0.1em",
            }}
          >
            BKK
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--braun-yellow, #ffd000)",
              letterSpacing: "0.02em",
            }}
          >
            {bkkTime.hh}{colon}{bkkTime.mm}{colon}{bkkTime.ss}
          </span>
        </div>
      </div>

      {/* 9 financial-center tickers */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
        }}
      >
        {orderedCenters.map(c => {
          const t = formatTime(now, c.tzOffset);
          const vibe = vibeOf(c.changePct);
          const color = VIBE_COLOR[vibe];
          return (
            <div
              key={c.id}
              title={`${c.city} · ${c.indexLabel} · UTC${c.tzOffset >= 0 ? "+" : ""}${c.tzOffset}`}
              style={{
                flex: 1,
                minWidth: 110,
                padding: "0 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
                borderRight: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* Row 1: city · local time */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5625rem",
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.city.toLowerCase()}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.85)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {t.hh}{colon}{t.mm}
                </span>
              </div>

              {/* Row 2: index label · Δ% in vibe color */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5625rem",
                    color: "rgba(255,255,255,0.4)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.indexLabel}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color,
                    letterSpacing: "0.02em",
                  }}
                >
                  {c.changePct > 0 ? "+" : ""}{c.changePct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
