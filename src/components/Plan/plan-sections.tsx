"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  type Lang,
  type GeoKey,
  type StyleKey,
  type GeoConfig,
  type InvestStyle,
  type SPt,
  type YearPoint,
  GEOS,
  INVEST,
  MASLOW,
  CYCLES,
  CYCLE_C,
  SPIRAL_PTS,
  SPIRAL_D,
  ptAt,
  EVENTS,
  pureSavings,
  investAccum,
  savSnaps,
  invSnaps,
  fmtC,
  COPY,
  ACTIONS,
  projectWithCycleV2,
  styleToAllocation,
  cycleStageForOffset,
} from "./plan-data";

/* ══════════════════════════════════════════════════════════════════════════════
   MICRO UTILITIES
   ══════════════════════════════════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 1.2) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 40, damping: 20 });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    mv.set(target);
  }, [target, mv]);
  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [spring]);
  return display;
}

function SectionHeader({ overline, h2, body }: { overline: string; h2: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      style={{ marginBottom: 40 }}
    >
      <div className="plan-v3-overline">{overline}</div>
      <h2 className="plan-v3-h2">{h2}</h2>
      <p className="plan-v3-body">{body}</p>
    </motion.div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HERO  —  Civilization Spiral
   ══════════════════════════════════════════════════════════════════════════════ */

export function PlanHero({ lang, onBegin }: { lang: Lang; onBegin: () => void }) {
  const C = COPY.hero[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const eventPts = EVENTS.map((e) => ({ ...e, pt: ptAt(e.year) }));

  return (
    <section ref={ref} className="plan-v3-hero">
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
        style={{ width: "100%", maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="plan-v3-overline" style={{ marginBottom: 16 }}>{C.overline}</div>
          <h1 className="plan-v3-h1">{C.h1}</h1>
          <p className="plan-v3-body" style={{ margin: "0 auto", maxWidth: 480 }}>{C.body}</p>
        </div>

        <div className="plan-spiral-wrap" style={{ maxWidth: 520 }}>
          <svg viewBox="0 0 500 500" className="plan-spiral-svg" aria-label="Economic cycles through civilization history">
            <defs>
              <linearGradient id="spGradV3" gradientUnits="userSpaceOnUse" x1="50" y1="250" x2="450" y2="250">
                <stop offset="0%" stopColor="#1a2a42" />
                <stop offset="50%" stopColor="#3a6080" />
                <stop offset="75%" stopColor="#00b4ff" />
                <stop offset="90%" stopColor="#ffd60a" />
                <stop offset="100%" stopColor="#ff2d55" />
              </linearGradient>
            </defs>
            {[60, 110, 160, 210].map((r) => (
              <circle key={r} cx={250} cy={250} r={r} fill="none" stroke="var(--line)" strokeWidth={0.5} opacity={0.3} />
            ))}
            <motion.path
              d={SPIRAL_D}
              fill="none"
              stroke="url(#spGradV3)"
              strokeWidth={1.5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 5, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
            />
            {eventPts.map((e) => {
              const ax = e.pt.x > 250 ? e.pt.x + 12 : e.pt.x - 12;
              const ay = e.pt.y - 8;
              return (
                <g key={e.year}>
                  {e.now && (
                    <>
                      <circle cx={e.pt.x} cy={e.pt.y} r={22} fill="none" stroke="#ff2d55" strokeWidth={0.8} className="plan-now-ring" />
                      <circle cx={e.pt.x} cy={e.pt.y} r={15} fill="none" stroke="#ff2d55" strokeWidth={1} className="plan-now-ring" style={{ animationDelay: "0.4s" }} />
                    </>
                  )}
                  <circle
                    cx={e.pt.x}
                    cy={e.pt.y}
                    r={e.now ? 6 : 3.5}
                    fill={e.now ? "#ff2d55" : e.crisis ? "#ff5055" : "#ffd60a"}
                    opacity={0.9}
                  />
                  <text
                    x={ax}
                    y={ay}
                    textAnchor={e.pt.x > 250 ? "start" : "end"}
                    fill={e.now ? "#ff2d55" : e.crisis ? "#ff7070" : "#6e82a0"}
                    fontSize={e.now ? 9 : 7}
                    fontFamily="IBM Plex Mono,monospace"
                    fontWeight={e.now ? 700 : 400}
                  >
                    {e.label}
                  </text>
                </g>
              );
            })}
            <text
              x={250}
              y={252}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--dim)"
              fontSize={5.5}
              fontFamily="IBM Plex Mono,monospace"
              letterSpacing={1}
            >
              1000 BCE
            </text>
          </svg>
        </div>

        <div className="plan-v3-callout" style={{ borderColor: "rgba(255,45,85,0.28)", background: "rgba(255,45,85,0.06)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "#ff2d55", letterSpacing: "0.2em", marginBottom: 8 }}>
            {C.stage}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
            {C.stageSub}
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.6, fontStyle: "italic" }}>
            {C.stageBody}
          </div>
        </div>

        <motion.button
          className="plan-v3-cta"
          onClick={onBegin}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          {C.cta}
        </motion.button>

        <div className="plan-scroll-hint" style={{ position: "relative", bottom: "auto", left: "auto", transform: "none", marginTop: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.15em" }}>
            {lang === "th" ? "เลื่อนลงเพื่อดำเนินการต่อ" : lang === "zh" ? "向下滚动继续" : "SCROLL TO CONTINUE"}
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 2v10M3 8l4 4 4-4" stroke="var(--dim)" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TIME ANCHOR  —  Age, Geo, Cycle Timeline
   ══════════════════════════════════════════════════════════════════════════════ */

function CycleTimeline({ startYear, endYear }: { startYear: number; endYear: number }) {
  const span = Math.max(1, endYear - startYear);
  const bands = CYCLES.filter((b) => b.start < endYear && b.end > startYear).map((b) => ({
    ...b,
    s: Math.max(b.start, startYear),
    e: Math.min(b.end, endYear),
  }));
  return (
    <div className="plan-cycle-bar" style={{ height: 64 }}>
      {bands.map((b, i) => {
        const left = ((b.s - startYear) / span) * 100;
        const width = ((b.e - b.s) / span) * 100;
        const c = CYCLE_C[b.type];
        return (
          <div key={i} className="plan-cycle-band" style={{ left: `${left}%`, width: `${width}%`, background: c.bg }}>
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                color: c.text,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1.2,
                fontWeight: 600,
              }}
            >
              {b.label}
            </div>
            <div style={{ position: "absolute", bottom: 5, left: 6, fontFamily: "var(--font-mono)", fontSize: 7, color: c.text, opacity: 0.65 }}>
              {b.s}–{b.e}
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 4, bottom: 4, fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--dim)" }}>{startYear}</div>
      <div style={{ position: "absolute", right: 4, bottom: 4, fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--dim)" }}>{endYear}</div>
    </div>
  );
}

export function TimeAnchorSection({
  lang,
  geo,
  setGeo,
  age,
  setAge,
  retireAge,
  setRetireAge,
}: {
  lang: Lang;
  geo: GeoKey;
  setGeo: (g: GeoKey) => void;
  age: number;
  setAge: (a: number) => void;
  retireAge: number;
  setRetireAge: (a: number) => void;
}) {
  const now = 2026;
  const retireYear = now + Math.max(0, retireAge - age);
  const yearsLeft = Math.max(0, retireAge - age);
  const bands = CYCLES.filter((b) => b.start < retireYear && b.end > now);
  const nDown = bands.filter((b) => b.type === "contraction").length;
  const nUp = bands.filter((b) => b.type === "expansion").length;
  const C = COPY.time[lang];
  const g = GEOS[geo];

  const ageCount = useCountUp(age, 0.8);
  const yearCount = useCountUp(retireYear, 1.0);

  return (
    <section className="plan-v3-section" id="plan-time">
      <SectionHeader overline={C.overline} h2={C.h2} body={C.body} />

      <Reveal>
        <div className="plan-v3-geo-grid">
          {(Object.entries(GEOS) as [GeoKey, GeoConfig][]).map(([k, cfg]) => (
            <button
              key={k}
              className={`plan-v3-geo-card${geo === k ? " active" : ""}`}
              onClick={() => setGeo(k)}
            >
              <span style={{ fontSize: 28 }}>{cfg.flag}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>{cfg.name}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", textTransform: "none", letterSpacing: 0 }}>
                {C.taxLabel} {cfg.taxRate}% · {C.rateLabel} {cfg.interestRate}%
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 32 }}>
          <div className="plan-v3-stat-card">
            <div className="plan-v3-stat-label">{C.yourAge}</div>
            <div className="plan-v3-stat-num" style={{ color: "var(--caution)" }}>{ageCount}</div>
            <input
              type="range"
              min={18}
              max={59}
              step={1}
              value={age}
              onChange={(e) => setAge(+e.target.value)}
              className="plan-slider"
              style={{ marginTop: 12 }}
            />
          </div>
          <div className="plan-v3-stat-card">
            <div className="plan-v3-stat-label">{C.retireAt}</div>
            <div className="plan-v3-stat-num">{retireAge}</div>
            <input
              type="range"
              min={50}
              max={70}
              step={1}
              value={retireAge}
              onChange={(e) => setRetireAge(+e.target.value)}
              className="plan-slider"
              style={{ marginTop: 12 }}
            />
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="plan-v3-insight-box" style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span className="plan-v3-big-num" style={{ color: "var(--tech)", fontSize: "clamp(2rem,6vw,3.5rem)" }}>{yearCount}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", color: "var(--muted)" }}>
              {lang === "th" ? "ปีที่คุณเกษียณ" : lang === "zh" ? "你的退休年份" : "is when you retire"}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 6 }}>
            {C.left(yearsLeft, retireYear)}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.25}>
        <div style={{ marginTop: 28 }}>
          <div className="plan-v3-stat-label" style={{ marginBottom: 10 }}>
            {C.forecastLabel}
            <span style={{ marginLeft: 8, opacity: 0.5, textTransform: "none" }}>
              ({now}–{retireYear})
            </span>
          </div>
          <CycleTimeline startYear={now} endYear={Math.max(retireYear, now + 1)} />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-micro)",
              color: "var(--muted)",
              lineHeight: 1.6,
              fontStyle: "italic",
              marginTop: 10,
            }}
          >
            {C.cycleNote(nUp, nDown)}
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.3}>
        <div className="plan-v3-context-pill" style={{ marginTop: 16 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.1em" }}>
            {g.name} CONTEXT
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5 }}>
            {g.marketNote[lang]}
          </span>
        </div>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MASLOW PYRAMID  —  Visual pyramid builder
   ══════════════════════════════════════════════════════════════════════════════ */

export function MaslowPyramidSection({
  lang,
  geo,
  needs,
  setNeeds,
  retireAge,
  lifeExp,
}: {
  lang: Lang;
  geo: GeoKey;
  needs: Record<number, { active: boolean; monthly: number }>;
  setNeeds: (n: Record<number, { active: boolean; monthly: number }>) => void;
  retireAge: number;
  lifeExp: number;
}) {
  const g = GEOS[geo];
  const yrs = Math.max(5, lifeExp - retireAge);
  const activeMonthly = Object.values(needs)
    .filter((n) => n.active)
    .reduce((s, n) => s + n.monthly, 0);
  const ikigai = activeMonthly * 12 * yrs;
  const C = COPY.needs[lang];

  function toggle(id: number) {
    setNeeds({ ...needs, [id]: { ...needs[id], active: !needs[id].active } });
  }
  function setMonthly(id: number, v: number) {
    setNeeds({ ...needs, [id]: { ...needs[id], monthly: v } });
  }

  const ikigaiDisplay = useCountUp(ikigai, 1.2);

  return (
    <section className="plan-v3-section" id="plan-needs">
      <SectionHeader overline={C.overline} h2={C.h2} body={C.body} />

      <Reveal>
        <div className="plan-v3-pyramid">
          {[...MASLOW].reverse().map((level, idx) => {
            const st = needs[level.id];
            const maxV = g.needsMax[MASLOW.length - 1 - idx];
            const widthPct = 100 - idx * 10;
            return (
              <div key={level.id} style={{ width: `${widthPct}%`, margin: "0 auto", position: "relative" }}>
                <button
                  className={`plan-v3-pyramid-tier${st.active ? " active" : ""}`}
                  style={{
                    color: level.color,
                    borderColor: st.active ? level.color : "var(--line)",
                    background: st.active ? `color-mix(in srgb, ${level.color} 8%, var(--bg-raised))` : "var(--bg-raised)",
                  }}
                  onClick={() => toggle(level.id)}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{level.icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-micro)",
                        fontWeight: 700,
                        color: st.active ? level.color : "var(--muted)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {level.label[lang]}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-micro)",
                        color: "var(--dim)",
                        lineHeight: 1.4,
                        textTransform: "none",
                        letterSpacing: 0,
                        marginTop: 2,
                      }}
                    >
                      {level.desc[lang]}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-micro)",
                      color: st.active ? level.color : "var(--dim)",
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    {st.active ? fmtC(st.monthly, geo) : lang === "en" ? "+ ADD" : lang === "th" ? "+ เพิ่ม" : "+ 添加"}
                  </div>
                </button>
                <AnimatePresence>
                  {st.active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          padding: "12px 16px 14px",
                          background: `color-mix(in srgb, ${level.color} 5%, var(--bg-raised))`,
                          border: `1px solid ${level.color}`,
                          borderTop: "none",
                          marginBottom: 2,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>
                            {C.monthly}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: level.color }}>
                            {fmtC(st.monthly, geo)}/{lang === "th" ? "เดือน" : lang === "zh" ? "月" : "mo"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={maxV}
                          step={Math.max(100, maxV / 200)}
                          value={st.monthly}
                          onChange={(e) => setMonthly(level.id, +e.target.value)}
                          className="plan-slider"
                          style={{ accentColor: level.color }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Reveal>

      <AnimatePresence>
        {activeMonthly > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="plan-v3-ikigai-box"
          >
            <div className="plan-v3-overline" style={{ color: "rgba(255,149,0,0.7)", marginBottom: 10 }}>
              {C.ikigaiLabel}
            </div>
            <div className="plan-v3-big-num plan-ikigai-glow" style={{ color: "#ff9500" }}>
              {fmtC(ikigaiDisplay, geo)}
            </div>
            <div className="plan-v3-mono-sub" style={{ marginTop: 10 }}>
              {C.yearsLabel(yrs)} · {fmtC(activeMonthly, geo)}/mo × 12
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 6, fontStyle: "italic" }}>
              {C.ref(g)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SALARY FLOW  —  Waterfall income → expenses → investable
   ══════════════════════════════════════════════════════════════════════════════ */

export function SalaryFlowSection({
  lang,
  geo,
  salary,
  setSalary,
  salaryGrowth,
  setSalaryGrowth,
  living,
  setLiving,
  transport,
  setTransport,
  other,
  setOther,
  yearsToRetire,
  retirementTarget,
}: {
  lang: Lang;
  geo: GeoKey;
  salary: number;
  setSalary: (v: number) => void;
  salaryGrowth: number;
  setSalaryGrowth: (v: number) => void;
  living: number;
  setLiving: (v: number) => void;
  transport: number;
  setTransport: (v: number) => void;
  other: number;
  setOther: (v: number) => void;
  yearsToRetire: number;
  retirementTarget: number;
}) {
  const g = GEOS[geo];
  const totalExp = living + transport + other;
  const investable = Math.max(0, salary - totalExp);
  const spentPct = salary > 0 ? Math.min(100, Math.round((totalExp / salary) * 100)) : 0;
  const barCol = spentPct > 90 ? "var(--bear)" : spentPct > 70 ? "var(--caution)" : "var(--bull)";
  const savTotal = useMemo(() => pureSavings(investable, salaryGrowth, yearsToRetire), [investable, salaryGrowth, yearsToRetire]);
  const snaps = useMemo(() => savSnaps(investable, salaryGrowth, yearsToRetire), [investable, salaryGrowth, yearsToRetire]);
  const maxSnap = Math.max(...snaps, retirementTarget * 0.01, 1);
  const CW = 340,
    CH = 90;
  const toX = (i: number) => (i / Math.max(1, snaps.length - 1)) * CW;
  const toY = (v: number) => CH - (Math.min(v, maxSnap) / maxSnap) * (CH - 8) - 4;
  const savPath = snaps.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const targetY = toY(retirementTarget);
  const C = COPY.salary[lang];

  const salaryDisplay = useCountUp(salary, 0.6);
  const investableDisplay = useCountUp(investable, 0.6);
  const savTotalDisplay = useCountUp(savTotal, 0.8);

  const deficit = retirementTarget - savTotal;

  return (
    <section className="plan-v3-section" id="plan-salary">
      <SectionHeader overline={C.overline} h2={C.h2} body={C.body} />

      <Reveal>
        <div className="plan-v3-stat-card" style={{ marginBottom: 20 }}>
          <div className="plan-v3-stat-label">{C.income}</div>
          <div className="plan-v3-stat-num">{fmtC(salaryDisplay, geo)}</div>
          <input
            type="range"
            min={0}
            max={g.salaryMax}
            step={Math.max(500, g.salaryMax / 400)}
            value={salary}
            onChange={(e) => setSalary(+e.target.value)}
            className="plan-slider"
            style={{ marginTop: 12 }}
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="plan-v3-stat-card" style={{ marginBottom: 20 }}>
          <div className="plan-v3-stat-label">{C.growth}</div>
          <div className="plan-v3-stat-num" style={{ fontSize: "1.8rem" }}>
            {(salaryGrowth * 100).toFixed(0)}%
            <span style={{ fontSize: "var(--text-micro)", color: "var(--dim)", fontWeight: 400, marginLeft: 4 }}>
              /{lang === "th" ? "ปี" : lang === "zh" ? "年" : "yr"}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={0.15}
            step={0.005}
            value={salaryGrowth}
            onChange={(e) => setSalaryGrowth(+e.target.value)}
            className="plan-slider"
            style={{ marginTop: 12 }}
          />
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        {/* Spend breakdown bar */}
        <div style={{ padding: "16px", background: "var(--bg-raised)", border: "1px solid var(--line)", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>
              {fmtC(totalExp, geo)} {lang === "th" ? "จ่าย" : lang === "zh" ? "支出" : "spent"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: barCol }}>{spentPct}%</span>
          </div>
          <div style={{ height: 6, background: "var(--line)", overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", background: barCol }}
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
            {[
              { label: C.livingL, val: living, set: setLiving, max: g.livingMax },
              { label: C.transportL, val: transport, set: setTransport, max: g.transportMax },
              { label: C.otherL, val: other, set: setOther, max: g.otherMax },
            ].map((row) => (
              <div key={row.label}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--dim)",
                    marginBottom: 4,
                    textTransform: "none",
                    letterSpacing: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {row.label}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
                  {fmtC(row.val, geo)}
                </div>
                <input
                  type="range"
                  min={0}
                  max={row.max}
                  step={Math.max(100, row.max / 200)}
                  value={row.val}
                  onChange={(e) => row.set(+e.target.value)}
                  className="plan-slider"
                  style={{ accentColor: "var(--muted)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        {/* Investable waterfall */}
        <div
          className="plan-v3-waterfall"
          style={{
            borderLeftColor: investable > 0 ? "var(--bull)" : "var(--bear)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>{C.investL}</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "2rem",
                fontWeight: 700,
                lineHeight: 1,
                color: investable > 0 ? "var(--bull)" : "var(--bear)",
              }}
            >
              {fmtC(investableDisplay, geo)}
            </span>
          </div>
          {investable <= 0 && (
            <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--bear)" }}>
              {C.noInv}
            </div>
          )}
        </div>
      </Reveal>

      {investable > 0 && (
        <Reveal delay={0.25}>
          <div className="plan-v3-chart-box" style={{ marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>{C.savLabel}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--muted)" }}>
                {fmtC(savTotalDisplay, geo)}
              </span>
            </div>
            <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: "100%", height: CH, display: "block", overflow: "visible" }}>
              {retirementTarget > 0 && targetY > 0 && targetY < CH && (
                <line x1={0} y1={targetY} x2={CW} y2={targetY} stroke="var(--caution)" strokeWidth={1} strokeDasharray="5 3" />
              )}
              <path d={savPath} fill="none" stroke="var(--muted)" strokeWidth={2} />
              <circle cx={toX(snaps.length - 1)} cy={toY(savTotal)} r={4} fill="var(--muted)" />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>
                {lang === "th" ? "ตอนนี้" : lang === "zh" ? "现在" : "Now"}
              </span>
              {retirementTarget > 0 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)" }}>
                  {lang === "th" ? "เป้า" : lang === "zh" ? "目标" : "Target"}: {fmtC(retirementTarget, geo)}
                </span>
              )}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>
                {lang === "th" ? "เกษียณ" : lang === "zh" ? "退休" : "Retire"}
              </span>
            </div>
          </div>

          <div
            className="plan-v3-insight-box"
            style={{
              marginTop: 16,
              borderColor: deficit > 0 ? "rgba(255,45,85,0.3)" : "rgba(0,255,136,0.3)",
              background: deficit > 0 ? "rgba(255,45,85,0.05)" : "rgba(0,255,136,0.05)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-body)",
                fontWeight: 700,
                color: deficit > 0 ? "var(--bear)" : "var(--bull)",
              }}
            >
              {deficit > 0 ? C.shortBy(fmtC(deficit, geo)) : C.surplus(fmtC(Math.abs(deficit), geo))}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", marginTop: 4 }}>
              {deficit > 0
                ? lang === "en"
                  ? "Savings alone won't reach your target. Let's explore how to close the gap."
                  : lang === "th"
                  ? "การออมอย่างเดียวไม่ถึงเป้า มาดูวิธีเติมช่องว่าง"
                  : "仅靠储蓄无法达到目标。让我们探索如何填补缺口。"
                : lang === "en"
                ? "You're on track with savings alone. But investing could get you there faster."
                : lang === "th"
                ? "ออมอย่างเดียวก็ถึงเป้า แต่การลงทุนจะถึงเร็วขึ้น"
                : "仅靠储蓄就能达标。但投资能让你更快到达。"}
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   GAP + INVESTMENT  —  Deficit + style cards
   ══════════════════════════════════════════════════════════════════════════════ */

export function GapInvestSection({
  lang,
  geo,
  investable,
  salaryGrowth,
  yearsToRetire,
  retirementTarget,
  savingsTotal,
  investStyle,
  setInvestStyle,
}: {
  lang: Lang;
  geo: GeoKey;
  investable: number;
  salaryGrowth: number;
  yearsToRetire: number;
  retirementTarget: number;
  savingsTotal: number;
  investStyle: StyleKey | null;
  setInvestStyle: (s: StyleKey) => void;
}) {
  const deficit = retirementTarget - savingsTotal;
  const C = COPY.gap[lang];

  const savDisplay = useCountUp(savingsTotal, 0.8);
  const tgtDisplay = useCountUp(retirementTarget, 0.8);
  const gapDisplay = useCountUp(Math.abs(deficit), 0.8);

  return (
    <section className="plan-v3-section" id="plan-gap">
      <SectionHeader overline={C.overline} h2={C.h2} body={C.body} />

      {retirementTarget > 0 && (
        <Reveal>
          <div className="plan-v3-gap-grid">
            {[
              { label: C.savL, val: savDisplay, color: "var(--muted)" },
              { label: C.tgtL, val: tgtDisplay, color: "var(--caution)" },
              {
                label: C.gapL,
                val: gapDisplay,
                color: deficit > 0 ? "var(--bear)" : "var(--bull)",
                isGap: true,
                isSurplus: deficit <= 0,
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                className="plan-v3-gap-card"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="plan-v3-stat-label">{item.label}</div>
                <div
                  className="plan-v3-stat-num"
                  style={{
                    color: item.color,
                    fontSize: "clamp(1.2rem,4vw,1.8rem)",
                  }}
                >
                  {"isSurplus" in item && item.isSurplus ? "✓ SURPLUS" : fmtC(item.val, geo)}
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <div style={{ marginTop: 36 }}>
          <div className="plan-v3-stat-label" style={{ marginBottom: 14 }}>
            {C.how}
          </div>
          {investable > 0 ? (
            <div className="plan-v3-invest-grid">
              {INVEST.map((s, i) => {
                const projected = investAccum(investable, salaryGrowth, s.ret, yearsToRetire);
                const onTrack = projected >= retirementTarget && retirementTarget > 0;
                const sel = investStyle === s.key;
                return (
                  <motion.button
                    key={s.key}
                    className={`plan-v3-invest-card${sel ? " selected" : ""}`}
                    style={{ color: s.color }}
                    onClick={() => setInvestStyle(s.key)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{s.icon}</span>
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-micro)",
                            fontWeight: 700,
                            color: sel ? s.color : "var(--muted)",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {s.label[lang]}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>
                          +{(s.ret * 100).toFixed(0)}%/yr · {s.risk}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-micro)",
                        color: "var(--dim)",
                        lineHeight: 1.4,
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      {s.desc[lang]}
                    </div>
                    {retirementTarget > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: `1px solid ${sel ? s.color : "var(--line)"}`,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-micro)",
                            color: sel ? s.color : "var(--dim)",
                          }}
                        >
                          → {fmtC(projected, geo)}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-micro)",
                            fontWeight: 700,
                            color: onTrack ? "var(--bull)" : "var(--bear)",
                          }}
                        >
                          {onTrack
                            ? lang === "th"
                              ? "✓ ตรงเป้า"
                              : lang === "zh"
                              ? "✓ 达标"
                              : "✓ ON TRACK"
                            : lang === "th"
                            ? "✗ ยังขาด"
                            : lang === "zh"
                            ? "✗ 不足"
                            : "✗ SHORT"}
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="plan-v3-callout" style={{ borderColor: "var(--bear)", background: "rgba(255,45,85,0.06)", textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--bear)" }}>{C.noInv}</span>
            </div>
          )}
          {!investStyle && investable > 0 && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", textAlign: "center", padding: "16px 0", opacity: 0.7 }}>
              {C.pick}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SCENARIO  —  Chart + readiness + actions
   ══════════════════════════════════════════════════════════════════════════════ */

export function ScenarioSection({
  lang,
  geo,
  investable,
  salaryGrowth,
  yearsToRetire,
  retirementTarget,
  investStyle,
  onRestart,
}: {
  lang: Lang;
  geo: GeoKey;
  investable: number;
  salaryGrowth: number;
  yearsToRetire: number;
  retirementTarget: number;
  investStyle: StyleKey | null;
  onRestart: () => void;
}) {
  const style = INVEST.find((s) => s.key === investStyle);
  const C = COPY.scenario[lang];

  if (!style) {
    return (
      <section className="plan-v3-section" id="plan-scenario">
        <SectionHeader overline={C.overline} h2={C.h2} body={C.noStyle} />
      </section>
    );
  }

  const ss = useMemo(() => savSnaps(investable, salaryGrowth, yearsToRetire), [investable, salaryGrowth, yearsToRetire]);
  const is = useMemo(() => invSnaps(investable, salaryGrowth, style.ret, yearsToRetire), [investable, salaryGrowth, style.ret, yearsToRetire]);
  const finalInv = is[is.length - 1] ?? 0;
  const onTrack = finalInv >= retirementTarget && retirementTarget > 0;
  const readiness = retirementTarget > 0 ? Math.min(200, Math.round((finalInv / retirementTarget) * 100)) : 0;

  let crossover: number | null = null;
  for (let i = 0; i < is.length; i++) {
    if (is[i] >= retirementTarget) {
      crossover = i;
      break;
    }
  }

  const allV = [...ss, ...is, retirementTarget];
  const maxV = Math.max(...allV, 1);
  const W = 400,
    H = 180;
  const toX = (i: number) => (i / Math.max(1, yearsToRetire)) * W;
  const toY = (v: number) => H - (Math.min(v, maxV) / maxV) * (H - 10) - 5;
  const spath = ss.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const ipath = is.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const tY = toY(retirementTarget);
  const readColor = onTrack ? "var(--bull)" : readiness > 60 ? "var(--caution)" : "var(--bear)";

  const readinessDisplay = useCountUp(readiness, 1.2);
  const finalDisplay = useCountUp(finalInv, 1.0);

  const actions = ACTIONS[style.key][lang];

  return (
    <section className="plan-v3-section" id="plan-scenario">
      <SectionHeader overline={C.overline} h2={C.h2} body={C.body} />

      <Reveal>
        <div className="plan-v3-chart-box">
          <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { color: "var(--muted)", dashed: false, label: C.savL },
              { color: style.color, dashed: false, label: style.label[lang] },
              { color: "var(--caution)", dashed: true, label: C.targetL },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg width={24} height={8} viewBox="0 0 24 8" aria-hidden>
                  {item.dashed ? (
                    <line x1={0} y1={4} x2={24} y2={4} stroke={item.color} strokeWidth={1.5} strokeDasharray="4 3" />
                  ) : (
                    <line x1={0} y1={4} x2={24} y2={4} stroke={item.color} strokeWidth={2} />
                  )}
                </svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", letterSpacing: "0.06em" }}>{item.label}</span>
              </div>
            ))}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} aria-label="Wealth trajectory scenario">
            {retirementTarget > 0 && <line x1={0} y1={tY} x2={W} y2={tY} stroke="var(--caution)" strokeWidth={1.5} strokeDasharray="6 4" />}
            <path d={spath} fill="none" stroke="var(--muted)" strokeWidth={1.5} opacity={0.5} />
            <motion.path
              d={ipath}
              fill="none"
              stroke={style.color}
              strokeWidth={2.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            />
            {crossover !== null && (
              <g>
                <circle cx={toX(crossover)} cy={tY} r={5} fill={style.color} />
                <line
                  x1={toX(crossover)}
                  y1={0}
                  x2={toX(crossover)}
                  y2={H}
                  stroke={style.color}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.35}
                />
              </g>
            )}
            <circle cx={toX(yearsToRetire)} cy={toY(finalInv)} r={5} fill={style.color} />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)" }}>
              {lang === "th" ? "วันนี้" : lang === "zh" ? "今天" : "Today"}
            </span>
            {crossover !== null && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: style.color }}>{C.crossL(crossover)}</span>
            )}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)" }}>
              {lang === "th" ? "เกษียณ" : lang === "zh" ? "退休" : "Retire"}
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="plan-v3-readiness-card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="plan-v3-stat-label">{C.readL}</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-body)",
                fontWeight: 700,
                color: readColor,
              }}
            >
              {readinessDisplay}%
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
              <div className="plan-v3-stat-label" style={{ marginBottom: 4 }}>{C.projL}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 700, color: readColor }}>
                {fmtC(finalDisplay, geo)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="plan-v3-stat-label" style={{ marginBottom: 4 }}>{C.tgtL}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 700, color: "var(--caution)" }}>
                {fmtC(retirementTarget, geo)}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="plan-v3-callout" style={{ marginTop: 12, borderColor: "rgba(255,214,10,0.22)", background: "rgba(255,214,10,0.05)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", marginBottom: 6 }}>
            {lang === "th" ? "ความตระหนักวัฏจักร" : lang === "zh" ? "周期意识" : "CYCLE AWARENESS"}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5 }}>{C.warning}</div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div style={{ marginTop: 36 }}>
          <div className="plan-v3-stat-label" style={{ marginBottom: 14 }}>{C.actL}</div>
          {actions.map((action, i) => (
            <motion.div
              key={i}
              className="plan-action-step"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-micro)",
                  fontWeight: 700,
                  color: style.color,
                  flexShrink: 0,
                  paddingTop: 1,
                  minWidth: 28,
                }}
              >
                0{i + 1}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.6 }}>
                {action}
              </div>
            </motion.div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.3}>
        <button
          onClick={onRestart}
          className="plan-v3-restart-btn"
          style={{ marginTop: 32 }}
        >
          {C.restart}
        </button>
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid var(--line)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-micro)",
            color: "var(--dim)",
            lineHeight: 1.6,
            textTransform: "none",
            letterSpacing: 0,
            fontStyle: "italic",
          }}
        >
          {C.disc}
        </div>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STICKY SUMMARY  —  Live-updating bar
   ══════════════════════════════════════════════════════════════════════════════ */

export function StickySummary({
  lang,
  geo,
  age,
  retireAge,
  retirementTarget,
  savingsTotal,
  investStyle,
  investable,
  salaryGrowth,
  yearsToRetire,
}: {
  lang: Lang;
  geo: GeoKey;
  age: number;
  retireAge: number;
  retirementTarget: number;
  savingsTotal: number;
  investStyle: StyleKey | null;
  investable: number;
  salaryGrowth: number;
  yearsToRetire: number;
}) {
  const style = INVEST.find((s) => s.key === investStyle);
  const finalInv = style ? investAccum(investable, salaryGrowth, style.ret, yearsToRetire) : 0;
  const readiness = retirementTarget > 0 ? Math.min(100, Math.round((finalInv / retirementTarget) * 100)) : 0;
  const readColor = finalInv >= retirementTarget ? "var(--bull)" : readiness > 60 ? "var(--caution)" : "var(--bear)";

  return (
    <div className="plan-v3-sticky-summary">
      <div className="plan-v3-sticky-inner">
        <div className="plan-v3-sticky-item">
          <span className="plan-v3-sticky-label">{lang === "th" ? "อายุ" : lang === "zh" ? "年龄" : "Age"}</span>
          <span className="plan-v3-sticky-value">{age}</span>
        </div>
        <div className="plan-v3-sticky-divider" />
        <div className="plan-v3-sticky-item">
          <span className="plan-v3-sticky-label">{GEOS[geo].flag}</span>
          <span className="plan-v3-sticky-value">{GEOS[geo].currency}</span>
        </div>
        <div className="plan-v3-sticky-divider" />
        <div className="plan-v3-sticky-item">
          <span className="plan-v3-sticky-label">{lang === "th" ? "เป้า" : lang === "zh" ? "目标" : "Target"}</span>
          <span className="plan-v3-sticky-value">{fmtC(retirementTarget, geo)}</span>
        </div>
        <div className="plan-v3-sticky-divider" />
        <div className="plan-v3-sticky-item">
          <span className="plan-v3-sticky-label">{lang === "th" ? "ออม" : lang === "zh" ? "储蓄" : "Saved"}</span>
          <span className="plan-v3-sticky-value">{fmtC(savingsTotal, geo)}</span>
        </div>
        <div className="plan-v3-sticky-divider" />
        <div className="plan-v3-sticky-item">
          <span className="plan-v3-sticky-label">{lang === "th" ? "พร้อม" : lang === "zh" ? "准备度" : "Ready"}</span>
          <span className="plan-v3-sticky-value" style={{ color: readColor }}>{style ? `${readiness}%` : "—"}</span>
        </div>
      </div>
    </div>
  );
}
