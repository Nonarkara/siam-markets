/**
 * /api/scanner — SET stock fundamentals scanner.
 *
 * Reads from Supabase `fundamentals` table (populated by
 * ingestion/fundamentals.py — schema: symbol, name, sector, price, eps,
 * bvps, pe, pb, roe, dividend_yield, debt_to_equity, gross_margin,
 * graham_number, margin_of_safety, market_cap, updated_at).
 *
 * Falls back to MOCK_STOCKS when Supabase env is missing or query fails.
 *
 * Always returns `source` honestly so the UI's DataFreshness badge can
 * tell the user "CACHED · 1h ago" vs "DEMO DATA · NOT TRADEABLE".
 *
 * Query params:
 *   ?graham=true  → only return stocks passing Graham's defensive
 *                   filter (P/E ≤ 15 AND P/B ≤ 1.5 AND MOS > 0)
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MOCK_STOCKS } from "@/lib/api/mock";
import type { ApiResponse, StockFundamentals } from "@/lib/types";

export const runtime    = "edge";
export const revalidate = 3600;

export interface ScannerData {
  stocks:        StockFundamentals[];
  setPe:         number;
  lastUpdated:   string;                       // timestamp of newest row
  oldestUpdate:  string | null;                // oldest row → freshness anchor
  source:        "supabase" | "mock";
  note:          string;
}

// Schema returned by Supabase fundamentals table
interface FundamentalsRow {
  symbol:           string;
  name:             string;
  sector:           string | null;
  price:            number | null;
  eps:              number | null;
  bvps:             number | null;
  pe:               number | null;
  pb:               number | null;
  roe:              number | null;
  dividend_yield:   number | null;
  debt_to_equity:   number | null;
  gross_margin:     number | null;
  graham_number:    number | null;
  margin_of_safety: number | null;
  market_cap:       number | null;
  updated_at:       string | null;
}

function rowToFundamental(r: FundamentalsRow): StockFundamentals {
  const pe   = r.pe ?? 0;
  const pb   = r.pb ?? 0;
  const roe  = r.roe ?? 0;
  const mos  = r.margin_of_safety ?? 0;

  // Defensive Score (0-7) — Graham's 7 criteria approximated from available columns
  let defensiveScore = 0;
  if ((r.market_cap ?? 0) > 50_000_000_000) defensiveScore++;       // adequate size (≥ ฿50B)
  if (pe > 0 && pe <= 15)                    defensiveScore++;       // P/E ≤ 15
  if (pb > 0 && pb <= 1.5)                   defensiveScore++;       // P/B ≤ 1.5
  if (roe >= 10)                             defensiveScore++;       // ROE ≥ 10%
  if ((r.dividend_yield ?? 0) > 0)           defensiveScore++;       // dividend record
  if ((r.debt_to_equity ?? 99) < 1)          defensiveScore++;       // financial strength
  if (mos > 0)                               defensiveScore++;       // price below Graham #

  return {
    symbol:         r.symbol,
    name:           r.name,
    sector:         r.sector ?? "",
    price:          r.price ?? 0,
    eps:            r.eps ?? 0,
    bvps:           r.bvps ?? 0,
    pe,
    pb,
    roe,
    roe10:          roe,                     // not tracked separately in ingestion yet
    dividendYield:  r.dividend_yield ?? 0,
    debtToEquity:   r.debt_to_equity ?? 0,
    grossMargin:    r.gross_margin ?? 0,
    fcf:            0,                       // not tracked yet
    netIncome:      0,                       // not tracked yet
    marketCap:      r.market_cap ?? 0,
    grahamNumber:   r.graham_number ?? 0,
    marginOfSafety: mos,
    defensiveScore,
    buffettScore:   0,                       // not tracked yet
    moat:           "unknown",
    updatedAt:      r.updated_at ?? new Date().toISOString(),
  };
}

function mockPayload(grahamOnly: boolean): ScannerData {
  let stocks = MOCK_STOCKS;
  if (grahamOnly) stocks = stocks.filter(s => s.pe <= 15 && s.pb <= 1.5 && s.marginOfSafety > 0);
  stocks = [...stocks].sort((a, b) => b.marginOfSafety - a.marginOfSafety);
  return {
    stocks,
    setPe:        15.4,
    lastUpdated:  new Date().toISOString(),
    oldestUpdate: null,
    source:       "mock",
    note:         "Demo fundamentals — run ingestion/fundamentals.py to populate Supabase. Do not trade on this data.",
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grahamOnly = searchParams.get("graham") === "true";

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  // No env → fall back to mock
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { success: true, data: mockPayload(grahamOnly) } satisfies ApiResponse<ScannerData>,
      { headers: { "Cache-Control": "public, s-maxage=60" } },
    );
  }

  try {
    const sb = createClient(supabaseUrl, supabaseKey);
    let query = sb
      .from("fundamentals")
      .select("symbol, name, sector, price, eps, bvps, pe, pb, roe, dividend_yield, debt_to_equity, gross_margin, graham_number, margin_of_safety, market_cap, updated_at")
      .order("margin_of_safety", { ascending: false });

    if (grahamOnly) {
      query = query.lte("pe", 15).lte("pb", 1.5).gt("margin_of_safety", 0);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { success: true, data: mockPayload(grahamOnly) } satisfies ApiResponse<ScannerData>,
        { headers: { "Cache-Control": "public, s-maxage=60" } },
      );
    }

    const stocks = data.map(rowToFundamental);
    const updatedAts = data
      .map(r => r.updated_at)
      .filter((s): s is string => Boolean(s))
      .sort();

    const payload: ScannerData = {
      stocks,
      setPe:        15.4,
      lastUpdated:  updatedAts[updatedAts.length - 1] ?? new Date().toISOString(),
      oldestUpdate: updatedAts[0] ?? null,
      source:       "supabase",
      note:         `Supabase fundamentals · ${stocks.length} stocks · ingestion via fundamentals.py`,
    };

    return NextResponse.json(
      { success: true, data: payload } satisfies ApiResponse<ScannerData>,
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json(
      { success: true, data: mockPayload(grahamOnly) } satisfies ApiResponse<ScannerData>,
      { headers: { "Cache-Control": "public, s-maxage=60" } },
    );
  }
}
