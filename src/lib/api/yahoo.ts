/**
 * Yahoo Finance — public chart API, no key required.
 * Used for: SET Index + ASEAN + China regional indices.
 * Note: yfinance Python library uses the same underlying endpoints for ingestion.
 */

export interface YahooQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  change: number;
  high52w: number;
  low52w: number;
  exchange: string;
  updatedAt: string;
}

// Regional market groups — "how Thai people invest"
export const REGIONAL_MARKETS = {
  thai: [
    { symbol: "^SET.BK", name: "SET Index",  flag: "🇹🇭", region: "Thailand" },
  ],
  asean: [
    { symbol: "^KLSE",   name: "KLCI",       flag: "🇲🇾", region: "Malaysia"  },
    { symbol: "^JKSE",   name: "IDX",        flag: "🇮🇩", region: "Indonesia" },
    { symbol: "^STI",    name: "STI",        flag: "🇸🇬", region: "Singapore" },
    { symbol: "^TWII",   name: "TAIEX",      flag: "🇹🇼", region: "Taiwan"   },
  ],
  china: [
    { symbol: "000001.SS", name: "Shanghai",  flag: "🇨🇳", region: "China (SH)"   },
    { symbol: "000300.SS", name: "CSI 300",   flag: "🇨🇳", region: "China (CSI)" },
    { symbol: "^HSI",      name: "Hang Seng", flag: "🇭🇰", region: "Hong Kong"   },
  ],
  global: [
    { symbol: "^GSPC",  name: "S&P 500", flag: "🇺🇸", region: "US"    },
    { symbol: "^N225",  name: "Nikkei",  flag: "🇯🇵", region: "Japan" },
    { symbol: "^IXIC",  name: "Nasdaq",  flag: "🇺🇸", region: "US"   },
  ],
} as const;

// ─── Alternative Asset Classes ───────────────────────────────────

export const ASSET_CLASS_MARKETS = [
  { symbol: "GC=F",     name: "Gold",        unit: "USD/oz",  category: "commodity" },
  { symbol: "SI=F",     name: "Silver",      unit: "USD/oz",  category: "commodity" },
  { symbol: "CL=F",     name: "Oil WTI",     unit: "USD/bbl", category: "commodity" },
  { symbol: "NG=F",     name: "Nat Gas",     unit: "USD/MMBtu", category: "commodity" },
  { symbol: "HG=F",     name: "Copper",      unit: "USD/lb",  category: "commodity" },
  { symbol: "BTC-USD",  name: "Bitcoin",     unit: "USD",     category: "crypto"    },
  { symbol: "^VIX",     name: "VIX",         unit: "index",   category: "volatility"},
  { symbol: "^TNX",     name: "US 10Y",      unit: "%",       category: "bonds"     },
  { symbol: "^IRX",     name: "US 2Y",       unit: "%",       category: "bonds"     },
  { symbol: "DX-Y.NYB", name: "USD Index",   unit: "index",   category: "currency"  },
] as const;

export async function fetchAssetClasses(): Promise<YahooQuote[]> {
  const results = await Promise.all(
    ASSET_CLASS_MARKETS.map(({ symbol, name }) => fetchYahooQuote(symbol, name)),
  );
  return results.filter((q): q is YahooQuote => q !== null);
}

// Vietnam has no reliable free feed — shown as a special placeholder
export const VIETNAM_PLACEHOLDER = {
  symbol: "VNINDEX",
  name: "VN-Index",
  flag: "🇻🇳",
  region: "Vietnam",
  note: "No free live feed — check SSI/VNDS app",
};

const YAHOO_API = "https://query1.finance.yahoo.com/v8/finance/chart";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; SiamMarkets/1.0)" };

// Cache: 5-minute TTL per symbol
const cache = new Map<string, { quote: YahooQuote; ts: number }>();
const TTL = 5 * 60 * 1000;

export async function fetchYahooQuote(
  symbol: string,
  name: string,
): Promise<YahooQuote | null> {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < TTL) return cached.quote;

  try {
    const url = `${YAHOO_API}/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: HEADERS,
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const prev  = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;

    // 52-week range from timestamps (approximate from available data)
    const closes: number[] = result.indicators?.quote?.[0]?.close?.filter(Boolean) ?? [];
    const high52w = meta.fiftyTwoWeekHigh ?? (closes.length ? Math.max(...closes) : price * 1.1);
    const low52w  = meta.fiftyTwoWeekLow  ?? (closes.length ? Math.min(...closes) : price * 0.9);

    const quote: YahooQuote = {
      symbol,
      name,
      price,
      changePct,
      change,
      high52w,
      low52w,
      exchange: meta.fullExchangeName ?? meta.exchangeName ?? "",
      updatedAt: new Date().toISOString(),
    };

    cache.set(symbol, { quote, ts: Date.now() });
    return quote;
  } catch {
    return null;
  }
}

export async function fetchRegionalGroup(
  group: keyof typeof REGIONAL_MARKETS,
): Promise<YahooQuote[]> {
  const markets = REGIONAL_MARKETS[group];
  const results = await Promise.all(
    markets.map(({ symbol, name }) => fetchYahooQuote(symbol, name)),
  );
  return results.filter((q): q is YahooQuote => q !== null);
}

export async function fetchAllRegional(): Promise<{
  thai: YahooQuote[];
  asean: YahooQuote[];
  china: YahooQuote[];
  global: YahooQuote[];
}> {
  const [thai, asean, china, global] = await Promise.all([
    fetchRegionalGroup("thai"),
    fetchRegionalGroup("asean"),
    fetchRegionalGroup("china"),
    fetchRegionalGroup("global"),
  ]);
  return { thai, asean, china, global };
}
