"use client";

import { useState, useMemo } from "react";
import { fmtThb } from "@/lib/format";
import { calcThaiTax } from "@/lib/graham";

// ─── Types ───────────────────────────────────────────────────────

interface Allocation {
  rmf: number;
  thaiEsg: number;
  ssf: number;
  stocks: number;
  mutualFunds: number;
  cash: number;
}

interface ExpenseBreakdown {
  food: number;
  housing: number;
  transport: number;
  medicine: number;
  utilities: number;
  other: number;
}

const MONTHS = 12;

// ─── Life Timeline Constants ─────────────────────────────────────

const LIFE = {
  startWorkAge: 22,
  retireAge: 60,
  lifeExpectancy: 80,
  defaultTarget: 6_000_000,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────

function projectionPoints(monthlyInvest: number, initial: number, rate: number, years: number) {
  const pts: { year: number; value: number }[] = [];
  for (let y = 0; y <= years; y++) {
    const lump = initial * Math.pow(1 + rate, y);
    const mr = rate / MONTHS;
    const m = y * MONTHS;
    const annuity = m === 0 ? 0 : monthlyInvest * ((Math.pow(1 + mr, m) - 1) / mr);
    pts.push({ year: y, value: lump + annuity });
  }
  return pts;
}

function riskLabel(risk: number): string {
  if (risk <= 2) return "Sleep-well-at-night";
  if (risk <= 4) return "Steady & Balanced";
  if (risk <= 6) return "Growth-oriented";
  if (risk <= 8) return "Aggressive";
  return "High Risk";
}

function riskColor(risk: number): string {
  if (risk <= 2) return "var(--bull)";
  if (risk <= 4) return "var(--tech)";
  if (risk <= 6) return "var(--caution)";
  return "var(--bear)";
}

function ageFromYear(year: number): number {
  return LIFE.startWorkAge + year;
}

// ─── Component ───────────────────────────────────────────────────

export default function PlanPage() {
  const [currentAge, setCurrentAge] = useState(22);
  const [monthlySalary, setMonthlySalary] = useState(15_000);
  const [expenses, setExpenses] = useState<ExpenseBreakdown>({
    food: 4_500,
    housing: 3_500,
    transport: 1_500,
    medicine: 500,
    utilities: 800,
    other: 1_200,
  });
  const [existingSavings, setExistingSavings] = useState(0);
  const [retirementYears, setRetirementYears] = useState(20); // 60 -> 80
  const [alloc, setAlloc] = useState<Allocation>({
    rmf: 10,
    thaiEsg: 10,
    ssf: 5,
    stocks: 20,
    mutualFunds: 30,
    cash: 25,
  });

  const monthlyExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
  const investableMonthly = Math.max(0, monthlySalary - monthlyExpenses);
  const emergencyTarget = monthlyExpenses * 6;

  // Retirement target: monthly expenses × 12 × retirement years
  const retirementTarget = monthlyExpenses * MONTHS * retirementYears;
  const yearsToRetire = LIFE.retireAge - currentAge;

  const taxSavings = useMemo(() => {
    const annualIncome = monthlySalary * MONTHS;
    const rmfYearly = investableMonthly * (alloc.rmf / 100) * MONTHS;
    const esgYearly = investableMonthly * (alloc.thaiEsg / 100) * MONTHS;
    const ssfYearly = investableMonthly * (alloc.ssf / 100) * MONTHS;
    return calcThaiTax({ annualIncome, rmfAmount: rmfYearly, thaiEsgAmount: esgYearly, ssfAmount: ssfYearly });
  }, [monthlySalary, investableMonthly, alloc.rmf, alloc.thaiEsg, alloc.ssf]);

  // Weighted average return based on allocation
  const weightedReturn = useMemo(() => {
    const rates = {
      rmf: 0.05,
      thaiEsg: 0.06,
      ssf: 0.05,
      stocks: 0.10,
      mutualFunds: 0.08,
      cash: 0.01,
    };
    return (
      (alloc.rmf / 100) * rates.rmf +
      (alloc.thaiEsg / 100) * rates.thaiEsg +
      (alloc.ssf / 100) * rates.ssf +
      (alloc.stocks / 100) * rates.stocks +
      (alloc.mutualFunds / 100) * rates.mutualFunds +
      (alloc.cash / 100) * rates.cash
    );
  }, [alloc]);

  const projection = useMemo(() => {
    return projectionPoints(investableMonthly, existingSavings, weightedReturn, yearsToRetire);
  }, [investableMonthly, existingSavings, weightedReturn, yearsToRetire]);

  const valueAtRetirement = projection[projection.length - 1]?.value ?? 0;
  const gap = retirementTarget - valueAtRetirement;
  const onTrack = valueAtRetirement >= retirementTarget;

  const riskScore = useMemo(() => {
    let score = 0;
    score += (alloc.stocks / 100) * 6;
    score += (alloc.mutualFunds / 100) * 3;
    score += (alloc.rmf / 100) * 0.5;
    score += (alloc.thaiEsg / 100) * 0.5;
    score += (alloc.ssf / 100) * 0.5;
    return Math.min(10, score);
  }, [alloc]);

  function autoBalance(changedKey: keyof Allocation, newVal: number) {
    const others = (["rmf", "thaiEsg", "ssf", "stocks", "mutualFunds", "cash"] as const).filter((k) => k !== changedKey);
    const oldOthersSum = others.reduce((s, k) => s + alloc[k], 0);
    const delta = newVal - alloc[changedKey];
    if (oldOthersSum <= 0) {
      setAlloc((prev) => ({ ...prev, [changedKey]: newVal }));
      return;
    }
    const ratio = Math.max(0, oldOthersSum - delta) / oldOthersSum;
    const next: Allocation = { ...alloc, [changedKey]: newVal };
    others.forEach((k) => {
      next[k] = Math.max(0, Math.round(alloc[k] * ratio));
    });
    const sum = next.rmf + next.thaiEsg + next.ssf + next.stocks + next.mutualFunds + next.cash;
    const diff = 100 - sum;
    if (diff !== 0) {
      const largest = others.reduce((a, b) => (next[a] > next[b] ? a : b));
      next[largest] = Math.max(0, next[largest] + diff);
    }
    setAlloc(next);
  }

  function updateExpense(key: keyof ExpenseBreakdown, val: number) {
    setExpenses((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="page page-enter">
      {/* ═══════════════════════════════════════════════════════════════
          HERO — The life question
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <div className="t-micro" style={{ marginBottom: 6, color: "var(--caution)" }}>
          FROM BIRTH TO FREEDOM
        </div>
        <h1 className="t-display" style={{ marginBottom: 12 }}>
          How Will You Survive After 60?
        </h1>
        <p className="t-body" style={{ color: "var(--muted)", maxWidth: 600, lineHeight: 1.7 }}>
          Your parents supported you for the first 20 years. But once you graduate, the clock starts ticking.
          You have about <span style={{ color: "var(--ink)", fontWeight: 600 }}>{yearsToRetire} years</span> to build a pile of money
          that will feed, house, and heal you from age {LIFE.retireAge} to {LIFE.lifeExpectancy} —
          when you no longer have the energy to work like the young.
        </p>
        <p className="t-body" style={{ color: "var(--muted)", maxWidth: 600, lineHeight: 1.7, marginTop: 8 }}>
          <span style={{ color: "var(--bear)", fontWeight: 600 }}>You cannot rely on your children.</span> They are struggling too.
          And with Thailand&apos;s falling birth rate, you might not even have children to rely on.
          This planner shows you exactly how to build your own safety net.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LIFE TIMELINE VISUAL
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <div className="t-micro" style={{ marginBottom: 12, color: "var(--tech)" }}>
          YOUR LIFE TIMELINE
        </div>
        <LifeTimeline currentAge={currentAge} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STEP 1: YOUR NUMBERS
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 28 }}>
        <div className="t-micro" style={{ marginBottom: 12, color: "var(--tech)" }}>
          STEP 1 — YOUR REALITY
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <SliderCard
            label="Your Age"
            value={currentAge}
            onChange={setCurrentAge}
            min={18}
            max={55}
            step={1}
            format={(v) => `${v} years old`}
          />
          <SliderCard
            label="Monthly Salary (first job)"
            value={monthlySalary}
            onChange={setMonthlySalary}
            min={9_000}
            max={100_000}
            step={1_000}
            format={(v) => fmtThb(v)}
          />
          <SliderCard
            label="Existing Savings"
            value={existingSavings}
            onChange={setExistingSavings}
            min={0}
            max={2_000_000}
            step={50_000}
            format={(v) => fmtThb(v)}
          />
          <SliderCard
            label="Retirement Duration"
            value={retirementYears}
            onChange={setRetirementYears}
            min={10}
            max={35}
            step={5}
            format={(v) => `${v} years (age ${LIFE.retireAge} → ${LIFE.retireAge + v})`}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STEP 2: EXPENSE BREAKDOWN
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div className="t-micro" style={{ color: "var(--tech)" }}>
            STEP 2 — WHAT DO YOU SPEND EACH MONTH?
          </div>
          <div className="mono-body" style={{ color: "var(--bear)" }}>
            TOTAL: {fmtThb(monthlyExpenses)}
          </div>
        </div>

        <div className="grid-2" style={{ gap: 8 }}>
          <ExpenseSlider label="Food & meals" value={expenses.food} onChange={(v) => updateExpense("food", v)} />
          <ExpenseSlider label="Housing / Rent" value={expenses.housing} onChange={(v) => updateExpense("housing", v)} />
          <ExpenseSlider label="Transport" value={expenses.transport} onChange={(v) => updateExpense("transport", v)} />
          <ExpenseSlider label="Medicine & health" value={expenses.medicine} onChange={(v) => updateExpense("medicine", v)} />
          <ExpenseSlider label="Utilities & phone" value={expenses.utilities} onChange={(v) => updateExpense("utilities", v)} />
          <ExpenseSlider label="Other (family, clothes, etc.)" value={expenses.other} onChange={(v) => updateExpense("other", v)} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          THE BIG NUMBER: RETIREMENT TARGET
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            padding: "20px 16px",
            background: "var(--bg-surface)",
            border: "1px solid var(--line)",
            borderLeft: "4px solid var(--braun-yellow)",
          }}
        >
          <div className="t-micro" style={{ color: "var(--braun-yellow)", marginBottom: 8 }}>
            YOUR RETIREMENT TARGET
          </div>
          <div className="mono-display" style={{ color: "var(--ink)", marginBottom: 4 }}>
            {fmtThb(retirementTarget)}
          </div>
          <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
            You need this pile of money to live comfortably from age {LIFE.retireAge} to {LIFE.retireAge + retirementYears}
            without working. That is {fmtThb(monthlyExpenses)} × 12 months × {retirementYears} years.
          </div>
        </div>

        {/* Gap indicator */}
        <div
          style={{
            marginTop: 12,
            padding: "16px",
            background: onTrack ? "var(--bull-10)" : "var(--bear-10)",
            border: `1px solid ${onTrack ? "var(--bull)" : "var(--bear)"}`,
            borderLeft: `4px solid ${onTrack ? "var(--bull)" : "var(--bear)"}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="t-micro" style={{ color: onTrack ? "var(--bull)" : "var(--bear)" }}>
              {onTrack ? "YOU ARE ON TRACK" : "THE GAP YOU MUST CLOSE"}
            </span>
            <span className="mono-display" style={{ color: onTrack ? "var(--bull)" : "var(--bear)" }}>
              {onTrack ? `+${fmtThb(gap * -1)}` : `-${fmtThb(gap)}`}
            </span>
          </div>
          <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
            {onTrack
              ? `At your current pace, you will have ${fmtThb(valueAtRetirement)} by age ${LIFE.retireAge}. You can breathe easier.`
              : `If you keep investing ${fmtThb(investableMonthly)} per month at ${(weightedReturn * 100).toFixed(1)}% return, you will only have ${fmtThb(valueAtRetirement)} by age ${LIFE.retireAge}. You are short ${fmtThb(gap)}. Change your allocation or increase your income.`}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STEP 3: ALLOCATION (The portfolio balance lesson)
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div className="t-micro" style={{ color: "var(--tech)" }}>
            STEP 3 — DON&apos;T PUT ALL EGGS IN ONE BASKET
          </div>
          <div className="mono-body" style={{ color: "var(--muted)" }}>
            Monthly investable: <span style={{ color: investableMonthly > 0 ? "var(--bull)" : "var(--bear)" }}>{fmtThb(investableMonthly)}</span>
          </div>
        </div>

        <div
          style={{
            padding: "12px 16px",
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            marginBottom: 12,
          }}
        >
          <div className="t-body" style={{ lineHeight: 1.6, color: "var(--muted)" }}>
            <span style={{ color: "var(--ink)", fontWeight: 600 }}>Money market</span> (savings, deposits) is safe but often loses to inflation.
            {" "}<span style={{ color: "var(--ink)", fontWeight: 600 }}>Capital market</span> (stocks, funds) is riskier but historically returns 7-14% per year.
            {" "}<span style={{ color: "var(--ink)", fontWeight: 600 }}>Derivatives</span> are dangerous — 90% of retail traders lose money.
            The smart path: balance safety and growth. Start with the low-hanging fruit.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <AllocRow
            label="RMF (Retirement Mutual Fund)"
            sub="Tax deduction · Locked until age 55 · ~5% return"
            color="var(--bull)"
            value={alloc.rmf}
            onChange={(v) => autoBalance("rmf", v)}
            tag="Low-hanging fruit"
          />
          <AllocRow
            label="Thai ESG Fund"
            sub="Tax deduction · Socially responsible · ~6% return"
            color="var(--tech)"
            value={alloc.thaiEsg}
            onChange={(v) => autoBalance("thaiEsg", v)}
            tag="Low-hanging fruit"
          />
          <AllocRow
            label="SSF (Super Savings Fund)"
            sub="Tax deduction · More flexible · ~5% return"
            color="#8e8e93"
            value={alloc.ssf}
            onChange={(v) => autoBalance("ssf", v)}
            tag="Low-hanging fruit"
          />
          <AllocRow
            label="Mutual Funds / ETFs"
            sub="Professionally managed · Diversified · ~8% return · Start here"
            color="var(--caution)"
            value={alloc.mutualFunds}
            onChange={(v) => autoBalance("mutualFunds", v)}
            tag="Beginner-friendly"
          />
          <AllocRow
            label="Individual Stocks"
            sub="Direct ownership · Higher risk · ~10% return · Graham/Buffett method"
            color="var(--braun-orange, #ff5e00)"
            value={alloc.stocks}
            onChange={(v) => autoBalance("stocks", v)}
            tag="Learn first"
          />
          <AllocRow
            label="Cash / Emergency Fund"
            sub="6 months expenses = {fmtThb(emergencyTarget)} · Opportunity fund"
            color="var(--muted)"
            value={alloc.cash}
            onChange={(v) => autoBalance("cash", v)}
            tag="Safety first"
          />
        </div>

        {/* Tax + weighted return summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          <div style={{ padding: "14px 16px", background: "var(--bg-surface)", border: "1px solid var(--bull)" }}>
            <div className="t-micro" style={{ color: "var(--bull)", marginBottom: 4 }}>TAX SAVED PER YEAR</div>
            <div className="mono-display" style={{ color: "var(--bull)" }}>
              {fmtThb(taxSavings.estimatedTaxSaved)}
            </div>
          </div>
          <div style={{ padding: "14px 16px", background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
            <div className="t-micro" style={{ color: "var(--muted)", marginBottom: 4 }}>EXPECTED RETURN</div>
            <div className="mono-display" style={{ color: "var(--tech)" }}>
              {(weightedReturn * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STEP 4: THE JOURNEY VISUAL
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 28 }}>
        <div className="t-micro" style={{ marginBottom: 12, color: "var(--tech)" }}>
          STEP 4 — YOUR JOURNEY TO {fmtThb(retirementTarget)}
        </div>

        {/* Projection curve */}
        <div
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            padding: "16px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="t-micro">Age {currentAge}</span>
            <span className="t-micro">Age {LIFE.retireAge}</span>
          </div>

          {/* Simple bar-chart timeline */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 160 }}>
            {projection.filter((_, i) => i % 2 === 0).map((pt, i, arr) => {
              const maxVal = retirementTarget * 1.2;
              const h = Math.min(100, (pt.value / maxVal) * 100);
              const isTarget = pt.value >= retirementTarget;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${h}%`,
                      background: isTarget ? "var(--bull)" : "var(--tech)",
                      minHeight: 2,
                      opacity: i === arr.length - 1 ? 1 : 0.6,
                    }}
                  />
                  {i % 5 === 0 && (
                    <span className="t-micro" style={{ color: "var(--dim)" }}>
                      {ageFromYear(pt.year)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Target line */}
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              borderTop: "1px dashed var(--braun-yellow)",
              top: `${16 + 160 * (1 - retirementTarget / (retirementTarget * 1.2))}px`,
            }}
          >
            <span
              className="t-micro"
              style={{
                position: "absolute",
                right: 0,
                top: -16,
                color: "var(--braun-yellow)",
              }}
            >
              TARGET: {fmtThb(retirementTarget)}
            </span>
          </div>
        </div>

        {/* Milestones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
          <MilestoneBox
            age={currentAge + 5}
            label="5 Years"
            value={projection.find((p) => p.year === 5)?.value ?? 0}
          />
          <MilestoneBox
            age={currentAge + 15}
            label="15 Years"
            value={projection.find((p) => p.year === 15)?.value ?? 0}
          />
          <MilestoneBox
            age={LIFE.retireAge}
            label="At Retirement"
            value={valueAtRetirement}
            highlight={onTrack}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STEP 5: RISK + NEXT STEPS
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 28 }}>
        <div className="t-micro" style={{ marginBottom: 12, color: "var(--tech)" }}>
          STEP 5 — YOUR PATH FORWARD
        </div>

        <div
          style={{
            padding: "16px",
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="t-body" style={{ fontWeight: 600 }}>{riskLabel(riskScore)}</span>
            <span className="t-mono" style={{ color: riskColor(riskScore), fontWeight: 700 }}>
              {riskScore.toFixed(1)}/10
            </span>
          </div>
          <div style={{ height: 6, background: "var(--bg)", border: "1px solid var(--line)" }}>
            <div
              style={{
                height: "100%",
                width: `${riskScore * 10}%`,
                background: riskColor(riskScore),
                transition: "width 400ms ease-out",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <StepCard
            number={1}
            title="Build Emergency Fund"
            body={`Save ${fmtThb(emergencyTarget)} first — 6 months of expenses. Do not invest until this is done.`}
            done={existingSavings >= emergencyTarget}
          />
          <StepCard
            number={2}
            title="Maximize Tax Deductions (Low-Hanging Fruit)"
            body={`RMF + Thai ESG + SSF saves you ${fmtThb(taxSavings.estimatedTaxSaved)} in taxes every year. This is free money.`}
            done={taxSavings.totalDeduction > 0}
          />
          <StepCard
            number={3}
            title="Open a Brokerage Account"
            body="Thai stocks: Settrade, Streaming, Finnomena. Global: Interactive Brokers."
            done={false}
          />
          <StepCard
            number={4}
            title="Start with SET50 Index Fund"
            body="Beginners should not pick stocks yet. Buy the whole market through a low-cost index fund."
            done={alloc.mutualFunds > 0}
          />
          <StepCard
            number={5}
            title="Learn Value Investing"
            body="Read Benjamin Graham. Use our SCAN tool to find stocks below their true value."
            done={false}
          />
          <StepCard
            number={6}
            title="Practice with Fake Money"
            body="Use our Simulator for 3 months. Prove you can win before risking real cash."
            done={false}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          INVESTMENT TYPES (The camp lesson)
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 40 }}>
        <div className="t-micro" style={{ marginBottom: 12, color: "var(--tech)" }}>
          THE FOUR PILLARS OF INVESTING
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TypeCard
            name="Money Market"
            risk="Low"
            return="1-3% / year"
            desc="Savings accounts, fixed deposits, treasury bills. Safe, but often BELOW inflation. Your money loses buying power slowly. Use only for emergency funds."
            color="var(--bull)"
            beginner="Safety net only"
          />
          <TypeCard
            name="Bonds / Fixed Income"
            risk="Low-Medium"
            return="3-5% / year"
            desc="Government and corporate bonds. Steady interest payments. Prices drop when interest rates rise. Good for conservative portions of your portfolio."
            color="var(--tech)"
            beginner="Stable income"
          />
          <TypeCard
            name="Capital Market (Stocks & Funds)"
            risk="Medium-High"
            return="7-14% / year (historical)"
            desc="Ownership in real businesses. Mutual funds and ETFs spread your risk across many companies. This is where long-term wealth is built. Start with index funds."
            color="var(--caution)"
            beginner="START HERE"
          />
          <TypeCard
            name="Derivatives (Options, Futures, CFDs)"
            risk="Very High"
            return="Unlimited / Total loss"
            desc="Contracts that bet on price movements. Used by professionals for hedging. 90% of retail traders LOSE money. Do not touch until you have years of experience."
            color="var(--bear)"
            beginner="AVOID"
          />
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "16px",
            background: "var(--bg-raised)",
            borderLeft: "3px solid var(--caution)",
          }}
        >
          <div className="t-body" style={{ lineHeight: 1.6, color: "var(--muted)" }}>
            <span style={{ color: "var(--ink)", fontWeight: 600 }}>The golden rule from the camps:</span>{" "}
            A balanced portfolio across money market (safety), bonds (stability), and capital market (growth)
            historically returns <span style={{ color: "var(--bull)", fontWeight: 700 }}>7-14% per year</span>.
            This beats inflation. This beats savings accounts. This is how you do not become a burden on your children.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function LifeTimeline({ currentAge }: { currentAge: number }) {
  const total = LIFE.lifeExpectancy;
  const pctParents = (20 / total) * 100;
  const pctWork = ((LIFE.retireAge - currentAge) / total) * 100;
  const pctRetire = ((total - LIFE.retireAge) / total) * 100;

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "16px" }}>
      <div style={{ display: "flex", height: 32, marginBottom: 12, border: "1px solid var(--line)" }}>
        <div style={{ width: `${pctParents}%`, background: "rgba(0,122,255,0.18)", borderRight: "1px solid var(--tech)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
          <span className="t-micro" style={{ color: "var(--tech)", overflow: "hidden", textOverflow: "ellipsis" }}>PARENTS</span>
        </div>
        <div style={{ width: `${(currentAge - 20) / total * 100}%`, background: "rgba(255,149,0,0.18)", borderRight: "1px solid var(--caution)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
          <span className="t-micro" style={{ color: "var(--caution)", overflow: "hidden", textOverflow: "ellipsis" }}>STUDY</span>
        </div>
        <div style={{ width: `${pctWork}%`, background: "rgba(0,200,150,0.18)", borderRight: "1px solid var(--bull)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
          <span className="t-micro" style={{ color: "var(--bull)", overflow: "hidden", textOverflow: "ellipsis" }}>WORK &amp; BUILD</span>
        </div>
        <div style={{ width: `${pctRetire}%`, background: "rgba(136,136,132,0.18)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
          <span className="t-micro" style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis" }}>RETIRE</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="t-micro" style={{ color: "var(--tech)" }}>0 → Parents support you</div>
        <div className="t-micro" style={{ color: "var(--bull)" }}>{currentAge} → You start building</div>
        <div className="t-micro" style={{ color: "var(--muted)" }}>{LIFE.retireAge} → Stop working</div>
        <div className="t-micro" style={{ color: "var(--dim)" }}>{LIFE.lifeExpectancy} → End</div>
      </div>
    </div>
  );
}

function SliderCard({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="t-body" style={{ color: "var(--muted)" }}>{label}</span>
        <span className="mono-body" style={{ fontWeight: 700, color: "var(--ink)" }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--bull)", cursor: "pointer", height: 4 }}
      />
    </div>
  );
}

function ExpenseSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body" style={{ color: "var(--muted)" }}>{label}</div>
      </div>
      <div className="mono-body" style={{ fontWeight: 600, minWidth: 60, textAlign: "right" }}>
        {fmtThb(value)}
      </div>
      <input
        type="range"
        min={0}
        max={20_000}
        step={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 100, accentColor: "var(--caution)", cursor: "pointer", height: 4, flexShrink: 0 }}
      />
    </div>
  );
}

function AllocRow({
  label,
  sub,
  color,
  value,
  onChange,
  tag,
}: {
  label: string;
  sub: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
  tag?: string;
}) {
  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 4, height: 36, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div className="t-body" style={{ fontWeight: 600 }}>{label}</div>
          {tag && (
            <span className="t-micro chip-tag" style={{ color, borderColor: color }}>
              {tag.toUpperCase()}
            </span>
          )}
        </div>
        <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>{sub}</div>
      </div>
      <div className="mono-body" style={{ fontWeight: 700, color }}>{value}%</div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 80, accentColor: color, cursor: "pointer", height: 4, flexShrink: 0 }}
      />
    </div>
  );
}

function MilestoneBox({ age, label, value, highlight }: { age: number; label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{
      padding: "12px",
      background: highlight ? "var(--bull-10)" : "var(--bg-raised)",
      border: `1px solid ${highlight ? "var(--bull)" : "var(--line)"}`,
      textAlign: "center",
    }}>
      <div className="t-micro" style={{ color: "var(--muted)", marginBottom: 2 }}>{label}</div>
      <div className="t-micro" style={{ fontFamily: "var(--font-mono)", color: "var(--dim)", marginBottom: 4 }}>Age {age}</div>
      <div className="mono-body" style={{ fontWeight: 700, color: highlight ? "var(--bull)" : "var(--ink)" }}>
        {fmtThb(value)}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  body,
  done,
}: {
  number: number;
  title: string;
  body: string;
  done: boolean;
}) {
  return (
    <div style={{
      background: "var(--bg-raised)",
      border: `1px solid ${done ? "var(--bull)" : "var(--line)"}`,
      borderLeft: `3px solid ${done ? "var(--bull)" : "var(--line)"}`,
      padding: "14px 16px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        background: done ? "var(--bull)" : "var(--bg)",
        border: `1px solid ${done ? "var(--bull)" : "var(--line)"}`,
        color: done ? "var(--bg)" : "var(--muted)",
        fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, flexShrink: 0,
      }}>
        {done ? "✓" : number}
      </div>
      <div>
        <div className="t-body" style={{ fontWeight: 600, color: done ? "var(--bull)" : "var(--ink)" }}>
          {title}
        </div>
        <div className="t-body" style={{ color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

function TypeCard({
  name,
  risk,
  return: ret,
  desc,
  color,
  beginner,
}: {
  name: string;
  risk: string;
  return: string;
  desc: string;
  color: string;
  beginner: string;
}) {
  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)", padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="t-body" style={{ fontWeight: 600 }}>{name}</span>
          <span className="t-micro chip-tag" style={{ color, borderColor: color }}>
            {beginner.toUpperCase()}
          </span>
        </div>
        <span className="t-micro" style={{ color }}>{risk} RISK</span>
      </div>
      <div className="mono-body" style={{ color, marginBottom: 6 }}>{ret}</div>
      <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}
