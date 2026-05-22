"use client";

import { useState, useMemo } from "react";
import { TV_CHANNELS, REGION_GROUPS, type TVChannel } from "@/lib/tv-channels";
import { EconCalendar } from "@/components/Intelligence/EconCalendar";

const GROUP_COLORS: Record<string, string> = {
  AMERICAS: "var(--bull)",
  EUROPE: "var(--tech)",
  ASIA: "var(--caution)",
  OCEANIA: "var(--bear)",
  "MIDDLE EAST": "var(--braun-yellow, #ffd000)",
};

export function NewsroomShell() {
  const [heroId, setHeroId] = useState("bloomberg");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [muted, setMuted] = useState(true);

  const hero = useMemo(() => TV_CHANNELS.find(c => c.id === heroId) ?? TV_CHANNELS[0], [heroId]);

  const filtered = useMemo(() => {
    if (regionFilter === "ALL") return TV_CHANNELS;
    return TV_CHANNELS.filter(c => c.regionGroup === regionFilter);
  }, [regionFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, TVChannel[]>();
    for (const c of filtered) {
      const arr = map.get(c.regionGroup) ?? [];
      arr.push(c);
      map.set(c.regionGroup, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div style={{ height: "calc(100dvh - var(--top-h))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar — region filters + hero info */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "5px 12px", borderBottom: "1px solid var(--line)",
        flexShrink: 0, flexWrap: "wrap",
      }}>
        <button
          onClick={() => setRegionFilter("ALL")}
          style={{
            background: regionFilter === "ALL" ? "var(--bg-surface)" : "transparent",
            border: `1px solid ${regionFilter === "ALL" ? "var(--ink)" : "var(--line-dim)"}`,
            color: regionFilter === "ALL" ? "var(--ink)" : "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.1em",
            padding: "3px 8px", cursor: "pointer",
          }}
        >
          ALL {TV_CHANNELS.length}
        </button>
        {REGION_GROUPS.map(r => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            style={{
              background: regionFilter === r ? "var(--bg-surface)" : "transparent",
              border: `1px solid ${regionFilter === r ? GROUP_COLORS[r] : "var(--line-dim)"}`,
              color: regionFilter === r ? GROUP_COLORS[r] : "var(--muted)",
              fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.1em",
              padding: "3px 8px", cursor: "pointer",
            }}
          >
            {r} {TV_CHANNELS.filter(c => c.regionGroup === r).length}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1rem" }}>{hero.flag}</span>
          <span className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{hero.name}</span>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{hero.focus}</span>
          <button
            onClick={() => setMuted(m => !m)}
            style={{
              background: "transparent", border: "1px solid var(--line-dim)",
              color: muted ? "var(--dim)" : "var(--braun-yellow, #ffd000)",
              fontFamily: "var(--font-mono)", fontSize: "0.5625rem",
              padding: "3px 8px", cursor: "pointer",
            }}
          >
            {muted ? "🔇 MUTED" : "🔊 SOUND"}
          </button>
        </div>
      </div>

      {/* Main: Hero left, channel grid right */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1.4fr 1fr", overflow: "hidden" }}>
        {/* LEFT — Hero player */}
        <div style={{ borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, position: "relative", background: "#000" }}>
            <iframe
              src={`https://www.youtube.com/embed/live_stream?channel=${hero.channelId}&autoplay=1&mute=${muted ? 1 : 0}&rel=0`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
          {/* Bottom strip under hero */}
          <div style={{
            padding: "6px 12px", borderTop: "1px solid var(--line-dim)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 6, height: 6, background: "var(--bear)", display: "inline-block",
              }} />
              <span className="t-micro" style={{ color: "var(--bull)" }}>● LIVE</span>
              <span className="t-micro" style={{ color: "var(--dim)" }}>{hero.lang}</span>
              <span className="t-micro" style={{ color: "var(--dim)" }}>{hero.regionGroup}</span>
            </div>
            <a
              href={hero.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="t-micro"
              style={{ color: "var(--tech)", textDecoration: "none" }}
            >
              WATCH ON YOUTUBE ↗
            </a>
          </div>
        </div>

        {/* RIGHT — Channel grid + Econ calendar */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          {/* Channel tiles */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 8px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from(grouped.entries()).map(([region, channels]) => (
                <div key={region}>
                  <div className="t-micro" style={{
                    color: GROUP_COLORS[region] ?? "var(--dim)",
                    letterSpacing: "0.14em", marginBottom: 4,
                    borderBottom: `1px solid ${GROUP_COLORS[region] ?? "var(--line-dim)"}`,
                    paddingBottom: 2,
                  }}>
                    {region}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {channels.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => setHeroId(ch.id)}
                        style={{
                          background: heroId === ch.id ? "var(--bg-surface)" : "var(--bg)",
                          border: `1px solid ${heroId === ch.id ? ch.color : "var(--line-dim)"}`,
                          padding: "5px 8px", cursor: "pointer", textAlign: "left",
                          display: "flex", flexDirection: "column", gap: 1,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: "0.8rem" }}>{ch.flag}</span>
                          <span className="t-mono" style={{
                            fontSize: "0.625rem", fontWeight: 700,
                            color: heroId === ch.id ? ch.color : "var(--ink)",
                          }}>
                            {ch.name}
                          </span>
                        </div>
                        <span className="t-micro" style={{ color: "var(--dim)", fontSize: "0.5rem" }}>
                          {ch.focus}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compact econ calendar */}
          <div style={{
            borderTop: "1px solid var(--line)", padding: "6px 8px", flexShrink: 0, maxHeight: 180, overflowY: "auto",
          }}>
            <EconCalendar compact />
          </div>
        </div>
      </div>
    </div>
  );
}
