"use client";

import Link from "next/link";

const STRIP_CHANNELS = [
  { name: "Bloomberg",     flag: "🇺🇸", lang: "EN", color: "var(--tech)"    },
  { name: "Yahoo Finance", flag: "🇺🇸", lang: "EN", color: "var(--bull)"    },
  { name: "Reuters",       flag: "🌐",  lang: "EN", color: "var(--caution)" },
  { name: "CGTN Biz",      flag: "🇨🇳", lang: "EN", color: "var(--bear)"    },
  { name: "Money Ch.",     flag: "🇹🇭", lang: "TH", color: "var(--braun-yellow, #ffd000)"        },
  { name: "TNN Thai",      flag: "🇹🇭", lang: "TH", color: "var(--braun-yellow, #ffd000)"        },
];

export function TVChannelStrip() {
  return (
    <div style={{
      background: "var(--bg-raised)",
      border: "1px solid var(--line)",
    }}>
      {/* Header */}
      <div style={{
        padding: "6px 16px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 6, height: 6,
            background: "var(--bear)",
            borderRadius: "50%",
            animation: "tvpulse 2s ease-in-out infinite",
          }} />
          <span className="t-micro">LIVE TV</span>
        </div>
        <Link
          href="/markets"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro)",
            color: "var(--tech)",
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}
        >
          → WATCH ALL
        </Link>
      </div>

      {/* Channel chips — horizontal scroll */}
      <div style={{
        display: "flex",
        overflowX: "auto",
        scrollbarWidth: "none",
        padding: "8px 12px",
        gap: 8,
      }}>
        {STRIP_CHANNELS.map(ch => (
          <Link
            key={ch.name}
            href="/markets"
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 12px",
              background: "var(--bg)",
              border: `1px solid var(--line)`,
              borderTop: `2px solid ${ch.color}`,
              textDecoration: "none",
              flexShrink: 0,
              minWidth: 72,
              minHeight: 60,
              justifyContent: "center",
              transition: "background 180ms var(--ease)",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{ch.flag}</span>
            <div className="t-body" style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--ink)", textAlign: "center", lineHeight: 1.2 }}>
              {ch.name}
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.5rem",
              color: ch.color,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}>
              {ch.lang} · LIVE
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes tvpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
