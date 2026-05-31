"use client";

import { useState } from "react";
import {
  DATA_SOURCES, PROV_KIND_META, PROVENANCE_AS_OF, provenanceSummary,
  type ProvKind, type DataSource,
} from "@/lib/provenance";

/* ══════════════════════════════════════════════════════════════════════════════
   /integrity — every number on this site, sourced.
   The honest ledger behind the dashboard: live vs cached vs computed vs
   illustrative vs reference vs mock vs pending vs yours. Satisfies §12.5 —
   source, method, last-updated, and one stated limitation, for every surface.
   ══════════════════════════════════════════════════════════════════════════════ */

const ORDER: ProvKind[] = ["yours", "live", "cached", "computed", "illustrative", "reference", "pending", "mock"];

export default function IntegrityPage() {
  const [filter, setFilter] = useState<ProvKind | "all">("all");
  const sum = provenanceSummary();
  const shown = filter === "all" ? DATA_SOURCES : DATA_SOURCES.filter(d => d.kind === filter);
  const grouped = ORDER
    .map(k => ({ kind: k, items: shown.filter(d => d.kind === k) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="page page-enter" style={{ maxWidth: 920, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Data Integrity</h1>
        <p className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6, maxWidth: "64ch" }}>
          Every number on this site, sourced. A financial dashboard is only as trustworthy as its honesty about where the data comes from — so here is the whole ledger: what is live, what is a saved snapshot, what is computed, what is an honest illustration, and what is a placeholder. Nothing here is hidden, and nothing fabricated is dressed up as real.
        </p>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 8 }}>
          {sum.real} of {sum.total} surfaces carry real data (live / cached / computed / yours) · ledger as of {PROVENANCE_AS_OF}
        </div>
      </div>

      {/* Kind legend / filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
        <Chip label={`ALL · ${sum.total}`} active={filter === "all"} color="var(--ink)" onClick={() => setFilter("all")} />
        {ORDER.map(k => (
          <Chip key={k} label={`${PROV_KIND_META[k].label} · ${sum.by[k] ?? 0}`} active={filter === k}
            color={PROV_KIND_META[k].color} onClick={() => setFilter(k)} />
        ))}
      </div>

      {/* Grouped ledger */}
      {grouped.map(({ kind, items }) => (
        <section key={kind} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, paddingBottom: 8, borderBottom: `1px solid var(--line)` }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: PROV_KIND_META[kind].color, display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: PROV_KIND_META[kind].color, letterSpacing: "0.14em", fontWeight: 700 }}>
              {PROV_KIND_META[kind].label}
            </span>
            <span className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0 }}>
              {PROV_KIND_META[kind].blurb}
            </span>
          </div>
          {items.map(d => <Row key={d.id} d={d} />)}
        </section>
      ))}

      <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.6, textTransform: "none", letterSpacing: 0, paddingTop: 16, borderTop: "1px solid var(--line)", marginBottom: 32 }}>
        Maintained by hand in <code style={{ fontFamily: "var(--font-mono)" }}>src/lib/provenance.ts</code> — keeping it honest is a deliberate act, not an automated one. Research preview · not financial advice.
      </div>
    </div>
  );
}

function Row({ d }: { d: DataSource }) {
  const col = PROV_KIND_META[d.kind].color;
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>{d.label}</span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>{d.surface}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2px 16px", marginTop: 6 }}>
        <Field label="SOURCE" value={d.source} />
        <Field label="METHOD" value={d.method} />
        {d.asOf && <Field label="AS OF" value={d.asOf} />}
        {d.engine && <Field label="ENGINE" value={d.engine} mono />}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: col, letterSpacing: "0.08em", flexShrink: 0, paddingTop: 2 }}>⚠ LIMIT</span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5 }}>{d.limitation}</span>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--dim)", letterSpacing: "0.08em", flexShrink: 0, width: 44 }}>{label}</span>
      <span style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.45 }}>{value}</span>
    </div>
  );
}

function Chip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", letterSpacing: "0.06em",
      padding: "5px 11px", minHeight: 32, cursor: "pointer",
      background: active ? `color-mix(in srgb, ${color} 14%, var(--bg-raised))` : "var(--bg-raised)",
      border: `1px solid ${active ? color : "var(--line)"}`,
      color: active ? color : "var(--dim)", fontWeight: active ? 700 : 400,
    }}>{label}</button>
  );
}
