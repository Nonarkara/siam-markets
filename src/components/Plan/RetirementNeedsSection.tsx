"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { type Lang, type GeoKey, COPY, fmtC, GEOS } from "./plan-data";

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

export function RetirementNeedsSection({
  lang,
  geo,
  activeNeedsMonthly,
  healthcareMonthly,
  mortgageMonthly,
  retirementMonthlyNeed,
  retirementTarget,
  yearsPostRetire,
}: {
  lang: Lang;
  geo: GeoKey;
  activeNeedsMonthly: number;
  healthcareMonthly: number;
  mortgageMonthly: number;
  retirementMonthlyNeed: number;
  retirementTarget: number;
  yearsPostRetire: number;
}) {
  const C = COPY.needs[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const g = GEOS[geo];

  const moDisplay = useCountUp(retirementMonthlyNeed, 0.8);
  const yrDisplay = useCountUp(retirementMonthlyNeed * 12, 1.0);
  const totDisplay = useCountUp(retirementTarget, 1.2);

  const items = [
    { label: C.livingL, val: activeNeedsMonthly, color: "var(--bull)" },
    { label: C.healthL, val: healthcareMonthly, color: "var(--caution)" },
    { label: C.debtL, val: mortgageMonthly, color: "var(--bear)" },
  ];

  const maxVal = Math.max(...items.map((i) => i.val), 1);

  return (
    <section ref={ref} className="plan-v3-section" id="plan-needs" style={{ marginTop: 40 }}>
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

      {/* Monthly breakdown bars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{ marginBottom: 28 }}
      >
        <div
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            padding: "16px 16px 20px",
          }}
        >
          <div className="plan-v3-stat-label" style={{ marginBottom: 14 }}>
            {C.monthly}
          </div>

          {items.map((item, i) => (
            <div key={item.label} style={{ marginBottom: i < items.length - 1 ? 12 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)" }}>
                  {item.label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: item.color }}>
                  {fmtC(item.val, geo)}
                </span>
              </div>
              <div style={{ height: 6, background: "var(--bg)", width: "100%" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${(item.val / maxVal) * 100}%` } : {}}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                  style={{ height: "100%", background: item.color, opacity: 0.7 }}
                />
              </div>
            </div>
          ))}

          {/* Total monthly */}
          <div
            style={{
              borderTop: "1px solid var(--line)",
              marginTop: 14,
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", fontWeight: 700, letterSpacing: "0.08em" }}>
              {C.totalMo}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: "var(--ink)" }}>
              {fmtC(moDisplay, geo)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* The simple math */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="plan-v3-ikigai-box"
        style={{ marginBottom: 20 }}
      >
        <div className="plan-v3-overline" style={{ color: "rgba(255,149,0,0.7)", marginBottom: 10 }}>
          {C.ikigaiLabel}
        </div>

        {/* Step-by-step visual */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", color: "var(--ink)", fontWeight: 700 }}>
              {fmtC(moDisplay, geo)}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)" }}>
              {lang === "th" ? "/เดือน" : lang === "zh" ? "/月" : "/month"}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--dim)" }}>× 12 =</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", color: "var(--caution)", fontWeight: 700 }}>
              {fmtC(yrDisplay, geo)}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--dim)" }}>
              {lang === "th" ? "/ปี" : lang === "zh" ? "/年" : "/year"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", color: "var(--caution)", fontWeight: 700 }}>
              {fmtC(yrDisplay, geo)}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--dim)" }}>
              × {yearsPostRetire} {lang === "th" ? "ปี" : lang === "zh" ? "年" : "years"} =
            </span>
          </div>
        </div>

        <div className="plan-v3-big-num plan-ikigai-glow" style={{ color: "#ff9500", marginBottom: 8 }}>
          {fmtC(totDisplay, geo)}
        </div>

        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 6, fontStyle: "italic" }}>
          {C.ref(g)}
        </div>
      </motion.div>
    </section>
  );
}
