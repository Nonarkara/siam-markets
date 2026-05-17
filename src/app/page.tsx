import { KPIStrip } from "@/components/KPI/KPIStrip";
import { SignalFeed } from "@/components/KPI/SignalFeed";
import { RegionalGrid } from "@/components/Market/RegionalGrid";
import { FearGreedDial } from "@/components/Market/FearGreedDial";
import { TopMovers } from "@/components/Market/TopMovers";
import { MOCK_MACRO, MOCK_STOCKS } from "@/lib/api/mock";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate, fetchThaiMonetary, fetchThaiRates } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAllRegional } from "@/lib/api/yahoo";
import { buildSignalFeed } from "@/lib/signals";
import { fmtNum, fmtPct, pctColor } from "@/lib/format";
import type { MacroPill } from "@/lib/types";

export const revalidate = 300;

export default async function PulsePage() {
  const [fearGreed, thb, macro, regional] = await Promise.all([
    fetchFearGreed(),
    fetchThbRate(),
    fetchMacro(),
    fetchAllRegional(),
  ]);

  const liveSet = regional.thai[0] ?? null;
  const setPe = MOCK_MACRO.setPe;

  // Build processed signals — highest value items first
  const signals = buildSignalFeed({
    fearGreed,
    setPe,
    fedRate: macro.usFedFundsRate ?? MOCK_MACRO.fedRate,
    thbUsd: thb.usd,
    watchlistStocks: MOCK_STOCKS.slice(0, 3),
  });

  // Best margin of safety from SET50 mock
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

  return (
    <div style={{ paddingBottom: "var(--nav-h)" }}>
      {/* KPI strip — always visible, personalized */}
      <KPIStrip data={kpiData} />

      <div className="page page-enter" style={{ paddingTop: 16 }}>

        {/* SET Index hero */}
        <div className="card" style={{ marginBottom: "var(--gap)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="t-micro" style={{ marginBottom: 6 }}>SET INDEX · LIVE</div>
              {liveSet ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                  <span className="t-mono-display" style={{ fontSize: "2.25rem", lineHeight: 1 }}>
                    {fmtNum(liveSet.price, 2)}
                  </span>
                  <span className="t-mono" style={{
                    color: pctColor(liveSet.changePct),
                    marginBottom: 4,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}>
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

          {/* Macro strip — single dense line */}
          <div style={{
            display: "flex",
            gap: 16,
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--line)",
            flexWrap: "wrap",
          }}>
            {[
              { label: "FED",    value: `${(macro.usFedFundsRate ?? MOCK_MACRO.fedRate).toFixed(2)}%` },
              { label: "THB",    value: thb.usd.toFixed(2) },
              { label: "SET P/E",value: setPe.toFixed(1) },
              { label: "CAPE",   value: MOCK_MACRO.cape.toFixed(1) },
              { label: "F&G",    value: `${fearGreed.score}/100` },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                <span className="t-micro">{item.label}</span>
                <span className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signal feed — Bloomberg-style intelligence */}
        <div style={{ marginBottom: "var(--gap)" }}>
          <SignalFeed signals={signals} maxVisible={3} />
        </div>

        {/* Regional markets */}
        <div style={{ marginBottom: "var(--gap)" }}>
          <div className="t-micro" style={{ marginBottom: 8 }}>REGIONAL MARKETS · LIVE</div>
          <RegionalGrid
            thai={regional.thai}
            asean={regional.asean}
            china={regional.china}
            global={regional.global}
          />
        </div>

        {/* Fear & Greed dial */}
        <div style={{ marginBottom: "var(--gap)" }}>
          <FearGreedDial data={fearGreed} />
        </div>

        {/* Top movers */}
        <div style={{ marginBottom: "var(--gap)" }}>
          <div className="t-micro" style={{ marginBottom: 8 }}>SET50 — TOP MOVERS</div>
          <TopMovers stocks={MOCK_STOCKS} />
        </div>

        <div className="t-micro" style={{ textAlign: "center", paddingBottom: 8, color: "var(--dim)" }}>
          KPIs update with market data · Run ingestion scripts for live SET50 prices
        </div>
      </div>
    </div>
  );
}
