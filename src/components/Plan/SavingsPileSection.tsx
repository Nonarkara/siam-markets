"use client";

import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { type Lang, type GeoKey, COPY, fmtC } from "./plan-data";

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

export function SavingsPileSection({
  lang,
  geo,
  salary,
  salaryGrowth,
  yearsToRetire,
  savingsRate,
  monthlySaved,
  currentSavings,
  totalPile,
  savingsSnaps,
  earningsStable,
}: {
  lang: Lang;
  geo: GeoKey;
  salary: number;
  salaryGrowth: number;
  yearsToRetire: number;
  savingsRate: number;
  monthlySaved: number;
  currentSavings: number;
  totalPile: number;
  savingsSnaps: number[];
  earningsStable: number;
}) {
  const C = COPY.salary[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const pileDisplay = useCountUp(totalPile, 1.2);
  const earnDisplay = useCountUp(earningsStable, 1.0);
  const ratePct = Math.round(savingsRate * 100);

  // Build year-by-year bars for the pile
  const bars = useMemo(() => {
    const maxVal = Math.max(...savingsSnaps, 1);
    return savingsSnaps.map((val, i) => ({
      year: i,
      val,
      h: Math.max(4, (val / maxVal) * 100),
      label: i === 0 ? (lang === "th" ? "ตอนนี้" : lang === "zh" ? "现在" : "Now") : i === savingsSnaps.length - 1 ? (lang === "th" ? "เกษียณ" : lang === "zh" ? "退休" : "Retire") : "",
    }));
  }, [savingsSnaps, lang]);

  // Only show every Nth bar to avoid crowding
  const visibleBars = useMemo(() => {
    if (bars.length <= 12) return bars;
    const step = Math.ceil(bars.length / 12);
    const result = bars.filter((_, i) => i === 0 || i === bars.length - 1 || i % step === 0);
    // Always include last
    if (result[result.length - 1]?.year !== bars.length - 1) result.push(bars[bars.length - 1]);
    return result;
  }, [bars]);

  return (
    <section ref={ref} className="plan-v3-section" id="plan-pile" style={{ marginTop: 40 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ marginBottom: 32 }}
      >
        <div className="plan-v3-overline">{C.overline}</div>
        <h2 className="plan-v3-h2">{C.h2}</h2>
        <p className="plan-v3-body">{C.body}</p>
      </motion.div>

      {/* Big earnings number */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{ marginBottom: 32 }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: "var(--muted)" }}>
            {fmtC(earnDisplay, geo)}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--dim)" }}>
            {C.earnSub}
          </span>
        </div>
      </motion.div>

      {/* Savings rate pill */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="plan-v3-insight-box"
        style={{ marginBottom: 28, background: "var(--bg-raised)", borderColor: "var(--line)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span className="plan-v3-stat-label">{C.savingsRateL}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: "var(--amber-nav)" }}>
            {ratePct}%
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)" }}>
          {C.savingsRateSub(ratePct, fmtC(monthlySaved, geo))}
        </div>
      </motion.div>

      {/* The Pile visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.3 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <span className="plan-v3-stat-label">{C.pileLabel}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: "var(--tech)" }}>
            {fmtC(pileDisplay, geo)}
          </span>
        </div>

        {/* Bar chart — the growing pile */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            height: 140,
            padding: "12px 8px 4px",
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
          }}
        >
          {visibleBars.map((b, i) => (
            <motion.div
              key={b.year}
              initial={{ height: 0 }}
              animate={inView ? { height: `${b.h}%` } : {}}
              transition={{ duration: 0.8, delay: 0.4 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
              style={{
                flex: 1,
                background: b.year === 0 ? "var(--caution)" : b.year === savingsSnaps.length - 1 ? "var(--tech)" : "var(--muted)",
                opacity: b.year === 0 || b.year === savingsSnaps.length - 1 ? 1 : 0.4,
                minWidth: 4,
                position: "relative",
              }}
              title={C.pileYear(b.year, fmtC(Math.round(b.val), geo))}
            >
              {b.label && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -18,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--dim)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {b.label}
                </span>
              )}
            </motion.div>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 22, lineHeight: 1.5 }}>
          {C.pileSub}
        </p>
      </motion.div>

      {/* Current savings note */}
      {currentSavings > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", marginBottom: 12 }}
        >
          {lang === "th"
            ? `รวมเงินที่มีอยู่แล้ว ${fmtC(currentSavings, geo)} + ออมใหม่ ${fmtC(totalPile - currentSavings, geo)}`
            : lang === "zh"
            ? `包括已有储蓄 ${fmtC(currentSavings, geo)} + 新储蓄 ${fmtC(totalPile - currentSavings, geo)}`
            : `Includes what you already have: ${fmtC(currentSavings, geo)} + new savings: ${fmtC(totalPile - currentSavings, geo)}`}
        </motion.div>
      )}
    </section>
  );
}
