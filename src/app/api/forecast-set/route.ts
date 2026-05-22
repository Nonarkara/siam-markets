/**
 * /api/forecast-set — 5-day probabilistic SET forecast.
 */

import { createClient } from "@supabase/supabase-js";

export const runtime    = "edge";
export const revalidate = 300;

export interface ForecastRow {
  forecast_date: string;
  target_date:   string;
  predicted:     number;
  lower_80:      number;
  upper_80:      number;
  lower_95:      number;
  upper_95:      number;
  model:         string;
  covariates:    string[];
}

export interface ForecastSummary {
  run_date:    string;
  last_close:  number;
  rows:        ForecastRow[];
  model:       string;
  note:        string;
}

function buildFallback(): ForecastSummary {
  const today = new Date();
  const lastClose = 1515.0;    // approximate SET level as of 2026-05-19
  const rows: ForecastRow[] = [];
  let level = lastClose;
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    const drift = (Math.random() - 0.48) * 8;    // slight negative bias (demo)
    level += drift;
    const vol = 25;
    rows.push({
      forecast_date: today.toISOString().slice(0, 10),
      target_date:   d.toISOString().slice(0, 10),
      predicted:     Math.round(level * 100) / 100,
      lower_80:      Math.round((level - 1.28 * vol) * 100) / 100,
      upper_80:      Math.round((level + 1.28 * vol) * 100) / 100,
      lower_95:      Math.round((level - 1.96 * vol) * 100) / 100,
      upper_95:      Math.round((level + 1.96 * vol) * 100) / 100,
      model:         "demo",
      covariates:    [],
    });
  }
  return {
    run_date:   today.toISOString().slice(0, 10),
    last_close: lastClose,
    rows,
    model:      "demo",
    note:       "Demo forecast. Run: python3 ingestion/forecast.py to populate with darts/ARIMA.",
  };
}

async function fetchFromSupabase(): Promise<ForecastSummary | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const sb = createClient(url, key);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await sb
      .from("set_forecast")
      .select("*")
      .eq("forecast_date", today)
      .order("target_date", { ascending: true });

    if (error || !data?.length) return null;

    return {
      run_date:   today,
      last_close: 0,   // caller can augment from live quote
      rows:       data as ForecastRow[],
      model:      data[0]?.model ?? "unknown",
      note:       "Probabilistic forecast. 80% CI expected to contain outcome 80% of the time.",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const result = await fetchFromSupabase() ?? buildFallback();
  return Response.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
