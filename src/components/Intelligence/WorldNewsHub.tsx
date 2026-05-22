"use client";

/**
 * WorldNewsHub — multi-source global financial news wall.
 *
 * Sources: Finnhub + Marketaux + Bangkok Post + Krungthep Turakij +
 *          Manager Online + Al Jazeera + GDELT DOC 2.0 + State Dept advisory
 *
 * Features:
 *   • Filter by sector and language
 *   • Sentiment colour coding
 *   • Impact badges (HIGH/MEDIUM/LOW)
 *   • Affected SET tickers shown inline
 *   • Auto-refreshes every 5 minutes
 */

import { useEffect, useMemo, useState } from "react";

interface NewsItem {
  id:          string;
  source:      string;
  lang:        string;
  title:       string;
  summary?:    string;
  url:         string;
  publishedAt: string;
  sentiment?:  number;
  impact:      "high" | "medium" | "low";
  sectors:     string[];
  tags:        string[];
}

interface NewsResponse {
  items:   NewsItem[];
  total:   number;
  sources: number;
  as_of:   string;
}

const IMPACT_COLOR: Record<string, string> = {
  high:   "var(--bear)",
  medium: "var(--caution)",
  low:    "var(--dim)",
};

const LANG_FLAG: Record<string, string> = {
  EN: "🌐", TH: "🇹🇭", ZH: "🇨🇳", AR: "🇸🇦",
};

const ALL_SECTORS = ["ENERGY","AGRICULTURE","TOURISM","BANKING","INDUSTRIAL","PROPERTY","TECHNOLOGY","COMMODITIES","MACRO","THAI MARKET"];

function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (isNaN(diff) || diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "< 1m";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

function sentimentColor(s: number | undefined): string {
  if (s === undefined) return "var(--muted)";
  if (s > 0.1)  return "var(--bull)";
  if (s < -0.1) return "var(--bear)";
  return "var(--muted)";
}

function sentimentLabel(s: number | undefined): string {
  if (s === undefined) return "—";
  if (s > 0.3)  return "▲ bullish";
  if (s > 0.1)  return "▲ mild +";
  if (s < -0.3) return "▼ bearish";
  if (s < -0.1) return "▼ mild −";
  return "● neutral";
}

export function WorldNewsHub() {
  const [data, setData]       = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sector, setSector]   = useState<string>("ALL");
  const [lang, setLang]       = useState<string>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchNews = () => {
    const params = new URLSearchParams();
    if (sector !== "ALL") params.set("sector", sector);
    if (lang   !== "ALL") params.set("lang",   lang);
    fetch(`/api/world-news?${params}`)
      .then(r => r.json())
      .then((d: NewsResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchNews(); const id = setInterval(fetchNews, 300_000); return () => clearInterval(id); }, [sector, lang]);

  const items = useMemo(() => data?.items ?? [], [data]);

  const highImpact = items.filter(i => i.impact === "high");
  const positive   = items.filter(i => (i.sentiment ?? 0) > 0.1).length;
  const negative   = items.filter(i => (i.sentiment ?? 0) < -0.1).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="t-body" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            World Financial Intelligence
          </div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
            {data?.sources ?? "—"} sources · {items.length} items · {positive} bullish · {negative} bearish · refreshes 5 min
          </div>
        </div>
        {data?.as_of && (
          <span className="t-micro" style={{ color: "var(--dim)" }}>
            {new Date(data.as_of).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC+7
          </span>
        )}
      </div>

      {/* HIGH IMPACT strip */}
      {highImpact.length > 0 && (
        <div style={{ background: "var(--bear-10)", border: "1px solid var(--bear)", padding: "8px 12px" }}>
          <div className="t-micro" style={{ color: "var(--bear)", letterSpacing: "0.14em", marginBottom: 6 }}>
            ● HIGH IMPACT — {highImpact.length} items
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {highImpact.slice(0, 3).map(i => (
              <a key={i.id} href={i.url} target="_blank" rel="noopener noreferrer"
                 style={{ color: "var(--ink)", textDecoration: "none", fontSize: "0.8125rem", lineHeight: 1.4 }}>
                <span style={{ color: "var(--bear)", marginRight: 6 }}>▶</span>{i.title}
                <span className="t-micro" style={{ color: "var(--muted)", marginLeft: 8 }}>{i.source} · {timeAgo(i.publishedAt)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {/* Lang filter */}
        {["ALL","EN","TH","ZH"].map(l => (
          <button key={l} onClick={() => setLang(l)}
            style={{
              background:  lang === l ? "var(--tech-10)" : "transparent",
              border:      `1px solid ${lang === l ? "var(--tech)" : "var(--line)"}`,
              color:       lang === l ? "var(--tech)" : "var(--muted)",
              fontFamily:  "var(--font-mono)", fontSize: "0.625rem",
              fontWeight:  700, letterSpacing: "0.1em",
              padding:     "4px 10px", cursor: "pointer", minHeight: 28,
            }}
          >
            {LANG_FLAG[l] ?? ""} {l}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: "var(--line)", margin: "0 4px" }} />
        {/* Sector filter */}
        <div className="scroll-row" style={{ flex: 1, paddingBottom: 0 }}>
          {["ALL", ...ALL_SECTORS].map(s => (
            <button key={s} onClick={() => setSector(s)}
              style={{
                background:  sector === s ? "var(--bull-10)" : "transparent",
                border:      `1px solid ${sector === s ? "var(--bull)" : "var(--line)"}`,
                color:       sector === s ? "var(--bull)" : "var(--muted)",
                fontFamily:  "var(--font-mono)", fontSize: "0.5625rem",
                fontWeight:  700, letterSpacing: "0.08em",
                padding:     "4px 8px", cursor: "pointer", minHeight: 28,
                whiteSpace:  "nowrap",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* News list */}
      {loading ? (
        <div>{[0,1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 60, marginBottom: 6 }} />)}</div>
      ) : items.length === 0 ? (
        <div className="t-micro" style={{ color: "var(--dim)", padding: "20px 0", textAlign: "center" }}>
          No items — API keys not configured. Add FINNHUB_API_KEY and MARKETAUX_API_KEY to Cloudflare Pages env.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.slice(0, 60).map(item => {
            const isOpen = expanded === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background:  "var(--bg-surface)",
                  border:      `1px solid var(--line)`,
                  borderLeft:  `3px solid ${IMPACT_COLOR[item.impact]}`,
                  cursor:      "pointer",
                }}
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, padding: "8px 12px", alignItems: "start" }}>
                  {/* Impact + lang */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 40 }}>
                    <span className="t-mono" style={{ fontSize: "0.5rem", color: IMPACT_COLOR[item.impact], letterSpacing: "0.1em" }}>
                      {item.impact.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.8rem" }}>{LANG_FLAG[item.lang] ?? "🌐"}</span>
                  </div>
                  {/* Title + meta */}
                  <div>
                    <div className="t-body" style={{ fontSize: "0.8125rem", lineHeight: 1.4, color: "var(--ink)" }}>
                      {item.title}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <span className="t-micro" style={{ color: "var(--dim)" }}>{item.source}</span>
                      <span className="t-micro" style={{ color: "var(--dim)" }}>{timeAgo(item.publishedAt)}</span>
                      {item.sectors.slice(0, 2).map(s => (
                        <span key={s} className="t-mono" style={{ fontSize: "0.5rem", color: "var(--muted)", border: "1px solid var(--line)", padding: "0 4px", letterSpacing: "0.06em" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Sentiment */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="t-mono" style={{ fontSize: "0.6875rem", color: sentimentColor(item.sentiment), fontWeight: 700 }}>
                      {sentimentLabel(item.sentiment)}
                    </div>
                  </div>
                </div>
                {/* Expanded: summary + tags + link */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--line)", padding: "8px 12px", background: "var(--bg-raised)" }}>
                    {item.summary && (
                      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>
                        {item.summary}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {item.tags.slice(0, 6).map(t => (
                          <span key={t} className="t-micro" style={{ color: "var(--dim)", border: "1px solid var(--line)", padding: "1px 5px", fontSize: "0.5rem" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                         style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 700, color: "var(--tech)", border: "1px solid var(--tech)", padding: "3px 10px", textDecoration: "none" }}
                         onClick={e => e.stopPropagation()}>
                        READ ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
