"use client";

import forwardData from "@/lib/data/cache/forward-view.json";

/* ══════════════════════════════════════════════════════════════════════════════
   ForwardView — the forecast capacity applied to every portfolio driver.
   Reads forward-view.json (ingestion/forward_view.py): a 90-day forward cone
   per proxy — median path + 10/90 band. Baseline is a transparent drift+vol
   cone; upgrades to TimesFM when run in the M3 venv. The JSON records which.
   ══════════════════════════════════════════════════════════════════════════════ */

interface Series {
  ticker: string; label: string; spot: number;
  expRet: number; annVol: number;
  path: number[]; bandLo: number[]; bandHi: number[]; model: string;
}
interface ForwardData { generatedAt: string; model: string; horizonDays: number; series: Series[] }

const F = forwardData as ForwardData;

function Cone({ s }: { s: Series }) {
  const W = 132, H = 40, n = s.path.length;
  const all = [...s.bandLo, ...s.bandHi, s.spot];
  const min = Math.min(...all), max = Math.max(...all), rng = max - min || 1;
  const x = (i: number) => (i / (n - 1)) * (W - 2) + 1;
  const y = (v: number) => H - 2 - ((v - min) / rng) * (H - 4);
  const up = s.expRet >= 0;
  const col = up ? "var(--bull)" : "var(--bear)";
  const band =
    s.bandHi.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") +
    " " + [...s.bandLo].reverse().map((v, i) => `L ${x(n - 1 - i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") + " Z";
  const med = s.path.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, display: "block", flexShrink: 0 }} aria-hidden>
      <path d={band} fill={col} fillOpacity={0.12} stroke="none" />
      <line x1={1} y1={y(s.spot)} x2={W - 1} y2={y(s.spot)} stroke="var(--line)" strokeDasharray="3 2" strokeWidth={1} />
      <path d={med} fill="none" stroke={col} strokeWidth={1.5} />
    </svg>
  );
}

export function ForwardView() {
  return (
    <section style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", marginTop: 16 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", letterSpacing: "0.16em", fontWeight: 700 }}>AI FORWARD VIEW</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginLeft: 10 }}>· {F.horizonDays}-day cone for every portfolio driver</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>{F.model} · {F.generatedAt}</span>
      </div>
      <div style={{ padding: "8px 16px 14px" }}>
        {F.series.map((s) => {
          const up = s.expRet >= 0;
          return (
            <div key={s.ticker} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <div style={{ minWidth: 96, flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>{s.ticker}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>{s.label}</div>
              </div>
              <Cone s={s} />
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: up ? "var(--bull)" : "var(--bear)" }}>
                  {up ? "+" : ""}{(s.expRet * 100).toFixed(1)}%
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>vol {(s.annVol * 100).toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0 16px 14px", fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.6 }}>
        Each cone is a {F.horizonDays}-day forward distribution for the index that drives a Dream-Portfolio holding — median path + 10/90 band. Baseline is a transparent drift+volatility cone; run <code style={{ fontFamily: "var(--font-mono)" }}>ingestion/forward_view.py</code> in the M3 TimesFM venv to swap in the learned model. Expected ranges, not promises — not investment advice.
      </div>
    </section>
  );
}
