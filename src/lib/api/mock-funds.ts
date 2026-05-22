/**
 * Mock Thai mutual fund data.
 *
 * Covers major AMCs, fund types, and realistic expense ratios / returns.
 * Used for the fund search + monitor feature.
 */

export interface FundHolding {
  stock: string;
  weight: number; // %
}

export interface MutualFund {
  code: string;        // e.g. "SCBSET50"
  name: string;        // e.g. "SCB SET50 Index"
  amc: string;         // Asset management company
  category: "EQUITY" | "FIXED_INCOME" | "MIXED" | "RMF" | "SSF" | "THAI_ESG" | "GLOBAL";
  nav: number;
  expenseRatio: number; // %
  return1y: number;     // %
  return3y: number;     // % annualized
  return5y: number;     // % annualized
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  aum: number;          // Million THB
  topHoldings: FundHolding[];
  taxBenefit: {
    rmf: boolean;
    ssf: boolean;
    thaiEsg: boolean;
    deductionLimit: number; // max % of income
  };
  minInvestment: number;
  dividendPolicy: "ACC" | "DIST" | "BOTH";
}

export const MOCK_FUNDS: MutualFund[] = [
  {
    code: "SCBSET50", name: "SCB SET50 Index", amc: "SCBAM", category: "EQUITY",
    nav: 18.45, expenseRatio: 0.65, return1y: 8.2, return3y: 4.1, return5y: 3.8,
    riskLevel: 6, aum: 12500,
    topHoldings: [{ stock: "PTT", weight: 12.5 }, { stock: "SCB", weight: 8.2 }, { stock: "AOT", weight: 7.8 }, { stock: "CPALL", weight: 6.5 }],
    taxBenefit: { rmf: false, ssf: false, thaiEsg: false, deductionLimit: 0 },
    minInvestment: 1000, dividendPolicy: "ACC",
  },
  {
    code: "K-SET", name: "Krungsri SET50 Index", amc: "Krungsri AM", category: "EQUITY",
    nav: 14.22, expenseRatio: 0.78, return1y: 7.8, return3y: 3.9, return5y: 3.5,
    riskLevel: 6, aum: 8200,
    topHoldings: [{ stock: "PTT", weight: 11.8 }, { stock: "BBL", weight: 7.5 }, { stock: "AOT", weight: 7.2 }, { stock: "DELTA", weight: 5.8 }],
    taxBenefit: { rmf: false, ssf: false, thaiEsg: false, deductionLimit: 0 },
    minInvestment: 1000, dividendPolicy: "ACC",
  },
  {
    code: "PRINCIPAL_VNEQ", name: "Principal VNEQ Global Equity", amc: "Principal", category: "GLOBAL",
    nav: 22.30, expenseRatio: 1.45, return1y: 15.2, return3y: 8.5, return5y: 10.2,
    riskLevel: 7, aum: 5600,
    topHoldings: [{ stock: "NVDA", weight: 8.5 }, { stock: "AAPL", weight: 7.2 }, { stock: "MSFT", weight: 6.8 }, { stock: "GOOGL", weight: 4.5 }],
    taxBenefit: { rmf: false, ssf: false, thaiEsg: false, deductionLimit: 0 },
    minInvestment: 5000, dividendPolicy: "ACC",
  },
  {
    code: "SCBRMF", name: "SCB RMF Long-Term Equity", amc: "SCBAM", category: "RMF",
    nav: 15.60, expenseRatio: 1.20, return1y: 6.5, return3y: 3.8, return5y: 4.2,
    riskLevel: 6, aum: 9800,
    topHoldings: [{ stock: "PTT", weight: 10.5 }, { stock: "SCB", weight: 8.0 }, { stock: "CPALL", weight: 6.2 }],
    taxBenefit: { rmf: true, ssf: false, thaiEsg: false, deductionLimit: 0.15 },
    minInvestment: 500, dividendPolicy: "ACC",
  },
  {
    code: "KASSET_RMF", name: "KAsset RMF Global Equity", amc: "KAsset", category: "RMF",
    nav: 12.80, expenseRatio: 1.35, return1y: 9.2, return3y: 5.5, return5y: 6.8,
    riskLevel: 7, aum: 7200,
    topHoldings: [{ stock: "NVDA", weight: 6.5 }, { stock: "AAPL", weight: 5.8 }, { stock: "PTT", weight: 5.2 }],
    taxBenefit: { rmf: true, ssf: false, thaiEsg: false, deductionLimit: 0.15 },
    minInvestment: 500, dividendPolicy: "ACC",
  },
  {
    code: "BBLSSF", name: "BBL SSF Thai Equity", amc: "BBLAM", category: "SSF",
    nav: 11.45, expenseRatio: 1.15, return1y: 7.0, return3y: 4.2, return5y: 4.5,
    riskLevel: 6, aum: 6500,
    topHoldings: [{ stock: "PTT", weight: 9.5 }, { stock: "BBL", weight: 8.5 }, { stock: "AOT", weight: 7.0 }],
    taxBenefit: { rmf: false, ssf: true, thaiEsg: false, deductionLimit: 0.30 },
    minInvestment: 500, dividendPolicy: "ACC",
  },
  {
    code: "KRUNGSRI_SSF", name: "Krungsri SSF Smart Plan", amc: "Krungsri AM", category: "SSF",
    nav: 10.20, expenseRatio: 1.10, return1y: 6.8, return3y: 3.9, return5y: 4.0,
    riskLevel: 5, aum: 4800,
    topHoldings: [{ stock: "SCB", weight: 7.5 }, { stock: "KBANK", weight: 6.8 }, { stock: "CPALL", weight: 5.5 }],
    taxBenefit: { rmf: false, ssf: true, thaiEsg: false, deductionLimit: 0.30 },
    minInvestment: 500, dividendPolicy: "ACC",
  },
  {
    code: "SCB_ESG", name: "SCB Thai ESG Sustainability", amc: "SCBAM", category: "THAI_ESG",
    nav: 13.75, expenseRatio: 1.25, return1y: 5.8, return3y: 3.5, return5y: 3.2,
    riskLevel: 6, aum: 3200,
    topHoldings: [{ stock: "CPALL", weight: 8.0 }, { stock: "AOT", weight: 7.5 }, { stock: "PTT", weight: 6.0 }],
    taxBenefit: { rmf: false, ssf: false, thaiEsg: true, deductionLimit: 0.30 },
    minInvestment: 1000, dividendPolicy: "DIST",
  },
  {
    code: "PRINCIPAL_ESG", name: "Principal Thai ESG Plus", amc: "Principal", category: "THAI_ESG",
    nav: 9.80, expenseRatio: 1.30, return1y: 5.5, return3y: 3.2, return5y: 3.0,
    riskLevel: 6, aum: 2100,
    topHoldings: [{ stock: "BBL", weight: 7.0 }, { stock: "CPN", weight: 5.5 }, { stock: "DELTA", weight: 5.0 }],
    taxBenefit: { rmf: false, ssf: false, thaiEsg: true, deductionLimit: 0.30 },
    minInvestment: 1000, dividendPolicy: "DIST",
  },
  {
    code: "TMBGOV", name: "TMB Government Bond", amc: "TMBAM", category: "FIXED_INCOME",
    nav: 10.55, expenseRatio: 0.45, return1y: 3.2, return3y: 2.8, return5y: 2.5,
    riskLevel: 2, aum: 15000,
    topHoldings: [{ stock: "Thai Gov Bond 10Y", weight: 35.0 }, { stock: "Thai Gov Bond 5Y", weight: 25.0 }],
    taxBenefit: { rmf: false, ssf: false, thaiEsg: false, deductionLimit: 0 },
    minInvestment: 1000, dividendPolicy: "DIST",
  },
  {
    code: "SCB_CORP", name: "SCB Corporate Bond Plus", amc: "SCBAM", category: "FIXED_INCOME",
    nav: 11.20, expenseRatio: 0.55, return1y: 3.8, return3y: 3.0, return5y: 2.8,
    riskLevel: 3, aum: 8900,
    topHoldings: [{ stock: "PTT Bond", weight: 15.0 }, { stock: "SCB Bond", weight: 12.0 }, { stock: "BBL Bond", weight: 10.0 }],
    taxBenefit: { rmf: false, ssf: false, thaiEsg: false, deductionLimit: 0 },
    minInvestment: 1000, dividendPolicy: "DIST",
  },
  {
    code: "KASSET_MIX", name: "KAsset Mixed 70/30", amc: "KAsset", category: "MIXED",
    nav: 14.10, expenseRatio: 0.95, return1y: 6.0, return3y: 3.5, return5y: 3.8,
    riskLevel: 5, aum: 6700,
    topHoldings: [{ stock: "PTT", weight: 6.0 }, { stock: "Thai Gov Bond 5Y", weight: 15.0 }, { stock: "AOT", weight: 4.5 }],
    taxBenefit: { rmf: false, ssf: false, thaiEsg: false, deductionLimit: 0 },
    minInvestment: 1000, dividendPolicy: "BOTH",
  },
];
