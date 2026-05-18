"use client";

import { useState, useEffect } from "react";
import type { StreamInfo } from "@/app/api/tv-streams/route";

interface ChannelPanelProps {
  stream: StreamInfo;
  expanded: boolean;
  onExpand: () => void;
  muted: boolean;
}

function ChannelPanel({ stream, expanded, onExpand, muted }: ChannelPanelProps) {
  const [loaded, setLoaded] = useState(false);

  // Build embed URL — prefer specific video ID, fall back to channel embed
  const embedUrl = stream.videoId
    ? `https://www.youtube.com/embed/${stream.videoId}?autoplay=${expanded ? 1 : 0}&mute=${muted ? 1 : 0}&controls=1&rel=0&modestbranding=1`
    : stream.channelId
    ? `https://www.youtube.com/embed/live_stream?channel=${stream.channelId}&autoplay=${expanded ? 1 : 0}&mute=${muted ? 1 : 0}&controls=1&rel=0`
    : null;

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--line)",
      borderTop: `2px solid ${stream.color}`,
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          {/* Live / offline indicator */}
          <div style={{
            width: 6, height: 6,
            background: stream.isLive ? "var(--bear)" : "var(--dim)",
            borderRadius: "50%",
            flexShrink: 0,
            animation: stream.isLive ? "tvpulse 2s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{stream.flag}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="t-body" style={{ fontWeight: 700, lineHeight: 1.1 }}>{stream.name}</div>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.5rem",
                fontWeight: 700,
                color: stream.color,
                border: `1px solid ${stream.color}`,
                padding: "1px 4px",
                letterSpacing: "0.08em",
                flexShrink: 0,
              }}>
                {stream.lang}
              </span>
              {stream.isLive && (
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.45rem",
                  fontWeight: 700,
                  color: "var(--bear)",
                  letterSpacing: "0.08em",
                }}>
                  ● LIVE
                </span>
              )}
            </div>
            <div className="t-micro" style={{ color: "var(--dim)" }}>{stream.focus}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            onClick={onExpand}
            style={{
              background: expanded ? stream.color : "none",
              border: `1px solid ${stream.isLive || stream.channelId ? stream.color : "var(--line)"}`,
              color: expanded ? "#000" : (stream.isLive ? stream.color : "var(--dim)"),
              fontFamily: "var(--font-mono)",
              fontSize: "0.5rem",
              padding: "3px 8px",
              cursor: stream.isLive || stream.channelId ? "pointer" : "default",
              letterSpacing: "0.06em",
              fontWeight: 700,
              minHeight: 26,
            }}
          >
            {expanded ? "✕ CLOSE" : stream.isLive ? "▶ WATCH" : stream.channelId ? "▶ TRY" : "OFFLINE"}
          </button>
        </div>
      </div>

      {/* Video embed */}
      {expanded && embedUrl ? (
        <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
          {!loaded && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#000",
            }}>
              <div className="t-micro" style={{ color: "var(--dim)" }}>LOADING STREAM...</div>
            </div>
          )}
          <iframe
            key={`${stream.id}-${stream.videoId}`}
            src={embedUrl}
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%", border: "none",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
        </div>
      ) : expanded && !embedUrl ? (
        <div style={{
          padding: "20px 16px", background: "#000",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        }}>
          <div className="t-micro" style={{ color: "var(--dim)" }}>NO STREAM AVAILABLE</div>
          <a
            href={stream.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
              color: stream.color, textDecoration: "none",
              border: `1px solid ${stream.color}`, padding: "6px 14px",
            }}
          >
            OPEN CHANNEL →
          </a>
        </div>
      ) : (
        // Collapsed — show click target
        <div
          onClick={onExpand}
          style={{
            padding: "10px 12px", cursor: stream.isLive || stream.channelId ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg)", minHeight: 44,
          }}
        >
          <div className="t-micro" style={{ color: "var(--dim)" }}>
            {stream.isLive ? "Live stream detected — click to load" : stream.channelId ? "Click to try channel embed" : "Not currently live"}
          </div>
          {(stream.isLive || stream.channelId) && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, background: "var(--bear)", borderRadius: "50%" }} />
              <span className="t-micro" style={{ color: "var(--bear)", fontWeight: 700 }}>LIVE</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LiveTVGrid() {
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    fetch("/api/tv-streams")
      .then(r => r.json())
      .then((data: StreamInfo[]) => {
        setStreams(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const liveCount = streams.filter(s => s.isLive).length;

  return (
    <div>
      {/* Header */}
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
          <div style={{ width: 6, height: 6, background: "var(--bear)", borderRadius: "50%", animation: "tvpulse 2s ease-in-out infinite" }} />
          <span className="t-micro">LIVE FINANCIAL TV</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!loading && (
            <span className="t-micro" style={{ color: liveCount > 0 ? "var(--bull)" : "var(--dim)" }}>
              {liveCount}/{streams.length} LIVE
            </span>
          )}
          <button
            onClick={() => setMuted(m => !m)}
            style={{
              background: "none", border: "1px solid var(--line)",
              color: "var(--muted)", cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: "0.55rem",
              padding: "3px 8px", minHeight: 24,
            }}
          >
            {muted ? "🔇 MUTED" : "🔊 SOUND"}
          </button>
        </div>
      </div>

      {/* Channels grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 1,
        background: "var(--line)",
        border: "1px solid var(--line)",
      }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 80 }} />
          ))
        ) : streams.map(stream => (
          <ChannelPanel
            key={stream.id}
            stream={stream}
            expanded={active === stream.id}
            onExpand={() => setActive(prev => prev === stream.id ? null : stream.id)}
            muted={muted}
          />
        ))}
      </div>

      <div style={{
        padding: "6px 12px",
        background: "var(--bg-raised)",
        border: "1px solid var(--line)",
        borderTop: "none",
      }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          Video IDs fetched live from YouTube · Auto-refreshes every 5 min · {liveCount} streams detected
        </span>
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
