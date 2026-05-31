"use client";

import { GEOS } from "./plan-data";
import type { Lang, GeoKey } from "./plan-data";
import { COPY } from "./plan-data";
import { usePlanState } from "./use-plan-state";
import { MaslowPyramidControl } from "./plan-sections";
import { AssetAllocatorControl } from "./AssetAllocatorSection";

export function PlanControls({ s }: { s: ReturnType<typeof usePlanState> }) {
  const C_TIME = COPY.time[s.lang];
  const C_SALARY = COPY.salary[s.lang];
  
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
          onClick={() => s.setStep(1)}
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
            min={18} max={59} step={1}
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
            min={50} max={70} step={1}
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

        <button onClick={() => s.setStep(2)} className="btn-secondary" style={{ alignSelf: "flex-end" }}>
          NEXT
        </button>
      </div>
    );
  }

  if (s.step === 2) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{C_SALARY.income} / MO</div>
          <input
            type="range"
            min={0} max={s.geoConfig.salaryMax} step={Math.max(500, s.geoConfig.salaryMax / 400)}
            value={s.salary}
            onChange={(e) => s.setSalary(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--amber-nav)" }}
          />
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{C_SALARY.growth} / YR</div>
          <input
            type="range"
            min={0} max={0.15} step={0.005}
            value={s.salaryGrowth}
            onChange={(e) => s.setSalaryGrowth(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--amber-nav)" }}
          />
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>EXPENSES / MO</div>
          
          <div style={{ marginBottom: 16 }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>{C_SALARY.livingL}</div>
            <input type="range" min={0} max={s.geoConfig.livingMax} step={100} value={s.living} onChange={(e) => s.setLiving(+e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>{C_SALARY.transportL}</div>
            <input type="range" min={0} max={s.geoConfig.transportMax} step={100} value={s.transport} onChange={(e) => s.setTransport(+e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>{C_SALARY.otherL}</div>
            <input type="range" min={0} max={s.geoConfig.otherMax} step={100} value={s.other} onChange={(e) => s.setOther(+e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
           <button onClick={() => s.setStep(1)} className="btn-secondary" style={{ opacity: 0.5 }}>BACK</button>
           <button onClick={() => s.setStep(3)} className="btn-secondary">NEXT</button>
        </div>
      </div>
    );
  }

  if (s.step === 3) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <p className="t-body" style={{ color: "var(--muted)", marginBottom: 16 }}>
          {s.lang === "th" ? "กำหนดระดับความต้องการในแต่ละเดือนหลังเกษียณ" : "Define your monthly needs after retirement."}
        </p>
        
        <MaslowPyramidControl
          lang={s.lang}
          geo={s.geo}
          needs={s.needs}
          setNeeds={s.setNeeds}
        />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
           <button onClick={() => s.setStep(2)} className="btn-secondary" style={{ opacity: 0.5 }}>BACK</button>
           <button onClick={() => s.setStep(4)} className="btn-secondary">NEXT</button>
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
           <button onClick={() => s.setStep(3)} className="btn-secondary" style={{ opacity: 0.5 }}>BACK</button>
           <button onClick={s.restart} className="btn-secondary" style={{ color: "var(--bear)", borderColor: "var(--bear)" }}>RESET</button>
        </div>
      </div>
    );
  }

  return null;
}
