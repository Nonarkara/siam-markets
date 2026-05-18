/**
 * FRED — Federal Reserve Economic Data
 * 120 requests/minute · free API key required
 * https://fredaccount.stlouisfed.org/apikeys
 */

const BASE = "https://api.stlouisfed.org/fred/series/observations";

function apiKey(): string {
  return process.env.FRED_API_KEY ?? "";
}

interface FredObservation {
  date: string;
  value: string;
}

async function fetchSeries(seriesId: string, limit = 1): Promise<number | null> {
  try {
    const url = new URL(BASE);
    url.searchParams.set("series_id", seriesId);
    url.searchParams.set("api_key", apiKey());
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "desc");
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const json = (await res.json()) as { observations: FredObservation[] };
    const latest = json.observations?.[0];
    if (!latest || latest.value === ".") return null;
    return parseFloat(latest.value);
  } catch {
    return null;
  }
}

export interface MacroData {
  usFedFundsRate: number | null;   // FEDFUNDS
  usCpi: number | null;            // CPIAUCSL index level
  usUnemployment: number | null;   // UNRATE
  us10YTreasury: number | null;    // GS10
  usdIndex: number | null;         // DTWEXBGS
  // Enhanced indicators
  yieldCurveSpread: number | null; // T10Y2Y — pre-computed 10Y-2Y spread
  vix: number | null;              // VIXCLS — fear gauge
  consumerSentiment: number | null; // UMCSENT — Michigan Consumer Sentiment
  cfnai: number | null;            // CFNAI — Chicago Fed National Activity Index
}

export async function fetchMacro(): Promise<MacroData> {
  const [fedRate, cpi, unemp, treasury, usdIdx, t10y2y, vix, umcsent, cfnai] = await Promise.all([
    fetchSeries("FEDFUNDS"),
    fetchSeries("CPIAUCSL"),
    fetchSeries("UNRATE"),
    fetchSeries("GS10"),
    fetchSeries("DTWEXBGS"),
    fetchSeries("T10Y2Y"),     // yield curve spread (pre-computed)
    fetchSeries("VIXCLS"),     // VIX daily
    fetchSeries("UMCSENT"),    // U of Michigan consumer sentiment
    fetchSeries("CFNAI"),      // Chicago Fed National Activity Index
  ]);

  return {
    usFedFundsRate: fedRate,
    usCpi: cpi,
    usUnemployment: unemp,
    us10YTreasury: treasury,
    usdIndex: usdIdx,
    yieldCurveSpread: t10y2y,
    vix,
    consumerSentiment: umcsent,
    cfnai,
  };
}
