import { NextResponse } from "next/server";
import { fetchHistoricalPrices } from "@/lib/api/yahoo";
import { forecast, probabilityAtOrAbove, staticForecastAsOf, type ForecastResult } from "@/lib/api/timesfm";

export const runtime = "edge";
export const revalidate = 1800; // 30 min

export interface ForecastApiResponse {
  symbol: string;
  asOf: string;
  lastClose: number;
  horizon: number;
  frequency: string;
  forecast: ForecastResult;
  probabilities: {
    aboveLastClose: number;
    above1pct: number;
    below1pct: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol  = searchParams.get("symbol")  ?? "^SET.BK";
  const horizon = clampInt(searchParams.get("horizon"), 5, 1, 30);

  // We still pull a short history. The StaticJsonForecaster ignores it; the
  // stub uses it for the random-walk band; either way we need `lastClose`
  // for probability framing and as a sanity anchor.
  const history = await fetchHistoricalPrices(symbol, "3mo", "1d");
  const series  = history.map((p) => p.close).filter((c) => c > 0);
  const lastClose = series.length ? series[series.length - 1] : 0;

  const result = await forecast({ symbol, series, horizon, frequency: "D" });

  return NextResponse.json({
    symbol,
    asOf: staticForecastAsOf() ?? new Date().toISOString(),
    lastClose,
    horizon: result.horizon,
    frequency: result.frequency,
    forecast: result,
    probabilities: {
      aboveLastClose: probabilityAtOrAbove(result, lastClose),
      above1pct:      probabilityAtOrAbove(result, lastClose * 1.01),
      below1pct:      1 - probabilityAtOrAbove(result, lastClose * 0.99),
    },
  } satisfies ForecastApiResponse);
}

function clampInt(raw: string | null, def: number, lo: number, hi: number): number {
  if (!raw) return def;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(lo, Math.min(hi, n));
}
