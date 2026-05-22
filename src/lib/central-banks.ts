/**
 * Central bank policy rates — static reference data.
 * Used by the world-map RATES layer. Updated manually after FOMC /
 * ECB / BOJ / BOT meetings; ship a new snapshot when rates move.
 */

export interface CentralBank {
  id: string;
  bank: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  rate: number;             // current policy rate, %
  lastMove: string;         // ISO date of last move
  changeBps: number;        // bps of last move (+25 = hike, −25 = cut, 0 = hold)
  nextMeeting: string;      // ISO date of next meeting
  stance: "hawkish" | "neutral" | "dovish";
  highlight?: boolean;
}

export const CENTRAL_BANKS: CentralBank[] = [
  { id: "fed",   bank: "Federal Reserve",          country: "US",        flag: "🇺🇸", lat: 38.90, lon: -77.04, rate: 4.50, lastMove: "2026-03-19", changeBps: -25, nextMeeting: "2026-06-18", stance: "neutral" },
  { id: "ecb",   bank: "European Central Bank",    country: "EU",        flag: "🇪🇺", lat: 50.11, lon:   8.68, rate: 2.40, lastMove: "2026-04-17", changeBps: -25, nextMeeting: "2026-06-05", stance: "dovish"  },
  { id: "boe",   bank: "Bank of England",          country: "UK",        flag: "🇬🇧", lat: 51.51, lon:  -0.09, rate: 4.00, lastMove: "2026-03-20", changeBps: -25, nextMeeting: "2026-06-19", stance: "neutral" },
  { id: "boj",   bank: "Bank of Japan",            country: "Japan",     flag: "🇯🇵", lat: 35.69, lon: 139.77, rate: 0.50, lastMove: "2026-01-24", changeBps:  25, nextMeeting: "2026-06-13", stance: "hawkish" },
  { id: "pboc",  bank: "People's Bank of China",   country: "China",     flag: "🇨🇳", lat: 39.91, lon: 116.40, rate: 3.10, lastMove: "2026-04-15", changeBps: -10, nextMeeting: "2026-05-20", stance: "dovish"  },
  { id: "rbi",   bank: "Reserve Bank of India",    country: "India",     flag: "🇮🇳", lat: 19.08, lon:  72.88, rate: 6.00, lastMove: "2026-04-09", changeBps: -25, nextMeeting: "2026-06-06", stance: "neutral" },
  { id: "rba",   bank: "Reserve Bank of Australia",country: "Australia", flag: "🇦🇺", lat:-33.87, lon: 151.21, rate: 3.85, lastMove: "2026-04-01", changeBps: -25, nextMeeting: "2026-05-20", stance: "neutral" },
  { id: "bot",   bank: "Bank of Thailand",         country: "Thailand",  flag: "🇹🇭", lat: 13.76, lon: 100.50, rate: 2.00, lastMove: "2026-04-30", changeBps: -25, nextMeeting: "2026-06-25", stance: "dovish", highlight: true },
  { id: "bcb",   bank: "Banco Central do Brasil",  country: "Brazil",    flag: "🇧🇷", lat:-15.79, lon: -47.88, rate:14.75, lastMove: "2026-03-19", changeBps: 100, nextMeeting: "2026-05-07", stance: "hawkish" },
  { id: "mas",   bank: "MAS Singapore",            country: "Singapore", flag: "🇸🇬", lat:  1.29, lon: 103.85, rate: 3.30, lastMove: "2026-04-14", changeBps:   0, nextMeeting: "2026-07-29", stance: "neutral" },
  { id: "cbr",   bank: "Bank of Russia",           country: "Russia",    flag: "🇷🇺", lat: 55.76, lon:  37.62, rate:21.00, lastMove: "2026-04-25", changeBps:   0, nextMeeting: "2026-06-06", stance: "hawkish" },
  { id: "sama",  bank: "Saudi Central Bank",       country: "Saudi",     flag: "🇸🇦", lat: 24.71, lon:  46.68, rate: 4.50, lastMove: "2026-03-19", changeBps: -25, nextMeeting: "2026-06-18", stance: "neutral" },
];

export const STANCE_COLOR: Record<CentralBank["stance"], string> = {
  hawkish: "var(--bear)",
  neutral: "var(--caution)",
  dovish:  "var(--bull)",
};

export function moveLabel(b: CentralBank): string {
  if (b.changeBps === 0)  return `Hold @ ${b.rate.toFixed(2)}%`;
  if (b.changeBps > 0)    return `+${b.changeBps}bps hike`;
  return `${b.changeBps}bps cut`;
}

export function daysUntil(iso: string): number {
  return Math.round((Date.parse(iso) - Date.now()) / 86_400_000);
}
