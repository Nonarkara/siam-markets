/**
 * GET /api/aristocrats
 *
 * Returns the 8 Dividend Aristocrats from the Dalio Stage 5 defensive portfolio
 * (RESEARCH_DEEP_MARKET_CYCLES.md brief). Merges live Yahoo Finance prices with
 * hardcoded dividend metadata (years of consecutive growth, yield, sector).
 *
 * Yahoo's free-tier quote only gives price + changePct — dividend data is hardcoded
 * from publicly available S&P Dividend Aristocrats records.
 */

import { fetchYahooQuote } from "@/lib/api/yahoo";
import { NextResponse } from "next/server";

export const revalidate = 300; // 5-minute cache

export interface AristocratEntry {
  symbol:        string;
  name:          string;
  sector:        string;
  note:          string;
  years:         number;   // consecutive years of dividend growth
  divYield:      number;   // annual yield %, hardcoded reference
  annualDiv:     number;   // approx annual dividend per share (USD)
  price:         number | null;
  changePct:     number | null;
  updatedAt:     string | null;
}

// ─── Hardcoded Dividend Aristocrat metadata ──────────────────────────────────
// Source: S&P Dividend Aristocrats index roster, May 2026.
// Div yield is a reference snapshot — actual yield = annualDiv / live price.
const META: Omit<AristocratEntry, "price" | "changePct" | "updatedAt">[] = [
  { symbol: "LIN",  name: "Linde plc",                   sector: "Materials",   note: "Industrial gases",  years: 31, divYield: 1.4, annualDiv: 5.60 },
  { symbol: "ED",   name: "Consolidated Edison",          sector: "Utilities",   note: "NYC electricity",   years: 49, divYield: 4.1, annualDiv: 3.28 },
  { symbol: "ADP",  name: "Automatic Data Processing",   sector: "Technology",  note: "Payroll giant",     years: 49, divYield: 2.1, annualDiv: 6.16 },
  { symbol: "GWW",  name: "W.W. Grainger",               sector: "Industrials", note: "Industrial supply", years: 52, divYield: 0.9, annualDiv: 8.40 },
  { symbol: "SJM",  name: "J.M. Smucker",                sector: "Consumer",    note: "Food brands",       years: 26, divYield: 3.9, annualDiv: 4.28 },
  { symbol: "ES",   name: "Eversource Energy",           sector: "Utilities",   note: "NE electricity",    years: 25, divYield: 4.9, annualDiv: 2.80 },
  { symbol: "FAST", name: "Fastenal",                    sector: "Industrials", note: "Fasteners dist.",   years: 25, divYield: 2.7, annualDiv: 1.76 },
  { symbol: "ECL",  name: "Ecolab",                      sector: "Materials",   note: "Water treatment",   years: 31, divYield: 1.1, annualDiv: 2.28 },
];

export async function GET() {
  const results: AristocratEntry[] = await Promise.all(
    META.map(async (m) => {
      const quote = await fetchYahooQuote(m.symbol, m.name).catch(() => null);
      // Calculate live yield from annualDiv / live price if available
      const liveYield = quote?.price ? (m.annualDiv / quote.price) * 100 : m.divYield;
      return {
        ...m,
        divYield:  Math.round(liveYield * 10) / 10,
        price:     quote?.price    ?? null,
        changePct: quote?.changePct ?? null,
        updatedAt: quote?.updatedAt ?? null,
      };
    }),
  );

  return NextResponse.json({ aristocrats: results, generatedAt: new Date().toISOString() });
}
