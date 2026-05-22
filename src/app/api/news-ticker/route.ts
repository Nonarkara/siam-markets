/**
 * /api/news-ticker — Compact headline feed for the scrolling ticker.
 *
 * Returns only the top high-impact headlines, formatted for rapid rotation.
 * Sources: Finnhub + Marketaux (same keys as /api/world-news).
 * Cache: 60 seconds — ticker rotates, data doesn't need to be ultra-fresh.
 */

export const runtime   = "edge";
export const revalidate = 60;

interface TickerItem {
  id:     string;
  text:   string;
  source: string;
  impact: "bull" | "bear" | "neutral";
  time:   string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (isNaN(diff) || diff < 0) return "now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

function classifyImpact(title: string, sentiment?: number): "bull" | "bear" | "neutral" {
  const t = title.toLowerCase();
  const bearish = ["crash", "fall", "drop", "plunge", "sell-off", "recession", "crisis", "war", "sanction", "invasion", "default", "bankruptcy", "cut", "hike", "inflation"];
  const bullish = ["surge", "rally", "rise", "gain", "bull", "record", "beat", "strong", "growth", "boom", "recovery", "deal", "merger", "ipo"];
  const bearScore = bearish.filter(w => t.includes(w)).length;
  const bullScore = bullish.filter(w => t.includes(w)).length;
  if (sentiment !== undefined) {
    if (sentiment > 0.2) return "bull";
    if (sentiment < -0.2) return "bear";
  }
  if (bearScore > bullScore) return "bear";
  if (bullScore > bearScore) return "bull";
  return "neutral";
}

async function fetchFinnhub(apiKey: string): Promise<TickerItem[]> {
  if (!apiKey) return [];
  try {
    const r = await fetch(`https://finnhub.io/api/v1/news?category=general&minId=0&token=${apiKey}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];
    const data = await r.json() as Array<{ headline: string; source: string; datetime: number; summary?: string }>;
    return (data || []).slice(0, 12).map(a => ({
      id:     `fh-${a.datetime}`,
      text:   a.headline,
      source: a.source || "Finnhub",
      impact: classifyImpact(a.headline),
      time:   timeAgo(new Date(a.datetime * 1000).toISOString()),
    }));
  } catch { return []; }
}

async function fetchMarketaux(apiKey: string): Promise<TickerItem[]> {
  if (!apiKey) return [];
  try {
    const r = await fetch(
      `https://api.marketaux.com/v1/news/all?countries=th&language=en,th&filter_entities=true&limit=8&api_token=${apiKey}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) return [];
    const data = await r.json() as { data?: Array<{ title: string; source: string; published_at: string; entities?: Array<{ sentiment_score?: number }> }> };
    return (data.data || []).map(a => {
      const sentiments = (a.entities || []).map(e => e.sentiment_score ?? 0).filter(Boolean);
      const sentiment = sentiments.length ? sentiments.reduce((s, v) => s + v, 0) / sentiments.length : undefined;
      return {
        id:     `ma-${btoa(a.title).slice(0, 12)}`,
        text:   a.title,
        source: a.source,
        impact: classifyImpact(a.title, sentiment),
        time:   timeAgo(a.published_at),
      };
    });
  } catch { return []; }
}

const STATIC_TICKER: TickerItem[] = [
  { id: "s1", text: "Fed signals potential rate pause in next meeting", source: "Bloomberg", impact: "bull", time: "2h" },
  { id: "s2", text: "China manufacturing PMI beats expectations at 50.8", source: "Reuters", impact: "bull", time: "3h" },
  { id: "s3", text: "Bank of Thailand holds policy rate at 2.50%", source: "BOT", impact: "neutral", time: "4h" },
  { id: "s4", text: "ECB hints at slower pace of rate cuts", source: "FT", impact: "bear", time: "5h" },
  { id: "s5", text: "BOJ ends negative interest rate policy", source: "Nikkei", impact: "bull", time: "6h" },
  { id: "s6", text: "SET index rebounds on foreign fund inflows", source: "Bangkok Post", impact: "bull", time: "1h" },
  { id: "s7", text: "US CPI comes in hotter than expected at 3.4%", source: "WSJ", impact: "bear", time: "30m" },
  { id: "s8", text: "Oil prices surge on Middle East supply concerns", source: "Reuters", impact: "bear", time: "45m" },
];

export async function GET(): Promise<Response> {
  const finnhubKey   = process.env.FINNHUB_API_KEY   ?? "";
  const marketauxKey = process.env.MARKETAUX_API_KEY ?? "";

  const [fh, ma] = await Promise.all([
    fetchFinnhub(finnhubKey),
    fetchMarketaux(marketauxKey),
  ]);

  const items = [...fh, ...ma];
  const final = items.length > 0 ? items.slice(0, 15) : STATIC_TICKER;

  const seen = new Set<string>();
  const deduped: TickerItem[] = [];
  for (const item of final) {
    const key = item.text.slice(0, 40);
    if (!seen.has(key)) { seen.add(key); deduped.push(item); }
  }

  return Response.json(
    { items: deduped, source: items.length > 0 ? "live" : "static", as_of: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } },
  );
}
