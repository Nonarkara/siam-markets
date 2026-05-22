import { WorldMarketClock, type FinancialCenter } from "@/components/WorldMarketClock/WorldMarketClock";
import { SubwayStatusBar } from "@/components/Subway/SubwayStatusBar";
import { SubwayQuadrant } from "@/components/Subway/SubwayQuadrant";
import { SectorMomentum } from "@/components/Subway/SectorMomentum";
import { ForeignFlow } from "@/components/Subway/ForeignFlow";
import { DividendLeaderboard } from "@/components/Subway/DividendLeaderboard";
import { EarningsCountdown } from "@/components/Subway/EarningsCountdown";
import { CommodityMicro } from "@/components/Subway/CommodityMicro";
import { QuantumRadar } from "@/components/Intelligence/QuantumRadar";

import { VIXCurve } from "@/components/Market/VIXCurve";
import { EconCalendar } from "@/components/Intelligence/EconCalendar";
import { SentimentDivergence } from "@/components/PainPoints/SentimentDivergence";
import { PortfolioTracker } from "@/components/Portfolio/PortfolioTracker";
import { PortfolioQuadrantSummary } from "@/components/Portfolio/PortfolioQuadrantSummary";
import { TaxCalc } from "@/components/Portfolio/TaxCalc";
import { ProjectionChart } from "@/components/Portfolio/ProjectionChart";
import { MorningSignal } from "@/components/Dashboard/MorningSignal";

import { StockScannerTable } from "@/components/StockDetail/StockScannerTable";
import {
  MOCK_MACRO, MOCK_STOCKS, MOCK_SMART_MONEY_FLOWS,
  MOCK_SENTIMENT_DIVERGENCE,
} from "@/lib/api/mock";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAllRegional, fetchAssetClasses, fetchWorldCenters, WORLD_FINANCIAL_CENTERS } from "@/lib/api/yahoo";
import {
  computeMarketDNA, detectAnomalies, computeNarrativeReality,
  REGIMES, dnaSimilarity,
} from "./api/intelligence/logic";
import { QuadrantLayout } from "@/components/Quadrant/QuadrantLayout";
import { fmtNum, fmtPct, pctClass } from "@/lib/format";
import Link from "next/link";

export const revalidate = 300;

// ─── Mock earnings calendar ──────────────────────────────────────
const MOCK_EARNINGS = [
  { symbol: "PTT.BK", name: "PTT", date: "2026-05-22", sector: "ENERGY", expectedEps: 2.85, prevEps: 2.72 },
  { symbol: "SCB.BK", name: "SCB X", date: "2026-05-26", sector: "BANKING", expectedEps: 3.10, prevEps: 2.95 },
  { symbol: "AOT.BK", name: "Airports of Thailand", date: "2026-05-28", sector: "TOURISM", expectedEps: 1.45, prevEps: 1.22 },
  { symbol: "CPALL.BK", name: "CP All", date: "2026-06-02", sector: "RETAIL", expectedEps: 0.92, prevEps: 0.88 },
  { symbol: "DELTA.BK", name: "Delta Electronics", date: "2026-06-05", sector: "TECH", expectedEps: 5.20, prevEps: 4.85 },
  { symbol: "CPF.BK", name: "Charoen Pokphand Foods", date: "2026-06-09", sector: "AGRI", expectedEps: 1.15, prevEps: 0.98 },
];

export default async function DeskPage() {
  const [fearGreed, thb, macro, regional, assetClasses, worldCentersRaw] = await Promise.all([
    fetchFearGreed(), fetchThbRate(), fetchMacro(),
    fetchAllRegional(), fetchAssetClasses(), fetchWorldCenters(),
  ]);

  const worldCenters: FinancialCenter[] = worldCentersRaw.map((c, i) => {
    if (c) return c as FinancialCenter;
    const f = WORLD_FINANCIAL_CENTERS[i];
    return { id: f.id, city: f.city, flag: f.flag, lon: f.lon, tzOffset: f.tzOffset, indexLabel: f.indexLabel, price: 0, changePct: 0 };
  });

  // Intelligence computation
  const dna = computeMarketDNA(macro, fearGreed, thb, assetClasses, regional);
  const anomalies = detectAnomalies(macro, fearGreed, assetClasses, regional);
  const setChange = regional.thai[0]?.changePct ?? -0.62;
  const narrativeReality = computeNarrativeReality(setChange);

  const allMatches = REGIMES.map(r => ({
    regime: r,
    similarity: Math.round(dnaSimilarity(dna.scores, r.dna) * 100),
  })).sort((a, b) => b.similarity - a.similarity);

  const setPe = MOCK_MACRO.setPe;
  const us10y = assetClasses.find(a => a.symbol === "^TNX")?.price ?? null;
  const us2y = assetClasses.find(a => a.symbol === "^IRX")?.price ?? null;

  const bestMos = MOCK_STOCKS.reduce((best, s) => s.marginOfSafety > best.marginOfSafety ? s : best, MOCK_STOCKS[0]);
  const grahamCount = MOCK_STOCKS.filter(s => s.pe <= 15 && s.pb <= 1.5).length;

  const marketDNA = {
    dimensions: ["Value", "Momentum", "Liquid", "Sentiment", "Volatility", "Diverge"],
    scores: dna.scores,
    regime: dna.regime,
    regimeConfidence: dna.confidence,
    historicalAvg: [52, 55, 50, 50, 45, 30],
  };
  // Key assets
  const gold = assetClasses.find(a => a.symbol === "GC=F");
  const oil = assetClasses.find(a => a.symbol === "CL=F");
  const btc = assetClasses.find(a => a.symbol === "BTC-USD");
  const vixQ = assetClasses.find(a => a.symbol === "^VIX");
  const spx = regional.global.find(q => q.symbol === "^GSPC");
  const n225 = regional.global.find(q => q.symbol === "^N225");

  // Commodity micro data
  const commodityData = [
    ...(gold ? [{ symbol: "GC=F", name: "GOLD", price: gold.price, changePct: gold.changePct ?? 0, unit: "$/oz" }] : []),
    ...(oil ? [{ symbol: "CL=F", name: "WTI", price: oil.price, changePct: oil.changePct ?? 0, unit: "$/bbl" }] : []),
    { symbol: "RUBBER", name: "RUBBER", price: 58.5, changePct: 1.2, unit: "฿/kg" },
    { symbol: "SUGAR", name: "SUGAR", price: 18.4, changePct: -0.8, unit: "¢/lb" },
    ...(btc ? [{ symbol: "BTC", name: "BTC", price: btc.price, changePct: btc.changePct ?? 0, unit: "$" }] : []),
  ];

  const sortedStocks = [...MOCK_STOCKS].sort((a, b) => b.marginOfSafety - a.marginOfSafety);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          SUBWAY STATUS BAR · All lines in one scannable strip
          ═══════════════════════════════════════════════════════════════ */}
      <SubwayStatusBar
        setChange={setChange}
        setPe={setPe}
        vix={macro.vix}
        thbUsd={thb.usd}
        fearGreed={fearGreed.score}
        fedRate={macro.usFedFundsRate ?? MOCK_MACRO.fedRate}
        us10y={us10y}
        us2y={us2y}
        yieldSpread={macro.yieldCurveSpread}
        cape={MOCK_MACRO.cape}
        grahamCount={grahamCount}
        bestMos={bestMos.marginOfSafety}
        bestMosSymbol={bestMos.symbol}
        anomalyCount={anomalies.length}
        narrativeVerdict={narrativeReality?.verdict}
        macroEventsToday={3}
      />

      {/* ═══════════════════════════════════════════════════════════════
          WORLD CLOCK · Braun GMT strip
          ═══════════════════════════════════════════════════════════════ */}
      <WorldMarketClock centers={worldCenters} />

      {/* Timestamp + quadrant guide */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "3px 12px", borderBottom: "1px solid var(--line-dim)", flexShrink: 0,
      }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          PULSE = prices · BUYS = value stocks · INTEL = signals · PORTFOLIO = your money
        </span>
        <span className="t-micro" style={{ color: "var(--dim)", fontFamily: "var(--font-mono)" }}>
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <QuadrantLayout>
          {/* ═══════════════════════════════════════════════════════════════
              Q1 · PULSE LINE (GREEN) — Live market data, flows, commodities
              ═══════════════════════════════════════════════════════════════ */}
          <SubwayQuadrant title="PULSE" lineColor="var(--bull)" href="/markets" badge="LIVE">
            <div style={{ display: "flex", borderBottom: "1px solid var(--line-dim)" }}>
              <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--line-dim)" }}>
                <div className="t-micro" style={{ padding: "2px 8px", color: "var(--dim)", letterSpacing: "0.14em", fontSize: "0.4375rem" }}>REGIONAL</div>
                {[...regional.thai.slice(0, 1), ...regional.asean.slice(0, 2), ...regional.china.slice(0, 2)].map((q, i, arr) => (
                  <div key={q.symbol} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto",
                    gap: 6, alignItems: "center",
                    padding: "2px 8px",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--line-dim)" : "none",
                  }}>
                    <span className="t-body" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{q.name}</span>
                    <span className="t-mono" style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--ink)" }}>{fmtNum(q.price, 0)}</span>
                    <span className={`t-mono ${pctClass(q.changePct)}`} style={{ fontSize: "0.5rem" }}>{fmtPct(q.changePct)}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-micro" style={{ padding: "2px 8px", color: "var(--dim)", letterSpacing: "0.14em", fontSize: "0.4375rem" }}>ASSETS</div>
                {[gold, oil, btc, vixQ].filter(Boolean).map(asset => (
                  <div key={asset!.symbol} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto",
                    gap: 6, alignItems: "center",
                    padding: "2px 8px", borderBottom: "1px solid var(--line-dim)",
                  }}>
                    <span className="t-body" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{asset!.name}</span>
                    <span className="t-mono" style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--ink)" }}>
                      {asset!.price > 10000 ? `$${(asset!.price / 1000).toFixed(1)}K` : asset!.price > 100 ? `$${fmtNum(asset!.price, 1)}` : `$${fmtNum(asset!.price, 3)}`}
                    </span>
                    <span className={`t-mono ${pctClass(asset!.changePct)}`} style={{ fontSize: "0.5rem" }}>{fmtPct(asset!.changePct)}</span>
                  </div>
                ))}
                {[spx, n225].filter(Boolean).map(q => (
                  <div key={q!.symbol} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto",
                    gap: 6, alignItems: "center",
                    padding: "2px 8px", borderBottom: "1px solid var(--line-dim)",
                  }}>
                    <span className="t-body" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{q!.name}</span>
                    <span className="t-mono" style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--ink)" }}>{fmtNum(q!.price, 0)}</span>
                    <span className={`t-mono ${pctClass(q!.changePct)}`} style={{ fontSize: "0.5rem" }}>{fmtPct(q!.changePct)}</span>
                  </div>
                ))}
              </div>
            </div>
            <ForeignFlow flows={MOCK_SMART_MONEY_FLOWS} />
            <CommodityMicro commodities={commodityData} />
          </SubwayQuadrant>

          {/* ═══════════════════════════════════════════════════════════════
              Q2 · SCAN LINE (BLUE) — Value scanner, sectors, signals
              ═══════════════════════════════════════════════════════════════ */}
          <SubwayQuadrant title="SCAN" lineColor="var(--tech)" href="/scan" badge={`${grahamCount} BUYS`}>
            <StockScannerTable stocks={sortedStocks.slice(0, 8)} />
            <SectorMomentum stocks={MOCK_STOCKS.map(s => ({ symbol: s.symbol, sector: s.sector, price: s.price, changePct: (Math.random() * 4 - 1.5) }))} />
            <DividendLeaderboard stocks={MOCK_STOCKS} topN={4} />
            <EarningsCountdown earnings={MOCK_EARNINGS.slice(0, 4)} />
          </SubwayQuadrant>

          {/* ═══════════════════════════════════════════════════════════════
              Q3 · INTEL LINE (YELLOW) — AI analysis, anomalies, macro
              ═══════════════════════════════════════════════════════════════ */}
          <SubwayQuadrant title="INTEL" lineColor="var(--braun-yellow, #ffd000)" href="/events" badge={`${anomalies.length} ALERTS`}>
            {anomalies.length > 0 && (
              <div style={{
                padding: "2px 8px", background: "var(--bear-10)", borderBottom: "1px solid var(--line-dim)",
                display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center",
              }}>
                <span className="t-micro" style={{ color: "var(--bear)", fontWeight: 700, fontSize: "0.4375rem" }}>● ALERTS</span>
                {anomalies.slice(0, 2).map(a => (
                  <span key={a.id} className="t-mono" style={{ fontSize: "0.5rem", color: "var(--bear)", border: "1px solid var(--bear)", padding: "0 3px" }}>{a.title}</span>
                ))}
                {anomalies.length > 2 && <span className="t-micro" style={{ color: "var(--dim)", fontSize: "0.4375rem" }}>+{anomalies.length - 2}</span>}
              </div>
            )}
            {narrativeReality && (
              <div style={{ padding: "2px 8px", borderBottom: "1px solid var(--line-dim)", background: "var(--caution-10)" }}>
                <span className="t-micro" style={{ color: "var(--caution)", fontWeight: 700, fontSize: "0.4375rem" }}>NARRATIVE · </span>
                <span className="t-body" style={{ fontSize: "0.6875rem", color: "var(--ink)" }}>{narrativeReality.verdict}</span>
              </div>
            )}
            <div style={{ padding: "3px 8px", borderBottom: "1px solid var(--line-dim)" }}>
              <SentimentDivergence data={MOCK_SENTIMENT_DIVERGENCE} assetName="SET50" />
            </div>
            <div style={{ padding: "3px 8px", borderBottom: "1px solid var(--line-dim)" }}>
              <QuantumRadar
                dimensions={marketDNA.dimensions}
                scores={marketDNA.scores}
                historicalAvg={marketDNA.historicalAvg}
                regime={marketDNA.regime}
                confidence={marketDNA.regimeConfidence}
              />
            </div>
            <div style={{ padding: "3px 8px", borderBottom: "1px solid var(--line-dim)" }}>
              <VIXCurve compact />
            </div>
            <div style={{ padding: "3px 8px" }}>
              <EconCalendar compact />
            </div>
          </SubwayQuadrant>

          {/* ═══════════════════════════════════════════════════════════════
              Q4 · MONEY LINE (ORANGE) — Portfolio, tax, projection, learning
              ═══════════════════════════════════════════════════════════════ */}
          <SubwayQuadrant title="MONEY" lineColor="var(--caution)" href="/money">
            <div style={{ padding: "3px 8px", borderBottom: "1px solid var(--line-dim)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", fontSize: "0.4375rem" }}>DREAM PORTFOLIO</span>
                <span className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", border: "1px solid var(--braun-yellow, #ffd000)", padding: "0 3px", fontSize: "0.4375rem" }}>EDU</span>
              </div>
              <PortfolioQuadrantSummary />
            </div>
            <div style={{ padding: "3px 8px", borderBottom: "1px solid var(--line-dim)" }}>
              <PortfolioTracker />
            </div>
            <div style={{ padding: "3px 8px", borderBottom: "1px solid var(--line-dim)" }}>
              <TaxCalc />
            </div>
            <div style={{ padding: "3px 8px", borderBottom: "1px solid var(--line-dim)" }}>
              <ProjectionChart initialAmount={500_000} monthlyContribution={10_000} />
            </div>
            <div style={{ padding: "3px 8px", borderBottom: "1px solid var(--line-dim)" }}>
              <MorningSignal />
            </div>
            <div style={{ padding: "3px 8px" }}>
              <Link href="/plan" style={{ textDecoration: "none" }}>
                <div style={{ borderLeft: "2px solid var(--braun-yellow, #ffd000)", padding: "3px 8px", background: "var(--bg)" }}>
                  <span className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", fontSize: "0.4375rem" }}>RICH DAD WISDOM · </span>
                  <span className="t-body" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>Savers are losers. Build assets →</span>
                </div>
              </Link>
            </div>
          </SubwayQuadrant>
        </QuadrantLayout>
      </div>
    </>
  );
}
