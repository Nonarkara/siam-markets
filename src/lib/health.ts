/**
 * Financial Health — unified score bridging /plan, /money, and /funds.
 *
 * Reads from three localStorage keys:
 *   - plan_profile: salary, expenses, retirement target, risk score
 *   - portfolio_value: current holdings total value
 *   - fund_portfolio: selected fund codes
 *
 * Computes a 0-100 health score across 5 dimensions:
 *   1. Savings Rate (20%) — monthly investable / salary
 *   2. Retirement Gap (20%) — projected / target ratio
 *   3. Diversification (20%) — fund count + overlap score
 *   4. Tax Efficiency (20%) — RMF + SSF + ESG coverage
 *   5. Emergency Fund (20%) — existing savings / 6-month expenses
 */

export interface PlanProfile {
  salary: number;
  expenses: number;
  retirementTarget: number;
  riskScore: number;
  existingSavings: number;
  monthlyInvestable: number;
}

export interface HealthScore {
  overall: number;
  savingsRate: number;
  retirementGap: number;
  diversification: number;
  taxEfficiency: number;
  emergencyFund: number;
  verdict: string;
  verdictColor: string;
}

const PLAN_KEY = "plan_profile";
const PORTFOLIO_VALUE_KEY = "portfolio_total_value";
const FUND_KEY = "daytraders_fund_portfolio";

export function loadPlanProfile(): PlanProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function savePlanProfile(p: PlanProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, JSON.stringify(p));
}

export function loadPortfolioValue(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(PORTFOLIO_VALUE_KEY);
    return raw ? Number(JSON.parse(raw)) : 0;
  } catch { return 0; }
}

export function savePortfolioValue(v: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PORTFOLIO_VALUE_KEY, JSON.stringify(v));
}

export function loadFundCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUND_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function computeHealthScore(
  plan: PlanProfile | null,
  portfolioValue: number,
  fundCount: number,
  hasRmf: boolean,
  hasSsf: boolean,
  hasEsg: boolean,
): HealthScore {
  const defaults = {
    overall: 0,
    savingsRate: 0,
    retirementGap: 0,
    diversification: 0,
    taxEfficiency: 0,
    emergencyFund: 0,
    verdict: "START YOUR PLAN",
    verdictColor: "var(--dim)",
  };

  if (!plan) return defaults;

  // 1. Savings Rate (0-20 pts)
  const savingsRatePct = plan.salary > 0 ? (plan.monthlyInvestable / plan.salary) * 100 : 0;
  const savingsRate = Math.min(20, (savingsRatePct / 30) * 20);

  // 2. Retirement Gap (0-20 pts)
  const gapRatio = plan.retirementTarget > 0 ? portfolioValue / plan.retirementTarget : 0;
  const retirementGap = Math.min(20, gapRatio * 20);

  // 3. Diversification (0-20 pts)
  const fundScore = Math.min(10, fundCount * 2.5);
  const divScore = fundScore + (fundCount >= 3 ? 10 : fundCount >= 2 ? 5 : 0);
  const diversification = Math.min(20, divScore);

  // 4. Tax Efficiency (0-20 pts)
  let taxScore = 0;
  if (hasRmf) taxScore += 7;
  if (hasSsf) taxScore += 7;
  if (hasEsg) taxScore += 6;
  const taxEfficiency = taxScore;

  // 5. Emergency Fund (0-20 pts)
  const sixMonth = plan.expenses * 6;
  const efRatio = sixMonth > 0 ? plan.existingSavings / sixMonth : 0;
  const emergencyFund = Math.min(20, efRatio * 20);

  const overall = Math.round(savingsRate + retirementGap + diversification + taxEfficiency + emergencyFund);

  let verdict = "NEEDS WORK";
  let verdictColor = "var(--bear)";
  if (overall >= 80) { verdict = "EXCELLENT"; verdictColor = "var(--bull)"; }
  else if (overall >= 60) { verdict = "GOOD"; verdictColor = "var(--tech)"; }
  else if (overall >= 40) { verdict = "FAIR"; verdictColor = "var(--caution)"; }

  return { overall, savingsRate, retirementGap, diversification, taxEfficiency, emergencyFund, verdict, verdictColor };
}
