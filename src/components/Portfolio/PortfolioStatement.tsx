"use client";

/**
 * Portfolio Statement · Phillip Fund SuperMart layout, Braun-rendered.
 *
 * Three sub-views (selectable via prop or tabs above):
 *   • SUMMARY      — KPI bar + 3 donut charts (Fund · Risk · Scope)
 *   • HOLDINGS     — full sortable table mirroring Phillip schema
 *   • PERFORMANCE  — winners & laggards, tax-bucket P&L, dividend yield
 *
 * Data lives in `src/lib/portfolio-data.ts` (Dr Non's real G7159 statement).
 */

import { useMemo, useState } from "react";
import {
  HOLDINGS,
  computeSummary,
  allocationByFund,
  allocationByRisk,
  allocationByScope,
  allocationByTheme,
  RISK_LABEL,
  SCOPE_LABEL,
  PORTFOLIO_AS_OF,
  PORTFOLIO_ACCOUNT,
  PORTFOLIO_OWNER,
  type FundHolding,
  type FundScope,
} from "@/lib/portfolio-data";
import { Donut, DonutLegend } from "./Donut";
import { fmtNum, pctColor } from "@/lib/format";

const fmtTHB = (n: number) => `฿${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

// ─── SUMMARY view ────────────────────────────────────────────

export function PortfolioSummaryView() {
  const summary = useMemo(() => computeSummary(HOLDINGS), []);
  const byFund  = useMemo(() => allocationByFund(HOLDINGS),  []);
  const byRisk  = useMemo(() => allocationByRisk(HOLDINGS),  []);
  const byScope = useMemo(() => allocationByScope(HOLDINGS), []);
  const byTheme = useMemo(() => allocationByTheme(HOLDINGS), []);

  const [hl, setHl] = useState<{ scope: "fund" | "risk" | "scope" | "theme" | null; key: string | null }>({ scope: null, key: null });

  const gainColor = summary.totalGain >= 0 ? "var(--bull)" : "var(--bear)";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* ── KPI bar ────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 1,
          background: "var(--line)",
          border: "1px solid var(--line)",
        }}
      >
        <Kpi label="Total Cost"          value={fmtTHB(summary.totalCost)}   sub={`${summary.count} funds · 1 acct`} />
        <Kpi label="Current Value"       value={fmtTHB(summary.totalValue)}  sub={`as of ${PORTFOLIO_AS_OF}`} />
        <Kpi label="Total Gain · Baht"   value={`${summary.totalGain >= 0 ? "+" : ""}${fmtTHB(summary.totalGain)}`}      color={gainColor} />
        <Kpi label="Total Gain · %"      value={`${summary.totalGain >= 0 ? "+" : ""}${summary.totalGainPct.toFixed(2)}%`} color={gainColor} sub={`cost-weighted return since first buy`} />
        <Kpi label="Best Performer"      value={summary.bestPerformer.code}  sub={`+${summary.bestPerformer.gainLossPct.toFixed(1)}%`}  color="var(--bull)" />
        <Kpi label="Worst Performer"     value={summary.worstPerformer.code} sub={`${summary.worstPerformer.gainLossPct.toFixed(1)}%`} color="var(--bear)" />
      </div>

      {/* ── Donuts ────────────────────────────────────────── */}
      <div className="donut-grid">
        <DonutCard
          title="ALLOCATION BY FUND"
          subtitle="17 holdings · click legend to highlight"
          data={byFund}
          highlightKey={hl.scope === "fund" ? hl.key : null}
          onHighlight={k => setHl({ scope: "fund", key: k })}
          centerLabel="FUNDS"
          centerValue={`${byFund.length}`}
        />
        <DonutCard
          title="ALLOCATION BY RISK · SEC 1–8"
          subtitle={`${byRisk.find(r => Number(r.key) >= 6)?.pct.toFixed(0) ?? 0}% in lvl 6+`}
          data={byRisk}
          highlightKey={hl.scope === "risk" ? hl.key : null}
          onHighlight={k => setHl({ scope: "risk", key: k })}
          centerLabel="RISK SPREAD"
          centerValue={byRisk.length === 1 ? "concentrated" : "spread"}
        />
        <DonutCard
          title="ALLOCATION BY SCOPE · TAX BUCKET"
          subtitle="SSF · TESG · RMF · LTF · GMF · FIF"
          data={byScope}
          highlightKey={hl.scope === "scope" ? hl.key : null}
          onHighlight={k => setHl({ scope: "scope", key: k })}
          centerLabel={`${byScope.filter(s => s.key === "SSF" || s.key === "TESG" || s.key === "RMF").reduce((sum, s) => sum + s.pct, 0).toFixed(0)}%`}
          centerValue="TAX-ADV"
        />
        <DonutCard
          title="ALLOCATION BY THEME"
          subtitle="Geography & sector"
          data={byTheme}
          highlightKey={hl.scope === "theme" ? hl.key : null}
          onHighlight={k => setHl({ scope: "theme", key: k })}
          centerLabel={`${byTheme.length}`}
          centerValue="THEMES"
        />
      </div>

      <style>{`
        .donut-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 700px) { .donut-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1280px) { .donut-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>
    </div>
  );
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", padding: "12px 14px" }}>
      <div className="t-micro">{label}</div>
      <div className="t-mono" style={{ fontSize: "1.125rem", fontWeight: 700, color: color ?? "var(--ink)", marginTop: 4 }}>
        {value}
      </div>
      {sub && <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function DonutCard({
  title, subtitle, data, highlightKey, onHighlight, centerLabel, centerValue,
}: {
  title: string; subtitle: string;
  data: ReturnType<typeof allocationByFund>;
  highlightKey: string | null;
  onHighlight: (k: string | null) => void;
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", padding: 12 }}>
      <div className="t-micro" style={{ marginBottom: 2, letterSpacing: "0.14em" }}>{title}</div>
      <div className="t-micro" style={{ color: "var(--muted)", marginBottom: 10 }}>{subtitle}</div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", minWidth: 0 }}>
        <Donut
          data={data}
          size={150}
          thickness={26}
          highlightKey={highlightKey}
          center={
            <div>
              <div className="t-micro" style={{ color: "var(--muted)", letterSpacing: "0.14em" }}>{centerLabel}</div>
              <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700, marginTop: 2 }}>
                {centerValue}
              </div>
            </div>
          }
        />
        <div style={{ flex: 1, minWidth: 0, maxHeight: 200, overflowY: "auto" }}>
          <DonutLegend data={data.slice(0, 12)} highlightKey={highlightKey} onHighlight={onHighlight} />
        </div>
      </div>
    </div>
  );
}

// ─── HOLDINGS view ───────────────────────────────────────────

type SortKey = keyof Pick<FundHolding,
  "no" | "code" | "amc" | "scope" | "units" | "unitCost" | "cost"
  | "nav" | "currentValue" | "gainLoss" | "gainLossPct" | "riskLevel" | "investDate"
>;

export function HoldingsTableView() {
  const [sortKey, setSortKey] = useState<SortKey>("currentValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterScope, setFilterScope] = useState<FundScope | "ALL">("ALL");

  const filtered = useMemo(() => {
    return filterScope === "ALL" ? HOLDINGS : HOLDINGS.filter(h => h.scope === filterScope);
  }, [filterScope]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const summary = computeSummary(filtered);

  const setSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["ALL", "SSF", "TESG", "RMF", "LTF", "GMF", "FIF"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterScope(s)}
            style={{
              background: filterScope === s ? "var(--tech-10)" : "transparent",
              border: `1px solid ${filterScope === s ? "var(--tech)" : "var(--line)"}`,
              color: filterScope === s ? "var(--tech)" : "var(--muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.625rem",
              letterSpacing: "0.14em",
              fontWeight: 700,
              padding: "4px 10px",
              cursor: "pointer",
              minHeight: 28,
            }}
          >
            {s}
            {s !== "ALL" && (
              <span style={{ marginLeft: 4, color: "var(--dim)" }}>
                {HOLDINGS.filter(h => h.scope === s).length}
              </span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          <span className="t-micro" style={{ color: "var(--muted)" }}>
            {filtered.length} holdings · {fmtTHB(summary.totalValue)}
          </span>
          <span
            className="t-mono"
            style={{ fontSize: "0.75rem", fontWeight: 700, color: summary.totalGain >= 0 ? "var(--bull)" : "var(--bear)" }}
          >
            {summary.totalGain >= 0 ? "+" : ""}{summary.totalGainPct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", border: "1px solid var(--line)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--bg-raised)", zIndex: 1 }}>
            <tr>
              <Th onClick={() => setSort("no")}          active={sortKey === "no"}>#</Th>
              <Th onClick={() => setSort("code")}        active={sortKey === "code"} align="left">Fund</Th>
              <Th onClick={() => setSort("amc")}         active={sortKey === "amc"} align="left">AMC</Th>
              <Th onClick={() => setSort("scope")}       active={sortKey === "scope"}>Scope</Th>
              <Th onClick={() => setSort("riskLevel")}   active={sortKey === "riskLevel"}>Risk</Th>
              <Th onClick={() => setSort("units")}       active={sortKey === "units"}>Units</Th>
              <Th onClick={() => setSort("unitCost")}    active={sortKey === "unitCost"}>Avg Cost</Th>
              <Th onClick={() => setSort("cost")}        active={sortKey === "cost"}>Cost</Th>
              <Th onClick={() => setSort("investDate")}  active={sortKey === "investDate"}>Invest</Th>
              <Th onClick={() => setSort("nav")}         active={sortKey === "nav"}>NAV</Th>
              <Th onClick={() => setSort("currentValue")}active={sortKey === "currentValue"}>Value</Th>
              <Th onClick={() => setSort("gainLoss")}    active={sortKey === "gainLoss"}>P&amp;L (฿)</Th>
              <Th onClick={() => setSort("gainLossPct")} active={sortKey === "gainLossPct"}>P&amp;L (%)</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(h => (
              <tr
                key={h.code}
                style={{ borderBottom: "1px solid var(--line)", background: h.gainLossPct >= 50 ? "var(--bull-10)" : h.gainLossPct <= -20 ? "var(--bear-10)" : "transparent" }}
              >
                <Td>{h.no}</Td>
                <Td align="left">
                  <div style={{ fontWeight: 700 }}>{h.code}</div>
                  {h.mandate && <div className="t-micro" style={{ color: "var(--muted)", marginTop: 1 }}>{h.mandate}</div>}
                </Td>
                <Td align="left">{h.amc}</Td>
                <Td><ScopeChip scope={h.scope} /></Td>
                <Td><RiskChip level={h.riskLevel} /></Td>
                <Td mono>{fmtNum(h.units, 4)}</Td>
                <Td mono>{fmtNum(h.unitCost, 4)}</Td>
                <Td mono>{fmtTHB(h.cost)}</Td>
                <Td mono small>{h.investDate}</Td>
                <Td mono>{fmtNum(h.nav, 4)}</Td>
                <Td mono>{fmtTHB(h.currentValue)}</Td>
                <Td mono color={h.gainLoss >= 0 ? "var(--bull)" : "var(--bear)"}>
                  {h.gainLoss >= 0 ? "+" : ""}{fmtTHB(h.gainLoss)}
                </Td>
                <Td mono color={pctColor(h.gainLossPct)} bold>
                  {h.gainLossPct >= 0 ? "+" : ""}{h.gainLossPct.toFixed(2)}%
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--bg-raised)", borderTop: "2px solid var(--line)", position: "sticky", bottom: 0 }}>
              <Td colSpan={7} align="left" bold>TOTAL · {filtered.length} funds</Td>
              <Td mono bold>{fmtTHB(summary.totalCost)}</Td>
              <Td />
              <Td />
              <Td mono bold>{fmtTHB(summary.totalValue)}</Td>
              <Td mono color={summary.totalGain >= 0 ? "var(--bull)" : "var(--bear)"} bold>
                {summary.totalGain >= 0 ? "+" : ""}{fmtTHB(summary.totalGain)}
              </Td>
              <Td mono color={pctColor(summary.totalGainPct)} bold>
                {summary.totalGain >= 0 ? "+" : ""}{summary.totalGainPct.toFixed(2)}%
              </Td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer source */}
      <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em" }}>
        DREAM PORTFOLIO · {PORTFOLIO_ACCOUNT} · HINDSIGHT ALLOCATION · AS OF {PORTFOLIO_AS_OF} · NOT INVESTMENT ADVICE
      </div>
    </div>
  );
}

function Th({ children, onClick, active, align = "right" }: { children: React.ReactNode; onClick: () => void; active: boolean; align?: "left" | "right" | "center" }) {
  return (
    <th
      onClick={onClick}
      className="t-micro"
      style={{
        textAlign: align,
        padding: "6px 8px",
        borderBottom: "1px solid var(--line)",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        color: active ? "var(--tech)" : "var(--muted)",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children, mono, align = "right", color, bold, colSpan, small,
}: {
  children?: React.ReactNode; mono?: boolean; align?: "left" | "right" | "center";
  color?: string; bold?: boolean; colSpan?: number; small?: boolean;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: "6px 8px",
        textAlign: align,
        fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
        fontVariantNumeric: mono ? "tabular-nums" : undefined,
        color: color ?? "var(--ink)",
        fontWeight: bold ? 700 : 500,
        fontSize: small ? "0.6875rem" : "0.75rem",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

function ScopeChip({ scope }: { scope: FundScope }) {
  const color =
    scope === "SSF"  ? "var(--tech)" :
    scope === "TESG" ? "var(--caution)" :
    scope === "RMF"  ? "var(--bear)" :
    scope === "LTF"  ? "var(--violet)" :
    scope === "FIF"  ? "var(--bull)" :
    "var(--dim)";
  return (
    <span
      title={SCOPE_LABEL[scope]}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.5rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        color,
        border: `1px solid ${color}`,
        padding: "1px 5px",
        whiteSpace: "nowrap",
      }}
    >
      {scope}
    </span>
  );
}

function RiskChip({ level }: { level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }) {
  const color =
    level <= 2 ? "#1f8a3b" :
    level <= 4 ? "#f2c200" :
    level <= 6 ? "#ff7a30" :
    "#c41e1e";
  return (
    <span
      title={`Risk ${level} · ${RISK_LABEL[level]}`}
      style={{
        display: "inline-block",
        width: 22,
        textAlign: "center",
        fontFamily: "var(--font-mono)",
        fontSize: "0.6875rem",
        fontWeight: 700,
        color,
        border: `1px solid ${color}`,
        padding: "1px 0",
      }}
    >
      {level}
    </span>
  );
}

// ─── PERFORMANCE view ────────────────────────────────────────

export function PerformanceView() {
  const winners = useMemo(() => [...HOLDINGS].sort((a, b) => b.gainLossPct - a.gainLossPct).slice(0, 5), []);
  const laggards = useMemo(() => [...HOLDINGS].sort((a, b) => a.gainLossPct - b.gainLossPct).slice(0, 5), []);

  // Bucket P&L by scope
  const byScope = useMemo(() => {
    const buckets = new Map<FundScope, { cost: number; value: number; count: number }>();
    for (const h of HOLDINGS) {
      const b = buckets.get(h.scope) ?? { cost: 0, value: 0, count: 0 };
      b.cost += h.cost;
      b.value += h.currentValue;
      b.count += 1;
      buckets.set(h.scope, b);
    }
    return Array.from(buckets.entries()).map(([scope, b]) => ({
      scope,
      cost: b.cost,
      value: b.value,
      gain: b.value - b.cost,
      gainPct: ((b.value - b.cost) / b.cost) * 100,
      count: b.count,
    })).sort((a, b) => b.gainPct - a.gainPct);
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Winners + Laggards */}
      <div className="perf-grid">
        <PerfList title="WINNERS · TOP 5" data={winners} color="var(--bull)" />
        <PerfList title="LAGGARDS · BOTTOM 5" data={laggards} color="var(--bear)" />
      </div>

      {/* P&L by scope */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", padding: 12 }}>
        <div className="t-micro" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>P&amp;L BY TAX BUCKET</div>
        <div style={{ display: "grid", gap: 6 }}>
          {byScope.map(b => {
            const w = Math.min(100, Math.abs(b.gainPct) * 1.5 + 8);
            const color = b.gain >= 0 ? "var(--bull)" : "var(--bear)";
            return (
              <div key={b.scope} style={{ display: "grid", gridTemplateColumns: "80px 1fr 110px 100px", gap: 10, alignItems: "center" }}>
                <div>
                  <ScopeChip scope={b.scope} />
                  <span className="t-micro" style={{ marginLeft: 6, color: "var(--muted)" }}>{b.count}</span>
                </div>
                <div style={{ position: "relative", height: 16, background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
                  <div style={{ position: "absolute", inset: 0, width: `${w}%`, background: color, opacity: 0.4 }} />
                  <div
                    className="t-mono"
                    style={{ position: "relative", padding: "0 8px", lineHeight: "14px", fontSize: "0.6875rem", fontWeight: 700 }}
                  >
                    {fmtTHB(b.value)} · cost {fmtTHB(b.cost)}
                  </div>
                </div>
                <span className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 700, color, textAlign: "right" }}>
                  {b.gain >= 0 ? "+" : ""}{fmtTHB(b.gain)}
                </span>
                <span className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 700, color, textAlign: "right" }}>
                  {b.gain >= 0 ? "+" : ""}{b.gainPct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .perf-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 900px) { .perf-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}

function PerfList({ title, data, color }: { title: string; data: FundHolding[]; color: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--line)", padding: 12 }}>
      <div className="t-micro" style={{ marginBottom: 8, color, letterSpacing: "0.14em" }}>{title}</div>
      <div style={{ display: "grid", gap: 4 }}>
        {data.map(h => (
          <div key={h.code} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--line-dim)", alignItems: "baseline" }}>
            <div style={{ minWidth: 0 }}>
              <div className="t-body" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{h.code}</div>
              <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>{h.theme} · cost {fmtTHB(h.cost)}</div>
            </div>
            <span className="t-mono" style={{ fontSize: "0.8125rem", color: h.gainLoss >= 0 ? "var(--bull)" : "var(--bear)" }}>
              {h.gainLoss >= 0 ? "+" : ""}{fmtTHB(h.gainLoss)}
            </span>
            <span className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700, color: h.gainLossPct >= 0 ? "var(--bull)" : "var(--bear)" }}>
              {h.gainLossPct >= 0 ? "+" : ""}{h.gainLossPct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
