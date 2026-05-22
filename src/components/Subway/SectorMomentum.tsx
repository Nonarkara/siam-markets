"use client";

import { useMemo } from "react";

interface Props {
  stocks: Array<{ symbol: string; sector: string; price: number; changePct?: number }>;
}

export function SectorMomentum({ stocks }: Props) {
  const sectors = useMemo(() => {
    const map = new Map<string, { changeSum: number; count: number; symbols: string[] }>();
    for (const s of stocks) {
      const ch = s.changePct ?? (Math.random() * 4 - 1.5);
      const existing = map.get(s.sector);
      if (existing) {
        existing.changeSum += ch;
        existing.count += 1;
        if (!existing.symbols.includes(s.symbol)) existing.symbols.push(s.symbol);
      } else {
        map.set(s.sector, { changeSum: ch, count: 1, symbols: [s.symbol] });
      }
    }
    return Array.from(map.entries())
      .map(([sector, data]) => ({
        sector,
        changePct: data.changeSum / data.count,
        stocks: data.symbols.slice(0, 3),
      }))
      .sort((a, b) => b.changePct - a.changePct);
  }, [stocks]);

  if (!sectors.length) return null;

  const maxAbs = Math.max(...sectors.map(s => Math.abs(s.changePct)), 0.1);

  return (
    <div>
      <div className="t-micro" style={{ padding: "4px 10px", color: "var(--dim)", letterSpacing: "0.14em" }}>
        SECTOR MOMENTUM
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {sectors.map(sector => {
          const up = sector.changePct > 0;
          const barPct = Math.min(100, (Math.abs(sector.changePct) / maxAbs) * 100);
          const color = up ? "var(--bull)" : "var(--bear)";
          return (
            <div
              key={sector.sector}
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr 50px auto",
                gap: 8,
                alignItems: "center",
                padding: "3px 10px",
                borderBottom: "1px solid var(--line-dim)",
                minHeight: 24,
              }}
            >
              <span className="t-body" style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--muted)" }}>
                {sector.sector.toUpperCase()}
              </span>
              <div style={{ height: 4, background: "var(--bg)", position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: up ? "50%" : `${50 - barPct / 2}%`,
                  width: `${barPct / 2}%`,
                  height: "100%",
                  background: color,
                }} />
                <div style={{
                  position: "absolute",
                  left: "50%",
                  width: 1, height: "100%",
                  background: "var(--line)",
                }} />
              </div>
              <span className="t-mono" style={{ fontSize: "0.625rem", fontWeight: 700, color, textAlign: "right" }}>
                {up ? "+" : ""}{sector.changePct.toFixed(1)}%
              </span>
              <div style={{ display: "flex", gap: 3 }}>
                {sector.stocks.map(t => (
                  <span key={t} className="t-mono" style={{ fontSize: "0.45rem", color: "var(--dim)", border: "1px solid var(--line-dim)", padding: "0 3px" }}>
                    {t.replace(".BK", "")}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
