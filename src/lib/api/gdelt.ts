/**
 * GDELT — Global Database of Events, Language, and Tone
 * Free, no API key. Updates every 15 minutes.
 * Using GDELT DOC 2.0 API for news article search + sentiment.
 */

import type { WorldEvent } from "../types";

const BASE = "https://api.gdeltproject.org/api/v2/doc/doc";

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;       // "20260517T143000Z"
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;  // "Thailand", "US", etc.
  tone?: string;          // tone score as string
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

function parseGdeltDate(seendate: string): string {
  // "20260517T143000Z" → ISO
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return new Date().toISOString();
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

const COUNTRY_CODES: Record<string, string> = {
  Thailand: "TH", "United States": "US", China: "CN", Japan: "JP",
  Indonesia: "ID", Malaysia: "MY", Singapore: "SG", Vietnam: "VN",
  Cambodia: "KH", Myanmar: "MM", Philippines: "PH", India: "IN",
  Russia: "RU", Germany: "DE", "United Kingdom": "GB", France: "FR",
  "South Korea": "KR", Taiwan: "TW", Australia: "AU", "Hong Kong": "HK",
};

function isoCode(country: string): string {
  return COUNTRY_CODES[country] ?? country.substring(0, 2).toUpperCase();
}

let cache: { events: WorldEvent[]; ts: number } | null = null;
const TTL = 15 * 60 * 1000;

export async function fetchWorldEvents(maxArticles = 20): Promise<WorldEvent[]> {
  if (cache && Date.now() - cache.ts < TTL) return cache.events;

  try {
    const params = new URLSearchParams({
      query: "(Thailand OR SET OR 'stock market' OR geopolitics) sourcelang:eng",
      mode: "artlist",
      maxrecords: String(maxArticles),
      format: "json",
      sort: "DateDesc",
    });

    const res = await fetch(`${BASE}?${params}`, {
      next: { revalidate: 900 },
    });

    if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);
    const json: GdeltResponse = await res.json();

    const events: WorldEvent[] = (json.articles ?? []).map((a, i) => ({
      id: `gdelt-${i}-${a.seendate}`,
      date: parseGdeltDate(a.seendate),
      headline: a.title,
      country: isoCode(a.sourcecountry),
      countryName: a.sourcecountry,
      sentiment: a.tone ? parseFloat(a.tone) / 100 : 0,
      setChangePct: null,   // enriched by API route from Supabase
      spxChangePct: null,
      source: a.domain,
      url: a.url,
    }));

    cache = { events, ts: Date.now() };
    return events;
  } catch {
    return [];
  }
}
