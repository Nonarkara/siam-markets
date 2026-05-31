"use client";

import { useRef, useState, useMemo } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  type Lang,
  type GeoKey,
  type Allocation6,
  type ScenarioResult,
  COPY,
  fmtC,
  BUCKET_META,
  RISK_PRESETS,
  suggestPreset,
} from "./plan-data";

function useCountUp(target: number, duration = 1.2) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return display;
}

import React from "react";

/* Desktop-only teaching copy — reading the three futures + what drags savings down */
const TEACH_A = {
  en: {
    title: "READING THE THREE FUTURES",
    intro: "Same plan, three economies. You don't get to choose which one you're born into — that uncertainty is the VUCA world, and it's why the spread is wide.",
    worst: "WORST — recession-heavy cycle, crashes near your retirement",
    base: "BASE — a mixed cycle, booms and busts averaging out",
    best: "GROWTH — sustained expansion, few deep drawdowns",
    spread: "SPREAD",
    drag: "WHAT DRAGS IT DOWN",
    dragNote: "Inflation erodes purchasing power. A crash in your final years hurts far more than one early — there's no time to recover. More equities/derivatives widen both the upside and the hole.",
    buckets: "WHAT EACH BUCKET DOES",
  },
  th: {
    title: "อ่านสามอนาคต",
    intro: "แผนเดียวกัน สามเศรษฐกิจ คุณเลือกไม่ได้ว่าจะเกิดมาเจอแบบไหน — ความไม่แน่นอนนั้นคือโลก VUCA และเป็นเหตุผลที่ช่วงผลลัพธ์กว้าง",
    worst: "แย่สุด — วัฏจักรถดถอย วิกฤตใกล้เกษียณ",
    base: "ฐาน — วัฏจักรผสม รุ่งและร่วงเฉลี่ยกัน",
    best: "เติบโต — ขยายตัวต่อเนื่อง ร่วงลึกน้อย",
    spread: "ช่วงห่าง",
    drag: "อะไรฉุดมันลง",
    dragNote: "เงินเฟ้อกัดกินกำลังซื้อ วิกฤตในปีท้ายๆ เจ็บกว่าช่วงต้นมาก เพราะไม่มีเวลาฟื้น ยิ่งถือหุ้น/อนุพันธ์มาก ยิ่งเปิดทั้งด้านบวกและหลุมลึก",
    buckets: "แต่ละถังทำอะไร",
  },
  zh: {
    title: "解读三种未来",
    intro: "同一个计划，三种经济。你无法选择生在哪一种——这种不确定就是 VUCA 世界，也是结果区间很宽的原因。",
    worst: "最差 — 衰退型周期，临退休时崩盘",
    base: "基准 — 混合周期，繁荣与萧条相抵",
    best: "增长 — 持续扩张，深度回撤少",
    spread: "区间",
    drag: "什么拖低了它",
    dragNote: "通胀侵蚀购买力。临近退休的崩盘远比早年的更痛——没有时间恢复。股票/衍生品越多，上行与坑都越大。",
    buckets: "每个桶的作用",
  },
} as const;

/* ─── Rebalancer: adjust one bucket, redistribute others proportionally ─────── */
function setBucket6(alloc: Allocation6, key: keyof Allocation6, raw: number): Allocation6 {
  const nv = Math.max(0, Math.min(100, Math.round(raw)));
  const others = (Object.keys(alloc) as (keyof Allocation6)[]).filter((k) => k !== key);
  const otherSum = others.reduce((s, k) => s + alloc[k], 0);
  const delta = nv - alloc[key];
  const next: Allocation6 = { ...alloc, [key]: nv };
  if (otherSum === 0) {
    const split = (100 - nv) / others.length;
    others.forEach((k) => { next[k] = split; });
  } else {
    others.forEach((k) => { next[k] = Math.max(0, alloc[k] - (delta * alloc[k]) / otherSum); });
  }
  const r: Allocation6 = { saving: 0, mm: 0, cm: 0, dv: 0, self: 0, people: 0 };
  (Object.keys(alloc) as (keyof Allocation6)[]).forEach((k) => { r[k] = Math.round(next[k]); });
  const total = Object.values(r).reduce((s, v) => s + v, 0);
  if (total !== 100) {
    // Fix rounding by adjusting the largest bucket
    const fix = (Object.keys(r) as (keyof Allocation6)[]).reduce((a, b) => (r[a] >= r[b] ? a : b));
    r[fix] = Math.max(0, r[fix] + (100 - total));
  }
  return r;
}

/* ─── Dual Gravity Chart: worst / base / best on one canvas ─────────────────── */
function DualGravityChart({
  scenarios,
  retirementTarget,
  yearsToRetire,
  lang,
}: {
  scenarios: { worst: ScenarioResult; base: ScenarioResult; best: ScenarioResult };
  retirementTarget: number;
  yearsToRetire: number;
  lang: Lang;
}) {
  const W = 400, H = 180;
  const allV = [
    ...scenarios.worst.series.map((s) => s.value),
    ...scenarios.base.series.map((s) => s.value),
    ...scenarios.best.series.map((s) => s.value),
    retirementTarget,
  ];
  const maxV = Math.max(...allV, 1);
  const toX = (i: number) => (i / Math.max(1, yearsToRetire)) * W;
  const toY = (v: number) => H - (Math.min(v, maxV * 1.05) / (maxV * 1.05)) * (H - 10) - 5;

  const makePath = (series: ScenarioResult["series"]) =>
    series.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");

  const tY = toY(retirementTarget);

  return (
    <div className="plan-v3-chart-box">
      <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
        {[
          { color: scenarios.worst.color, label: scenarios.worst.label },
          { color: scenarios.base.color, label: scenarios.base.label },
          { color: scenarios.best.color, label: scenarios.best.label },
          { color: "var(--caution)", label: lang === "th" ? "เป้าหมาย" : lang === "zh" ? "目标" : "Target", dashed: true },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width={20} height={6} viewBox="0 0 20 6" aria-hidden>
              {"dashed" in item && item.dashed ? (
                <line x1={0} y1={3} x2={20} y2={3} stroke={item.color} strokeWidth={1.5} strokeDasharray="4 3" />
              ) : (
                <line x1={0} y1={3} x2={20} y2={3} stroke={item.color} strokeWidth={2} />
              )}
            </svg>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.06em" }}>{item.label}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
        {retirementTarget > 0 && <line x1={0} y1={tY} x2={W} y2={tY} stroke="var(--caution)" strokeWidth={1} strokeDasharray="6 4" />}
        <path d={makePath(scenarios.worst.series)} fill="none" stroke={scenarios.worst.color} strokeWidth={1.5} opacity={0.6} />
        <path d={makePath(scenarios.base.series)} fill="none" stroke={scenarios.base.color} strokeWidth={2} />
        <path d={makePath(scenarios.best.series)} fill="none" stroke={scenarios.best.color} strokeWidth={1.5} opacity={0.6} />
        {/* End dots */}
        {scenarios.base.series.length > 0 && (
          <circle cx={toX(yearsToRetire)} cy={toY(scenarios.base.series[scenarios.base.series.length - 1].value)} r={4} fill={scenarios.base.color} />
        )}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span className="plan-v3-mono-sub">{lang === "th" ? "วันนี้" : lang === "zh" ? "今天" : "Today"}</span>
        <span className="plan-v3-mono-sub">{lang === "th" ? "เกษียณ" : lang === "zh" ? "退休" : "Retire"}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export function AssetAllocatorControl({
  lang,
  geo,
  age,
  jobStability,
  alloc,
  setAlloc,
}: {
  lang: Lang;
  geo: GeoKey;
  age: number;
  jobStability: number;
  alloc: Allocation6;
  setAlloc: (a: Allocation6) => void;
}) {
  const C = COPY.allocator[lang];
  const suggested = useMemo(() => suggestPreset(age, jobStability), [age, jobStability]);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);

  return (
    <div className="plan-v3-allocator-controls">
      {/* Risk profile presets */}
      <div style={{ marginBottom: 28 }}>
        <div className="plan-v3-stat-label" style={{ marginBottom: 10 }}>{C.presetL}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 6 }}>
          {RISK_PRESETS.map((preset) => {
            const isSuggested = suggested?.key === preset.key;
            const isActive =
              alloc.saving === preset.alloc.saving &&
              alloc.mm === preset.alloc.mm &&
              alloc.cm === preset.alloc.cm &&
              alloc.dv === preset.alloc.dv &&
              alloc.self === preset.alloc.self &&
              alloc.people === preset.alloc.people;
            return (
              <button
                key={preset.key}
                onClick={() => setAlloc(preset.alloc)}
                style={{
                  padding: "12px 10px",
                  background: isActive ? "color-mix(in srgb, var(--caution) 10%, var(--bg-raised))" : "var(--bg-raised)",
                  border: `1px solid ${isActive ? "var(--caution)" : isSuggested ? "var(--tech)" : "var(--line)"}`,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: isActive ? "var(--caution)" : "var(--ink)", letterSpacing: "0.06em" }}>
                    {preset.label[lang]}
                  </span>
                  {isSuggested && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--tech)", background: "color-mix(in srgb, var(--tech) 12%, transparent)", padding: "2px 5px" }}>
                      {C.suggested}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.4, textTransform: "none", letterSpacing: 0 }}>
                  {preset.rationale[lang]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6-bucket allocator */}
      <div>
        <div className="plan-v3-stat-label" style={{ marginBottom: 12 }}>{C.bucketL}</div>
        {BUCKET_META.map((b) => {
          const val = alloc[b.key];
          const isOpen = expandedBucket === b.key;
          return (
            <div key={b.key} style={{ borderTop: "1px solid var(--line)" }}>
              <button
                onClick={() => setExpandedBucket(isOpen ? null : b.key)}
                style={{
                  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", background: "transparent", border: "none", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: b.color, letterSpacing: "0.08em" }}>
                    {b.label[lang]}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>{b.returnNote[lang]}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: b.color }}>
                  {val}%
                </span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 0 14px" }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5, margin: "0 0 10px", textTransform: "none", letterSpacing: 0 }}>
                        {b.desc[lang]}
                      </p>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={val}
                        onChange={(e) => setAlloc(setBucket6(alloc, b.key, Number(e.target.value)))}
                        style={{ width: "100%", accentColor: b.color, cursor: "pointer", minHeight: 44 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {/* Sum bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <span className="plan-v3-stat-label">{lang === "th" ? "รวม" : lang === "zh" ? "合计" : "SUM"}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: Object.values(alloc).reduce((s, v) => s + v, 0) === 100 ? "var(--bull)" : "var(--bear)" }}>
            {Object.values(alloc).reduce((s, v) => s + v, 0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function AssetAllocatorSection({
  lang,
  geo,
  age,
  retireAge,
  jobStability,
  investable,
  retirementTarget,
  alloc,
  scenarios,
  onRestart,
}: {
  lang: Lang;
  geo: GeoKey;
  age: number;
  retireAge: number;
  jobStability: number;
  investable: number;
  retirementTarget: number;
  alloc: Allocation6;
  scenarios: { worst: ScenarioResult; base: ScenarioResult; best: ScenarioResult };
  onRestart: () => void;
}) {
  const C = COPY.allocator[lang];
  const TA = TEACH_A[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const baseFinal = scenarios.base.finalValue;
  const readiness = retirementTarget > 0 ? Math.min(200, Math.round((baseFinal / retirementTarget) * 100)) : 0;
  const readColor = baseFinal >= retirementTarget ? "var(--bull)" : readiness > 60 ? "var(--caution)" : "var(--bear)";

  const readDisplay = useCountUp(readiness, 1.2);
  const finalDisplay = useCountUp(baseFinal, 1.0);

  const gap = retirementTarget - baseFinal;
  const onTrack = baseFinal >= retirementTarget;

  return (
    <section ref={ref} className="plan-v3-section plan-v3-split" id="plan-allocator">
      <div className="plan-v3-main">
      {/* Gap banner */}
      {retirementTarget > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            padding: "16px 20px", marginBottom: 24, textAlign: "center",
            border: `1px solid ${onTrack ? "var(--bull)" : "var(--bear)"}`,
            background: `color-mix(in srgb, ${onTrack ? "var(--bull)" : "var(--bear)"} 7%, transparent)`,
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: onTrack ? "var(--bull)" : "var(--bear)" }}>
            {onTrack
              ? `${lang === "th" ? "✓ เกินมา" : lang === "zh" ? "✓ 超出" : "✓ Ahead by"} ${fmtC(Math.abs(gap), geo)}`
              : `${lang === "th" ? "✗ ขาดอยู่" : lang === "zh" ? "✗ 还差" : "✗ Short by"} ${fmtC(Math.abs(gap), geo)}`}
          </div>
        </motion.div>
      )}

      {/* Scenario comparison chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{ marginBottom: 24 }}
      >
        <div className="plan-v3-stat-label" style={{ marginBottom: 10 }}>{C.scenarioL}</div>
        <DualGravityChart scenarios={scenarios} retirementTarget={retirementTarget} yearsToRetire={Math.max(1, retireAge - age)} lang={lang} />
      </motion.div>

      {/* Readiness score */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="plan-v3-readiness-card"
        style={{ marginBottom: 20 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span className="plan-v3-stat-label">{C.readinessL}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: readColor }}>
            {readDisplay}%
          </span>
        </div>
        <div className="plan-readiness-track">
          <motion.div
            className="plan-readiness-fill"
            style={{ background: readColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, readiness)}%` }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <div>
            <div className="plan-v3-stat-label" style={{ marginBottom: 4 }}>{lang === "th" ? "ประมาณการ" : lang === "zh" ? "预测" : "Projected"}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: readColor }}>
              {fmtC(finalDisplay, geo)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="plan-v3-stat-label" style={{ marginBottom: 4 }}>{lang === "th" ? "เป้าหมาย" : lang === "zh" ? "目标" : "Target"}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: "var(--caution)" }}>
              {fmtC(retirementTarget, geo)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{ marginBottom: 32 }}
      >
        <div className="plan-v3-stat-label" style={{ marginBottom: 14 }}>{C.actionsL}</div>
        {[
          lang === "th"
            ? `เปิดบัญชีหุ้นหรือกองทุน เริ่มต้นด้วย ${fmtC(Math.max(5000, Math.round(investable * 0.5)), geo)}`
            : lang === "zh"
            ? `开设证券或基金账户，从 ${fmtC(Math.max(5000, Math.round(investable * 0.5)), geo)} 开始`
            : `Open a brokerage or fund account. Start with ${fmtC(Math.max(5000, Math.round(investable * 0.5)), geo)}.`,
          lang === "th"
            ? `ตั้งโอนอัตโนมัติ ${fmtC(investable, geo)}/เดือน วันเงินเดือนออก ห้ามแตะ`
            : lang === "zh"
            ? `发薪日自动转账 ${fmtC(investable, geo)}/月。别碰它。`
            : `Auto-transfer ${fmtC(investable, geo)}/mo on salary day. Don't touch it.`,
          lang === "th"
            ? "ทบทวนทุก 12 เดือน ปรับสมดุล แล้วลืมมันไป"
            : lang === "zh"
            ? "每12个月回顾。再平衡。然后忘掉它。"
            : "Review every 12 months. Rebalance. Then forget it.",
        ].map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            className="plan-action-step"
            style={{ display: "flex", gap: 14, padding: "14px 16px", marginBottom: 8, background: "var(--bg-raised)", border: "1px solid var(--line)", alignItems: "flex-start" }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: "var(--caution)", flexShrink: 0, paddingTop: 1, minWidth: 28 }}>
              0{i + 1}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.6 }}>
              {action}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Restart + disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <button onClick={onRestart} className="plan-v3-restart-btn" style={{ width: "100%" }}>
          {C.restart}
        </button>
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)", fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.6, textTransform: "none", letterSpacing: 0, fontStyle: "italic" }}>
          {C.disc}
        </div>
      </motion.div>
      </div>{/* /plan-v3-main */}

      {/* Desktop-only teaching aside — reading the scenarios + the VUCA drag */}
      <aside className="plan-v3-teach">
        <div className="plan-v3-teach-title">{TA.title}</div>
        <p className="plan-v3-formula-note" style={{ marginTop: 0, marginBottom: 16 }}>{TA.intro}</p>

        {/* The three final values + spread */}
        {([
          { c: scenarios.best.color, label: TA.best, v: scenarios.best.finalValue },
          { c: scenarios.base.color, label: TA.base, v: scenarios.base.finalValue },
          { c: scenarios.worst.color, label: TA.worst, v: scenarios.worst.finalValue },
        ]).map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.4 }}>{row.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: row.c, flexShrink: 0 }}>{fmtC(row.v, geo)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 16px" }}>
          <span className="plan-v3-stat-label">{TA.spread}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: "var(--ink)" }}>
            {fmtC(Math.max(0, scenarios.best.finalValue - scenarios.worst.finalValue), geo)}
          </span>
        </div>

        {/* What drags it down */}
        <div className="plan-v3-formula">
          <div className="plan-v3-formula-eq" style={{ color: "var(--bear)" }}>{TA.drag}</div>
          <div className="plan-v3-formula-note">{TA.dragNote}</div>
        </div>

        {/* Bucket roles */}
        <div className="plan-v3-teach-title" style={{ marginTop: 18 }}>{TA.buckets}</div>
        {BUCKET_META.map((b) => (
          <div key={b.key} style={{ padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: b.color, letterSpacing: "0.06em" }}>{b.label[lang]}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", flexShrink: 0 }}>{b.returnNote[lang]}</span>
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.45, marginTop: 3 }}>{b.desc[lang]}</div>
          </div>
        ))}
      </aside>
    </section>
  );
}
