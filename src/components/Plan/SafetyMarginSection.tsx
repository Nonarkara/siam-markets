"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { type Lang, type GeoKey, type SafetyMargin, COPY, fmtC, pureSavings } from "./plan-data";

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

export function SafetyMarginSection({
  lang,
  geo,
  investable,
  salaryGrowth,
  yearsToRetire,
  retirementTarget,
  safety,
}: {
  lang: Lang;
  geo: GeoKey;
  investable: number;
  salaryGrowth: number;
  yearsToRetire: number;
  retirementTarget: number;
  safety: SafetyMargin;
}) {
  const C = COPY.safetyMargin[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const sav100 = pureSavings(investable * (100 / 30), salaryGrowth, yearsToRetire); // if they saved 100%
  const sav30 = pureSavings(investable, salaryGrowth, yearsToRetire);

  const s100Display = useCountUp(sav100, 1.0);
  const s30Display = useCountUp(sav30, 1.0);
  const needDisplay = useCountUp(retirementTarget, 1.0);
  const scoreDisplay = useCountUp(safety.score, 1.2);

  const levelColors: Record<string, string> = {
    critical: "var(--bear)",
    thin: "var(--braun-orange)",
    comfortable: "var(--caution)",
    secure: "var(--bull)",
    abundant: "var(--tech)",
  };
  const col = levelColors[safety.level] || "var(--muted)";

  return (
    <section ref={ref} className="plan-v3-section" id="plan-safety">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ marginBottom: 40 }}
      >
        <div className="plan-v3-overline">{C.overline}</div>
        <h2 className="plan-v3-h2">{C.h2}</h2>
        <p className="plan-v3-body">{C.body}</p>
      </motion.div>

      {/* Three comparison cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="plan-v3-gap-grid"
        style={{ marginBottom: 28 }}
      >
        {[
          { label: C.save100L, val: s100Display, color: "var(--muted)" },
          { label: C.save30L, val: s30Display, color: "var(--caution)" },
          { label: C.needL, val: needDisplay, color: "var(--ink)" },
        ].map((item) => (
          <div key={item.label} className="plan-v3-gap-card" style={{ textAlign: "center" }}>
            <div className="plan-v3-stat-label" style={{ fontSize: "var(--text-micro)" }}>{item.label}</div>
            <div className="plan-v3-stat-num" style={{ color: item.color, fontSize: "var(--text-display)" }}>
              {fmtC(item.val, geo)}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Safety margin score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="plan-v3-readiness-card"
        style={{ borderColor: `color-mix(in srgb, ${col} 30%, var(--line))` }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="plan-v3-stat-label">{C.safetyL}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: col }}>
            {safety.label[lang]}
          </span>
        </div>
        <div className="plan-readiness-track">
          <motion.div
            className="plan-readiness-fill"
            style={{ background: col }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, scoreDisplay))}%` }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.4 }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span className="plan-v3-mono-sub">0%</span>
          <span className="plan-v3-mono-sub" style={{ color: col, fontWeight: 700 }}>{scoreDisplay}%</span>
          <span className="plan-v3-mono-sub">200%</span>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5, marginTop: 14, fontStyle: "italic" }}>
          {safety.desc[lang]}
        </p>
      </motion.div>

      {/* Buffer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="plan-v3-callout"
        style={{ marginTop: 16, textAlign: "left", maxWidth: "none" }}
      >
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.5, margin: 0 }}>
          {C.bufferNote}
        </p>
      </motion.div>
    </section>
  );
}
