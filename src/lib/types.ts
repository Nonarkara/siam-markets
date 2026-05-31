// ─── Market Data ─────────────────────────────────────────────────

export interface IndexQuote {
  symbol: string;        // "^SET.BK", "^GSPC", "^N225"
  name: string;          // "SET", "S&P 500", "Nikkei"
  price: number;
  change: number;        // absolute change
  changePct: number;     // % change, e.g. -1.23
  high52w: number;
  low52w: number;
  updatedAt: string;     // ISO 8601
}

export interface StockQuote {
  symbol: string;        // "PTT.BK"
  name: string;          // "PTT Public Company"
  price: number;
  change: number;
  changePct: number;
  volume: number;
  updatedAt: string;
}

export interface Sparkline {
  symbol: string;
  prices: number[];      // 30 daily closes, oldest first
  dates: string[];       // matching ISO date strings
}

export interface FearGreed {
  score: number;         // 0–100
  label: "extreme_fear" | "fear" | "neutral" | "greed" | "extreme_greed";
  updatedAt: string;
}

export interface THBRate {
  usd: number;           // THB per 1 USD
  updatedAt: string;
}

// ─── Fundamentals / Graham metrics ───────────────────────────────

export interface StockFundamentals {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  eps: number;           // earnings per share (TTM)
  bvps: number;          // book value per share
  pe: number;            // price / earnings
  pb: number;            // price / book
  roe: number;           // return on equity % (5yr avg)
  roe10: number;         // roe 10yr avg (if available)
  dividendYield: number; // %
  debtToEquity: number;
  grossMargin: number;   // %
  fcf: number;           // free cash flow (USD/THB millions)
  netIncome: number;
  marketCap: number;
  // computed
  grahamNumber: number;
  marginOfSafety: number;   // % — (grahamNumber - price) / grahamNumber * 100
  defensiveScore: number;   // 0–7 Graham criteria
  buffettScore: number;     // 0–10 quality score
  moat: MoatType;
  updatedAt: string;
}

export type MoatType = "wide" | "narrow" | "none" | "unknown";

// ─── World Events ─────────────────────────────────────────────────

export interface WorldEvent {
  id: string;
  date: string;          // ISO date
  headline: string;
  country: string;       // ISO 2-letter code
  countryName: string;
  sentiment: number;     // -1 to +1 (GDELT tone)
  setChangePct: number | null;  // SET % on that day (null if weekend)
  spxChangePct: number | null;  // S&P 500 % on that day
  source: string;
  url?: string;
}

// ─── Macro indicators ────────────────────────────────────────────

export interface MacroIndicator {
  key: string;           // "us_fed_rate", "th_cpi", "set_pe", "cape"
  label: string;
  value: number;
  unit: string;          // "%", "x", "THB"
  updatedAt: string;
  trend: "up" | "down" | "flat";
}

export interface MacroPill {
  fedRate: number;
  thCpi: number;
  setPe: number;         // current SET average P/E
  cape: number;          // Shiller CAPE (S&P)
  thbUsd: number;
}

// ─── Portfolio (local, no login) ──────────────────────────────────

export interface Holding {
  id: string;
  fundName: string;
  fundType: "RMF" | "SSF" | "ThaiESG" | "Stock" | "Other";
  amount: number;        // THB invested total
  purchaseDate: string;  // ISO date
  notes?: string;
}

export interface TaxCalcInput {
  annualIncome: number;  // THB
  rmfAmount: number;
  thaiEsgAmount: number;
  ssfAmount: number;
}

export interface TaxCalcResult {
  rmfDeduction: number;
  thaiEsgDeduction: number;
  ssfDeduction: number;
  totalDeduction: number;
  estimatedTaxSaved: number;
  marginalRate: number;  // %
}

// ─── Investment School concepts ───────────────────────────────────

export interface Concept {
  id: string;
  title: string;
  subtitle: string;
  definition: string;    // one sentence, plain language
  signal: string;        // "Today: SET P/E 15.4 — Graham says fair value"
  quote: string;
  quoteAuthor: string;
  learnMore: string;     // 2–3 sentences deeper
}

// ─── Technical Analysis ──────────────────────────────────────────

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SRLevel {
  price: number;
  touches: number;
  strength: "weak" | "moderate" | "strong";
}

export interface TradeSignal {
  type: "buy" | "sell" | "neutral";
  confidence: number;
  reasons: string[];
  entry?: number;
  stopLoss?: number;
  target?: number;
  riskReward?: number;
}

export type MarketRegime = "trending_up" | "trending_down" | "ranging" | "high_volatility";

export type CandlePattern =
  | "doji"
  | "hammer"
  | "shooting_star"
  | "engulfing_bull"
  | "engulfing_bear"
  | "inside_bar"
  | "none";

// ─── Paper Trading ───────────────────────────────────────────────

export interface SimulatedTrade {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  target: number;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  status: "open" | "closed" | "stopped" | "targeted";
  pnl?: number;
  pnlPct?: number;
  riskReward: number;
  reason: string;
  journal?: string;
}

export interface SimPortfolio {
  cash: number;
  initialCash: number;
  trades: SimulatedTrade[];
  equityCurve: { date: string; equity: number }[];
}

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  currentEquity: number;
  totalReturnPct: number;
}

// ─── API response envelope ───────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  cachedAt?: string;
}

// ─── Data confidence ─────────────────────────────────────────────

export type DataFreshness = "live" | "daily" | "weekly" | "monthly";

export interface DataSource {
  name: string;
  url: string;
  freshness: DataFreshness;
}

// Completed simulator trade persisted to Firestore (analytics). Shape per
// src/lib/firebase/tradeService.ts.
export interface Trade {
  id: string;
  ticker: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  type: string;
  status: string;
  entryTime: string;
  exitTime: string;
  pnl: number;
  pnlPct: number;
  reason: string;
}
