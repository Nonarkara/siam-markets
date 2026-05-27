"use client";

import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  type Lang,
  type GeoKey,
  type StyleKey,
  GEOS,
  INVEST,
  pureSavings,
  investAccum,
  fmtC,
  cycleStageForOffset,
} from "@/components/Plan/plan-data";

/* ══════════════════════════════════════════════════════════════════════════════
   PLAN DASHBOARD  v3 — Financial Intelligence
   Single-page dashboard. No scroll wizard. No pyramid.
   Elegant. Data-rich. Educational.
   ══════════════════════════════════════════════════════════════════════════════ */

type LocKey = "en" | "th" | "zh";

const L: Record<LocKey, {
  title: string; subtitle: string;
  forecastTitle: string; forecastSub: string;
  age: string; salary: string; location: string;
  need: string; save: string; savedLabel: string; gap: string; shortBy: (s: string) => string; surplus: (s: string) => string;
  closeGap: string; closesGap: string; onlySave: string;
  investTitle: string; investSub: string;
  actions: string; disclaimer: string;
  ready: string; projected: string; target: string;
  yrsToRetire: (n: number) => string;
  cycleNote: string;
  risk: Record<string, string>;
}> = {
  en: {
    title: "Your Financial Horizon",
    subtitle: "Age. Salary. Location. See what the next 50 years hold — and what you must do about it.",
    forecastTitle: "The Economy of the Next 50 Years",
    forecastSub: "Based on Ray Dalio's cycle framework. History doesn't repeat, but it rhymes.",
    age: "YOUR AGE", salary: "STARTING SALARY", location: "WHERE YOU LIVE",
    need: "YOU NEED", save: "YOU'LL SAVE", savedLabel: "SAVED", gap: "THE GAP",
    shortBy: (s: string) => `Short by ${s}`,
    surplus: (s: string) => `Surplus of ${s}`,
    closeGap: "HOW TO CLOSE THE GAP",
    closesGap: "CLOSES GAP",
    onlySave: "Saving only",
    risk: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", VARIABLE: "VARIABLE", EXTREME: "EXTREME" },
    investTitle: "Investment Paths",
    investSub: "Choose a strategy. Watch the projection change.",
    actions: "YOUR NEXT 3 MOVES",
    disclaimer: "Nominal values · No inflation adjustment · Past returns ≠ future · Illustrative only",
    ready: "READY", projected: "PROJECTED", target: "TARGET",
    yrsToRetire: (n: number) => `${n} years to retire`,
    cycleNote: "Cycle phases: Fragility → Reset → Rise → Bubble → Peak → Unwind",
  },
  th: {
    title: "ขอบฟ้าทางการเงินของคุณ",
    subtitle: "อายุ เงินเดือน ที่อยู่ ดูว่า 50 ปีข้างหน้าเป็นอย่างไร และคุณต้องทำอะไร",
    forecastTitle: "เศรษฐกิจ 50 ปีข้างหน้า",
    forecastSub: "จากกรอบวัฏจักรของ Ray Dalio ประวัติศาสตร์ไม่ซ้ำ แต่มันร้องคำราม",
    age: "อายุของคุณ", salary: "เงินเดือนเริ่มต้น", location: "ที่อยู่ของคุณ",
    need: "ที่คุณต้องการ", save: "ที่คุณจะออมได้", savedLabel: "ออมได้", gap: "ช่องว่าง",
    shortBy: (s: string) => `ขาดอีก ${s}`,
    surplus: (s: string) => `เหลือ ${s}`,
    closeGap: "วิธีปิดช่องว่าง",
    closesGap: "ปิดช่องว่างได้",
    onlySave: "ออมอย่างเดียว",
    risk: { LOW: "ต่ำ", MEDIUM: "ปานกลาง", HIGH: "สูง", VARIABLE: "ผันผวน", EXTREME: "สูงมาก" },
    investTitle: "เส้นทางการลงทุน",
    investSub: "เลือกกลยุทธ์ ดูการคาดการณ์เปลี่ยน",
    actions: "3 ขั้นตอนต่อไป",
    disclaimer: "ค่าเงินตามตัว · ไม่ปรับเงินเฟ้อ · ผลตอบแทนในอดีตไม่รับประกันอนาคต · เพียงตัวอย่าง",
    ready: "พร้อม", projected: "ประมาณการ", target: "เป้าหมาย",
    yrsToRetire: (n: number) => `เหลือ ${n} ปีก่อนเกษียณ`,
    cycleNote: "ขั้นวัฏจักร: ความเปราะบาง → รีเซ็ต → ขาขึ้น → ฟองสบู่ → จุดสูงสุด → คลายตัว",
  },
  zh: {
    title: "你的财务视野",
    subtitle: "年龄、薪资、所在地。看看未来50年会怎样——以及你必须做什么。",
    forecastTitle: "未来50年的经济",
    forecastSub: "基于瑞·达利欧的周期框架。历史不会重复，但会押韵。",
    age: "你的年龄", salary: "起始薪资", location: "你居住的地方",
    need: "你需要", save: "你能存下", savedLabel: "已存", gap: "缺口",
    shortBy: (s: string) => `还差 ${s}`,
    surplus: (s: string) => `多出 ${s}`,
    closeGap: "如何填补缺口",
    closesGap: "可填补缺口",
    onlySave: "仅靠储蓄",
    risk: { LOW: "低", MEDIUM: "中", HIGH: "高", VARIABLE: "波动", EXTREME: "极高" },
    investTitle: "投资路径",
    investSub: "选择策略，观察预测变化。",
    actions: "你的下3步",
    disclaimer: "名义值 · 不含通胀调整 · 历史收益不代表未来 · 仅供参考",
    ready: "准备度", projected: "预测", target: "目标",
    yrsToRetire: (n: number) => `还有 ${n} 年退休`,
    cycleNote: "周期阶段：脆弱 → 重置 → 上升 → 泡沫 → 峰值 →  unwind",
  },
};

/* ─── 50-Year Economic Forecast Chart ─────────────────────────────────────── */

function ForecastChart({ yearsToShow = 50 }: { yearsToShow?: number }) {
  const W = 900, H = 220, PAD = 30;
  const chartW = W - PAD * 2;
  const chartH = H - PAD * 2;

  // Generate cycle data
  const data = useMemo(() => {
    const out: { year: number; phase: string; rate: number; idx: number }[] = [];
    for (let i = 0; i < yearsToShow; i++) {
      const stage = cycleStageForOffset(i);
      out.push({ year: 2026 + i, phase: stage.label, rate: stage.meanRate, idx: i });
    }
    return out;
  }, [yearsToShow]);

  // Phase colors via design tokens — see commit 5a734b4 (no hardcoded hex)
  const phaseColors: Record<string, string> = {
    FRAG:   "var(--bear)",
    RESET:  "var(--bear)",
    RISE:   "var(--bull)",
    BUBBLE: "var(--bull)",
    PEAK:   "var(--caution)",
    UNWIND: "var(--muted)",
  };

  const maxRate = 0.2;
  const minRate = -0.08;
  const range = maxRate - minRate;

  const toX = (i: number) => PAD + (i / (data.length - 1)) * chartW;
  const toY = (r: number) => PAD + chartH - ((r - minRate) / range) * chartH;

  // Area path
  const areaPath = data.map((d, i) => {
    const x = toX(i);
    const y = toY(d.rate);
    return `${i === 0 ? `M ${x} ${H - PAD}` : ""} L ${x} ${y}`;
  }).join(" ") + ` L ${toX(data.length - 1)} ${H - PAD} Z`;

  // Line path
  const linePath = data.map((d, i) => {
    const cmd = i === 0 ? "M" : "L";
    return `${cmd} ${toX(i).toFixed(1)} ${toY(d.rate).toFixed(1)}`;
  }).join(" ");

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Zero line */}
        <line x1={PAD} y1={toY(0)} x2={W - PAD} y2={toY(0)} stroke="var(--line)" strokeWidth={1} strokeDasharray="4 4" />

        {/* Phase bands */}
        {data.map((d, i) => {
          if (i === data.length - 1) return null;
          const x1 = toX(i);
          const x2 = toX(i + 1);
          return (
            <rect key={i} x={x1} y={H - PAD - 16} width={x2 - x1} height={10}
              fill={phaseColors[d.phase] || "var(--muted)"} opacity={0.5} />
          );
        })}

        {/* Area */}
        <motion.path
          d={areaPath}
          fill="url(#forecastGrad)"
          opacity={0.25}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.25 } : {}}
          transition={{ duration: 1.5 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--caution)"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
        />

        {/* Year labels (every 10 years) */}
        {[0, 10, 20, 30, 40, 49].map((idx) => (
          <text key={idx} x={toX(idx)} y={H - 4} textAnchor="middle"
            fill="var(--dim)" fontSize="10" fontFamily="var(--font-mono)">
            {data[idx]?.year}
          </text>
        ))}

        {/* Phase labels (first occurrence) */}
        {["FRAG", "RESET", "RISE", "BUBBLE", "PEAK", "UNWIND"].map((phase) => {
          const idx = data.findIndex((d) => d.phase === phase);
          if (idx < 0) return null;
          return (
            <text key={phase} x={toX(idx) + 4} y={H - PAD - 20}
              fill={phaseColors[phase]} fontSize="9" fontFamily="var(--font-mono)" opacity={0.9}>
              {phase}
            </text>
          );
        })}

        <defs>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--caution)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="var(--caution)" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

/* ─── Slider ──────────────────────────────────────────────────────────────── */

function Slider({ label, value, min, max, step, onChange, fmt, accent = "var(--caution)" }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt: (v: number) => string; accent?: string;
}) {
  return (
    <div style={{ padding: "16px 20px", background: "var(--bg-raised)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.12em" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 700, color: accent, lineHeight: 1 }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: accent, cursor: "pointer", minHeight: 24 }} />
    </div>
  );
}

/* ─── Gap Bar ─────────────────────────────────────────────────────────────── */

function GapBar({ saved, target, currency, labels }: { saved: number; target: number; currency: string; labels: { target: string; saved: string; gap: string; shortBy: (s: string) => string; surplus: (s: string) => string } }) {
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const isSurplus = saved >= target;
  const gap = Math.abs(target - saved);
  const gapStr = `${currency}${Math.round(gap).toLocaleString()}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Target */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.1em", marginBottom: 6 }}>{labels.target}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 700, color: "var(--caution)", lineHeight: 1 }}>
            {currency}{Math.round(target).toLocaleString()}
          </div>
        </div>
        {/* Saved */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.1em", marginBottom: 6 }}>{labels.saved}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 700, color: "var(--muted)", lineHeight: 1 }}>
            {currency}{Math.round(saved).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bar */}
      <div style={{ height: 8, background: "var(--line)", overflow: "hidden", position: "relative" }}>
        <motion.div
          style={{ height: "100%", background: isSurplus ? "var(--bull)" : "var(--caution)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        />
        <div style={{ position: "absolute", right: 0, top: -18, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>
          {pct}%
        </div>
      </div>

      {/* Gap */}
      <div style={{
        padding: "14px 18px",
        background: isSurplus ? "rgba(0,255,136,0.06)" : "rgba(255,45,85,0.06)",
        border: `1px solid ${isSurplus ? "rgba(0,255,136,0.25)" : "rgba(255,45,85,0.25)"}`,
        textAlign: "center",
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.1em", marginBottom: 4 }}>{labels.gap}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 700, color: isSurplus ? "var(--bull)" : "var(--bear)", lineHeight: 1 }}>
          {isSurplus ? `✓ ${labels.surplus(gapStr)}` : `✗ ${labels.shortBy(gapStr)}`}
        </div>
      </div>
    </div>
  );
}

/* ─── Investment Path Card ────────────────────────────────────────────────── */

function InvestCard({ style, lang, geo, monthly, growth, years, target, selected, closesGap, riskLabel, onClick }: {
  style: { key: StyleKey; icon: string; label: Record<Lang, string>; ret: number; risk: string; color: string; desc: Record<Lang, string> };
  lang: Lang; geo: GeoKey; monthly: number; growth: number; years: number; target: number;
  selected: boolean; closesGap: string; riskLabel: string; onClick: () => void;
}) {
  const projected = investAccum(monthly, growth, style.ret, years);
  const pct = target > 0 ? Math.round((projected / target) * 100) : 0;
  const onTrack = projected >= target;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        padding: "18px",
        background: selected ? `color-mix(in srgb, ${style.color} 8%, var(--bg-raised))` : "var(--bg-raised)",
        border: `1px solid ${selected ? style.color : "var(--line)"}`,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{style.icon}</span>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: selected ? style.color : "var(--muted)", letterSpacing: "0.06em" }}>
            {style.label[lang]}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--dim)" }}>
            +{(style.ret * 100).toFixed(0)}%/yr · {riskLabel}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.5 }}>
        {style.desc[lang]}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${selected ? style.color : "var(--line)"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: selected ? style.color : "var(--dim)" }}>
            → {fmtC(projected, geo)}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: onTrack ? "var(--bull)" : "var(--bear)" }}>
            {onTrack ? `✓ ${closesGap}` : `${pct}%`}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════════════════ */

export default function PlanPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [geo, setGeo] = useState<GeoKey>("th");
  const [age, setAge] = useState(30);
  const [salary, setSalary] = useState(GEOS.th.defaultSalary);
  const [salaryGrowth, setSalaryGrowth] = useState(0.03);
  const [investStyle, setInvestStyle] = useState<StyleKey | null>(null);

  const g = GEOS[geo];
  const retireAge = g.retireAge;
  const yearsToRetire = Math.max(1, retireAge - age);
  const yearsPostRetire = Math.max(5, g.lifeExp - retireAge);

  // Target: expenses-based using geo default living as baseline
  const target = g.retireRef; // Use geo reference as target baseline

  // Investable = salary - basic expenses (using geo defaults as baseline)
  const expenses = g.defaultLiving + g.defaultTransport + g.defaultOther;
  const investable = Math.max(0, salary - expenses);

  // Savings-only projection
  const savingsOnly = pureSavings(investable, salaryGrowth, yearsToRetire);

  // With investment
  const styleData = investStyle ? INVEST.find((s) => s.key === investStyle) : null;
  const withInvest = styleData ? investAccum(investable, salaryGrowth, styleData.ret, yearsToRetire) : savingsOnly;

  const t = L[lang];

  return (
    <div className="page page-enter" style={{ width: "100%", maxWidth: 920, margin: "0 auto", padding: "24px 16px 80px" }}>

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.15em" }}>PLAN</span>
        <div style={{ display: "flex", gap: 2 }}>
          {(["en", "th", "zh"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
                color: lang === l ? "#000" : "var(--dim)",
                background: lang === l ? "var(--caution)" : "var(--bg-raised)",
                border: "1px solid var(--line)", padding: "4px 12px",
                cursor: "pointer", fontWeight: lang === l ? 700 : 400,
              }}>
              {l === "en" ? "EN" : l === "th" ? "ไทย" : "中"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Title ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: "var(--font-elegant)",
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          fontWeight: 500,
          color: "var(--ink)",
          lineHeight: 1.1,
          margin: "0 0 12px",
          letterSpacing: "-0.01em",
        }}>
          {t.title}
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
          {t.subtitle}
        </p>
      </motion.div>

      {/* ─── 50-Year Forecast ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{ marginBottom: 40, padding: "20px", background: "var(--bg-raised)", border: "1px solid var(--line)" }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.15em", marginBottom: 6 }}>
            {t.forecastTitle}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5 }}>
            {t.forecastSub}
          </div>
        </div>
        <ForecastChart />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--dim)", marginTop: 8, letterSpacing: "0.04em" }}>
          {t.cycleNote}
        </div>
      </motion.div>

      {/* ─── Inputs ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{ marginBottom: 40 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <Slider label={t.age} value={age} min={18} max={65} step={1}
            onChange={setAge} fmt={(v) => `${v}`} accent="var(--caution)" />
          <Slider label={t.salary} value={salary} min={0} max={g.salaryMax} step={1000}
            onChange={setSalary} fmt={(v) => fmtC(v, geo)} accent="var(--tech)" />

          {/* Geo picker */}
          <div style={{ padding: "16px 20px", background: "var(--bg-raised)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.12em" }}>{t.location}</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
              {(Object.entries(GEOS) as [GeoKey, typeof GEOS.th][]).map(([k, cfg]) => (
                <button key={k} onClick={() => { setGeo(k); setSalary(cfg.defaultSalary); }}
                  style={{
                    padding: "8px 4px",
                    background: geo === k ? "rgba(0,180,255,0.1)" : "transparent",
                    border: `1px solid ${geo === k ? "var(--tech)" : "var(--line)"}`,
                    color: geo === k ? "var(--tech)" : "var(--muted)",
                    fontFamily: "var(--font-mono)", fontSize: 10,
                    cursor: "pointer", textAlign: "center",
                  }}>
                  <div style={{ fontSize: 16 }}>{cfg.flag}</div>
                  <div>{cfg.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Salary growth */}
        <div style={{ marginTop: 12 }}>
          <Slider label={lang === "en" ? "SALARY GROWTH / YEAR" : lang === "th" ? "การเพิ่มเงินเดือนต่อปี" : "年薪增长率"}
            value={salaryGrowth} min={0} max={0.15} step={0.005}
            onChange={setSalaryGrowth} fmt={(v) => `${(v * 100).toFixed(0)}%`} accent="var(--bull)" />
        </div>
      </motion.div>

      {/* ─── Years to retire insight ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: "center", marginBottom: 32, padding: "16px", background: "var(--bg-raised)", border: "1px solid var(--line)" }}
      >
        <span style={{ fontFamily: "var(--font-elegant)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 500, color: "var(--tech)" }}>
          {2026 + yearsToRetire}
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", marginLeft: 8 }}>
          · {t.yrsToRetire(yearsToRetire)}
        </span>
      </motion.div>

      {/* ─── Gap Visualization ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        style={{ marginBottom: 40, padding: "24px", background: "var(--bg-raised)", border: "1px solid var(--line)" }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.15em", marginBottom: 20 }}>
          {t.closeGap}
        </div>
        <GapBar saved={savingsOnly} target={target} currency={g.currency} labels={{ target: t.target, saved: t.savedLabel, gap: t.gap, shortBy: t.shortBy, surplus: t.surplus }} />
      </motion.div>

      {/* ─── Investment Paths ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
        style={{ marginBottom: 40 }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.15em", marginBottom: 6 }}>
            {t.investTitle}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5 }}>
            {t.investSub}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {INVEST.map((s, i) => (
            <motion.div key={s.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.06 }}>
              <InvestCard
                style={s}
                lang={lang}
                geo={geo}
                monthly={investable}
                growth={salaryGrowth}
                years={yearsToRetire}
                target={target}
                selected={investStyle === s.key}
                closesGap={t.closesGap}
                riskLabel={t.risk[s.risk] || s.risk}
                onClick={() => setInvestStyle(s.key)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ─── Projected Comparison ───────────────────────────────────────────── */}
      {investStyle && styleData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 40, padding: "24px", background: "var(--bg-raised)", border: `1px solid ${styleData.color}` }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, textAlign: "center" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", marginBottom: 6 }}>{t.onlySave}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 700, color: "var(--muted)" }}>{fmtC(savingsOnly, geo)}</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", marginBottom: 6 }}>{styleData.label[lang]}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 700, color: styleData.color }}>{fmtC(withInvest, geo)}</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", marginBottom: 6 }}>{t.target}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 700, color: "var(--caution)" }}>{fmtC(target, geo)}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Action Steps ───────────────────────────────────────────────────── */}
      {investStyle && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.15em", marginBottom: 16 }}>
            {t.actions}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              lang === "en" ? "Open a brokerage or fund account. Start with the minimum." : lang === "th" ? "เปิดบัญชีหุ้นหรือกองทุน เริ่มที่จำนวนขั้นต่ำ" : "开设证券或基金账户。从最低金额开始。",
              lang === "en" ? `Set auto-transfer of ${fmtC(investable, geo)}/mo on salary day. Don't touch it.` : lang === "th" ? `ตั้งโอนอัตโนมัติ ${fmtC(investable, geo)}/เดือน วันที่ได้เงินเดือน ห้ามแตะ` : `设置发薪日自动转账 ${fmtC(investable, geo)}/月。不要碰它。`,
              lang === "en" ? "Review every 12 months. Rebalance. Then forget it again." : lang === "th" ? "ทบทวนทุก 12 เดือน ปรับสมดุล แล้วลืมมันไป" : "每12个月审视一次。再平衡。然后再忘掉它。",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "var(--bg-raised)", border: "1px solid var(--line)", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: styleData?.color || "var(--caution)", flexShrink: 0, minWidth: 28 }}>0{i + 1}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.55 }}>{text}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Disclaimer ─────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", paddingTop: 24, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.6, fontStyle: "italic" }}>
          {t.disclaimer}
        </div>
      </div>
    </div>
  );
}
