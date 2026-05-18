import { KPIStrip } from "@/components/KPI/KPIStrip";
import { CompactMacroStrip } from "@/components/Dashboard/CompactMacroStrip";
import { DashboardGrid } from "@/components/Dashboard/DashboardGrid";
import { MOCK_MACRO, MOCK_STOCKS } from "@/lib/api/mock";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAllRegional, fetchAssetClasses } from "@/lib/api/yahoo";
import { buildSignalFeed } from "@/lib/signals";

export const revalidate = 300;

export default async function DeskPage() {
  const [fearGreed, thb, macro, regional, assetClasses] = await Promise.all([
    fetchFearGreed(),
    fetchThbRate(),
    fetchMacro(),
    fetchAllRegional(),
    fetchAssetClasses(),
  ]);

  const liveSet = regional.thai[0] ?? null;
  const setPe   = MOCK_MACRO.setPe;
  const us10y   = assetClasses.find(a => a.symbol === "^TNX")?.price ?? null;
  const us2y    = assetClasses.find(a => a.symbol === "^IRX")?.price ?? null;

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

  // Stocks sorted by MOS for scanner preview
  const sortedStocks = [...MOCK_STOCKS].sort((a, b) => b.marginOfSafety - a.marginOfSafety);

  return (
    <div style={{ paddingBottom: "var(--nav-h)" }}>
      {/* KPI strip — personalized, always visible */}
      <KPIStrip data={kpiData} />

      {/* Macro strip — all key numbers in one scrollable row */}
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

      {/* Dashboard grid — command center */}
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
  );
}
