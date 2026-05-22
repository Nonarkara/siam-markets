"use client";

import { Tabs } from "@/components/Tabs/Tabs";
import { AssetClassGrid } from "@/components/Market/AssetClassGrid";
import { RegionalGrid } from "@/components/Market/RegionalGrid";
import { YieldCurvePanel } from "@/components/Market/YieldCurvePanel";
import { CorrelationMatrix } from "@/components/Market/CorrelationMatrix";
import { SectorHeatmap } from "@/components/Market/SectorHeatmap";
import { EventTimeline } from "@/components/Events/EventTimeline";
import { WorldMarketsMap } from "@/components/Market/WorldMarketsMap";
import { GrangerTable } from "@/components/Causal/GrangerTable";
import { BreaksTimeline } from "@/components/Causal/BreaksTimeline";
import { ForecastChart } from "@/components/Causal/ForecastChart";
import { SentinelPanel } from "@/components/Intelligence/SentinelPanel";
import { GistdaSectorPanel } from "@/components/Intelligence/GistdaSectorPanel";
import { WorldNewsHub } from "@/components/Intelligence/WorldNewsHub";
import { EconCalendar } from "@/components/Intelligence/EconCalendar";
import { VIXCurve } from "@/components/Market/VIXCurve";
import { ThaiCommodities } from "@/components/Market/ThaiCommodities";
import type { WorldEvent } from "@/lib/types";
import type { YahooQuote, HistoryPoint } from "@/lib/api/yahoo";
import type { MacroData } from "@/lib/api/fred";
import { MOCK_EVENTS, MOCK_STOCKS } from "@/lib/api/mock";

interface Props {
  regional: {
    thai: YahooQuote[];
    asean: YahooQuote[];
    china: YahooQuote[];
    global: YahooQuote[];
  };
  assets: YahooQuote[];
  macro: MacroData;
  events: WorldEvent[];
  us10y: number | null;
  us2y: number | null;
  histories?: Record<string, HistoryPoint[]>;
  foreignFlow?: { d5: number; d20: number };
}

function Scroller({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16 }}>
      {children}
    </div>
  );
}

export function MarketsShell({ regional, assets, macro, events, us10y, us2y, histories, foreignFlow }: Props) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 className="t-display" style={{ fontSize: "1.25rem", lineHeight: 1.1 }}>Markets</h1>
            <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
              every market that moves thailand — regional · global · macro · sectors · events
            </div>
          </div>
          <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em" }}>
            DATA · 5-MIN REVALIDATE
          </div>
        </div>
      </div>

      <div className="dashboard-page__body">
        <Tabs
          defaultId="map"
          tabs={[
            {
              id: "map",
              label: "MAP",
              badge: "WORLD",
              content: (
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 12 }}>
                  <WorldMarketsMap
                    quotes={[
                      ...regional.thai,
                      ...regional.asean,
                      ...regional.china,
                      ...regional.global,
                      ...assets,
                    ]}
                    histories={histories}
                    foreignFlow={foreignFlow}
                  />
                </div>
              ),
            },
            {
              id: "regional",
              label: "REGIONAL",
              badge: `${regional.thai.length + regional.asean.length + regional.china.length}`,
              content: (
                <Scroller>
                  <RegionalGrid
                    thai={regional.thai}
                    asean={regional.asean}
                    china={regional.china}
                    global={regional.global}
                  />
                </Scroller>
              ),
            },
            {
              id: "global",
              label: "GLOBAL",
              badge: `${assets.length}`,
              content: (
                <Scroller>
                  <AssetClassGrid assets={assets} />
                </Scroller>
              ),
            },
            {
              id: "macro",
              label: "MACRO",
              badge: "BOND · VIX",
              content: (
                <Scroller>
                  <YieldCurvePanel
                    yieldSpread={macro.yieldCurveSpread}
                    vix={macro.vix}
                    cfnai={macro.cfnai}
                    consumerSentiment={macro.consumerSentiment}
                    us10y={us10y}
                    us2y={us2y}
                  />
                </Scroller>
              ),
            },
            {
              id: "sectors",
              label: "SECTORS",
              badge: "HEATMAP",
              content: (
                <Scroller>
                  <div style={{ display: "grid", gap: 16 }}>
                    <SectorHeatmap stocks={MOCK_STOCKS} />
                    <CorrelationMatrix liveAssets={assets} />
                  </div>
                </Scroller>
              ),
            },
            {
              id: "events",
              label: "EVENTS",
              badge: `${(events.length ? events : MOCK_EVENTS).length}`,
              content: (
                <Scroller>
                  <div
                    className="card"
                    style={{
                      marginBottom: 8,
                      padding: "10px 14px",
                      background: "var(--caution-10)",
                      borderColor: "var(--caution)",
                    }}
                  >
                    <div className="t-body" style={{ color: "var(--caution)", fontSize: "0.8rem" }}>
                      Correlation, not causation. Events and market moves are shown together — not as cause and effect.
                    </div>
                  </div>
                  <EventTimeline events={events.length ? events : MOCK_EVENTS} />
                </Scroller>
              ),
            },
            {
              id: "causality",
              label: "CAUSALITY",
              badge: "GRANGER",
              content: (
                <Scroller>
                  <div style={{ display: "grid", gap: 28 }}>
                    {/* Granger causality heatmap */}
                    <GrangerTable />

                    {/* Structural breaks timeline */}
                    <div>
                      <div className="t-micro" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>
                        STRUCTURAL BREAKS · REGIME CHANGE ANNOTATED
                      </div>
                      <BreaksTimeline />
                    </div>

                    {/* 5-day forecast */}
                    <div>
                      <div className="t-micro" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>
                        SET 5-DAY PROBABILISTIC FORECAST
                      </div>
                      <ForecastChart />
                    </div>

                    {/* Methodology note */}
                    <div
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--line)",
                        borderLeft: "3px solid var(--caution)",
                        padding: "12px 14px",
                      }}
                    >
                      <div className="t-micro" style={{ color: "var(--caution)", letterSpacing: "0.14em", marginBottom: 6 }}>
                        INTERPRETATION GUIDE
                      </div>
                      <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--ink)", lineHeight: 1.6 }}>
                        <strong>Granger causality</strong> — p &lt; 0.05 means the driver reliably <em>precedes</em> SET moves at that lag.
                        It is predictive precedence, not proof of true causation. Low p + short lag (1–3d) = a potentially tradeable signal.
                      </div>
                      <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--ink)", lineHeight: 1.6, marginTop: 6 }}>
                        <strong>Structural breaks</strong> — dates when SET&apos;s statistical properties changed (mean, variance, trend).
                        GDELT events 1–7 days before each break are <em>correlated in time</em> — they help form hypotheses, not conclusions.
                      </div>
                      <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--ink)", lineHeight: 1.6, marginTop: 6 }}>
                        <strong>Forecast bands</strong> — 80% CI means the actual outcome falls inside the band 80% of the time on average.
                        Wider bands signal higher model uncertainty (e.g., high VIX regimes).
                      </div>
                    </div>
                  </div>
                </Scroller>
              ),
            },
            {
              id: "news",
              label: "WORLD NEWS",
              badge: "LIVE",
              content: (
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr", gap: 0 }} className="news-intel-layout">
                    <div style={{ overflowY: "auto", padding: 16, borderRight: "1px solid var(--line)" }}>
                      <WorldNewsHub />
                    </div>
                    <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 24 }}>
                      <EconCalendar />
                    </div>
                  </div>
                  <style>{`
                    @media (min-width: 1024px) {
                      .news-intel-layout {
                        grid-template-columns: 1.8fr 1fr !important;
                      }
                    }
                  `}</style>
                </div>
              ),
            },
            {
              id: "commodities",
              label: "COMMODITIES",
              badge: "TH",
              content: (
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr", gap: 0 }} className="comm-layout">
                    <div style={{ overflowY: "auto", padding: 16 }}>
                      <ThaiCommodities />
                    </div>
                    <div style={{ overflowY: "auto", padding: 16, borderLeft: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <VIXCurve />
                        <div className="divider" />
                        <EconCalendar compact />
                      </div>
                    </div>
                  </div>
                  <style>{`
                    @media (min-width: 1024px) {
                      .comm-layout { grid-template-columns: 1.6fr 1fr !important; }
                    }
                  `}</style>
                </div>
              ),
            },
            {
              id: "satellite",
              label: "SATELLITE",
              badge: "GISTDA·S2",
              content: (
                <Scroller>
                  <div style={{ display: "grid", gap: 32 }}>
                    {/* GISTDA sector risk signals (live portal, no key needed) */}
                    <GistdaSectorPanel />

                    {/* Sentinel-2 zone imagery metadata */}
                    <div>
                      <div className="t-micro" style={{ marginBottom: 8, letterSpacing: "0.14em" }}>
                        SENTINEL-2 · ZONE IMAGERY METADATA
                      </div>
                      <SentinelPanel />
                    </div>
                  </div>
                </Scroller>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
