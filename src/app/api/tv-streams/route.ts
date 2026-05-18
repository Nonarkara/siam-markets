/**
 * TV Streams API — fetches current live YouTube video IDs from each channel's /live page.
 * Returns the actual video ID so embeds never show a black screen.
 * Cached for 5 minutes (streams change infrequently).
 */

export const runtime = "edge";
export const revalidate = 300; // 5-minute cache

interface ChannelConfig {
  id: string;
  name: string;
  flag: string;
  lang: string;
  focus: string;
  color: string;
  // URL to scrape for current live video ID
  liveUrl: string;
  // Fallback: channel embed (used if live scrape fails)
  channelId?: string;
  // Direct link to watch outside embed
  watchUrl: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    id: "bloomberg",
    name: "Bloomberg TV",
    flag: "🇺🇸",
    lang: "EN",
    focus: "Global markets · macro · earnings",
    color: "var(--tech)",
    liveUrl: "https://www.youtube.com/@BloombergTV/live",
    channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
    watchUrl: "https://www.youtube.com/@BloombergTV/live",
  },
  {
    id: "yahoo",
    name: "Yahoo Finance",
    flag: "🇺🇸",
    lang: "EN",
    focus: "US equities · real-time commentary",
    color: "var(--bull)",
    liveUrl: "https://www.youtube.com/@YahooFinance/live",
    watchUrl: "https://www.youtube.com/@YahooFinance/live",
  },
  {
    id: "cnbc",
    name: "CNBC",
    flag: "🇺🇸",
    lang: "EN",
    focus: "US markets · Fed · earnings",
    color: "var(--caution)",
    liveUrl: "https://www.youtube.com/@CNBC/live",
    watchUrl: "https://www.youtube.com/@CNBC/live",
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    flag: "🌐",
    lang: "EN",
    focus: "Global news · geopolitics · Asia",
    color: "var(--bear)",
    liveUrl: "https://www.youtube.com/@AlJazeeraEnglish/live",
    watchUrl: "https://www.youtube.com/@AlJazeeraEnglish/live",
  },
  {
    id: "dw",
    name: "DW News",
    flag: "🇩🇪",
    lang: "EN",
    focus: "European markets · global business",
    color: "#cc3333",
    liveUrl: "https://www.youtube.com/@dwnews/live",
    watchUrl: "https://www.youtube.com/@dwnews/live",
  },
  {
    id: "trt",
    name: "TRT World",
    flag: "🌏",
    lang: "EN",
    focus: "ASEAN · Middle East · emerging markets",
    color: "var(--muted)",
    liveUrl: "https://www.youtube.com/@TRTWorld/live",
    watchUrl: "https://www.youtube.com/@TRTWorld/live",
  },
  {
    id: "money",
    name: "Money Channel",
    flag: "🇹🇭",
    lang: "TH",
    focus: "SET · Thai stocks · mutual funds",
    color: "#FFD700",
    liveUrl: "https://www.youtube.com/channel/UC_P_eClSd6nIYJFN_h7_lxA/live",
    channelId: "UC_P_eClSd6nIYJFN_h7_lxA",
    watchUrl: "https://www.youtube.com/channel/UC_P_eClSd6nIYJFN_h7_lxA/live",
  },
  {
    id: "tnn",
    name: "TNN Thailand",
    flag: "🇹🇭",
    lang: "TH",
    focus: "Thai news · BOT · policy",
    color: "#FFD700",
    liveUrl: "https://www.youtube.com/channel/UCqUBA96OsqMgSFvTwLXY9yw/live",
    channelId: "UCqUBA96OsqMgSFvTwLXY9yw",
    watchUrl: "https://www.youtube.com/channel/UCqUBA96OsqMgSFvTwLXY9yw/live",
  },
];

// Extract video ID from YouTube HTML
function extractVideoId(html: string): string | null {
  // Look for videoId in various JSON patterns
  const patterns = [
    /"videoId":"([a-zA-Z0-9_-]{11})"/,
    /\"videoId\":\"([a-zA-Z0-9_-]{11})\"/,
    /watch\?v=([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchVideoId(channel: ChannelConfig): Promise<string | null> {
  try {
    const res = await fetch(channel.liveUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiamMarkets/1.0)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      // Try channel embed fallback
      if (channel.channelId) return null; // will use channel embed
      return null;
    }
    const html = await res.text();
    return extractVideoId(html);
  } catch {
    return null;
  }
}

export interface StreamInfo {
  id: string;
  name: string;
  flag: string;
  lang: string;
  focus: string;
  color: string;
  videoId: string | null;       // null = use channelId embed or show offline
  channelId: string | undefined;
  watchUrl: string;
  isLive: boolean;
}

export async function GET() {
  const results = await Promise.all(
    CHANNELS.map(async (ch): Promise<StreamInfo> => {
      const videoId = await fetchVideoId(ch);
      return {
        id: ch.id,
        name: ch.name,
        flag: ch.flag,
        lang: ch.lang,
        focus: ch.focus,
        color: ch.color,
        videoId,
        channelId: ch.channelId,
        watchUrl: ch.watchUrl,
        isLive: !!videoId,
      };
    }),
  );

  return Response.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
