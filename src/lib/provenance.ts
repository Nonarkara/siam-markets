/**
 * provenance.ts — the single source of truth about every source of truth.
 *
 * A financial dashboard is only as trustworthy as its honesty about where the
 * numbers come from. This registry catalogs every data surface in the app and
 * its real status, so a user (or a future collaborator, human or model) can
 * tell at a glance what is live, what is a committed snapshot, what is an
 * honest illustration, and what is a synthetic placeholder.
 *
 * It exists to satisfy Dr Non's standing rule (§12.5, Reflexivity &
 * Statistical Skepticism): "every metric shows source, methodology, sample
 * size, last-updated, and one stated limitation." Rendered at /integrity.
 *
 * This file is intentionally hand-maintained, not generated — keeping it
 * honest is a deliberate act. When a data surface changes, update it here.
 */

export type ProvKind =
  | "live"          // fetched fresh from an upstream API on request (with cache)
  | "cached"        // committed JSON snapshot, produced offline by an ingestion script
  | "computed"      // calculated from real inputs (indicators, projections)
  | "illustrative"  // an honest model/baseline — a shape, not a promise
  | "reference"     // a historical fact or static reference figure
  | "mock"          // synthetic fallback so the app renders with no API keys
  | "pending"       // pipeline built and ready, awaiting credentials or data
  | "yours";        // the user's own real data, entered or imported

export interface DataSource {
  id: string;
  label: string;
  surface: string;       // where it shows up
  kind: ProvKind;
  source: string;        // upstream origin
  method: string;        // how it is produced
  engine?: string;       // the route or ingestion script behind it
  asOf?: string;         // freshness / cadence
  limitation: string;    // the one honest caveat
}

export const PROV_KIND_META: Record<ProvKind, { label: string; color: string; blurb: string }> = {
  live:         { label: "LIVE",         color: "var(--bull)",    blurb: "Fetched fresh from a public API on request, then edge-cached briefly." },
  cached:       { label: "CACHED",       color: "var(--tech)",    blurb: "A committed JSON snapshot produced offline by an ingestion script." },
  computed:     { label: "COMPUTED",     color: "var(--tech)",    blurb: "Calculated from real inputs — indicators, compounding, optimization." },
  illustrative: { label: "ILLUSTRATIVE", color: "var(--caution)", blurb: "An honest model or baseline. A shape to reason with, never a promise." },
  reference:    { label: "REFERENCE",    color: "var(--muted)",   blurb: "A historical fact or static reference figure." },
  mock:         { label: "MOCK",         color: "var(--dim)",     blurb: "Synthetic placeholder so the app renders with zero API keys. Never trade on it." },
  pending:      { label: "PENDING",      color: "var(--caution)", blurb: "Pipeline built and ready — awaiting credentials or the first data pull." },
  yours:        { label: "YOURS",        color: "var(--bull)",    blurb: "Your own real data, entered or imported. PII is scrubbed before it is stored." },
};

export const PROVENANCE_AS_OF = "2026-06-01";

export const DATA_SOURCES: DataSource[] = [
  // ── LIVE ────────────────────────────────────────────────────────────────
  { id: "feargreed", label: "Fear & Greed Index", surface: "DESK · Pulse", kind: "live",
    source: "feargreedchart.com", method: "Scraped composite, no key", engine: "/api/* + fetchFearGreed", asOf: "≈5 min",
    limitation: "Third-party composite; methodology is opaque and US-centric." },
  { id: "thb", label: "THB / USD", surface: "DESK · status strip", kind: "live",
    source: "Bank of Thailand API", method: "Official daily reference rate", engine: "fetchThbRate", asOf: "Daily",
    limitation: "Reference rate, not a tradable quote; lags intraday FX." },
  { id: "fred", label: "US macro — Fed rate, CPI, yields", surface: "DESK · Intel, /plan cycle", kind: "live",
    source: "FRED (St. Louis Fed)", method: "Official series via free API", engine: "/api/macro · fetchMacro", asOf: "Daily–monthly",
    limitation: "Official data is revised; release lag of days to weeks." },
  { id: "yahoo-idx", label: "Global & regional indices, assets", surface: "DESK, /markets", kind: "live",
    source: "Yahoo Finance (free tier)", method: "Quote + history fetch", engine: "fetchAllRegional / fetchAssetClasses", asOf: "≈15 min delayed",
    limitation: "Unofficial free feed; rate-limited, occasionally gappy." },
  { id: "gdelt", label: "World events & sentiment", surface: "/events, /newsroom", kind: "live",
    source: "GDELT DOC 2.0", method: "Event + tone query", engine: "/api/world-news · /api/events", asOf: "≈15 min",
    limitation: "Media-derived; correlation with prices is not causation." },
  { id: "econcal", label: "Economic calendar", surface: "DESK · Intel", kind: "live",
    source: "Public calendar feed", method: "Upcoming releases", engine: "/api/econ-calendar", asOf: "Hourly",
    limitation: "Consensus estimates shift; times are exchange-local." },
  { id: "regime", label: "Market regime classification", surface: "/regime, DESK", kind: "live",
    source: "Supabase regime table (← causal pipeline)", method: "Classifier over macro features; deterministic fallback summary when DB is unavailable", engine: "ingestion/regime.py · /api/regime", asOf: "Daily run",
    limitation: "A probabilistic label, not a verdict; falls back to a synthetic summary without the DB." },

  // ── CACHED (offline ingestion → committed JSON) ──────────────────────────
  { id: "ohlcv", label: "SET50 daily OHLCV", surface: "/trade, /scan, /api/technical", kind: "cached",
    source: "yfinance (.BK tickers)", method: "Daily ingest → prices.json, edge-imported", engine: "ingestion/prices.py · fetch_all_to_json.py", asOf: "Last ingest",
    limitation: "End-of-day only; refresh depends on running the cron." },
  { id: "alloc", label: "Efficient frontier & optimal weights", surface: "/portfolio · Optimizer", kind: "cached",
    source: "Riskfolio-Lib over 3y SET50 returns", method: "Mean-variance + HRP, Ledoit-Wolf cov → allocation.json", engine: "ingestion/optimize.py", asOf: "On run",
    limitation: "Optimizers trust their inputs blindly; a reference, not advice." },
  { id: "dreamhist", label: "Portfolio proxy history", surface: "/money · Mine vs Dream", kind: "cached",
    source: "yfinance proxy ETFs", method: "Daily proxy NAV → dream-history.json", engine: "ingestion/track_dream.py", asOf: "Last run",
    limitation: "Proxy approximates the fund's driver, not its exact NAV." },

  // ── COMPUTED ─────────────────────────────────────────────────────────────
  { id: "technical", label: "Technical indicators", surface: "/trade", kind: "computed",
    source: "SET50 OHLCV (above)", method: "EMA/RSI/MACD/BB/VWAP/ADX… computed in-app", engine: "src/lib/technical.ts · trade-insights.ts", asOf: "Per render",
    limitation: "Indicators describe the past; they do not predict it." },
  { id: "planmath", label: "Retirement projections", surface: "/plan", kind: "computed",
    source: "Your inputs (age, salary, savings)", method: "Monthly compounding + inflation + VUCA haircut", engine: "use-plan-state.ts", asOf: "Live",
    limitation: "Nominal assumptions; real life is not a smooth curve." },

  // ── ILLUSTRATIVE (honest models, not forecasts) ──────────────────────────
  { id: "forward", label: "Forward View — 90-day cones", surface: "/signals, /money hover", kind: "illustrative",
    source: "Real 1y proxy prices", method: "Drift + volatility cone (median + 10/90 band); upgrades to TimesFM on the M3", engine: "ingestion/forward_view.py", asOf: "On run",
    limitation: "A statistical range from past drift/vol — not a learned forecast yet." },
  { id: "dalio", label: "Dalio Big-Debt-Cycle stages", surface: "/signals web, /plan", kind: "illustrative",
    source: "Ray Dalio, Big Debt Crises (2018)", method: "Pattern match across ~16 historical cycles", engine: "CycleIntelligencePanel · plan-data", asOf: "Static framework",
    limitation: "Structure recognition, no fixed duration; not a market call." },
  { id: "setforecast", label: "SET 5-day forecast", surface: "DESK · forecast", kind: "illustrative",
    source: "SET history + macro covariates", method: "darts LightGBM (ARIMA fallback), 80/95% bands", engine: "ingestion/forecast.py", asOf: "Daily run",
    limitation: "Backtested accuracy varies by regime; bands are wide for a reason." },

  // ── REFERENCE ────────────────────────────────────────────────────────────
  { id: "world2024", label: "2024 world index returns", surface: "/plan", kind: "reference",
    source: "Published full-year 2024 figures", method: "Static reference table", engine: "plan/page WORLD_2024", asOf: "FY2024",
    limitation: "Historical context only; past returns ≠ future." },
  { id: "dream", label: "Dream · Ideal portfolio", surface: "/money · Mine vs Dream", kind: "reference",
    source: "Hindsight long-term allocation", method: "Educational scenario with real fund codes", engine: "portfolio-data.ts HOLDINGS", asOf: "Static",
    limitation: "Hindsight allocation — what one *could* have held, not a record." },

  // ── YOURS ────────────────────────────────────────────────────────────────
  { id: "mybook", label: "Example 1 · your real book", surface: "/money · Mine vs Dream", kind: "yours",
    source: "Fund SuperMart statement", method: "Holdings imported, PII scrubbed (no name/account/advisor)", engine: "portfolio-data.ts REAL_HOLDINGS", asOf: "30 May 2026",
    limitation: "A point-in-time statement; NAVs move daily." },

  // ── PENDING (built, awaiting auth/data) ──────────────────────────────────
  { id: "alphaearth", label: "Earth Signal — satellite alt-data", surface: "/signals", kind: "pending",
    source: "AlphaEarth Foundations (DeepMind) via Google Earth Engine", method: "64-dim embedding year-over-year shift over Thai economic sites → SET tickers", engine: "ingestion/alphaearth.py", asOf: "Awaiting GEE auth",
    limitation: "No numbers shown until real embeddings are pulled — never fabricated." },
  { id: "firebase", label: "Usage analytics", surface: "app-wide", kind: "pending",
    source: "Firebase / Firestore", method: "Page-view + trade events", engine: "lib/firebase · AnalyticsObserver", asOf: "Awaiting env keys",
    limitation: "Runs in harmless mock-key mode until NEXT_PUBLIC_FIREBASE_* is set." },

  // ── MOCK (honest synthetic fallbacks — flagged so they are never mistaken) ─
  { id: "mock-scan", label: "Scanner fundamentals", surface: "/scan", kind: "mock",
    source: "MOCK_STOCKS", method: "Synthetic Graham/Buffett metrics", engine: "/api/scanner (no Supabase)", asOf: "—",
    limitation: "Placeholder until the Supabase fundamentals feed is connected." },
  { id: "mock-pulse", label: "Pulse breadth / indices", surface: "DESK · Pulse fallback", kind: "mock",
    source: "MOCK_INDICES / MOCK_SET", method: "Synthetic breadth + index levels", engine: "/api/pulse", asOf: "—",
    limitation: "Fallback when the live feed is unavailable." },
  { id: "mock-mood", label: "Mr. Market Mood gauge", surface: "DESK + /money", kind: "mock",
    source: "Hardcoded signal set", method: "Six fixed signals (VIX 14.2, Fear&Greed 72, Buffett Indicator 227%, fwd P/E 28x, inverted curve, credit 3.2%) scored to a composite mood", engine: "MrMarketMood.tsx", asOf: "—",
    limitation: "Illustrative teaching values, not live readings — it carries Graham's lesson, not the latest tick. Wire to /api/macro + feargreed to make it live." },
  { id: "mock-gap", label: "Graham Diagnosis — portfolio autopsy", surface: "/money · Mine vs Dream", kind: "mock",
    source: "Hardcoded Dream-vs-Real comparison", method: "Five Graham checks (entry mood, P/E<15, diversification, Fear&Greed, defensive hedge) → 5/5 vs 0/5", engine: "DreamPortfolio.tsx GAP_ANALYSIS", asOf: "—",
    limitation: "Hand-set figures to teach Graham's margin-of-safety lesson — not measured from the live books." },
];

export function provenanceSummary() {
  const by: Partial<Record<ProvKind, number>> = {};
  for (const d of DATA_SOURCES) by[d.kind] = (by[d.kind] ?? 0) + 1;
  const real = DATA_SOURCES.filter(d => ["live", "cached", "computed", "yours"].includes(d.kind)).length;
  return { total: DATA_SOURCES.length, real, by };
}
