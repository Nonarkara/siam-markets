/**
 * Bank of Thailand API — official Thai monetary data
 * New portal: https://portal.api.bot.or.th
 * Keys: BOT_EXCHANGE_KEY, BOT_MONETARY_KEY, BOT_RATES_KEY
 * Note: each key must be subscribed to the relevant API product on the portal.
 * Fallback to open.er-api.com for THB/USD when BOT key not yet subscribed.
 */

import type { THBRate } from "../types";

const BASE = "https://portal.api.bot.or.th/api/v2";

interface BotResponse<T> {
  Meta: null | object;
  Status: "Success" | "Error";
  Result: T;
  Message?: string;
}

async function botFetch<T>(
  path: string,
  key: string,
  revalidate = 3600,
): Promise<T | null> {
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "X-IBM-Client-Id": key },
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json: BotResponse<T> = await res.json();
    if (json.Status === "Error") return null;
    return json.Result ?? null;
  } catch {
    return null;
  }
}

// ─── THB / USD exchange rate ──────────────────────────────────────

let exchangeCache: { data: THBRate; ts: number } | null = null;
const EXCHANGE_TTL = 30 * 60 * 1000;

export async function fetchThbRate(): Promise<THBRate> {
  if (exchangeCache && Date.now() - exchangeCache.ts < EXCHANGE_TTL) {
    return exchangeCache.data;
  }

  const key = process.env.BOT_EXCHANGE_KEY ?? "";
  const today = new Date().toISOString().split("T")[0];

  // Try BOT official API first
  type ExchangeRow = { currency_id: string; mid_rate: string };
  type ExchangeResult = { data: { data_detail: ExchangeRow[] } };
  const result = await botFetch<ExchangeResult>(
    `/Stat-ExchangeRate/v2/DAILY_AVG_EXG_RATE/?start_period=${today}&end_period=${today}`,
    key,
    1800,
  );

  const usdRow = result?.data?.data_detail?.find((r) => r.currency_id === "USD");
  if (usdRow?.mid_rate) {
    const data: THBRate = { usd: parseFloat(usdRow.mid_rate), updatedAt: new Date().toISOString() };
    exchangeCache = { data, ts: Date.now() };
    return data;
  }

  // Fallback: open exchange rates
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/THB", {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const usdPerThb = json?.rates?.USD;
      if (usdPerThb) {
        const data: THBRate = {
          usd: parseFloat((1 / usdPerThb).toFixed(2)),
          updatedAt: new Date().toISOString(),
        };
        exchangeCache = { data, ts: Date.now() };
        return data;
      }
    }
  } catch { /* ignore */ }

  return { usd: 33.5, updatedAt: new Date().toISOString() };
}

// ─── Thai monetary indicators (BOT_MONETARY_KEY) ─────────────────

export interface ThaiMonetary {
  policyRate: number | null;       // BOT policy interest rate %
  foreignReserves: number | null;  // USD billions
}

export async function fetchThaiMonetary(): Promise<ThaiMonetary> {
  const key = process.env.BOT_MONETARY_KEY ?? "";
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400_000).toISOString().split("T")[0];

  type PolicyRow = { period: string; value: string };
  type PolicyResult = { data: { data_detail: PolicyRow[] } };

  const [policy] = await Promise.all([
    botFetch<PolicyResult>(
      `/Stat-InterestRate/v2/POLICY_RATE/?start_period=${sixMonthsAgo}&end_period=${today}`,
      key,
      86400,
    ),
  ]);

  const rows = policy?.data?.data_detail ?? [];
  const latestRate = rows.length ? parseFloat(rows[rows.length - 1].value) : null;

  return {
    policyRate: latestRate,
    foreignReserves: null, // available via Stat-EconomicIndicator if subscribed
  };
}

// ─── Thai interest rates (BOT_RATES_KEY) ─────────────────────────

export interface ThaiRates {
  mlr: number | null;    // Minimum Lending Rate %
  mdr: number | null;    // Minimum Deposit Rate %
  fixedDeposit12m: number | null;
}

export async function fetchThaiRates(): Promise<ThaiRates> {
  const key = process.env.BOT_RATES_KEY ?? "";
  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400_000).toISOString().split("T")[0];

  type RateRow = { period: string; value: string };
  type RateResult = { data: { data_detail: RateRow[] } };

  const [mlrData, mdrData] = await Promise.all([
    botFetch<RateResult>(`/Stat-InterestRate/v2/MLR/?start_period=${sixMonthsAgo}&end_period=${today}`, key, 86400),
    botFetch<RateResult>(`/Stat-InterestRate/v2/MDR/?start_period=${sixMonthsAgo}&end_period=${today}`, key, 86400),
  ]);

  const latest = (rows: RateRow[] | undefined) =>
    rows?.length ? parseFloat(rows[rows.length - 1].value) : null;

  return {
    mlr: latest(mlrData?.data?.data_detail),
    mdr: latest(mdrData?.data?.data_detail),
    fixedDeposit12m: null, // available when subscribed
  };
}
