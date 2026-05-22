"use client";

interface FlowDay {
  date: string;
  foreignBuy: number;
  foreignSell: number;
}

interface Props {
  flows: FlowDay[];
}

export function ForeignFlow({ flows }: Props) {
  const latest = flows[flows.length - 1];
  if (!latest) return null;

  const net = latest.foreignBuy - latest.foreignSell;
  const up = net > 0;
  const total5 = flows.slice(-5).reduce((s, d) => s + (d.foreignBuy - d.foreignSell), 0);
  const total20 = flows.slice(-20).reduce((s, d) => s + (d.foreignBuy - d.foreignSell), 0);

  const spark = flows.slice(-10);
  const maxVal = Math.max(...spark.map(d => Math.max(d.foreignBuy, d.foreignSell)), 100);

  return (
    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--line-dim)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em" }}>FOREIGN FLOW · {latest.date.slice(5)}</span>
        <span className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, color: up ? "var(--bull)" : "var(--bear)" }}>
          {up ? "+" : ""}{net.toLocaleString()}M NET {up ? "BUY" : "SELL"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 24, marginBottom: 4 }}>
        {spark.map((d, i) => {
          const n = d.foreignBuy - d.foreignSell;
          const h = Math.max(2, (Math.abs(n) / maxVal) * 24);
          return (
            <div key={i} style={{
              flex: 1,
              height: h,
              background: n > 0 ? "var(--bull)" : "var(--bear)",
              minWidth: 2,
              opacity: i === spark.length - 1 ? 1 : 0.5,
            }} />
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          5D: <span className="t-mono" style={{ color: total5 > 0 ? "var(--bull)" : "var(--bear)" }}>{total5 > 0 ? "+" : ""}{total5.toLocaleString()}M</span>
        </span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          20D: <span className="t-mono" style={{ color: total20 > 0 ? "var(--bull)" : "var(--bear)" }}>{total20 > 0 ? "+" : ""}{total20.toLocaleString()}M</span>
        </span>
      </div>
    </div>
  );
}
