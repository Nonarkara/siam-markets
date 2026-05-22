/**
 * Mock historical SET50 data for backtesting Graham/Buffett rules.
 *
 * Generates 5 years of monthly data (60 points) for a subset of stocks.
 * Each month includes: price, EPS, BVPS, PE, PB, dividend yield.
 * The data exhibits realistic patterns: earnings grow with noise,
 * prices follow earnings with lag and sentiment cycles.
 */

export interface MonthlySnapshot {
  date: string; // YYYY-MM
  price: number;
  eps: number;
  bvps: number;
  pe: number;
  pb: number;
  dividendYield: number;
  roe: number;
}

export interface BacktestStock {
  symbol: string;
  name: string;
  sector: string;
  history: MonthlySnapshot[];
}

function randomWalk(seed: number, steps: number, volatility: number, drift: number): number[] {
  const vals = [seed];
  for (let i = 1; i < steps; i++) {
    const change = (Math.random() - 0.5) * volatility + drift;
    vals.push(vals[i - 1] * (1 + change));
  }
  return vals;
}

export function generateBacktestData(): BacktestStock[] {
  const months = 60;
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - months);

  const stocks = [
    { symbol: "PTT.BK", name: "PTT", sector: "ENERGY", basePrice: 35, baseEps: 2.5, baseBvps: 18, roeBase: 14 },
    { symbol: "SCB.BK", name: "SCB X", sector: "BANKING", basePrice: 120, baseEps: 8.5, baseBvps: 65, roeBase: 13 },
    { symbol: "AOT.BK", name: "Airports of Thailand", sector: "TOURISM", basePrice: 65, baseEps: 2.2, baseBvps: 12, roeBase: 18 },
    { symbol: "CPALL.BK", name: "CP All", sector: "RETAIL", basePrice: 55, baseEps: 1.8, baseBvps: 8, roeBase: 22 },
    { symbol: "DELTA.BK", name: "Delta Electronics", sector: "TECH", basePrice: 95, baseEps: 6.5, baseBvps: 28, roeBase: 23 },
    { symbol: "BBL.BK", name: "Bangkok Bank", sector: "BANKING", basePrice: 145, baseEps: 10.2, baseBvps: 85, roeBase: 12 },
    { symbol: "KBANK.BK", name: "Kasikornbank", sector: "BANKING", basePrice: 155, baseEps: 11.0, baseBvps: 90, roeBase: 12 },
    { symbol: "ADVANC.BK", name: "Advanced Info", sector: "TECH", basePrice: 210, baseEps: 9.5, baseBvps: 32, roeBase: 29 },
    { symbol: "GULF.BK", name: "Gulf Energy", sector: "ENERGY", basePrice: 42, baseEps: 2.1, baseBvps: 10, roeBase: 21 },
    { symbol: "CPF.BK", name: "Charoen Pokphand Foods", sector: "AGRI", basePrice: 28, baseEps: 1.3, baseBvps: 9, roeBase: 14 },
  ];

  return stocks.map(s => {
    const epsWalk = randomWalk(s.baseEps, months, 0.08, 0.003);
    const bvpsWalk = randomWalk(s.baseBvps, months, 0.03, 0.005);
    const sentiment = randomWalk(1, months, 0.15, 0);
    const priceWalk = epsWalk.map((eps, i) => {
      const fairPe = 12 + sentiment[i] * 4;
      const fairPrice = eps * fairPe;
      return fairPrice * (1 + (Math.random() - 0.5) * 0.1);
    });

    const history: MonthlySnapshot[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      const eps = Math.max(0.5, epsWalk[i]);
      const bvps = Math.max(2, bvpsWalk[i]);
      const price = Math.max(1, priceWalk[i]);
      const pe = price / eps;
      const pb = price / bvps;
      const roe = (eps / bvps) * 100;
      const divYield = Math.max(0, (eps * 0.4) / price * 100);

      history.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        price: Math.round(price * 100) / 100,
        eps: Math.round(eps * 100) / 100,
        bvps: Math.round(bvps * 100) / 100,
        pe: Math.round(pe * 100) / 100,
        pb: Math.round(pb * 100) / 100,
        dividendYield: Math.round(divYield * 100) / 100,
        roe: Math.round(roe * 100) / 100,
      });
    }
    return { symbol: s.symbol, name: s.name, sector: s.sector, history };
  });
}

export interface BacktestRule {
  name: string;
  description: string;
  filter: (s: MonthlySnapshot) => boolean;
}

export const GRAHAM_RULES: BacktestRule[] = [
  {
    name: "Classic Graham",
    description: "P/E ≤ 15, P/B ≤ 1.5, MOS > 0",
    filter: s => s.pe <= 15 && s.pb <= 1.5 && s.price < Math.sqrt(22.5 * s.eps * s.bvps),
  },
  {
    name: "Deep Value",
    description: "P/E ≤ 10, P/B ≤ 1.0, MOS > 20%",
    filter: s => s.pe <= 10 && s.pb <= 1.0 && s.price < Math.sqrt(22.5 * s.eps * s.bvps) * 0.8,
  },
  {
    name: "Buffett Quality",
    description: "ROE > 15%, P/E < 20, Div Yield > 2%",
    filter: s => s.roe > 15 && s.pe < 20 && s.dividendYield > 2,
  },
  {
    name: "Income First",
    description: "Div Yield > 4%, P/E < 18, P/B < 2",
    filter: s => s.dividendYield > 4 && s.pe < 18 && s.pb < 2,
  },
];

export interface BacktestResult {
  rule: BacktestRule;
  startingCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  trades: number;
  winRate: number;
  benchmarkReturn: number; // SET50 buy-and-hold
  equityCurve: { date: string; value: number }[];
}

export function runBacktest(
  data: BacktestStock[],
  rule: BacktestRule,
  startingCapital: number = 1_000_000,
): BacktestResult {
  const months = data[0]?.history.length ?? 0;
  let capital = startingCapital;
  let maxCapital = capital;
  let maxDrawdown = 0;
  let trades = 0;
  let wins = 0;
  const equityCurve: { date: string; value: number }[] = [];

  // Compute SET50 benchmark (equal-weight average)
  const set50Start = data.reduce((s, d) => s + d.history[0].price, 0) / data.length;
  const set50End = data.reduce((s, d) => s + d.history[months - 1].price, 0) / data.length;
  const benchmarkReturn = (set50End / set50Start - 1) * 100;

  for (let m = 0; m < months; m++) {
    const date = data[0].history[m].date;

    // Find stocks passing the rule this month
    const passing = data.filter(d => rule.filter(d.history[m]));

    if (passing.length > 0) {
      // Invest equally in all passing stocks
      const allocation = capital / passing.length;
      let monthReturn = 0;

      for (const stock of passing) {
        const current = stock.history[m].price;
        const prev = m > 0 ? stock.history[m - 1].price : current;
        const ret = prev > 0 ? (current - prev) / prev : 0;
        monthReturn += allocation * (1 + ret);
      }

      // Only count as a trade when portfolio composition changes
      if (m > 0) {
        const prevPassing = data.filter(d => rule.filter(d.history[m - 1]));
        const changed = prevPassing.length !== passing.length ||
          prevPassing.some((p, i) => p.symbol !== passing[i]?.symbol);
        if (changed) trades++;
      }

      capital = monthReturn;
    }
    // If no stocks pass, hold cash (no change)

    if (capital > maxCapital) maxCapital = capital;
    const dd = (maxCapital - capital) / maxCapital;
    if (dd > maxDrawdown) maxDrawdown = dd;

    equityCurve.push({ date, value: Math.round(capital) });
  }

  const totalReturn = (capital / startingCapital - 1) * 100;
  const years = months / 12;
  const annualizedReturn = (Math.pow(capital / startingCapital, 1 / years) - 1) * 100;

  // Win rate: months with positive return
  for (let m = 1; m < months; m++) {
    if (equityCurve[m].value > equityCurve[m - 1].value) wins++;
  }
  const winRate = months > 1 ? (wins / (months - 1)) * 100 : 0;

  return {
    rule,
    startingCapital,
    finalCapital: Math.round(capital),
    totalReturn,
    annualizedReturn,
    maxDrawdown: Math.round(maxDrawdown * 100),
    trades,
    winRate: Math.round(winRate),
    benchmarkReturn,
    equityCurve,
  };
}
