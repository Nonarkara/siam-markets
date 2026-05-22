/**
 * /api/breaks — Structural break dates in SET returns/volatility.
 * Annotated with GDELT events that preceded each break.
 */

import { createClient } from "@supabase/supabase-js";

export const runtime    = "edge";
export const revalidate = 3600;  // breaks change weekly

export interface BreakEvent {
  title:  string;
  source: string;
  date:   string;
  tone:   number;
  url:    string;
}

export interface StructuralBreak {
  break_date:       string;
  series:           string;
  break_series:     string;
  regime_before:    string;
  regime_after:     string;
  mean_before:      number | null;   // annualised return
  mean_after:       number | null;
  std_before:       number | null;   // annualised vol
  std_after:        number | null;
  preceding_events: BreakEvent[];
  run_date:         string;
}

export interface BreaksSummary {
  run_date: string;
  breaks:   StructuralBreak[];
  count:    number;
  note:     string;
}

const FALLBACK: BreaksSummary = {
  run_date: "2026-05-19",
  count: 3,
  note: "Demo data. Run: python3 ingestion/breaks.py to populate with real ruptures analysis.",
  breaks: [
    {
      break_date: "2026-03-10", series: "SET", break_series: "volatility",
      regime_before: "bull", regime_after: "volatile",
      mean_before: 0.12, mean_after: -0.04, std_before: 0.14, std_after: 0.28,
      preceding_events: [
        { title: "US tariffs escalation roils Asian markets", source: "Reuters", date: "2026-03-08", tone: -3.2, url: "#" },
        { title: "Fed signals higher-for-longer rate path", source: "Bloomberg", date: "2026-03-07", tone: -2.1, url: "#" },
      ],
      run_date: "2026-05-19",
    },
    {
      break_date: "2025-09-18", series: "SET", break_series: "returns",
      regime_before: "ranging", regime_after: "bull",
      mean_before: 0.02, mean_after: 0.19, std_before: 0.18, std_after: 0.15,
      preceding_events: [
        { title: "BOT holds rate, signals easing bias", source: "Bangkok Post", date: "2025-09-15", tone: 2.4, url: "#" },
        { title: "China stimulus package boosts ASEAN sentiment", source: "FT", date: "2025-09-14", tone: 3.1, url: "#" },
      ],
      run_date: "2026-05-19",
    },
    {
      break_date: "2024-08-05", series: "SET", break_series: "volatility",
      regime_before: "ranging", regime_after: "bear",
      mean_before: 0.04, mean_after: -0.22, std_before: 0.16, std_after: 0.32,
      preceding_events: [
        { title: "Yen carry trade unwind sparks global selloff", source: "WSJ", date: "2024-08-02", tone: -5.8, url: "#" },
        { title: "US jobs data surprise triggers recession fears", source: "Reuters", date: "2024-08-02", tone: -4.2, url: "#" },
      ],
      run_date: "2026-05-19",
    },
  ],
};

async function fetchFromSupabase(): Promise<BreaksSummary | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("structural_breaks")
      .select("*")
      .order("break_date", { ascending: false })
      .limit(50);

    if (error || !data?.length) return null;

    return {
      run_date: data[0]?.run_date ?? new Date().toISOString().slice(0, 10),
      breaks:   data as StructuralBreak[],
      count:    data.length,
      note:     "Ruptures Pelt (rbf). GDELT events are correlational, not causal.",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const result = await fetchFromSupabase() ?? FALLBACK;
  return Response.json(result, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" },
  });
}
