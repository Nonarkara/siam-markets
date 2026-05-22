"use client";

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  unit: string;
}

interface Props {
  commodities: Commodity[];
}

export function CommodityMicro({ commodities }: Props) {
  if (!commodities.length) return null;

  return (
    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
      <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 4 }}>
        COMMODITIES
      </div>
      <div style={{ display: "flex", gap: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {commodities.map(c => {
          const up = c.changePct > 0;
          return (
            <div key={c.symbol} style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 70 }}>
              <span className="t-body" style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--muted)" }}>{c.name}</span>
              <span className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>
                {c.price > 1000 ? c.price.toLocaleString() : c.price.toFixed(2)}
              </span>
              <span className="t-mono" style={{ fontSize: "0.5625rem", color: up ? "var(--bull)" : "var(--bear)" }}>
                {up ? "+" : ""}{c.changePct.toFixed(1)}%
              </span>
              <span className="t-micro" style={{ fontSize: "0.45rem", color: "var(--dim)" }}>{c.unit}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
