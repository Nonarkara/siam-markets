/**
 * User profile system — drives KPI selection, signal priority, layout density.
 * Three modes: Long-term Investor | Value Investor | Active Trader
 * Stored in localStorage. No login, no server.
 */

export type ProfileMode = "investor" | "value" | "trader";

export interface WatchlistItem {
  symbol: string;       // "KBANK.BK"
  name: string;         // "Kasikorn Bank"
  addedAt: string;      // ISO date
  notes?: string;
}

export interface KPITarget {
  key: string;
  label: string;
  target: number | null;
  unit: string;
  direction: "above" | "below" | "none";   // good when above/below target
}

export interface UserProfile {
  mode: ProfileMode;
  name: string;
  annualIncome: number;    // THB — for tax calc
  rmfAmount: number;       // current year contribution
  thaiEsgAmount: number;
  ssfAmount: number;
  accountSize: number;     // THB — for position sizing
  riskPerTrade: number;    // % — 0.01 = 1%
  watchlist: WatchlistItem[];
  kpiTargets: KPITarget[];
  setupComplete: boolean;
  updatedAt: string;
}

// ─── Defaults per mode ───────────────────────────────────────────

const INVESTOR_KPI_TARGETS: KPITarget[] = [
  { key: "tax_utilized",   label: "Tax Deduction Used",    target: 100,  unit: "%",      direction: "above" },
  { key: "vs_benchmark",   label: "vs SET Benchmark",      target: 0,    unit: "%",      direction: "above" },
  { key: "best_mos",       label: "Best Margin of Safety", target: 30,   unit: "%",      direction: "above" },
  { key: "fear_greed",     label: "Fear & Greed",          target: 25,   unit: "/100",   direction: "below" },
  { key: "set_pe",         label: "SET P/E vs Average",    target: 17.89, unit: "x",     direction: "below" },
];

const VALUE_KPI_TARGETS: KPITarget[] = [
  { key: "graham_stocks",  label: "Graham-Approved Stocks", target: 3,   unit: "stocks", direction: "above" },
  { key: "set_pe",         label: "SET P/E",                target: 15,  unit: "x",      direction: "below" },
  { key: "best_mos",       label: "Best MOS in Watchlist",  target: 30,  unit: "%",      direction: "above" },
  { key: "cape",           label: "US CAPE",                target: 30,  unit: "x",      direction: "below" },
  { key: "fear_greed",     label: "Fear & Greed",           target: 25,  unit: "/100",   direction: "below" },
];

const TRADER_KPI_TARGETS: KPITarget[] = [
  { key: "win_rate",       label: "Win Rate",       target: 55,   unit: "%",    direction: "above" },
  { key: "profit_factor",  label: "Profit Factor",  target: 1.5,  unit: "x",    direction: "above" },
  { key: "max_drawdown",   label: "Max Drawdown",   target: -5,   unit: "%",    direction: "above" },
  { key: "signal_conf",    label: "Top Signal",     target: 60,   unit: "/100", direction: "above" },
  { key: "regime",         label: "Market Regime",  target: null, unit: "",     direction: "none"  },
];

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "KBANK.BK", name: "Kasikorn Bank",   addedAt: new Date().toISOString() },
  { symbol: "PTT.BK",   name: "PTT",             addedAt: new Date().toISOString() },
  { symbol: "SCC.BK",   name: "Siam Cement",     addedAt: new Date().toISOString() },
];

export function defaultProfile(mode: ProfileMode): UserProfile {
  const kpiTargets = mode === "trader"
    ? TRADER_KPI_TARGETS
    : mode === "value"
    ? VALUE_KPI_TARGETS
    : INVESTOR_KPI_TARGETS;

  return {
    mode,
    name: "",
    annualIncome: 1_000_000,
    rmfAmount: 200_000,
    thaiEsgAmount: 100_000,
    ssfAmount: 0,
    accountSize: 500_000,
    riskPerTrade: 0.01,
    watchlist: DEFAULT_WATCHLIST,
    kpiTargets,
    setupComplete: false,
    updatedAt: new Date().toISOString(),
  };
}

// ─── localStorage helpers ─────────────────────────────────────────

const STORAGE_KEY = "siam_markets_profile";

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...profile,
    updatedAt: new Date().toISOString(),
  }));
}

export function updateWatchlist(items: WatchlistItem[]): void {
  const profile = loadProfile();
  if (!profile) return;
  saveProfile({ ...profile, watchlist: items });
}

// ─── KPI value calculation helpers ───────────────────────────────

export interface KPIValue {
  key: string;
  label: string;
  value: number | string;
  displayValue: string;
  subtext: string;
  status: "good" | "warn" | "bad" | "neutral";
  target: number | null;
  unit: string;
}

export function kpiStatus(
  value: number,
  target: number | null,
  direction: "above" | "below" | "none",
): "good" | "warn" | "bad" | "neutral" {
  if (direction === "none" || target === null) return "neutral";
  const margin = Math.abs(value - target);
  if (direction === "above") {
    if (value >= target) return "good";
    if (value >= target * 0.8) return "warn";
    return "bad";
  }
  // direction === "below" — good when value < target
  if (value <= target) return "good";
  if (value <= target * 1.2) return "warn";
  return "bad";
}

export function statusColor(status: "good" | "warn" | "bad" | "neutral"): string {
  switch (status) {
    case "good":    return "var(--bull)";
    case "warn":    return "var(--caution)";
    case "bad":     return "var(--bear)";
    case "neutral": return "var(--muted)";
  }
}

export function statusIcon(status: "good" | "warn" | "bad" | "neutral"): string {
  switch (status) {
    case "good":    return "✓";
    case "warn":    return "△";
    case "bad":     return "✗";
    case "neutral": return "·";
  }
}
