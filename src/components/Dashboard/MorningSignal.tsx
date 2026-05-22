"use client";

import { useState, useEffect } from "react";
import { SignalCard } from "@/components/Share/SignalCard";
import type { ForecastApiResponse } from "@/app/api/forecast/route";

interface MorningBrief {
  text: string;
  generatedAt: string;
}

const STORAGE_KEY = "siam_morning_brief";
const TTL = 4 * 60 * 60 * 1000; // 4 hours
const FORECAST_TTL = 60 * 60 * 1000; // 1 hour — daily model, no need to refetch often
const FORECAST_KEY = "siam_morning_forecast";

export function MorningSignal() {
  const [brief, setBrief]     = useState<MorningBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [forecast, setForecast] = useState<ForecastApiResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Load cached brief on mount
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as MorningBrief;
      if (Date.now() - new Date(parsed.generatedAt).getTime() < TTL) {
        setBrief(parsed);
        return;
      }
    }
    // Auto-fetch if near market open (9:30–10:30 Bangkok time)
    const bangkokHour = new Date().toLocaleTimeString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" });
    const h = parseInt(bangkokHour);
    if (h === 9 || h === 10) fetchBrief();
  }, []);

  // Load forecast lazily — only when the panel opens.
  useEffect(() => {
    if (!open || forecast || forecastLoading) return;
    const cached = localStorage.getItem(FORECAST_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ForecastApiResponse;
        if (Date.now() - new Date(parsed.asOf).getTime() < FORECAST_TTL) {
          setForecast(parsed);
          return;
        }
      } catch {}
    }
    fetchForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchForecast() {
    setForecastLoading(true);
    try {
      const res = await fetch("/api/forecast?symbol=%5ESET.BK&horizon=5");
      if (!res.ok) throw new Error("forecast api");
      const data = (await res.json()) as ForecastApiResponse;
      setForecast(data);
      localStorage.setItem(FORECAST_KEY, JSON.stringify(data));
    } catch {
      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  }

  async function fetchBrief() {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Write the morning market note for Thai investors. What happened overnight and what should I watch in SET today?",
          skill: "morning_note",
        }),
      });
      if (!res.ok) throw new Error("API error");

      let text = "";
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
      }

      const newBrief: MorningBrief = { text, generatedAt: new Date().toISOString() };
      setBrief(newBrief);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBrief));
    } catch {
      // No API key — show a static signal
      setBrief({
        text: "AI analysis requires ANTHROPIC_API_KEY. Add it to .env.local to enable the morning brief.",
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  // Extract the first 1–2 sentences as a headline
  const headline = brief?.text
    ? brief.text.split(/[.\n]/)[0].slice(0, 120).trim() + "."
    : null;

  return (
    <div style={{
      background: "var(--bg-raised)",
      border: "1px solid var(--line)",
      borderLeft: "3px solid var(--caution)",
    }}>
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          width: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          gap: 12,
          minHeight: 52,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--caution)", fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0 }}>
            ☀ MORNING
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="t-micro" style={{ color: "var(--dim)" }}>Generating brief...</div>
            ) : headline ? (
              <div className="t-body" style={{ color: "var(--ink)", fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {headline}
              </div>
            ) : (
              <div className="t-micro" style={{ color: "var(--dim)" }}>
                {new Date().getHours() >= 9 && new Date().getHours() <= 10 ? "Generating morning brief..." : "Tap to get market brief"}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {!brief && !loading && (
            <span
              onClick={(e) => { e.stopPropagation(); fetchBrief(); }}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                color: "var(--caution)", fontWeight: 700,
                border: "1px solid var(--caution)",
                padding: "2px 8px", cursor: "pointer",
                letterSpacing: "0.06em",
              }}
            >
              GENERATE
            </span>
          )}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--dim)" }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Expanded — brief (if generated) + always-on probabilistic projection */}
      {open && (
        <div style={{ borderTop: "1px solid var(--line)", padding: "14px 16px" }}>
          {brief && (
            <div className="t-body" style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
              fontSize: "0.8125rem",
              color: "var(--muted)",
            }}>
              {brief.text}
            </div>
          )}

          <ForecastBlock forecast={forecast} loading={forecastLoading} onRefresh={fetchForecast} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <div className="t-micro" style={{ color: "var(--dim)" }}>
              {brief
                ? `${new Date(brief.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" })} BKK · Powered by Claude`
                : "Generate AI brief above — projection runs independently"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {brief && (
                <button
                  onClick={fetchBrief}
                  style={{
                    background: "none", border: "1px solid var(--line)",
                    color: "var(--dim)", fontFamily: "var(--font-mono)",
                    fontSize: "0.55rem", padding: "3px 8px",
                    cursor: "pointer", minHeight: 24, letterSpacing: "0.06em",
                  }}
                >
                  REFRESH
                </button>
              )}
              {brief && (
                <SignalCard
                  title="Morning Market Brief"
                  value={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  subtext="Bangkok 09:55 · SET Opens 10:00"
                  implication={headline ?? ""}
                  color="var(--caution)"
                  source="DAYTRADERS AI"
                  metric="MORNING"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Probabilistic projection (TimesFM) ──────────────────────────────
// Renders median + 80% band + P(touch) — never a directional verb.
// If forecast is null or loading, fail quiet — the brief still reads fine.

function ForecastBlock({
  forecast,
  loading,
  onRefresh,
}: {
  forecast: ForecastApiResponse | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !forecast) {
    return (
      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)",
        fontFamily: "var(--font-mono)", fontSize: "0.6rem",
        color: "var(--dim)", letterSpacing: "0.06em",
      }}>
        LOADING PROBABILISTIC PROJECTION…
      </div>
    );
  }
  if (!forecast) return null;

  const f       = forecast.forecast;
  const last    = f.horizon - 1;
  const median  = f.median[last];
  const p10     = f.quantiles.p10[last];
  const p90     = f.quantiles.p90[last];
  const stub    = f.source === "stub";

  const pAbove1 = forecast.probabilities.above1pct;
  const pBelow1 = forecast.probabilities.below1pct;

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const pct = (p: number) => `${Math.round(p * 100)}%`;

  return (
    <div style={{
      marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "0.55rem",
          color: "var(--tech)", fontWeight: 700, letterSpacing: "0.08em",
          border: "1px solid var(--tech)", padding: "2px 6px",
        }}>
          {stub ? "BASELINE" : "TIMESFM"}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "0.55rem",
          color: "var(--muted)", letterSpacing: "0.06em",
        }}>
          SET · {f.horizon}-DAY PROBABILISTIC PROJECTION
        </span>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1,
        background: "var(--line)", border: "1px solid var(--line)",
      }}>
        <ProjectionCell
          label="MEDIAN T+5"
          value={fmt(median)}
          accent="var(--ink)"
        />
        <ProjectionCell
          label="80% BAND"
          value={`${fmt(p10)} – ${fmt(p90)}`}
          accent="var(--muted)"
        />
        <ProjectionCell
          label={`P(TOUCH > ${fmt(forecast.lastClose * 1.01)})`}
          value={pct(pAbove1)}
          accent="var(--bull)"
        />
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
        background: "var(--line)", border: "1px solid var(--line)",
      }}>
        <ProjectionCell
          label="LAST CLOSE"
          value={fmt(forecast.lastClose)}
          accent="var(--muted)"
        />
        <ProjectionCell
          label={`P(BREAK < ${fmt(forecast.lastClose * 0.99)})`}
          value={pct(pBelow1)}
          accent="var(--bear)"
        />
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: "var(--font-mono)", fontSize: "0.55rem",
        color: "var(--dim)", letterSpacing: "0.06em",
      }}>
        <span>
          {stub
            ? "STUB BACKEND · NAIVE LAST-VALUE BASELINE · ADD HUGGINGFACE_API_TOKEN FOR TIMESFM"
            : `MODEL: ${f.model.toUpperCase()} · PROBABILISTIC CONTEXT, NOT A TRADE SIGNAL`}
        </span>
        <button
          onClick={onRefresh}
          style={{
            background: "none", border: "1px solid var(--line)",
            color: "var(--dim)", fontFamily: "var(--font-mono)",
            fontSize: "0.55rem", padding: "3px 8px",
            cursor: "pointer", minHeight: 24, letterSpacing: "0.06em",
          }}
        >
          REFRESH
        </button>
      </div>
    </div>
  );
}

function ProjectionCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      background: "var(--bg-raised)", padding: "8px 10px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div className="t-micro" style={{
        fontFamily: "var(--font-mono)", fontSize: "0.55rem",
        color: "var(--dim)", letterSpacing: "0.06em",
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.875rem",
        color: accent, fontWeight: 600,
      }}>
        {value}
      </div>
    </div>
  );
}
