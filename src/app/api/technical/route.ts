import { NextResponse } from "next/server";

export const runtime = "edge";
import {
  ema, rsi, macd, bollingerBands, vwap, detectRegime,
  detectPattern, findSupportResistance, generateSignal,
} from "@/lib/technical";
import { MOCK_OHLCV_PTT, MOCK_OHLCV_ADVANC, MOCK_OHLCV_KBANK } from "@/lib/api/mock";
import type { ApiResponse, OHLCV } from "@/lib/types";

const DATA_MAP: Record<string, OHLCV[]> = {
  "PTT.BK": MOCK_OHLCV_PTT,
  "ADVANC.BK": MOCK_OHLCV_ADVANC,
  "KBANK.BK": MOCK_OHLCV_KBANK,
};

export const revalidate = 300; // 5 minutes

export interface TechnicalData {
  symbol: string;
  ema9: number;
  ema21: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  bbUpper: number;
  bbLower: number;
  bbWidth: number;
  vwap: number;
  regime: string;
  pattern: string;
  signal: {
    type: string;
    confidence: number;
    reasons: string[];
    entry?: number;
    stopLoss?: number;
    target?: number;
    riskReward?: number;
  };
  support: { price: number; touches: number; strength: string }[];
  resistance: { price: number; touches: number; strength: string }[];
  lastPrice: number;
  lastVolume: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "PTT.BK";

  const data = DATA_MAP[symbol];
  if (!data || data.length < 50) {
    return NextResponse.json(
      { success: false, data: null, error: "Insufficient data" } satisfies ApiResponse<null>,
      { status: 400 },
    );
  }

  const closes = data.map((d) => d.close);
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const rsiValues = rsi(closes, 14);
  const macdResult = macd(closes);
  const bb = bollingerBands(closes);
  const vwapValues = vwap(data);
  const regime = detectRegime(data);
  const pattern = detectPattern(data);
  const sr = findSupportResistance(data);
  const signal = generateSignal(data, sr);
  const last = data[data.length - 1];

  const result: TechnicalData = {
    symbol,
    ema9: ema9[ema9.length - 1],
    ema21: ema21[ema21.length - 1],
    rsi: rsiValues[rsiValues.length - 1],
    macd: macdResult.macd[macdResult.macd.length - 1],
    macdSignal: macdResult.signal[macdResult.signal.length - 1],
    bbUpper: bb.upper[bb.upper.length - 1],
    bbLower: bb.lower[bb.lower.length - 1],
    bbWidth: bb.bandwidth[bb.bandwidth.length - 1],
    vwap: vwapValues[vwapValues.length - 1],
    regime: regime.regime,
    pattern: pattern,
    signal: {
      type: signal.type,
      confidence: signal.confidence,
      reasons: signal.reasons,
      entry: signal.entry,
      stopLoss: signal.stopLoss,
      target: signal.target,
      riskReward: signal.riskReward,
    },
    support: sr.support.slice(0, 5),
    resistance: sr.resistance.slice(0, 5),
    lastPrice: last.close,
    lastVolume: last.volume,
  };

  return NextResponse.json({ success: true, data: result } satisfies ApiResponse<TechnicalData>);
}
