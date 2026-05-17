/**
 * Technical Analysis Engine — Pure Functions
 * Indicators: EMA, SMA, RSI, MACD, Bollinger Bands, VWAP, ATR
 * Pattern Detection: Support/Resistance zones, candlestick patterns
 * Regime Detection: Trending vs Ranging vs High Volatility
 */

// ─── Price Data Point ────────────────────────────────────────────

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Simple Moving Average ───────────────────────────────────────

export function sma(data: number[], period: number): number[] {
  if (period <= 0 || data.length < period) return [];
  const result: number[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) sum -= data[i - period];
    if (i >= period - 1) result.push(sum / period);
  }
  return result;
}

// ─── Exponential Moving Average ──────────────────────────────────

export function ema(data: number[], period: number): number[] {
  if (period <= 0 || data.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

// ─── Relative Strength Index ─────────────────────────────────────

export function rsi(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return [];
  const result: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  // Initial averages
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs));
  }
  return result;
}

// ─── MACD ────────────────────────────────────────────────────────

export interface MacdResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdResult {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  // Align lengths: emaSlow starts same index as emaFast
  const startOffset = slow - fast;
  const macdLine: number[] = [];
  for (let i = startOffset; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i] - emaSlow[i - startOffset]);
  }
  const signalLine = ema(macdLine, signalPeriod);
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + (macdLine.length - signalLine.length)] - signalLine[i]);
  }
  return { macd: macdLine, signal: signalLine, histogram };
}

// ─── Bollinger Bands ─────────────────────────────────────────────

export interface BollingerResult {
  upper: number[];
  middle: number[];
  lower: number[];
  bandwidth: number[];
}

export function bollingerBands(closes: number[], period = 20, stdDev = 2): BollingerResult {
  const middle = sma(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  const bandwidth: number[] = [];

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
    bandwidth.push(((upper[upper.length - 1] - lower[lower.length - 1]) / mean) * 100);
  }

  return { upper, middle, lower, bandwidth };
}

// ─── VWAP (Volume-Weighted Average Price) ────────────────────────

export function vwap(data: OHLCV[]): number[] {
  const result: number[] = [];
  let cumTPV = 0;
  let cumVol = 0;
  for (const bar of data) {
    const tp = (bar.high + bar.low + bar.close) / 3;
    cumTPV += tp * bar.volume;
    cumVol += bar.volume;
    result.push(cumVol === 0 ? tp : cumTPV / cumVol);
  }
  return result;
}

// ─── Average True Range ──────────────────────────────────────────

export function atr(data: OHLCV[], period = 14): number[] {
  if (data.length < 2) return [];
  const tr: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      tr.push(data[i].high - data[i].low);
    } else {
      const h = data[i].high;
      const l = data[i].low;
      const c1 = data[i - 1].close;
      tr.push(Math.max(h - l, Math.abs(h - c1), Math.abs(l - c1)));
    }
  }
  return sma(tr, period);
}

// ─── Support & Resistance Zones ──────────────────────────────────

export interface SRLevel {
  price: number;
  touches: number;
  strength: "weak" | "moderate" | "strong";
}

export function findSupportResistance(
  data: OHLCV[],
  lookback = 20,
  tolerancePct = 0.5,
): { support: SRLevel[]; resistance: SRLevel[] } {
  const levels = new Map<number, number>(); // price -> touches
  const tolerance = (price: number) => price * (tolerancePct / 100);

  for (let i = lookback; i < data.length - 1; i++) {
    const localLows: number[] = [];
    const localHighs: number[] = [];

    for (let j = i - lookback; j <= i; j++) {
      if (j > 0 && j < data.length - 1) {
        if (data[j].low < data[j - 1].low && data[j].low < data[j + 1].low) {
          localLows.push(data[j].low);
        }
        if (data[j].high > data[j - 1].high && data[j].high > data[j + 1].high) {
          localHighs.push(data[j].high);
        }
      }
    }

    for (const low of localLows) {
      let found = false;
      for (const [price, count] of levels) {
        if (Math.abs(price - low) < tolerance(price)) {
          levels.set(price, count + 1);
          found = true;
          break;
        }
      }
      if (!found) levels.set(low, 1);
    }

    for (const high of localHighs) {
      let found = false;
      for (const [price, count] of levels) {
        if (Math.abs(price - high) < tolerance(price)) {
          levels.set(price, count + 1);
          found = true;
          break;
        }
      }
      if (!found) levels.set(high, 1);
    }
  }

  const sorted = Array.from(levels.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const currentPrice = data[data.length - 1]?.close ?? 0;

  const support: SRLevel[] = [];
  const resistance: SRLevel[] = [];

  for (const [price, touches] of sorted) {
    const level: SRLevel = {
      price,
      touches,
      strength: touches >= 4 ? "strong" : touches >= 2 ? "moderate" : "weak",
    };
    if (price < currentPrice) support.push(level);
    else resistance.push(level);
  }

  return { support, resistance };
}

// ─── Candlestick Pattern Detection ───────────────────────────────

export type CandlePattern =
  | "doji"
  | "hammer"
  | "shooting_star"
  | "engulfing_bull"
  | "engulfing_bear"
  | "inside_bar"
  | "none";

export function detectPattern(data: OHLCV[], idx = data.length - 1): CandlePattern {
  if (idx < 1 || idx >= data.length) return "none";
  const curr = data[idx];
  const prev = data[idx - 1];

  const body = Math.abs(curr.close - curr.open);
  const range = curr.high - curr.low;
  const upperWick = curr.high - Math.max(curr.open, curr.close);
  const lowerWick = Math.min(curr.open, curr.close) - curr.low;

  // Doji: body < 10% of range
  if (range > 0 && body / range < 0.1) return "doji";

  // Hammer: small body at top, long lower wick (>2x body), little upper wick
  if (lowerWick > body * 2 && upperWick < body * 0.5 && curr.close > curr.open) return "hammer";

  // Shooting star: small body at bottom, long upper wick, little lower wick
  if (upperWick > body * 2 && lowerWick < body * 0.5 && curr.close < curr.open) return "shooting_star";

  // Bullish engulfing
  if (prev.close < prev.open && curr.close > curr.open &&
      curr.open < prev.close && curr.close > prev.open) return "engulfing_bull";

  // Bearish engulfing
  if (prev.close > prev.open && curr.close < curr.open &&
      curr.open > prev.close && curr.close < prev.open) return "engulfing_bear";

  // Inside bar
  if (curr.high < prev.high && curr.low > prev.low) return "inside_bar";

  return "none";
}

// ─── Market Regime Detection ─────────────────────────────────────

export type MarketRegime = "trending_up" | "trending_down" | "ranging" | "high_volatility";

export interface RegimeResult {
  regime: MarketRegime;
  adx: number; // Average Directional Index (simplified proxy)
  volatility: number; // ATR as % of price
  trendStrength: "weak" | "moderate" | "strong";
}

export function detectRegime(data: OHLCV[]): RegimeResult {
  if (data.length < 30) {
    return { regime: "ranging", adx: 0, volatility: 0, trendStrength: "weak" };
  }

  const closes = data.map((d) => d.close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);

  const atrValues = atr(data, 14);
  const currentAtr = atrValues[atrValues.length - 1] ?? 0;
  const currentPrice = closes[closes.length - 1];
  const volatility = currentPrice > 0 ? (currentAtr / currentPrice) * 100 : 0;

  // Simplified ADX proxy using directional movement
  const lastCloses = closes.slice(-20);
  const upMoves = lastCloses.filter((c, i) => i > 0 && c > lastCloses[i - 1]).length;
  const downMoves = lastCloses.filter((c, i) => i > 0 && c < lastCloses[i - 1]).length;
  const adxProxy = Math.abs(upMoves - downMoves) / lastCloses.length * 100;

  const trendStrength: RegimeResult["trendStrength"] =
    adxProxy > 60 ? "strong" : adxProxy > 30 ? "moderate" : "weak";

  // Regime classification
  let regime: MarketRegime;
  if (volatility > 3) {
    regime = "high_volatility";
  } else if (adxProxy > 40) {
    const ema20Last = ema20[ema20.length - 1];
    const ema50Last = ema50[ema50.length - 1];
    regime = ema20Last > ema50Last ? "trending_up" : "trending_down";
  } else {
    regime = "ranging";
  }

  return { regime, adx: adxProxy, volatility, trendStrength };
}

// ─── Signal Generation ───────────────────────────────────────────

export interface TradeSignal {
  type: "buy" | "sell" | "neutral";
  confidence: number; // 0-100
  reasons: string[];
  entry?: number;
  stopLoss?: number;
  target?: number;
  riskReward?: number;
}

export function generateSignal(data: OHLCV[], sr?: { support: SRLevel[]; resistance: SRLevel[] }): TradeSignal {
  if (data.length < 50) {
    return { type: "neutral", confidence: 0, reasons: ["Insufficient data"] };
  }

  const closes = data.map((d) => d.close);
  const current = data[data.length - 1];
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const rsiValues = rsi(closes, 14);
  const bb = bollingerBands(closes, 20, 2);
  const vwapValues = vwap(data);
  const regime = detectRegime(data);

  const lastEma9 = ema9[ema9.length - 1];
  const lastEma21 = ema21[ema21.length - 1];
  const lastRsi = rsiValues[rsiValues.length - 1];
  const lastBB = bb;
  const lastVwap = vwapValues[vwapValues.length - 1];

  const reasons: string[] = [];
  let buyScore = 0;
  let sellScore = 0;

  // EMA alignment
  if (lastEma9 > lastEma21) {
    buyScore += 20;
    reasons.push("9 EMA above 21 EMA — bullish momentum");
  } else {
    sellScore += 20;
    reasons.push("9 EMA below 21 EMA — bearish momentum");
  }

  // RSI
  if (lastRsi < 30) {
    buyScore += 25;
    reasons.push(`RSI oversold at ${lastRsi.toFixed(1)} — mean reversion potential`);
  } else if (lastRsi > 70) {
    sellScore += 25;
    reasons.push(`RSI overbought at ${lastRsi.toFixed(1)} — exhaustion signal`);
  } else if (lastRsi > 50) {
    buyScore += 10;
    reasons.push(`RSI ${lastRsi.toFixed(1)} — moderate bullish`);
  } else {
    sellScore += 10;
    reasons.push(`RSI ${lastRsi.toFixed(1)} — moderate bearish`);
  }

  // VWAP
  if (current.close > lastVwap) {
    buyScore += 15;
    reasons.push("Price above VWAP — institutional bullish bias");
  } else {
    sellScore += 15;
    reasons.push("Price below VWAP — institutional bearish bias");
  }

  // Bollinger Bands
  const lastClose = closes[closes.length - 1];
  const bbUpper = lastBB.upper[lastBB.upper.length - 1];
  const bbLower = lastBB.lower[lastBB.lower.length - 1];
  if (bbLower && lastClose < bbLower) {
    buyScore += 20;
    reasons.push("Price below lower Bollinger Band — extreme oversold");
  } else if (bbUpper && lastClose > bbUpper) {
    sellScore += 20;
    reasons.push("Price above upper Bollinger Band — extreme overbought");
  }

  // Regime
  if (regime.regime === "trending_up") {
    buyScore += 10;
    reasons.push("Market regime: trending up");
  } else if (regime.regime === "trending_down") {
    sellScore += 10;
    reasons.push("Market regime: trending down");
  } else if (regime.regime === "high_volatility") {
    buyScore -= 10;
    sellScore -= 10;
    reasons.push("High volatility — reduce position size");
  }

  // Candlestick pattern
  const pattern = detectPattern(data);
  if (pattern === "hammer") { buyScore += 15; reasons.push("Hammer candle — potential reversal up"); }
  if (pattern === "shooting_star") { sellScore += 15; reasons.push("Shooting star — potential reversal down"); }
  if (pattern === "engulfing_bull") { buyScore += 20; reasons.push("Bullish engulfing — strong reversal"); }
  if (pattern === "engulfing_bear") { sellScore += 20; reasons.push("Bearish engulfing — strong reversal"); }

  // Support/Resistance proximity
  if (sr && sr.support.length > 0) {
    const nearestSupport = sr.support[0];
    const distToSupport = ((current.close - nearestSupport.price) / current.close) * 100;
    if (distToSupport < 1 && distToSupport > 0) {
      buyScore += 15;
      reasons.push(`Near support at ${nearestSupport.price.toFixed(2)} (${nearestSupport.strength})`);
    }
  }
  if (sr && sr.resistance.length > 0) {
    const nearestResistance = sr.resistance[0];
    const distToResistance = ((nearestResistance.price - current.close) / current.close) * 100;
    if (distToResistance < 1 && distToResistance > 0) {
      sellScore += 15;
      reasons.push(`Near resistance at ${nearestResistance.price.toFixed(2)} (${nearestResistance.strength})`);
    }
  }

  // Determine signal
  let type: TradeSignal["type"] = "neutral";
  let confidence = 0;

  if (buyScore > sellScore + 15) {
    type = "buy";
    confidence = Math.min(100, buyScore);
  } else if (sellScore > buyScore + 15) {
    type = "sell";
    confidence = Math.min(100, sellScore);
  } else {
    confidence = Math.abs(buyScore - sellScore);
    reasons.push("Mixed signals — wait for clarity");
  }

  // Calculate levels
  const atrValues = atr(data, 14);
  const lastAtr = atrValues[atrValues.length - 1] ?? current.close * 0.02;
  const entry = current.close;
  const stopLoss = type === "buy" ? entry - lastAtr * 1.5 : entry + lastAtr * 1.5;
  const target = type === "buy" ? entry + lastAtr * 3 : entry - lastAtr * 3;
  const riskReward = Math.abs((target - entry) / (entry - stopLoss));

  return {
    type,
    confidence,
    reasons,
    entry,
    stopLoss,
    target,
    riskReward: isFinite(riskReward) ? riskReward : 0,
  };
}

// ─── Format helpers ──────────────────────────────────────────────

export function regimeLabel(r: MarketRegime): string {
  switch (r) {
    case "trending_up": return "Trending Up";
    case "trending_down": return "Trending Down";
    case "ranging": return "Ranging / Consolidating";
    case "high_volatility": return "High Volatility";
  }
}

export function regimeColor(r: MarketRegime): string {
  switch (r) {
    case "trending_up": return "var(--bull)";
    case "trending_down": return "var(--bear)";
    case "ranging": return "var(--caution)";
    case "high_volatility": return "var(--bear)";
  }
}

export function patternLabel(p: CandlePattern): string {
  switch (p) {
    case "doji": return "Doji — Indecision";
    case "hammer": return "Hammer — Bullish Reversal";
    case "shooting_star": return "Shooting Star — Bearish Reversal";
    case "engulfing_bull": return "Bullish Engulfing";
    case "engulfing_bear": return "Bearish Engulfing";
    case "inside_bar": return "Inside Bar — Compression";
    case "none": return "No pattern detected";
  }
}
