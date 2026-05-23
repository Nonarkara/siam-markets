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

import { fetchHistoricalPrices } from "@/lib/api/yahoo";
import {
  MOCK_OHLCV_PTT, MOCK_OHLCV_ADVANC, MOCK_OHLCV_KBANK,
} from "@/lib/api/mock";
import type { OHLCV } from "@/lib/types";

export const runtime    = "edge";
export const revalidate = 300;

type HistoryRange    = "1mo" | "3mo" | "6mo" | "1y" | "2y";
type HistoryInterval = "1d"  | "1wk";

const VALID_RANGES:    HistoryRange[]    = ["1mo", "3mo", "6mo", "1y", "2y"];
const VALID_INTERVALS: HistoryInterval[] = ["1d", "1wk"];

const MOCK_BY_SYMBOL: Record<string, OHLCV[]> = {
  "PTT.BK":    MOCK_OHLCV_PTT,
  "ADVANC.BK": MOCK_OHLCV_ADVANC,
  "KBANK.BK":  MOCK_OHLCV_KBANK,
};

export interface OhlcvResponse {
  symbol:      string;
  range:       HistoryRange;
  interval:    HistoryInterval;
  source:      "live" | "mock";
  lastUpdated: string;
  points:      OHLCV[];
  count:       number;
  note:        string;
}

function mockResponse(symbol: string, range: HistoryRange, interval: HistoryInterval, reason: string): OhlcvResponse {
  const mock = MOCK_BY_SYMBOL[symbol] ?? MOCK_OHLCV_PTT;
  return {
    symbol,
    range,
    interval,
    source:      "mock",
    lastUpdated: mock[mock.length - 1]?.date ?? new Date().toISOString().slice(0, 10),
    points:      mock,
    count:       mock.length,
    note:        `Synthetic OHLCV (random walk) — ${reason}. Do not trade on this data.`,
  };
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
  const rangeParam    = (url.searchParams.get("range")    ?? "3mo") as HistoryRange;
  const intervalParam = (url.searchParams.get("interval") ?? "1d")  as HistoryInterval;

  // Validate inputs
  if (!symbol) {
    return Response.json(
      { error: "symbol query param required (e.g. ?symbol=PTT.BK)" },
      { status: 400 },
    );
  }
  const range    = VALID_RANGES.includes(rangeParam)       ? rangeParam    : "3mo";
  const interval = VALID_INTERVALS.includes(intervalParam) ? intervalParam : "1d";

  // Manual killswitch for testing the "DEMO DATA" banner path
  if (process.env.YAHOO_KILLSWITCH === "true") {
    const payload = mockResponse(symbol, range, interval, "YAHOO_KILLSWITCH=true");
    return Response.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=10" },
    });
  }

  try {
    const points = await fetchHistoricalPrices(symbol, range, interval);

    if (!points || points.length === 0) {
      const payload = mockResponse(symbol, range, interval, "Yahoo returned no data");
      return Response.json(payload, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
      });
    }

    // Convert HistoricalPoint → OHLCV (rename if fields differ; here they match)
    const ohlcv: OHLCV[] = points.map(p => ({
      date:   p.date,
      open:   p.open  ?? p.close,
      high:   p.high  ?? p.close,
      low:    p.low   ?? p.close,
      close:  p.close,
      volume: p.volume ?? 0,
    }));

    const latest = ohlcv[ohlcv.length - 1];
    const lastUpdated = latest ? `${latest.date}T16:30:00+07:00` : new Date().toISOString();

    const payload: OhlcvResponse = {
      symbol,
      range,
      interval,
      source:      "live",
      lastUpdated,
      points:      ohlcv,
      count:       ohlcv.length,
      note:        `Yahoo Finance · ${ohlcv.length} bars · range=${range} interval=${interval}`,
    };

    return Response.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    const payload = mockResponse(symbol, range, interval, `Yahoo error: ${err instanceof Error ? err.message : "unknown"}`);
    return Response.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }
}
