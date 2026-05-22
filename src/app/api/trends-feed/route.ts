/**
 * Google Trends — Thailand daily trends, financial-domain filtered.
 * Uses the public (unofficial) `dailytrends` endpoint. Returns the top
 * searches in TH, with related queries, scored by traffic volume.
 *
 * Strips Google's `)]}',` SSE prefix before parsing. Caches 15 min.
 * Falls back to a hardcoded financial-domain example list if unavailable.
 */

export const runtime = "edge";
export const revalidate = 900;

export interface TrendItem {
  title: string;
  trafficLabel: string;       // e.g. "200K+"
  traffic: number;            // numeric estimate
  relatedQueries: string[];
  articleTitle?: string;
  articleSource?: string;
  url?: string;
  isFinancial: boolean;
}

const FINANCIAL_KEYWORDS = [
  // EN
  "stock", "stocks", "shares", "index", "market", "set", "ipo", "bond", "yield",
  "fed", "rate", "rates", "inflation", "cpi", "gdp", "earnings", "dividend",
  "thb", "baht", "currency", "forex", "bitcoin", "btc", "crypto", "gold", "oil",
  "ptt", "bank", "kbank", "scb", "bbl", "advanc", "airport", "cpall", "delta",
  // TH
  "หุ้น", "ตลาด", "ดอกเบี้ย", "เงินบาท", "ทอง", "น้ำมัน", "ลงทุน",
  "กองทุน", "rmf", "ssf", "บอนด์", "พันธบัตร", "บิตคอยน์", "เงินเฟ้อ",
];

function isFinancial(text: string): boolean {
  const t = text.toLowerCase();
  return FINANCIAL_KEYWORDS.some(k => t.includes(k));
}

function parseTrafficLabel(label: string): number {
  // "200K+" → 200000, "1M+" → 1000000
  const m = label.match(/(\d+(?:\.\d+)?)\s*([KkMm])?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const suffix = (m[2] ?? "").toUpperCase();
  if (suffix === "K") return n * 1_000;
  if (suffix === "M") return n * 1_000_000;
  return n;
}

function fallback(): TrendItem[] {
  return [
    { title: "SET Index", trafficLabel: "—", traffic: 0, relatedQueries: ["หุ้นไทย", "ตลาดหุ้น"], isFinancial: true },
    { title: "ค่าเงินบาท", trafficLabel: "—", traffic: 0, relatedQueries: ["thb usd", "อัตราแลกเปลี่ยน"], isFinancial: true },
    { title: "ราคาทอง", trafficLabel: "—", traffic: 0, relatedQueries: ["ทองคำ", "gold price"], isFinancial: true },
    { title: "Bitcoin", trafficLabel: "—", traffic: 0, relatedQueries: ["บิตคอยน์", "BTC"], isFinancial: true },
    { title: "ดอกเบี้ย ธปท.", trafficLabel: "—", traffic: 0, relatedQueries: ["bot rate", "policy rate"], isFinancial: true },
  ];
}

interface GTrend {
  title?: { query?: string };
  formattedTraffic?: string;
  relatedQueries?: Array<{ query?: string }>;
  articles?: Array<{ title?: string; source?: string; url?: string }>;
}

interface GTrendDay {
  trendingSearches?: GTrend[];
}

interface GTrendResp {
  default?: { trendingSearchesDays?: GTrendDay[] };
}

export async function GET() {
  try {
    const url = "https://trends.google.com/trends/api/dailytrends?hl=th&tz=-420&geo=TH&ns=15";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiamMarketsTrendsBot/1.0)",
        "Accept": "application/json",
        "Accept-Language": "th,en;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return Response.json(fallback(), {
        headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" },
      });
    }

    // Google prepends )]}', to defeat JSON hijacking — strip it
    const raw = await res.text();
    const json = raw.replace(/^\)\]\}',?\s*/, "");
    const parsed = JSON.parse(json) as GTrendResp;

    const day0 = parsed.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
    const items: TrendItem[] = day0.map(t => {
      const title = t.title?.query ?? "";
      const trafficLabel = t.formattedTraffic ?? "—";
      const related = (t.relatedQueries ?? []).map(r => r.query ?? "").filter(Boolean).slice(0, 4);
      const art = t.articles?.[0];
      return {
        title,
        trafficLabel,
        traffic: parseTrafficLabel(trafficLabel),
        relatedQueries: related,
        articleTitle: art?.title,
        articleSource: art?.source,
        url: art?.url,
        isFinancial: isFinancial(title + " " + related.join(" ")),
      };
    }).filter(t => t.title);

    // Surface financial first, then by traffic
    items.sort((a, b) => {
      if (a.isFinancial !== b.isFinancial) return a.isFinancial ? -1 : 1;
      return b.traffic - a.traffic;
    });

    const out = items.slice(0, 20);
    return Response.json(out.length ? out : fallback(), {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" },
    });
  } catch {
    return Response.json(fallback(), {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" },
    });
  }
}
