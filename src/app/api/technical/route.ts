/**
 * /api/technical — Server-side technical indicators for any SET ticker.
 *
 * GET /api/technical?symbol=PTT.BK&range=6mo
 *
 * Fetches OHLCV via fetchHistoricalPrices() (Yahoo Finance), then
 * computes all indicators server-side using src/lib/technical.ts.
 *
 * Falls back to mock OHLCV for the 3 canonical symbols when Yahoo is
 * unreachable. For unknown symbols Yahoo is the only source.
 *
 * Always returns `source: "live" | "mock"` + `lastUpdated` for the
 * <DataFreshness> badge to render honestly.
 */

import { NextResponse } from "next/server";
import {
  ema, rsi, macd, bollingerBands, vwap, detectRegime,
  detectPattern, findSupportResistance, generateSignal,
} from "@/lib/technical";
import { fetchHistoricalPrices } from "@/lib/api/yahoo";
import { MOCK_OHLCV_PTT, MOCK_OHLCV_ADVANC, MOCK_OHLCV_KBANK } from "@/lib/api/mock";
import type { ApiResponse, OHLCV } from "@/lib/types";

export const runtime    = "edge";
export const revalidate = 300;

const MOCK_BY_SYMBOL: Record<string, OHLCV[]> = {
  "PTT.BK":    MOCK_OHLCV_PTT,
  "ADVANC.BK": MOCK_OHLCV_ADVANC,
  "KBANK.BK":  MOCK_OHLCV_KBANK,
};

export interface TechnicalData {
  symbol:     string;
  ema9:       number;
  ema21:      number;
  rsi:        number;
  macd:       number;
  macdSignal: number;
  bbUpper:    number;
  bbLower:    number;
  bbWidth:    number;
  vwap:       number;
  regime:     string;
  pattern:    string;
  signal: {
    type:        string;
    confidence:  number;
    reasons:     string[];
    entry?:      number;
    stopLoss?:   number;
    target?:     number;
    riskReward?: number;
  };
  support:    { price: number; touches: number; strength: string }[];
  resistance: { price: number; touches: number; strength: string }[];
  lastPrice:  number;
  lastVolume: number;
  // Provenance — read by the UI's <DataFreshness> badge
  source:     "live" | "mock";
  lastUpdated: string;
  note:       string;
}

async function loadOhlcv(symbol: string, range: "1mo"|"3mo"|"6mo"|"1y" = "6mo"): Promise<{ data: OHLCV[]; source: "live"|"mock"; note: string }> {
  if (process.env.YAHOO_KILLSWITCH === "true") {
    const mock = MOCK_BY_SYMBOL[symbol] ?? MOCK_OHLCV_PTT;
    return { data: mock, source: "mock", note: "YAHOO_KILLSWITCH=true — synthetic data only" };
  }
  try {
    const points = await fetchHistoricalPrices(symbol, range, "1d");
    if (!points || points.length < 50) {
      const mock = MOCK_BY_SYMBOL[symbol] ?? MOCK_OHLCV_PTT;
      return { data: mock, source: "mock", note: "Yahoo returned insufficient data — using synthetic OHLCV" };
    }
    const ohlcv: OHLCV[] = points.map(p => ({
      date:   p.date,
      open:   p.open  ?? p.close,
      high:   p.high  ?? p.close,
      low:    p.low   ?? p.close,
      close:  p.close,
      volume: p.volume ?? 0,
    }));
    return { data: ohlcv, source: "live", note: `Yahoo Finance · ${ohlcv.length} daily bars` };
  } catch (err) {
    const mock = MOCK_BY_SYMBOL[symbol] ?? MOCK_OHLCV_PTT;
    return { data: mock, source: "mock", note: `Yahoo error: ${err instanceof Error ? err.message : "unknown"}` };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "PTT.BK").toUpperCase();
  const range  = (searchParams.get("range")  ?? "6mo") as "1mo"|"3mo"|"6mo"|"1y";

  const { data, source, note } = await loadOhlcv(symbol, range);

  if (!data || data.length < 50) {
    return NextResponse.json(
      { success: false, data: null, error: `Insufficient data for ${symbol}` } satisfies ApiResponse<null>,
      { status: 400 },
    );
  }

  const closes      = data.map((d) => d.close);
  const ema9        = ema(closes, 9);
  const ema21       = ema(closes, 21);
  const rsiValues   = rsi(closes, 14);
  const macdResult  = macd(closes);
  const bb          = bollingerBands(closes);
  const vwapValues  = vwap(data);
  const regime      = detectRegime(data);
  const pattern     = detectPattern(data);
  const sr          = findSupportResistance(data);
  const signal      = generateSignal(data, sr);
  const last        = data[data.length - 1];
  const lastUpdated = `${last.date}T16:30:00+07:00`;

  const result: TechnicalData = {
    symbol,
    ema9:       ema9[ema9.length - 1],
    ema21:      ema21[ema21.length - 1],
    rsi:        rsiValues[rsiValues.length - 1],
    macd:       macdResult.macd[macdResult.macd.length - 1],
    macdSignal: macdResult.signal[macdResult.signal.length - 1],
    bbUpper:    bb.upper[bb.upper.length - 1],
    bbLower:    bb.lower[bb.lower.length - 1],
    bbWidth:    bb.bandwidth[bb.bandwidth.length - 1],
    vwap:       vwapValues[vwapValues.length - 1],
    regime:     regime.regime,
    pattern:    pattern,
    signal: {
      type:       signal.type,
      confidence: signal.confidence,
      reasons:    signal.reasons,
      entry:      signal.entry,
      stopLoss:   signal.stopLoss,
      target:     signal.target,
      riskReward: signal.riskReward,
    },
    support:    sr.support.slice(0, 5),
    resistance: sr.resistance.slice(0, 5),
    lastPrice:  last.close,
    lastVolume: last.volume,
    source,
    lastUpdated,
    note,
  };

  return NextResponse.json(
    { success: true, data: result } satisfies ApiResponse<TechnicalData>,
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } },
  );
}
