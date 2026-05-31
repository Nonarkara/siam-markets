"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import graphData from "@/lib/data/market-graph.json";

/* ══════════════════════════════════════════════════════════════════════════════
   MarketGraph — Obsidian-style relationship map for the DESK home.
   Curated nodes (cycle / macro / theme / sector / ticker) with edges that
   carry a "why" — the second-order causation traders carry in their heads
   ("Oil ↑ → Energy sector ↑ → PTT ↑", "Fed ↑ → USD/THB ↑ → exporters ↑").
   Lightweight deterministic force-simulation (runs once in useMemo, ~200
   iterations on <40 nodes — negligible). No live data, no API; the graph IS
   the data, statically imported the same way prices.json is.
   ══════════════════════════════════════════════════════════════════════════════ */

const W = 1200, H = 520;

interface RawNode { id: string; label: string; type: string; weight: number; note?: string; href?: string }
interface Edge    { from: string; to: string; kind: string; weight: number; why?: string }
interface Positioned extends RawNode { x: number; y: number }

const NODES: RawNode[] = graphData.nodes as RawNode[];
const EDGES: Edge[]    = graphData.edges as Edge[];

function simulate(): Positioned[] {
  const N = NODES.length;
  const out: Positioned[] = NODES.map((n, i) => ({
    ...n,
    x: W / 2 + 340 * Math.cos((i / N) * Math.PI * 2),
    y: H / 2 + 200 * Math.sin((i / N) * Math.PI * 2),
  }));
  const vel = out.map(() => ({ x: 0, y: 0 }));
  const idx = new Map(out.map((n, i) => [n.id, i] as const));

  const K_REP = 9500, K_ATTR = 0.022, K_CENTER = 0.012, DAMP = 0.84;
  const TARGET = 115;

  for (let iter = 0; iter < 220; iter++) {
    const fx = new Array<number>(N).fill(0);
    const fy = new Array<number>(N).fill(0);
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = out[i].x - out[j].x;
        const dy = out[i].y - out[j].y;
        const d2 = Math.max(dx * dx + dy * dy, 25);
        const d  = Math.sqrt(d2);
        const f  = K_REP / d2;
        fx[i] += (dx / d) * f; fy[i] += (dy / d) * f;
        fx[j] -= (dx / d) * f; fy[j] -= (dy / d) * f;
      }
    }
    for (const e of EDGES) {
      const a = idx.get(e.from); const b = idx.get(e.to);
      if (a === undefined || b === undefined) continue;
      const dx = out[b].x - out[a].x;
      const dy = out[b].y - out[a].y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      const f  = (d - TARGET) * K_ATTR * e.weight;
      fx[a] += (dx / d) * f; fy[a] += (dy / d) * f;
      fx[b] -= (dx / d) * f; fy[b] -= (dy / d) * f;
    }
    for (let i = 0; i < N; i++) {
      fx[i] += (W / 2 - out[i].x) * K_CENTER;
      fy[i] += (H / 2 - out[i].y) * K_CENTER;
    }
    for (let i = 0; i < N; i++) {
      vel[i].x = (vel[i].x + fx[i]) * DAMP;
      vel[i].y = (vel[i].y + fy[i]) * DAMP;
      out[i].x = Math.max(50, Math.min(W - 50, out[i].x + vel[i].x));
      out[i].y = Math.max(50, Math.min(H - 50, out[i].y + vel[i].y));
    }
  }
  return out;
}

const TYPE_COLOR: Record<string, string> = {
  cycle:  "var(--caution)",
  macro:  "var(--tech)",
  theme:  "var(--bear)",
  sector: "var(--muted)",
  ticker: "var(--bull)",
};
const TYPE_LABEL: Record<string, string> = {
  cycle: "CYCLE", macro: "MACRO", theme: "THEME", sector: "SECTOR", ticker: "TICKER",
};

function edgeColor(kind: string): string {
  if (kind === "drag")   return "var(--bear)";
  if (kind === "lift")   return "var(--bull)";
  if (kind === "drives") return "var(--ink)";
  if (kind === "leads")  return "var(--caution)";
  return "var(--muted)"; // member
}

function describe(e: Edge, sel: string, otherLabel: string): string {
  const out = e.from === sel;
  if (e.kind === "drives") return out ? `drives ${otherLabel}`   : `driven by ${otherLabel}`;
  if (e.kind === "drag")   return out ? `drags ${otherLabel}`    : `dragged by ${otherLabel}`;
  if (e.kind === "lift")   return out ? `lifts ${otherLabel}`    : `lifted by ${otherLabel}`;
  if (e.kind === "member") return out ? `contains ${otherLabel}` : `member of ${otherLabel}`;
  if (e.kind === "leads")  return out ? `leads to ${otherLabel}` : `follows from ${otherLabel}`;
  return otherLabel;
}

function nodeR(weight: number) { return 4 + weight * 4; }

export function MarketGraph() {
  const nodes = useMemo(() => simulate(), []);
  const idx   = useMemo(() => new Map(nodes.map((n, i) => [n.id, i] as const)), [nodes]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden]     = useState<Set<string>>(new Set());

  const isVisibleType = (t: string) => !hidden.has(t);

  const neighbors = useMemo(() => {
    if (!selected) return null;
    const s = new Set<string>([selected]);
    for (const e of EDGES) {
      if (e.from === selected) s.add(e.to);
      if (e.to   === selected) s.add(e.from);
    }
    return s;
  }, [selected]);

  const sel      = selected ? nodes[idx.get(selected)!] : null;
  const selEdges = selected ? EDGES.filter(e => e.from === selected || e.to === selected) : [];

  function toggleType(t: string) {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  return (
    <section className="market-graph">
      {/* Header + filter chips */}
      <div className="market-graph-header">
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", letterSpacing: "0.16em", fontWeight: 700 }}>
            MARKET WEB
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginLeft: 10 }}>
            · tap a node to read its relationships
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(["cycle", "macro", "theme", "sector", "ticker"] as const).map(t => {
            const off = hidden.has(t);
            return (
              <button key={t} onClick={() => toggleType(t)} style={{
                fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
                padding: "4px 10px", minHeight: 30,
                background: off ? "var(--bg-raised)" : `color-mix(in srgb, ${TYPE_COLOR[t]} 14%, var(--bg-raised))`,
                border: `1px solid ${off ? "var(--line)" : TYPE_COLOR[t]}`,
                color: off ? "var(--dim)" : TYPE_COLOR[t],
                cursor: "pointer", letterSpacing: "0.08em",
              }}>{TYPE_LABEL[t]}</button>
            );
          })}
        </div>
      </div>

      {/* Body: SVG + detail panel */}
      <div className="market-graph-body">
        <div className="market-graph-canvas">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", background: "var(--bg)" }}>
            {/* Edges */}
            {EDGES.map((e, i) => {
              const a = nodes[idx.get(e.from)!];
              const b = nodes[idx.get(e.to)!];
              if (!a || !b) return null;
              if (!isVisibleType(a.type) || !isVisibleType(b.type)) return null;
              const dim = neighbors && !(neighbors.has(e.from) && neighbors.has(e.to));
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={edgeColor(e.kind)} strokeWidth={Math.max(0.6, e.weight * 1.4)}
                  opacity={dim ? 0.05 : neighbors ? 0.55 : 0.22} />
              );
            })}
            {/* Nodes */}
            {nodes.map(n => {
              if (!isVisibleType(n.type)) return null;
              const isSel = selected === n.id;
              const dim   = neighbors && !neighbors.has(n.id);
              const r     = nodeR(n.weight);
              return (
                <g key={n.id} onClick={() => setSelected(isSel ? null : n.id)} style={{ cursor: "pointer", opacity: dim ? 0.18 : 1 }}>
                  {/* enlarged hit area for mobile tap */}
                  <circle cx={n.x} cy={n.y} r={r + 10} fill="transparent" />
                  <circle cx={n.x} cy={n.y} r={r}
                    fill={isSel ? "var(--caution)" : TYPE_COLOR[n.type]}
                    stroke={isSel ? "var(--caution)" : "var(--bg)"}
                    strokeWidth={isSel ? 2.5 : 1.5} />
                  <text x={n.x} y={n.y + r + 12} textAnchor="middle"
                    fill={isSel ? "var(--caution)" : "var(--ink)"}
                    fontFamily="var(--font-mono)" fontSize="10"
                    style={{ userSelect: "none", pointerEvents: "none" }}>
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        {sel ? (
          <aside className="market-graph-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: TYPE_COLOR[sel.type], letterSpacing: "0.12em" }}>
                {TYPE_LABEL[sel.type]}
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" style={{
                background: "transparent", border: "1px solid var(--line)",
                color: "var(--dim)", cursor: "pointer",
                fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
                minHeight: 28, minWidth: 28, lineHeight: 1,
              }}>✕</button>
            </div>
            <div style={{ fontFamily: "var(--font-elegant), Georgia, serif", fontSize: "var(--text-display)", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1, marginBottom: 10 }}>
              {sel.label}
            </div>
            {sel.note && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.55, margin: "0 0 16px" }}>
                {sel.note}
              </p>
            )}

            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.12em", marginBottom: 4 }}>
              RELATIONSHIPS · {selEdges.length}
            </div>
            <div>
              {selEdges.map((e, i) => {
                const otherId   = e.from === selected ? e.to : e.from;
                const otherNode = nodes[idx.get(otherId)!];
                if (!otherNode) return null;
                const kindCol = edgeColor(e.kind);
                return (
                  <button key={i} onClick={() => setSelected(otherId)} style={{
                    width: "100%", textAlign: "left", display: "block",
                    padding: "10px 0", borderTop: "1px solid var(--line)",
                    background: "transparent", border: "none", borderTopColor: "var(--line)",
                    cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: kindCol, letterSpacing: "0.04em" }}>
                        {describe(e, selected!, "")}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: TYPE_COLOR[otherNode.type] }}>
                        {otherNode.label}
                      </span>
                    </div>
                    {e.why && (
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5, marginTop: 4 }}>
                        {e.why}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {sel.href && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <Link href={sel.href} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", letterSpacing: "0.12em", textDecoration: "none" }}>
                  OPEN IN SCAN →
                </Link>
              </div>
            )}
          </aside>
        ) : (
          <aside className="market-graph-panel market-graph-panel--empty">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.12em", marginBottom: 10 }}>
              HOW TO READ
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.55, margin: "0 0 12px" }}>
              Every line is a relationship a trader carries in their head. Oil drives Energy; Fed Rate drives the baht, which lifts exporters; the cycle stage we're in drags banks and lifts gold.
            </p>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.6 }}>
              <div><span style={{ color: "var(--ink)" }}>━━</span> drives</div>
              <div><span style={{ color: "var(--bull)" }}>━━</span> lifts</div>
              <div><span style={{ color: "var(--bear)" }}>━━</span> drags</div>
              <div><span style={{ color: "var(--caution)" }}>━━</span> leads to</div>
              <div><span style={{ color: "var(--muted)" }}>━━</span> contains / member of</div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
