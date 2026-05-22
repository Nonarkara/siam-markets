import { MarketsShell } from "./MarketsShell";
import { fetchAllRegional, fetchAssetClasses, fetchHistories } from "@/lib/api/yahoo";
import { fetchMacro } from "@/lib/api/fred";
import { fetchWorldEvents } from "@/lib/api/gdelt";
import { MARKET_LOCATIONS } from "@/lib/markets-map";
import { MOCK_EVENTS } from "@/lib/api/mock";

export const revalidate = 300;

export default async function MarketsPage() {
  // Symbols for sparkline/history fetch — pulled from the map's location table
  const mapSymbols = MARKET_LOCATIONS.map(l => l.symbol);

  const [regional, assets, macro, events, histories] = await Promise.all([
    fetchAllRegional(),
    fetchAssetClasses(),
    fetchMacro(),
    fetchWorldEvents(12).catch(() => MOCK_EVENTS),
    fetchHistories(mapSymbols, "6mo").catch(() => ({})),
  ]);

  const us10y = assets.find(a => a.symbol === "^TNX")?.price ?? null;
  const us2y  = assets.find(a => a.symbol === "^IRX")?.price ?? null;

  // Foreign-flow snapshot for Bangkok (home). Mocked — wire to SETSMART later.
  const foreignFlow = { d5: 180, d20: -420 };

  return (
    <MarketsShell
      regional={regional}
      assets={assets}
      macro={macro}
      events={events.length ? events : MOCK_EVENTS}
      us10y={us10y}
      us2y={us2y}
      histories={histories}
      foreignFlow={foreignFlow}
    />
  );
}
