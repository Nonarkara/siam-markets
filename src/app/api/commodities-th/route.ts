/**
 * /api/commodities-th — Thai-relevant commodity prices.
 *
 * Fetches from Yahoo Finance (free, no key):
 *  CL=F   WTI Crude       → PTT, PTTEP, TOP, IRPC
 *  BZ=F   Brent Crude     → same
 *  NG=F   Natural Gas     → GULF, BGRIM, RATCH
 *  GC=F   Gold            → KBANK (gold loan), retail sentiment
 *  SB=F   Sugar #11       → KTIS, KTBS, KTBS, KSL (sugar stocks)
 *  ZC=F   Corn            → CPF, GFPT, TFG (feed cost)
 *  ZW=F   Wheat           → TFG, CPF
 *  ZS=F   Soybean         → CPF feed cost
 *  SI=F   Silver          → general risk appetite
 *  HG=F   Copper          → global growth / EEC industrial proxy
 *  BTC-USD Bitcoin        → global risk appetite
 *
 * From FRED (free, key required):
 *  PRUBAINDM  Natural rubber price Malaysia → STA, AJA
 *  PSUGAISAUSDM Sugar price               → KTIS, KSL
 *  PNGASJPUSDM LNG Asia                   → GULF, BGRIM
 *  PMAIZMTUSDM Corn price                 → CPF, GFPT
 *
 * Also: ENSO phase from NOAA ONI text file (no key).
 */

export const runtime   = "edge";
export const revalidate = 3600;

export interface CommodityItem {
  id:         string;
  name:       string;
  category:   "energy" | "agriculture" | "metals" | "crypto";
  unit:       string;
  price:      number | null;
  changePct:  number | null;
  color:      string;         // CSS variable
  setStocks:  string[];       // affected SET tickers
  signal:     string;         // plain English impact
  source:     "yahoo" | "fred" | "static";
  currency:   string;
}

const YAHOO_COMMODITIES = [
  { id: "wti",    sym: "CL=F",    name: "WTI Crude",    category: "energy",      unit: "USD/bbl", color: "var(--caution)",  stocks: ["PTT","PTTEP","TOP","IRPC"],           signal: "↑ = energy sector boost; airlines hurt" },
  { id: "brent",  sym: "BZ=F",    name: "Brent Crude",  category: "energy",      unit: "USD/bbl", color: "var(--caution)",  stocks: ["PTT","PTTEP"],                          signal: "Global benchmark; THB weak when oil high" },
  { id: "natgas", sym: "NG=F",    name: "Nat Gas",       category: "energy",      unit: "USD/MMBtu",color: "var(--tech)",   stocks: ["GULF","BGRIM","RATCH"],                 signal: "↑ = power gen cost up; GULF/BGRIM margin pressure" },
  { id: "gold",   sym: "GC=F",    name: "Gold",          category: "metals",      unit: "USD/oz",  color: "var(--braun-yellow,#ffd000)", stocks: ["KBANK"],                  signal: "Safe haven; inverse USD/THB pressure signal" },
  { id: "silver", sym: "SI=F",    name: "Silver",        category: "metals",      unit: "USD/oz",  color: "var(--muted)",   stocks: ["HANA","DELTA"],                        signal: "Industrial demand proxy; gold/silver ratio" },
  { id: "copper", sym: "HG=F",    name: "Copper",        category: "metals",      unit: "USD/lb",  color: "#b87333",         stocks: ["WHA","AMATA"],                         signal: "Global growth proxy; EEC industrial activity" },
  { id: "sugar",  sym: "SB=F",    name: "Sugar #11",     category: "agriculture", unit: "USc/lb",  color: "var(--bull)",    stocks: ["KTIS","KSL","KBS"],                     signal: "↑ = Thai sugar exporters (KTIS, KSL) revenue up" },
  { id: "corn",   sym: "ZC=F",    name: "Corn",          category: "agriculture", unit: "USc/bu",  color: "var(--caution)", stocks: ["CPF","GFPT","TFG"],                     signal: "↑ = animal feed cost up; CPF/GFPT margin pressure" },
  { id: "wheat",  sym: "ZW=F",    name: "Wheat",         category: "agriculture", unit: "USc/bu",  color: "var(--caution)", stocks: ["TFG","CPF"],                            signal: "Global food price signal; logistics (WICE)" },
  { id: "soy",    sym: "ZS=F",    name: "Soybean",       category: "agriculture", unit: "USc/bu",  color: "var(--muted)",   stocks: ["CPF","GFPT"],                           signal: "↑ = CPF feed cost rises; margins compress" },
  { id: "btc",    sym: "BTC-USD", name: "Bitcoin",       category: "crypto",      unit: "USD",     color: "#f7931a",         stocks: ["ADVANC","TRUE","GULF"],                signal: "Risk appetite indicator; inverse to VIX" },
] as const;

async function fetchYahooQuotes(): Promise<Map<string, { price: number; changePct: number }>> {
  const symbols = YAHOO_COMMODITIES.map(c => c.sym).join(",");
  const map = new Map<string, { price: number; changePct: number }>();
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&range=2d&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) return map;
    const data = await r.json() as {
      spark?: { result?: Array<{ symbol?: string; response?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number } }> }> };
    };
    for (const item of data.spark?.result ?? []) {
      const sym   = item.symbol ?? "";
      const meta  = item.response?.[0]?.meta;
      const price = meta?.regularMarketPrice ?? null;
      const prev  = meta?.previousClose ?? null;
      if (price !== null && prev !== null && prev !== 0) {
        map.set(sym, { price, changePct: ((price - prev) / prev) * 100 });
      }
    }
  } catch { /* return empty map */ }
  return map;
}

async function fetchFREDCommodity(series: string, fredKey: string): Promise<number | null> {
  if (!fredKey) return null;
  try {
    const r = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) return null;
    const d = await r.json() as { observations?: Array<{ value?: string }> };
    const v = d.observations?.[0]?.value;
    return v && v !== "." ? parseFloat(v) : null;
  } catch { return null; }
}

async function fetchENSO(): Promise<{ phase: string; oni: number | null; note: string }> {
  try {
    const r = await fetch("https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt", {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "DayTraders/1.0" },
    });
    if (!r.ok) return { phase: "unknown", oni: null, note: "NOAA ONI unavailable" };
    const text = await r.text();
    const lines = text.trim().split("\n");
    const last = lines[lines.length - 1].trim().split(/\s+/);
    const oni = last.length >= 4 ? parseFloat(last[last.length - 1]) : null;
    if (oni === null || isNaN(oni)) return { phase: "neutral", oni: null, note: "Could not parse ONI value" };

    let phase: string;
    if (oni >= 1.5)       phase = "Strong El Niño";
    else if (oni >= 0.5)  phase = "El Niño";
    else if (oni <= -1.5) phase = "Strong La Niña";
    else if (oni <= -0.5) phase = "La Niña";
    else                   phase = "Neutral";

    const note = oni >= 0.5
      ? `El Niño active (ONI ${oni}) — drought risk for Thailand sugar/rubber/rice. Watch KTIS, STA, CPF.`
      : oni <= -0.5
      ? `La Niña active (ONI ${oni}) — flood risk for Thai agriculture and industrial zones. Watch AMATA, WHA, KTIS.`
      : `ENSO neutral (ONI ${oni}) — no major seasonal weather bias expected.`;

    return { phase, oni, note };
  } catch { return { phase: "unknown", oni: null, note: "NOAA data unavailable" }; }
}

export async function GET(): Promise<Response> {
  const fredKey = process.env.FRED_API_KEY ?? "";

  const [quotes, rubberPrice, lngPrice, enso] = await Promise.all([
    fetchYahooQuotes(),
    fetchFREDCommodity("PRUBAINDM",   fredKey),  // rubber Malaysia
    fetchFREDCommodity("PNGASJPUSDM", fredKey),  // LNG Asia
    fetchENSO(),
  ]);

  const items: CommodityItem[] = YAHOO_COMMODITIES.map(c => {
    const q = quotes.get(c.sym);
    return {
      id:        c.id,
      name:      c.name,
      category:  c.category as CommodityItem["category"],
      unit:      c.unit,
      price:     q?.price     ?? null,
      changePct: q?.changePct ?? null,
      color:     c.color,
      setStocks: [...c.stocks],
      signal:    c.signal,
      source:    "yahoo" as const,
      currency:  "USD",
    };
  });

  // Append FRED items
  if (rubberPrice !== null) {
    items.push({
      id: "rubber", name: "Rubber TSR20 (MYR)", category: "agriculture",
      unit: "USc/kg", price: rubberPrice, changePct: null,
      color: "var(--bull)", setStocks: ["STA","AJA","TRUBB"],
      signal: "↑ = Thai rubber exporters benefit; TRUBB revenue up",
      source: "fred", currency: "USD",
    });
  }
  if (lngPrice !== null) {
    items.push({
      id: "lng_asia", name: "LNG Asia (JKM)", category: "energy",
      unit: "USD/MMBtu", price: lngPrice, changePct: null,
      color: "var(--tech)", setStocks: ["GULF","BGRIM"],
      signal: "↑ = GULF/BGRIM input cost rises; power margin pressure",
      source: "fred", currency: "USD",
    });
  }

  return Response.json(
    { items, enso, as_of: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
  );
}
