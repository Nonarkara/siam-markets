"use client";

import { usePlanState } from "@/components/Plan/use-plan-state";
import { PlanControls } from "@/components/Plan/PlanControls";
import { PlanHero, TimeAnchorSection } from "@/components/Plan/plan-sections";
import { EarningsProjectionSection } from "@/components/Plan/EarningsProjectionSection";
import { SavingsPileSection } from "@/components/Plan/SavingsPileSection";
import { RetirementNeedsSection } from "@/components/Plan/RetirementNeedsSection";
import { SafetyMarginSection } from "@/components/Plan/SafetyMarginSection";
import { AssetAllocatorSection } from "@/components/Plan/AssetAllocatorSection";
import { AgeLens } from "@/components/Plan/AgeLens";

export default function PlanPage() {
  const s = usePlanState();

  const STEPS = [
    { id: 0, label: "START" },
    { id: 1, label: "YOU" },
    { id: 2, label: "MONEY" },
    { id: 3, label: "NEEDS" },
    { id: 4, label: "INVEST" }
  ];

  return (
    <div className="plan-page">
      {/* LEFT PANE: Control Dial */}
      <div className="plan-wizard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", letterSpacing: "0.1em", color: "var(--dim)" }}>
            PLAN / STEP {s.step + 1} OF 5
          </div>
          {/* Language toggle */}
          <div style={{ display: "flex", gap: 2 }}>
            {(["en", "th", "zh"] as const).map((l) => (
              <button
                key={l}
                onClick={() => s.setLang(l)}
                style={{
                  fontFamily: "var(--font-mono)", 
                  fontSize: "var(--text-micro)",
                  color: s.lang === l ? "var(--amber-nav)" : "var(--dim)",
                  background: "transparent",
                  border: "1px solid",
                  borderColor: s.lang === l ? "var(--amber-nav)" : "transparent",
                  padding: "4px 8px", 
                  minHeight: 32,
                  cursor: "pointer", 
                  fontWeight: s.lang === l ? 700 : 400,
                }}
              >
                {l === "en" ? "EN" : l === "th" ? "TH" : "ZH"}
              </button>
            ))}
          </div>
        </div>

        {/* Stepper Dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
          {STEPS.map(step => (
            <button
              key={step.id}
              onClick={() => s.setStep(step.id)}
              style={{
                flex: 1,
                height: 3,
                background: s.step >= step.id ? "var(--amber-nav)" : "var(--line)",
                cursor: "pointer",
                transition: "background 0.3s var(--ease)",
                border: "none",
                padding: 0
              }}
              title={step.label}
              aria-label={step.label}
            />
          ))}
        </div>
        
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 24 }}>
          {STEPS[s.step].label}
        </div>

        {/* Input Controls based on step */}
        <PlanControls s={s} />

      </div>
      
      {/* RIGHT PANE: Readout Screen */}
      <div className="plan-context">
         {s.step === 0 && <PlanHero lang={s.lang} onBegin={() => s.setStep(1)} />}
         
         {s.step === 1 && (
           <div style={{ maxWidth: 860, margin: "0 auto", width: "100%", paddingBottom: 64 }}>
              <TimeAnchorSection
                lang={s.lang}
                geo={s.geo}
                age={s.age}
                retireAge={s.retireAge}
              />
              <AgeLens
                lang={s.lang}
                age={s.age}
                retireAge={s.retireAge}
                salary={s.salary}
                yearsToRetire={s.yearsToRetire}
                yearsPostRetire={s.yearsPostRetire}
                currency={s.geoConfig.currency}
              />
           </div>
         )}
         
         {s.step === 2 && (
           <div style={{ maxWidth: 860, margin: "0 auto", width: "100%", paddingBottom: 64 }}>
              <EarningsProjectionSection
                lang={s.lang}
                geo={s.geo}
                salary={s.salary}
                salaryGrowth={s.salaryGrowth}
                yearsToRetire={s.yearsToRetire}
                stabilityFactor={s.stabilityFactor}
                earningsRaw={s.earningsRaw}
                earningsReal={s.earningsReal}
                earningsStable={s.earningsStable}
                investable={s.investable}
              />
              <SavingsPileSection
                lang={s.lang}
                geo={s.geo}
                salary={s.salary}
                salaryGrowth={s.salaryGrowth}
                yearsToRetire={s.yearsToRetire}
                savingsRate={s.savingsRate}
                monthlySaved={s.monthlySaved}
                currentSavings={s.currentSavings}
                totalPile={s.totalPile}
                savingsSnaps={s.savingsSnaps}
                earningsStable={s.earningsStable}
              />
           </div>
         )}
         
         {s.step === 3 && (
           <div style={{ maxWidth: 860, margin: "0 auto", width: "100%", paddingBottom: 64 }}>
              <RetirementNeedsSection
                lang={s.lang}
                geo={s.geo}
                activeNeedsMonthly={s.activeNeedsMonthly}
                healthcareMonthly={s.healthcareMonthly}
                mortgageMonthly={s.mortgageMonthly}
                retirementMonthlyNeed={s.retirementMonthlyNeed}
                retirementTarget={s.retirementTarget}
                yearsPostRetire={s.yearsPostRetire}
              />
              <SafetyMarginSection
                lang={s.lang}
                geo={s.geo}
                totalPile={s.totalPile}
                retirementTarget={s.retirementTarget}
                safety={s.safety}
                yearsToRetire={s.yearsToRetire}
                monthlySaved={s.monthlySaved}
              />
           </div>
         )}
         
         {s.step === 4 && (
           <div style={{ maxWidth: 860, margin: "0 auto", width: "100%", paddingBottom: 64 }}>
              <AssetAllocatorSection
                lang={s.lang}
                geo={s.geo}
                age={s.age}
                retireAge={s.retireAge}
                jobStability={s.jobStability}
                investable={s.investable}
                retirementTarget={s.retirementTarget}
                alloc={s.alloc}
                scenarios={s.scenarios}
                onRestart={s.restart}
              />
           </div>
         )}
      </div>
    </div>
  );
}
