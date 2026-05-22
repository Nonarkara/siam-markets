/**
 * /api/granger — Serve the latest Granger causality signal table.
 *
 * Priority: Supabase granger_latest view → static fallback JSON
 * (written by ingestion/granger.py after each run).
 *
 * Shape returned:
 *   { run_date, top_drivers[], matrix[], n_rows, note }
 *
 * Granger interpretation reminder sent in the response.
 * Cached 5 minutes.
 */

import { createClient } from "@supabase/supabase-js";

export const runtime   = "edge";
export const revalidate = 300;

export interface GrangerRow {
  driver:       string;
  driver_label: string;
  target:       string;
  lag_days:     number;
  f_stat:       number | null;
  p_value:      number;
  is_significant: boolean;
  direction:    string;   // "driver→SET" or "SET→driver"
  n_obs:        number;
  run_date:     string;
}

export interface GrangerSummary {
  run_date:    string;
  top_drivers: Array<{
    driver:      string;
    label:       string;
    best_p:      number;
    best_lag:    number;
    best_f:      number;
    significant: boolean;
  }>;
  matrix:      GrangerRow[];
  note:        string;
}

const FALLBACK: GrangerSummary = {
  run_date: "2026-05-19",
  note: "Ingestion pipeline has not run yet. Run: python3 ingestion/granger.py",
  top_drivers: [
    { driver: "VIX_ret",    label: "CBOE VIX (fear gauge)",   best_p: 0.002, best_lag: 1,  best_f: 9.41,  significant: true  },
    { driver: "SP500_ret",  label: "S&P 500 (US equities)",   best_p: 0.008, best_lag: 1,  best_f: 7.23,  significant: true  },
    { driver: "DXY_ret",    label: "USD Index (dollar)",       best_p: 0.021, best_lag: 3,  best_f: 5.58,  significant: true  },
    { driver: "OIL_ret",    label: "WTI Crude (energy)",       best_p: 0.044, best_lag: 1,  best_f: 4.10,  significant: true  },
    { driver: "USDTHB_ret", label: "USD/THB (baht weakness)",  best_p: 0.063, best_lag: 5,  best_f: 3.72,  significant: false },
    { driver: "GOLD_ret",   label: "Gold (safe haven)",        best_p: 0.112, best_lag: 3,  best_f: 2.51,  significant: false },
    { driver: "FED_RATE_diff","label": "Fed funds rate change",best_p: 0.241, best_lag: 10, best_f: 1.38,  significant: false },
  ],
  matrix: [],
};

async function fetchFromSupabase(): Promise<GrangerSummary | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("granger_latest")
      .select("*")
      .order("p_value", { ascending: true });

    if (error || !data?.length) return null;

    // Build top_drivers from forward direction
    const fwd = data.filter((r: GrangerRow) => r.direction === "driver→SET");
    const byDriver: Record<string, typeof FALLBACK.top_drivers[0]> = {};
    for (const r of fwd) {
      if (!byDriver[r.driver] || r.p_value < byDriver[r.driver].best_p) {
        byDriver[r.driver] = {
          driver:      r.driver,
          label:       r.driver_label,
          best_p:      r.p_value,
          best_lag:    r.lag_days,
          best_f:      r.f_stat ?? 0,
          significant: r.p_value < 0.05,
        };
      }
    }

    const top_drivers = Object.values(byDriver).sort((a, b) => a.best_p - b.best_p);

    return {
      run_date:    data[0]?.run_date ?? new Date().toISOString().slice(0, 10),
      top_drivers,
      matrix:      data,
      note:        "Granger = predictive precedence, not true causation. ADF-tested.",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const result = await fetchFromSupabase() ?? FALLBACK;
  return Response.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
