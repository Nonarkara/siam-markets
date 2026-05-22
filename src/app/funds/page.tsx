"use client";

import { useState, useEffect, useCallback } from "react";
import { FundSearch } from "@/components/Funds/FundSearch";
import { FundPortfolio } from "@/components/Funds/FundPortfolio";
import { MOCK_FUNDS, type MutualFund } from "@/lib/api/mock-funds";

const STORAGE_KEY = "daytraders_fund_portfolio";

function loadPortfolio(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePortfolio(codes: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

export default function FundsPage() {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelectedCodes(loadPortfolio());
    setHydrated(true);
  }, []);

  const toggleFund = useCallback((fund: MutualFund) => {
    setSelectedCodes(prev => {
      const next = prev.includes(fund.code)
        ? prev.filter(c => c !== fund.code)
        : [...prev, fund.code];
      savePortfolio(next);
      return next;
    });
  }, []);

  const removeFund = useCallback((code: string) => {
    setSelectedCodes(prev => {
      const next = prev.filter(c => c !== code);
      savePortfolio(next);
      return next;
    });
  }, []);

  const selectedFunds = MOCK_FUNDS.filter(f => selectedCodes.includes(f.code));

  if (!hydrated) {
    return (
      <div className="page">
        <div className="shimmer" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 24 }}>
        <div className="t-micro" style={{ marginBottom: 6, color: "var(--caution)" }}>
          PERSONAL FINANCE · FUND MONITOR
        </div>
        <h1 className="t-display" style={{ marginBottom: 8 }}>
          Your Mutual Fund Portfolio
        </h1>
        <p className="t-body" style={{ color: "var(--muted)", maxWidth: 600, lineHeight: 1.6 }}>
          Search Thai mutual funds by name, AMC, or category. Track expense ratios, returns, and holdings overlap.
          Add RMF, SSF, and Thai ESG funds to see your total tax deduction potential.
        </p>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid-2-1" style={{ gap: 16, alignItems: "start" }}>
        <div>
          <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 8 }}>
            SEARCH FUNDS
          </div>
          <FundSearch onSelect={toggleFund} selectedCodes={selectedCodes} />
        </div>

        <div>
          <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em", marginBottom: 8 }}>
            YOUR PORTFOLIO
          </div>
          <FundPortfolio funds={selectedFunds} onRemove={removeFund} />
        </div>
      </div>
    </div>
  );
}
