/**
 * /api/regime — Current + historical market regime classification.
 */

import { createClient } from "@supabase/supabase-js";

export const runtime    = "edge";
export const revalidate = 300;

export interface RegimeDay {
  date:          string;
  regime:        "bull" | "bear" | "ranging";
  bull_prob:     number;
  bear_prob:     number;
  ranging_prob:  number;
  set_return_5d?: number | null;
  set_vol_20d?:  number | null;
  vix?:          number | null;
}

export interface RegimeSummary {
  today:             RegimeDay;
  regime_counts_60d: Record<string, number>;
  history:           RegimeDay[];
  run_date:          string;
  note:              string;
}

// Demo data — realistic 60-day history
function buildFallback(): RegimeSummary {
  const today = new Date();
  const history: RegimeDay[] = [];
  const regimes: RegimeDay["regime"][] = ["bull", "ranging", "ranging", "bull", "bear", "ranging"];
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const pattern = regimes[Math.floor((60 - i) / 12) % regimes.length];
    const bull_p = pattern === "bull" ? 0.65 + Math.random() * 0.25 : pattern === "bear" ? 0.05 + Math.random() * 0.1 : 0.2 + Math.random() * 0.2;
    const bear_p = pattern === "bear" ? 0.6 + Math.random() * 0.25 : pattern === "bull" ? 0.05 + Math.random() * 0.08 : 0.15 + Math.random() * 0.15;
    const rang_p = Math.max(0, 1 - bull_p - bear_p);
    const regime: RegimeDay["regime"] = bull_p > bear_p && bull_p > rang_p ? "bull" : bear_p > rang_p ? "bear" : "ranging";
    history.push({
      date: d.toISOString().slice(0, 10),
      regime, bull_prob: Math.round(bull_p * 100) / 100,
      bear_prob: Math.round(bear_p * 100) / 100,
      ranging_prob: Math.round(rang_p * 100) / 100,
      set_vol_20d: 0.15 + Math.random() * 0.15,
      vix: 15 + Math.random() * 20,
    });
  }
  const todayRow = history[history.length - 1] ?? {
    date: today.toISOString().slice(0, 10),
    regime: "ranging" as const, bull_prob: 0.35, bear_prob: 0.25, ranging_prob: 0.40,
  };
  const counts = { bull: 0, bear: 0, ranging: 0 };
  history.forEach(h => { counts[h.regime] = (counts[h.regime] ?? 0) + 1; });
  return {
    today: todayRow,
    regime_counts_60d: counts,
    history,
    run_date: today.toISOString().slice(0, 10),
    note: "Demo data. Run: python3 ingestion/regime.py to populate with GMM classification.",
  };
}

async function fetchFromSupabase(): Promise<RegimeSummary | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("market_regimes")
      .select("date,regime,bull_prob,bear_prob,ranging_prob,set_return_5d,set_vol_20d,vix")
      .order("date", { ascending: false })
      .limit(252);

    if (error || !data?.length) return null;

    const history  = (data as RegimeDay[]).slice().reverse();
    const todayRow = data[0] as RegimeDay;

    const counts = { bull: 0, bear: 0, ranging: 0 };
    data.slice(0, 60).forEach((r: RegimeDay) => {
      counts[r.regime] = (counts[r.regime] ?? 0) + 1;
    });

    return {
      today: todayRow,
      regime_counts_60d: counts,
      history,
      run_date: data[0]?.date ?? "",
      note: "3-component GMM on SET returns, vol, VIX, THB. Weekly refit.",
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
