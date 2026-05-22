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
    { symbol: "^KLSE",   name: "KLCI",       flag: "🇲🇾", region: "Malaysia"   },
    { symbol: "^JKSE",   name: "IDX",        flag: "🇮🇩", region: "Indonesia"  },
    { symbol: "^STI",    name: "STI",        flag: "🇸🇬", region: "Singapore"  },
    { symbol: "^TWII",   name: "TAIEX",      flag: "🇹🇼", region: "Taiwan"     },
    { symbol: "PSEI.PS", name: "PSEi",       flag: "🇵🇭", region: "Philippines"},
    { symbol: "^KS11",   name: "KOSPI",      flag: "🇰🇷", region: "Korea"      },
  ],
  china: [
    { symbol: "000001.SS", name: "Shanghai",  flag: "🇨🇳", region: "China (SH)"  },
    { symbol: "000300.SS", name: "CSI 300",   flag: "🇨🇳", region: "China (CSI)" },
    { symbol: "^HSI",      name: "Hang Seng", flag: "🇭🇰", region: "Hong Kong"   },
  ],
  global: [
    { symbol: "^GSPC",      name: "S&P 500",   flag: "🇺🇸", region: "US"          },
    { symbol: "^IXIC",      name: "Nasdaq",    flag: "🇺🇸", region: "US"          },
    { symbol: "^GSPTSE",    name: "TSX",       flag: "🇨🇦", region: "Canada"      },
    { symbol: "^MXX",       name: "BMV IPC",   flag: "🇲🇽", region: "Mexico"      },
    { symbol: "^BVSP",      name: "Bovespa",   flag: "🇧🇷", region: "Brazil"      },
    { symbol: "^FTSE",      name: "FTSE 100",  flag: "🇬🇧", region: "UK"          },
    { symbol: "^GDAXI",     name: "DAX",       flag: "🇩🇪", region: "Germany"     },
    { symbol: "^FCHI",      name: "CAC 40",    flag: "🇫🇷", region: "France"      },
    { symbol: "^AEX",       name: "AEX",       flag: "🇳🇱", region: "Netherlands" },
    { symbol: "^SSMI",      name: "SMI",       flag: "🇨🇭", region: "Switzerland" },
    { symbol: "^IBEX",      name: "IBEX 35",   flag: "🇪🇸", region: "Spain"       },
    { symbol: "FTSEMIB.MI", name: "FTSE MIB",  flag: "🇮🇹", region: "Italy"       },
    { symbol: "^OMX",       name: "OMX 30",    flag: "🇸🇪", region: "Sweden"      },
    { symbol: "IMOEX.ME",   name: "MOEX",     flag: "🇷🇺", region: "Russia"      },
    { symbol: "^TA125.TA",  name: "TA 125",    flag: "🇮🇱", region: "Israel"      },
    { symbol: "^TASI.SR",   name: "Tadawul",   flag: "🇸🇦", region: "Saudi"       },
    { symbol: "^JN0U.JO",   name: "JSE Top 40",flag: "🇿🇦", region: "S. Africa"   },
    { symbol: "^N225",      name: "Nikkei",    flag: "🇯🇵", region: "Japan"       },
    { symbol: "^BSESN",     name: "Sensex",    flag: "🇮🇳", region: "India"       },
    { symbol: "^AXJO",      name: "ASX 200",   flag: "🇦🇺", region: "Australia"   },
  ],
} as const;

// ─── World financial centers (for the Braun world clock map) ──────
// Cities ordered by longitude (west → east), live index + tz offset.
export const WORLD_FINANCIAL_CENTERS = [
  { id: "lax",    city: "Los Angeles", country: "US",      flag: "🇺🇸", lon: -118.24, tz: "America/Los_Angeles", tzOffset: -8, index: "^GSPC",   indexLabel: "S&P 500"  },
  { id: "nyc",    city: "New York",    country: "US",      flag: "🇺🇸", lon:  -74.00, tz: "America/New_York",    tzOffset: -5, index: "^DJI",    indexLabel: "Dow"      },
  { id: "spo",    city: "São Paulo",   country: "Brazil",  flag: "🇧🇷", lon:  -46.63, tz: "America/Sao_Paulo",   tzOffset: -3, index: "^BVSP",   indexLabel: "Bovespa"  },
  { id: "lon",    city: "London",      country: "UK",      flag: "🇬🇧", lon:   -0.13, tz: "Europe/London",       tzOffset:  0, index: "^FTSE",   indexLabel: "FTSE 100" },
  { id: "fra",    city: "Frankfurt",   country: "Germany", flag: "🇩🇪", lon:    8.68, tz: "Europe/Berlin",       tzOffset:  1, index: "^GDAXI",  indexLabel: "DAX"      },
  { id: "mow",    city: "Moscow",      country: "Russia",  flag: "🇷🇺", lon:   37.62, tz: "Europe/Moscow",       tzOffset:  3, index: "IMOEX.ME",indexLabel: "MOEX"     },
  { id: "dxb",    city: "Dubai",       country: "UAE",     flag: "🇦🇪", lon:   55.27, tz: "Asia/Dubai",          tzOffset:  4, index: "^TASI.SR",indexLabel: "Tadawul"  },
  { id: "bom",    city: "Mumbai",      country: "India",   flag: "🇮🇳", lon:   72.88, tz: "Asia/Kolkata",        tzOffset: 5.5,index: "^BSESN",  indexLabel: "Sensex"   },
  { id: "bkk",    city: "Bangkok",     country: "Thailand",flag: "🇹🇭", lon:  100.50, tz: "Asia/Bangkok",        tzOffset:  7, index: "^SET.BK", indexLabel: "SET"      },
  { id: "sin",    city: "Singapore",   country: "Singapore",flag: "🇸🇬",lon:  103.85, tz: "Asia/Singapore",      tzOffset:  8, index: "^STI",    indexLabel: "STI"      },
  { id: "hkg",    city: "Hong Kong",   country: "HK",      flag: "🇭🇰", lon:  114.16, tz: "Asia/Hong_Kong",      tzOffset:  8, index: "^HSI",    indexLabel: "Hang Seng"},
  { id: "sha",    city: "Shanghai",    country: "China",   flag: "🇨🇳", lon:  121.47, tz: "Asia/Shanghai",       tzOffset:  8, index: "000001.SS", indexLabel: "SSE"    },
  { id: "tyo",    city: "Tokyo",       country: "Japan",   flag: "🇯🇵", lon:  139.69, tz: "Asia/Tokyo",          tzOffset:  9, index: "^N225",   indexLabel: "Nikkei"   },
  { id: "syd",    city: "Sydney",      country: "Australia",flag: "🇦🇺",lon:  151.21, tz: "Australia/Sydney",    tzOffset: 10, index: "^AXJO",   indexLabel: "ASX 200"  },
] as const;

export async function fetchWorldCenters(): Promise<Array<{ id: string; city: string; flag: string; lon: number; tzOffset: number; indexLabel: string; price: number; changePct: number } | null>> {
  return Promise.all(
    WORLD_FINANCIAL_CENTERS.map(async (c) => {
      const quote = await fetchYahooQuote(c.index, c.indexLabel);
      if (!quote) return null;
      return {
        id: c.id,
        city: c.city,
        flag: c.flag,
        lon: c.lon,
        tzOffset: c.tzOffset,
        indexLabel: c.indexLabel,
        price: quote.price,
        changePct: quote.changePct,
      };
    }),
  );
}

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
  // FX crosses — added for the world-map FX layer
  { symbol: "EURUSD=X", name: "EUR/USD",     unit: "rate",    category: "fx"        },
  { symbol: "GBPUSD=X", name: "GBP/USD",     unit: "rate",    category: "fx"        },
  { symbol: "USDJPY=X", name: "USD/JPY",     unit: "rate",    category: "fx"        },
  { symbol: "USDCNY=X", name: "USD/CNY",     unit: "rate",    category: "fx"        },
  { symbol: "USDINR=X", name: "USD/INR",     unit: "rate",    category: "fx"        },
  { symbol: "AUDUSD=X", name: "AUD/USD",     unit: "rate",    category: "fx"        },
  { symbol: "USDBRL=X", name: "USD/BRL",     unit: "rate",    category: "fx"        },
  { symbol: "USDTHB=X", name: "USD/THB",     unit: "rate",    category: "fx"        },
  // Global vol — added for the world-map VOL layer
  { symbol: "^VXN",    name: "VXN (Nasdaq)", unit: "index",   category: "volatility"},
  { symbol: "^VSTOXX", name: "VSTOXX (EU)",  unit: "index",   category: "volatility"},
  { symbol: "^VNKY",   name: "VNKY (JP)",    unit: "index",   category: "volatility"},
  { symbol: "^VHSI",   name: "VHSI (HK)",    unit: "index",   category: "volatility"},
  { symbol: "^MOVE",   name: "MOVE (Bond)",  unit: "index",   category: "volatility"},
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

// ─── Historical price series (for charts) ────────────────────────

export interface HistoricalPoint {
  date: string;       // "2025-01-15"
  close: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
}

type HistoryRange = "1mo" | "3mo" | "6mo" | "1y" | "2y";
type HistoryInterval = "1d" | "1wk";

const histCache = new Map<string, { data: HistoricalPoint[]; ts: number }>();
const HIST_TTL = 30 * 60 * 1000; // 30 min

export async function fetchHistoricalPrices(
  symbol: string,
  range: HistoryRange = "1y",
  interval: HistoryInterval = "1d",
): Promise<HistoricalPoint[]> {
  const key = `${symbol}:${range}:${interval}`;
  const cached = histCache.get(key);
  if (cached && Date.now() - cached.ts < HIST_TTL) return cached.data;

  try {
    const url = `${YAHOO_API}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, {
      headers: HEADERS,
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const quotes = result.indicators?.quote?.[0] ?? {};
    const closes: number[] = quotes.close ?? [];
    const volumes: number[] = quotes.volume ?? [];
    const opens: number[] = quotes.open ?? [];
    const highs: number[] = quotes.high ?? [];
    const lows: number[] = quotes.low ?? [];

    const points: HistoricalPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null) continue;
      const date = new Date(timestamps[i] * 1000);
      const dateStr = date.toISOString().split("T")[0];
      points.push({
        date: dateStr,
        close: closes[i],
        volume: volumes[i],
        open: opens[i],
        high: highs[i],
        low: lows[i],
      });
    }

    histCache.set(key, { data: points, ts: Date.now() });
    return points;
  } catch {
    return [];
  }
}

// Normalize prices to % change from first data point (for comparison charts)
export function normalizeToPercentChange(points: HistoricalPoint[]): { date: string; pct: number }[] {
  if (points.length === 0) return [];
  const base = points[0].close;
  return points.map(p => ({
    date: p.date,
    pct: ((p.close - base) / base) * 100,
  }));
}

// ─── SET50 preset comparison groups ──────────────────────────────

export const COMPARISON_GROUPS: Record<string, { label: string; symbols: { symbol: string; name: string }[] }> = {
  banking: {
    label: "BANKING",
    symbols: [
      { symbol: "KBANK.BK", name: "KBANK" },
      { symbol: "SCB.BK",   name: "SCB"   },
      { symbol: "BBL.BK",   name: "BBL"   },
    ],
  },
  energy: {
    label: "ENERGY",
    symbols: [
      { symbol: "PTT.BK",    name: "PTT"    },
      { symbol: "PTTEP.BK",  name: "PTTEP"  },
      { symbol: "GULF.BK",   name: "GULF"   },
    ],
  },
  consumer: {
    label: "CONSUMER",
    symbols: [
      { symbol: "CPALL.BK",  name: "CPALL"  },
      { symbol: "HMPRO.BK",  name: "HMPRO"  },
      { symbol: "MINT.BK",   name: "MINT"   },
    ],
  },
  telecom: {
    label: "TELECOM",
    symbols: [
      { symbol: "ADVANC.BK", name: "ADVANC" },
      { symbol: "TRUE.BK",   name: "TRUE"   },
    ],
  },
  value: {
    label: "GRAHAM PICKS",
    symbols: [
      { symbol: "KBANK.BK",  name: "KBANK" },
      { symbol: "BBL.BK",    name: "BBL"   },
      { symbol: "PTT.BK",    name: "PTT"   },
      { symbol: "SCC.BK",    name: "SCC"   },
      { symbol: "RATCH.BK",  name: "RATCH" },
    ],
  },
};

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

// ─── History (sparklines + multi-timeframe %) ─────────────────────

export interface HistoryPoint { t: number; c: number }

/** Fetch daily-close history from Yahoo's chart endpoint. Falls back to []. */
export async function fetchHistory(symbol: string, range: "1mo" | "3mo" | "6mo" | "1y" = "6mo"): Promise<HistoryPoint[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiamMarkets/1.0)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json() as {
      chart?: { result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: (number | null)[] }> };
      }> };
    };
    const r = data.chart?.result?.[0];
    const ts = r?.timestamp ?? [];
    const cs = r?.indicators?.quote?.[0]?.close ?? [];
    const out: HistoryPoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = cs[i];
      if (c != null && isFinite(c)) out.push({ t: ts[i] * 1000, c });
    }
    return out;
  } catch {
    return [];
  }
}

export async function fetchHistories(symbols: string[], range: "1mo" | "3mo" | "6mo" | "1y" = "6mo"): Promise<Record<string, HistoryPoint[]>> {
  const results = await Promise.all(symbols.map(s => fetchHistory(s, range).then(h => [s, h] as const)));
  const out: Record<string, HistoryPoint[]> = {};
  for (const [s, h] of results) out[s] = h;
  return out;
}
