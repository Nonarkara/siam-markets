/**
 * Signal engine — turns raw market data into processed intelligence.
 * Every signal has: what it is, what it means, what to do.
 * This is the "Bloomberg function" layer — not raw data, but interpretation.
 */

import { fgZone, setValuation, SET_CONSTANTS, safetyZone } from "./graham";
import type { StockFundamentals, FearGreed } from "./types";

export type SignalPriority = "critical" | "high" | "medium" | "low";
export type SignalAction = "buy" | "sell" | "watch" | "hold" | "avoid" | "info";

export interface MarketSignal {
  id: string;
  priority: SignalPriority;
  action: SignalAction;
  title: string;
  body: string;       // what it means in plain language
  implication: string; // what to DO
  source: string;
  value: string;      // the raw number/value
  timestamp: string;
}

// ─── Fear & Greed signals ─────────────────────────────────────────

export function fearGreedSignal(fg: FearGreed): MarketSignal {
  const zone = fgZone(fg.score);
  const priority: SignalPriority =
    fg.score <= 20 || fg.score >= 80 ? "critical" : "medium";
  const action: SignalAction =
    fg.score <= 25 ? "buy" : fg.score >= 75 ? "watch" : "info";

  const [title, body, implication] = (() => {
    if (fg.score <= 20) return [
      "Extreme Fear — Buffett's Buying Zone",
      "Market participants are panicking. Prices are being driven below fair value by emotion, not fundamentals.",
      "Buffett historically buys here. If you have a watchlist stock below its Graham Number, this is the window.",
    ];
    if (fg.score <= 40) return [
      "Fear — Quality Stocks at Discount",
      "Market is nervous. Sentiment is driving prices down, creating opportunities in quality companies.",
      "Review your watchlist for stocks with margin of safety ≥30%. Average down on positions you believe in.",
    ];
    if (fg.score <= 60) return [
      "Neutral — Wait for a Clear Signal",
      "Market is neither cheap nor expensive by sentiment. Price discovery is rational.",
      "Neither rush to buy nor sell. Wait for Fear & Greed to move decisively in either direction.",
    ];
    if (fg.score <= 80) return [
      "Greed — Be Selective",
      "Market optimism is elevated. Prices are being driven by momentum, not just fundamentals.",
      "Don't chase rallies. Only add to positions with strong margin of safety. Start taking partial profits.",
    ];
    return [
      "Extreme Greed — Buffett's Warning Zone",
      "Markets are euphoric. This is when most retail investors buy — right before corrections.",
      "Buffett: 'Be fearful when others are greedy.' Lock in gains. Raise cash. Wait for fear to return.",
    ];
  })();

  return {
    id: `fg_${fg.score}`,
    priority, action, title, body, implication,
    source: "Fear & Greed Index",
    value: `${fg.score}/100`,
    timestamp: fg.updatedAt,
  };
}

// ─── SET P/E signals ──────────────────────────────────────────────

export function setPeSignal(pe: number): MarketSignal {
  const v = setValuation(pe);
  const hist = SET_CONSTANTS.historicalPeAvg;
  const diffPct = ((pe - hist) / hist * 100);
  const priority: SignalPriority = v === "cheap" || v === "bubble" ? "high" : "medium";
  const action: SignalAction = v === "cheap" || v === "fair" ? "buy" : v === "bubble" ? "sell" : "info";

  const [title, body, implication] = (() => {
    if (v === "cheap") return [
      `SET Deeply Undervalued — P/E ${pe.toFixed(1)}`,
      `SET is trading ${Math.abs(diffPct).toFixed(0)}% below its historical average. Rare. The last time this happened was during the 2008 crisis.`,
      "This is a generational buying opportunity. Load up on quality SET50 stocks that pass Graham criteria.",
    ];
    if (v === "fair") return [
      `SET at Graham Fair Value — P/E ${pe.toFixed(1)}`,
      `SET is ${Math.abs(diffPct).toFixed(0)}% below its historical average. Graham would approve of selective buying here.`,
      "Stocks with margin of safety ≥30% are now worth serious attention. This is where value investors act.",
    ];
    if (v === "moderate") return [
      `SET Moderately Valued — P/E ${pe.toFixed(1)}`,
      `SET is near its historical average of ${hist}. Not cheap, not expensive. Selective buying only.`,
      "Focus on individual stocks with strong fundamentals rather than broad market exposure.",
    ];
    if (v === "expensive") return [
      `SET Expensive vs History — P/E ${pe.toFixed(1)}`,
      `SET is ${diffPct.toFixed(0)}% above its historical average. You're paying a premium for Thai equities.`,
      "Demand higher margin of safety before buying. Consider waiting for a 10–15% correction.",
    ];
    return [
      `SET Bubble Territory — P/E ${pe.toFixed(1)}`,
      `SET is ${diffPct.toFixed(0)}% above its historical average. Graham would be sitting in cash right now.`,
      "Reduce exposure. This is not the time to add positions. Protect what you have.",
    ];
  })();

  return {
    id: `set_pe_${pe.toFixed(0)}`,
    priority, action, title, body, implication,
    source: "SET Exchange P/E",
    value: `P/E ${pe.toFixed(1)}`,
    timestamp: new Date().toISOString(),
  };
}

// ─── Individual stock signals ─────────────────────────────────────

export function stockSignal(stock: StockFundamentals): MarketSignal {
  const zone = safetyZone(stock.marginOfSafety);
  const mos = stock.marginOfSafety;

  if (zone === "strong") {
    return {
      id: `stock_mos_${stock.symbol}`,
      priority: "high",
      action: "buy",
      title: `${stock.symbol.replace(".BK", "")} — Strong Buy Zone (${mos.toFixed(0)}% below Graham Number)`,
      body: `${stock.name} is trading at ฿${stock.price.toFixed(2)}, while Graham's fair value ceiling is ฿${stock.grahamNumber.toFixed(2)}. P/E: ${stock.pe.toFixed(1)}, P/B: ${stock.pb.toFixed(2)}.`,
      implication: `Graham safety margin is ${mos.toFixed(0)}% — well above his 30% threshold. If the fundamentals are sound and regime is trending, this is a valid entry.`,
      source: "Graham Number",
      value: `MOS ${mos.toFixed(0)}%`,
      timestamp: stock.updatedAt,
    };
  }

  if (zone === "moderate") {
    return {
      id: `stock_mos_${stock.symbol}`,
      priority: "medium",
      action: "watch",
      title: `${stock.symbol.replace(".BK", "")} — Entering Value Zone (${mos.toFixed(0)}% MOS)`,
      body: `${stock.name} has a ${mos.toFixed(0)}% margin of safety. Getting interesting — but not yet at Graham's preferred 30% threshold.`,
      implication: `Start watching closely. A further 5–10% decline would push this into strong buy territory. Consider a partial position now.`,
      source: "Graham Number",
      value: `MOS ${mos.toFixed(0)}%`,
      timestamp: stock.updatedAt,
    };
  }

  if (zone === "overvalued") {
    return {
      id: `stock_ov_${stock.symbol}`,
      priority: "low",
      action: "avoid",
      title: `${stock.symbol.replace(".BK", "")} — Above Graham Fair Value`,
      body: `${stock.name} is trading ${Math.abs(mos).toFixed(0)}% above Graham's calculated fair value. You're paying a premium.`,
      implication: `Graham would not buy here. Wait for a pullback to below the Graham Number before considering a position.`,
      source: "Graham Number",
      value: `${Math.abs(mos).toFixed(0)}% over`,
      timestamp: stock.updatedAt,
    };
  }

  return {
    id: `stock_thin_${stock.symbol}`,
    priority: "low",
    action: "hold",
    title: `${stock.symbol.replace(".BK", "")} — Thin Margin (${mos.toFixed(0)}% MOS)`,
    body: `${stock.name} has a thin margin of safety. Near but not yet at Graham's threshold.`,
    implication: `Hold existing positions but don't add here. Wait for a better entry below Graham Number.`,
    source: "Graham Number",
    value: `MOS ${mos.toFixed(0)}%`,
    timestamp: stock.updatedAt,
  };
}

// ─── Macro signals ────────────────────────────────────────────────

export function fedRateSignal(rate: number): MarketSignal {
  const isHigh = rate >= 4;
  return {
    id: `fed_${rate.toFixed(2)}`,
    priority: isHigh ? "medium" : "low",
    action: "info",
    title: `US Fed Rate ${rate.toFixed(2)}% — ${isHigh ? "High Rate Environment" : "Easing Environment"}`,
    body: isHigh
      ? `With rates at ${rate.toFixed(2)}%, risk-free US bonds compete with equities. This compresses the fair P/E ratio for all markets.`
      : `Low rates push investors toward equities. The equity risk premium is more attractive when rates are low.`,
    implication: isHigh
      ? `Demand higher earnings yields from stocks. Graham Number becomes more conservative at high rates. Thai equities at P/E <12 become interesting.`
      : `Equities deserve higher P/E multiples in a low-rate environment. SET P/E threshold can move up toward 17–18.`,
    source: "FRED — Federal Reserve",
    value: `${rate.toFixed(2)}%`,
    timestamp: new Date().toISOString(),
  };
}

export function thbSignal(rate: number): MarketSignal {
  const isWeak = rate > 35;
  const isStrong = rate < 32;
  return {
    id: `thb_${rate.toFixed(2)}`,
    priority: isWeak || isStrong ? "medium" : "low",
    action: "info",
    title: `THB/USD ${rate.toFixed(2)} — ${isWeak ? "Baht Weak" : isStrong ? "Baht Strong" : "Baht Stable"}`,
    body: isWeak
      ? `A weak Baht increases costs for import-heavy companies (oil, electronics). Export-driven companies (tourism, agriculture) benefit.`
      : isStrong
      ? `A strong Baht benefits import-dependent businesses and reduces imported inflation. Export businesses may see margin pressure.`
      : `THB is in a stable range. Currency risk is moderate for foreign-denominated investments.`,
    implication: isWeak
      ? `Rotate toward Thai exporters (tourism stocks, agricultural exports). Avoid heavy importers. Global investors see cheap Thai equities.`
      : `Thai importers and consumer stocks benefit. Consider international fund exposure while Baht strength makes foreign assets cheaper.`,
    source: "Bank of Thailand",
    value: `฿${rate.toFixed(2)}/USD`,
    timestamp: new Date().toISOString(),
  };
}

// ─── Signal prioritizer — build the feed ─────────────────────────

export interface SignalFeedInput {
  fearGreed: FearGreed;
  setPe: number;
  fedRate: number;
  thbUsd: number;
  watchlistStocks: StockFundamentals[];
}

export function buildSignalFeed(input: SignalFeedInput): MarketSignal[] {
  const signals: MarketSignal[] = [
    fearGreedSignal(input.fearGreed),
    setPeSignal(input.setPe),
    fedRateSignal(input.fedRate),
    thbSignal(input.thbUsd),
    ...input.watchlistStocks.slice(0, 3).map(stockSignal),
  ];

  // Sort: critical > high > medium > low, then buy > watch > info
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const actionOrder  = { buy: 0, watch: 1, sell: 1, hold: 2, avoid: 2, info: 3 };

  return signals.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return actionOrder[a.action] - actionOrder[b.action];
  });
}
