import { FearGreedDial } from "@/components/Market/FearGreedDial";
import { MacroPillBar } from "@/components/Market/MacroPill";
import { TopMovers } from "@/components/Market/TopMovers";
import { RegionalGrid } from "@/components/Market/RegionalGrid";
import { MOCK_MACRO, MOCK_STOCKS } from "@/lib/api/mock";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate, fetchThaiMonetary, fetchThaiRates } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAllRegional, fetchYahooQuote } from "@/lib/api/yahoo";
import { fmtNum, fmtPct, pctColor } from "@/lib/format";
import type { MacroPill } from "@/lib/types";

export const revalidate = 300;

export default async function PulsePage() {
  const [fearGreed, thb, macro, regional, botMonetary, botRates] = await Promise.all([
    fetchFearGreed(),
    fetchThbRate(),
    fetchMacro(),
    fetchAllRegional(),
    fetchThaiMonetary(),
    fetchThaiRates(),
  ]);

  const liveSet = regional.thai[0] ?? null;

  const macroPill: MacroPill = {
    fedRate: macro.usFedFundsRate  ?? MOCK_MACRO.fedRate,
    thCpi:   MOCK_MACRO.thCpi,
    setPe:   MOCK_MACRO.setPe,
    cape:    MOCK_MACRO.cape,
    thbUsd:  thb.usd,
  };

  return (
    <div className="page page-enter">
      {/* Mobile wordmark */}
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "0.875rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        color: "var(--muted)",
        marginBottom: 20,
      }}>
        SIAM MARKETS
      </div>

      {/* Hero — SET Index (live via Yahoo Finance) */}
      <div className="card" style={{ marginBottom: "var(--gap)", padding: "20px" }}>
        <div className="t-micro" style={{ marginBottom: 8 }}>SET INDEX · BANGKOK · LIVE</div>
        {liveSet ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <span className="t-mono-display" style={{ fontSize: "2.5rem", lineHeight: 1 }}>
                {fmtNum(liveSet.price, 2)}
              </span>
              <span
                className="t-mono"
                style={{ color: pctColor(liveSet.changePct), marginBottom: 6, fontSize: "1.1rem", fontWeight: 600 }}
              >
                {fmtPct(liveSet.changePct)}
              </span>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 20 }}>
              <div>
                <div className="t-micro">52W HIGH</div>
                <div className="t-mono" style={{ color: "var(--muted)", marginTop: 2 }}>
                  {fmtNum(liveSet.high52w, 2)}
                </div>
              </div>
              <div>
                <div className="t-micro">52W LOW</div>
                <div className="t-mono" style={{ color: "var(--muted)", marginTop: 2 }}>
                  {fmtNum(liveSet.low52w, 2)}
                </div>
              </div>
              <div>
                <div className="t-micro">CHANGE</div>
                <div className="t-mono" style={{ color: pctColor(liveSet.changePct), marginTop: 2 }}>
                  {liveSet.change > 0 ? "+" : ""}{fmtNum(liveSet.change, 2)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="shimmer" style={{ height: 60 }} />
        )}
      </div>

      {/* Macro pill row — live Fed rate, BOT policy/MLR when subscribed */}
      <div style={{ marginBottom: "var(--gap)" }}>
        <MacroPillBar
          data={macroPill}
          botPolicyRate={botMonetary.policyRate}
          botMlr={botRates.mlr}
        />
      </div>

      {/* Regional markets — Thai + ASEAN + China + Global tabs */}
      <div style={{ marginBottom: "var(--gap)" }}>
        <div className="t-micro" style={{ marginBottom: 8 }}>REGIONAL MARKETS · LIVE</div>
        <RegionalGrid
          thai={regional.thai}
          asean={regional.asean}
          china={regional.china}
          global={regional.global}
        />
      </div>

      {/* THB / USD */}
      <div className="card" style={{ marginBottom: "var(--gap)", padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="t-micro">THB / USD</div>
            <div className="t-micro" style={{ marginTop: 2, color: "var(--dim)" }}>
              Bank of Thailand rate · live
            </div>
          </div>
          <div className="t-mono" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            {thb.usd.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Fear & Greed — live */}
      <div style={{ marginBottom: "var(--gap)" }}>
        <FearGreedDial data={fearGreed} />
      </div>

      {/* Top movers (SET50 — mock until ingestion) */}
      <div style={{ marginBottom: "var(--gap)" }}>
        <div className="t-micro" style={{ marginBottom: 8 }}>SET50 MOVERS</div>
        <TopMovers stocks={MOCK_STOCKS} />
      </div>

      <div className="t-micro" style={{ textAlign: "center", paddingBottom: 8 }}>
        SET · ASEAN · China · US: live · SET50 movers: run ingestion for live prices
      </div>
    </div>
  );
}
