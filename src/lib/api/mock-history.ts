/**
 * Mock historical data generators for charting.
 *
 * Produces realistic-looking OHLC and fundamental history
 * for Thai SET stocks. Used when real historical APIs are unavailable.
 */

export interface OHLC {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface FundamentalHistory {
  time: string;
  price: number;
  grahamNumber: number;
  eps: number;
  bvps: number;
  pe: number;
  pb: number;
}

function randomWalk(start: number, steps: number, volatility: number): number[] {
  const vals = [start];
  for (let i = 1; i < steps; i++) {
    const change = (Math.random() - 0.5) * volatility;
    vals.push(Math.max(1, vals[i - 1] * (1 + change)));
  }
  return vals;
}

export function generateOHLC(symbol: string, days = 90, basePrice = 100): OHLC[] {
  const today = new Date();
  const closes = randomWalk(basePrice, days, 0.025);
  const result: OHLC[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const iso = d.toISOString().slice(0, 10);
    const close = closes[i];
    const open = i === 0 ? close * (1 + (Math.random() - 0.5) * 0.01) : closes[i - 1];
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);

    result.push({
      time: iso,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 10_000_000 + 1_000_000),
    });
  }
  return result;
}

export function generateFundamentalHistory(symbol: string, years = 3, currentPrice: number, currentEps: number, currentBvps: number): FundamentalHistory[] {
  const days = years * 52; // weekly points
  const today = new Date();
  const priceWalk = randomWalk(currentPrice * 0.7, days, 0.018);
  const epsWalk = randomWalk(currentEps * 0.6, days, 0.012);
  const bvpsWalk = randomWalk(currentBvps * 0.75, days, 0.008);

  const result: FundamentalHistory[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i) * 7);
    const iso = d.toISOString().slice(0, 10);
    const eps = Math.max(0.1, epsWalk[i]);
    const bvps = Math.max(1, bvpsWalk[i]);
    const price = Math.max(1, priceWalk[i]);
    const grahamNumber = Math.sqrt(22.5 * eps * bvps);

    result.push({
      time: iso,
      price: Math.round(price * 100) / 100,
      grahamNumber: Math.round(grahamNumber * 100) / 100,
      eps: Math.round(eps * 100) / 100,
      bvps: Math.round(bvps * 100) / 100,
      pe: Math.round((price / eps) * 100) / 100,
      pb: Math.round((price / bvps) * 100) / 100,
    });
  }
  return result;
}
