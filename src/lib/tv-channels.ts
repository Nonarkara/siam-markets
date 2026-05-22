/**
 * Curated financial-TV channel registry.
 * Single source of truth for the TV wall (`/newsroom`) and AI context route.
 * Each channel has a YouTube channel ID — the `/live_stream?channel=` embed
 * form auto-resolves to the currently-airing live broadcast, so we never
 * have to chase rotating video IDs.
 */

export interface TVChannel {
  id: string;
  name: string;
  flag: string;
  lang: "EN" | "TH" | "ZH" | "ME";
  region: string;
  focus: string;
  color: string;
  /** YouTube channel ID — used with /embed/live_stream?channel=… */
  channelId: string;
  /** Watch outside the embed (open in YouTube). */
  watchUrl: string;
  /** Time zone offset for the channel's HQ — used by AI program guess. */
  tzOffset: number;
  /** Rough weekday programming blocks at the channel's local time. */
  programming: { start: number; end: number; show: string }[];
}

export const TV_CHANNELS: TVChannel[] = [
  {
    id: "bloomberg",
    name: "Bloomberg TV",
    flag: "🇺🇸",
    lang: "EN",
    region: "US",
    focus: "Global markets · macro",
    color: "#ff6900",
    channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
    watchUrl: "https://www.youtube.com/@BloombergTV/live",
    tzOffset: -5,
    programming: [
      { start: 5,  end: 9,  show: "Bloomberg Surveillance · pre-market macro" },
      { start: 9,  end: 11, show: "Open Interest · US open" },
      { start: 11, end: 13, show: "Markets · midday equities" },
      { start: 13, end: 16, show: "Balance of Power · policy & rates" },
      { start: 16, end: 20, show: "Bloomberg Technology · after-hours" },
    ],
  },
  {
    id: "cnbc",
    name: "CNBC",
    flag: "🇺🇸",
    lang: "EN",
    region: "US",
    focus: "US equities · Fed · earnings",
    color: "#00c896",
    channelId: "UCvJJ_dzjViJCoLf5uKUTwoA",
    watchUrl: "https://www.youtube.com/@CNBC/live",
    tzOffset: -5,
    programming: [
      { start: 5,  end: 9,  show: "Squawk Box · pre-market" },
      { start: 9,  end: 11, show: "Squawk on the Street · opening bell" },
      { start: 11, end: 15, show: "Fast Money Halftime · midday" },
      { start: 15, end: 17, show: "Closing Bell · US close" },
      { start: 17, end: 21, show: "Mad Money · after-hours" },
    ],
  },
  {
    id: "yahoo",
    name: "Yahoo Finance",
    flag: "🇺🇸",
    lang: "EN",
    region: "US",
    focus: "Real-time commentary",
    color: "#007aff",
    channelId: "UCEAZeUIeJs0IjQiqTCdVSIg",
    watchUrl: "https://www.youtube.com/@YahooFinance/live",
    tzOffset: -5,
    programming: [
      { start: 7,  end: 9,  show: "Morning Brief · pre-market" },
      { start: 9,  end: 12, show: "The Opening Bid · open" },
      { start: 12, end: 16, show: "Yahoo Finance Live · midday" },
      { start: 16, end: 18, show: "Asking for a Trend · close wrap" },
    ],
  },
  {
    id: "dw",
    name: "DW News",
    flag: "🇩🇪",
    lang: "EN",
    region: "EU",
    focus: "European business · global",
    color: "#cc3333",
    channelId: "UCknLrEdhRCp1aegoMqRaCZg",
    watchUrl: "https://www.youtube.com/@dwnews/live",
    tzOffset: 1,
    programming: [
      { start: 6,  end: 10, show: "DW News Asia · Asian markets recap" },
      { start: 10, end: 14, show: "DW Business · EU open & ECB watch" },
      { start: 14, end: 18, show: "DW News · global headlines" },
      { start: 18, end: 23, show: "Made in Germany · industry" },
    ],
  },
  {
    id: "france24",
    name: "France 24",
    flag: "🇫🇷",
    lang: "EN",
    region: "EU",
    focus: "Europe · Africa · MENA",
    color: "#ffd000",
    channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
    watchUrl: "https://www.youtube.com/@FRANCE24English/live",
    tzOffset: 1,
    programming: [
      { start: 6,  end: 10, show: "France 24 Live · morning bulletin" },
      { start: 10, end: 14, show: "Business · EU markets" },
      { start: 14, end: 18, show: "Live · world news" },
      { start: 18, end: 22, show: "Africa News · emerging markets" },
    ],
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    flag: "🌐",
    lang: "EN",
    region: "ME",
    focus: "Geopolitics · oil · Asia",
    color: "#ff3b30",
    channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
    watchUrl: "https://www.youtube.com/@AlJazeeraEnglish/live",
    tzOffset: 3,
    programming: [
      { start: 6,  end: 10, show: "Newshour · MENA briefing" },
      { start: 10, end: 14, show: "Inside Story · geopolitics" },
      { start: 14, end: 18, show: "Counting the Cost · economy" },
      { start: 18, end: 22, show: "Newshour · evening edition" },
    ],
  },
  {
    id: "cna",
    name: "CNA",
    flag: "🇸🇬",
    lang: "EN",
    region: "ASIA",
    focus: "ASEAN · regional finance",
    color: "#00c896",
    channelId: "UCD8_zCzKn7v_uYwzKj0BlXg",
    watchUrl: "https://www.youtube.com/@cna/live",
    tzOffset: 8,
    programming: [
      { start: 6,  end: 9,  show: "Asia First · regional open" },
      { start: 9,  end: 12, show: "Asia Now · SGX, HSI, SET" },
      { start: 12, end: 16, show: "Money Mind · ASEAN markets" },
      { start: 16, end: 22, show: "World Tonight · global wrap" },
    ],
  },
  {
    id: "nhk",
    name: "NHK World",
    flag: "🇯🇵",
    lang: "EN",
    region: "ASIA",
    focus: "Japan · BOJ · yen carry",
    color: "#bd1f29",
    channelId: "UCSPEjw8F2nQDtmUKPFNF7_A",
    watchUrl: "https://www.youtube.com/@nhkworldjapan/live",
    tzOffset: 9,
    programming: [
      { start: 7,  end: 10, show: "NewsLine · Tokyo open" },
      { start: 10, end: 13, show: "Business · Nikkei midday" },
      { start: 13, end: 17, show: "NHK Newsline · Asia close" },
      { start: 17, end: 22, show: "Japan 2030 · industry & tech" },
    ],
  },
  {
    id: "money",
    name: "Money Channel",
    flag: "🇹🇭",
    lang: "TH",
    region: "TH",
    focus: "SET · กองทุน · นโยบาย ธปท.",
    color: "#ffd000",
    channelId: "UC_P_eClSd6nIYJFN_h7_lxA",
    watchUrl: "https://www.youtube.com/channel/UC_P_eClSd6nIYJFN_h7_lxA/live",
    tzOffset: 7,
    programming: [
      { start: 8,  end: 10, show: "Money Wake Up · SET pre-open" },
      { start: 10, end: 12, show: "Stock Gossip · SET morning" },
      { start: 12, end: 15, show: "Money Daily · กลางวัน" },
      { start: 15, end: 18, show: "Stock Wave · SET close" },
    ],
  },
  {
    id: "tnn",
    name: "TNN Thailand",
    flag: "🇹🇭",
    lang: "TH",
    region: "TH",
    focus: "ข่าวธุรกิจ · BOT · นโยบาย",
    color: "#ff5e00",
    channelId: "UCqUBA96OsqMgSFvTwLXY9yw",
    watchUrl: "https://www.youtube.com/channel/UCqUBA96OsqMgSFvTwLXY9yw/live",
    tzOffset: 7,
    programming: [
      { start: 6,  end: 9,  show: "เช้านี้ที่ TNN · ข่าวเช้า" },
      { start: 9,  end: 12, show: "TNN Wealth · ตลาดหุ้นไทย" },
      { start: 12, end: 18, show: "TNN News · ข่าวภาคเที่ยง" },
      { start: 18, end: 22, show: "TNN World · ข่าวต่างประเทศ" },
    ],
  },
  {
    id: "cgtn",
    name: "CGTN",
    flag: "🇨🇳",
    lang: "EN",
    region: "CN",
    focus: "China markets · 一带一路",
    color: "#ff3b30",
    channelId: "UCs9_O7yKLn8m4VbBQGbT0Aw",
    watchUrl: "https://www.youtube.com/@CGTN/live",
    tzOffset: 8,
    programming: [
      { start: 7,  end: 10, show: "Global Business · CSI300 open" },
      { start: 10, end: 14, show: "China 24 · midday markets" },
      { start: 14, end: 18, show: "World Today · close & policy" },
      { start: 18, end: 22, show: "Dialogue · macro & geopolitics" },
    ],
  },
];

/** Current local-time hour at a channel's HQ — used for programming guess. */
export function localHour(now: Date, tzOffset: number): number {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + tzOffset * 3_600_000).getUTCHours();
}

/** Find the currently-airing show at a channel given the wall-clock time. */
export function currentShow(channel: TVChannel, now: Date): string {
  const h = localHour(now, channel.tzOffset);
  const block = channel.programming.find(b => h >= b.start && h < b.end);
  return block?.show ?? "Rolling headlines · overnight loop";
}

export function getChannel(id: string): TVChannel | undefined {
  return TV_CHANNELS.find(c => c.id === id);
}
