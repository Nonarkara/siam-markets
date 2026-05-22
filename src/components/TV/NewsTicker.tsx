"use client";

/**
 * Trilingual news ticker — EN / TH / ZH.
 *
 * Three column-marquees scrolling vertically at different paces, each pulling
 * from `/api/news-feed` and filtered by language. Click any headline to open
 * the source in a new tab.
 *
 * Heritage: airport flip-board × Braun grotesque labels. Hairline borders,
 * mono timestamps, no rounding, no glow.
 */

import { useEffect, useMemo, useState } from "react";
import type { NewsItem } from "@/app/api/news-feed/route";

const LANG_META: Record<NewsItem["lang"], { label: string; flag: string }> = {
  EN: { label: "English",     flag: "🌐" },
  TH: { label: "ภาษาไทย",     flag: "🇹🇭" },
  ZH: { label: "中文",         flag: "🇨🇳" },
};

function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (!t) return "—";
  const diffMin = Math.max(0, Math.round((Date.now() - t) / 60_000));
  if (diffMin < 1)   return "now";
  if (diffMin < 60)  return `${diffMin}m`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h`;
  return `${Math.round(diffMin / 1440)}d`;
}

function Column({ lang, items }: { lang: NewsItem["lang"]; items: NewsItem[] }) {
  const meta = LANG_META[lang];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-surface)",
        border: "1px solid var(--line)",
        minHeight: 360,
        height: 480,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "var(--bg-raised)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>{meta.flag}</span>
        <span className="t-body" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{meta.label}</span>
        <span className="t-micro" style={{ color: "var(--muted)", marginLeft: "auto" }}>
          {items.length} ITEMS
        </span>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {items.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center" }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>NO ITEMS</span>
          </div>
        ) : (
          items.map((it, i) => (
            <a
              key={it.id}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "10px 12px",
                borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none",
                textDecoration: "none",
                color: "inherit",
                transition: "background 160ms",
                lineHeight: 1.4,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <span
                  className="t-micro"
                  style={{
                    color: "var(--tech)",
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                  }}
                >
                  {it.topic}
                </span>
                <span
                  className="t-mono"
                  style={{ fontSize: "0.625rem", color: "var(--muted)", flexShrink: 0 }}
                >
                  {timeAgo(it.publishedAt)}
                </span>
              </div>
              <div
                className="t-body"
                style={{ fontSize: "0.8125rem", color: "var(--ink)", lineHeight: 1.35 }}
              >
                {it.title}
              </div>
              {it.source && (
                <div className="t-micro" style={{ color: "var(--dim)", marginTop: 4 }}>
                  {it.source}
                </div>
              )}
            </a>
          ))
        )}
      </div>
    </div>
  );
}

export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news-feed")
      .then(r => r.json())
      .then((data: NewsItem[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const en = useMemo(() => items.filter(i => i.lang === "EN").slice(0, 20), [items]);
  const th = useMemo(() => items.filter(i => i.lang === "TH").slice(0, 20), [items]);
  const zh = useMemo(() => items.filter(i => i.lang === "ZH").slice(0, 20), [items]);

  if (loading) {
    return (
      <div className="news-grid">
        {[0, 1, 2].map(i => (
          <div key={i} className="shimmer" style={{ minHeight: 360, height: 480, border: "1px solid var(--line)" }} />
        ))}
        <style>{`
          .news-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
          @media (min-width: 768px) { .news-grid { grid-template-columns: repeat(3, 1fr); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="news-grid">
        <Column lang="EN" items={en} />
        <Column lang="TH" items={th} />
        <Column lang="ZH" items={zh} />
      </div>
      <style>{`
        .news-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
        @media (min-width: 768px) { .news-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </>
  );
}
