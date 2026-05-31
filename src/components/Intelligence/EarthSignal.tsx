"use client";

import earthData from "@/lib/data/cache/earth-signal.json";

/* ══════════════════════════════════════════════════════════════════════════════
   EarthSignal — AlphaEarth (DeepMind Satellite Embedding) as investment
   alt-data. Each Thai economic site maps to SET tickers; the year-over-year
   embedding shift is a physical-activity signal that precedes the financial
   print. Populated by ingestion/alphaearth.py once Earth Engine is authed —
   until then it honestly shows the watchlist + method, never fake numbers.
   ══════════════════════════════════════════════════════════════════════════════ */

interface AOI {
  id: string; name: string; lat: number; lon: number;
  tickers: string[]; theme: string; measures: string;
  changeYoY: number | null; trend: "up" | "flat" | "down" | null;
}
interface EarthData {
  generatedAt: string | null; status: string; dataset: string;
  model: string; method: string; aois: AOI[]; yearsCompared?: number[];
}

const E = earthData as EarthData;

const THEME_COLOR: Record<string, string> = {
  Tourism: "var(--bull)", Energy: "var(--caution)", Industrial: "var(--tech)",
  Exports: "var(--bear)", Agri: "var(--muted)",
};

export function EarthSignal() {
  const live = E.status === "live";
  return (
    <section style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", marginTop: 16 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", letterSpacing: "0.16em", fontWeight: 700 }}>EARTH SIGNAL</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginLeft: 10 }}>· {E.model} → SET tickers</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: live ? "var(--bull)" : "var(--dim)" }}>
          {live ? `LIVE · ${E.yearsCompared?.join("→")} · ${E.generatedAt}` : "○ AWAITING EARTH ENGINE PULL"}
        </span>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 14px" }}>
          {E.method}
        </p>

        {E.aois.map((a) => (
          <div key={a.id} style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>{a.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: THEME_COLOR[a.theme] ?? "var(--dim)", letterSpacing: "0.06em" }}>{a.theme}</span>
              </div>
              {live && a.changeYoY !== null ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div style={{ width: 60, height: 6, background: "var(--bg)" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, a.changeYoY * 100)}%`, background: THEME_COLOR[a.theme] ?? "var(--muted)", opacity: 0.7 }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: a.trend === "up" ? "var(--bull)" : a.trend === "down" ? "var(--bear)" : "var(--muted)" }}>
                    {a.trend === "up" ? "▲" : a.trend === "down" ? "▼" : "■"} {(a.changeYoY * 100).toFixed(0)}
                  </span>
                </div>
              ) : (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", flexShrink: 0 }}>—</span>
              )}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5, marginTop: 4 }}>
              {a.measures}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 3 }}>
              → {a.tickers.join(" · ")}
            </div>
          </div>
        ))}
      </div>

      {!live && (
        <div style={{ padding: "0 16px 14px", fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.6 }}>
          Dataset <code style={{ fontFamily: "var(--font-mono)" }}>{E.dataset}</code>. To populate the change metrics: <code style={{ fontFamily: "var(--font-mono)" }}>pip install earthengine-api</code>, <code style={{ fontFamily: "var(--font-mono)" }}>earthengine authenticate</code>, then run <code style={{ fontFamily: "var(--font-mono)" }}>ingestion/alphaearth.py</code> on the M3. No numbers are shown until real embeddings are pulled — never fabricated.
        </div>
      )}
    </section>
  );
}
