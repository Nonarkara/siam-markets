/**
 * Multilingual financial news feed.
 * Aggregates Google News RSS searches across English, Thai, Chinese for
 * topics that matter to a Thai retail investor. Public, no API key.
 *
 * Caches for 10 minutes. Falls back gracefully if any single feed errors.
 */

export const runtime = "edge";
export const revalidate = 600;

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  lang: "EN" | "TH" | "ZH";
  url: string;
  publishedAt: string;
  topic: string;
}

interface FeedConfig {
  topic: string;
  lang: NewsItem["lang"];
  query: string;     // free-text query (URL-encoded later)
  hl: string;        // Google News interface language
  gl: string;        // geographic edition
  ceid: string;      // country edition ID
}

const FEEDS: FeedConfig[] = [
  // ── Thai market — English coverage ────────────────────────────────
  { topic: "SET Index",      lang: "EN", query: "SET Index Thailand stock",     hl: "en", gl: "TH", ceid: "TH:en" },
  { topic: "Bank of Thailand",lang: "EN", query: "Bank of Thailand policy rate", hl: "en", gl: "TH", ceid: "TH:en" },
  { topic: "Thai baht",      lang: "EN", query: "Thai baht THB currency",       hl: "en", gl: "TH", ceid: "TH:en" },
  // ── Thai market — Thai language ───────────────────────────────────
  { topic: "หุ้นไทย",         lang: "TH", query: "ตลาดหลักทรัพย์ SET หุ้นไทย",       hl: "th", gl: "TH", ceid: "TH:th" },
  { topic: "ธปท.",            lang: "TH", query: "ธนาคารแห่งประเทศไทย ดอกเบี้ย",      hl: "th", gl: "TH", ceid: "TH:th" },
  { topic: "ค่าเงินบาท",       lang: "TH", query: "ค่าเงินบาท อัตราแลกเปลี่ยน",         hl: "th", gl: "TH", ceid: "TH:th" },
  // ── Thai market — Chinese language ────────────────────────────────
  { topic: "泰国股市",        lang: "ZH", query: "泰国股市 SET指数",                    hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  { topic: "泰铢",            lang: "ZH", query: "泰铢 汇率",                          hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  // ── Global macro (affects Thai market via flows) ──────────────────
  { topic: "Fed Rates",       lang: "EN", query: "Federal Reserve interest rate",      hl: "en", gl: "US", ceid: "US:en" },
  { topic: "BOJ / Yen",       lang: "EN", query: "Bank of Japan yen carry trade",      hl: "en", gl: "JP", ceid: "JP:en" },
];

function gnewsUrl(f: FeedConfig): string {
  const q = encodeURIComponent(f.query);
  return `https://news.google.com/rss/search?q=${q}+when:1d&hl=${f.hl}&gl=${f.gl}&ceid=${f.ceid}`;
}

/** Crude but adequate XML item extractor. Avoids pulling in a parser. */
function parseRss(xml: string, max = 5): Array<{ title: string; link: string; pubDate: string; source: string }> {
  const items: Array<{ title: string; link: string; pubDate: string; source: string }> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && items.length < max) {
    const block = m[1];
    const title  = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] ?? "").trim();
    const link   = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "").trim();
    const pubDate= (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "").trim();
    const source = (block.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/)?.[1] ?? "").trim();
    if (title && link) items.push({ title, link, pubDate, source });
  }
  return items;
}

async function fetchFeed(f: FeedConfig): Promise<NewsItem[]> {
  try {
    const res = await fetch(gnewsUrl(f), {
      headers: { "User-Agent": "Mozilla/5.0 SiamMarketsNewsBot/1.0", "Accept": "application/rss+xml" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = parseRss(xml, 5);
    return parsed.map((it, i) => ({
      id: `${f.topic}-${i}-${Date.parse(it.pubDate) || i}`,
      title: it.title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
      source: it.source || f.topic,
      lang: f.lang,
      url: it.link,
      publishedAt: it.pubDate,
      topic: f.topic,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const all = results.flat();

  // Sort newest first
  all.sort((a, b) => {
    const ta = Date.parse(a.publishedAt) || 0;
    const tb = Date.parse(b.publishedAt) || 0;
    return tb - ta;
  });

  // Cap to 60 to keep payload light
  return Response.json(all.slice(0, 60), {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" },
  });
}
