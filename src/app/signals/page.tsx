import { MarketGraph } from "@/components/Desk/MarketGraph";
import { ForwardView } from "@/components/Intelligence/ForwardView";
import { EarthSignal } from "@/components/Intelligence/EarthSignal";

export const metadata = {
  title: "Intelligence — DayTraders",
  description: "Three AI layers: the market relationship web, TimesFM forward forecasts for every portfolio driver, and AlphaEarth satellite alt-data mapped to SET tickers.",
};

export default function SignalsPage() {
  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 16 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Intelligence</h1>
        <p className="t-body" style={{ color: "var(--muted)", maxWidth: "64ch" }}>
          Three machine layers that turn scattered data into edge. The <strong style={{ color: "var(--ink)" }}>Market Web</strong> shows how signals connect — tap a node to trace cause and effect. <strong style={{ color: "var(--ink)" }}>Forward View</strong> forecasts every driver behind your portfolio. <strong style={{ color: "var(--ink)" }}>Earth Signal</strong> reads physical activity from space and maps it to the SET names exposed to it.
        </p>
      </div>
      <MarketGraph />
      <ForwardView />
      <EarthSignal />
    </div>
  );
}
