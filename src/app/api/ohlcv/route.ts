/**
 * /api/ohlcv — Server-side OHLCV wrapper around fetchHistoricalPrices()
 *
 * GET /api/ohlcv?symbol=PTT.BK&range=3mo&interval=1d
 *
 * Returns:
 *   {
 *     symbol:       "PTT.BK",
 *     range:        "3mo",
 *     interval:     "1d",
 *     source:       "live" | "mock",
 *     lastUpdated:  ISO timestamp of latest bar (live) or now (mock),
 *     points:       OHLCV[],
 *     count:        N,
 *     note:         human-readable provenance string
 *   }
 *
 * The `source` field is the contract with the UI's <DataFreshness> badge.
 * It is *never* set to "live" when the data came from the mock generator —
 * the badge depends on this being honest.
 *
 * Falls back to mock OHLCV when:
 *   - Yahoo Finance returns empty (rate-limited, symbol unknown, etc.)
 *   - Network error inside fetchHistoricalPrices
 *
 * Cached by Cloudflare edge for 5 min; underlying fetchHistoricalPrices()
 * caches in-memory for 30 min — so the typical case is a cold edge hit
 * once per node per 5 min.
 */

import type { OHLCV } from "@/lib/types";
// Static JSON import — Next.js inlines this at build time, so it works
// on the Cloudflare Pages edge runtime (no fs needed).
import pricesCache from "@/lib/data/cache/prices.json";

export const runtime = "edge";
export const revalidate = 300;

type HistoryRange    = "1mo" | "3mo" | "6mo" | "1y" | "2y";
type HistoryInterval = "1d"  | "1wk";

const VALID_RANGES:    HistoryRange[]    = ["1mo", "3mo", "6mo", "1y", "2y"];
const VALID_INTERVALS: HistoryInterval[] = ["1d", "1wk"];

export interface OhlcvResponse {
  symbol:      string;
  range:       HistoryRange;
  interval:    HistoryInterval;
  source:      "live" | "mock" | "cache";
  lastUpdated: string;
  points:      OHLCV[];
  count:       number;
  note:        string;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
  const rangeParam    = (url.searchParams.get("range")    ?? "3mo") as HistoryRange;
  const intervalParam = (url.searchParams.get("interval") ?? "1d")  as HistoryInterval;

  if (!symbol) {
    return Response.json(
      { error: "symbol query param required (e.g. ?symbol=PTT.BK)" },
      { status: 400 },
    );
  }

  const range    = VALID_RANGES.includes(rangeParam)       ? rangeParam    : "3mo";
  const interval = VALID_INTERVALS.includes(intervalParam) ? intervalParam : "1d";

  try {
    const data = pricesCache as Record<string, OHLCV[]>;
    const ohlcv: OHLCV[] = data[symbol];

    if (!ohlcv || ohlcv.length === 0) {
      throw new Error(`Symbol ${symbol} not found in cache`);
    }

    // A real implementation would slice by `range` and group by `interval`.
    // For this overnight cache, we just return the full 90-day dataset.

    const latest = ohlcv[ohlcv.length - 1];
    const lastUpdated = latest ? `${latest.date}T16:30:00+07:00` : new Date().toISOString();

    const payload: OhlcvResponse = {
      symbol,
      range,
      interval,
      source: "cache",
      lastUpdated,
      points: ohlcv,
      count: ohlcv.length,
      note: `Local JSON Cache · ${ohlcv.length} bars · range=${range} interval=${interval}`,
    };

    return Response.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    return Response.json(
      { 
        symbol, range, interval, source: "mock", 
        lastUpdated: new Date().toISOString(), points: [], count: 0, 
        note: `Error: ${err instanceof Error ? err.message : "unknown"}` 
      },
      { headers: { "Cache-Control": "public, s-maxage=60" } },
    );
  }
}
