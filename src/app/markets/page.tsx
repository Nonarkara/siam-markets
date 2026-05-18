import { LiveTVGrid } from "@/components/TV/LiveTVGrid";
import { AssetClassGrid } from "@/components/Market/AssetClassGrid";
import { RegionalGrid } from "@/components/Market/RegionalGrid";
import { YieldCurvePanel } from "@/components/Market/YieldCurvePanel";
import { CorrelationMatrix } from "@/components/Market/CorrelationMatrix";
import { SectorHeatmap } from "@/components/Market/SectorHeatmap";
import { EventTimeline } from "@/components/Events/EventTimeline";
import { fetchAllRegional, fetchAssetClasses } from "@/lib/api/yahoo";
import { fetchMacro } from "@/lib/api/fred";
import { fetchWorldEvents } from "@/lib/api/gdelt";
import { MOCK_EVENTS, MOCK_STOCKS } from "@/lib/api/mock";

export const revalidate = 300;

export default async function MarketsPage() {
  const [regional, assets, macro, events] = await Promise.all([
    fetchAllRegional(),
    fetchAssetClasses(),
    fetchMacro(),
    fetchWorldEvents(12).catch(() => MOCK_EVENTS),
  ]);

  const us10y = assets.find(a => a.symbol === "^TNX")?.price ?? null;
  const us2y  = assets.find(a => a.symbol === "^IRX")?.price ?? null;

  const Divider = ({ label }: { label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 8px" }}>
      <div className="t-micro" style={{ color: "var(--dim)", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );

  return (
    <div className="page page-enter" style={{ paddingTop: 16 }}>
      <div className="t-display" style={{ marginBottom: 4 }}>Markets</div>
      <div className="t-body" style={{ color: "var(--muted)", marginBottom: 20 }}>
        Every market that moves Thailand — regional, global, commodities, bonds, crypto.
      </div>

      <Divider label="LIVE FINANCIAL TV" />
      <div style={{ marginBottom: 16 }}>
        <LiveTVGrid />
      </div>

      <Divider label="REGIONAL MARKETS · LIVE" />
      <div style={{ marginBottom: 16 }}>
        <RegionalGrid thai={regional.thai} asean={regional.asean} china={regional.china} global={regional.global} />
      </div>

      <Divider label="GLOBAL ASSET CLASSES · LIVE" />
      <div style={{ marginBottom: 16 }}>
        <AssetClassGrid assets={assets} />
      </div>

      <Divider label="RECESSION + VOLATILITY INDICATORS" />
      <div style={{ marginBottom: 16 }}>
        <YieldCurvePanel
          yieldSpread={macro.yieldCurveSpread}
          vix={macro.vix}
          cfnai={macro.cfnai}
          consumerSentiment={macro.consumerSentiment}
          us10y={us10y}
          us2y={us2y}
        />
      </div>

      <Divider label="SET SECTOR HEATMAP" />
      <div style={{ marginBottom: 16 }}>
        <SectorHeatmap stocks={MOCK_STOCKS} />
      </div>

      <Divider label="SET CORRELATION WITH WORLD" />
      <div style={{ marginBottom: 16 }}>
        <CorrelationMatrix liveAssets={assets} />
      </div>

      <Divider label="WORLD × MARKETS — EVENTS" />
      <div style={{ marginBottom: 4 }}>
        <div className="card" style={{ marginBottom: 8, padding: "10px 14px", background: "var(--caution-10)", borderColor: "var(--caution)" }}>
          <div className="t-body" style={{ color: "var(--caution)", fontSize: "0.8rem" }}>
            Correlation, not causation. Events and market moves are shown together — not as cause and effect.
          </div>
        </div>
        <EventTimeline events={events.length ? events : MOCK_EVENTS} />
      </div>
    </div>
  );
}
