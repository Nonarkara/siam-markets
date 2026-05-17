"use client";

import type { IndexQuote } from "@/lib/types";
import { fmtNum, fmtPct, pctClass } from "@/lib/format";

interface Props {
  quote: IndexQuote;
  hero?: boolean;  // true = large hero card for SET
}

export function IndexCard({ quote, hero = false }: Props) {
  const isPositive = quote.changePct >= 0;
  const color = isPositive ? "var(--bull)" : "var(--bear)";

  if (hero) {
    return (
      <div className="card" style={{ padding: "20px" }}>
        <div className="t-micro" style={{ marginBottom: 8 }}>SET INDEX · BANGKOK</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <span className="t-mono-display" style={{ fontSize: "2.5rem", lineHeight: 1 }}>
            {fmtNum(quote.price, 2)}
          </span>
          <span
            className="t-mono"
            style={{ color, marginBottom: 6, fontSize: "1.1rem", fontWeight: 600 }}
          >
            {fmtPct(quote.changePct)}
          </span>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 20 }}>
          <div>
            <div className="t-micro">52W HIGH</div>
            <div className="t-mono" style={{ color: "var(--muted)", marginTop: 2 }}>
              {fmtNum(quote.high52w, 2)}
            </div>
          </div>
          <div>
            <div className="t-micro">52W LOW</div>
            <div className="t-mono" style={{ color: "var(--muted)", marginTop: 2 }}>
              {fmtNum(quote.low52w, 2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card scroll-row-item"
      style={{ minWidth: 130, padding: "14px 16px" }}
    >
      <div className="t-micro" style={{ marginBottom: 6 }}>{quote.name}</div>
      <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 600 }}>
        {fmtNum(quote.price, 0)}
      </div>
      <div
        className={`t-mono ${pctClass(quote.changePct)}`}
        style={{ fontSize: "0.75rem", marginTop: 4 }}
      >
        {fmtPct(quote.changePct)}
      </div>
    </div>
  );
}
