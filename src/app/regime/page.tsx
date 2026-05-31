"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  REGIME_COLOR,
  REGIME_LABEL,
  SEVERITY_COLOR,
  allocationStance,
  buildEvidence,
  buildFallbackRegimeSummary,
  confidenceLabel,
  dominantProbability,
  regimeDescription,
  sourceDetail,
  sourceLabel,
  type AllocationStance,
  type RegimeDay,
  type RegimeEvidence,
  type RegimeKind,
  type RegimeSummary,
} from "@/lib/regime";

export default function RegimePage() {
  const fallbackSummary = useMemo(() => buildFallbackRegimeSummary(), []);
  const [summary, setSummary] = useState<RegimeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/regime")
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<RegimeSummary>;
      })
      .then(data => {
        if (!alive) return;
        setSummary(data);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setSummary(fallbackSummary);
        setError("Using deterministic demo fallback because the regime API is unavailable.");
      });
    return () => { alive = false; };
  }, [fallbackSummary]);

  const active = summary ?? fallbackSummary;
  const evidence = useMemo(() => buildEvidence(active), [active]);
  const stance = useMemo(() => allocationStance(active.today.regime), [active.today.regime]);
  const confidence = Math.round(dominantProbability(active.today) * 100);

  return (
    <div className="page page-enter" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <RegimeHeader summary={active} confidence={confidence} loading={!summary} error={error} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 12 }}>
        <CurrentRegimePanel summary={active} evidence={evidence} />
        <AllocationPanel stance={stance} regime={active.today.regime} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 12 }}>
        <TapePanel history={active.history} />
        <ActionPanel stance={stance} />
      </div>

      <MethodPanel summary={active} />
    </div>
  );
}

function RegimeHeader({ summary, confidence, loading, error }: { summary: RegimeSummary; confidence: number; loading: boolean; error: string | null }) {
  const color = REGIME_COLOR[summary.today.regime];
  return (
    <section style={{ border: "1px solid var(--line)", background: "var(--bg-raised)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 18, padding: 16 }}>
      <div>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 8 }}>MARKET REGIME INTELLIGENCE</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 className="t-display" style={{ color, margin: 0 }}>{REGIME_LABEL[summary.today.regime]} REGIME</h1>
          <span className="t-mono" style={{ color: "var(--muted)", fontWeight: 700 }}>{confidence}% · {confidenceLabel(summary.today)}</span>
        </div>
        <p className="t-body" style={{ color: "var(--muted)", maxWidth: 760, marginTop: 8 }}>{regimeDescription(summary.today.regime)}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <SourceTag label={sourceLabel(summary.source)} color={summary.source === "supabase" ? "var(--bull)" : "var(--caution)"} />
          <SourceTag label={`RUN ${summary.run_date}`} color="var(--muted)" />
          {loading && <SourceTag label="LOADING API" color="var(--tech)" />}
          {error && <SourceTag label="API FALLBACK" color="var(--caution)" />}
        </div>
      </div>

      <div style={{ display: "grid", alignContent: "center", gap: 8 }}>
        <ProbabilityRow label="BULL" value={summary.today.bull_prob} color="var(--bull)" />
        <ProbabilityRow label="RANGE" value={summary.today.ranging_prob} color="var(--caution)" />
        <ProbabilityRow label="BEAR" value={summary.today.bear_prob} color="var(--bear)" />
      </div>
    </section>
  );
}

function SourceTag({ label, color }: { label: string; color: string }) {
  return (
    <span className="t-mono" style={{ color, border: `1px solid ${color}`, padding: "3px 7px", fontSize: "var(--text-micro)", fontWeight: 700, letterSpacing: "0.08em" }}>
      {label}
    </span>
  );
}

function ProbabilityRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 42px", gap: 8, alignItems: "center" }}>
      <span className="t-micro" style={{ color: "var(--dim)" }}>{label}</span>
      <div style={{ height: 6, background: "var(--bg)", border: "1px solid var(--line-dim)" }}>
        <div style={{ height: "100%", width: `${Math.round(value * 100)}%`, background: color }} />
      </div>
      <span className="t-mono" style={{ color, fontSize: "var(--text-micro)", textAlign: "right", fontWeight: 700 }}>{Math.round(value * 100)}%</span>
    </div>
  );
}

function CurrentRegimePanel({ summary, evidence }: { summary: RegimeSummary; evidence: RegimeEvidence[] }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <span className="t-micro">EVIDENCE BOARD</span>
        <span className="t-mono" style={{ color: REGIME_COLOR[summary.today.regime], fontSize: "var(--text-micro)", fontWeight: 700 }}>{REGIME_LABEL[summary.today.regime]}</span>
      </div>
      <div className="panel__body" style={{ display: "grid", gap: 1, padding: 0, background: "var(--line-dim)" }}>
        {evidence.map(item => <EvidenceRow key={item.label} item={item} />)}
      </div>
    </section>
  );
}

function EvidenceRow({ item }: { item: RegimeEvidence }) {
  const color = SEVERITY_COLOR[item.severity];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "112px minmax(0, 1fr) 92px", gap: 12, alignItems: "center", background: "var(--bg-surface)", padding: "11px 12px", minHeight: 58 }}>
      <div className="t-micro" style={{ color: "var(--dim)" }}>{item.label}</div>
      <div>
        <div className="t-mono" style={{ color, fontWeight: 700, marginBottom: 2 }}>{item.state}</div>
        <div className="t-body" style={{ color: "var(--muted)", fontSize: "var(--text-micro)", lineHeight: 1.35 }}>{item.detail}</div>
      </div>
      <div className="t-mono" style={{ color: "var(--ink)", fontWeight: 700, textAlign: "right" }}>{item.value}</div>
    </div>
  );
}

function AllocationPanel({ stance, regime }: { stance: AllocationStance; regime: RegimeKind }) {
  const rows = [
    { label: "EQUITY", value: stance.equity, color: "var(--bull)" },
    { label: "BONDS", value: stance.bonds, color: "var(--tech)" },
    { label: "CASH", value: stance.cash, color: "var(--caution)" },
    { label: "REAL", value: stance.realAssets, color: "var(--muted)" },
  ];
  return (
    <section className="panel">
      <div className="panel__header">
        <span className="t-micro">ALLOCATION STANCE</span>
        <span className="t-mono" style={{ color: REGIME_COLOR[regime], fontSize: "var(--text-micro)", fontWeight: 700 }}>{stance.label}</span>
      </div>
      <div className="panel__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", height: 32, border: "1px solid var(--line)" }}>
          {rows.map(row => <div key={row.label} title={`${row.label} ${row.value}%`} style={{ width: `${row.value}%`, background: row.color, opacity: row.label === "REAL" ? 0.45 : 0.85 }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {rows.map(row => (
            <div key={row.label} style={{ border: "1px solid var(--line)", padding: 9, background: "var(--bg)" }}>
              <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 3 }}>{row.label}</div>
              <div className="t-mono" style={{ color: row.color, fontWeight: 700 }}>{row.value}%</div>
            </div>
          ))}
        </div>
        <p className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6 }}>This is a contextual Graham/Dalio stance, not a portfolio order. Use it to decide how much risk the rest of the app is allowed to take.</p>
      </div>
    </section>
  );
}

function TapePanel({ history }: { history: RegimeDay[] }) {
  const recent = history.slice(-60);
  return (
    <section className="panel">
      <div className="panel__header">
        <span className="t-micro">60-DAY REGIME TAPE</span>
        <span className="t-mono" style={{ color: "var(--dim)", fontSize: "var(--text-micro)" }}>{recent.length} SESSIONS</span>
      </div>
      <div className="panel__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${recent.length}, minmax(5px, 1fr))`, gap: 2, minHeight: 96, alignItems: "end" }}>
          {recent.map(day => <div key={day.date} title={`${day.date} ${REGIME_LABEL[day.regime]}`} style={{ height: 24 + Math.round(dominantProbability(day) * 66), background: REGIME_COLOR[day.regime], opacity: 0.84, borderTop: "1px solid var(--ink)" }} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div className="t-micro" style={{ color: "var(--bull)" }}>BULL</div>
          <div className="t-micro" style={{ color: "var(--caution)" }}>RANGE</div>
          <div className="t-micro" style={{ color: "var(--bear)" }}>BEAR</div>
        </div>
      </div>
    </section>
  );
}

function ActionPanel({ stance }: { stance: AllocationStance }) {
  const actions = [
    { label: "TRADE", text: stance.tradeRisk, href: "/trade" },
    { label: "PORTFOLIO", text: stance.portfolioAction, href: "/money" },
    { label: "PLAN", text: stance.planningAction, href: "/plan" },
  ];
  return (
    <section className="panel">
      <div className="panel__header"><span className="t-micro">WHAT CHANGES NOW</span></div>
      <div className="panel__body panel__body--flush">
        {actions.map(action => (
          <Link key={action.label} href={action.href} style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) auto", gap: 10, alignItems: "center", minHeight: 72, padding: "12px", borderBottom: "1px solid var(--line-dim)", color: "inherit", textDecoration: "none" }}>
            <span className="t-mono" style={{ color: "var(--amber-nav)", fontSize: "var(--text-micro)", fontWeight: 700 }}>{action.label}</span>
            <span className="t-body" style={{ color: "var(--muted)", lineHeight: 1.45 }}>{action.text}</span>
            <span className="t-mono" style={{ color: "var(--tech)", fontSize: "var(--text-micro)" }}>OPEN</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MethodPanel({ summary }: { summary: RegimeSummary }) {
  return (
    <section style={{ border: "1px solid var(--line)", background: "var(--bg)", padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 16 }}>
      <div>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 6 }}>METHOD AND PROVENANCE</div>
        <p className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6 }}>{sourceDetail(summary)} Regime is context, not prophecy. It gates risk before the Trade Desk, Portfolio, and Plan screens make their own decisions.</p>
      </div>
      <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 14 }}>
        <div className="t-serif" style={{ color: "var(--ink)" }}>In the short run, the market is a voting machine. In the long run, it is a weighing machine.</div>
        <div className="t-micro" style={{ marginTop: 5, color: "var(--dim)" }}>BENJAMIN GRAHAM</div>
      </div>
    </section>
  );
}
