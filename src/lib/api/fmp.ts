/**
 * Financial Modeling Prep — stable API (post-Aug 2025)
 * 250 requests/day free tier
 * Endpoint: https://financialmodelingprep.com/stable/
 */

const BASE = "https://financialmodelingprep.com/stable";

function apiKey(): string {
  return process.env.FMP_API_KEY ?? "";
}

async function fetchFmp<T>(path: string, revalidate = 3600): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}apikey=${key}`;
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    const json = await res.json();
    // Return null on error responses
    if (json && typeof json === "object" && "Error Message" in json) return null;
    return json as T;
  } catch {
    return null;
  }
}

// ─── Global Index Quotes ──────────────────────────────────────────

// Thai (.BK) stocks don't work on FMP free tier — use mock + Python yfinance ingestion
// Global indices work fine with ^ prefix
export const LIVE_INDEX_SYMBOLS = [
  { symbol: "^GSPC",  name: "S&P 500" },
  { symbol: "^N225",  name: "Nikkei"  },
  { symbol: "^HSI",   name: "Hang Seng" },
  { symbol: "^IXIC",  name: "Nasdaq"  },
] as const;

export interface FmpQuote {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;  // note: NOT changesPercentage (v3 field renamed)
  change: number;
  yearHigh: number;
  yearLow: number;
  volume: number;
}

export async function fetchIndexQuote(symbol: string): Promise<FmpQuote | null> {
  const data = await fetchFmp<FmpQuote[]>(`/quote?symbol=${encodeURIComponent(symbol)}`, 300);
  return data?.[0] ?? null;
}

export async function fetchIndexQuotes(): Promise<FmpQuote[]> {
  const results = await Promise.all(
    LIVE_INDEX_SYMBOLS.map(({ symbol }) => fetchIndexQuote(symbol)),
  );
  return results.filter((q): q is FmpQuote => q !== null);
}

// ─── Stock Fundamentals (for US stocks; SET50 via Python ingestion) ─

export interface FmpKeyMetrics {
  symbol: string;
  grahamNumber: number;       // pre-computed by FMP
  returnOnEquity: number;     // ROE (decimal, e.g. 0.15 = 15%)
  netCurrentAssetValue: number;
  workingCapital: number;
  currentRatio: number;
}

export interface FmpRatios {
  symbol: string;
  priceToEarningsRatio: number;
  priceToBookRatio: number;
  debtToEquityRatio: number;
  dividendYield: number;
  grossProfitMargin: number;
  bookValuePerShare: number;
  freeCashFlowPerShare: number;
}

export async function fetchKeyMetrics(symbol: string): Promise<FmpKeyMetrics | null> {
  const data = await fetchFmp<FmpKeyMetrics[]>(`/key-metrics?symbol=${symbol}&limit=1`);
  return data?.[0] ?? null;
}

export async function fetchRatios(symbol: string): Promise<FmpRatios | null> {
  const data = await fetchFmp<FmpRatios[]>(`/ratios?symbol=${symbol}&limit=1`);
  return data?.[0] ?? null;
}

// ─── Historical Prices (sparkline data) ──────────────────────────

export interface FmpEod {
  symbol: string;
  date: string;
  price: number;
  volume: number;
}

export async function fetchHistorical(symbol: string, limit = 30): Promise<FmpEod[]> {
  const data = await fetchFmp<FmpEod[]>(
    `/historical-price-eod/light?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
    86400,
  );
  // Reverse to get oldest-first for chart rendering
  return (data ?? []).reverse();
}
