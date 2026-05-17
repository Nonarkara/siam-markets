import { NextResponse } from "next/server";
import { MOCK_STOCKS } from "@/lib/api/mock";
import type { ApiResponse, StockFundamentals } from "@/lib/types";

export const revalidate = 3600; // 1 hour

export interface ScannerData {
  stocks: StockFundamentals[];
  setPe: number;
  lastUpdated: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grahamOnly = searchParams.get("graham") === "true";

  // In production: read from Supabase table populated by ingestion/fundamentals.py
  let stocks = MOCK_STOCKS;

  if (grahamOnly) {
    stocks = stocks.filter((s) => s.pe <= 15 && s.pb <= 1.5 && s.marginOfSafety > 0);
  }

  // Sort by margin of safety descending
  stocks = [...stocks].sort((a, b) => b.marginOfSafety - a.marginOfSafety);

  const data: ScannerData = {
    stocks,
    setPe: 15.4,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data } satisfies ApiResponse<ScannerData>);
}
