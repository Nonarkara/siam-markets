/**
 * Macro release calendar — this week's high-impact events.
 * Manually curated; refresh weekly. Times are in event local time.
 */

export interface MacroEvent {
  date: string;            // ISO YYYY-MM-DD
  time: string;            // local time + tz, e.g. "14:00 ET"
  country: string;
  flag: string;
  event: string;
  impact: "high" | "med" | "low";
  consensus?: string;
  prior?: string;
}

export const MACRO_CALENDAR: MacroEvent[] = [
  { date: "2026-05-20", time: "08:30 ET",  country: "US",        flag: "🇺🇸", event: "Building Permits",     impact: "med",  consensus: "1.41M", prior: "1.40M" },
  { date: "2026-05-20", time: "11:30 CST", country: "China",     flag: "🇨🇳", event: "PBOC LPR Decision",    impact: "high", consensus: "3.05%", prior: "3.10%" },
  { date: "2026-05-20", time: "11:30 AEST",country: "Australia", flag: "🇦🇺", event: "RBA Rate Decision",    impact: "high", consensus: "3.60%", prior: "3.85%" },
  { date: "2026-05-21", time: "07:00 GMT", country: "UK",        flag: "🇬🇧", event: "CPI YoY",              impact: "high", consensus: "2.6%",  prior: "2.6%"  },
  { date: "2026-05-21", time: "08:50 JST", country: "Japan",     flag: "🇯🇵", event: "Trade Balance",        impact: "med",  consensus: "¥-560B", prior: "¥-545B" },
  { date: "2026-05-21", time: "14:00 ET",  country: "US",        flag: "🇺🇸", event: "FOMC Minutes",         impact: "high" },
  { date: "2026-05-22", time: "08:30 ET",  country: "US",        flag: "🇺🇸", event: "Initial Jobless Claims",impact: "med", consensus: "230K",  prior: "229K"  },
  { date: "2026-05-22", time: "10:00 CET", country: "EU",        flag: "🇪🇺", event: "Flash PMI Composite",  impact: "high", consensus: "50.4",  prior: "50.4"  },
  { date: "2026-05-22", time: "10:00 ET",  country: "US",        flag: "🇺🇸", event: "Existing Home Sales",  impact: "med" },
  { date: "2026-05-23", time: "08:30 JST", country: "Japan",     flag: "🇯🇵", event: "National CPI YoY",     impact: "high", consensus: "2.8%",  prior: "2.7%"  },
  { date: "2026-05-23", time: "10:00 ET",  country: "US",        flag: "🇺🇸", event: "New Home Sales",       impact: "med" },
  { date: "2026-05-26", time: "09:30 ICT", country: "Thailand",  flag: "🇹🇭", event: "Q1 GDP YoY",           impact: "high", consensus: "2.4%",  prior: "3.2%"  },
];

export function eventDaysUntil(date: string): number {
  return Math.round((Date.parse(date) - Date.now()) / 86_400_000);
}

export function impactColor(impact: MacroEvent["impact"]): string {
  return impact === "high" ? "var(--bear)" : impact === "med" ? "var(--caution)" : "var(--muted)";
}
