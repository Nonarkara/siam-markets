import { NextResponse } from "next/server";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate } from "@/lib/api/bot";
import { fetchIndexQuotes, type FmpQuote } from "@/lib/api/fmp";
import { MOCK_SET, MOCK_INDICES, MOCK_MACRO } from "@/lib/api/mock";
import type { ApiResponse, IndexQuote } from "@/lib/types";

export const revalidate = 300; // 5 minutes

export interface PulseData {
  set: IndexQuote;
  indices: IndexQuote[];
  fearGreed: Awaited<ReturnType<typeof fetchFearGreed>>;
  thb: Awaited<ReturnType<typeof fetchThbRate>>;
  macro: typeof MOCK_MACRO;
  dataSource: "live" | "mock";
}

function fmpToIndexQuote(q: FmpQuote): IndexQuote {
  return {
    symbol: q.symbol,
    name: q.name,
    price: q.price,
    change: q.change,
    changePct: q.changePercentage,
    high52w: q.yearHigh,
    low52w: q.yearLow,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const [fearGreed, thb, liveIndices] = await Promise.all([
      fetchFearGreed(),
      fetchThbRate(),
      fetchIndexQuotes(),
    ]);

    const hasLiveData = liveIndices.length > 0;
    const indices = hasLiveData
      ? liveIndices.map(fmpToIndexQuote)
      : MOCK_INDICES;

    const data: PulseData = {
      set: MOCK_SET,  // SET.BK not on FMP free tier — Python ingestion needed
      indices,
      fearGreed,
      thb,
      macro: {
        ...MOCK_MACRO,
        thbUsd: thb.usd,
      },
      dataSource: hasLiveData ? "live" : "mock",
    };

    return NextResponse.json({ success: true, data } satisfies ApiResponse<PulseData>);
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: String(err) } satisfies ApiResponse<null>,
      { status: 500 },
    );
  }
}
