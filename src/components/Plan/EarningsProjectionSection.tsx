"use client";

import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { type Lang, type GeoKey, COPY, fmtC, MED_INFLATION } from "./plan-data";

/* Desktop-only teaching copy (the maths made visible) */
const TEACH = {
  en: {
    title: "HOW THIS IS CALCULATED",
    f1L: "1 · NOMINAL", f1n: (g: number) => `Your salary compounds at ${g}%/yr. Add up every paycheck across your working life.`,
    f2L: "2 · REAL", f2n: (i: number) => `Inflation (~${i}%/yr) quietly erodes it — the same baht buys less each year, so we discount future income back to today.`,
    f3L: "3 · VUCA HAIRCUT", f3n: (h: number) => `The real world isn't smooth — layoffs, gaps, downturns. We cut ${h}% off for that volatility, uncertainty, complexity, ambiguity.`,
    tH: ["YR", "SALARY/MO", "NOMINAL", "REAL"],
  },
  th: {
    title: "คำนวณอย่างไร",
    f1L: "1 · ตามตัวเลข", f1n: (g: number) => `เงินเดือนโตทบต้น ${g}%/ปี รวมทุกเดือนตลอดชีวิตการทำงาน`,
    f2L: "2 · มูลค่าจริง", f2n: (i: number) => `เงินเฟ้อ (~${i}%/ปี) กัดกินเงียบๆ เงินเท่าเดิมซื้อของได้น้อยลงทุกปี เราจึงทอนกลับมาเป็นค่าวันนี้`,
    f3L: "3 · หัก VUCA", f3n: (h: number) => `โลกจริงไม่ราบเรียบ — ตกงาน ช่องว่าง ภาวะถดถอย เราหัก ${h}% สำหรับความผันผวน ไม่แน่นอน ซับซ้อน คลุมเครือ`,
    tH: ["ปี", "เดือน", "ตามตัว", "จริง"],
  },
  zh: {
    title: "如何计算",
    f1L: "1 · 名义", f1n: (g: number) => `工资以每年 ${g}% 复利增长。把工作期内每笔薪水加总。`,
    f2L: "2 · 实际", f2n: (i: number) => `通胀（约 ${i}%/年）悄悄侵蚀——同样的钱越来越不值钱，故将未来收入折回今天。`,
    f3L: "3 · VUCA 折减", f3n: (h: number) => `现实并不平滑——裁员、空窗、衰退。为这种波动/不确定/复杂/模糊，我们折减 ${h}%。`,
    tH: ["年", "月薪", "名义", "实际"],
  },
} as const;

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

export function EarningsProjectionSection({
  lang,
  geo,
  salary,
  salaryGrowth,
  yearsToRetire,
  stabilityFactor,
  earningsRaw,
  earningsReal,
  earningsStable,
  investable,
}: {
  lang: Lang;
  geo: GeoKey;
  salary: number;
  salaryGrowth: number;
  yearsToRetire: number;
  stabilityFactor: number;
  earningsRaw: number;
  earningsReal: number;
  earningsStable: number;
  investable: number;
}) {
  const C = COPY.earnings[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const rawDisplay = useCountUp(earningsRaw, 1.0);
  const realDisplay = useCountUp(earningsReal, 1.1);
  const stableDisplay = useCountUp(earningsStable, 1.2);
  const invDisplay = useCountUp(investable, 0.8);

  // Salary trajectory sparkline
  const sparkPath = useMemo(() => {
    const pts: number[] = [];
    let m = salary;
    for (let y = 0; y <= yearsToRetire; y++) {
      pts.push(m);
      m *= 1 + salaryGrowth;
    }
    const max = pts[pts.length - 1] || 1;
    const W = 300, H = 60;
    return pts.map((v, i) =>
      `${i === 0 ? "M" : "L"} ${((i / (pts.length - 1)) * W).toFixed(1)} ${(H - (v / max) * (H - 8) - 4).toFixed(1)}`
    ).join(" ");
  }, [salary, salaryGrowth, yearsToRetire]);

  // Year-by-year cumulative nominal + inflation-discounted earnings (teaching aside)
  const infl = MED_INFLATION[geo];
  const teachRows = useMemo(() => {
    const series: { y: number; sal: number; nom: number; real: number }[] = [];
    let m = salary, nom = 0, real = 0;
    for (let y = 0; y < yearsToRetire; y++) {
      nom += m * 12;
      real += (m * 12) / Math.pow(1 + infl, y);
      series.push({ y: y + 1, sal: m, nom, real });
      m *= 1 + salaryGrowth;
    }
    const idx: number[] = [];
    for (let y = 0; y < series.length; y += 5) idx.push(y);
    if (idx[idx.length - 1] !== series.length - 1) idx.push(series.length - 1);
    return idx.map((i) => series[i]);
  }, [salary, salaryGrowth, yearsToRetire, infl]);

  const TT = TEACH[lang];
  const haircut = Math.round((1 - stabilityFactor) * 100);

  return (
    <section ref={ref} className="plan-v3-section plan-v3-split" id="plan-earnings">
      <motion.div
        className="plan-v3-intro"
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ marginBottom: 40 }}
      >
        <div className="plan-v3-overline">{C.overline}</div>
        <h2 className="plan-v3-h2">{C.h2}</h2>
        <p className="plan-v3-body">{C.body}</p>
      </motion.div>

      <div className="plan-v3-main">
      {/* Three numbers side by side */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 28 }}
      >
        {[
          { label: C.rawL, val: rawDisplay, sub: C.rawSub, col: "var(--muted)" },
          { label: C.realL, val: realDisplay, sub: C.realSub, col: "var(--caution)" },
          { label: C.stableL, val: stableDisplay, sub: C.stableSub, col: "var(--tech)" },
        ].map((item) => (
          <div key={item.label} className="plan-v3-stat-card" style={{ textAlign: "center" }}>
            <div className="plan-v3-stat-label" style={{ fontSize: "var(--text-micro)", letterSpacing: "0.08em" }}>{item.label}</div>
            <div className="plan-v3-stat-num" style={{ color: item.col, fontSize: "var(--text-display)", margin: "8px 0" }}>
              {fmtC(item.val, geo)}
            </div>
            <div className="plan-v3-mono-sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: "var(--text-micro)" }}>{item.sub}</div>
          </div>
        ))}
      </motion.div>

      {/* Salary trajectory sparkline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="plan-v3-chart-box"
        style={{ marginBottom: 20 }}
      >
        <div className="plan-v3-stat-label" style={{ marginBottom: 10 }}>{C.chartLabel}</div>
        <svg viewBox="0 0 300 60" style={{ width: "100%", height: 60, display: "block" }}>
          <path d={sparkPath} fill="none" stroke="var(--tech)" strokeWidth={1.5} />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span className="plan-v3-mono-sub">{lang === "th" ? "ตอนนี้" : lang === "zh" ? "现在" : "Now"}</span>
          <span className="plan-v3-mono-sub">{lang === "th" ? "เกษียณ" : lang === "zh" ? "退休" : "Retire"}</span>
        </div>
      </motion.div>

      {/* Investable waterfall */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="plan-v3-waterfall"
        style={{ borderLeftColor: investable > 0 ? "var(--bull)" : "var(--bear)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="plan-v3-stat-label">{C.investableL}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: investable > 0 ? "var(--bull)" : "var(--bear)" }}>
            {fmtC(invDisplay, geo)}
          </span>
        </div>
      </motion.div>
      </div>{/* /plan-v3-main */}

      {/* Desktop-only teaching aside — the maths made visible */}
      <aside className="plan-v3-teach">
        <div className="plan-v3-teach-title">{TT.title}</div>

        <div className="plan-v3-formula">
          <div className="plan-v3-formula-eq">{TT.f1L} &nbsp; Σ salary·(1+{(salaryGrowth * 100).toFixed(0)}%)<sup>y</sup> · 12 = {fmtC(earningsRaw, geo)}</div>
          <div className="plan-v3-formula-note">{TT.f1n(Math.round(salaryGrowth * 100))}</div>
        </div>
        <div className="plan-v3-formula">
          <div className="plan-v3-formula-eq">{TT.f2L} &nbsp; ÷ (1+{(infl * 100).toFixed(1)}%)<sup>y</sup> = {fmtC(earningsReal, geo)}</div>
          <div className="plan-v3-formula-note">{TT.f2n(Number((infl * 100).toFixed(1)))}</div>
        </div>
        <div className="plan-v3-formula">
          <div className="plan-v3-formula-eq">{TT.f3L} &nbsp; × {stabilityFactor.toFixed(2)} = {fmtC(earningsStable, geo)}</div>
          <div className="plan-v3-formula-note">{TT.f3n(haircut)}</div>
        </div>

        <table className="plan-v3-yr-table">
          <thead>
            <tr>{TT.tH.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {teachRows.map((r) => (
              <tr key={r.y}>
                <td>{r.y}</td>
                <td>{fmtC(Math.round(r.sal), geo)}</td>
                <td>{fmtC(Math.round(r.nom), geo)}</td>
                <td style={{ color: "var(--caution)" }}>{fmtC(Math.round(r.real), geo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>
    </section>
  );
}
