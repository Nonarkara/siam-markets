/**
 * DREAM PORTFOLIO — hindsight allocation, not a real account.
 *
 * What a Graham/Buffett-aligned long-term value investor should have
 * held from 2020–2021 to ride the 2020-2026 cycle: semiconductors,
 * blockchain, global tech, gold (the bull's defensive flank), Vietnam,
 * US large-cap. Real Thai SEC-registered fund codes (SCBSEMI, ASP-
 * DIGIBLOCRMF, KFGTECHRMF, etc.) so allocation chips read as real
 * choices — but the cost basis, dates, and account holder are
 * illustrative.
 *
 * Layout mirrors the Phillip Fund SuperMart statement schema so a real
 * account can be pasted in later. Arithmetic is internally consistent:
 * units × unitCost = cost, units × nav = currentValue.
 *
 * NOT financial advice. Past performance does not predict future returns.
 */

export type FundScope = "RMF" | "SSF" | "TESG" | "LTF" | "GMF" | "FIF";
export type RiskLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface FundHolding {
  no: number;
  code: string;
  amc: string;             // Asset management company
  scope: FundScope;        // Tax bucket / fund class
  units: number;
  unitCost: number;        // Average cost per unit (THB)
  cost: number;            // Total cost (THB)
  investDate: string;      // "DD/MM/YYYY" — first investment date
  nav: number;             // Current NAV per unit
  navDate: string;         // "DD/MM/YYYY"
  currentValue: number;    // units × nav (THB)
  gainLoss: number;        // currentValue − cost
  gainLossPct: number;     // gain/loss / cost × 100
  riskLevel: RiskLevel;    // SEC Thailand risk scale 1–8
  /** Optional human-readable mandate (we infer from code where blank). */
  mandate?: string;
  /** Geographic / thematic bucket — used for allocation charts. */
  theme: "Thai equity" | "Global equity" | "US tech" | "Asia ex-Japan" | "Japan" | "Vietnam" | "India" | "China" | "Gold" | "Crypto" | "Cash / Bond" | "Semiconductor";
}

export const PORTFOLIO_AS_OF = "2026-05-16";
export const PORTFOLIO_ACCOUNT = "DP-001";
export const PORTFOLIO_OWNER = "Dream Portfolio · long-term value allocation";
export const PORTFOLIO_KIND: "DREAM" | "LIVE" = "DREAM";
export const PORTFOLIO_DISCLAIMER =
  "Hindsight allocation · educational scenario · not investment advice";

/**
 * 15 holdings, ~฿2.45M invested across 2020–2021. Real Thai SEC fund
 * codes paired with macro-aligned cost basis to show what a patient
 * long-term value investor SHOULD have held to ride the cycle:
 *
 *   • Semiconductor + blockchain + US tech (the AI / digital decade)
 *   • Gold (the bull's defensive flank during a real-rates cycle)
 *   • Vietnam + India + Japan (emerging-market reflations)
 *   • US large-cap (the highest-quality compounders)
 *   • Thai ESG + index (domestic tax-bucket discipline)
 *   • Cash sweeps (RMF/SSF cap headroom)
 *
 * Arithmetic is internally consistent so the donut + KPI sums tie.
 */
export const HOLDINGS: FundHolding[] = [
  { no:  1, code: "SCBSEMI(A)",       amc: "SCBAM",     scope: "FIF",  units: 17000.0000, unitCost: 11.7647, cost: 200000.00, investDate: "15/01/2021", nav: 35.4411, navDate: "14/05/2026", currentValue: 602498.70, gainLoss: 402498.70, gainLossPct: 201.25, riskLevel: 7, mandate: "Global semiconductor leaders · TSMC, NVDA, ASML",      theme: "Semiconductor" },
  { no:  2, code: "ASP-DIGIBLOCRMF",  amc: "ASSETFUND", scope: "RMF",  units: 24000.0000, unitCost:  6.2500, cost: 150000.00, investDate: "22/03/2021", nav: 15.0531, navDate: "14/05/2026", currentValue: 361274.40, gainLoss: 211274.40, gainLossPct: 140.85, riskLevel: 6, mandate: "Blockchain & digital-asset equities",                  theme: "Crypto" },
  { no:  3, code: "KFGTECHRMF",       amc: "KSAM",      scope: "RMF",  units: 14000.0000, unitCost: 14.2857, cost: 200000.00, investDate: "15/12/2020", nav: 23.3544, navDate: "14/05/2026", currentValue: 326961.60, gainLoss: 126961.60, gainLossPct:  63.48, riskLevel: 7, mandate: "Global tech · MSFT, AAPL, GOOG, Mag-7 tilt",          theme: "US tech" },
  { no:  4, code: "K-USXNDQ-A",       amc: "KSAM",      scope: "GMF",  units: 15000.0000, unitCost: 16.6667, cost: 250000.00, investDate: "15/01/2021", nav: 30.5000, navDate: "15/05/2026", currentValue: 457500.00, gainLoss: 207500.00, gainLossPct:  83.00, riskLevel: 6, mandate: "Nasdaq-100 index passive · low TER",                  theme: "US tech" },
  { no:  5, code: "K-USA-A",          amc: "KSAM",      scope: "SSF",  units: 11000.0000, unitCost: 22.7273, cost: 250000.00, investDate: "22/01/2021", nav: 35.8000, navDate: "15/05/2026", currentValue: 393800.00, gainLoss: 143800.00, gainLossPct:  57.52, riskLevel: 6, mandate: "Active US large-cap · quality bias",                  theme: "Global equity" },
  { no:  6, code: "SCBS&P500(A)",     amc: "SCBAM",     scope: "SSF",  units: 16500.0000, unitCost: 12.1212, cost: 200000.00, investDate: "20/01/2021", nav: 22.3400, navDate: "15/05/2026", currentValue: 368610.00, gainLoss: 168610.00, gainLossPct:  84.31, riskLevel: 6, mandate: "S&P 500 index · the Buffett default",                  theme: "Global equity" },
  { no:  7, code: "SCBGOLDHRMF",      amc: "SCBAM",     scope: "RMF",  units: 14000.0000, unitCost: 14.2857, cost: 200000.00, investDate: "10/08/2020", nav: 20.0322, navDate: "15/05/2026", currentValue: 280450.80, gainLoss:  80450.80, gainLossPct:  40.23, riskLevel: 8, mandate: "Gold hedged-THB · real-rates hedge",                  theme: "Gold" },
  { no:  8, code: "KFGOLDRMF",        amc: "KSAM",      scope: "RMF",  units:  5800.0000, unitCost: 17.2414, cost: 100000.00, investDate: "15/01/2021", nav: 24.5000, navDate: "15/05/2026", currentValue: 142100.00, gainLoss:  42100.00, gainLossPct:  42.10, riskLevel: 8, mandate: "Gold unhedged · de-dollarisation play",               theme: "Gold" },
  { no:  9, code: "SCBRMVIET(A)",     amc: "SCBAM",     scope: "RMF",  units: 22000.0000, unitCost:  6.8182, cost: 150000.00, investDate: "22/06/2021", nav:  8.2729, navDate: "15/05/2026", currentValue: 182003.80, gainLoss:  32003.80, gainLossPct:  21.34, riskLevel: 6, mandate: "Vietnam equity · ASEAN-next manufacturing shift",     theme: "Vietnam" },
  { no: 10, code: "KFINDIARMF",       amc: "KSAM",      scope: "RMF",  units:  6500.0000, unitCost: 15.3846, cost: 100000.00, investDate: "20/02/2021", nav: 21.4500, navDate: "14/05/2026", currentValue: 139425.00, gainLoss:  39425.00, gainLossPct:  39.43, riskLevel: 6, mandate: "Indian equity · demographic dividend",                theme: "India" },
  { no: 11, code: "KFJAPANRMF",       amc: "KSAM",      scope: "RMF",  units:  5400.0000, unitCost: 18.5185, cost: 100000.00, investDate: "15/04/2022", nav: 20.3547, navDate: "14/05/2026", currentValue: 109915.38, gainLoss:   9915.38, gainLossPct:   9.92, riskLevel: 6, mandate: "Japan reflation · governance reform",                 theme: "Japan" },
  { no: 12, code: "KFTHAIESG-A",      amc: "KSAM",      scope: "TESG", units: 25000.0000, unitCost: 10.0000, cost: 250000.00, investDate: "22/12/2023", nav: 11.8500, navDate: "15/05/2026", currentValue: 296250.00, gainLoss:  46250.00, gainLossPct:  18.50, riskLevel: 6, mandate: "Thai ESG equity · tax-bucket discipline",             theme: "Thai equity" },
  { no: 13, code: "K-CHANGE-SSF",     amc: "KSAM",      scope: "SSF",  units: 10000.0000, unitCost: 15.0000, cost: 150000.00, investDate: "10/02/2021", nav: 18.5000, navDate: "15/05/2026", currentValue: 185000.00, gainLoss:  35000.00, gainLossPct:  23.33, riskLevel: 6, mandate: "Global impact equities · sustainability thesis",     theme: "Global equity" },
  { no: 14, code: "KFINDXSSF",        amc: "KSAM",      scope: "SSF",  units: 14000.0000, unitCost: 10.7143, cost: 150000.00, investDate: "15/01/2021", nav:  9.6500, navDate: "15/05/2026", currentValue: 135100.00, gainLoss: -14900.00, gainLossPct:  -9.93, riskLevel: 6, mandate: "Thai SET index · domestic core",                      theme: "Thai equity" },
  { no: 15, code: "KFCASH-A",         amc: "KSAM",      scope: "GMF",  units:  3650.0000, unitCost: 13.6986, cost:  50000.00, investDate: "24/04/2024", nav: 14.0423, navDate: "15/05/2026", currentValue:  51254.40, gainLoss:   1254.40, gainLossPct:   2.51, riskLevel: 1, mandate: "Money-market sweep · RMF/SSF cap headroom",          theme: "Cash / Bond" },
];

// ─── Derived helpers ──────────────────────────────────────────

export interface PortfolioSummary {
  totalCost: number;
  totalValue: number;
  totalGain: number;
  totalGainPct: number;
  count: number;
  bestPerformer: FundHolding;
  worstPerformer: FundHolding;
}

export function computeSummary(holdings: FundHolding[] = HOLDINGS): PortfolioSummary {
  const totalCost  = holdings.reduce((s, h) => s + h.cost, 0);
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalGain  = totalValue - totalCost;
  const totalGainPct = (totalGain / totalCost) * 100;
  const sorted = [...holdings].sort((a, b) => b.gainLossPct - a.gainLossPct);
  return {
    totalCost, totalValue, totalGain, totalGainPct,
    count: holdings.length,
    bestPerformer: sorted[0],
    worstPerformer: sorted[sorted.length - 1],
  };
}

export interface AllocationSlice {
  key: string;
  label: string;
  value: number;        // THB
  pct: number;          // % of total
  color: string;
  count?: number;
}

const SCOPE_COLOR: Record<FundScope, string> = {
  SSF:  "var(--tech)",
  TESG: "var(--caution)",
  RMF:  "var(--bear)",
  LTF:  "var(--violet)",
  GMF:  "var(--dim)",
  FIF:  "var(--bull)",
};

const RISK_COLOR: Record<RiskLevel, string> = {
  1: "#1f8a3b",   // safe
  2: "#3aa84d",
  3: "#9bc94c",
  4: "#f2c200",
  5: "#f29900",
  6: "#ff7a30",   // medium-high
  7: "#ff4d2e",
  8: "#c41e1e",   // very high
};

const THEME_COLOR: Record<FundHolding["theme"], string> = {
  "Thai equity":   "#ffd000",
  "Global equity": "#007aff",
  "US tech":       "#00b8ff",
  "Asia ex-Japan": "#8a8aff",
  "Japan":         "#ff7a6e",
  "Vietnam":       "#00c896",
  "India":         "#ff5e00",
  "China":         "#c41e1e",
  "Gold":          "#d4a900",
  "Crypto":        "#a0a0e8",
  "Cash / Bond":   "#6a6e6e",
  "Semiconductor": "#00ff9a",
};

export function allocationByScope(holdings: FundHolding[] = HOLDINGS): AllocationSlice[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  const buckets = new Map<FundScope, { value: number; count: number }>();
  for (const h of holdings) {
    const b = buckets.get(h.scope) ?? { value: 0, count: 0 };
    b.value += h.currentValue;
    b.count += 1;
    buckets.set(h.scope, b);
  }
  return Array.from(buckets.entries())
    .map(([scope, b]) => ({
      key: scope,
      label: scope,
      value: b.value,
      pct: (b.value / total) * 100,
      color: SCOPE_COLOR[scope],
      count: b.count,
    }))
    .sort((a, b) => b.value - a.value);
}

export function allocationByRisk(holdings: FundHolding[] = HOLDINGS): AllocationSlice[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  const buckets = new Map<RiskLevel, { value: number; count: number }>();
  for (const h of holdings) {
    const b = buckets.get(h.riskLevel) ?? { value: 0, count: 0 };
    b.value += h.currentValue;
    b.count += 1;
    buckets.set(h.riskLevel, b);
  }
  return Array.from(buckets.entries())
    .map(([risk, b]) => ({
      key: String(risk),
      label: `Risk ${risk}`,
      value: b.value,
      pct: (b.value / total) * 100,
      color: RISK_COLOR[risk],
      count: b.count,
    }))
    .sort((a, b) => Number(a.key) - Number(b.key));
}

export function allocationByTheme(holdings: FundHolding[] = HOLDINGS): AllocationSlice[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  const buckets = new Map<FundHolding["theme"], { value: number; count: number }>();
  for (const h of holdings) {
    const b = buckets.get(h.theme) ?? { value: 0, count: 0 };
    b.value += h.currentValue;
    b.count += 1;
    buckets.set(h.theme, b);
  }
  return Array.from(buckets.entries())
    .map(([theme, b]) => ({
      key: theme,
      label: theme,
      value: b.value,
      pct: (b.value / total) * 100,
      color: THEME_COLOR[theme],
      count: b.count,
    }))
    .sort((a, b) => b.value - a.value);
}

export function allocationByFund(holdings: FundHolding[] = HOLDINGS): AllocationSlice[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  // Distinct color per fund — cycle through a long Braun palette
  const palette = [
    "#007aff", "#ff9500", "#ff3b30", "#00c896", "#ffd000", "#8a8aff", "#00b8ff",
    "#ff5e00", "#c41e1e", "#a0a0e8", "#ff7a6e", "#00ff9a", "#6a6e6e", "#d4a900",
    "#1f8a3b", "#ff4d2e", "#3aa84d",
  ];
  return holdings
    .map((h, i) => ({
      key: h.code,
      label: h.code,
      value: h.currentValue,
      pct: (h.currentValue / total) * 100,
      color: palette[i % palette.length],
    }))
    .sort((a, b) => b.value - a.value);
}

// Risk level labels (Thai SEC standard)
export const RISK_LABEL: Record<RiskLevel, string> = {
  1: "Low",
  2: "Low",
  3: "Medium-low",
  4: "Medium",
  5: "Medium-high",
  6: "Medium-high",
  7: "High",
  8: "Very high",
};

export const SCOPE_LABEL: Record<FundScope, string> = {
  RMF:  "Retirement Mutual Fund",
  SSF:  "Super Savings Fund",
  TESG: "Thai ESG Fund",
  LTF:  "Long-Term Equity (legacy)",
  GMF:  "General mutual fund",
  FIF:  "Foreign Investment Fund",
};
