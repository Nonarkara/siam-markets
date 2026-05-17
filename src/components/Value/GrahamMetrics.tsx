"use client";

import type { StockFundamentals } from "@/lib/types";
import { safetyZone, safetyLabel, moatLabel, moatColor, buffettGrade, buffettGradeLabel, defensiveRating } from "@/lib/graham";
import { fmtNum, fmtThb } from "@/lib/format";

interface Props {
  stock: StockFundamentals;
  onClose?: () => void;
}

function MetricRow({ label, value, color, note }: {
  label: string; value: string; color?: string; note?: string;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid var(--line)",
    }}>
      <div>
        <div className="t-body" style={{ color: "var(--muted)" }}>{label}</div>
        {note && <div className="t-micro" style={{ marginTop: 2 }}>{note}</div>}
      </div>
      <div className="t-mono" style={{ fontWeight: 600, color: color ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

export function GrahamMetrics({ stock, onClose }: Props) {
  const zone = safetyZone(stock.marginOfSafety);
  const mosColor =
    zone === "strong"     ? "var(--bull)" :
    zone === "moderate"   ? "var(--bull)" :
    zone === "thin"       ? "var(--caution)" :
    "var(--bear)";

  const peColor = stock.pe <= 15 ? "var(--bull)" : stock.pe <= 18 ? "var(--caution)" : "var(--bear)";
  const pbColor = stock.pb <= 1.5 ? "var(--bull)" : stock.pb <= 3 ? "var(--caution)" : "var(--bear)";
  const roeColor = stock.roe >= 15 ? "var(--bull)" : stock.roe >= 10 ? "var(--caution)" : "var(--bear)";

  const bGrade = buffettGrade(stock.buffettScore);
  const dRating = defensiveRating(stock.defensiveScore);

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "16px", display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", borderBottom: "1px solid var(--line)",
        background: "var(--bg-surface)",
      }}>
        <div>
          <div className="t-mono" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            {stock.symbol.replace(".BK", "")}
          </div>
          <div className="t-body" style={{ color: "var(--muted)", marginTop: 2 }}>
            {stock.name} · {stock.sector}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-mono" style={{ fontSize: "1.25rem" }}>
            ฿{fmtNum(stock.price, 2)}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "var(--muted)",
                cursor: "pointer", fontSize: "0.75rem", marginTop: 4, padding: 0,
              }}
            >
              CLOSE ×
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {/* Graham Number + MOS */}
        <div style={{ padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
          <div className="t-micro">GRAHAM FAIR VALUE CEILING</div>
          <div style={{ display: "flex", gap: 24, marginTop: 8, alignItems: "flex-end" }}>
            <div>
              <div className="t-mono" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                ฿{fmtNum(stock.grahamNumber, 2)}
              </div>
              <div className="t-micro">√(22.5 × EPS × BVPS)</div>
            </div>
            <div>
              <div className="t-mono" style={{ fontSize: "1.25rem", color: mosColor, fontWeight: 700 }}>
                {stock.marginOfSafety > 0 ? "+" : ""}{fmtNum(stock.marginOfSafety, 1)}%
              </div>
              <div className="t-micro">{safetyLabel(zone)}</div>
            </div>
          </div>
          <div className="t-body" style={{ color: "var(--muted)", marginTop: 8, fontSize: "0.8rem" }}>
            {stock.marginOfSafety >= 30
              ? "Price is well below Graham&apos;s fair value. Strong buy signal by his framework."
              : stock.marginOfSafety >= 15
              ? "Price is moderately below Graham&apos;s ceiling. Acceptable for defensive investors."
              : stock.marginOfSafety >= 0
              ? "Price is near Graham&apos;s fair value. Little safety margin — wait for a better price."
              : "Price is above Graham&apos;s calculated fair value. No margin of safety."
            }
          </div>
        </div>

        {/* Core metrics */}
        <MetricRow label="P/E Ratio" value={fmtNum(stock.pe, 1)} color={peColor}
          note={stock.pe <= 15 ? "Graham says: ≤15 is fair" : "Graham prefers ≤15"} />
        <MetricRow label="P/B Ratio" value={fmtNum(stock.pb, 2)} color={pbColor}
          note={stock.pb <= 1.5 ? "Graham says: ≤1.5 is ideal" : "Graham prefers ≤1.5"} />
        <MetricRow label="ROE (5yr avg)" value={`${fmtNum(stock.roe, 1)}%`} color={roeColor}
          note={stock.roe >= 15 ? "Buffett standard: ≥15% consistently" : "Buffett wants ≥15%"} />
        <MetricRow label="Debt / Equity" value={fmtNum(stock.debtToEquity, 2)}
          color={stock.debtToEquity < 1 ? "var(--bull)" : stock.debtToEquity < 2 ? "var(--caution)" : "var(--bear)"}
          note="Buffett prefers <1.0" />
        <MetricRow label="Dividend Yield" value={`${fmtNum(stock.dividendYield, 1)}%`} />
        <MetricRow label="Graham Score" value={`${stock.defensiveScore}/7`}
          color={stock.defensiveScore >= 6 ? "var(--bull)" : stock.defensiveScore >= 4 ? "var(--caution)" : "var(--bear)"}
          note={dRating === "defensive" ? "Defensive investor approved" : dRating === "semi-defensive" ? "Semi-defensive" : "Speculative"} />
        <MetricRow label="Buffett Score" value={`${stock.buffettScore}/10 (${bGrade})`}
          color={bGrade === "A" ? "var(--bull)" : bGrade === "B" ? "var(--bull)" : bGrade === "C" ? "var(--caution)" : "var(--bear)"}
          note={buffettGradeLabel(bGrade)} />
        <MetricRow label="Economic Moat" value={moatLabel(stock.moat)}
          color={moatColor(stock.moat)} />
      </div>
    </div>
  );
}
