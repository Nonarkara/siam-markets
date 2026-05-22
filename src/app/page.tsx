import { WorldMarketClock, type FinancialCenter } from "@/components/WorldMarketClock/WorldMarketClock";
import { SubwayStatusBar } from "@/components/Subway/SubwayStatusBar";
import { SubwayQuadrant } from "@/components/Subway/SubwayQuadrant";
import { SectorMomentum } from "@/components/Subway/SectorMomentum";
import { ForeignFlow } from "@/components/Subway/ForeignFlow";
import { DividendLeaderboard } from "@/components/Subway/DividendLeaderboard";
import { EarningsCountdown } from "@/components/Subway/EarningsCountdown";
import { CommodityMicro } from "@/components/Subway/CommodityMicro";
import { QuantumRadar } from "@/components/Intelligence/QuantumRadar";
import { AnomalyStream } from "@/components/Intelligence/AnomalyStream";
import { PatternResonance } from "@/components/Intelligence/PatternResonance";
import { NarrativeReality } from "@/components/Intelligence/NarrativeReality";
import { FlowMatrix } from "@/components/Intelligence/FlowMatrix";
import { VIXCurve } from "@/components/Market/VIXCurve";
import { EconCalendar } from "@/components/Intelligence/EconCalendar";
import { SmartMoneyTracker } from "@/components/PainPoints/SmartMoneyTracker";
import { SentimentDivergence } from "@/components/PainPoints/SentimentDivergence";
import { GammaExposureProxy } from "@/components/PainPoints/GammaExposureProxy";
import { SectorHeatmap } from "@/components/Market/SectorHeatmap";
import { RiskMetricsTable } from "@/components/Market/RiskMetricsTable";
import { PortfolioTracker } from "@/components/Portfolio/PortfolioTracker";
import { PortfolioQuadrantSummary } from "@/components/Portfolio/PortfolioQuadrantSummary";
import { TaxCalc } from "@/components/Portfolio/TaxCalc";
import { ProjectionChart } from "@/components/Portfolio/ProjectionChart";
import { MorningSignal } from "@/components/Dashboard/MorningSignal";
import { CompactTradeSignal } from "@/components/Trade/CompactTradeSignal";
import { SimulatorStatus } from "@/components/Trade/SimulatorStatus";
import { StockScannerTable } from "@/components/StockDetail/StockScannerTable";
import {
  MOCK_MACRO, MOCK_STOCKS, MOCK_SMART_MONEY_FLOWS,
  MOCK_SENTIMENT_DIVERGENCE, MOCK_GAMMA_CHAIN,
} from "@/lib/api/mock";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAllRegional, fetchAssetClasses, fetchWorldCenters, WORLD_FINANCIAL_CENTERS } from "@/lib/api/yahoo";
import {
  computeMarketDNA, detectAnomalies, computeNarrativeReality,
  computeFlowMatrix, REGIMES, dnaSimilarity,
} from "./api/intelligence/logic";
import { QuadrantLayout } from "@/components/Quadrant/QuadrantLayout";
import { fmtNum, fmtPct, pctClass, pctColor } from "@/lib/format";
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
  const flowMatrix = computeFlowMatrix(assetClasses, regional);

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
  const pattern = { bestMatch: allMatches[0].regime, similarity: allMatches[0].similarity, allMatches };

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

      <QuadrantLayout>
        {/* ═══════════════════════════════════════════════════════════════
            Q1 · PULSE LINE (GREEN) — Live market data, flows, commodities
            ═══════════════════════════════════════════════════════════════ */}
        <SubwayQuadrant title="PULSE" lineColor="var(--bull)" href="/markets" badge="LIVE">
          {/* Regional + Assets — dense dual table, no card wrappers */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--line-dim)" }}>
            {/* Regional */}
            <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--line-dim)" }}>
              <div className="t-micro" style={{ padding: "4px 10px", color: "var(--dim)", letterSpacing: "0.14em" }}>
                REGIONAL
              </div>
              {[...regional.thai.slice(0, 1), ...regional.asean.slice(0, 2), ...regional.china.slice(0, 2)].map((q, i, arr) => (
                <div key={q.symbol} style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto",
                  gap: 8, alignItems: "center",
                  padding: "3px 10px",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--line-dim)" : "none",
                  minHeight: 22,
                }}>
                  <span className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{q.name}</span>
                  <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ink)" }}>{fmtNum(q.price, 0)}</span>
                  <span className={`t-mono ${pctClass(q.changePct)}`} style={{ fontSize: "0.5625rem" }}>{fmtPct(q.changePct)}</span>
                </div>
              ))}
            </div>
            {/* Assets */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-micro" style={{ padding: "4px 10px", color: "var(--dim)", letterSpacing: "0.14em" }}>
                ASSETS
              </div>
              {[gold, oil, btc, vixQ].filter(Boolean).map(asset => (
                <div key={asset!.symbol} style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto",
                  gap: 8, alignItems: "center",
                  padding: "3px 10px",
                  borderBottom: "1px solid var(--line-dim)",
                  minHeight: 22,
                }}>
                  <span className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{asset!.name}</span>
                  <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ink)" }}>
                    {asset!.price > 10000 ? `$${(asset!.price / 1000).toFixed(1)}K` :
                     asset!.price > 100 ? `$${fmtNum(asset!.price, 1)}` : `$${fmtNum(asset!.price, 3)}`}
                  </span>
                  <span className={`t-mono ${pctClass(asset!.changePct)}`} style={{ fontSize: "0.5625rem" }}>{fmtPct(asset!.changePct)}</span>
                </div>
              ))}
              {/* Global futures */}
              {[spx, n225].filter(Boolean).map(q => (
                <div key={q!.symbol} style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto",
                  gap: 8, alignItems: "center",
                  padding: "3px 10px",
                  borderBottom: "1px solid var(--line-dim)",
                  minHeight: 22,
                }}>
                  <span className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{q!.name}</span>
                  <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--ink)" }}>{fmtNum(q!.price, 0)}</span>
                  <span className={`t-mono ${pctClass(q!.changePct)}`} style={{ fontSize: "0.5625rem" }}>{fmtPct(q!.changePct)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Foreign flow */}
          <ForeignFlow flows={MOCK_SMART_MONEY_FLOWS} />

          {/* Commodity micro */}
          <CommodityMicro commodities={commodityData} />

          {/* Smart money */}
          <div style={{ padding: "6px 10px" }}>
            <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 4 }}>
              SMART MONEY · 14D
            </div>
            <SmartMoneyTracker flows={MOCK_SMART_MONEY_FLOWS} />
          </div>
        </SubwayQuadrant>

        {/* ═══════════════════════════════════════════════════════════════
            Q2 · SCAN LINE (BLUE) — Value scanner, sectors, signals
            ═══════════════════════════════════════════════════════════════ */}
        <SubwayQuadrant title="SCAN" lineColor="var(--tech)" href="/scan" badge={`${grahamCount} BUYS`}>
          {/* Value scanner — clickable dense table with modal */}
          <StockScannerTable stocks={sortedStocks} />

          {/* Sector momentum */}
          <SectorMomentum stocks={MOCK_STOCKS.map(s => ({ symbol: s.symbol, sector: s.sector, price: s.price, changePct: (Math.random() * 4 - 1.5) }))} />

          {/* Dividend leaderboard */}
          <DividendLeaderboard stocks={MOCK_STOCKS} topN={5} />

          {/* Earnings countdown */}
          <EarningsCountdown earnings={MOCK_EARNINGS} />

          {/* Gamma + Trade signal + Risk */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>GAMMA EXPOSURE · SET50</div>
            <GammaExposureProxy chain={MOCK_GAMMA_CHAIN} underlyingName="SET50" />
          </div>

          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>TRADE SIGNAL</div>
            <CompactTradeSignal />
          </div>

          <div style={{ padding: "6px 10px" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>RISK METRICS</div>
            <RiskMetricsTable stocks={MOCK_STOCKS} topN={5} />
          </div>
        </SubwayQuadrant>

        {/* ═══════════════════════════════════════════════════════════════
            Q3 · INTEL LINE (YELLOW) — AI analysis, anomalies, macro
            ═══════════════════════════════════════════════════════════════ */}
        <SubwayQuadrant title="INTEL" lineColor="var(--braun-yellow, #ffd000)" href="/events" badge={`${anomalies.length} ALERTS`}>
          {/* Anomaly alerts — compact badges at top */}
          {anomalies.length > 0 && (
            <div style={{
              padding: "4px 10px",
              background: "var(--bear-10)",
              borderBottom: "1px solid var(--line-dim)",
              display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center",
            }}>
              <span className="t-micro" style={{ color: "var(--bear)", fontWeight: 700 }}>● ALERTS</span>
              {anomalies.slice(0, 3).map(a => (
                <span key={a.id} className="t-mono" style={{ fontSize: "0.5625rem", color: "var(--bear)", border: "1px solid var(--bear)", padding: "0 4px" }}>
                  {a.title}
                </span>
              ))}
              {anomalies.length > 3 && (
                <span className="t-micro" style={{ color: "var(--dim)" }}>+{anomalies.length - 3} more</span>
              )}
            </div>
          )}

          {/* Narrative reality one-liner */}
          {narrativeReality && (
            <div style={{
              padding: "4px 10px",
              borderBottom: "1px solid var(--line-dim)",
              background: "var(--caution-10)",
            }}>
              <span className="t-micro" style={{ color: "var(--caution)", fontWeight: 700 }}>NARRATIVE · </span>
              <span className="t-body" style={{ fontSize: "0.75rem", color: "var(--ink)" }}>
                {narrativeReality.verdict}
              </span>
            </div>
          )}

          {/* Sentiment divergence */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>SENTIMENT DIVERGENCE</div>
            <SentimentDivergence data={MOCK_SENTIMENT_DIVERGENCE} assetName="SET50" />
          </div>

          {/* Market DNA radar */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>MARKET DNA</div>
            <QuantumRadar
              dimensions={marketDNA.dimensions}
              scores={marketDNA.scores}
              historicalAvg={marketDNA.historicalAvg}
              regime={marketDNA.regime}
              confidence={marketDNA.regimeConfidence}
            />
          </div>

          {/* Pattern + Flow */}
          {pattern && (
            <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
              <PatternResonance
                bestMatch={pattern.bestMatch}
                similarity={pattern.similarity}
                allMatches={pattern.allMatches}
              />
            </div>
          )}
          {flowMatrix.length > 0 && (
            <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
              <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>CROSS-ASSET FLOW</div>
              <FlowMatrix flows={flowMatrix} />
            </div>
          )}

          {/* VIX + Econ calendar */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>VIX TERM STRUCTURE</div>
            <VIXCurve compact />
          </div>

          <div style={{ padding: "6px 10px" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>MACRO CALENDAR</div>
            <EconCalendar compact />
          </div>
        </SubwayQuadrant>

        {/* ═══════════════════════════════════════════════════════════════
            Q4 · MONEY LINE (ORANGE) — Portfolio, tax, projection, learning
            ═══════════════════════════════════════════════════════════════ */}
        <SubwayQuadrant title="MONEY" lineColor="var(--caution)" href="/money">
          {/* Dream portfolio */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em" }}>DREAM PORTFOLIO · 2020–2026</span>
              <span className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", border: "1px solid var(--braun-yellow, #ffd000)", padding: "0 4px", fontSize: "0.5rem" }}>EDU</span>
            </div>
            <PortfolioQuadrantSummary />
          </div>

          {/* Holdings */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>YOUR HOLDINGS</div>
            <PortfolioTracker />
          </div>

          {/* Tax */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>TAX CALCULATOR</div>
            <TaxCalc />
          </div>

          {/* Projection */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>10-YEAR PROJECTION</div>
            <ProjectionChart initialAmount={500_000} monthlyContribution={10_000} />
          </div>

          {/* Morning signal + Simulator */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <MorningSignal />
          </div>

          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>PAPER TRADING</div>
            <SimulatorStatus />
          </div>

          {/* Education transfer cards */}
          <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
            <Link href="/plan" style={{ textDecoration: "none" }}>
              <div style={{ borderLeft: "3px solid var(--braun-yellow, #ffd000)", padding: "6px 10px", background: "var(--bg)" }}>
                <div className="t-micro" style={{ color: "var(--braun-yellow, #ffd000)", marginBottom: 2 }}>RICH DAD WISDOM</div>
                <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>
                  Savers are losers. Inflation eats cash. Build assets →
                </div>
              </div>
            </Link>
          </div>

          <div style={{ padding: "6px 10px" }}>
            <Link href="/scan" style={{ textDecoration: "none" }}>
              <div style={{ borderLeft: "3px solid var(--bull)", padding: "6px 10px", background: "var(--bg)" }}>
                <div className="t-micro" style={{ color: "var(--bull)", marginBottom: 2 }}>MARGIN OF SAFETY · GRAHAM</div>
                <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>
                  Buy only when price is far below true value. {grahamCount} SET stocks in buy zone →
                </div>
              </div>
            </Link>
          </div>
        </SubwayQuadrant>
      </QuadrantLayout>
    </>
  );
}
