"use client";

import { useState } from "react";

interface Channel {
  id: string;
  name: string;
  flag: string;
  lang: string;
  channelId: string;
  focus: string;   // what this channel covers
  color: string;
}

const CHANNELS: Channel[] = [
  {
    id: "bloomberg",
    name: "Bloomberg TV",
    flag: "🇺🇸",
    lang: "EN",
    channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
    focus: "Global markets · macro · earnings",
    color: "var(--tech)",
  },
  {
    id: "yahoo",
    name: "Yahoo Finance",
    flag: "🇺🇸",
    lang: "EN",
    channelId: "UCEAZeUIeJs0IjQiqTCdVSIg",
    focus: "US equities · real-time commentary",
    color: "var(--bull)",
  },
  {
    id: "reuters",
    name: "Reuters TV",
    flag: "🌐",
    lang: "EN",
    channelId: "UCjTMxYSAvQ9DNPYjtxNgkCw",
    focus: "Global news · geopolitics · markets",
    color: "var(--caution)",
  },
  {
    id: "cgtn",
    name: "CGTN Business",
    flag: "🇨🇳",
    lang: "EN",
    channelId: "UC-Pq5M-yE8caR28E-VLK5JA",
    focus: "China economy · ASEAN · Belt & Road",
    color: "var(--bear)",
  },
  {
    id: "money",
    name: "Money Channel",
    flag: "🇹🇭",
    lang: "TH",
    channelId: "UC_P_eClSd6nIYJFN_h7_lxA",
    focus: "SET · Thai stocks · mutual funds",
    color: "#FFD700",
  },
  {
    id: "tnn",
    name: "TNN Thailand",
    flag: "🇹🇭",
    lang: "TH",
    channelId: "UCqUBA96OsqMgSFvTwLXY9yw",
    focus: "Thai news · BOT · policy · economy",
    color: "#FFD700",
  },
];

interface ChannelPanelProps {
  channel: Channel;
  expanded: boolean;
  onExpand: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

function ChannelPanel({ channel, expanded, onExpand, muted, onToggleMute }: ChannelPanelProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const src = `https://www.youtube.com/embed/live_stream?channel=${channel.channelId}&autoplay=${expanded ? 1 : 0}&mute=${muted ? 1 : 0}&controls=1&rel=0&modestbranding=1`;

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid var(--line)`,
      borderTop: `2px solid ${channel.color}`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Channel header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--line)",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Live dot */}
          <div style={{
            width: 6, height: 6,
            background: "var(--bear)",
            borderRadius: "50%",
            animation: "pulse 2s ease-in-out infinite",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: "0.875rem" }}>{channel.flag}</span>
          <div>
            <div className="t-body" style={{ fontWeight: 700, lineHeight: 1.1 }}>{channel.name}</div>
            <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1 }}>{channel.focus}</div>
          </div>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.5rem",
            fontWeight: 700,
            color: channel.color,
            border: `1px solid ${channel.color}`,
            padding: "1px 4px",
            letterSpacing: "0.08em",
          }}>
            {channel.lang}
          </span>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {/* Mute toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
            style={{
              background: "none",
              border: "1px solid var(--line)",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.5rem",
              padding: "3px 7px",
              cursor: "pointer",
              letterSpacing: "0.06em",
              minHeight: 24,
            }}
          >
            {muted ? "🔇" : "🔊"}
          </button>

          {/* Expand toggle */}
          <button
            onClick={onExpand}
            style={{
              background: expanded ? channel.color : "none",
              border: `1px solid ${channel.color}`,
              color: expanded ? "#000" : channel.color,
              fontFamily: "var(--font-mono)",
              fontSize: "0.5rem",
              padding: "3px 7px",
              cursor: "pointer",
              letterSpacing: "0.06em",
              fontWeight: 700,
              minHeight: 24,
            }}
          >
            {expanded ? "✕" : "▶ WATCH"}
          </button>
        </div>
      </div>

      {/* Video embed or thumbnail state */}
      {expanded ? (
        <div style={{
          position: "relative",
          paddingTop: "56.25%", // 16:9
          background: "#000",
        }}>
          {!loaded && !error && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#000",
            }}>
              <div style={{ textAlign: "center" }}>
                <div className="shimmer" style={{ width: 40, height: 40, margin: "0 auto 8px" }} />
                <div className="t-micro" style={{ color: "var(--dim)" }}>LOADING STREAM...</div>
              </div>
            </div>
          )}
          {error ? (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "#000",
              gap: 8,
            }}>
              <div className="t-micro" style={{ color: "var(--dim)" }}>STREAM CURRENTLY OFFLINE</div>
              <a
                href={`https://www.youtube.com/channel/${channel.channelId}/live`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-micro)",
                  color: channel.color,
                  textDecoration: "none",
                  border: `1px solid ${channel.color}`,
                  padding: "4px 10px",
                }}
              >
                OPEN ON YOUTUBE →
              </a>
            </div>
          ) : (
            <iframe
              key={`${channel.id}-${expanded}`}
              src={src}
              style={{
                position: "absolute", top: 0, left: 0,
                width: "100%", height: "100%",
                border: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
            />
          )}
        </div>
      ) : (
        /* Collapsed state — channel card */
        <div
          onClick={onExpand}
          style={{
            padding: "14px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg)",
            transition: "background 180ms var(--ease)",
            minHeight: 52,
          }}
        >
          <div className="t-micro" style={{ color: "var(--dim)" }}>Click to load live stream</div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            <div style={{ width: 6, height: 6, background: "var(--bear)", borderRadius: "50%" }} />
            <span className="t-micro" style={{ color: "var(--bear)", fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function LiveTVGrid() {
  const [active, setActive] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);

  // On mobile: single expanded channel
  // On desktop: can have multiple, but default to single
  function toggle(id: string) {
    setActive(prev => prev === id ? null : id);
  }

  return (
    <div>
      {/* Section header */}
      <div style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--line)",
        borderBottom: "none",
        padding: "8px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, background: "var(--bear)", borderRadius: "50%" }} />
          <span className="t-micro">LIVE FINANCIAL TV</span>
        </div>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          {CHANNELS.filter(c => ["bloomberg","yahoo","reuters","cgtn"].includes(c.id)).map(c => c.flag).join(" ")} EN ·{" "}
          {CHANNELS.filter(c => ["money","tnn"].includes(c.id)).map(c => c.flag).join(" ")} TH
        </span>
      </div>

      {/* Channel grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 1,
        background: "var(--line)",
        border: "1px solid var(--line)",
      }}>
        {CHANNELS.map(channel => (
          <ChannelPanel
            key={channel.id}
            channel={channel}
            expanded={active === channel.id}
            onExpand={() => toggle(channel.id)}
            muted={muted}
            onToggleMute={() => setMuted(m => !m)}
          />
        ))}
      </div>

      {/* Global mute note */}
      <div style={{
        padding: "6px 12px",
        background: "var(--bg-raised)",
        border: "1px solid var(--line)",
        borderTop: "none",
      }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          Streams auto-mute per browser policy · Toggle 🔊 on any channel · Click ▶ WATCH to load
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
