/**
 * /api/regime — Current + historical market regime classification.
 */

import { createClient } from "@supabase/supabase-js";
import {
  buildFallbackRegimeSummary,
  normalizeRegimeSummary,
  type RegimeDay,
  type RegimeKind,
  type RegimeSummary,
} from "@/lib/regime";

export type { RegimeDay, RegimeSummary } from "@/lib/regime";

export const runtime    = "edge";
export const revalidate = 300;

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

    const counts: Record<RegimeKind, number> = { bull: 0, bear: 0, ranging: 0 };
    data.slice(0, 60).forEach((r: RegimeDay) => {
      counts[r.regime] = (counts[r.regime] ?? 0) + 1;
    });

    return {
      today: todayRow,
      regime_counts_60d: counts,
      history,
      run_date: data[0]?.date ?? "",
      note: "3-component GMM on SET returns, vol, VIX, THB. Weekly refit.",
      source: "supabase",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const result = normalizeRegimeSummary(await fetchFromSupabase() ?? buildFallbackRegimeSummary());
  return Response.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
