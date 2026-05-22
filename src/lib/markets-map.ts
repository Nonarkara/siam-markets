/**
 * Geographic map metadata for global stock exchanges, commodities,
 * yields, and volatility — the Bloomberg WORLD/MAP/WEI view.
 *
 * Pure enrichment layer: pairs Yahoo symbols already fetched by
 * `fetchAllRegional` + `fetchAssetClasses` with lat/lon + a layer
 * (EQUITY / COMMODITIES / YIELDS / VOL) + a visual size tier.
 *
 * Size tier (1 = mega · 4 = small):
 *   1  NYSE, Nasdaq, Tokyo, London
 *   2  Frankfurt, Paris, HK, Shanghai, Mumbai, Gold, Oil, BTC
 *   3  Seoul, Sydney, Toronto, Singapore, Riyadh, São Paulo, Taipei,
 *      Copper, Silver, US 10Y, US 2Y, VIX, DXY
 *   4  Bangkok (home — highlighted), Jakarta, KL, Manila, HCMC,
 *      Zurich, Stockholm, Moscow, Istanbul, Dubai, Mexico City,
 *      Johannesburg, NatGas
 */

export type SizeTier = 1 | 2 | 3 | 4;
export type Layer = "EQUITY" | "COMMODITIES" | "FX" | "RATES" | "VOL" | "FLIGHTS";
export type LabelDir = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type Panel = "americas" | "emeaApac";

export interface MarketLocation {
  id: string;
  city: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  symbol: string;
  indexLabel: string;
  layer: Layer;
  sizeTier: SizeTier;
  capBn: number;
  highlight?: boolean;
  tzOffset?: number;
  openHours?: { open: number; close: number };
  unit?: string;
  alwaysOn?: boolean;
  /** Override automatic label placement (anti-collision in dense clusters). */
  labelDir?: LabelDir;
}

/** Which panel a longitude belongs to: Americas (~-130..-30) vs EMEA+APAC. */
export function panelOf(lon: number): Panel {
  return lon < -20 ? "americas" : "emeaApac";
}

export const PANEL_BOUNDS: Record<Panel, { lonMin: number; lonMax: number; latMin: number; latMax: number; width: number; height: number }> = {
  americas: { lonMin: -130, lonMax: -30,  latMin: -40, latMax: 65, width: 350, height: 500 },
  emeaApac: { lonMin:  -15, lonMax: 160,  latMin: -45, latMax: 70, width: 650, height: 500 },
};

export function projectInPanel(lon: number, lat: number, panel: Panel): { x: number; y: number } {
  const b = PANEL_BOUNDS[panel];
  const x = ((lon - b.lonMin) / (b.lonMax - b.lonMin)) * b.width;
  const y = ((b.latMax - lat) / (b.latMax - b.latMin)) * b.height;
  return { x, y };
}

export function labelOffset(dir: LabelDir, dot: number): { dx: number; dy: number; anchor: "start" | "middle" | "end"; align: "top" | "middle" | "bottom" } {
  const d = dot + 4;
  switch (dir) {
    case "N":  return { dx: 0,  dy: -d, anchor: "middle", align: "bottom" };
    case "NE": return { dx: d,  dy: -d, anchor: "start",  align: "bottom" };
    case "E":  return { dx: d,  dy: 0,  anchor: "start",  align: "middle" };
    case "SE": return { dx: d,  dy: d,  anchor: "start",  align: "top" };
    case "S":  return { dx: 0,  dy: d,  anchor: "middle", align: "top" };
    case "SW": return { dx: -d, dy: d,  anchor: "end",    align: "top" };
    case "W":  return { dx: -d, dy: 0,  anchor: "end",    align: "middle" };
    case "NW": return { dx: -d, dy: -d, anchor: "end",    align: "bottom" };
  }
}

export const MARKET_LOCATIONS: MarketLocation[] = [
  // ═══ AMERICAS · 6 markets ═══════════════════════════════════
  { id: "nyse_sp", layer: "EQUITY", city: "New York",    country: "US",        flag: "🇺🇸", lat:  40.71, lon:  -74.00, symbol: "^GSPC",     indexLabel: "S&P 500",  sizeTier: 1, capBn: 45000, tzOffset: -5, openHours: { open: 9.5, close: 16 }, labelDir: "E" },
  { id: "nyse_nq", layer: "EQUITY", city: "Nasdaq",      country: "US",        flag: "🇺🇸", lat:  40.71, lon:  -73.50, symbol: "^IXIC",     indexLabel: "Nasdaq",   sizeTier: 1, capBn: 28000, tzOffset: -5, openHours: { open: 9.5, close: 16 }, labelDir: "SE" },
  { id: "tor",     layer: "EQUITY", city: "Toronto",     country: "Canada",    flag: "🇨🇦", lat:  43.65, lon:  -79.38, symbol: "^GSPTSE",   indexLabel: "TSX",      sizeTier: 2, capBn:  3300, tzOffset: -5, openHours: { open: 9.5, close: 16 }, labelDir: "NW" },
  { id: "mex",     layer: "EQUITY", city: "Mexico City", country: "Mexico",    flag: "🇲🇽", lat:  19.43, lon:  -99.13, symbol: "^MXX",      indexLabel: "BMV IPC",  sizeTier: 3, capBn:   480, tzOffset: -6, openHours: { open: 8.5, close: 15 }, labelDir: "W" },
  { id: "spo",     layer: "EQUITY", city: "São Paulo",   country: "Brazil",    flag: "🇧🇷", lat: -23.55, lon:  -46.63, symbol: "^BVSP",     indexLabel: "Bovespa",  sizeTier: 3, capBn:   900, tzOffset: -3, openHours: { open: 10,  close: 17 }, labelDir: "E" },

  // ═══ EUROPE · 8 markets ═════════════════════════════════════
  { id: "lon",     layer: "EQUITY", city: "London",      country: "UK",        flag: "🇬🇧", lat:  51.50, lon:   -0.13, symbol: "^FTSE",     indexLabel: "FTSE 100", sizeTier: 1, capBn:  3200, tzOffset:  0, openHours: { open: 8,    close: 16.5 }, labelDir: "NW" },
  { id: "fra",     layer: "EQUITY", city: "Frankfurt",   country: "Germany",   flag: "🇩🇪", lat:  50.12, lon:    8.68, symbol: "^GDAXI",    indexLabel: "DAX",      sizeTier: 2, capBn:  2400, tzOffset:  1, openHours: { open: 9,    close: 17.5 }, labelDir: "NE" },
  { id: "par",     layer: "EQUITY", city: "Paris",       country: "France",    flag: "🇫🇷", lat:  48.86, lon:    2.35, symbol: "^FCHI",     indexLabel: "CAC 40",   sizeTier: 2, capBn:  3100, tzOffset:  1, openHours: { open: 9,    close: 17.5 }, labelDir: "SW" },
  { id: "ams",     layer: "EQUITY", city: "Amsterdam",   country: "Netherlands",flag:"🇳🇱", lat:  52.37, lon:    4.90, symbol: "^AEX",      indexLabel: "AEX",      sizeTier: 3, capBn:  1100, tzOffset:  1, openHours: { open: 9,    close: 17.5 }, labelDir: "N" },
  { id: "zur",     layer: "EQUITY", city: "Zurich",      country: "Switzerland",flag:"🇨🇭", lat:  47.37, lon:    8.55, symbol: "^SSMI",     indexLabel: "SMI",      sizeTier: 3, capBn:  2000, tzOffset:  1, openHours: { open: 9,    close: 17.5 }, labelDir: "SE" },
  { id: "mil",     layer: "EQUITY", city: "Milan",       country: "Italy",     flag: "🇮🇹", lat:  45.46, lon:    9.19, symbol: "FTSEMIB.MI",indexLabel: "FTSE MIB", sizeTier: 3, capBn:   850, tzOffset:  1, openHours: { open: 9,    close: 17.5 }, labelDir: "S" },
  { id: "mad",     layer: "EQUITY", city: "Madrid",      country: "Spain",     flag: "🇪🇸", lat:  40.42, lon:   -3.70, symbol: "^IBEX",     indexLabel: "IBEX 35",  sizeTier: 3, capBn:   780, tzOffset:  1, openHours: { open: 9,    close: 17.5 }, labelDir: "SW" },
  { id: "sto",     layer: "EQUITY", city: "Stockholm",   country: "Sweden",    flag: "🇸🇪", lat:  59.33, lon:   18.07, symbol: "^OMX",      indexLabel: "OMX 30",   sizeTier: 4, capBn:   700, tzOffset:  1, openHours: { open: 9,    close: 17.5 }, labelDir: "NE" },
  { id: "mow",     layer: "EQUITY", city: "Moscow",      country: "Russia",    flag: "🇷🇺", lat:  55.75, lon:   37.62, symbol: "IMOEX.ME",  indexLabel: "MOEX",     sizeTier: 4, capBn:   250, tzOffset:  3, openHours: { open: 10,   close: 18.75 },labelDir: "E" },

  // ═══ MIDDLE EAST · AFRICA · 4 markets ══════════════════════
  { id: "ist",     layer: "EQUITY", city: "Tel Aviv",    country: "Israel",    flag: "🇮🇱", lat:  32.07, lon:   34.78, symbol: "^TA125.TA", indexLabel: "TA 125",   sizeTier: 4, capBn:   300, tzOffset:  3, openHours: { open: 9.5,  close: 17 },   labelDir: "S" },
  { id: "ruh",     layer: "EQUITY", city: "Riyadh",      country: "Saudi",     flag: "🇸🇦", lat:  24.71, lon:   46.68, symbol: "^TASI.SR",  indexLabel: "Tadawul",  sizeTier: 3, capBn:  3000, tzOffset:  3, openHours: { open: 10,   close: 15 },   labelDir: "E" },
  { id: "dxb",     layer: "EQUITY", city: "Dubai",       country: "UAE",       flag: "🇦🇪", lat:  25.20, lon:   55.27, symbol: "^TASI.SR",  indexLabel: "DFM",      sizeTier: 4, capBn:   200, tzOffset:  4, openHours: { open: 10,   close: 15 },   labelDir: "SE" },
  { id: "jnb",     layer: "EQUITY", city: "Johannesburg",country: "S. Africa", flag: "🇿🇦", lat: -26.21, lon:   28.04, symbol: "^JN0U.JO",  indexLabel: "JSE Top 40",sizeTier: 4,capBn:  1200, tzOffset:  2, openHours: { open: 9,    close: 17 },   labelDir: "S" },

  // ═══ ASIA-PACIFIC · 12 markets (spread to avoid collisions) ══
  { id: "tyo",     layer: "EQUITY", city: "Tokyo",       country: "Japan",     flag: "🇯🇵", lat:  35.68, lon:  139.69, symbol: "^N225",     indexLabel: "Nikkei",   sizeTier: 1, capBn:  6500, tzOffset:  9, openHours: { open: 9,    close: 15 },   labelDir: "NE" },
  { id: "sel",     layer: "EQUITY", city: "Seoul",       country: "Korea",     flag: "🇰🇷", lat:  37.57, lon:  126.98, symbol: "^KS11",     indexLabel: "KOSPI",    sizeTier: 2, capBn:  2400, tzOffset:  9, openHours: { open: 9,    close: 15.5 }, labelDir: "N" },
  { id: "csi",     layer: "EQUITY", city: "Beijing",     country: "China",     flag: "🇨🇳", lat:  39.90, lon:  116.40, symbol: "000300.SS", indexLabel: "CSI 300",  sizeTier: 2, capBn:  6900, tzOffset:  8, openHours: { open: 9.5,  close: 15 },   labelDir: "NW" },
  { id: "sha",     layer: "EQUITY", city: "Shanghai",    country: "China",     flag: "🇨🇳", lat:  31.23, lon:  121.47, symbol: "000001.SS", indexLabel: "Shanghai", sizeTier: 2, capBn:  7800, tzOffset:  8, openHours: { open: 9.5,  close: 15 },   labelDir: "E"  },
  { id: "hkg",     layer: "EQUITY", city: "Hong Kong",   country: "HK",        flag: "🇭🇰", lat:  22.30, lon:  114.16, symbol: "^HSI",      indexLabel: "Hang Seng",sizeTier: 2, capBn:  4400, tzOffset:  8, openHours: { open: 9.5,  close: 16 },   labelDir: "SW" },
  { id: "tpe",     layer: "EQUITY", city: "Taipei",      country: "Taiwan",    flag: "🇹🇼", lat:  25.03, lon:  121.57, symbol: "^TWII",     indexLabel: "TAIEX",    sizeTier: 3, capBn:  2200, tzOffset:  8, openHours: { open: 9,    close: 13.5 }, labelDir: "SE" },
  { id: "bom",     layer: "EQUITY", city: "Mumbai",      country: "India",     flag: "🇮🇳", lat:  19.08, lon:   72.88, symbol: "^BSESN",    indexLabel: "Sensex",   sizeTier: 2, capBn:  5100, tzOffset:  5.5, openHours:{ open: 9.25, close: 15.5 }, labelDir: "W"  },
  { id: "bkk",     layer: "EQUITY", city: "Bangkok",     country: "Thailand",  flag: "🇹🇭", lat:  13.75, lon:  100.50, symbol: "^SET.BK",   indexLabel: "SET",      sizeTier: 3, capBn:   460, tzOffset:  7, openHours: { open: 10,   close: 16.5 }, labelDir: "SW", highlight: true },
  { id: "sin",     layer: "EQUITY", city: "Singapore",   country: "Singapore", flag: "🇸🇬", lat:   1.29, lon:  103.85, symbol: "^STI",      indexLabel: "STI",      sizeTier: 3, capBn:   650, tzOffset:  8, openHours: { open: 9,    close: 17 },   labelDir: "S"  },
  { id: "kul",     layer: "EQUITY", city: "Kuala Lumpur",country: "Malaysia",  flag: "🇲🇾", lat:   3.14, lon:  101.69, symbol: "^KLSE",     indexLabel: "KLCI",     sizeTier: 4, capBn:   400, tzOffset:  8, openHours: { open: 9,    close: 17 },   labelDir: "W"  },
  { id: "jkt",     layer: "EQUITY", city: "Jakarta",     country: "Indonesia", flag: "🇮🇩", lat:  -6.21, lon:  106.85, symbol: "^JKSE",     indexLabel: "IDX",      sizeTier: 4, capBn:   720, tzOffset:  7, openHours: { open: 9,    close: 15.5 }, labelDir: "S"  },
  { id: "mnl",     layer: "EQUITY", city: "Manila",      country: "Philippines",flag:"🇵🇭", lat:  14.60, lon:  120.98, symbol: "PSEI.PS",   indexLabel: "PSEi",     sizeTier: 4, capBn:   210, tzOffset:  8, openHours: { open: 9.5,  close: 15.5 }, labelDir: "E"  },
  { id: "syd",     layer: "EQUITY", city: "Sydney",      country: "Australia", flag: "🇦🇺", lat: -33.87, lon:  151.21, symbol: "^AXJO",     indexLabel: "ASX 200",  sizeTier: 3, capBn:  2100, tzOffset: 10, openHours: { open: 10,   close: 16 },   labelDir: "NE" },

  // ── COMMODITIES — pinned at their physical / trading home ─
  { id: "gold",   layer: "COMMODITIES", city: "London",   country: "UK",   flag: "🥇", lat: 51.51, lon:  -0.10, symbol: "GC=F",    indexLabel: "Gold",      sizeTier: 2, capBn: 13000, alwaysOn: true, unit: "USD/oz" },
  { id: "silver", layer: "COMMODITIES", city: "Zurich",   country: "Swiss",flag: "🥈", lat: 47.37, lon:   8.55, symbol: "SI=F",    indexLabel: "Silver",    sizeTier: 3, capBn:  1500, alwaysOn: true, unit: "USD/oz" },
  { id: "oil",    layer: "COMMODITIES", city: "Houston",  country: "US",   flag: "🛢️", lat: 29.76, lon: -95.37, symbol: "CL=F",    indexLabel: "Oil WTI",   sizeTier: 2, capBn:  3000, alwaysOn: true, unit: "USD/bbl" },
  { id: "natgas", layer: "COMMODITIES", city: "Henry Hub",country: "US",   flag: "🔥", lat: 29.86, lon: -91.74, symbol: "NG=F",    indexLabel: "Nat Gas",   sizeTier: 4, capBn:   800, alwaysOn: true, unit: "USD/MMBtu" },
  { id: "copper", layer: "COMMODITIES", city: "London",   country: "UK",   flag: "🟠", lat: 51.51, lon:   0.10, symbol: "HG=F",    indexLabel: "Copper",    sizeTier: 3, capBn:   200, alwaysOn: true, unit: "USD/lb" },
  { id: "btc",    layer: "COMMODITIES", city: "Singapore",country: "Crypto",flag:"₿", lat:  1.50, lon: 104.10, symbol: "BTC-USD", indexLabel: "Bitcoin",   sizeTier: 2, capBn:  1300, alwaysOn: true, unit: "USD" },

  // ── FX · 8 live currency crosses ──────────────────────────
  { id: "fx_eur",  layer: "FX", city: "Frankfurt", country: "EU",       flag: "🇪🇺", lat: 50.11, lon:    8.68, symbol: "EURUSD=X", indexLabel: "EUR/USD", sizeTier: 1, capBn: 0, unit: "rate", alwaysOn: true },
  { id: "fx_gbp",  layer: "FX", city: "London",    country: "UK",       flag: "🇬🇧", lat: 51.50, lon:   -0.13, symbol: "GBPUSD=X", indexLabel: "GBP/USD", sizeTier: 2, capBn: 0, unit: "rate", alwaysOn: true },
  { id: "fx_jpy",  layer: "FX", city: "Tokyo",     country: "Japan",    flag: "🇯🇵", lat: 35.68, lon:  139.69, symbol: "USDJPY=X", indexLabel: "USD/JPY", sizeTier: 1, capBn: 0, unit: "rate", alwaysOn: true },
  { id: "fx_cny",  layer: "FX", city: "Shanghai",  country: "China",    flag: "🇨🇳", lat: 31.23, lon:  121.47, symbol: "USDCNY=X", indexLabel: "USD/CNY", sizeTier: 2, capBn: 0, unit: "rate", alwaysOn: true },
  { id: "fx_inr",  layer: "FX", city: "Mumbai",    country: "India",    flag: "🇮🇳", lat: 19.08, lon:   72.88, symbol: "USDINR=X", indexLabel: "USD/INR", sizeTier: 3, capBn: 0, unit: "rate", alwaysOn: true },
  { id: "fx_aud",  layer: "FX", city: "Sydney",    country: "Australia",flag: "🇦🇺", lat:-33.87, lon:  151.21, symbol: "AUDUSD=X", indexLabel: "AUD/USD", sizeTier: 3, capBn: 0, unit: "rate", alwaysOn: true },
  { id: "fx_brl",  layer: "FX", city: "São Paulo", country: "Brazil",   flag: "🇧🇷", lat:-23.55, lon:  -46.63, symbol: "USDBRL=X", indexLabel: "USD/BRL", sizeTier: 3, capBn: 0, unit: "rate", alwaysOn: true },
  { id: "fx_thb",  layer: "FX", city: "Bangkok",   country: "Thailand", flag: "🇹🇭", lat: 13.75, lon:  100.50, symbol: "USDTHB=X", indexLabel: "USD/THB", sizeTier: 2, capBn: 0, unit: "rate", alwaysOn: true, highlight: true },

  // ── RATES · US Treasury yields + USD index ────────────────
  { id: "us10y",  layer: "RATES", city: "Washington", country: "US", flag: "🇺🇸", lat: 38.90, lon: -77.04, symbol: "^TNX",     indexLabel: "US 10Y",  sizeTier: 2, capBn: 28000, unit: "%" },
  { id: "us2y",   layer: "RATES", city: "New York",   country: "US", flag: "🇺🇸", lat: 40.40, lon: -74.40, symbol: "^IRX",     indexLabel: "US 2Y",   sizeTier: 3, capBn: 28000, unit: "%" },
  { id: "dxy",    layer: "RATES", city: "Washington", country: "US", flag: "💵", lat: 38.85, lon: -77.20, symbol: "DX-Y.NYB", indexLabel: "USD Index", sizeTier: 3, capBn: 0, unit: "idx" },

  // ── VOL · stress gauges (global) ─────────────────────────
  { id: "vix",    layer: "VOL", city: "Chicago",   country: "US",  flag: "🇺🇸", lat: 41.88,  lon: -87.63,  symbol: "^VIX",   indexLabel: "VIX",    sizeTier: 2, capBn: 0, unit: "idx", alwaysOn: true },
  { id: "vxn",    layer: "VOL", city: "New York",  country: "US",  flag: "🇺🇸", lat: 40.50,  lon: -74.10,  symbol: "^VXN",   indexLabel: "VXN",    sizeTier: 3, capBn: 0, unit: "idx", alwaysOn: true },
  { id: "vstoxx", layer: "VOL", city: "Frankfurt", country: "EU",  flag: "🇪🇺", lat: 50.12,  lon:   8.68,  symbol: "^VSTOXX",indexLabel: "VSTOXX", sizeTier: 3, capBn: 0, unit: "idx", alwaysOn: true },
  { id: "vnky",   layer: "VOL", city: "Osaka",     country: "JP",  flag: "🇯🇵", lat: 34.69,  lon: 135.50,  symbol: "^VNKY",  indexLabel: "VNKY",   sizeTier: 3, capBn: 0, unit: "idx", alwaysOn: true },
  { id: "vhsi",   layer: "VOL", city: "Hong Kong", country: "HK",  flag: "🇭🇰", lat: 22.32,  lon: 114.16,  symbol: "^VHSI",  indexLabel: "VHSI",   sizeTier: 3, capBn: 0, unit: "idx", alwaysOn: true },
  { id: "move",   layer: "VOL", city: "New York",  country: "US",  flag: "💵",  lat: 40.75,  lon: -74.00,  symbol: "^MOVE",  indexLabel: "MOVE",   sizeTier: 3, capBn: 0, unit: "idx", alwaysOn: true },
];

/**
 * Join the already-fetched quote arrays with location metadata.
 * Quotes that don't have a location are ignored. Missing prices show
 * as a grey pin ("market closed / no data").
 */
export interface MarketPin extends MarketLocation {
  price: number | null;
  changePct: number | null;
}

interface QuoteLike { symbol: string; price?: number; changePct?: number }

export function joinQuotesToLocations(quotes: QuoteLike[]): MarketPin[] {
  const bySymbol = new Map<string, QuoteLike>();
  for (const q of quotes) bySymbol.set(q.symbol, q);
  return MARKET_LOCATIONS.map(loc => {
    const q = bySymbol.get(loc.symbol);
    return {
      ...loc,
      price:     q?.price     ?? null,
      changePct: q?.changePct ?? null,
    };
  });
}

// ─── Session status ──────────────────────────────────────────

export type SessionStatus = "open" | "pre" | "post" | "closed" | "weekend" | "always-on";

/** Compute exchange session status from local hours + weekday. */
export function sessionStatus(loc: MarketLocation, now: Date = new Date()): SessionStatus {
  if (loc.alwaysOn) return "always-on";
  if (loc.openHours === undefined || loc.tzOffset === undefined) return "closed";

  // Local time at the exchange
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const local = new Date(utcMs + loc.tzOffset * 3_600_000);
  const dow = local.getUTCDay();           // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return "weekend";

  const h = local.getUTCHours() + local.getUTCMinutes() / 60;
  const { open, close } = loc.openHours;
  if (h >= open && h <= close) return "open";
  if (h >= open - 0.5 && h < open) return "pre";
  if (h > close && h <= close + 0.5) return "post";
  return "closed";
}

export const SESSION_COLOR: Record<SessionStatus, string> = {
  "open":      "var(--bull)",
  "pre":       "var(--caution)",
  "post":      "var(--caution)",
  "closed":    "var(--dim)",
  "weekend":   "var(--dim)",
  "always-on": "var(--braun-yellow, #ffd000)",
};

export const SESSION_LABEL: Record<SessionStatus, string> = {
  "open":      "open",
  "pre":       "pre-mkt",
  "post":      "post-mkt",
  "closed":    "closed",
  "weekend":   "weekend",
  "always-on": "24h",
};

// ─── Vibe classifier ─────────────────────────────────────────

export type Vibe = "euphoria" | "bullish" | "cautious" | "bearish" | "panic" | "closed";

export function vibeOf(pct: number | null): Vibe {
  if (pct === null) return "closed";
  if (pct >=  1.5)  return "euphoria";
  if (pct >=  0.5)  return "bullish";
  if (pct >= -0.5)  return "cautious";
  if (pct >= -1.5)  return "bearish";
  return "panic";
}

export const VIBE_COLOR: Record<Vibe, string> = {
  euphoria: "var(--bull)",
  bullish:  "var(--bull)",
  cautious: "var(--caution)",
  bearish:  "#ff7a6e",
  panic:    "var(--bear)",
  closed:   "var(--dim)",
};

export const VIBE_LABEL: Record<Vibe, string> = {
  euphoria: "euphoria",
  bullish:  "bullish",
  cautious: "cautious",
  bearish:  "bearish",
  panic:    "panic",
  closed:   "closed",
};

// Text sizes per tier (label + percentage)
export const TIER_SIZE: Record<SizeTier, { label: number; pct: number; dot: number }> = {
  1: { label: 13, pct: 17, dot: 6.5 },
  2: { label: 11, pct: 14, dot: 5.5 },
  3: { label: 10, pct: 12, dot: 4.5 },
  4: { label:  9, pct: 10, dot: 3.5 },
};

export const LAYER_LABEL: Record<Layer, string> = {
  EQUITY:      "Equities",
  COMMODITIES: "Commodities",
  FX:          "Currencies",
  RATES:       "Rates · Treasuries",
  VOL:         "Volatility",
  FLIGHTS:     "Military Flights",
};

export const LAYER_BADGE: Record<Layer, string> = {
  EQUITY:      "🌐",
  COMMODITIES: "⛓",
  FX:          "$",
  RATES:       "%",
  VOL:         "σ",
  FLIGHTS:     "✈",
};

// ─── History helpers — multi-timeframe % from daily closes ─────

export interface HistoryPoint { t: number; c: number }

export interface MultiTimeframe {
  d1: number | null;
  d5: number | null;
  mtd: number | null;
  ytd: number | null;
  high52: number | null;
  low52: number | null;
  pct52: number | null;     // percentile in 52w range
}

export function multiTimeframe(history: HistoryPoint[]): MultiTimeframe {
  if (history.length < 2) return { d1: null, d5: null, mtd: null, ytd: null, high52: null, low52: null, pct52: null };
  const sorted = [...history].sort((a, b) => a.t - b.t);
  const last = sorted[sorted.length - 1];
  const lastC = last.c;
  const lastDate = new Date(last.t);
  const monthStart = new Date(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), 1).getTime();
  const yearStart  = new Date(lastDate.getUTCFullYear(), 0, 1).getTime();

  const back = (n: number): number | null => {
    const idx = sorted.length - 1 - n;
    return idx >= 0 ? sorted[idx].c : null;
  };

  const sinceTs = (ts: number): number | null => {
    const p = sorted.find(x => x.t >= ts);
    return p ? p.c : null;
  };

  const d1Base  = back(1);
  const d5Base  = back(5);
  const mtdBase = sinceTs(monthStart);
  const ytdBase = sinceTs(yearStart);

  const closes = sorted.map(s => s.c);
  const high52 = Math.max(...closes);
  const low52  = Math.min(...closes);
  const pct52  = high52 > low52 ? ((lastC - low52) / (high52 - low52)) * 100 : 50;

  return {
    d1:  d1Base  ? ((lastC / d1Base)  - 1) * 100 : null,
    d5:  d5Base  ? ((lastC / d5Base)  - 1) * 100 : null,
    mtd: mtdBase ? ((lastC / mtdBase) - 1) * 100 : null,
    ytd: ytdBase ? ((lastC / ytdBase) - 1) * 100 : null,
    high52, low52, pct52,
  };
}

/** Render history into normalized [x, y] for SVG sparkline. */
export function sparklinePoints(history: HistoryPoint[], width: number, height: number): string {
  if (history.length < 2) return "";
  const closes = history.map(h => h.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  return history
    .map((p, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((p.c - min) / span) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}
