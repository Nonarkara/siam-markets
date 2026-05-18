import { KPIStrip } from "@/components/KPI/KPIStrip";
import { SignalFeed } from "@/components/KPI/SignalFeed";
import { RegionalGrid } from "@/components/Market/RegionalGrid";
import { FearGreedDial } from "@/components/Market/FearGreedDial";
import { TopMovers } from "@/components/Market/TopMovers";
import { AssetClassGrid } from "@/components/Market/AssetClassGrid";
import { YieldCurvePanel } from "@/components/Market/YieldCurvePanel";
import { SectorHeatmap } from "@/components/Market/SectorHeatmap";
import { RiskMetricsTable } from "@/components/Market/RiskMetricsTable";
import { CorrelationMatrix } from "@/components/Market/CorrelationMatrix";
import { MOCK_MACRO, MOCK_STOCKS } from "@/lib/api/mock";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAllRegional, fetchAssetClasses } from "@/lib/api/yahoo";
import { buildSignalFeed } from "@/lib/signals";
import { fmtNum, fmtPct, pctColor } from "@/lib/format";
import type { MacroPill } from "@/lib/types";

export const revalidate = 300;

export default async function PulsePage() {
  const [fearGreed, thb, macro, regional, assetClasses] = await Promise.all([
    fetchFearGreed(),
    fetchThbRate(),
    fetchMacro(),
    fetchAllRegional(),
    fetchAssetClasses(),
  ]);

  const liveSet = regional.thai[0] ?? null;
  const setPe = MOCK_MACRO.setPe;

  // Live yield data from Yahoo Finance
  const us10y = assetClasses.find(a => a.symbol === "^TNX")?.price ?? null;
  const us2y  = assetClasses.find(a => a.symbol === "^IRX")?.price ?? null;

  // Build processed signals
  const signals = buildSignalFeed({
    fearGreed,
    setPe,
    fedRate: macro.usFedFundsRate ?? MOCK_MACRO.fedRate,
    thbUsd: thb.usd,
    watchlistStocks: MOCK_STOCKS.slice(0, 3),
  });

  const bestMos = MOCK_STOCKS.reduce((best, s) =>
    s.marginOfSafety > best.marginOfSafety ? s : best, MOCK_STOCKS[0]);

  const kpiData = {
    fearGreed: fearGreed.score,
    setPe,
    fedRate: macro.usFedFundsRate ?? MOCK_MACRO.fedRate,
    thbUsd: thb.usd,
    bestMos: bestMos.marginOfSafety,
    bestMosSymbol: bestMos.symbol,
    grahamStocks: MOCK_STOCKS.filter(s => s.pe <= 15 && s.pb <= 1.5).length,
    cape: MOCK_MACRO.cape,
  };

  // Section divider helper
  const Divider = ({ label }: { label: string }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "20px 0 8px",
    }}>
      <div className="t-micro" style={{ color: "var(--dim)", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );

  return (
    <div style={{ paddingBottom: "var(--nav-h)" }}>
      {/* KPI strip */}
      <KPIStrip data={kpiData} />

      <div className="page page-enter" style={{ paddingTop: 16 }}>

        {/* ── SET Hero ─────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "var(--gap)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="t-micro" style={{ marginBottom: 6 }}>SET INDEX · LIVE</div>
              {liveSet ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                  <span className="t-mono-display" style={{ fontSize: "2.25rem", lineHeight: 1 }}>
                    {fmtNum(liveSet.price, 2)}
                  </span>
                  <span className="t-mono" style={{ color: pctColor(liveSet.changePct), marginBottom: 4, fontSize: "1.1rem", fontWeight: 600 }}>
                    {fmtPct(liveSet.changePct)}
                  </span>
                </div>
              ) : (
                <div className="shimmer" style={{ height: 40, width: 180 }} />
              )}
            </div>
            {liveSet && (
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { label: "52W HIGH", value: fmtNum(liveSet.high52w, 2) },
                  { label: "52W LOW",  value: fmtNum(liveSet.low52w, 2)  },
                ].map(item => (
                  <div key={item.label}>
                    <div className="t-micro">{item.label}</div>
                    <div className="t-mono" style={{ color: "var(--muted)", marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Macro strip */}
          <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
            {[
              { label: "FED",    value: `${(macro.usFedFundsRate ?? MOCK_MACRO.fedRate).toFixed(2)}%` },
              { label: "10Y",    value: us10y ? `${us10y.toFixed(3)}%` : "—" },
              { label: "2Y",     value: us2y  ? `${us2y.toFixed(3)}%`  : "—" },
              { label: "SPREAD", value: us10y && us2y ? `${(us10y - us2y) > 0 ? "+" : ""}${(us10y - us2y).toFixed(2)}%` : macro.yieldCurveSpread != null ? `${macro.yieldCurveSpread > 0 ? "+" : ""}${macro.yieldCurveSpread.toFixed(2)}%` : "—" },
              { label: "VIX",    value: macro.vix ? macro.vix.toFixed(1) : "—" },
              { label: "THB",    value: thb.usd.toFixed(2) },
              { label: "SET P/E",value: setPe.toFixed(1) },
              { label: "F&G",    value: `${fearGreed.score}/100` },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                <span className="t-micro">{item.label}</span>
                <span className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Signal Intelligence ───────────────────────────────── */}
        <Divider label="SIGNAL INTELLIGENCE" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <SignalFeed signals={signals} maxVisible={3} />
        </div>

        {/* ── Global Asset Classes ──────────────────────────────── */}
        <Divider label="GLOBAL ASSET CLASSES" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <AssetClassGrid assets={assetClasses} />
        </div>

        {/* ── Regional Markets ──────────────────────────────────── */}
        <Divider label="REGIONAL MARKETS" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <RegionalGrid
            thai={regional.thai}
            asean={regional.asean}
            china={regional.china}
            global={regional.global}
          />
        </div>

        {/* ── Recession + Volatility Indicators ────────────────── */}
        <Divider label="RECESSION + VOLATILITY INDICATORS" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <YieldCurvePanel
            yieldSpread={macro.yieldCurveSpread}
            vix={macro.vix}
            cfnai={macro.cfnai}
            consumerSentiment={macro.consumerSentiment}
            us10y={us10y}
            us2y={us2y}
          />
        </div>

        {/* ── SET Sector Heatmap ────────────────────────────────── */}
        <Divider label="SET SECTOR ANALYSIS" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <SectorHeatmap stocks={MOCK_STOCKS} />
        </div>

        {/* ── Correlation Matrix ────────────────────────────────── */}
        <Divider label="SET CORRELATION WITH WORLD" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <CorrelationMatrix liveAssets={assetClasses} />
        </div>

        {/* ── Risk-Adjusted Performance ─────────────────────────── */}
        <Divider label="RISK-ADJUSTED PERFORMANCE · SET50" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <RiskMetricsTable stocks={MOCK_STOCKS} />
        </div>

        {/* ── Fear & Greed ──────────────────────────────────────── */}
        <Divider label="SENTIMENT" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <FearGreedDial data={fearGreed} />
        </div>

        {/* ── Top Movers ────────────────────────────────────────── */}
        <Divider label="SET50 MOVERS" />
        <div style={{ marginBottom: "var(--gap)" }}>
          <TopMovers stocks={MOCK_STOCKS} />
        </div>

        <div className="t-micro" style={{ textAlign: "center", paddingBottom: 8, color: "var(--dim)" }}>
          Live: SET · ASEAN · Commodities · Bonds · Crypto · FRED macro · Run ingestion for live SET50 fundamentals
        </div>
      </div>
    </div>
  );
}
