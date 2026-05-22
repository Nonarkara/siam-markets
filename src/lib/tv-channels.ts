/**
 * Curated financial-TV channel registry.
 *
 * YouTube live_stream embeds auto-resolve to the current broadcast.
 * All channels tested for live availability.
 */

export interface TVChannel {
  id: string;
  name: string;
  flag: string;
  lang: "EN" | "TH" | "ZH";
  regionGroup: "AMERICAS" | "EUROPE" | "ASIA" | "OCEANIA" | "MIDDLE EAST" | "GLOBAL";
  focus: string;
  color: string;
  channelId: string;
  watchUrl: string;
  tzOffset: number;
}

export const TV_CHANNELS: TVChannel[] = [
  // ─── AMERICAS ─────────────────────────────────────────────────
  {
    id: "bloomberg", name: "Bloomberg TV", flag: "🇺🇸", lang: "EN",
    regionGroup: "AMERICAS", focus: "Global markets · macro", color: "#ff6900",
    channelId: "UC3NBv0VjWvy57ZxI__z2Tig", watchUrl: "https://www.youtube.com/@BloombergTV/live", tzOffset: -5,
  },
  {
    id: "cnbc", name: "CNBC", flag: "🇺🇸", lang: "EN",
    regionGroup: "AMERICAS", focus: "US equities · Fed · earnings", color: "#00c896",
    channelId: "UCXccaSBV9L_7kD1A1f7koRQ", watchUrl: "https://www.youtube.com/@CNBC/live", tzOffset: -5,
  },
  {
    id: "yahoo", name: "Yahoo Finance", flag: "🇺🇸", lang: "EN",
    regionGroup: "AMERICAS", focus: "Real-time commentary", color: "#007aff",
    channelId: "UCEAZeUIeJs0IjQiqTCdVSIg", watchUrl: "https://www.youtube.com/@YahooFinance/live", tzOffset: -5,
  },
  {
    id: "fox", name: "Fox Business", flag: "🇺🇸", lang: "EN",
    regionGroup: "AMERICAS", focus: "US business · politics", color: "#007aff",
    channelId: "UCZG8i7aNebUfH1Z-G9mYlZw", watchUrl: "https://www.youtube.com/@FoxBusiness/live", tzOffset: -5,
  },
  {
    id: "cheddar", name: "Cheddar News", flag: "🇺🇸", lang: "EN",
    regionGroup: "AMERICAS", focus: "Tech · startups · markets", color: "#ff5e00",
    channelId: "UC04KsGq3npibMube9oh0Vxw", watchUrl: "https://www.youtube.com/@CheddarNews/live", tzOffset: -5,
  },

  // ─── EUROPE ───────────────────────────────────────────────────
  {
    id: "dw", name: "DW News", flag: "🇩🇪", lang: "EN",
    regionGroup: "EUROPE", focus: "European business · global", color: "#cc3333",
    channelId: "UCknLrEdhRCp1aegoMqRaCZg", watchUrl: "https://www.youtube.com/@dwnews/live", tzOffset: 1,
  },
  {
    id: "france24", name: "France 24", flag: "🇫🇷", lang: "EN",
    regionGroup: "EUROPE", focus: "Europe · Africa · MENA", color: "#ffd000",
    channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", watchUrl: "https://www.youtube.com/@FRANCE24English/live", tzOffset: 1,
  },
  {
    id: "bbc", name: "BBC News", flag: "🇬🇧", lang: "EN",
    regionGroup: "EUROPE", focus: "UK · Commonwealth · world", color: "#cc3333",
    channelId: "UC16niRr50-MSBwiO3YDb3RA", watchUrl: "https://www.youtube.com/@BBCNews/live", tzOffset: 0,
  },
  {
    id: "skynews", name: "Sky News", flag: "🇬🇧", lang: "EN",
    regionGroup: "EUROPE", focus: "Breaking · UK · world", color: "#007aff",
    channelId: "UCoMdktPbSTixAyNGwb-UYkQ", watchUrl: "https://www.youtube.com/@SkyNews/live", tzOffset: 0,
  },
  {
    id: "euronews", name: "Euronews", flag: "🇪🇺", lang: "EN",
    regionGroup: "EUROPE", focus: "EU politics · markets", color: "#ffd000",
    channelId: "UCW2QcKZiU8aUGg4yxCIditg", watchUrl: "https://www.youtube.com/@euronews/live", tzOffset: 1,
  },

  // ─── ASIA ─────────────────────────────────────────────────────
  {
    id: "cna", name: "CNA", flag: "🇸🇬", lang: "EN",
    regionGroup: "ASIA", focus: "ASEAN · regional finance", color: "#00c896",
    channelId: "UCD8_zCzKn7v_uYwzKj0BlXg", watchUrl: "https://www.youtube.com/@cna/live", tzOffset: 8,
  },
  {
    id: "nhk", name: "NHK World", flag: "🇯🇵", lang: "EN",
    regionGroup: "ASIA", focus: "Japan · BOJ · yen carry", color: "#bd1f29",
    channelId: "UCSPEjw8F2nQDtmUKPFNF7_A", watchUrl: "https://www.youtube.com/@nhkworldjapan/live", tzOffset: 9,
  },
  {
    id: "cgtn", name: "CGTN", flag: "🇨🇳", lang: "EN",
    regionGroup: "ASIA", focus: "China markets · Belt & Road", color: "#ff3b30",
    channelId: "UCs9_O7yKLn8m4VbBQGbT0Aw", watchUrl: "https://www.youtube.com/@CGTN/live", tzOffset: 8,
  },
  {
    id: "wion", name: "WION", flag: "🇮🇳", lang: "EN",
    regionGroup: "ASIA", focus: "India · South Asia · geopolitics", color: "#cc3333",
    channelId: "UClCDGXL7RaOqCfC5q1iTeoA", watchUrl: "https://www.youtube.com/@WION/live", tzOffset: 5.5,
  },
  {
    id: "arirang", name: "Arirang", flag: "🇰🇷", lang: "EN",
    regionGroup: "ASIA", focus: "Korea · KOSPI · tech", color: "#007aff",
    channelId: "UCsU-I-vHLiaMfV_ceaYz5rQ", watchUrl: "https://www.youtube.com/@Arirang/live", tzOffset: 9,
  },
  {
    id: "money", name: "Money Channel", flag: "🇹🇭", lang: "TH",
    regionGroup: "ASIA", focus: "SET · funds · BOT policy", color: "#ffd000",
    channelId: "UC_P_eClSd6nIYJFN_h7_lxA", watchUrl: "https://www.youtube.com/channel/UC_P_eClSd6nIYJFN_h7_lxA/live", tzOffset: 7,
  },
  {
    id: "tnn", name: "TNN Thailand", flag: "🇹🇭", lang: "TH",
    regionGroup: "ASIA", focus: "Thai business · BOT · policy", color: "#ff5e00",
    channelId: "UCqUBA96OsqMgSFvTwLXY9yw", watchUrl: "https://www.youtube.com/channel/UCqUBA96OsqMgSFvTwLXY9yw/live", tzOffset: 7,
  },

  // ─── OCEANIA ──────────────────────────────────────────────────
  {
    id: "abcau", name: "ABC News", flag: "🇦🇺", lang: "EN",
    regionGroup: "OCEANIA", focus: "Australia · ASX · commodities", color: "#007aff",
    channelId: "UCVgO39Bk5sQ66a0Ia0mq2Cg", watchUrl: "https://www.youtube.com/@abcnewsaustralia/live", tzOffset: 10,
  },

  // ─── MIDDLE EAST ──────────────────────────────────────────────
  {
    id: "aljazeera", name: "Al Jazeera", flag: "🇶🇦", lang: "EN",
    regionGroup: "MIDDLE EAST", focus: "Geopolitics · oil · Asia", color: "#ff3b30",
    channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", watchUrl: "https://www.youtube.com/@AlJazeeraEnglish/live", tzOffset: 3,
  },
  {
    id: "trt", name: "TRT World", flag: "🇹🇷", lang: "EN",
    regionGroup: "MIDDLE EAST", focus: "Turkey · MENA · Eurasia", color: "#cc3333",
    channelId: "UC7fWeaAuUKf6LmwE42boA3g", watchUrl: "https://www.youtube.com/@trtworld/live", tzOffset: 3,
  },
];

export const REGION_GROUPS = ["AMERICAS", "EUROPE", "ASIA", "OCEANIA", "MIDDLE EAST"] as const;

export function getChannel(id: string): TVChannel | undefined {
  return TV_CHANNELS.find(c => c.id === id);
}

export function channelsByRegion(region: string): TVChannel[] {
  return TV_CHANNELS.filter(c => c.regionGroup === region);
}

/** Local hour at the channel's location */
export function localHour(now: Date, tzOffset: number): number {
  const utc = now.getUTCHours() + now.getUTCMinutes() / 60;
  let h = Math.floor(utc + tzOffset);
  while (h < 0) h += 24;
  while (h >= 24) h -= 24;
  return h;
}

/** Best guess at what's on air now, based on local time */
export function currentShow(_ch: TVChannel, now: Date): string {
  const h = localHour(now, _ch.tzOffset);
  if (h >= 6 && h < 9) return "Morning briefing";
  if (h >= 9 && h < 12) return "Market open coverage";
  if (h >= 12 && h < 14) return "Midday wrap";
  if (h >= 14 && h < 17) return "Afternoon session";
  if (h >= 17 && h < 20) return "Evening close";
  if (h >= 20 && h < 23) return "Overnight markets";
  return "Off-air / repeats";
}
