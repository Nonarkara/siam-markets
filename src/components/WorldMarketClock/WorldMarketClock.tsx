"use client";

/**
 * World Market Clock — homage to Braun / GMT Weltzeit
 *
 * "Less, but better." Black background, hairline timezone grid, lowercase
 * city dots positioned at exact longitudes, live atomic clocks, and market
 * vibes anchored to each financial center via thin leader lines.
 *
 * Inheritance: Dieter Rams (10 Principles) + Braun travel clock (DN 30, GMT).
 * Accent: Braun yellow (#ffd000) — used ONLY for the moving second hand
 * and the active hour line. No fills. No gradients. No shadows.
 *
 * Dr Non's design DNA — see CLAUDE.md "Design Heritage".
 */

import { useState, useEffect, useMemo } from "react";

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
  if (pct >= 1.5)  return "euphoria";
  if (pct >= 0.5)  return "bullish";
  if (pct >= -0.5) return "cautious";
  if (pct >= -1.5) return "bearish";
  return "panic";
}

const VIBE_WORD: Record<Vibe, string> = {
  euphoria: "euphoria",
  bullish:  "bullish",
  cautious: "cautious",
  bearish:  "bearish",
  panic:    "panic",
  closed:   "closed",
};

const VIBE_COLOR: Record<Vibe, string> = {
  euphoria: "#00ff9a",
  bullish:  "#00c896",
  cautious: "#ffd000",   // Braun yellow
  bearish:  "#ff7a6e",
  panic:    "#ff3b30",
  closed:   "rgba(255,255,255,0.3)",
};

// ─── Helpers ──────────────────────────────────────────────────────

/** Equirectangular: longitude (-180..180) → x (0..width). */
function lonToX(lon: number, width: number, leftPad: number, rightPad: number): number {
  const usable = width - leftPad - rightPad;
  return leftPad + ((lon + 180) / 360) * usable;
}

/** Hour offset (-12..+12) → x. */
function tzToX(offset: number, width: number, leftPad: number, rightPad: number): number {
  return lonToX(offset * 15, width, leftPad, rightPad);
}

function formatTime(date: Date, tzOffset: number): { hh: string; mm: string; ss: string; day: string } {
  // tzOffset can be fractional (e.g., 5.5 for India). Compute milliseconds.
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  const local = new Date(utc + tzOffset * 3600_000);
  return {
    hh: String(local.getUTCHours()).padStart(2, "0"),
    mm: String(local.getUTCMinutes()).padStart(2, "0"),
    ss: String(local.getUTCSeconds()).padStart(2, "0"),
    day: local.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
  };
}

// ─── Component ────────────────────────────────────────────────────

export function WorldMarketClock({ centers }: Props) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [blink, setBlink] = useState(true);

  // Tick every second for atomic clocks
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      setBlink(b => !b);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // SVG layout
  const WIDTH = 1600;
  const HEIGHT = 280;
  const LEFT_PAD = 60;
  const RIGHT_PAD = 60;
  const STRIP_TOP = 90;
  const STRIP_BOTTOM = 190;

  // Generate timezone vertical lines (every 15° from -180 to +180)
  const timezoneLines = useMemo(() => {
    const lines: { offset: number; x: number; isMajor: boolean }[] = [];
    for (let h = -12; h <= 12; h++) {
      lines.push({
        offset: h,
        x: tzToX(h, WIDTH, LEFT_PAD, RIGHT_PAD),
        isMajor: h === 0 || h === -12 || h === 12 || h === -6 || h === 6,
      });
    }
    return lines;
  }, []);

  // Cities/centers positioned by longitude
  const positionedCenters = centers.map(c => ({
    ...c,
    x: lonToX(c.lon, WIDTH, LEFT_PAD, RIGHT_PAD),
    time: formatTime(now, c.tzOffset),
    vibe: vibeOf(c.changePct),
  }));

  // Compute UTC clock and Bangkok clock for the header
  const utcTime = formatTime(now, 0);
  const bkkTime = formatTime(now, 7);

  // Identify the active hour (where the sun is at noon-ish)
  // Bright yellow vertical line at the longitude where it is currently 12:00 local
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const noonOffset = ((12 - utcHour) + 24) % 24 - 12; // -12..+12, where local noon is right now
  const noonLineX = tzToX(noonOffset, WIDTH, LEFT_PAD, RIGHT_PAD);

  return (
    <div style={{
      background: "#0a0a0a",
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
      width: "100%",
    }}>
      {/* Top status bar — Braun "GMT WELTZEIT" plate */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "14px 24px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.7rem",
            letterSpacing: "0.24em",
            color: "rgba(255,255,255,0.95)",
            fontWeight: 400,
            textTransform: "uppercase",
          }}>
            GMT Weltzeit
          </span>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.55rem",
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
          }}>
            Greenwich Mean Time · 15° time-zones
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.55rem",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em",
          }}>
            UTC
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.05rem",
            fontWeight: 500,
            color: "rgba(255,255,255,0.95)",
            letterSpacing: "0.04em",
          }}>
            {utcTime.hh}<span style={{ opacity: blink ? 1 : 0.25 }}>:</span>{utcTime.mm}<span style={{ opacity: blink ? 1 : 0.25 }}>:</span>{utcTime.ss}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.55rem",
            color: "var(--braun-yellow, #ffd000)",
            letterSpacing: "0.1em",
          }}>
            BKK
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.05rem",
            fontWeight: 500,
            color: "var(--braun-yellow, #ffd000)",
            letterSpacing: "0.04em",
          }}>
            {bkkTime.hh}<span style={{ opacity: blink ? 1 : 0.25 }}>:</span>{bkkTime.mm}<span style={{ opacity: blink ? 1 : 0.25 }}>:</span>{bkkTime.ss}
          </span>
        </div>
      </div>

      {/* Atomic clocks row — 9 financial centers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(9, positionedCenters.length)}, 1fr)`,
        gap: 0,
        padding: "16px 12px",
        background: "#080808",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflowX: "auto",
      }}>
        {positionedCenters
          .filter(c => ["nyc","lon","fra","mow","dxb","bkk","hkg","tyo","syd"].includes(c.id))
          .map(c => (
            <div key={c.id} style={{
              padding: "0 12px",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              textAlign: "center",
              minWidth: 0,
            }}>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.55rem",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                marginBottom: 6,
              }}>
                {c.city.toLowerCase()}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.35rem",
                fontWeight: 400,
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "0.02em",
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {c.time.hh}
                <span style={{ opacity: blink ? 1 : 0.3 }}>:</span>
                {c.time.mm}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.5rem",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.06em",
              }}>
                {c.tzOffset >= 0 ? `+${c.tzOffset}` : c.tzOffset}h · {c.time.day}
              </div>
            </div>
          ))}
      </div>

      {/* Timezone strip SVG — the Braun map */}
      <div style={{ overflowX: "auto", padding: "24px 0 0", background: "#0a0a0a" }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ display: "block", width: "100%", minWidth: 1100 }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="World timezone map with financial centers"
        >
          {/* Hour offset labels — top row */}
          {timezoneLines.map(l => (
            <text
              key={`top-${l.offset}`}
              x={l.x}
              y={STRIP_TOP - 28}
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="rgba(255,255,255,0.5)"
              textAnchor="middle"
              letterSpacing="0.08em"
            >
              {l.offset > 0 ? `+${l.offset}` : l.offset}
            </text>
          ))}

          {/* h label */}
          <text
            x={LEFT_PAD - 22}
            y={STRIP_TOP - 28}
            fontFamily="var(--font-body)"
            fontSize={9}
            fill="rgba(255,255,255,0.3)"
            letterSpacing="0.1em"
          >
            h
          </text>

          {/* Vertical timezone lines */}
          {timezoneLines.map(l => (
            <line
              key={`v-${l.offset}`}
              x1={l.x}
              y1={STRIP_TOP - 10}
              x2={l.x}
              y2={STRIP_BOTTOM + 10}
              stroke={l.isMajor ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)"}
              strokeWidth={l.isMajor ? 1 : 0.6}
            />
          ))}

          {/* Active "noon" line — Braun yellow second hand equivalent */}
          <line
            x1={noonLineX}
            y1={STRIP_TOP - 18}
            x2={noonLineX}
            y2={STRIP_BOTTOM + 18}
            stroke="var(--braun-yellow, #ffd000)"
            strokeWidth={1.4}
            opacity={0.9}
          />
          <text
            x={noonLineX}
            y={STRIP_TOP - 40}
            fontFamily="var(--font-mono)"
            fontSize={9}
            fill="var(--braun-yellow, #ffd000)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            ☀ NOON
          </text>

          {/* Center horizontal axis — equator-ish (visually anchors dots) */}
          <line
            x1={LEFT_PAD - 10}
            y1={(STRIP_TOP + STRIP_BOTTOM) / 2}
            x2={WIDTH - RIGHT_PAD + 10}
            y2={(STRIP_TOP + STRIP_BOTTOM) / 2}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
          />

          {/* City dots + labels */}
          {positionedCenters.map((c, i) => {
            // Stagger labels vertically so they don't overlap when cities are close
            const labelY = (STRIP_TOP + STRIP_BOTTOM) / 2 + (i % 2 === 0 ? -14 : 14);
            const dotY  = (STRIP_TOP + STRIP_BOTTOM) / 2;
            return (
              <g key={c.id}>
                <circle cx={c.x} cy={dotY} r={3.2} fill="rgba(255,255,255,0.9)" />
                <line
                  x1={c.x}
                  y1={dotY}
                  x2={c.x}
                  y2={labelY + (i % 2 === 0 ? 6 : -8)}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={0.4}
                />
                <text
                  x={c.x + 6}
                  y={labelY}
                  fontFamily="var(--font-body)"
                  fontSize={11}
                  fill="rgba(255,255,255,0.85)"
                  letterSpacing="0.02em"
                  textAnchor="start"
                >
                  {c.city.toLowerCase()}
                </text>
              </g>
            );
          })}

          {/* Hour offset labels — bottom row */}
          {timezoneLines.map(l => (
            <text
              key={`bot-${l.offset}`}
              x={l.x}
              y={STRIP_BOTTOM + 26}
              fontFamily="var(--font-mono)"
              fontSize={9}
              fill="rgba(255,255,255,0.25)"
              textAnchor="middle"
              letterSpacing="0.06em"
            >
              {l.offset === 0 ? "0°" : ""}
            </text>
          ))}
        </svg>
      </div>

      {/* Market vibe cards — Braun-style data plates */}
      <div style={{
        padding: "16px 16px 20px",
        background: "#080808",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        gap: 1,
        overflowX: "auto",
      }}>
        {positionedCenters.map(c => (
          <div key={c.id} style={{
            flex: "1 0 130px",
            background: "#0a0a0a",
            padding: "10px 12px",
            borderRight: "1px solid rgba(255,255,255,0.04)",
            position: "relative",
            minWidth: 130,
          }}>
            {/* Leader arrow — tiny line + caret pointing up */}
            <div style={{
              position: "absolute",
              top: -8,
              left: 16,
              width: 1,
              height: 8,
              background: VIBE_COLOR[c.vibe],
              opacity: 0.7,
            }} />
            <div style={{
              position: "absolute",
              top: -10,
              left: 13,
              fontSize: "8px",
              color: VIBE_COLOR[c.vibe],
              fontFamily: "var(--font-mono)",
            }}>
              ▲
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              <span style={{ fontSize: "0.85rem" }}>{c.flag}</span>
              <span style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.55rem",
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
              }}>
                {c.city.toLowerCase()}
              </span>
            </div>

            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.75)",
              marginBottom: 3,
            }}>
              {c.indexLabel}
            </div>

            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: VIBE_COLOR[c.vibe],
              letterSpacing: "0.02em",
              marginBottom: 3,
            }}>
              {c.changePct > 0 ? "+" : ""}{c.changePct.toFixed(2)}%
            </div>

            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.5rem",
              letterSpacing: "0.2em",
              color: VIBE_COLOR[c.vibe],
              textTransform: "uppercase",
              fontWeight: 600,
            }}>
              {VIBE_WORD[c.vibe]}
            </div>

            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.5rem",
              color: "rgba(255,255,255,0.3)",
              marginTop: 4,
              letterSpacing: "0.04em",
            }}>
              {c.price > 10000 ? `${(c.price/1000).toFixed(1)}K` : c.price.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer attribution — Braun-style honest source line */}
      <div style={{
        padding: "8px 24px",
        background: "#050505",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.5rem",
          letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
        }}>
          14 financial centers · live indices · vibes from index change %
        </span>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.5rem",
          letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.25)",
          textTransform: "uppercase",
        }}>
          design heritage · dieter rams · braun gmt weltzeit
        </span>
      </div>
    </div>
  );
}
