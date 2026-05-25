"use client";

import { useState } from "react";
import type {
  DigitalKPI, ThaiDigitalStock, GlobalAIQuote, DigitalMarket,
} from "@/lib/api/thailand-digital";
import { DIGITAL_CATEGORY_LABEL, DIGITAL_CATEGORY_COLOR } from "@/lib/api/thailand-digital";
import { fmtNum, fmtPct, pctClass } from "@/lib/format";

interface Props {
  kpis: DigitalKPI[];
  thaiStack: ThaiDigitalStock[];
  globalAi: GlobalAIQuote[];
  markets: DigitalMarket[];
}

function KPICell({ kpi }: { kpi: DigitalKPI }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderRight: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)",
      flex: "1 1 140px",
      minWidth: 0,
    }}>
      <div className="t-micro" style={{ marginBottom: 4 }}>{kpi.label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.05rem", fontWeight: 700, color: kpi.color }}>
        {kpi.value}
      </div>
      <div className="t-micro" style={{ marginTop: 3, color: "var(--dim)", textTransform: "none", letterSpacing: 0, lineHeight: 1.3 }}>
        {kpi.sub}
      </div>
    </div>
  );
}

const ROLE_LABEL: Record<GlobalAIQuote["role"], string> = {
  chips: "AI Chips",
  model: "AI Models",
  cloud: "AI Cloud",
  platform: "Platform",
  infra: "Infra",
  foundry: "Foundry",
};

const ROLE_COLOR: Record<GlobalAIQuote["role"], string> = {
  chips:    "var(--bear)",
  model:    "var(--tech)",
  cloud:    "var(--tech)",
  platform: "var(--bull)",
  infra:    "var(--caution)",
  foundry:  "var(--tech)",
};

export function DigitalEconomyPanel({ kpis, thaiStack, globalAi, markets }: Props) {
  const [stackFilter, setStackFilter] = useState<ThaiDigitalStock["category"] | "all">("all");

  const filteredStack = stackFilter === "all"
    ? thaiStack
    : thaiStack.filter(s => s.category === stackFilter);

  const stackCategories = Array.from(new Set(thaiStack.map(s => s.category)));

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid var(--line)",
        background: "var(--bg-raised)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: "1.1rem" }}>⚡</span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "var(--ink)",
            fontSize: "0.95rem",
          }}>
            DIGITAL ECONOMY × AI
          </span>
          <span className="t-micro" style={{ color: "var(--dim)" }}>
            Thailand stack → World's AI capital
          </span>
        </div>
      </div>

      {/* ─── Thailand Digital Pulse ──────────────────────────────── */}
      <div style={{ padding: "10px 16px 0", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: "0.85rem" }}>🇹🇭</span>
          <span className="t-micro" style={{ color: "var(--tech)" }}>THAILAND DIGITAL PULSE</span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {kpis.map(k => <KPICell key={k.label} kpi={k} />)}
      </div>

      {/* ─── Thai Digital Stack ──────────────────────────────────── */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <span className="t-micro" style={{ color: "var(--bull)" }}>THE THAI DIGITAL STACK · SET-LISTED</span>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{thaiStack.length} stocks</span>
        </div>

        {/* Category filter chips */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 12,
        }}>
          <button
            onClick={() => setStackFilter("all")}
            style={{
              background: stackFilter === "all" ? "var(--ink)" : "transparent",
              color: stackFilter === "all" ? "#000" : "var(--muted)",
              border: "1px solid var(--line)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.5rem",
              letterSpacing: "0.08em",
              padding: "3px 8px",
              cursor: "pointer",
              minHeight: 24,
              fontWeight: 700,
            }}
          >
            ALL
          </button>
          {stackCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setStackFilter(cat)}
              style={{
                background: stackFilter === cat ? DIGITAL_CATEGORY_COLOR[cat] : "transparent",
                color: stackFilter === cat ? "#000" : DIGITAL_CATEGORY_COLOR[cat],
                border: `1px solid ${DIGITAL_CATEGORY_COLOR[cat]}`,
                fontFamily: "var(--font-mono)",
                fontSize: "0.5rem",
                letterSpacing: "0.08em",
                padding: "3px 8px",
                cursor: "pointer",
                minHeight: 24,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {DIGITAL_CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        {/* Stock cards */}
        <div style={{ display: "grid", gap: 6 }}>
          {filteredStack.map(stock => {
            const color = DIGITAL_CATEGORY_COLOR[stock.category];
            return (
              <div key={stock.symbol} style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--line)",
                borderLeft: `3px solid ${color}`,
                padding: "10px 12px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 700 }}>{stock.symbol.replace(".BK", "")}</span>
                    <span className="t-body" style={{ color: "var(--ink)", fontSize: "0.8rem" }}>{stock.name}</span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.5rem",
                      color, border: `1px solid ${color}`,
                      padding: "1px 5px",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                    }}>
                      {DIGITAL_CATEGORY_LABEL[stock.category].toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color, whiteSpace: "nowrap", fontWeight: 600 }}>
                    ฿{fmtNum(stock.marketCapBn, 0)}B
                  </span>
                </div>
                <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.75rem", lineHeight: 1.4, marginBottom: 3 }}>
                  {stock.whatTheyDo}
                </div>
                <div className="t-body" style={{ color, fontSize: "0.7rem", lineHeight: 1.4, fontStyle: "italic" }}>
                  → {stock.digitalAngle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Global AI Leaders ───────────────────────────────────── */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.85rem" }}>🌐</span>
            <span className="t-micro" style={{ color: "var(--bear)" }}>GLOBAL AI CAPITAL · LIVE</span>
          </div>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{globalAi.length} mega-caps</span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 4,
          background: "var(--line)",
          border: "1px solid var(--line)",
        }}>
          {globalAi.map(q => (
            <div key={q.symbol} style={{
              background: "var(--bg-surface)",
              padding: "10px 12px",
              minWidth: 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: "0.85rem" }}>{q.flag}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700 }}>{q.symbol}</span>
                </div>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.5rem",
                  color: ROLE_COLOR[q.role],
                  border: `1px solid ${ROLE_COLOR[q.role]}`,
                  padding: "1px 4px",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                }}>
                  {ROLE_LABEL[q.role].toUpperCase()}
                </span>
              </div>
              <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--ink)", fontWeight: 600, marginBottom: 4 }}>
                {q.name}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 700 }}>
                  ${fmtNum(q.price, q.price > 100 ? 0 : 2)}
                </span>
                <span className={`t-mono ${pctClass(q.changePct)}`} style={{ fontSize: "0.7rem" }}>
                  {fmtPct(q.changePct)}
                </span>
              </div>
              <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.65rem", lineHeight: 1.4 }}>
                {q.whyItMatters}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Market Sizes — Thailand vs Global ──────────────────── */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
        <div className="t-micro" style={{ color: "var(--caution)", marginBottom: 10 }}>
          MARKET SCALE · THAILAND IN A GLOBAL CONTEXT
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 4 }}>
          {markets.map(m => (
            <div key={m.category} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--line)",
              padding: "8px 10px",
              minWidth: 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: "0.85rem" }}>{m.emoji}</span>
              </div>
              <div className="t-body" style={{ fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.2 }}>
                {m.category}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--bull)", marginTop: 3, fontWeight: 700 }}>
                {m.globalSize}
              </div>
              <div className="t-micro" style={{ marginTop: 3, color: "var(--dim)", textTransform: "none", letterSpacing: 0 }}>
                TH share: <span style={{ color: "var(--caution)" }}>{m.thailandShare}</span>
              </div>
              <div className="t-micro" style={{ marginTop: 2, color: "var(--dim)", textTransform: "none", letterSpacing: 0, lineHeight: 1.3 }}>
                {m.growth}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 16px", background: "var(--bg)" }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          Live: Yahoo Finance · Curated: ETDA · DEPA · MDES · IDC · Gartner · Refresh quarterly
        </span>
      </div>
    </div>
  );
}
