"use client";

import { useState, useEffect } from "react";
import { SignalCard } from "@/components/Share/SignalCard";

interface MorningBrief {
  text: string;
  generatedAt: string;
}

const STORAGE_KEY = "siam_morning_brief";
const TTL = 4 * 60 * 60 * 1000; // 4 hours

export function MorningSignal() {
  const [brief, setBrief]     = useState<MorningBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

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

      {/* Expanded — full brief */}
      {open && brief && (
        <div style={{ borderTop: "1px solid var(--line)", padding: "14px 16px" }}>
          <div className="t-body" style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
            fontSize: "0.8125rem",
            color: "var(--muted)",
          }}>
            {brief.text}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <div className="t-micro" style={{ color: "var(--dim)" }}>
              {new Date(brief.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" })} BKK · Powered by Claude
            </div>
            <div style={{ display: "flex", gap: 6 }}>
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
              <SignalCard
                title="Morning Market Brief"
                value={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                subtext="Bangkok 09:55 · SET Opens 10:00"
                implication={headline ?? ""}
                color="var(--caution)"
                source="DAYTRADERS AI"
                metric="MORNING"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
