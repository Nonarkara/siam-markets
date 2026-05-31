"use client";

import { GEOS } from "./plan-data";
import type { Lang, GeoKey } from "./plan-data";
import { COPY } from "./plan-data";
import { usePlanState } from "./use-plan-state";
import { MaslowPyramidControl } from "./plan-sections";
import { AssetAllocatorControl } from "./AssetAllocatorSection";
import { logAppEvent } from "@/lib/firebase/client";

export function PlanControls({ s }: { s: ReturnType<typeof usePlanState> }) {
  const C_TIME = COPY.time[s.lang];
  const C_SALARY = COPY.salary[s.lang];
  const C_NEEDS = COPY.needs[s.lang];

  const handleNextStep = (nextStep: number) => {
    logAppEvent("plan_step_completed", { step: s.step, next_step: nextStep });
    s.setStep(nextStep);
  };

  if (s.step === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <h2 className="t-display" style={{ fontSize: 24, lineHeight: 1.2 }}>
          {s.lang === "th" ? "คุณเคยคิดไหมว่า จะทำอะไรเมื่อเกษียณ?" : s.lang === "zh" ? "你有没有想过退休后要做什么？" : "Have you ever thought about what you will do when you retire?"}
        </h2>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          {s.lang === "th" ? "การวางแผนไม่ใช่เรื่องของการพยากรณ์อนาคต แต่เป็นการเตรียมตัวรับมือกับมัน." : s.lang === "zh" ? "计划不是预测未来，而是为之做准备。" : "Planning is not about predicting the future, but preparing for it."}
        </p>
        <button
          onClick={() => handleNextStep(1)}
          className="btn-primary"
          style={{ alignSelf: "flex-start", marginTop: 16 }}
        >
          {s.lang === "th" ? "เริ่มต้น" : s.lang === "zh" ? "开始" : "BEGIN"}
        </button>
      </div>
    );
  }

  if (s.step === 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>REGION</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.entries(GEOS) as [GeoKey, any][]).map(([k, cfg]) => (
              <button
                key={k}
                onClick={() => s.setGeo(k)}
                className={`chip ${s.geo === k ? "active" : ""}`}
                style={{ 
                  borderColor: s.geo === k ? "var(--amber-nav)" : "var(--line)",
                  color: s.geo === k ? "var(--amber-nav)" : "var(--dim)",
                }}
              >
                {cfg.flag} {cfg.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{C_TIME.yourAge}</div>
          <div className="t-display" style={{ fontSize: 28, color: "var(--caution)", marginBottom: 12 }}>{s.age}</div>
          <input
            type="range"
            min={18} max={80} step={1}
            value={s.age}
            onChange={(e) => s.setAge(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--caution)" }}
          />
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{C_TIME.retireAt}</div>
          <div className="t-display" style={{ fontSize: 28, marginBottom: 12 }}>{s.retireAge}</div>
          <input
            type="range"
            min={45} max={75} step={1}
            value={s.retireAge}
            onChange={(e) => s.setRetireAge(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--amber-nav)" }}
          />
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>JOB STABILITY</div>
          <input
            type="range"
            min={1} max={5} step={1}
            value={s.jobStability}
            onChange={(e) => s.setJobStability(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--tech)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>Low</span>
            <span className="t-micro" style={{ color: "var(--dim)" }}>High</span>
          </div>
        </div>

        <button onClick={() => handleNextStep(2)} className="btn-secondary" style={{ alignSelf: "flex-end" }}>
          NEXT
        </button>
      </div>
    );
  }

  if (s.step === 2) {
    const savPct = Math.round(s.savingsRate * 100);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Income */}
        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{C_SALARY.income} / MO</div>
          <div className="t-display" style={{ fontSize: 24, marginBottom: 12, color: "var(--ink)" }}>
            {GEOS[s.geo].currency}{s.salary.toLocaleString()}
          </div>
          <input
            type="range"
            min={0} max={s.geoConfig.salaryMax} step={Math.max(500, s.geoConfig.salaryMax / 400)}
            value={s.salary}
            onChange={(e) => s.setSalary(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--amber-nav)" }}
          />
        </div>

        {/* Savings Rate — the key new control */}
        <div className="card" style={{ padding: 16, borderColor: "var(--amber-nav)" }}>
          <div className="t-micro" style={{ color: "var(--amber-nav)", marginBottom: 12 }}>{C_SALARY.savingsRateL}</div>
          <div className="t-display" style={{ fontSize: 32, marginBottom: 12, color: "var(--amber-nav)" }}>
            {savPct}%
          </div>
          <input
            type="range"
            min={0} max={100} step={5}
            value={savPct}
            onChange={(e) => s.setSavingsRate(+e.target.value / 100)}
            style={{ width: "100%", accentColor: "var(--amber-nav)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>0%</span>
            <span className="t-micro" style={{ color: "var(--amber-nav)", fontWeight: 700 }}>
              {GEOS[s.geo].currency}{Math.round(s.monthlySaved).toLocaleString()}/mo
            </span>
            <span className="t-micro" style={{ color: "var(--dim)" }}>100%</span>
          </div>
        </div>

        {/* Current Savings */}
        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{C_SALARY.currentSavingsL}</div>
          <div className="t-display" style={{ fontSize: 24, marginBottom: 12, color: "var(--tech)" }}>
            {GEOS[s.geo].currency}{s.currentSavings.toLocaleString()}
          </div>
          <input
            type="range"
            min={0} max={Math.max(5_000_000, s.geoConfig.salaryMax * 24)} step={Math.max(1000, s.geoConfig.salaryMax / 100)}
            value={s.currentSavings}
            onChange={(e) => s.setCurrentSavings(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--tech)" }}
          />
        </div>

        {/* Salary Growth */}
        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{C_SALARY.growth} / YR</div>
          <div className="t-display" style={{ fontSize: 24, marginBottom: 12, color: "var(--ink)" }}>
            {(s.salaryGrowth * 100).toFixed(1)}%
          </div>
          <input
            type="range"
            min={0} max={0.15} step={0.005}
            value={s.salaryGrowth}
            onChange={(e) => s.setSalaryGrowth(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--amber-nav)" }}
          />
        </div>

        {/* Expenses (collapsed but editable) */}
        <div className="card" style={{ padding: 16, opacity: 0.8 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>EXPENSES / MO</div>
          
          <div style={{ marginBottom: 12 }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>{C_SALARY.livingL}</div>
            <input type="range" min={0} max={s.geoConfig.livingMax} step={100} value={s.living} onChange={(e) => s.setLiving(+e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>{C_SALARY.transportL}</div>
            <input type="range" min={0} max={s.geoConfig.transportMax} step={100} value={s.transport} onChange={(e) => s.setTransport(+e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>{C_SALARY.otherL}</div>
            <input type="range" min={0} max={s.geoConfig.otherMax} step={100} value={s.other} onChange={(e) => s.setOther(+e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
           <button onClick={() => handleNextStep(1)} className="btn-secondary" style={{ opacity: 0.5 }}>BACK</button>
           <button onClick={() => handleNextStep(3)} className="btn-secondary">NEXT</button>
        </div>
      </div>
    );
  }

  if (s.step === 3) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <p className="t-body" style={{ color: "var(--muted)", marginBottom: 8 }}>
          {s.lang === "th" ? "กำหนดค่าใช้จ่ายรายเดือนหลังเกษียณ" : s.lang === "zh" ? "设定退休后的每月开支" : "Set your monthly retirement expenses"}
        </p>

        {/* Base needs from Maslow */}
        <MaslowPyramidControl
          lang={s.lang}
          geo={s.geo}
          needs={s.needs}
          setNeeds={s.setNeeds}
        />

        {/* Healthcare buffer */}
        <div className="card" style={{ padding: 16, marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>{C_NEEDS.healthL}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--caution)" }}>
              {GEOS[s.geo].currency}{s.healthcareMonthly.toLocaleString()}/mo
            </span>
          </div>
          <input
            type="range"
            min={0} max={s.geoConfig.needsMax[1]} step={Math.max(100, s.geoConfig.needsMax[1] / 200)}
            value={s.healthcareMonthly}
            onChange={(e) => s.setHealthcareMonthly(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--caution)" }}
          />
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 6, lineHeight: 1.4 }}>
            {s.lang === "th" ? "นอกเหนือจาก 30 บาทรักษาทุกโรค — ยา ฟัน ตรวจสุขภาพ" : s.lang === "zh" ? "超出基本医保的部分——药品、牙科、体检" : "Beyond basic universal care — medicine, dental, checkups"}
          </p>
        </div>

        {/* Mortgage/debt */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>{C_NEEDS.debtL}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--bear)" }}>
              {GEOS[s.geo].currency}{s.mortgageMonthly.toLocaleString()}/mo
            </span>
          </div>
          <input
            type="range"
            min={0} max={s.geoConfig.needsMax[0]} step={Math.max(100, s.geoConfig.needsMax[0] / 200)}
            value={s.mortgageMonthly}
            onChange={(e) => s.setMortgageMonthly(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--bear)" }}
          />
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 6, lineHeight: 1.4 }}>
            {s.lang === "th" ? "ผ่อนบ้าน ผ่อนรถ หนี้ที่ยังต้องใช้หลังเกษียณ" : s.lang === "zh" ? "退休后仍需支付的房贷、车贷或其他债务" : "House, car, or other debt you'll still pay after retiring"}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
           <button onClick={() => handleNextStep(2)} className="btn-secondary" style={{ opacity: 0.5 }}>BACK</button>
           <button onClick={() => handleNextStep(4)} className="btn-secondary">NEXT</button>
        </div>
      </div>
    );
  }

  if (s.step === 4) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <p className="t-body" style={{ color: "var(--muted)", marginBottom: 16 }}>
          {s.lang === "th" ? "ปรับสมดุลพอร์ตการลงทุนของคุณ" : "Rebalance your investment portfolio."}
        </p>
        
        <AssetAllocatorControl
          lang={s.lang}
          geo={s.geo}
          age={s.age}
          jobStability={s.jobStability}
          alloc={s.alloc}
          setAlloc={s.setAlloc}
        />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
           <button onClick={() => handleNextStep(3)} className="btn-secondary" style={{ opacity: 0.5 }}>BACK</button>
           <button onClick={() => {
             logAppEvent("plan_step_completed", { step: s.step, next_step: 0 });
             s.restart();
           }} className="btn-secondary" style={{ color: "var(--bear)", borderColor: "var(--bear)" }}>RESET</button>
        </div>
      </div>
    );
  }

  return null;
}
