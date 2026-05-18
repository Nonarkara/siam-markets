"use client";

import { useState } from "react";
import type { GdpPoint, ThaiEconomicProfile, ThaiSector, GlobalRanking } from "@/lib/api/thailand-economy";
import { GDPGrowthChart } from "./GDPGrowthChart";
import { fmtNum } from "@/lib/format";

interface Props {
  gdpHistory: GdpPoint[];
  profile: ThaiEconomicProfile;
  sectors: ThaiSector[];
  rankings: GlobalRanking[];
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderRight: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)",
      flex: "1 1 130px",
      minWidth: 0,
    }}>
      <div className="t-micro" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: color ?? "var(--ink)" }}>
        {value}
      </div>
      {sub && <div className="t-micro" style={{ marginTop: 3, color: "var(--dim)", textTransform: "none", letterSpacing: 0 }}>{sub}</div>}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const color = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : "var(--muted)";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.6rem",
      fontWeight: 700,
      color,
      border: `1px solid ${color}`,
      padding: "1px 6px",
      letterSpacing: "0.08em",
      whiteSpace: "nowrap",
    }}>
      #{rank}
    </span>
  );
}

export function ThailandPanel({ gdpHistory, profile, sectors, rankings }: Props) {
  const [activeSector, setActiveSector] = useState<ThaiSector["id"]>("tourism");
  const activeS = sectors.find(s => s.id === activeSector) ?? sectors[0];

  // Recent GDP growth (last data point with non-null growth)
  const latest = [...gdpHistory].reverse().find(p => p.growthPct !== null);
  const latestGrowth = latest?.growthPct ?? null;

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid var(--line)",
        background: "linear-gradient(90deg, rgba(0,200,150,0.04), transparent 50%, rgba(255,149,0,0.04))",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: "1.2rem" }}>🇹🇭</span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "var(--ink)",
            fontSize: "0.95rem",
          }}>
            THAILAND
          </span>
          <span className="t-micro" style={{ color: "var(--dim)" }}>
            The country behind the SET
          </span>
        </div>
        <span className="t-micro" style={{ color: "var(--dim)" }}>{profile.asOf}</span>
      </div>

      {/* Headline KPIs */}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <KPI label="GDP" value={`$${profile.gdpUsd}B`} sub={`#${profile.gdpRankGlobal} globally · $${fmtNum(profile.gdpPerCapita,0)}/capita`} color="var(--bull)" />
        <KPI label="GDP GROWTH" value={latestGrowth !== null ? `${latestGrowth > 0 ? "+" : ""}${latestGrowth.toFixed(1)}%` : "—"} sub="latest year, real terms" color={latestGrowth && latestGrowth > 0 ? "var(--bull)" : "var(--bear)"} />
        <KPI label="TOURISM" value={`${profile.tourismArrivals}M`} sub={`${profile.tourismShareGdp}% of GDP · $${profile.tourismRevenue}B revenue`} color="var(--caution)" />
        <KPI label="MEDICAL TOURISM" value={`${profile.medicalPatients}M`} sub={`$${profile.medicalRevenue}B · #${profile.medicalRankGlobal} Asia`} color="var(--bear)" />
        <KPI label="POPULATION" value={`${profile.population}M`} sub={`88% internet · 36% urban`} />
      </div>

      {/* GDP Growth Chart */}
      <div style={{ padding: "16px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span className="t-micro">GDP GROWTH — {gdpHistory[0]?.year ?? "—"} → {gdpHistory[gdpHistory.length - 1]?.year ?? "—"}</span>
          <span className="t-micro" style={{ color: "var(--dim)" }}>WORLD BANK · ANNOTATED EVENTS</span>
        </div>
        <GDPGrowthChart data={gdpHistory} height={210} />
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 14, fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--dim)" }}>
          <span>TYG = 1997 Tom Yum Goong Crisis</span>
          <span>TSUNAMI = 2004</span>
          <span>GFC = 2008</span>
          <span>FLOOD = 2011 Bangkok</span>
          <span>COUP = 2014</span>
          <span>COVID = 2020</span>
        </div>
      </div>

      {/* Sector tabs */}
      <div style={{ borderBottom: "1px solid var(--line)" }}>
        <div style={{
          display: "flex",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {sectors.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSector(s.id)}
              style={{
                flex: "0 0 auto",
                padding: "10px 14px",
                background: activeSector === s.id ? "var(--bg-surface)" : "transparent",
                border: "none",
                borderBottom: activeSector === s.id ? `2px solid ${s.color}` : "2px solid transparent",
                color: activeSector === s.id ? s.color : "var(--muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro)",
                fontWeight: activeSector === s.id ? 700 : 400,
                letterSpacing: "0.06em",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: 40,
              }}
            >
              <span>{s.emoji}</span>
              <span>{s.label.toUpperCase()}</span>
              <span style={{ opacity: 0.6, fontSize: "0.55rem" }}>{s.shareOfGdp}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active sector deep dive */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: activeS.color, fontWeight: 700, letterSpacing: "0.06em" }}>
              GLOBAL POSITION
            </div>
            <div className="t-body" style={{ fontSize: "0.9rem", fontWeight: 600, marginTop: 3 }}>
              {activeS.globalPosition}
            </div>
          </div>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{activeS.labelTh}</span>
        </div>
        <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.8125rem", lineHeight: 1.55, marginBottom: 14 }}>
          {activeS.description}
        </div>

        {/* Top stocks in sector */}
        <div className="t-micro" style={{ marginBottom: 8 }}>TOP SET STOCKS · {activeS.label.toUpperCase()}</div>
        <div style={{ display: "grid", gap: 6 }}>
          {activeS.topStocks.map(stock => (
            <div key={stock.symbol} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--line)",
              borderLeft: `3px solid ${activeS.color}`,
              padding: "10px 12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 700 }}>{stock.symbol.replace(".BK", "")}</span>
                  <span className="t-body" style={{ marginLeft: 8, color: "var(--ink)", fontSize: "0.8rem" }}>{stock.name}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: activeS.color, whiteSpace: "nowrap" }}>
                  ฿{fmtNum(stock.marketCapBn, 0)}B
                </span>
              </div>
              <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.75rem", lineHeight: 1.45 }}>
                {stock.description}
                {stock.globalNote && (
                  <span style={{ color: activeS.color, marginLeft: 6, fontWeight: 600 }}>
                    · {stock.globalNote}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global rankings strip */}
      <div style={{ padding: "14px 16px" }}>
        <div className="t-micro" style={{ marginBottom: 10 }}>WHERE THAILAND WINS · GLOBAL RANKINGS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 6 }}>
          {rankings.map(r => (
            <div key={r.category} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--line)",
              padding: "8px 10px",
              minWidth: 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: "0.85rem" }}>{r.emoji}</span>
                <RankBadge rank={r.rank} />
              </div>
              <div className="t-body" style={{ fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.2 }}>{r.category}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--bull)", marginTop: 3 }}>{r.value}</div>
              <div className="t-micro" style={{ marginTop: 3, color: "var(--dim)", textTransform: "none", letterSpacing: 0, lineHeight: 1.3 }}>{r.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 16px", borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          Data: World Bank · BoT · MOTS · MoC · NSO · ITC · Refresh annually · {profile.asOf}
        </span>
      </div>
    </div>
  );
}
