"use client";

/**
 * Multi-channel TV wall with signal-detection.
 *
 *   Hero (large) + 10 muted previews, click to swap.
 *
 *   Signal detection: each preview iframe has `enablejsapi=1`.
 *   A window `message` listener tracks YouTube IFrame API events.
 *   When YouTube fires:
 *     • Error code 100          → video not found
 *     • Error code 101 / 150   → embedding disabled by channel
 *     • playerState === 1      → playing (signal confirmed)
 *   …and if no "playing" event arrives within 18 s, the channel is
 *   presumed off-air. In all three failure cases the iframe is hidden
 *   and a styled NO SIGNAL card replaces it with a direct YouTube link.
 *
 *   Heritage: Braun broadcast monitor wall. Hairline borders, zero
 *   rounding, single Braun-yellow accent on hero corner + SOUND button.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TV_CHANNELS, type TVChannel } from "@/lib/tv-channels";
import type { ChannelContext } from "@/app/api/tv-context/route";

const HERO_DEFAULT_ID = "bloomberg";

/** Timeout (ms) before a preview is considered off-air if no "playing" event arrives. */
const SIGNAL_TIMEOUT_MS = 18_000;

type SignalStatus = "loading" | "live" | "offline";

function embedUrl(ch: TVChannel, opts: { autoplay: boolean; muted: boolean; jsapi?: boolean }): string {
  const a = opts.autoplay ? 1 : 0;
  const m = opts.muted ? 1 : 0;
  const ctrl = opts.autoplay && !opts.muted ? 1 : 0;
  const jsapi = opts.jsapi ? "&enablejsapi=1&playsinline=1" : "&playsinline=1";
  return `https://www.youtube.com/embed/live_stream?channel=${ch.channelId}&autoplay=${a}&mute=${m}&controls=${ctrl}&rel=0&modestbranding=1${jsapi}`;
}

// ─── NO SIGNAL card ──────────────────────────────────────────

function NoSignalCard({ ch, reason }: { ch: TVChannel; reason: "offline" | "embedding-disabled" }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#050508",
        gap: 10,
        padding: 16,
      }}
    >
      {/* Animated scan-line texture — pure CSS, no images */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.013) 3px, rgba(255,255,255,0.013) 4px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.5rem",
          letterSpacing: "0.28em",
          color: "var(--braun-yellow, #ffd000)",
          border: "1px solid var(--braun-yellow, #ffd000)",
          padding: "3px 10px",
        }}
      >
        NO SIGNAL
      </div>

      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: "rgba(255,255,255,0.8)",
          textAlign: "center",
          letterSpacing: "0.04em",
        }}
      >
        {ch.flag} {ch.name}
      </div>

      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.625rem",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          lineHeight: 1.5,
          maxWidth: 180,
        }}
      >
        {reason === "embedding-disabled"
          ? "This channel has disabled live-stream embedding. The broadcast is running — click to watch directly."
          : "No live broadcast detected. This channel may be off-air or between shows."}
      </div>

      <a
        href={ch.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "var(--tech)",
          border: "1px solid var(--tech)",
          padding: "5px 12px",
          textDecoration: "none",
          marginTop: 4,
        }}
      >
        WATCH ON YOUTUBE ↗
      </a>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────

export function TVWall() {
  const [heroId, setHeroId] = useState<string>(HERO_DEFAULT_ID);
  const [heroMuted, setHeroMuted] = useState(true);
  const [contexts, setContexts] = useState<Record<string, ChannelContext>>({});
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Signal tracking per channel id
  const [signals, setSignals] = useState<Record<string, SignalStatus>>({});
  // Error reason — "embedding-disabled" vs generic "offline"
  const [signalReason, setSignalReason] = useState<Record<string, "offline" | "embedding-disabled">>({});
  // Refs to preview iframes — for correlating postMessage sender
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  // Timeout handles for each channel
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Start the per-channel signal-detection timeout when a preview loads
  const startTimeout = useCallback((id: string) => {
    clearTimeout(timeouts.current[id]);
    timeouts.current[id] = setTimeout(() => {
      setSignals(s => {
        if (s[id] === "loading" || s[id] === undefined) {
          return { ...s, [id]: "offline" };
        }
        return s;
      });
      setSignalReason(r => ({ ...r, [id]: "offline" }));
    }, SIGNAL_TIMEOUT_MS);
  }, []);

  // YouTube IFrame API postMessage listener
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.origin.includes("youtube.com")) return;

      // Correlate sender to a channel id via iframe contentWindow refs
      const channelId = Object.keys(iframeRefs.current).find(
        id => iframeRefs.current[id]?.contentWindow === event.source,
      );
      if (!channelId) return;

      let data: { event?: string; info?: number | { playerState?: number } };
      try {
        data = JSON.parse(typeof event.data === "string" ? event.data : "{}");
      } catch {
        return;
      }

      if (data.event === "onError") {
        const code = typeof data.info === "number" ? data.info : 0;
        clearTimeout(timeouts.current[channelId]);
        const reason = code === 101 || code === 150 ? "embedding-disabled" : "offline";
        setSignalReason(r => ({ ...r, [channelId]: reason }));
        setSignals(s => ({ ...s, [channelId]: "offline" }));
        return;
      }

      if (data.event === "infoDelivery") {
        const state = typeof data.info === "object" ? data.info?.playerState : undefined;
        if (state === 1) {
          // Playing — clear timeout, mark live
          clearTimeout(timeouts.current[channelId]);
          setSignals(s => ({ ...s, [channelId]: "live" }));
        }
      }
    };

    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Load AI contexts
  useEffect(() => {
    fetch("/api/tv-context")
      .then(r => r.json())
      .then((data: ChannelContext[]) => {
        const map: Record<string, ChannelContext> = {};
        data.forEach(c => { map[c.id] = c; });
        setContexts(map);
      })
      .catch(() => {});
  }, []);

  const hero = useMemo(() => TV_CHANNELS.find(c => c.id === heroId) ?? TV_CHANNELS[0], [heroId]);
  const previews = useMemo(() => TV_CHANNELS.filter(c => c.id !== heroId), [heroId]);
  const heroCtx = contexts[hero.id];

  const swap = (id: string) => {
    const targetSignal = signals[id];
    if (targetSignal === "offline") return; // can't make a dead signal the hero
    setHeroId(id);
    setHeroMuted(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <div style={{
        background: "#000",
        border: "1px solid var(--line)",
        borderTop: `2px solid ${hero.color}`,
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          background: "var(--bg-raised)",
          borderBottom: "1px solid var(--line)",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ width: 7, height: 7, background: "var(--bear)", display: "inline-block", animation: "tvpulse 2s ease-in-out infinite", flexShrink: 0 }} />
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>{hero.flag}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span className="t-body" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{hero.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: hero.color, border: `1px solid ${hero.color}`, padding: "1px 5px", letterSpacing: "0.1em", fontWeight: 700 }}>{hero.lang}</span>
                <span className="t-micro" style={{ color: "var(--bear)", fontWeight: 700, letterSpacing: "0.12em" }}>● LIVE</span>
              </div>
              {heroCtx ? (
                <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.35, marginTop: 2 }}>
                  {heroCtx.show}
                  {heroCtx.source === "ai" && (
                    <span style={{ marginLeft: 6, color: "var(--braun-yellow, #ffd000)", fontSize: "0.5rem", letterSpacing: "0.14em" }}>AI</span>
                  )}
                </div>
              ) : (
                <div className="t-micro" style={{ color: "var(--dim)" }}>{hero.focus}</div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setHeroMuted(m => !m)}
              style={{
                background: heroMuted ? "transparent" : "var(--braun-yellow, #ffd000)",
                color: heroMuted ? "var(--muted)" : "#000",
                border: `1px solid ${heroMuted ? "var(--line)" : "var(--braun-yellow, #ffd000)"}`,
                fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 700,
                letterSpacing: "0.1em", padding: "6px 12px", cursor: "pointer", minHeight: 28,
              }}
            >
              {heroMuted ? "🔇 MUTED" : "🔊 SOUND"}
            </button>
            <a
              href={hero.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 700,
                letterSpacing: "0.1em", color: hero.color, border: `1px solid ${hero.color}`,
                padding: "6px 12px", textDecoration: "none", minHeight: 28,
                display: "inline-flex", alignItems: "center",
              }}
            >
              YOUTUBE ↗
            </a>
          </div>
        </div>

        {/* Hero video */}
        <div style={{ position: "relative", paddingTop: "42%", background: "#000" }}>
          <iframe
            key={`hero-${hero.id}-${heroMuted ? "m" : "s"}`}
            src={embedUrl(hero, { autoplay: true, muted: heroMuted })}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`${hero.name} live`}
          />
        </div>

        {/* AI takeaway strip */}
        {heroCtx && (
          <div style={{
            padding: "8px 14px",
            background: "var(--bg-surface)",
            borderTop: "1px solid var(--line)",
            display: "flex",
            gap: 10,
            alignItems: "baseline",
            flexWrap: "wrap",
          }}>
            <span className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", letterSpacing: "0.14em" }}>
              {heroCtx.source === "ai" ? "AI READ" : "SCHEDULE"}
            </span>
            <span className="t-body" style={{ fontSize: "0.8125rem", color: "var(--ink)" }}>{heroCtx.topic}</span>
            <span className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", flex: 1, minWidth: 240 }}>
              — {heroCtx.takeaway}
            </span>
          </div>
        )}
      </div>

      {/* ── Preview grid — signal detection per channel ──────── */}
      <div className="tv-preview-grid">
        {previews.map(ch => {
          const status = signals[ch.id] ?? "loading";
          const reason = signalReason[ch.id] ?? "offline";
          const ctx = contexts[ch.id];
          const isOffline = status === "offline";

          return (
            <button
              key={ch.id}
              onClick={() => !isOffline && swap(ch.id)}
              onMouseEnter={() => setHoverId(ch.id)}
              onMouseLeave={() => setHoverId(curr => (curr === ch.id ? null : curr))}
              onFocus={() => setHoverId(ch.id)}
              onBlur={() => setHoverId(curr => (curr === ch.id ? null : curr))}
              aria-label={isOffline ? `${ch.name} — no signal` : `Switch hero to ${ch.name}`}
              style={{
                all: "unset",
                cursor: isOffline ? "default" : "pointer",
                background: "#000",
                border: `1px solid ${isOffline ? "var(--dim)" : "var(--line)"}`,
                borderTop: `2px solid ${isOffline ? "var(--dim)" : ch.color}`,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                opacity: isOffline ? 0.75 : 1,
              }}
            >
              {/* Preview header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 8px",
                background: "var(--bg-raised)",
                borderBottom: "1px solid var(--line)",
                minHeight: 28,
              }}>
                <span style={{ fontSize: "0.75rem" }}>{ch.flag}</span>
                <span className="t-body" style={{
                  fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.04em",
                  flex: 1, minWidth: 0, whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                  color: isOffline ? "var(--dim)" : "var(--ink)",
                }}>
                  {ch.name}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.45rem",
                  color: isOffline ? "var(--dim)" : ch.color,
                  border: `1px solid ${isOffline ? "var(--dim)" : ch.color}`,
                  padding: "0 3px", letterSpacing: "0.08em", fontWeight: 700,
                }}>
                  {ch.lang}
                </span>
                {/* Signal status indicator */}
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.45rem",
                  fontWeight: 700, letterSpacing: "0.08em",
                  color: status === "live" ? "var(--bull)" : status === "loading" ? "var(--caution)" : "var(--dim)",
                  flexShrink: 0,
                }}>
                  {status === "live" ? "● LIVE" : status === "loading" ? "● …" : "✗ OFF AIR"}
                </span>
              </div>

              {/* Video or NO SIGNAL card */}
              <div style={{ position: "relative", paddingTop: "56.25%", background: "#000", overflow: "hidden" }}>
                {/* Iframe — always present in DOM; hidden when offline so status updates still fire */}
                <iframe
                  ref={el => { iframeRefs.current[ch.id] = el; }}
                  src={embedUrl(ch, { autoplay: true, muted: true, jsapi: true })}
                  onLoad={() => startTimeout(ch.id)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                    pointerEvents: "none",
                    // Hide iframe when offline so our card shows; keep it alive in DOM
                    // so postMessage events (if late) still reach the listener.
                    visibility: isOffline ? "hidden" : "visible",
                  }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  title={`${ch.name} preview`}
                />

                {/* NO SIGNAL card — rendered over hidden iframe */}
                {isOffline && <NoSignalCard ch={ch} reason={reason} />}

                {/* Hover overlay — shown only when live */}
                {!isOffline && hoverId === ch.id && (
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.78)",
                      padding: "10px 12px",
                      display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8,
                      pointerEvents: "none",
                    }}
                  >
                    <div>
                      <div className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", letterSpacing: "0.14em", marginBottom: 4 }}>
                        {ctx?.source === "ai" ? "AI READ" : "SCHEDULE"} · {ch.region}
                      </div>
                      <div className="t-body" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>
                        {ctx?.show ?? ch.focus}
                      </div>
                      {ctx?.takeaway && (
                        <div className="t-body" style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>
                          {ctx.takeaway}
                        </div>
                      )}
                    </div>
                    <div className="t-micro" style={{ color: "var(--tech)", letterSpacing: "0.14em" }}>
                      ▲ CLICK TO MAKE HERO
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes tvpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .tv-preview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        @media (min-width: 640px) {
          .tv-preview-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .tv-preview-grid { grid-template-columns: repeat(5, 1fr); }
        }
        @media (min-width: 1400px) {
          .tv-preview-grid { grid-template-columns: repeat(10, 1fr); }
        }
      `}</style>
    </div>
  );
}
