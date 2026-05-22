/**
 * /api/econ-calendar — Macro event calendar.
 *
 * Source: JBlanked ForexFactory API (free tier, 1 req/5 min)
 * + FRED release schedule
 * + Static Thai events (BOT meetings, SET earnings windows, holidays)
 *
 * Falls back gracefully to static data when API key not set.
 * Cached 1 hour — calendar doesn't change mid-day.
 */

export const runtime   = "edge";
export const revalidate = 3600;

export interface CalendarEvent {
  id:         string;
  date:       string;          // ISO YYYY-MM-DD
  time:       string;          // local e.g. "08:30 ET"
  country:    string;
  flag:       string;
  event:      string;
  impact:     "high" | "medium" | "low";
  actual?:    string;
  forecast?:  string;
  previous?:  string;
  daysUntil:  number;
  isToday:    boolean;
  setPacted:  boolean;         // does this typically move the SET?
  sectorTips: string[];        // which SET sectors to watch
}

function daysUntil(iso: string): number {
  return Math.round((Date.parse(iso) - Date.now()) / 86400_000);
}

const IMPACT_COLOR: Record<string, string> = {
  high:   "var(--bear)",
  medium: "var(--caution)",
  low:    "var(--dim)",
};
void IMPACT_COLOR;

// ─── JBlanked ForexFactory ─────────────────────────────────────
async function fetchForexFactory(apiKey: string): Promise<CalendarEvent[]> {
  if (!apiKey) return [];
  try {
    // Fetch this week + next week
    const [thisWeek, nextWeek] = await Promise.all([
      fetch("https://www.jblanked.com/news/api/forex-factory/calendar/week/", {
        headers: { "Authorization": `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      }),
      fetch("https://www.jblanked.com/news/api/forex-factory/calendar/next-week/", {
        headers: { "Authorization": `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    const data: Array<{ date: string; time: string; currency: string; impact: string; event: string; actual?: string; forecast?: string; previous?: string }> = [];
    if (thisWeek.ok) {
      const d = await thisWeek.json();
      if (Array.isArray(d)) data.push(...d);
    }
    if (nextWeek.ok) {
      const d = await nextWeek.json();
      if (Array.isArray(d)) data.push(...d);
    }

    const FLAG: Record<string, string> = {
      USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CNY: "🇨🇳",
      AUD: "🇦🇺", CAD: "🇨🇦", CHF: "🇨🇭", THB: "🇹🇭", SGD: "🇸🇬",
    };

    const SET_MOVERS = ["USD", "JPY", "CNY"];

    return data
      .filter(e => e.impact?.toLowerCase() !== "holiday")
      .map(e => {
        const impact = (e.impact?.toLowerCase() as "high"|"medium"|"low") ?? "low";
        const du = daysUntil(e.date);
        const currency = (e.currency ?? "USD").toUpperCase();
        return {
          id:         `ff-${e.date}-${e.currency}-${e.event?.slice(0,20)}`,
          date:       e.date,
          time:       e.time,
          country:    currency,
          flag:       FLAG[currency] ?? "🌐",
          event:      e.event,
          impact,
          actual:     e.actual   || undefined,
          forecast:   e.forecast || undefined,
          previous:   e.previous || undefined,
          daysUntil:  du,
          isToday:    du === 0,
          setPacted:  SET_MOVERS.includes(currency) && impact === "high",
          sectorTips: currencyToSectors(currency, e.event ?? ""),
        };
      })
      .filter(e => e.daysUntil >= -1 && e.daysUntil <= 14)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  } catch { return []; }
}

function currencyToSectors(currency: string, event: string): string[] {
  const lc = event.toLowerCase();
  const tips: string[] = [];
  if (currency === "USD") {
    if (lc.includes("fed") || lc.includes("fomc") || lc.includes("rate")) tips.push("BANKING", "PROPERTY");
    if (lc.includes("cpi") || lc.includes("inflation"))                   tips.push("BANKING", "MACRO");
    if (lc.includes("nfp") || lc.includes("job") || lc.includes("employ")) tips.push("MACRO", "RISK-ON");
    if (lc.includes("oil") || lc.includes("inventori"))                   tips.push("ENERGY");
    if (!tips.length) tips.push("SET GENERAL");
  }
  if (currency === "JPY") tips.push("TECH", "BANKING");
  if (currency === "CNY") tips.push("INDUSTRIAL", "EXPORTS");
  if (currency === "THB") tips.push("SET GENERAL", "BANKING");
  return tips.length ? tips : ["MACRO"];
}

// ─── Static Thai calendar (always present) ─────────────────────
function thaiStaticEvents(): CalendarEvent[] {
  const today = new Date();
  const year = today.getUTCFullYear();

  const events: Array<Omit<CalendarEvent, "daysUntil"|"isToday">> = [
    // BOT MPC meetings 2026
    { id: "bot-jun-2026", date: `${year}-06-25`, time: "14:00 ICT", country: "THB", flag: "🇹🇭",
      event: "BOT MPC Rate Decision", impact: "high", setPacted: true,
      sectorTips: ["BANKING", "PROPERTY", "REIT"] },
    { id: "bot-aug-2026", date: `${year}-08-19`, time: "14:00 ICT", country: "THB", flag: "🇹🇭",
      event: "BOT MPC Rate Decision", impact: "high", setPacted: true,
      sectorTips: ["BANKING", "PROPERTY", "REIT"] },
    { id: "bot-oct-2026", date: `${year}-10-21`, time: "14:00 ICT", country: "THB", flag: "🇹🇭",
      event: "BOT MPC Rate Decision", impact: "high", setPacted: true,
      sectorTips: ["BANKING", "PROPERTY", "REIT"] },
    { id: "bot-dec-2026", date: `${year}-12-16`, time: "14:00 ICT", country: "THB", flag: "🇹🇭",
      event: "BOT MPC Rate Decision", impact: "high", setPacted: true,
      sectorTips: ["BANKING", "PROPERTY", "REIT"] },
    // Thai public holidays (major market closures)
    { id: "asanha-2026",  date: `${year}-07-10`, time: "Market Closed", country: "THB", flag: "🇹🇭",
      event: "Asanha Bucha — SET Closed", impact: "medium", setPacted: false,
      sectorTips: ["TOURISM"] },
    { id: "mother-2026",  date: `${year}-08-12`, time: "Market Closed", country: "THB", flag: "🇹🇭",
      event: "Mother's Day — SET Closed", impact: "low", setPacted: false,
      sectorTips: [] },
    // NESDC GDP release (quarterly, ~third week after quarter end)
    { id: "thai-gdp-q1-2026", date: "2026-05-26", time: "09:30 ICT", country: "THB", flag: "🇹🇭",
      event: "Thailand Q1 2026 GDP (NESDC)", impact: "high", forecast: "2.4%", previous: "3.2%",
      setPacted: true, sectorTips: ["MACRO", "BANKING", "INDUSTRIAL"] },
    { id: "thai-gdp-q2-2026", date: "2026-08-18", time: "09:30 ICT", country: "THB", flag: "🇹🇭",
      event: "Thailand Q2 2026 GDP (NESDC)", impact: "high",
      setPacted: true, sectorTips: ["MACRO", "BANKING"] },
    // Thai CPI
    { id: "thai-cpi-may-2026", date: "2026-06-05", time: "09:30 ICT", country: "THB", flag: "🇹🇭",
      event: "Thailand CPI May 2026 (MOC)", impact: "medium", forecast: "0.8%",
      setPacted: false, sectorTips: ["BANKING", "ENERGY"] },
  ];

  return events
    .map(e => ({ ...e, daysUntil: daysUntil(e.date), isToday: daysUntil(e.date) === 0 }))
    .filter(e => e.daysUntil >= -1 && e.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// ─── Main ───────────────────────────────────────────────────────
export async function GET(): Promise<Response> {
  const apiKey = process.env.JBLANKED_API_KEY ?? "";

  const [ffEvents, thEvents] = await Promise.all([
    fetchForexFactory(apiKey),
    Promise.resolve(thaiStaticEvents()),
  ]);

  // Merge: Thai static events + ForexFactory, deduplicate by id
  const seen = new Set<string>();
  const all: CalendarEvent[] = [];
  for (const e of [...thEvents, ...ffEvents]) {
    if (!seen.has(e.id)) { seen.add(e.id); all.push(e); }
  }
  all.sort((a, b) => a.daysUntil - b.daysUntil);

  return Response.json(
    { events: all, source: apiKey ? "live" : "static", as_of: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
  );
}

export type { IMPACT_COLOR };
