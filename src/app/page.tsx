import { KPIStrip } from "@/components/KPI/KPIStrip";
import { MorningSignal } from "@/components/Dashboard/MorningSignal";
import { CompactMacroStrip } from "@/components/Dashboard/CompactMacroStrip";
import { DashboardGrid } from "@/components/Dashboard/DashboardGrid";
import { MOCK_MACRO, MOCK_STOCKS } from "@/lib/api/mock";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAllRegional, fetchAssetClasses } from "@/lib/api/yahoo";
import { buildSignalFeed } from "@/lib/signals";
import { QuantumRadar } from "@/components/Intelligence/QuantumRadar";
import { AnomalyStream } from "@/components/Intelligence/AnomalyStream";
import { PatternResonance } from "@/components/Intelligence/PatternResonance";
import { NarrativeReality } from "@/components/Intelligence/NarrativeReality";
import { FlowMatrix } from "@/components/Intelligence/FlowMatrix";
import { ParticleField } from "@/components/Intelligence/ParticleField";
import {
  computeMarketDNA,
  detectAnomalies,
  computeNarrativeReality,
  computeFlowMatrix,
  REGIMES,
  dnaSimilarity,
} from "./api/intelligence/logic";
import { ThailandPanel } from "@/components/Thailand/ThailandPanel";
import { fetchThaiGdpHistory, THAILAND_PROFILE, THAI_SECTORS, THAILAND_GLOBAL_RANKINGS } from "@/lib/api/thailand-economy";
import { DigitalEconomyPanel } from "@/components/Thailand/DigitalEconomyPanel";
import {
  THAILAND_DIGITAL_KPIS, THAI_DIGITAL_STACK, DIGITAL_MARKETS,
  fetchGlobalAIQuotes,
} from "@/lib/api/thailand-digital";

export const revalidate = 300;

export default async function DeskPage() {
  const [fearGreed, thb, macro, regional, assetClasses, thaiGdpHistory, globalAi] = await Promise.all([
    fetchFearGreed(),
    fetchThbRate(),
    fetchMacro(),
    fetchAllRegional(),
    fetchAssetClasses(),
    fetchThaiGdpHistory(1980),
    fetchGlobalAIQuotes(),
  ]);

  // Compute intelligence directly on the server
  const dna = computeMarketDNA(macro, fearGreed, thb, assetClasses, regional);
  const anomalies = detectAnomalies(macro, fearGreed, assetClasses, regional);
  const setChange = regional.thai[0]?.changePct ?? -0.62;
  const narrativeReality = computeNarrativeReality(setChange);
  const flowMatrix = computeFlowMatrix(assetClasses, regional);

  const allMatches = REGIMES.map(r => ({
    regime: r,
    similarity: Math.round(dnaSimilarity(dna.scores, r.dna) * 100),
  })).sort((a, b) => b.similarity - a.similarity);

  const liveSet = regional.thai[0] ?? null;
  const setPe = MOCK_MACRO.setPe;
  const us10y = assetClasses.find(a => a.symbol === "^TNX")?.price ?? null;
  const us2y = assetClasses.find(a => a.symbol === "^IRX")?.price ?? null;

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

  const sortedStocks = [...MOCK_STOCKS].sort((a, b) => b.marginOfSafety - a.marginOfSafety);

  const marketDNA = {
    dimensions: ["Value", "Momentum", "Liquid", "Sentiment", "Volatility", "Diverge"],
    scores: dna.scores,
    regime: dna.regime,
    regimeConfidence: dna.confidence,
    historicalAvg: [52, 55, 50, 50, 45, 30],
  };
  const pattern = {
    bestMatch: allMatches[0].regime,
    similarity: allMatches[0].similarity,
    allMatches,
  };
  const narrative = narrativeReality;
  const flows = flowMatrix;

  return (
    <div style={{ paddingBottom: "var(--nav-h)", position: "relative" }}>
      {/* Ambient particle background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <ParticleField />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* KPI strip — always visible */}
        <KPIStrip data={kpiData} />

        {/* Macro strip */}
        <CompactMacroStrip
          fedRate={macro.usFedFundsRate ?? MOCK_MACRO.fedRate}
          us10y={us10y}
          us2y={us2y}
          yieldSpread={macro.yieldCurveSpread}
          vix={macro.vix}
          thbUsd={thb.usd}
          setPe={setPe}
          cape={MOCK_MACRO.cape}
          fgScore={fearGreed.score}
        />

        {/* ─── INTELLIGENCE COMMAND CENTER ───────────────────────── */}
        <div className="page page-enter" style={{ paddingTop: 20 }}>
          {/* Section header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}>
              <div style={{
                width: 8,
                height: 8,
                background: "var(--tech)",
                boxShadow: "0 0 8px var(--tech-glow)",
              }} />
              <span className="t-future" style={{ color: "var(--tech)", letterSpacing: "0.15em" }}>
                Market Intelligence Engine
              </span>
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "var(--dim)",
              paddingLeft: 18,
            }}>
              Pattern recognition · Anomaly detection · Narrative analysis
            </div>
          </div>

          {/* Desktop: 2-column grid | Mobile: single column */}
          <div style={{
            display: "grid",
            gap: "var(--gap)",
          }} className="intel-grid">
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
              {/* Market DNA Radar */}
              <div className="card--glow" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "100%", marginBottom: 12 }}>
                  <span className="t-micro" style={{ color: "var(--tech)" }}>MARKET DNA · 6-AXIS FINGERPRINT</span>
                </div>
                <QuantumRadar
                  dimensions={marketDNA.dimensions}
                  scores={marketDNA.scores}
                  historicalAvg={marketDNA.historicalAvg}
                  regime={marketDNA.regime}
                  confidence={marketDNA.regimeConfidence}
                />
              </div>

              {/* Pattern Resonance */}
              {pattern && (
                <div className="card--glow">
                  <PatternResonance
                    bestMatch={pattern.bestMatch}
                    similarity={pattern.similarity}
                    allMatches={pattern.allMatches}
                  />
                </div>
              )}

              {/* Flow Matrix */}
              {flows.length > 0 && (
                <div className="card--glow">
                  <div className="t-micro" style={{ marginBottom: 10, color: "var(--violet)" }}>
                    CROSS-ASSET FLOW MATRIX
                  </div>
                  <FlowMatrix flows={flows} />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
              {/* Anomaly Stream */}
              <div className="card--glow">
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}>
                  <span className="t-micro" style={{ color: "var(--bear)" }}>
                    ANOMALY DETECTION
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: anomalies.length > 0 ? "var(--bear)" : "var(--dim)",
                    border: `1px solid ${anomalies.length > 0 ? "var(--bear)" : "var(--line)"}`,
                    padding: "1px 5px",
                  }}>
                    {anomalies.length} ALERT{anomalies.length !== 1 ? "S" : ""}
                  </span>
                </div>
                <AnomalyStream anomalies={anomalies} />
              </div>

              {/* Narrative Reality Check */}
              {narrative && (
                <div className="card--glow">
                  <NarrativeReality
                    topic={narrative.topic}
                    narrativeTone={narrative.narrativeTone}
                    narrativeVolume={narrative.narrativeVolume}
                    measuredValue={narrative.measuredValue}
                    measuredContext={narrative.measuredContext}
                    verdict={narrative.verdict}
                    verdictColor={narrative.verdictColor}
                  />
                </div>
              )}

              {/* Morning Signal */}
              <div className="card--glow">
                <MorningSignal />
              </div>
            </div>
          </div>

          {/* ─── THAILAND ECONOMY ─────────────────────────────── */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 8,
                height: 8,
                background: "var(--caution)",
                boxShadow: "0 0 8px rgba(255,149,0,0.6)",
              }} />
              <span className="t-future" style={{ color: "var(--caution)", letterSpacing: "0.15em" }}>
                🇹🇭 Thailand — The Economy Behind The Market
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--dim)", paddingLeft: 18, marginBottom: 12 }}>
              GDP growth · Tourism · Medical tourism · Agriculture · Global rankings
            </div>
            <ThailandPanel
              gdpHistory={thaiGdpHistory}
              profile={THAILAND_PROFILE}
              sectors={THAI_SECTORS}
              rankings={THAILAND_GLOBAL_RANKINGS}
            />
          </div>

          {/* ─── DIGITAL ECONOMY × AI ────────────────────────────── */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 8,
                height: 8,
                background: "#a78bfa",
                boxShadow: "0 0 8px rgba(167,139,250,0.6)",
              }} />
              <span className="t-future" style={{ color: "#a78bfa", letterSpacing: "0.15em" }}>
                ⚡ Digital Economy × AI — Thailand to The World
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--dim)", paddingLeft: 18, marginBottom: 12 }}>
              Thai digital stack · Global AI mega-caps · Market scale comparison
            </div>
            <DigitalEconomyPanel
              kpis={THAILAND_DIGITAL_KPIS}
              thaiStack={THAI_DIGITAL_STACK}
              globalAi={globalAi}
              markets={DIGITAL_MARKETS}
            />
          </div>

          {/* Legacy dashboard grid below intelligence */}
          <div style={{ marginTop: 24 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}>
              <div style={{
                width: 8,
                height: 8,
                background: "var(--bull)",
                boxShadow: "0 0 8px var(--bull-glow)",
              }} />
              <span className="t-future" style={{ color: "var(--bull)", letterSpacing: "0.15em" }}>
                Market Data Feed
              </span>
            </div>
            <DashboardGrid
              liveSet={liveSet}
              fearGreed={fearGreed}
              assetClasses={assetClasses}
              regionalAsean={regional.asean}
              regionalChina={regional.china}
              signals={signals}
              topStocks={sortedStocks}
              yieldSpread={macro.yieldCurveSpread ?? (us10y && us2y ? us10y - us2y : null)}
              vix={macro.vix}
              cfnai={macro.cfnai}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
