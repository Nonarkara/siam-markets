"use client";

import { yieldCurveContext, vixContext, cfnaiContext } from "@/lib/stats";
import { fmtNum } from "@/lib/format";

interface Props {
  yieldSpread: number | null;  // T10Y2Y from FRED
  vix: number | null;          // VIXCLS from FRED
  cfnai: number | null;        // CFNAI from FRED
  consumerSentiment: number | null; // UMCSENT
  us10y: number | null;        // ^TNX from Yahoo
  us2y: number | null;         // ^IRX from Yahoo
}

export function YieldCurvePanel({
  yieldSpread,
  vix,
  cfnai,
  consumerSentiment,
  us10y,
  us2y,
}: Props) {
  const spread  = yieldSpread ?? (us10y && us2y ? us10y - us2y : null);
  const ycCtx   = spread !== null ? yieldCurveContext(spread) : null;
  const vixCtx  = vix !== null ? vixContext(vix) : null;
  const cfnaiCtx = cfnai !== null ? cfnaiContext(cfnai) : null;

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
      {/* Section header */}
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span className="t-micro">RECESSION + VOLATILITY INDICATORS</span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>FRED daily</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {/* Yield Curve */}
        {ycCtx && (
          <div style={{
            flex: "2 0 260px",
            padding: "14px 16px",
            borderRight: "1px solid var(--line)",
            borderBottom: "1px solid var(--line)",
          }}>
            <div className="t-micro" style={{ marginBottom: 6 }}>YIELD CURVE (10Y − 2Y)</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: ycCtx.color,
                lineHeight: 1,
              }}>
                {spread! >= 0 ? "+" : ""}{spread!.toFixed(2)}%
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro)",
                color: ycCtx.color,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "2px 6px",
                border: `1px solid ${ycCtx.color}`,
              }}>
                {ycCtx.signal.toUpperCase()}
              </span>
            </div>

            {/* Visual bar */}
            <div style={{
              height: 6,
              background: "var(--line)",
              marginBottom: 8,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: `${Math.min(Math.abs(spread!) / 3 * 50, 50)}%`,
                height: "100%",
                background: ycCtx.color,
                transform: spread! >= 0 ? "none" : "translateX(-100%)",
              }} />
            </div>

            <div className="t-body" style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.4 }}>
              {ycCtx.implication}
            </div>
            <div className="t-micro" style={{ marginTop: 6 }}>
              Recession probability: <span style={{ color: ycCtx.color }}>{ycCtx.recessionProb}</span>
            </div>

            {/* 10Y vs 2Y */}
            {us10y && us2y && (
              <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                {[{ label: "10Y YIELD", value: `${fmtNum(us10y, 3)}%` }, { label: "2Y YIELD", value: `${fmtNum(us2y, 3)}%` }].map(item => (
                  <div key={item.label}>
                    <div className="t-micro">{item.label}</div>
                    <div className="t-mono" style={{ marginTop: 2, fontSize: "0.875rem" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIX */}
        {vixCtx && vix !== null && (
          <div style={{
            flex: "1 0 180px",
            padding: "14px 16px",
            borderRight: "1px solid var(--line)",
            borderBottom: "1px solid var(--line)",
          }}>
            <div className="t-micro" style={{ marginBottom: 6 }}>CBOE VIX</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: vixCtx.color,
                lineHeight: 1,
              }}>
                {fmtNum(vix, 2)}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro)",
                color: vixCtx.color,
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}>
                {vixCtx.label}
              </span>
            </div>

            {/* VIX gauge bar: 10→40 */}
            <div style={{ height: 6, background: "var(--line)", marginBottom: 8, position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute",
                top: 0, left: 0,
                width: `${Math.min(((vix - 10) / 30) * 100, 100)}%`,
                height: "100%",
                background: vix < 20 ? "var(--bull)" : vix < 30 ? "var(--caution)" : "var(--bear)",
              }} />
            </div>

            <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>
              {vixCtx.implication.split(".")[0]}.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span className="t-micro">10</span>
              <span className="t-micro">20</span>
              <span className="t-micro">30</span>
              <span className="t-micro">40+</span>
            </div>
          </div>
        )}

        {/* CFNAI + Consumer Sentiment */}
        <div style={{ flex: "1 0 180px", padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <div className="t-micro" style={{ marginBottom: 6 }}>ECONOMIC ACTIVITY</div>

          {cfnaiCtx && cfnai !== null && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="t-micro">CFNAI</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 700, color: cfnaiCtx.color }}>
                  {cfnai > 0 ? "+" : ""}{fmtNum(cfnai, 2)}
                </span>
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro)",
                color: cfnaiCtx.color,
                marginTop: 3,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}>
                {cfnaiCtx.label}
              </div>
              <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
                {cfnaiCtx.implication.split(".")[0]}.
              </div>
            </div>
          )}

          {consumerSentiment !== null && (
            <div style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="t-micro">CONSUMER SENTIMENT</span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: consumerSentiment >= 70 ? "var(--bull)" : consumerSentiment >= 55 ? "var(--caution)" : "var(--bear)",
                }}>
                  {fmtNum(consumerSentiment, 1)}
                </span>
              </div>
              <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4, lineHeight: 1.3 }}>
                {consumerSentiment >= 80 ? "Confident — growth likely" :
                 consumerSentiment >= 65 ? "Neutral — steady spending" :
                 consumerSentiment >= 50 ? "Cautious — watch retail" :
                 "Pessimistic — spending contraction risk"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
