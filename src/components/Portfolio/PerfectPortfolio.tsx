"use client";

/**
 * PerfectPortfolio — Cullen Roche's "Your Perfect Portfolio" framework
 * applied to a Thai retail investor.
 *
 * Five interactive sections:
 *
 *  1. DURATION MATCHER — input age / goal horizon / income type
 *     → temporal bucket allocation in Thai fund terms
 *
 *  2. GFAP BASELINE — the true market-cap-weighted global portfolio
 *     vs. the user's actual Phillip holdings
 *
 *  3. COUNTERCYCLICAL SIGNAL — current global stock/bond cap ratio
 *     vs. historical range; tilt arrow
 *
 *  4. RISK CONTRIBUTION — shows that a 60/40 sources ~85% volatility
 *     from the equity sleeve; risk parity view
 *
 *  5. BEHAVIORAL AUDIT — the four horsemen (Roche) + Thai-specific flag
 *
 * Roche's overriding maxim:
 *   "A suboptimal strategy you execute beats an optimal one you abandon."
 */

import { useState, useMemo } from "react";
import { HOLDINGS, computeSummary, allocationByScope } from "@/lib/portfolio-data";
import { Donut, DonutLegend } from "./Donut";

// ─── Types ────────────────────────────────────────────────────

interface BucketAlloc {
  label:      string;
  role:       string;
  horizon:    string;
  pct:        number;
  color:      string;
  thaiInstruments: string[];
  thaiFunds:       string[];
  why:        string;
}

// ─── GFAP (Global Financial Asset Portfolio) baseline ────────
// Market-cap weights as of mid-2026 (approx ~$110T equity / $130T bonds)
const GFAP_SLICES = [
  { key: "intl_bond",  label: "Intl Bonds",       pct: 33.2, color: "#4a8aff" },
  { key: "us_bond",    label: "US Bonds",          pct: 23.6, color: "#7ab0ff" },
  { key: "intl_eq",    label: "Intl Equities",     pct: 25.6, color: "#00c896" },
  { key: "us_eq",      label: "US Equities",       pct: 17.6, color: "#00a07a" },
];

// REIT is ~3-5% within the equity bucket — Roche often shows it rolled in

const GFAP_NOTE = "The only mathematically honest 'passive' starting point. " +
  "Any deviation is an active bet. Most investors should deviate — based on time horizon, not opinion.";

// ─── Temporal bucket calculator ──────────────────────────────

function calcBuckets(ageYears: number, goalYears: number, incomeStability: number): BucketAlloc[] {
  // Roche's temporal buckets weighted by goal horizon.
  // incomeStability 1-5: 1=volatile freelancer, 5=government pension.
  // Higher stability → implicit bond already in human capital → more equity tolerated.

  const stabilityBonus = (incomeStability - 3) * 3;  // -6 to +6 percentage points shift to equity

  // Raw bucket %s based on goal horizon
  let cash = 0, shortBond = 0, balanced = 0, equity = 0, insurance = 8;

  if (goalYears <= 3) {
    cash = 55; shortBond = 25; balanced = 12; equity = 0;
  } else if (goalYears <= 7) {
    cash = 15; shortBond = 30; balanced = 30; equity = 17;
  } else if (goalYears <= 15) {
    cash = 5; shortBond = 15; balanced = 35; equity = 37;
  } else {
    cash = 5; shortBond = 8; balanced = 20; equity = 59;
  }

  // Human capital adjustment
  equity   = Math.min(80, Math.max(0, equity   + stabilityBonus));
  balanced = Math.max(0, balanced - stabilityBonus / 2);

  // Age adjustment: if over 55 and goal ≤ 15yr, shift 10% from equity toward bond
  if (ageYears >= 55 && goalYears <= 15) {
    const shift = Math.min(equity, 10);
    equity -= shift;
    shortBond += shift;
  }

  insurance = 8;  // always ~8%
  // normalise to 100
  const total = cash + shortBond + balanced + equity + insurance;
  const norm = (v: number) => Math.round((v / total) * 100);

  return [
    {
      label: "CASH · T-BILLS",
      role:  "0–3 year liabilities",
      horizon: "0–3 yrs",
      pct:   norm(cash),
      color: "#6a8a8a",
      thaiInstruments: ["Money market fund", "Bank fixed deposit", "Savings bonds"],
      thaiFunds:       ["KFCASH-A", "MMGOVMF", "ABCSM"],
      why:   "Never put money in this bucket that you might need in 3 years into anything longer. BOT rate ~2% currently.",
    },
    {
      label: "SHORT BONDS",
      role:  "3–7 year goals",
      horizon: "3–7 yrs",
      pct:   norm(shortBond),
      color: "#4a8aff",
      thaiInstruments: ["Thai gov bond fund (2-5yr)", "Short-term fixed income RMF"],
      thaiFunds:       ["KFGBRANSSF (partial)", "KTB fixed income"],
      why:   "Predictable maturity beats yield maximisation. Duration 2–5 years so you can redeem near par on schedule.",
    },
    {
      label: "BALANCED (60/40)",
      role:  "7–15 year goals",
      horizon: "7–15 yrs",
      pct:   norm(balanced),
      color: "#ffd000",
      thaiInstruments: ["Balanced RMF", "Thai ESG balanced", "Multi-asset fund"],
      thaiFunds:       ["KFGBTHAIESG-A", "Balanced RMF from any major AMC"],
      why:   "Full market cycle exposure with bond ballast. Drawdowns are smaller — you're more likely to stay invested.",
    },
    {
      label: "GLOBAL EQUITY",
      role:  "15+ year wealth compounding",
      horizon: "15+ yrs",
      pct:   norm(equity),
      color: "#00c896",
      thaiInstruments: ["SSF global equity", "RMF equity (SET50 + global)", "FIF tech/semi"],
      thaiFunds:       ["SCBSEMI(A)", "KFGTECHRMF", "K-USA-A", "SCBS&P500(A)"],
      why:   "Time absorbs volatility. 70% global / 30% Thai domestic splits corrects ThaiESG home-country bias.",
    },
    {
      label: "INSURANCE",
      role:  "Unknowable tail risks",
      horizon: "Uncertain",
      pct:   insurance,
      color: "#d4a900",
      thaiInstruments: ["Thai REIT fund", "Gold ETF / RMF", "Inflation-linked bond"],
      thaiFunds:       ["SCBGOLDHRMF", "KFGOLDRMF", "TREIT", "IMPACT"],
      why:   "Not return-seeking. Protects against scenarios you can't price: baht collapse, energy shock, systemic bank stress.",
    },
  ];
}

// ─── Countercyclical signal ───────────────────────────────────
// Global equity market cap ~$110T, bond market ~$130T.
// Roche's GFAP equity share: historically 25–55%, current ~46%.
const EQUITY_CAP_PCT = 46;    // current approximate
const HIST_LOW       = 25;    // post-GFC trough
const HIST_HIGH      = 55;    // dot-com peak
const NEUTRAL_RANGE  = [38, 52] as const;

function cycleSignal(equityPct: number): { signal: string; color: string; action: string; strength: string } {
  if (equityPct > NEUTRAL_RANGE[1]) return {
    signal:   "TRIM EQUITY",
    color:    "var(--bear)",
    action:   "Stocks have boomed relative to bonds. Countercyclical → trim equity, add bonds.",
    strength: "Strong trim",
  };
  if (equityPct < NEUTRAL_RANGE[0]) return {
    signal:   "ADD EQUITY",
    color:    "var(--bull)",
    action:   "Stocks are depressed relative to bonds. Countercyclical → add equity, trim bonds.",
    strength: "Strong add",
  };
  return {
    signal:   "NEUTRAL",
    color:    "var(--caution)",
    action:   "Markets near long-run equilibrium. Hold target weights. No forced rebalance needed.",
    strength: "No tilt",
  };
}

// ─── Risk contribution ─────────────────────────────────────────
// Empirical: a standard 60/40 sources ~85% of its volatility from
// the 40% equity sleeve. Equity vol ~16%, bond vol ~5%.
function riskContribution(equityPct: number): { equityRisk: number; bondRisk: number } {
  const equityVol = 0.16;
  const bondVol   = 0.05;
  const eq = (equityPct / 100) * equityVol;
  const bd = ((100 - equityPct) / 100) * bondVol;
  const total = eq + bd;
  return {
    equityRisk: Math.round((eq / total) * 100),
    bondRisk:   Math.round((bd / total) * 100),
  };
}

// ─── Behavioural horsemen ─────────────────────────────────────

const HORSEMEN = [
  {
    id:      "recency",
    label:   "Recency Bias",
    desc:    "Do you assume recent winners will keep winning? (US tech, Bitcoin, Semiconductor funds...)",
    flag:    "You hold SCBSEMI(A) at +131%. Ask: is it still a hold at this price, or recency?",
    color:   "var(--bear)",
  },
  {
    id:      "loss_aversion",
    label:   "Loss Aversion",
    desc:    "Are you holding losers (KFSDIV2-L −30%, KFINDIARMF −22%) because selling feels like admitting failure?",
    flag:    "Losses hurt 2× more psychologically than gains feel good (Kahneman). Check the thesis, not the price.",
    color:   "var(--bear)",
  },
  {
    id:      "narrative",
    label:   "Narrative Investing",
    desc:    "Did you buy Vietnam or India funds because the story was compelling — not because of valuation?",
    flag:    "Compelling narratives are always available. Roche: \"the story was obvious, but the price was already efficient.\"",
    color:   "var(--caution)",
  },
  {
    id:      "fomo",
    label:   "FOMO",
    desc:    "Did you chase Semiconductor or Blockchain funds after seeing the 2025 returns?",
    flag:    "When everyone knows the story, the easy money is already made. SCBSEMI: entered 12/2024, after 80%+ run.",
    color:   "var(--caution)",
  },
  {
    id:      "thai_bias",
    label:   "Home Country Bias (Thai-specific)",
    desc:    "ThaiESG forces ≥80% Thai equity. Your portfolio has 25% in Thai ESG alone.",
    flag:    "Roche's GFAP: Thai equities should be ~1.5% of global equity — not 25%+ of total portfolio.",
    color:   "var(--bear)",
  },
];

// ─── Component ───────────────────────────────────────────────

export function PerfectPortfolio() {
  const [age, setAge]             = useState(38);
  const [goalYears, setGoalYears] = useState(20);
  const [stability, setStability] = useState(3);
  const [auditChecks, setAuditChecks] = useState<Record<string, boolean>>({});

  const buckets = useMemo(() => calcBuckets(age, goalYears, stability), [age, goalYears, stability]);
  const signal  = cycleSignal(EQUITY_CAP_PCT);

  // Derive user's current equity % from Phillip holdings
  const summary = useMemo(() => computeSummary(HOLDINGS), []);
  const scopeAlloc = useMemo(() => allocationByScope(HOLDINGS), []);
  // RMF + FIF are equity-heavy; SSF mixed; TESG mostly equity; LTF equity; GMF cash
  const equityLike = scopeAlloc.filter(s => ["RMF", "SSF", "FIF", "TESG", "LTF"].includes(s.key))
    .reduce((sum, s) => sum + s.pct, 0);
  const userEquityPct = Math.round(equityLike);
  const userRisk = riskContribution(userEquityPct);

  const toggleCheck = (id: string) => setAuditChecks(c => ({ ...c, [id]: !c[id] }));

  // For the bucket donut
  const bucketSlices = buckets.map(b => ({
    key: b.label, label: `${b.label} (${b.horizon})`,
    value: b.pct, pct: b.pct, color: b.color,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* ── Attribution ─────────────────────────────────────── */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--line)",
          borderLeft: "3px solid var(--tech)",
          padding: "12px 14px",
        }}
      >
        <div className="t-micro" style={{ color: "var(--tech)", letterSpacing: "0.14em", marginBottom: 4 }}>
          FRAMEWORK · CULLEN ROCHE · "YOUR PERFECT PORTFOLIO" (2021)
        </div>
        <div className="t-body" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
          The perfect portfolio is not the <em>optimal</em> portfolio — it is the <em>appropriate</em> one.
          The best allocation is the one you can actually execute without abandoning it during a crisis.
        </div>
        <div className="t-mono" style={{ fontSize: "0.75rem", color: "var(--caution)", marginTop: 8, fontStyle: "italic" }}>
          "A suboptimal strategy you execute beats an optimal one you abandon."
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 1. DURATION MATCHER                                      */}
      {/* ─────────────────────────────────────────────────────── */}
      <Section
        num="1"
        title="Duration Matcher"
        sub="Match instrument duration to your liability duration — Roche's core rule"
      >
        <div className="perfect-grid">
          {/* Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Slider
              label="Your age"
              value={age} min={18} max={70}
              onChange={setAge}
              display={`${age} years old`}
            />
            <Slider
              label="Years until you need this money"
              value={goalYears} min={1} max={35}
              onChange={setGoalYears}
              display={goalYears <= 3 ? `${goalYears}yr — short term` : goalYears <= 7 ? `${goalYears}yr — medium term` : goalYears <= 15 ? `${goalYears}yr — long term` : `${goalYears}yr — very long term`}
            />
            <div>
              <div className="t-micro" style={{ marginBottom: 6 }}>
                Income stability — 1 (freelancer / entrepreneur) · 5 (government pension / tenured)
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    onClick={() => setStability(v)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      background: stability === v ? "var(--tech-10)" : "var(--bg-surface)",
                      border: `1px solid ${stability === v ? "var(--tech)" : "var(--line)"}`,
                      color: stability === v ? "var(--tech)" : "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      minHeight: 36,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4 }}>
                Higher stability = more implicit bond in human capital → tolerate more equity
              </div>
            </div>
          </div>

          {/* Result donut + explanation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <Donut
                data={bucketSlices}
                size={140}
                thickness={24}
                center={
                  <div style={{ textAlign: "center" }}>
                    <div className="t-mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--bull)" }}>
                      {buckets.find(b => b.label === "GLOBAL EQUITY")?.pct ?? 0}%
                    </div>
                    <div className="t-micro" style={{ color: "var(--muted)" }}>EQUITY</div>
                  </div>
                }
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <DonutLegend data={bucketSlices} />
              </div>
            </div>
          </div>
        </div>

        {/* Bucket cards */}
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {buckets.map(b => (
            <div
              key={b.label}
              style={{
                display: "grid",
                gridTemplateColumns: "90px 50px 1fr",
                gap: 12,
                padding: "10px 12px",
                background: "var(--bg-surface)",
                border: "1px solid var(--line)",
                borderLeft: `3px solid ${b.color}`,
                alignItems: "start",
              }}
            >
              <div>
                <div className="t-mono" style={{ fontSize: "0.625rem", fontWeight: 700, color: b.color, letterSpacing: "0.1em" }}>
                  {b.label}
                </div>
                <div className="t-micro" style={{ marginTop: 2, color: "var(--muted)" }}>{b.horizon}</div>
              </div>
              <div className="t-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: b.color }}>
                {b.pct}%
              </div>
              <div>
                <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.5 }}>
                  {b.why}
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {b.thaiFunds.slice(0, 3).map(f => (
                    <span
                      key={f}
                      className="t-mono"
                      style={{
                        fontSize: "0.5625rem",
                        border: "1px solid var(--line)",
                        color: "var(--muted)",
                        padding: "1px 6px",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 2. GFAP BASELINE                                         */}
      {/* ─────────────────────────────────────────────────────── */}
      <Section
        num="2"
        title="The GFAP Baseline"
        sub="Global Financial Asset Portfolio — the only honest starting point"
      >
        <div className="perfect-grid">
          <div>
            <div className="t-micro" style={{ marginBottom: 8, color: "var(--muted)" }}>
              Market-cap weight of all global financial assets (approx mid-2026)
            </div>
            <Donut
              data={GFAP_SLICES.map(s => ({ ...s, value: s.pct }))}
              size={140}
              thickness={24}
              center={
                <div style={{ textAlign: "center" }}>
                  <div className="t-mono" style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--muted)" }}>GFAP</div>
                  <div className="t-micro" style={{ color: "var(--muted)" }}>baseline</div>
                </div>
              }
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="t-micro" style={{ color: "var(--muted)" }}>YOUR DREAM PORTFOLIO vs. GFAP</div>
            <CompareBar label="Global Equity" gfap={GFAP_SLICES[2].pct + GFAP_SLICES[3].pct} yours={userEquityPct} />
            <CompareBar label="Bonds" gfap={GFAP_SLICES[0].pct + GFAP_SLICES[1].pct} yours={100 - userEquityPct} />
            <div
              style={{
                marginTop: 4,
                padding: "10px 12px",
                background: userEquityPct > 75 ? "var(--bear-10)" : "var(--tech-10)",
                border: `1px solid ${userEquityPct > 75 ? "var(--bear)" : "var(--tech)"}`,
              }}
            >
              <div className="t-body" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
                {userEquityPct > 75
                  ? `Your portfolio is ${userEquityPct - 43}% more equity-heavy than GFAP. This is a deliberate active bet on long-term equity outperformance — valid if your horizon is 15+ years, but carries significantly higher sequence-of-returns risk.`
                  : `Your portfolio is close to GFAP weights. Any deviation from GFAP is an active bet — ensure yours is intentional.`}
              </div>
            </div>
            <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5 }}>
              {GFAP_NOTE}
            </div>
          </div>
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 3. COUNTERCYCLICAL SIGNAL                               */}
      {/* ─────────────────────────────────────────────────────── */}
      <Section
        num="3"
        title="Countercyclical Signal"
        sub="Roche's DSCF algorithm: trim what boomed, add what crashed — by market cap, not opinion"
      >
        {/* Range bar */}
        <div style={{ marginBottom: 12 }}>
          <div className="t-micro" style={{ marginBottom: 6 }}>
            GLOBAL EQUITY SHARE OF TOTAL FINANCIAL ASSETS — historical range {HIST_LOW}%–{HIST_HIGH}%
          </div>
          <div style={{ position: "relative", height: 28, background: "var(--bg-surface)", border: "1px solid var(--line)" }}>
            {/* Neutral zone */}
            <div style={{
              position: "absolute",
              left: `${((NEUTRAL_RANGE[0] - HIST_LOW) / (HIST_HIGH - HIST_LOW)) * 100}%`,
              width: `${((NEUTRAL_RANGE[1] - NEUTRAL_RANGE[0]) / (HIST_HIGH - HIST_LOW)) * 100}%`,
              top: 0, bottom: 0,
              background: "var(--caution-10)",
            }} />
            {/* Current marker */}
            <div style={{
              position: "absolute",
              left: `${((EQUITY_CAP_PCT - HIST_LOW) / (HIST_HIGH - HIST_LOW)) * 100}%`,
              top: 0, bottom: 0, width: 3,
              background: signal.color,
              transform: "translateX(-50%)",
            }} />
            {/* Labels */}
            <span style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "var(--muted)" }}>{HIST_LOW}%</span>
            <span style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "var(--muted)" }}>{HIST_HIGH}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span className="t-micro" style={{ color: "var(--bull)" }}>← Max add equity (post-crash)</span>
            <span className="t-micro" style={{ color: "var(--muted)" }}>neutral zone</span>
            <span className="t-micro" style={{ color: "var(--bear)" }}>Max trim equity (peak boom) →</span>
          </div>
        </div>

        {/* Signal */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 14,
            padding: "12px 14px",
            background: "var(--bg-surface)",
            border: `1px solid ${signal.color}`,
            borderLeft: `3px solid ${signal.color}`,
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="t-mono" style={{ fontSize: "1.75rem", fontWeight: 700, color: signal.color }}>
              {EQUITY_CAP_PCT}%
            </div>
            <div className="t-micro" style={{ color: signal.color, letterSpacing: "0.1em" }}>EQUITY SHARE</div>
          </div>
          <div>
            <div className="t-mono" style={{ fontSize: "0.9375rem", fontWeight: 700, color: signal.color, letterSpacing: "0.1em" }}>
              {signal.signal}
            </div>
            <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--ink)", marginTop: 4, lineHeight: 1.5 }}>
              {signal.action}
            </div>
            <div className="t-micro" style={{ color: "var(--muted)", marginTop: 6 }}>
              DSCF (Discipline Fund ETF) tilt: {signal.strength}. Update this reading monthly from global market cap data.
            </div>
          </div>
        </div>

        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 8, lineHeight: 1.5 }}>
          Standard 60/40 rebalances back to a fixed weight regardless of cycle.
          Countercyclical indexing rebalances <em>toward</em> the market-cap equilibrium — mechanically selling high, buying low.
          It is rules-based, not discretionary. Humans implementing this with their own judgment will fail.
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 4. RISK CONTRIBUTION                                     */}
      {/* ─────────────────────────────────────────────────────── */}
      <Section
        num="4"
        title="Risk Contribution"
        sub="Dollar allocation ≠ risk allocation. Your 60% equity drives ~85% of volatility."
      >
        <div className="perfect-grid">
          <div>
            <div className="t-micro" style={{ marginBottom: 8 }}>YOUR DREAM PORTFOLIO ({userEquityPct}% equity-like)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <RiskBar label="Equity sleeve" pct={userRisk.equityRisk} dollarPct={userEquityPct} color="var(--bear)" />
              <RiskBar label="Bond sleeve"   pct={userRisk.bondRisk}   dollarPct={100 - userEquityPct} color="var(--bull)" />
            </div>
            <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
              Even though equity is only {userEquityPct}% of your portfolio by dollars, it contributes{" "}
              <strong style={{ color: "var(--bear)" }}>{userRisk.equityRisk}%</strong> of total portfolio volatility.
              This is not balanced — it is equity-dominated in risk terms.
            </div>
          </div>
          <div>
            <div className="t-micro" style={{ marginBottom: 8 }}>ROCHE'S RISK-PARITY TARGET (DSCF)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <RiskBar label="Equity sleeve" pct={50} dollarPct={50} color="var(--caution)" />
              <RiskBar label="Bond sleeve"   pct={50} dollarPct={50} color="var(--caution)" />
            </div>
            <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
              DSCF targets equal <em>risk contribution</em> from both sleeves — not equal dollars.
              This typically lands near 30–40% equity / 60–70% bonds by dollar weight.
              Smaller drawdowns mean investors stay invested through the full cycle.
            </div>
          </div>
        </div>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 8, lineHeight: 1.5, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
          Equity annualised vol ~16% · Bond annualised vol ~5% (approximate multi-year averages).
          Risk contribution = sleeve weight × sleeve vol, normalised to 100%.
        </div>
      </Section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 5. BEHAVIOURAL AUDIT                                     */}
      {/* ─────────────────────────────────────────────────────── */}
      <Section
        num="5"
        title="Behavioural Audit"
        sub={`Roche's "Four Horsemen" of portfolio self-destruction — plus one Thai-specific trap`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {HORSEMEN.map(h => {
            const checked = !!auditChecks[h.id];
            return (
              <div
                key={h.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 1fr",
                  gap: 12,
                  padding: "10px 12px",
                  background: checked ? "var(--bear-10)" : "var(--bg-surface)",
                  border: `1px solid ${checked ? h.color : "var(--line)"}`,
                  cursor: "pointer",
                }}
                onClick={() => toggleCheck(h.id)}
              >
                <div
                  style={{
                    width: 20, height: 20,
                    border: `1px solid ${h.color}`,
                    background: checked ? h.color : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                    fontSize: "0.75rem",
                    color: checked ? "#000" : "transparent",
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span className="t-body" style={{ fontWeight: 700, fontSize: "0.8125rem", color: h.color }}>
                      {h.label}
                    </span>
                    {checked && (
                      <span className="t-mono" style={{ fontSize: "0.5rem", color: h.color, border: `1px solid ${h.color}`, padding: "1px 5px", letterSpacing: "0.1em" }}>
                        FLAGGED
                      </span>
                    )}
                  </div>
                  <div className="t-body" style={{ fontSize: "0.8125rem", color: "var(--ink)", marginTop: 2, lineHeight: 1.4 }}>
                    {h.desc}
                  </div>
                  {checked && (
                    <div className="t-body" style={{ fontSize: "0.75rem", color: h.color, marginTop: 6, lineHeight: 1.5, borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                      ⚠ {h.flag}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {Object.values(auditChecks).filter(Boolean).length >= 2 && (
          <div
            style={{
              marginTop: 8,
              padding: "12px 14px",
              background: "var(--bear-10)",
              border: "1px solid var(--bear)",
              borderLeft: "3px solid var(--bear)",
            }}
          >
            <div className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--bear)", letterSpacing: "0.14em", marginBottom: 4 }}>
              {Object.values(auditChecks).filter(Boolean).length} BEHAVIOURAL RISKS FLAGGED
            </div>
            <div className="t-body" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
              Roche's response: design the portfolio <em>around</em> your biases, not against them.
              If you will chase returns, reduce the number of decisions you can make.
              Use a rules-based fund (or the Duration Matcher above) and commit to reviewing only quarterly.
            </div>
          </div>
        )}

        <div className="t-micro" style={{ color: "var(--dim)", lineHeight: 1.5, marginTop: 8 }}>
          Click each bias to flag whether it applies to you. Not financial advice — self-reflection only.
        </div>
      </Section>

      <style>{`
        .perfect-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 900px) {
          .perfect-grid {
            grid-template-columns: 220px 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function Section({
  num, title, sub, children,
}: {
  num: string; title: string; sub: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "var(--braun-yellow, #ffd000)",
            border: "1px solid var(--braun-yellow, #ffd000)",
            padding: "2px 8px",
            flexShrink: 0,
          }}
        >
          {num}
        </span>
        <div>
          <div className="t-body" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{title}</div>
          <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--line)",
          padding: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Slider({
  label, value, min, max, onChange, display,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (n: number) => void; display: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span className="t-micro">{label}</span>
        <span className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--tech)" }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--tech)", cursor: "pointer" }}
      />
    </div>
  );
}

function CompareBar({ label, gfap, yours }: { label: string; gfap: number; yours: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span className="t-micro">{label}</span>
        <span style={{ display: "flex", gap: 12 }}>
          <span className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>GFAP {gfap.toFixed(0)}%</span>
          <span className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--tech)", fontWeight: 700 }}>YOURS {yours.toFixed(0)}%</span>
        </span>
      </div>
      <div style={{ position: "relative", height: 12, background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
        <div style={{ position: "absolute", inset: 0, width: `${gfap}%`, background: "var(--muted)", opacity: 0.3 }} />
        <div style={{ position: "absolute", inset: 0, width: `${yours}%`, background: "var(--tech)", opacity: 0.5 }} />
      </div>
    </div>
  );
}

function RiskBar({ label, pct, dollarPct, color }: { label: string; pct: number; dollarPct: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span className="t-micro">{label}</span>
        <span style={{ display: "flex", gap: 10 }}>
          <span className="t-mono" style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>${dollarPct}% dollars</span>
          <span className="t-mono" style={{ fontSize: "0.6875rem", color, fontWeight: 700 }}>{pct}% risk</span>
        </span>
      </div>
      <div style={{ position: "relative", height: 20, background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${dollarPct}%`, background: "var(--dim)", opacity: 0.4 }} />
        <div style={{
          position: "absolute", top: 2, bottom: 2, left: 0, width: `${pct}%`,
          background: color, opacity: 0.7,
          display: "flex", alignItems: "center",
          paddingLeft: 6,
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "#000", fontWeight: 700, whiteSpace: "nowrap" }}>
            {pct}% of risk
          </span>
        </div>
      </div>
    </div>
  );
}
