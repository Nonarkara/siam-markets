"use client";

import type { StockFundamentals } from "@/lib/types";
import { fmtNum } from "@/lib/format";

interface SectorData {
  name: string;
  stocks: string[];
  avgPct: number;     // simulated daily % from mock fundamentals
  avgPe: number;
  avgMos: number;     // average margin of safety
  bestStock: string;
}

interface Props {
  stocks: StockFundamentals[];
}

const SECTORS: Record<string, { label: string; stocks: string[] }> = {
  Energy:      { label: "ENERGY",     stocks: ["PTT.BK", "PTTGC.BK", "RATCH.BK", "GULF.BK"] },
  Banking:     { label: "BANKING",    stocks: ["KBANK.BK", "SCB.BK", "BBL.BK"] },
  Consumer:    { label: "CONSUMER",   stocks: ["CPALL.BK", "HMPRO.BK", "MINT.BK"] },
  Telecom:     { label: "TELECOM",    stocks: ["ADVANC.BK", "TRUE.BK"] },
  RealEstate:  { label: "REAL ESTATE",stocks: ["CPN.BK"] },
  Materials:   { label: "MATERIALS",  stocks: ["SCC.BK"] },
  Transport:   { label: "TRANSPORT",  stocks: ["AOT.BK"] },
};

function pctToColor(pct: number): string {
  const abs = Math.abs(pct);
  if (pct > 1.5)   return "rgba(0, 200, 150, 0.35)";
  if (pct > 0.5)   return "rgba(0, 200, 150, 0.20)";
  if (pct > 0)     return "rgba(0, 200, 150, 0.10)";
  if (pct > -0.5)  return "rgba(255, 59, 48, 0.10)";
  if (pct > -1.5)  return "rgba(255, 59, 48, 0.20)";
  return "rgba(255, 59, 48, 0.35)";
}

export function SectorHeatmap({ stocks }: Props) {
  const stockMap = new Map(stocks.map(s => [s.symbol, s]));

  const sectors: SectorData[] = Object.entries(SECTORS).map(([key, { label, stocks: symbols }]) => {
    const sectorStocks = symbols
      .map(sym => stockMap.get(sym))
      .filter((s): s is StockFundamentals => !!s);

    if (sectorStocks.length === 0) return null;

    // Simulate daily % from fundamentals proxy (defensive score vs 4 baseline)
    const avgPct = sectorStocks.reduce((sum, s) =>
      sum + (s.defensiveScore - 4) * 0.4, 0) / sectorStocks.length;

    const avgPe = sectorStocks.reduce((sum, s) => sum + s.pe, 0) / sectorStocks.length;
    const avgMos = sectorStocks.reduce((sum, s) => sum + s.marginOfSafety, 0) / sectorStocks.length;
    const bestStock = sectorStocks.reduce((best, s) =>
      s.marginOfSafety > best.marginOfSafety ? s : best, sectorStocks[0]);

    return {
      name: label,
      stocks: symbols.map(s => s.replace(".BK", "")),
      avgPct,
      avgPe: Math.round(avgPe * 10) / 10,
      avgMos: Math.round(avgMos),
      bestStock: bestStock.symbol.replace(".BK", ""),
    };
  }).filter((s): s is SectorData => s !== null);

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span className="t-micro">SET SECTOR HEATMAP</span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>By margin of safety · avg P/E</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: 1,
        background: "var(--line)",
      }}>
        {sectors.map(sector => (
          <div
            key={sector.name}
            style={{
              padding: "12px 14px",
              background: pctToColor(sector.avgMos / 10),
              minHeight: 88,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div className="t-micro" style={{ marginBottom: 4 }}>{sector.name}</div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: sector.avgMos > 15 ? "var(--bull)" : sector.avgMos > 0 ? "var(--caution)" : "var(--bear)",
              }}>
                MOS {sector.avgMos > 0 ? "+" : ""}{sector.avgMos}%
              </div>
            </div>
            <div>
              <div className="t-micro" style={{ marginTop: 6 }}>
                P/E {sector.avgPe.toFixed(1)}
              </div>
              <div className="t-micro" style={{ color: "var(--dim)", marginTop: 2 }}>
                Best: {sector.bestStock}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 16px", borderTop: "1px solid var(--line)" }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          Color intensity = Margin of Safety · Run ingestion for live daily % change
        </span>
      </div>
    </div>
  );
}
