"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { type Lang, type GeoKey, type SafetyMargin, COPY, fmtC } from "./plan-data";

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
  totalPile,
  retirementTarget,
  safety,
  yearsToRetire,
  monthlySaved,
}: {
  lang: Lang;
  geo: GeoKey;
  totalPile: number;
  retirementTarget: number;
  safety: SafetyMargin;
  yearsToRetire: number;
  monthlySaved: number;
}) {
  const C = COPY.safetyMargin[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const pileDisplay = useCountUp(totalPile, 1.0);
  const needDisplay = useCountUp(retirementTarget, 1.0);
  const scoreDisplay = useCountUp(safety.score, 1.2);

  const gap = retirementTarget - totalPile;
  const gapDisplay = useCountUp(Math.abs(gap), 1.0);

  const levelColors: Record<string, string> = {
    critical: "var(--bear)",
    thin: "var(--braun-orange)",
    comfortable: "var(--caution)",
    secure: "var(--bull)",
    abundant: "var(--tech)",
  };
  const col = levelColors[safety.level] || "var(--muted)";

  const maxBar = Math.max(totalPile, retirementTarget, 1);
  const pileW = (totalPile / maxBar) * 100;
  const needW = (retirementTarget / maxBar) * 100;

  return (
    <section ref={ref} className="plan-v3-section" id="plan-safety" style={{ marginTop: 40 }}>
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

      {/* Two-bar comparison */}
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
            padding: "20px 16px 16px",
          }}
        >
          {/* Your Pile */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span className="plan-v3-stat-label">{C.pileL}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--tech)" }}>
                {fmtC(pileDisplay, geo)}
              </span>
            </div>
            <div style={{ height: 12, background: "var(--bg)", width: "100%" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${pileW}%` } : {}}
                transition={{ duration: 1.0, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                style={{ height: "100%", background: "var(--tech)", opacity: 0.8 }}
              />
            </div>
          </div>

          {/* What You Need */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span className="plan-v3-stat-label">{C.needL}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>
                {fmtC(needDisplay, geo)}
              </span>
            </div>
            <div style={{ height: 12, background: "var(--bg)", width: "100%" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${needW}%` } : {}}
                transition={{ duration: 1.0, delay: 0.45, ease: [0.23, 1, 0.32, 1] }}
                style={{ height: "100%", background: "var(--ink)", opacity: 0.3 }}
              />
            </div>
          </div>

          {/* Gap */}
          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span className="plan-v3-stat-label">{C.gapL}</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-display)",
                fontWeight: 700,
                color: gap > 0 ? "var(--bear)" : "var(--bull)",
              }}
            >
              {gap > 0 ? C.shortBy(fmtC(gapDisplay, geo)) : C.surplus(fmtC(gapDisplay, geo))}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Safety score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.35 }}
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
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.5 }}
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

      {/* Context notes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5 }}
        style={{ marginTop: 20 }}
      >
        <div className="plan-v3-callout" style={{ textAlign: "left", maxWidth: "none", marginBottom: 12 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.5, margin: 0 }}>
            {C.bufferNote}
          </p>
        </div>

        {gap > 0 && (
          <div className="plan-v3-callout" style={{ textAlign: "left", maxWidth: "none", borderColor: "var(--caution)" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--caution)", lineHeight: 1.5, margin: 0 }}>
              {C.onlySave}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.5, margin: "6px 0 0" }}>
              {C.yearsLeft(yearsToRetire)}
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
