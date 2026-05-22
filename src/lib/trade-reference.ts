/**
 * Per-symbol reference data — the slow-moving facts that a retail
 * investor would have to dig through Bloomberg / SET filings for:
 * fundamentals, peer set, dividend cadence, macro sensitivity,
 * analyst consensus, recent insider/foreign flow snapshots.
 *
 * Pure constants for now. Wire to real APIs (FMP, SETSMART) when
 * keys are configured — function shapes stay the same.
 */

export interface AnalystConsensus {
  buy: number; hold: number; sell: number;
  priceTargetLow: number; priceTargetHigh: number; priceTargetAvg: number;
}

export interface MacroSensitivity {
  driver: string;            // e.g. "Brent crude", "US 10Y yield", "USD/THB"
  beta: number;              // sensitivity coefficient (>0 bull, <0 bear)
  rationale: string;         // one-line plain English
}

export interface ForeignFlowSnap {
  d5Net: number;             // ฿M, foreign net buy 5d
  d20Net: number;            // ฿M, foreign net buy 20d
  d5Block: number;           // ฿M, block trade volume 5d
  ownership: number;         // foreign ownership %
  foreignLimit: number;      // foreign ownership ceiling %
}

export interface UpcomingEvent {
  date: string;
  type: "earnings" | "ex-dividend" | "agm" | "guidance" | "split";
  label: string;
}

export interface StockReference {
  symbol: string;
  name: string;
  nameTh: string;
  sector: string;
  industry: string;
  marketCapBn: number;       // ฿ billions
  pe: number;
  forwardPe: number;
  pb: number;
  roe: number;               // %
  roa: number;               // %
  debtEquity: number;
  dividendYield: number;     // %
  payoutRatio: number;       // %
  freeFloat: number;         // %
  beta: number;              // vs SET
  rev3yCagr: number;         // %
  eps3yCagr: number;         // %
  fcfYield: number;          // %
  // Operational signals (mocked — wire to real feeds later)
  analyst: AnalystConsensus;
  macro: MacroSensitivity[];
  foreignFlow: ForeignFlowSnap;
  upcoming: UpcomingEvent[];
  peers: string[];           // peer symbols (also in this dict)
  thesis: string;            // 1-line bull case
  risks: string[];           // 2-3 bear bullets
}

export const STOCK_REFERENCE: Record<string, StockReference> = {
  "PTT.BK": {
    symbol: "PTT.BK",
    name: "PTT Public Co.",
    nameTh: "บริษัท ปตท. จำกัด (มหาชน)",
    sector: "Energy",
    industry: "Integrated Oil & Gas",
    marketCapBn: 1020,
    pe: 8.4,
    forwardPe: 7.9,
    pb: 0.92,
    roe: 11.2,
    roa: 4.8,
    debtEquity: 0.62,
    dividendYield: 5.4,
    payoutRatio: 45,
    freeFloat: 49,
    beta: 1.08,
    rev3yCagr: 4.1,
    eps3yCagr: -2.4,
    fcfYield: 7.2,
    analyst: { buy: 18, hold: 8, sell: 2, priceTargetLow: 32, priceTargetHigh: 44, priceTargetAvg: 38.5 },
    macro: [
      { driver: "Brent crude",  beta:  0.72, rationale: "Upstream earnings track Brent; +10% oil ≈ +7% EPS" },
      { driver: "USD/THB",      beta:  0.34, rationale: "USD-denominated revenue, weak THB lifts THB earnings" },
      { driver: "Thai GDP",     beta:  0.18, rationale: "Domestic gas & retail volume tied to industrial demand" },
    ],
    foreignFlow: { d5Net:  +210, d20Net:  +850, d5Block:  +120, ownership: 11.4, foreignLimit: 49 },
    upcoming: [
      { date: "2026-05-22", type: "earnings",      label: "Q1 results · pre-market" },
      { date: "2026-06-04", type: "ex-dividend",   label: "Interim dividend ฿1.10/share" },
      { date: "2026-07-18", type: "agm",           label: "Investor day — 2030 strategy" },
    ],
    peers: ["BCP.BK", "TOP.BK", "IRPC.BK", "OR.BK"],
    thesis: "Integrated cash machine — pays out 5%+ yield while Brent stays > $70.",
    risks: [
      "Oil price collapse below $60 squeezes upstream cash",
      "Energy transition tax / carbon pricing on legacy assets",
      "Petrochem margins under pressure from China overcapacity",
    ],
  },

  "ADVANC.BK": {
    symbol: "ADVANC.BK",
    name: "Advanced Info Service",
    nameTh: "บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)",
    sector: "Telecom",
    industry: "Wireless Telecom Services",
    marketCapBn: 690,
    pe: 22.6,
    forwardPe: 19.4,
    pb: 8.1,
    roe: 36.4,
    roa: 9.1,
    debtEquity: 1.45,
    dividendYield: 3.8,
    payoutRatio: 86,
    freeFloat: 36,
    beta: 0.62,
    rev3yCagr: 6.2,
    eps3yCagr: 4.8,
    fcfYield: 5.1,
    analyst: { buy: 22, hold: 4, sell: 1, priceTargetLow: 220, priceTargetHigh: 280, priceTargetAvg: 252.8 },
    macro: [
      { driver: "USD/THB",      beta: -0.28, rationale: "Spectrum capex partly USD; strong THB helps margins" },
      { driver: "Thai GDP",     beta:  0.45, rationale: "Mobile + broadband ARPU tracks consumer income" },
      { driver: "US 10Y yield", beta: -0.31, rationale: "Bond-proxy: higher rates compress dividend stock multiples" },
    ],
    foreignFlow: { d5Net:  +95,  d20Net:  +320, d5Block:   +40, ownership: 23.8, foreignLimit: 49 },
    upcoming: [
      { date: "2026-05-27", type: "earnings",      label: "Q1 results · post-market" },
      { date: "2026-05-09", type: "ex-dividend",   label: "Final dividend ฿4.80/share — passed" },
      { date: "2026-08-15", type: "guidance",      label: "5G ARPU update mid-year call" },
    ],
    peers: ["TRUE.BK", "JAS.BK", "DIF.BK", "INTUCH.BK"],
    thesis: "Telecom duopoly with 36% ROE — bond-proxy with growth optionality.",
    risks: [
      "5G capex cycle compresses near-term FCF",
      "TRUE-DTAC merger heats up price competition",
      "Higher rates compress P/E of dividend stocks",
    ],
  },

  "KBANK.BK": {
    symbol: "KBANK.BK",
    name: "Kasikornbank",
    nameTh: "ธนาคารกสิกรไทย จำกัด (มหาชน)",
    sector: "Financials",
    industry: "Diversified Banks",
    marketCapBn: 335,
    pe: 7.8,
    forwardPe: 7.1,
    pb: 0.68,
    roe: 9.4,
    roa: 1.1,
    debtEquity: 8.40,         // banks: high D/E is structural
    dividendYield: 4.6,
    payoutRatio: 36,
    freeFloat: 71,
    beta: 1.22,
    rev3yCagr: 3.4,
    eps3yCagr: 8.1,
    fcfYield: 0,              // n/a for banks
    analyst: { buy: 14, hold: 11, sell: 3, priceTargetLow: 130, priceTargetHigh: 175, priceTargetAvg: 156.4 },
    macro: [
      { driver: "BOT policy rate", beta:  0.56, rationale: "Higher rates expand net interest margin" },
      { driver: "Thai GDP",         beta:  0.61, rationale: "Loan growth + credit quality follow GDP cycle" },
      { driver: "USD/THB",          beta: -0.18, rationale: "FX-linked loan book; weak THB raises NPL risk" },
    ],
    foreignFlow: { d5Net: -180, d20Net: -420, d5Block:   -65, ownership: 27.9, foreignLimit: 49 },
    upcoming: [
      { date: "2026-05-29", type: "earnings",      label: "Q1 results · pre-market" },
      { date: "2026-06-12", type: "ex-dividend",   label: "Interim dividend ฿2.50/share" },
      { date: "2026-07-30", type: "guidance",      label: "Mid-year NPL & rate guidance" },
    ],
    peers: ["BBL.BK", "SCB.BK", "KTB.BK", "TMB.BK"],
    thesis: "Below book value, 9%+ ROE, leverage to Thai recovery and BOT rate path.",
    risks: [
      "NPL spike from SME stress if Thai GDP < 2%",
      "BOT pivot to cut rates compresses NIM",
      "Capital adequacy regulation under Basel IV",
    ],
  },
};

export function getReference(symbol: string): StockReference | undefined {
  return STOCK_REFERENCE[symbol];
}

/** Lookup peers' fundamentals if available. */
export function peersOf(symbol: string): StockReference[] {
  const ref = STOCK_REFERENCE[symbol];
  if (!ref) return [];
  return ref.peers
    .map(p => STOCK_REFERENCE[p])
    .filter((p): p is StockReference => Boolean(p));
}
