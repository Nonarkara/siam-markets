/**
 * /api/vix-curve — VIX term structure (volatility curve).
 *
 * Fetches VIX9D / VIX / VIX3M / VIX6M / VIX1Y from Yahoo Finance.
 * Derives the term structure shape: contango (normal) vs backwardation
 * (fear spike → contrarian buy signal).
 *
 * Also fetches: SKEW index, VVIX (vol of vol), put/call ratio proxy.
 * Cached 5 minutes.
 */

export const runtime   = "edge";
export const revalidate = 300;

export interface VIXCurvePoint { tenor: string; days: number; value: number | null; }

export interface VIXCurveResponse {
  curve:          VIXCurvePoint[];
  shape:          "contango" | "backwardation" | "flat" | "unknown";
  shapeNote:      string;
  signalStrength: number;     // 0–100; higher = more extreme
  signal:         "strong_buy" | "buy" | "neutral" | "caution" | "sell";
  frontSpot:      number | null;   // VIX9D
  spot:           number | null;   // VIX
  vvix:           number | null;   // Vol of vol
  skew:           number | null;   // CBOE SKEW
  as_of:          string;
}

const TICKERS = [
  { tenor: "9D",  days: 9,   sym: "^VIX9D" },
  { tenor: "30D", days: 30,  sym: "^VIX"   },
  { tenor: "3M",  days: 90,  sym: "^VIX3M" },
  { tenor: "6M",  days: 180, sym: "^VIX6M" },
  { tenor: "1Y",  days: 365, sym: "^VIX1Y" },
];
const EXTRA = [
  { key: "vvix", sym: "^VVIX" },
  { key: "skew", sym: "^SKEW" },
];

async function fetchYahooQuote(symbol: string): Promise<number | null> {
  try {
    const enc = encodeURIComponent(symbol);
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) return null;
    const d = await r.json() as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> } };
    return d.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch { return null; }
}

export async function GET(): Promise<Response> {
  const [curveResults, extraResults] = await Promise.all([
    Promise.all(TICKERS.map(async t => ({ ...t, value: await fetchYahooQuote(t.sym) }))),
    Promise.all(EXTRA.map(async e => ({ ...e, value: await fetchYahooQuote(e.sym) }))),
  ]);

  const curve: VIXCurvePoint[] = curveResults.map(r => ({ tenor: r.tenor, days: r.days, value: r.value }));
  const vvix = extraResults.find(e => e.key === "vvix")?.value ?? null;
  const skew = extraResults.find(e => e.key === "skew")?.value ?? null;

  const front  = curve[0]?.value;  // 9D
  const spot   = curve[1]?.value;  // 30D
  const back3m = curve[2]?.value;  // 3M

  // Shape analysis
  let shape: VIXCurveResponse["shape"] = "unknown";
  let shapeNote = "Insufficient data to classify term structure.";
  let signalStrength = 0;
  let signal: VIXCurveResponse["signal"] = "neutral";

  if (front !== null && spot !== null && back3m !== null) {
    const frontSpread = front - spot;        // positive = inverted (fear)
    const backSpread  = back3m - spot;       // positive = contango (calm)

    if (frontSpread > 2) {
      shape = "backwardation";
      shapeNote = `Near-term vol (${front?.toFixed(1)}) exceeds long-term (${back3m?.toFixed(1)}) — elevated short-term fear. Historically a contrarian buy signal for equities within 1–4 weeks.`;
      signalStrength = Math.min(100, frontSpread * 8);
      signal = frontSpread > 4 ? "strong_buy" : "buy";
    } else if (backSpread > 1) {
      shape = "contango";
      shapeNote = `Long-term vol (${back3m?.toFixed(1)}) exceeds short-term (${front?.toFixed(1)}) — calm near-term, elevated longer horizon. Normal market structure.`;
      signalStrength = Math.min(50, backSpread * 5);
      signal = "neutral";
    } else {
      shape = "flat";
      shapeNote = "Vol curve is flat — neither fear spike nor complacency. No directional signal from term structure.";
      signalStrength = 0;
      signal = "neutral";
    }
  }

  const payload: VIXCurveResponse = {
    curve,
    shape,
    shapeNote,
    signalStrength: Math.round(signalStrength),
    signal,
    frontSpot:  front ?? null,
    spot:       spot  ?? null,
    vvix,
    skew,
    as_of: new Date().toISOString(),
  };

  return Response.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
