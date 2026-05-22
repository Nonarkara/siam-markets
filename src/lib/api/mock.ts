/**
 * Mock data — used when APIs are unavailable or keys not yet configured.
 * Provides realistic SET50 data so the UI renders fully on first load.
 */

import type { IndexQuote, StockFundamentals, WorldEvent, MacroPill, OHLCV } from "../types";
import { grahamNumber, marginOfSafety } from "../graham";

// ─── Mock Market Pulse ────────────────────────────────────────────

export const MOCK_SET: IndexQuote = {
  symbol: "^SET.BK",
  name: "SET",
  price: 1312.45,
  change: -8.23,
  changePct: -0.62,
  high52w: 1506.22,
  low52w: 1202.34,
  updatedAt: new Date().toISOString(),
};

export const MOCK_INDICES: IndexQuote[] = [
  { symbol: "^GSPC",  name: "S&P 500",   price: 5247.49, change: 23.1,   changePct: 0.44,  high52w: 5783, low52w: 4103, updatedAt: new Date().toISOString() },
  { symbol: "^N225",  name: "Nikkei",    price: 38412.0, change: -201.3, changePct: -0.52, high52w: 42426, low52w: 30487, updatedAt: new Date().toISOString() },
  { symbol: "^HSI",   name: "Hang Seng", price: 19832.2, change: 142.5,  changePct: 0.72,  high52w: 22504, low52w: 14794, updatedAt: new Date().toISOString() },
  { symbol: "^ESTI",  name: "STI",       price: 3812.1,  change: -6.3,   changePct: -0.17, high52w: 3955,  low52w: 3012,  updatedAt: new Date().toISOString() },
];

export const MOCK_MACRO: MacroPill = {
  fedRate: 5.25,
  thCpi: 2.1,
  setPe: 15.4,
  cape: 34.2,
  thbUsd: 33.5,
};

// ─── Mock SET50 Fundamentals ──────────────────────────────────────

function makeFundamental(
  symbol: string, name: string, sector: string,
  price: number, eps: number, bvps: number,
  pe: number, pb: number, roe: number, roe10: number,
  divYield: number, de: number, grossMargin: number,
  moat: "wide" | "narrow" | "none" | "unknown",
): StockFundamentals {
  const gn = grahamNumber(eps, bvps);
  const mos = marginOfSafety(price, gn);
  const dScore = [
    true,                  // adequate size
    de < 1,                // financial strength
    true,                  // earnings stability (assumed for SET50)
    divYield > 0,          // dividend record
    true,                  // earnings growth (assumed)
    pe <= 15,              // P/E ≤ 15
    pb <= 1.5,             // P/B ≤ 1.5
  ].filter(Boolean).length;

  const bScore = (
    (roe10 >= 20 ? 2 : 0) +
    (roe >= 15 ? 2 : 0) +
    (de < 1 ? 2 : 0) +
    (grossMargin > 40 ? 2 : 0) +
    2  // simplified: assume FCF > NI for mocks
  );

  return {
    symbol, name, sector, price, eps, bvps, pe, pb,
    roe, roe10, dividendYield: divYield, debtToEquity: de,
    grossMargin, fcf: eps * 0.85, netIncome: eps,
    marketCap: price * 1e8,
    grahamNumber: gn,
    marginOfSafety: mos,
    defensiveScore: dScore,
    buffettScore: Math.min(10, bScore),
    moat,
    updatedAt: new Date().toISOString(),
  };
}

export const MOCK_STOCKS: StockFundamentals[] = [
  makeFundamental("PTT.BK",    "PTT",             "Energy",      35.5, 3.2,  38.1,  11.1, 0.93, 14.2, 12.1, 5.2, 0.6,  22.1, "wide"),
  makeFundamental("ADVANC.BK", "Advanced Info",   "Telecom",     232.0, 12.4, 45.2, 18.7, 5.1,  82.5, 75.3, 6.1, 1.2,  68.4, "wide"),
  makeFundamental("KBANK.BK",  "Kasikorn Bank",   "Banking",     141.0, 18.6, 192.4, 7.6, 0.73, 9.8,  9.2,  3.0, 7.8,  55.2, "narrow"),
  makeFundamental("SCB.BK",    "SCB",             "Banking",     108.5, 13.2, 148.7, 8.2, 0.73, 9.1,  8.8,  2.8, 8.2,  52.1, "narrow"),
  makeFundamental("BBL.BK",    "Bangkok Bank",    "Banking",     157.0, 20.1, 218.5, 7.8, 0.72, 9.3,  8.9,  3.1, 6.1,  54.3, "narrow"),
  makeFundamental("CPALL.BK",  "CP All",          "Consumer",    64.5,  2.9,  12.8,  22.2, 5.0,  38.4, 35.1, 1.8, 1.8,  28.3, "wide"),
  makeFundamental("GULF.BK",   "Gulf Energy",     "Utilities",   44.75, 1.8,  22.3,  24.9, 2.0,  11.2, 10.8, 2.1, 2.4,  32.1, "narrow"),
  makeFundamental("PTTGC.BK",  "PTTGC",           "Chemicals",   43.5,  1.2,  65.4,  36.3, 0.67, 3.1,  5.2,  4.0, 0.9,  18.2, "narrow"),
  makeFundamental("SCC.BK",    "Siam Cement",     "Materials",   360.0, 30.2, 326.8, 11.9, 1.10, 9.8,  12.3, 4.2, 1.1,  28.9, "wide"),
  makeFundamental("MINT.BK",   "Minor Int'l",     "Tourism",     33.25, 1.4,  16.2,  23.8, 2.05, 9.2,  8.1,  1.2, 1.8,  35.6, "narrow"),
  makeFundamental("CPN.BK",    "Central Pattana", "Real Estate", 58.75, 3.1,  28.4,  19.0, 2.07, 11.4, 10.2, 2.8, 1.9,  45.2, "wide"),
  makeFundamental("HMPRO.BK",  "HomePro",         "Consumer",    14.8,  0.72, 5.8,   20.6, 2.55, 30.1, 28.4, 3.5, 0.5,  38.4, "narrow"),
  makeFundamental("AOT.BK",    "Airports of TH",  "Transport",   63.25, 2.1,  16.8,  30.1, 3.77, 12.8, 18.3, 1.2, 0.1,  55.8, "wide"),
  makeFundamental("TRUE.BK",   "True Corp",       "Telecom",     9.15,  0.21, 6.4,   43.6, 1.43, 3.2,  2.8,  0.0, 3.2,  42.1, "narrow"),
  makeFundamental("RATCH.BK",  "Ratchaburi",      "Utilities",   35.5,  4.2,  52.3,  8.5,  0.68, 8.3,  9.1,  5.8, 0.7,  31.2, "narrow"),
];

// ─── Mock World Events ────────────────────────────────────────────

export const MOCK_EVENTS: WorldEvent[] = [
  {
    id: "evt-1", date: "2026-05-15T09:00:00Z",
    headline: "Fed signals potential rate pause in June meeting",
    country: "US", countryName: "United States",
    sentiment: 0.12, setChangePct: 1.3, spxChangePct: 0.8,
    source: "reuters.com",
  },
  {
    id: "evt-2", date: "2026-05-14T06:30:00Z",
    headline: "US-China trade tensions escalate over semiconductor exports",
    country: "CN", countryName: "China",
    sentiment: -0.45, setChangePct: -0.9, spxChangePct: -1.2,
    source: "ft.com",
  },
  {
    id: "evt-3", date: "2026-05-13T11:00:00Z",
    headline: "Thailand GDP growth beats forecast at 3.2% in Q1 2026",
    country: "TH", countryName: "Thailand",
    sentiment: 0.38, setChangePct: 1.8, spxChangePct: null,
    source: "bangkokpost.com",
  },
  {
    id: "evt-4", date: "2026-05-12T08:00:00Z",
    headline: "BOT holds policy rate at 2.5% amid global uncertainty",
    country: "TH", countryName: "Thailand",
    sentiment: 0.05, setChangePct: -0.3, spxChangePct: null,
    source: "bot.or.th",
  },
  {
    id: "evt-5", date: "2026-05-10T04:00:00Z",
    headline: "Oil prices fall 4% on OPEC+ supply increase announcement",
    country: "US", countryName: "United States",
    sentiment: -0.28, setChangePct: -1.4, spxChangePct: -0.7,
    source: "bloomberg.com",
  },
  {
    id: "evt-6", date: "2026-05-08T07:30:00Z",
    headline: "ASEAN economic ministers agree on digital trade framework",
    country: "SG", countryName: "Singapore",
    sentiment: 0.22, setChangePct: 0.5, spxChangePct: 0.2,
    source: "channelnewsasia.com",
  },
];

// ─── Mock OHLCV Data (60 days of simulated PTT.BK price action) ───

function generateMockOHLCV(basePrice: number, days = 60, volatility = 0.02): OHLCV[] {
  const data: OHLCV[] = [];
  let price = basePrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;
    const volume = Math.floor(1_000_000 + Math.random() * 5_000_000);

    data.push({
      date: date.toISOString().split("T")[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return data;
}

export const MOCK_OHLCV_PTT: OHLCV[] = generateMockOHLCV(35.5, 60, 0.018);
export const MOCK_OHLCV_ADVANC: OHLCV[] = generateMockOHLCV(232.0, 60, 0.015);
export const MOCK_OHLCV_KBANK: OHLCV[] = generateMockOHLCV(141.0, 60, 0.016);

// Placeholder until the global scanner is wired to a real feed — keep
// the same shape as MOCK_STOCKS so callers (e.g. ScanShell) can swap
// markets without conditional typing.
export const MOCK_GLOBAL_STOCKS: StockFundamentals[] = MOCK_STOCKS;

// ─── Smart Money Flow Mock (14-day foreign/institutional flow) ───

export const MOCK_SMART_MONEY_FLOWS = [
  { date: "2026-05-05", foreignBuy: 3200, foreignSell: 2800, blockBuy: 450, blockSell: 320, institutionalBuy: 1800, institutionalSell: 1600 },
  { date: "2026-05-06", foreignBuy: 2900, foreignSell: 3100, blockBuy: 380, blockSell: 410, institutionalBuy: 1700, institutionalSell: 1900 },
  { date: "2026-05-07", foreignBuy: 3500, foreignSell: 2600, blockBuy: 520, blockSell: 280, institutionalBuy: 2100, institutionalSell: 1500 },
  { date: "2026-05-08", foreignBuy: 4100, foreignSell: 2400, blockBuy: 610, blockSell: 250, institutionalBuy: 2400, institutionalSell: 1400 },
  { date: "2026-05-09", foreignBuy: 3800, foreignSell: 2700, blockBuy: 480, blockSell: 310, institutionalBuy: 2200, institutionalSell: 1600 },
  { date: "2026-05-12", foreignBuy: 4200, foreignSell: 2300, blockBuy: 650, blockSell: 220, institutionalBuy: 2500, institutionalSell: 1300 },
  { date: "2026-05-13", foreignBuy: 3900, foreignSell: 2500, blockBuy: 580, blockSell: 260, institutionalBuy: 2300, institutionalSell: 1450 },
  { date: "2026-05-14", foreignBuy: 3600, foreignSell: 2900, blockBuy: 420, blockSell: 380, institutionalBuy: 2000, institutionalSell: 1750 },
  { date: "2026-05-15", foreignBuy: 3300, foreignSell: 3100, blockBuy: 390, blockSell: 420, institutionalBuy: 1850, institutionalSell: 1900 },
  { date: "2026-05-16", foreignBuy: 4500, foreignSell: 2100, blockBuy: 720, blockSell: 190, institutionalBuy: 2600, institutionalSell: 1200 },
  { date: "2026-05-17", foreignBuy: 4800, foreignSell: 1900, blockBuy: 810, blockSell: 170, institutionalBuy: 2800, institutionalSell: 1100 },
  { date: "2026-05-18", foreignBuy: 4400, foreignSell: 2200, blockBuy: 690, blockSell: 210, institutionalBuy: 2550, institutionalSell: 1350 },
  { date: "2026-05-19", foreignBuy: 4100, foreignSell: 2500, blockBuy: 580, blockSell: 290, institutionalBuy: 2300, institutionalSell: 1550 },
];

// ─── Sentiment Divergence Mock (14-day sentiment vs price) ────────

export const MOCK_SENTIMENT_DIVERGENCE = [
  { date: "2026-05-05", newsSentiment: 0.15, socialSentiment: 0.22, priceChange: 0.8, volumeRatio: 1.1 },
  { date: "2026-05-06", newsSentiment: -0.05, socialSentiment: 0.08, priceChange: -0.3, volumeRatio: 0.9 },
  { date: "2026-05-07", newsSentiment: 0.25, socialSentiment: 0.18, priceChange: 1.2, volumeRatio: 1.3 },
  { date: "2026-05-08", newsSentiment: 0.35, socialSentiment: 0.30, priceChange: 0.5, volumeRatio: 1.0 },
  { date: "2026-05-09", newsSentiment: 0.20, socialSentiment: 0.15, priceChange: -0.2, volumeRatio: 0.8 },
  { date: "2026-05-12", newsSentiment: -0.10, socialSentiment: -0.05, priceChange: -0.8, volumeRatio: 1.2 },
  { date: "2026-05-13", newsSentiment: -0.25, socialSentiment: -0.18, priceChange: -1.1, volumeRatio: 1.4 },
  { date: "2026-05-14", newsSentiment: -0.35, socialSentiment: -0.28, priceChange: -0.4, volumeRatio: 1.1 },
  { date: "2026-05-15", newsSentiment: -0.20, socialSentiment: -0.12, priceChange: 0.3, volumeRatio: 0.9 },
  { date: "2026-05-16", newsSentiment: -0.08, socialSentiment: 0.02, priceChange: 0.9, volumeRatio: 1.3 },
  { date: "2026-05-17", newsSentiment: 0.05, socialSentiment: 0.10, priceChange: 1.1, volumeRatio: 1.5 },
  { date: "2026-05-18", newsSentiment: 0.12, socialSentiment: 0.08, priceChange: -0.5, volumeRatio: 1.2 },
  { date: "2026-05-19", newsSentiment: -0.15, socialSentiment: -0.10, priceChange: -0.9, volumeRatio: 1.4 },
];

// ─── Gamma Exposure Mock (SET50 options proxy) ────────────────────

export const MOCK_GAMMA_CHAIN = {
  underlyingPrice: 890.5,
  strikes: [860, 870, 880, 890, 900, 910, 920],
  callOi: [1200, 2100, 3500, 5800, 4200, 2800, 1600],
  putOi: [800, 1500, 2800, 5200, 3800, 2200, 1100],
};

// News sentiment mock for trading page
export const MOCK_TRADING_NEWS = [
  {
    time: "10:30",
    headline: "PTT announces Q2 production target increase",
    sentiment: 0.35,
    impact: "high",
  },
  {
    time: "09:15",
    headline: "Oil futures rise 1.2% on Middle East supply concerns",
    sentiment: 0.22,
    impact: "medium",
  },
  {
    time: "08:45",
    headline: "SET index opens lower on regional weakness",
    sentiment: -0.18,
    impact: "medium",
  },
  {
    time: "Yesterday",
    headline: "Energy ministry reviews renewable transition timeline",
    sentiment: 0.08,
    impact: "low",
  },
];
