/**
 * /api/world-news — Multi-source global financial news hub.
 *
 * Sources (all free, no paid tier required):
 *  1. Finnhub market news  — company news + general market news (free API key)
 *  2. Marketaux            — entity-matched sentiment scores, multilingual (100/day free)
 *  3. GDELT DOC 2.0        — no key, 15-min cadence, Thai/ASEAN event search
 *  4. Bangkok Post Biz RSS — English, daily Thai market coverage
 *  5. Krungthep Turakij RSS— Thai-language, SET-specific
 *  6. Manager Online RSS   — Thai financial & SET news
 *  7. Reuters via GNews    — global macro + Thailand
 *  8. US State Dept Travel Advisory — Thailand level (JSON, free, no key)
 *  9. Al Jazeera RSS       — Asia/ASEAN geopolitical framing
 *
 * Each item gets:
 *  - source, lang, title, url, publishedAt
 *  - sentiment (where available from Marketaux/Finnhub)
 *  - sectors[] — which SET sectors this likely affects
 *  - impact: "high"|"medium"|"low" — based on keywords
 */

export const runtime   = "edge";
export const revalidate = 300; // 5 min cache

export interface NewsItem {
  id:          string;
  source:      string;
  lang:        "EN" | "TH" | "ZH" | "AR";
  title:       string;
  summary?:    string;
  url:         string;
  publishedAt: string;
  sentiment?:  number;       // -1 bearish … +1 bullish
  impact:      "high" | "medium" | "low";
  sectors:     string[];     // e.g. ["ENERGY","TOURISM"]
  tags:        string[];     // keywords extracted
}

// ─── Keyword→Sector mapping ────────────────────────────────────
const SECTOR_KEYWORDS: Array<{ sector: string; words: string[] }> = [
  { sector: "ENERGY",    words: ["oil","gas","crude","lng","energy","petroleum","opec","refin","ptt","pttep","gulf","bgrim","ratch","gpsc"] },
  { sector: "AGRICULTURE",words: ["rice","sugar","rubber","corn","wheat","soybean","palm","cassava","crop","harvest","drought","flood","farm","agri"] },
  { sector: "TOURISM",   words: ["tourism","tourist","hotel","resort","airline","airport","travel","visa","hospitality","centel","mint","erw","aot","thai airways","aaviaiton"] },
  { sector: "BANKING",   words: ["bank","interest rate","fed","monetary","credit","loan","debt","kbank","scb","bbl","bot","rate hike","rate cut","inflation","yield"] },
  { sector: "INDUSTRIAL",words: ["factory","manufacturing","industrial","eec","semiconductor","delta","hana","kce","supply chain","chip","export"] },
  { sector: "PROPERTY",  words: ["property","real estate","condo","housing","construction","reit","cpn","lh","spali","lph"] },
  { sector: "TECHNOLOGY",words: ["tech","ai","artificial intelligence","digital","cybersecurity","semiconductor","nasdaq","apple","nvidia","advanc","true"] },
  { sector: "COMMODITIES",words: ["gold","silver","copper","commodity","metal","iron ore","aluminum"] },
  { sector: "MACRO",     words: ["gdp","cpi","inflation","unemployment","trade war","tariff","sanction","sanctions","war","recession","growth","economy","central bank","policy","geopolit"] },
  { sector: "THAI MARKET",words: ["set index","thai stock","thailand","thai baht","thb","bot ","bangkok","asean"] },
];

const HIGH_IMPACT_WORDS = [
  "fed","rate hike","rate cut","fomc","cpi","nfp","gdp","recession","war","crisis",
  "sanction","invasion","election","coup","default","bankruptcy","crash","surge",
  "opec","oil price","fed funds","inflation data","earnings","ipo","merger","acquisition",
  "thai baht","bot rate","set index","economic data","interest rate decision"
];

function classifyItem(title: string, summary = ""): { impact: "high"|"medium"|"low"; sectors: string[]; tags: string[] } {
  const text = (title + " " + summary).toLowerCase();
  const sectors: string[] = [];
  const tags: string[] = [];

  for (const { sector, words } of SECTOR_KEYWORDS) {
    const matches = words.filter(w => text.includes(w));
    if (matches.length) {
      sectors.push(sector);
      tags.push(...matches.slice(0, 2));
    }
  }

  const highMatches = HIGH_IMPACT_WORDS.filter(w => text.includes(w));
  const impact = highMatches.length >= 2 ? "high" : highMatches.length === 1 ? "medium" : "low";

  return { impact, sectors: [...new Set(sectors)], tags: [...new Set(tags)] };
}

function makeId(source: string, title: string, date: string): string {
  return `${source}-${btoa(encodeURIComponent(title)).slice(0,12)}-${date.slice(0,10)}`;
}

// ─── Finnhub ────────────────────────────────────────────────────
async function fetchFinnhub(apiKey: string): Promise<NewsItem[]> {
  if (!apiKey) return [];
  try {
    const r = await fetch(`https://finnhub.io/api/v1/news?category=general&minId=0&token=${apiKey}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const data = await r.json() as Array<{ headline: string; summary: string; url: string; datetime: number; source: string }>;
    return (data || []).slice(0, 20).map(a => {
      const cls = classifyItem(a.headline, a.summary);
      return {
        id:          makeId("finnhub", a.headline, String(a.datetime)),
        source:      a.source || "Finnhub",
        lang:        "EN",
        title:       a.headline,
        summary:     a.summary?.slice(0, 200),
        url:         a.url,
        publishedAt: new Date(a.datetime * 1000).toISOString(),
        ...cls,
      };
    });
  } catch { return []; }
}

// ─── Marketaux ─────────────────────────────────────────────────
async function fetchMarketaux(apiKey: string): Promise<NewsItem[]> {
  if (!apiKey) return [];
  try {
    const r = await fetch(
      `https://api.marketaux.com/v1/news/all?countries=th&language=en,th&filter_entities=true&limit=10&api_token=${apiKey}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!r.ok) return [];
    const data = await r.json() as { data?: Array<{ title: string; description?: string; url: string; published_at: string; source: string; entities?: Array<{ sentiment_score?: number }> }> };
    return (data.data || []).map(a => {
      const cls = classifyItem(a.title, a.description);
      const sentiments = (a.entities || []).map(e => e.sentiment_score ?? 0).filter(Boolean);
      const sentiment = sentiments.length ? sentiments.reduce((s, v) => s + v, 0) / sentiments.length : undefined;
      return {
        id:          makeId("marketaux", a.title, a.published_at),
        source:      a.source,
        lang:        "EN",
        title:       a.title,
        summary:     a.description?.slice(0, 200),
        url:         a.url,
        publishedAt: a.published_at,
        sentiment,
        ...cls,
      };
    });
  } catch { return []; }
}

// ─── RSS parser (generic) ──────────────────────────────────────
async function fetchRSS(url: string, source: string, lang: NewsItem["lang"], max = 10): Promise<NewsItem[]> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "DayTraders-NewsBot/1.0", "Accept": "application/rss+xml,application/xml" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items: NewsItem[] = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null && items.length < max) {
      const block = m[1];
      const title   = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] ?? "").trim().replace(/&amp;/g, "&").replace(/&quot;/g, '"');
      const link    = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? block.match(/<guid>(https?[^\s<]*)<\/guid>/)?.[1] ?? "").trim();
      const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "").trim();
      if (!title || !link) continue;
      const cls = classifyItem(title);
      items.push({
        id:          makeId(source, title, pubDate),
        source,
        lang,
        title,
        url:         link,
        publishedAt: pubDate || new Date().toISOString(),
        ...cls,
      });
    }
    return items;
  } catch { return []; }
}

// ─── GDELT DOC 2.0 ─────────────────────────────────────────────
async function fetchGDELT(query: string): Promise<NewsItem[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encoded}&mode=artlist&maxrecords=15&format=json&sort=DateDesc`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const data = await r.json() as { articles?: Array<{ title: string; url: string; seendate: string; sourcecountry: string; domain: string; tone?: number }> };
    return (data.articles || []).map(a => {
      const cls = classifyItem(a.title);
      return {
        id:          makeId("gdelt", a.title, a.seendate),
        source:      a.domain || a.sourcecountry || "GDELT",
        lang:        "EN",
        title:       a.title,
        url:         a.url,
        publishedAt: a.seendate.length >= 8
          ? `${a.seendate.slice(0,4)}-${a.seendate.slice(4,6)}-${a.seendate.slice(6,8)}T${a.seendate.slice(9,11)||"00"}:00:00Z`
          : new Date().toISOString(),
        sentiment:   a.tone !== undefined ? Math.tanh(a.tone / 10) : undefined,
        ...cls,
      };
    });
  } catch { return []; }
}

// ─── US State Dept Travel Advisory ─────────────────────────────
async function fetchTravelAdvisory(): Promise<NewsItem | null> {
  try {
    const r = await fetch("https://travel.state.gov/content/dam/travelapi/tfa/TH.json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const data = await r.json() as { name?: string; advisoryText?: string; ca_id?: string; lastUpdated?: string; cautionLevel?: number; cautionText?: string };
    const level = data.cautionLevel ?? 0;
    const color = level >= 3 ? "var(--bear)" : level === 2 ? "var(--caution)" : "var(--bull)";
    return {
      id:          "state-dept-TH",
      source:      "US State Dept",
      lang:        "EN",
      title:       `Thailand Travel Advisory: Level ${level} — ${data.cautionText || "Monitor"}`,
      summary:     data.advisoryText?.slice(0, 300),
      url:         "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/thailand-travel-advisory.html",
      publishedAt: data.lastUpdated || new Date().toISOString(),
      impact:      level >= 3 ? "high" : "medium",
      sectors:     ["TOURISM"],
      tags:        ["travel advisory", "thailand", `level ${level}`],
    };
    void color;
  } catch { return null; }
}

// ─── Main ───────────────────────────────────────────────────────
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const finnhubKey   = process.env.FINNHUB_API_KEY    ?? "";
  const marketauxKey = process.env.MARKETAUX_API_KEY  ?? "";

  const [
    finnhub, marketaux,
    bkPost, ktbi, mgr, alJazeera,
    gdeltThai, gdeltMacro, gdeltSet,
    travelAdv,
  ] = await Promise.all([
    fetchFinnhub(finnhubKey),
    fetchMarketaux(marketauxKey),
    fetchRSS("https://www.bangkokpost.com/rss/data/business.xml",      "Bangkok Post",    "EN"),
    fetchRSS("https://www.bangkokbiznews.com/rss/feed/business",       "Krungthep Turakij","TH"),
    fetchRSS("https://www.mgronline.com/rss/StockMarket.xml",          "Manager Online",  "TH"),
    fetchRSS("https://www.aljazeera.com/xml/rss/all.xml",              "Al Jazeera",      "EN"),
    fetchGDELT("Thailand economy stock market baht SET OR \"Thai market\" OR \"Bank of Thailand\""),
    fetchGDELT("Federal Reserve OR FOMC OR inflation OR \"interest rate\" OR recession"),
    fetchGDELT("oil price crude OPEC energy Asia emerging markets"),
    fetchTravelAdvisory(),
  ]);

  // Merge and deduplicate by URL
  const raw = [
    ...finnhub, ...marketaux,
    ...bkPost, ...ktbi, ...mgr, ...alJazeera,
    ...gdeltThai, ...gdeltMacro, ...gdeltSet,
    ...(travelAdv ? [travelAdv] : []),
  ];

  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const item of raw) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      items.push(item);
    }
  }

  // Sort: high impact first, then by date
  items.sort((a, b) => {
    const impOrd = { high: 0, medium: 1, low: 2 };
    const io = impOrd[a.impact] - impOrd[b.impact];
    if (io !== 0) return io;
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  });

  // Topic filtering from query param
  const sector = searchParams.get("sector")?.toUpperCase();
  const lang   = searchParams.get("lang")?.toUpperCase();
  const filtered = items.filter(i =>
    (!sector || i.sectors.includes(sector)) &&
    (!lang   || i.lang === lang)
  );

  return Response.json(
    {
      items:      filtered.slice(0, 80),
      total:      filtered.length,
      sources:    [...new Set(filtered.map(i => i.source))].length,
      as_of:      new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } },
  );
}
