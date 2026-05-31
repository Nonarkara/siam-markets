"use client";

import { useMemo } from "react";
import { REAL_HOLDINGS, allocationByTheme } from "@/lib/portfolio-data";
import forwardData from "@/lib/data/cache/forward-view.json";

/* ══════════════════════════════════════════════════════════════════════════════
   PositionForward — "Are you positioned for what's coming?"
   Joins your real book (theme weights) with the TimesFM/forward-view forecast
   for each theme's driver. One read: where your money sits × where the model
   says that bucket is heading. Desktop-only DESK strip (graphically revealing
   comparison the phone can't fit).
   ══════════════════════════════════════════════════════════════════════════════ */

interface FwdSeries { ticker: string; expRet: number }
const FWD = forwardData as { generatedAt: string; model: string; series: FwdSeries[] };
const FWD_RET = new Map(FWD.series.map(s => [s.ticker, s.expRet]));

// theme → representative forward proxy
const THEME_PROXY: Record<string, string> = {
  Semiconductor: "SOXX", Crypto: "BITQ", "US tech": "QQQ", China: "MCHI",
  Vietnam: "VNM", "Thai equity": "^SET.BK", Japan: "EWJ", India: "INDA",
  Gold: "GLD", "Global equity": "ACWI",
};

export function PositionForward() {
  const rows = useMemo(() => {
    const themes = allocationByTheme(REAL_HOLDINGS);
    return themes
      .map(t => {
        const proxy = THEME_PROXY[t.label];
        const fwd = proxy ? FWD_RET.get(proxy) : undefined;
        return { label: t.label, pct: t.pct, fwd: fwd ?? null };
      })
      .sort((a, b) => b.pct - a.pct);
  }, []);

  // Forward-implied 90d read on the current mix (weighted over covered themes).
  const { implied, alignedPct } = useMemo(() => {
    let wSum = 0, fSum = 0, aligned = 0;
    for (const r of rows) {
      if (r.fwd === null) continue;
      wSum += r.pct;
      fSum += r.pct * r.fwd;
      if (r.fwd > 0) aligned += r.pct;
    }
    return { implied: wSum ? fSum / wSum : 0, alignedPct: wSum ? (aligned / wSum) * 100 : 0 };
  }, [rows]);

  function verdict(pct: number, fwd: number | null): { tag: string; col: string } | null {
    if (fwd === null) return null;
    if (pct >= 12 && fwd >= 0.05) return { tag: "POSITIONED", col: "var(--bull)" };
    if (pct >= 12 && fwd < 0)     return { tag: "EXPOSED",    col: "var(--bear)" };
    if (pct < 8  && fwd >= 0.10)  return { tag: "LIGHT",      col: "var(--caution)" };
    return null;
  }

  return (
    <section className="desk-forward-strip" style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Headline */}
        <div style={{ padding: "12px 18px", borderRight: "1px solid var(--line)", minWidth: 230, flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", letterSpacing: "0.14em", fontWeight: 700 }}>
            ARE YOU POSITIONED?
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: implied >= 0 ? "var(--bull)" : "var(--bear)", lineHeight: 1, marginTop: 8 }}>
            {implied >= 0 ? "+" : ""}{(implied * 100).toFixed(1)}%
          </div>
          <div className="t-micro" style={{ color: "var(--dim)", marginTop: 4, textTransform: "none", letterSpacing: 0 }}>
            forward-implied 90d read on your mix · {alignedPct.toFixed(0)}% in themes the model likes
          </div>
        </div>

        {/* Theme comparison cards */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 0, minWidth: 0 }}>
          {rows.map((r, i) => {
            const v = verdict(r.pct, r.fwd);
            return (
              <div key={r.label} style={{ padding: "10px 12px", borderRight: i < rows.length - 1 ? "1px solid var(--line)" : "none", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>{r.pct.toFixed(0)}%</span>
                  {r.fwd !== null && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: r.fwd >= 0 ? "var(--bull)" : "var(--bear)" }}>
                      {r.fwd >= 0 ? "▲" : "▼"}{Math.abs(r.fwd * 100).toFixed(0)}
                    </span>
                  )}
                </div>
                {/* weight bar */}
                <div style={{ height: 4, background: "var(--bg)" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, r.pct * 3.5)}%`, background: "var(--tech)", opacity: 0.6 }} />
                </div>
                {v ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.06em", color: v.col }}>{v.tag}</span>
                ) : <span style={{ fontSize: "0.5rem", color: "transparent" }}>·</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="t-micro" style={{ color: "var(--dim)", padding: "0 18px 8px", textTransform: "none", letterSpacing: 0 }}>
        your book weight % × {FWD.model} 90-day forward per theme driver · {FWD.generatedAt} · not advice
      </div>
    </section>
  );
}
