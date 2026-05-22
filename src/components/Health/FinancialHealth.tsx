"use client";

import { useEffect, useState, useMemo } from "react";
import {
  computeHealthScore, loadPlanProfile, loadPortfolioValue, loadFundCodes,
} from "@/lib/health";
import { MOCK_FUNDS } from "@/lib/api/mock-funds";
import Link from "next/link";

export function FinancialHealth() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const score = useMemo(() => {
    const plan = loadPlanProfile();
    const portfolioValue = loadPortfolioValue();
    const fundCodes = loadFundCodes();
    const funds = MOCK_FUNDS.filter(f => fundCodes.includes(f.code));
    const hasRmf = funds.some(f => f.taxBenefit.rmf);
    const hasSsf = funds.some(f => f.taxBenefit.ssf);
    const hasEsg = funds.some(f => f.taxBenefit.thaiEsg);
    return computeHealthScore(plan, portfolioValue, funds.length, hasRmf, hasSsf, hasEsg);
  }, [mounted]);

  const plan = mounted ? loadPlanProfile() : null;
  const portfolioValue = mounted ? loadPortfolioValue() : 0;

  if (!mounted) return <div className="shimmer" style={{ height: 120 }} />;

  const dimensions = [
    { label: "SAVINGS RATE", value: score.savingsRate, max: 20, color: "var(--bull)" },
    { label: "RETIREMENT", value: score.retirementGap, max: 20, color: "var(--tech)" },
    { label: "DIVERSIFY", value: score.diversification, max: 20, color: "var(--caution)" },
    { label: "TAX EFF", value: score.taxEfficiency, max: 20, color: "var(--braun-yellow, #ffd000)" },
    { label: "EMERGENCY", value: score.emergencyFund, max: 20, color: "var(--bear)" },
  ];

  return (
    <div style={{
      background: "var(--bg-raised)",
      border: `1px solid ${score.verdictColor}`,
      borderLeft: `3px solid ${score.verdictColor}`,
      padding: "10px 14px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div>
          <span className="t-micro" style={{ color: score.verdictColor, letterSpacing: "0.14em" }}>FINANCIAL HEALTH</span>
          <span className="t-mono" style={{ fontSize: "0.75rem", color: "var(--dim)", marginLeft: 8 }}>
            {plan ? `Target: ฿${(plan.retirementTarget / 1e6).toFixed(1)}M` : "No plan yet"}
          </span>
        </div>
        <span className="t-mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: score.verdictColor }}>
          {score.overall}/100
        </span>
      </div>

      {/* Dimension bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {dimensions.map(d => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="t-micro" style={{ color: "var(--dim)", minWidth: 60, textAlign: "right" }}>{d.label}</span>
            <div style={{ flex: 1, height: 4, background: "var(--bg)" }}>
              <div style={{
                width: `${(d.value / d.max) * 100}%`,
                height: "100%",
                background: d.color,
              }} />
            </div>
            <span className="t-mono" style={{ fontSize: "0.625rem", color: d.color, minWidth: 20, textAlign: "right" }}>
              {Math.round(d.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Verdict + links */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <span className="t-micro" style={{ color: score.verdictColor, fontWeight: 700 }}>{score.verdict}</span>
        <div style={{ display: "flex", gap: 8 }}>
          {!plan && (
            <Link href="/plan" className="t-micro" style={{ color: "var(--tech)" }}>BUILD PLAN →</Link>
          )}
          {portfolioValue === 0 && (
            <Link href="/money" className="t-micro" style={{ color: "var(--tech)" }}>ADD HOLDINGS →</Link>
          )}
          {loadFundCodes().length === 0 && (
            <Link href="/funds" className="t-micro" style={{ color: "var(--tech)" }}>ADD FUNDS →</Link>
          )}
        </div>
      </div>
    </div>
  );
}
