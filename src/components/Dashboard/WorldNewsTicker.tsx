"use client";

import { useEffect, useState, useRef } from "react";

interface TickerItem {
  id: string;
  text: string;
  source: string;
  impact: "bull" | "bear" | "neutral";
  time: string;
}

interface TickerResponse {
  items: TickerItem[];
  source: string;
}

const IMPACT_COLOR: Record<string, string> = {
  bull: "var(--bull)",
  bear: "var(--bear)",
  neutral: "var(--muted)",
};

const REGION_FLAG: Record<string, string> = {
  Bloomberg: "🇺🇸", Reuters: "🌍", "WSJ": "🇺🇸", FT: "🇬🇧",
  Nikkei: "🇯🇵", "Bangkok Post": "🇹🇭", BOT: "🇹🇭",
  Finnhub: "📡", Marketaux: "📡",
};

export function WorldNewsTicker() {
  const [data, setData]       = useState<TickerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTicker = () => {
    fetch("/api/news-ticker")
      .then(r => r.json())
      .then((d: TickerResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTicker(); const id = setInterval(fetchTicker, 90_000); return () => clearInterval(id); }, []);

  // Scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !data?.items.length) return;
    let animationId: number;
    let pos = 0;

    function step() {
      if (!el) return;
      pos += 0.6;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0 && pos >= maxScroll) pos = 0;
      el.scrollLeft = pos;
      animationId = requestAnimationFrame(step);
    }
    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [data]);

  const items = data?.items ?? [];
  const displayItems = items.length > 0 ? [...items, ...items] : [];

  if (loading) {
    return (
      <div style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--line)", height: 32 }}>
        <div className="shimmer" style={{ height: "100%" }} />
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--bg-raised)",
      borderBottom: "1px solid var(--line)",
      overflow: "hidden",
      position: "relative",
    }}>
      <div
        ref={scrollRef}
        style={{
          display: "flex", gap: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          whiteSpace: "nowrap",
          padding: "6px 0",
        }}
      >
        {displayItems.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 14px",
              borderRight: "1px solid var(--line-dim)",
              flexShrink: 0,
            }}
          >
            <span className="t-micro" style={{
              color: IMPACT_COLOR[item.impact],
              fontWeight: 700,
              minWidth: 14,
              textAlign: "center",
            }}>
              {item.impact === "bull" ? "▲" : item.impact === "bear" ? "▼" : "●"}
            </span>
            <span className="t-micro">{REGION_FLAG[item.source] ?? "🌐"}</span>
            <span className="t-body" style={{ color: "var(--ink)" }}>
              {item.text}
            </span>
            <span className="t-micro" style={{ color: "var(--dim)" }}>
              {item.source} · {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
