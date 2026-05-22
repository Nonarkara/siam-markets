"use client";

interface Earning {
  symbol: string;
  name: string;
  date: string; // ISO
  sector: string;
  expectedEps?: number;
  prevEps?: number;
}

interface Props {
  earnings: Earning[];
}

function daysUntil(iso: string): number {
  return Math.round((Date.parse(iso) - Date.now()) / 86400_000);
}

function daysLabel(d: number): string {
  if (d === 0) return "TODAY";
  if (d === 1) return "1D";
  if (d < 0) return `${Math.abs(d)}D AGO`;
  return `${d}D`;
}

export function EarningsCountdown({ earnings }: Props) {
  const sorted = [...earnings]
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  if (!sorted.length) return null;

  return (
    <div style={{ borderBottom: "1px solid var(--line-dim)" }}>
      <div className="t-micro" style={{ padding: "4px 10px", color: "var(--dim)", letterSpacing: "0.14em" }}>
        EARNINGS CALENDAR
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {sorted.map((e, i) => {
          const isToday = e.days === 0;
          const isSoon = e.days >= 0 && e.days <= 3;
          return (
            <div key={e.symbol} style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 50px 60px",
              gap: 8,
              alignItems: "center",
              padding: "3px 10px",
              borderBottom: i < sorted.length - 1 ? "1px solid var(--line-dim)" : "none",
              minHeight: 24,
              background: isToday ? "var(--caution-10)" : "transparent",
            }}>
              <span className="t-mono" style={{
                fontSize: "0.5625rem",
                fontWeight: 700,
                color: isToday ? "var(--caution)" : isSoon ? "var(--tech)" : "var(--dim)",
                textAlign: "center",
              }}>
                {daysLabel(e.days)}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="t-mono" style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--ink)" }}>
                  {e.symbol.replace(".BK", "")}
                </span>
                <span className="t-micro" style={{ color: "var(--dim)", fontSize: "0.5rem" }}>
                  {e.sector}
                </span>
              </div>
              <span className="t-mono" style={{ fontSize: "0.625rem", color: "var(--muted)", textAlign: "right" }}>
                {e.expectedEps ? `E ${e.expectedEps.toFixed(2)}` : "—"}
              </span>
              <span className="t-mono" style={{ fontSize: "0.625rem", color: "var(--dim)", textAlign: "right" }}>
                {e.prevEps ? `P ${e.prevEps.toFixed(2)}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
