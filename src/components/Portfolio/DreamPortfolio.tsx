"use client";

import { useState, useMemo } from "react";
import {
  REAL_HOLDINGS, REAL_PORTFOLIO_AS_OF,
  HOLDINGS, PORTFOLIO_AS_OF,
  computeSummary, allocationByTheme,
  type FundHolding,
} from "@/lib/portfolio-data";
import forwardData from "@/lib/data/cache/forward-view.json";

/* ══════════════════════════════════════════════════════════════════════════════
   DreamPortfolio — two books, side by side, with per-fund deep-dive.
   • EXAMPLE 1 · MINE  — the real held fund book (Fund SuperMart statement).
   • DREAM · IDEAL     — the hindsight long-term allocation.
   Hover (desktop) or tap (mobile) any fund on the ladder → it expands to show
   what happened over the past 6 months + the 90-day forward cone for the index
   that drives it, plus the thesis. Forecast data: forward-view.json.
   ══════════════════════════════════════════════════════════════════════════════ */

interface FwdSeries {
  ticker: string; label: string; spot: number; expRet: number; ret6m: number;
  annVol: number; histPath: number[]; path: number[]; bandLo: number[]; bandHi: number[];
}
const FWD = forwardData as { generatedAt: string; model: string; horizonDays: number; series: FwdSeries[] };
const FWD_MAP = new Map(FWD.series.map(s => [s.ticker, s]));

const PORTFOLIOS = {
  real:  { label: "EXAMPLE 1 · MINE", holdings: REAL_HOLDINGS, asOf: REAL_PORTFOLIO_AS_OF },
  dream: { label: "DREAM · IDEAL",    holdings: HOLDINGS,      asOf: PORTFOLIO_AS_OF },
} as const;
type Which = keyof typeof PORTFOLIOS;

function fmtB(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000)     return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${Math.round(v).toLocaleString()}`;
}

// Combined past (solid) + forward (dashed + band) mini-chart.
function PastForwardChart({ fwd }: { fwd: FwdSeries }) {
  const W = 280, H = 76, n = fwd.histPath.length, m = fwd.path.length, total = n + m - 1;
  const all = [...fwd.histPath, ...fwd.bandLo, ...fwd.bandHi];
  const min = Math.min(...all), max = Math.max(...all), rng = max - min || 1;
  const x = (idx: number) => (idx / total) * (W - 2) + 1;
  const y = (v: number) => H - 3 - ((v - min) / rng) * (H - 6);
  const up = fwd.expRet >= 0;
  const col = up ? "var(--bull)" : "var(--bear)";
  const nowIdx = n - 1;

  const histLine = fwd.histPath.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const futLine  = fwd.path.map((v, i) => `${i === 0 ? "M" : "L"} ${x(nowIdx + i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const band =
    fwd.bandHi.map((v, i) => `${i === 0 ? "M" : "L"} ${x(nowIdx + i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") +
    " " + [...fwd.bandLo].reverse().map((v, i) => `L ${x(nowIdx + m - 1 - i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} aria-hidden>
      <path d={band} fill={col} fillOpacity={0.12} stroke="none" />
      <line x1={x(nowIdx)} y1={2} x2={x(nowIdx)} y2={H - 2} stroke="var(--line)" strokeWidth={1} />
      <path d={histLine} fill="none" stroke="var(--ink)" strokeWidth={1.5} opacity={0.85} />
      <path d={futLine}  fill="none" stroke={col} strokeWidth={1.5} strokeDasharray="3 2" />
      <text x={4} y={11} fill="var(--dim)" fontSize="8" fontFamily="var(--font-mono)">6 MONTHS AGO</text>
      <text x={W - 4} y={11} fill={col} fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">+90D</text>
    </svg>
  );
}

export function DreamPortfolio() {
  const [which, setWhich] = useState<Which>("real");
  const [open, setOpen] = useState<string | null>(null);
  const P = PORTFOLIOS[which];

  const summary = useMemo(() => computeSummary(P.holdings), [P]);
  const themes  = useMemo(() => allocationByTheme(P.holdings), [P]);
  const sorted  = useMemo(() => [...P.holdings].sort((a, b) => b.gainLossPct - a.gainLossPct), [P]);
  const maxAbs  = useMemo(() => Math.max(...P.holdings.map(h => Math.abs(h.gainLossPct)), 1), [P]);
  const themeMax = Math.max(...themes.map(t => t.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

      {/* Portfolio toggle */}
      <div style={{ display: "flex", border: "1px solid var(--line)" }}>
        {(Object.keys(PORTFOLIOS) as Which[]).map((k, i) => (
          <button key={k} onClick={() => { setWhich(k); setOpen(null); }} style={{
            flex: 1, padding: "12px 8px", minHeight: 44,
            background: which === k ? "var(--bg-hover)" : "transparent",
            border: "none", borderRight: i === 0 ? "1px solid var(--line)" : "none",
            color: which === k ? "var(--caution)" : "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
            letterSpacing: "0.08em", fontWeight: which === k ? 700 : 400, cursor: "pointer",
          }}>{PORTFOLIOS[k].label}</button>
        ))}
      </div>

      {/* KPI summary */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
          <Kpi label="INVESTED"  value={fmtB(summary.totalCost)}  col="var(--muted)" />
          <Kpi label="VALUE NOW" value={fmtB(summary.totalValue)} col="var(--ink)" />
          <Kpi label="GAIN"      value={`${summary.totalGain >= 0 ? "+" : ""}${fmtB(summary.totalGain)}`} col={summary.totalGain >= 0 ? "var(--bull)" : "var(--bear)"} />
          <Kpi label="RETURN"    value={`${summary.totalGainPct >= 0 ? "+" : ""}${summary.totalGainPct.toFixed(2)}%`} col={summary.totalGainPct >= 0 ? "var(--bull)" : "var(--bear)"} />
        </div>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 12, textTransform: "none", letterSpacing: 0 }}>
          {summary.count} funds · as of {P.asOf} · best {summary.bestPerformer.code} +{summary.bestPerformer.gainLossPct.toFixed(0)}% · worst {summary.worstPerformer.code} {summary.worstPerformer.gainLossPct.toFixed(0)}%
        </div>
      </div>

      {/* Performance ladder — hover/tap any fund to expand */}
      <div className="card" style={{ padding: 16 }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 14 }}>
          PERFORMANCE LADDER · hover or tap a fund for its 6-month past + 90-day forward
        </div>
        {sorted.map(h => {
          const pos = h.gainLossPct >= 0;
          const w = (Math.abs(h.gainLossPct) / maxAbs) * 50;
          const isOpen = open === h.code;
          const fwd = h.proxy ? FWD_MAP.get(h.proxy) : undefined;
          return (
            <div key={h.code} style={{ borderTop: "1px solid var(--line)" }}>
              <div
                onMouseEnter={() => setOpen(h.code)}
                onClick={() => setOpen(isOpen ? null : h.code)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 0", cursor: "pointer",
                  background: isOpen ? "var(--bg-hover)" : "transparent",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: isOpen ? "var(--caution)" : "var(--ink)", width: 118, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.code}</div>
                <div style={{ flex: 1, height: 14, background: "var(--bg)", position: "relative", display: "flex" }}>
                  <div style={{ width: "50%", height: "100%", display: "flex", justifyContent: "flex-end" }}>
                    {!pos && <div style={{ width: `${w * 2}%`, height: "100%", background: "var(--bear)", opacity: 0.7 }} />}
                  </div>
                  <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--line)" }} />
                  <div style={{ width: "50%", height: "100%" }}>
                    {pos && <div style={{ width: `${w * 2}%`, height: "100%", background: "var(--bull)", opacity: 0.7 }} />}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: pos ? "var(--bull)" : "var(--bear)", width: 52, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>
                  {pos ? "+" : ""}{h.gainLossPct.toFixed(0)}%
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "12px 0 16px", display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 16 }}>
                    {/* Past + forward chart */}
                    <div>
                      <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 6 }}>
                        {h.theme}{h.proxy ? ` · proxy ${h.proxy}` : ""}
                      </div>
                      {fwd ? <PastForwardChart fwd={fwd} /> : (
                        <div className="t-micro" style={{ color: "var(--dim)", padding: "20px 0", textTransform: "none", letterSpacing: 0 }}>
                          Cash-like sleeve — no market proxy.
                        </div>
                      )}
                      {fwd && (
                        <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
                          <span className="t-micro" style={{ color: fwd.ret6m >= 0 ? "var(--bull)" : "var(--bear)" }}>past 6mo {fwd.ret6m >= 0 ? "+" : ""}{(fwd.ret6m * 100).toFixed(0)}%</span>
                          <span className="t-micro" style={{ color: fwd.expRet >= 0 ? "var(--bull)" : "var(--bear)" }}>fwd 90d {fwd.expRet >= 0 ? "+" : ""}{(fwd.expRet * 100).toFixed(0)}%</span>
                          <span className="t-micro" style={{ color: "var(--dim)" }}>vol {(fwd.annVol * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                    {/* Stats + thesis */}
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                        <Stat label="UNITS" value={h.units.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                        <Stat label="COST" value={fmtB(h.cost)} />
                        <Stat label="VALUE" value={fmtB(h.currentValue)} />
                        <Stat label="SINCE" value={h.investDate} />
                      </div>
                      {h.thesis && (
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.55, marginTop: 10 }}>
                          {h.thesis}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Theme allocation */}
      <div className="card" style={{ padding: 16 }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 14 }}>ALLOCATION BY THEME</div>
        {themes.map(t => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--muted)", width: 110, flexShrink: 0 }}>{t.label}</div>
            <div style={{ flex: 1, height: 10, background: "var(--bg)" }}>
              <div style={{ height: "100%", width: `${(t.value / themeMax) * 100}%`, background: "var(--tech)", opacity: 0.55 }} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", width: 56, textAlign: "right", flexShrink: 0 }}>{fmtB(t.value)}</div>
          </div>
        ))}
      </div>

      <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.6, textTransform: "none", letterSpacing: 0, paddingTop: 4 }}>
        Real-book figures from the Fund SuperMart statement. Each fund&apos;s past-6-month line and 90-day forward cone come from its proxy index ({FWD.model}, {FWD.generatedAt}) via <code style={{ fontFamily: "var(--font-mono)" }}>ingestion/forward_view.py</code> — the proxy approximates the driver, not the exact NAV. Not investment advice.
      </div>
    </div>
  );
}

function Kpi({ label, value, col }: { label: string; value: string; col: string }) {
  return (
    <div>
      <div className="t-micro" style={{ color: "var(--dim)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: col, lineHeight: 1, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="t-micro" style={{ color: "var(--dim)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>{value}</div>
    </div>
  );
}
