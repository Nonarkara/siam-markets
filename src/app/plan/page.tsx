"use client";

import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  type Lang,
  type GeoKey,
  type Allocation4,
  GEOS,
  pureSavings,
  projectWithCycle4,
  cycleStageForOffset,
  fmtC,
} from "@/components/Plan/plan-data";

/* ══════════════════════════════════════════════════════════════════════════════
   PLAN — Financial Intelligence
   Flow: WHAT → WHEN → WHY → HOW.
   The 50-year Dalio cycle chart is the engine: projectWithCycle4 rides the same
   year-by-year rates the chart draws. Need = 70% income-replacement (non-round).
   Three text sizes only (--text-display / --text-body / --text-micro). One amber.
   ══════════════════════════════════════════════════════════════════════════════ */

type LocKey = "en" | "th" | "zh";

/* ─── Cycle eras (year ranges + plain-language descriptors) ─────────────────── */

const ERAS: { phase: string; years: string; col: string; desc: Record<LocKey, string> }[] = [
  { phase: "FRAG",   years: "2026–28", col: "var(--bear)",    desc: { en: "fragile · sideways",  th: "เปราะบาง · ออกข้าง", zh: "脆弱 · 横盘" } },
  { phase: "RESET",  years: "2029–30", col: "var(--bear)",    desc: { en: "the crash ⚠",         th: "วิกฤต ⚠",            zh: "崩盘 ⚠" } },
  { phase: "RISE",   years: "2031–34", col: "var(--bull)",    desc: { en: "recovery boom",        th: "ฟื้นตัวพุ่ง",       zh: "复苏暴涨" } },
  { phase: "BUBBLE", years: "2035–42", col: "var(--bull)",    desc: { en: "expansion",            th: "ขยายตัว",           zh: "扩张" } },
  { phase: "PEAK",   years: "2043–45", col: "var(--caution)", desc: { en: "euphoria · top",       th: "ยอดดอย",            zh: "狂热 · 顶部" } },
  { phase: "UNWIND", years: "2046–50", col: "var(--muted)",   desc: { en: "decline",              th: "ถดถอย",             zh: "回落" } },
];

/* ─── Translations ─────────────────────────────────────────────────────────── */

const L: Record<LocKey, {
  tag: string; title: string; subtitle: string;
  forecastTitle: string; forecastSub: string; cycleTie: string;
  what: string; whatSub: string;
  age: string; salary: string; location: string; growth: string; savings: string;
  investLine: (mo: string, yrs: number) => string;
  when: string; whenSub: string;
  whenMath: (mo: string, g: number, avg: number, yrs: number) => string;
  projected: string; savingOnly: string;
  why: string; whySub: string; need: string;
  whyExplain: (fin: string, yrs: number) => string;
  how: string; howSub: string;
  onTrack: (s: string) => string; shortBy: (s: string) => string;
  bSaving: string; bSavingD: string;
  bMM: string; bMMD: string;
  bCM: string; bCMD: string;
  bDV: string; bDVD: string;
  sum: string; suggest: (a: Allocation4) => string; noSuggest: string;
  actions: string; act1: string; act2: (s: string) => string; act3: string;
  disclaimer: string;
}> = {
  en: {
    tag: "PLAN",
    title: "Your Financial Horizon",
    subtitle: "Four inputs. The next 50 years of the economy. What you'll have, what you'll need, and how to close the gap.",
    forecastTitle: "THE ECONOMY OF THE NEXT 50 YEARS",
    forecastSub: "Ray Dalio's debt-cycle framework. History doesn't repeat, but it rhymes.",
    cycleTie: "Your money rides this exact return sequence. A crash near your 60 hurts more than one early — that's why the mix matters.",
    what: "WHAT", whatSub: "Who you are. Four numbers.",
    age: "YOUR AGE", salary: "MONTHLY SALARY", location: "WHERE YOU LIVE", growth: "RAISE / YEAR", savings: "YOU SAVE",
    investLine: (mo, yrs) => `You invest ${mo}/mo · ${yrs} years to 60.`,
    when: "WHEN", whenSub: "How much you'll have at 60.",
    whenMath: (mo, g, avg, yrs) => `${mo}/mo, growing ${g}%/yr, riding the cycle (≈${avg}% blended), for ${yrs} years.`,
    projected: "YOU'LL HAVE", savingOnly: "if you only saved",
    why: "WHY", whySub: "How much a person like you needs.",
    need: "YOU NEED",
    whyExplain: (fin, yrs) => `At 60 your pay will be ≈${fin}/mo. People keep about 70% of that lifestyle. Over ~${yrs} years past 60, that is the number.`,
    how: "HOW", howSub: "Close the gap. Move the mix, watch it react.",
    onTrack: (s) => `✓ Ahead by ${s}`, shortBy: (s) => `✗ Short by ${s}`,
    bSaving: "SAVING",         bSavingD: "bank · cash · ~1%/yr · safe, loses to inflation",
    bMM: "MONEY MARKET",       bMMD: "deposits · gov bonds · ~4%/yr · steady",
    bCM: "CAPITAL MARKET",     bCMD: "funds · equities · rides the cycle · 7–10% long-run",
    bDV: "DERIVATIVES",        bDVD: "options · leverage · crypto · amplified · 90% lose",
    sum: "SUM",
    suggest: (a) => `Try ${a.saving}/${a.mm}/${a.cm}/${a.dv} to close it.`,
    noSuggest: "Even an aggressive mix can't close it. Raise income or save more.",
    actions: "YOUR NEXT 3 MOVES",
    act1: "Open a brokerage or fund account. Start with the minimum.",
    act2: (s) => `Auto-transfer ${s}/mo on salary day. Don't touch it.`,
    act3: "Review every 12 months. Rebalance. Then forget it again.",
    disclaimer: "Nominal values · no inflation adjustment · cycle rates are illustrative, from Dalio (2018) · past ≠ future · not investment advice",
  },
  th: {
    tag: "แผน",
    title: "ขอบฟ้าทางการเงินของคุณ",
    subtitle: "สี่ตัวเลข เศรษฐกิจ 50 ปีข้างหน้า คุณจะมีเท่าไหร่ ต้องมีเท่าไหร่ และจะปิดช่องว่างยังไง",
    forecastTitle: "เศรษฐกิจ 50 ปีข้างหน้า",
    forecastSub: "กรอบวัฏจักรหนี้ของ Ray Dalio ประวัติศาสตร์ไม่ซ้ำ แต่คล้องจอง",
    cycleTie: "เงินของคุณวิ่งไปตามลำดับผลตอบแทนนี้ วิกฤตที่ใกล้อายุ 60 เจ็บกว่าวิกฤตช่วงต้น นั่นคือเหตุผลที่สัดส่วนสำคัญ",
    what: "อะไร", whatSub: "คุณคือใคร สี่ตัวเลข",
    age: "อายุของคุณ", salary: "เงินเดือน", location: "คุณอยู่ที่ไหน", growth: "ขึ้นเงินเดือน/ปี", savings: "คุณออม",
    investLine: (mo, yrs) => `คุณลงทุน ${mo}/เดือน · เหลือ ${yrs} ปีถึง 60`,
    when: "เมื่อไหร่", whenSub: "ตอนอายุ 60 คุณจะมีเท่าไหร่",
    whenMath: (mo, g, avg, yrs) => `${mo}/เดือน เพิ่ม ${g}%/ปี วิ่งตามวัฏจักร (≈${avg}% เฉลี่ย) เป็นเวลา ${yrs} ปี`,
    projected: "คุณจะมี", savingOnly: "ถ้าออมอย่างเดียว",
    why: "ทำไม", whySub: "คนแบบคุณต้องมีเท่าไหร่",
    need: "คุณต้องมี",
    whyExplain: (fin, yrs) => `ตอนอายุ 60 เงินเดือนคุณจะ ≈${fin}/เดือน คนเรารักษาประมาณ 70% ของไลฟ์สไตล์นั้น ตลอด ~${yrs} ปีหลัง 60 นั่นคือตัวเลข`,
    how: "อย่างไร", howSub: "ปิดช่องว่าง ขยับสัดส่วน ดูมันเปลี่ยน",
    onTrack: (s) => `✓ เกินมา ${s}`, shortBy: (s) => `✗ ขาดอยู่ ${s}`,
    bSaving: "เงินออม",        bSavingD: "ธนาคาร · เงินสด · ~1%/ปี · ปลอดภัย แต่แพ้เงินเฟ้อ",
    bMM: "ตลาดเงิน",          bMMD: "เงินฝาก · พันธบัตรรัฐ · ~4%/ปี · นิ่ง",
    bCM: "ตลาดทุน",           bCMD: "กองทุน · หุ้น · วิ่งตามวัฏจักร · 7–10% ระยะยาว",
    bDV: "อนุพันธ์",          bDVD: "ออปชั่น · เลเวอเรจ · คริปโต · ขยายแรง · 90% ขาดทุน",
    sum: "รวม",
    suggest: (a) => `ลอง ${a.saving}/${a.mm}/${a.cm}/${a.dv} เพื่อปิดช่องว่าง`,
    noSuggest: "ถึงจะเสี่ยงสุดก็ปิดไม่ได้ ต้องเพิ่มรายได้หรือออมมากขึ้น",
    actions: "3 ขั้นตอนต่อไป",
    act1: "เปิดบัญชีหุ้นหรือกองทุน เริ่มที่ขั้นต่ำ",
    act2: (s) => `ตั้งโอนอัตโนมัติ ${s}/เดือน วันเงินเดือนออก ห้ามแตะ`,
    act3: "ทบทวนทุก 12 เดือน ปรับสมดุล แล้วลืมมันไป",
    disclaimer: "ค่าตามตัวเลข · ไม่ปรับเงินเฟ้อ · อัตราวัฏจักรเป็นตัวอย่าง จาก Dalio (2018) · อดีต ≠ อนาคต · ไม่ใช่คำแนะนำการลงทุน",
  },
  zh: {
    tag: "计划",
    title: "你的财务视野",
    subtitle: "四个输入。未来50年的经济。你会有多少、需要多少、以及如何补齐缺口。",
    forecastTitle: "未来50年的经济",
    forecastSub: "瑞·达利欧的债务周期框架。历史不会重复，但会押韵。",
    cycleTie: "你的钱沿着这条收益序列前行。临近60岁的崩盘比早年的更痛——这就是配置为何重要。",
    what: "什么", whatSub: "你是谁。四个数字。",
    age: "你的年龄", salary: "月薪", location: "你住在哪", growth: "年涨薪", savings: "你存",
    investLine: (mo, yrs) => `你每月投 ${mo} · 距60岁还有 ${yrs} 年`,
    when: "何时", whenSub: "到60岁你会有多少。",
    whenMath: (mo, g, avg, yrs) => `每月 ${mo}，每年涨 ${g}%，沿周期前行（≈${avg}% 混合），持续 ${yrs} 年。`,
    projected: "你会有", savingOnly: "若只存钱",
    why: "为何", whySub: "像你这样的人需要多少。",
    need: "你需要",
    whyExplain: (fin, yrs) => `60岁时你的月薪约 ${fin}。人们保留约70%的生活水准。在60岁后约 ${yrs} 年里，这就是目标数字。`,
    how: "如何", howSub: "补齐缺口。移动配置，看它反应。",
    onTrack: (s) => `✓ 超出 ${s}`, shortBy: (s) => `✗ 还差 ${s}`,
    bSaving: "储蓄",          bSavingD: "银行 · 现金 · ~1%/年 · 安全，跑输通胀",
    bMM: "货币市场",         bMMD: "存款 · 政府债 · ~4%/年 · 平稳",
    bCM: "资本市场",         bCMD: "基金 · 股票 · 沿周期 · 长期7–10%",
    bDV: "衍生品",           bDVD: "期权 · 杠杆 · 加密 · 放大 · 90%亏损",
    sum: "合计",
    suggest: (a) => `试试 ${a.saving}/${a.mm}/${a.cm}/${a.dv} 来补齐。`,
    noSuggest: "即便激进配置也补不齐。提高收入或多存。",
    actions: "你的下3步",
    act1: "开设证券或基金账户。从最低金额开始。",
    act2: (s) => `发薪日自动转账 ${s}/月。别碰它。`,
    act3: "每12个月回看。再平衡。然后再忘掉。",
    disclaimer: "名义值 · 未含通胀 · 周期利率为示例，源自 Dalio (2018) · 历史 ≠ 未来 · 非投资建议",
  },
};

/* ─── Big number style (--text-display, the only oversize tier) ─────────────── */

const bigNum: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-display)",
  fontWeight: 700,
  lineHeight: 1,
};

const actHead: React.CSSProperties = {
  fontFamily: "var(--font-elegant)",
  fontSize: "var(--text-display)",
  fontWeight: 500,
  color: "var(--ink)",
  lineHeight: 1.1,
  margin: 0,
  letterSpacing: "-0.01em",
};

/* ─── 50-Year Economic Forecast Chart ──────────────────────────────────────── */

function ForecastChart({ retireOffset }: { retireOffset: number }) {
  const W = 900, H = 220, PAD = 30;
  const chartW = W - PAD * 2;
  const chartH = H - PAD * 2;
  const yearsToShow = 50;

  const data = useMemo(() => {
    const out: { year: number; phase: string; rate: number }[] = [];
    for (let i = 0; i < yearsToShow; i++) {
      const stage = cycleStageForOffset(i);
      out.push({ year: 2026 + i, phase: stage.label, rate: stage.meanRate });
    }
    return out;
  }, []);

  const phaseColors: Record<string, string> = {
    FRAG: "var(--bear)", RESET: "var(--bear)", RISE: "var(--bull)",
    BUBBLE: "var(--bull)", PEAK: "var(--caution)", UNWIND: "var(--muted)",
  };

  const maxRate = 0.2, minRate = -0.08;
  const range = maxRate - minRate;
  const toX = (i: number) => PAD + (i / (data.length - 1)) * chartW;
  const toY = (r: number) => PAD + chartH - ((r - minRate) / range) * chartH;

  const areaPath = data.map((d, i) => {
    const x = toX(i), y = toY(d.rate);
    return `${i === 0 ? `M ${x} ${H - PAD}` : ""} L ${x} ${y}`;
  }).join(" ") + ` L ${toX(data.length - 1)} ${H - PAD} Z`;

  const linePath = data.map((d, i) =>
    `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.rate).toFixed(1)}`).join(" ");

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const retX = retireOffset > 0 && retireOffset < data.length ? toX(retireOffset) : null;

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={PAD} y1={toY(0)} x2={W - PAD} y2={toY(0)} stroke="var(--line)" strokeWidth={1} strokeDasharray="4 4" />

        {/* Phase bands */}
        {data.map((d, i) => {
          if (i === data.length - 1) return null;
          return (
            <rect key={i} x={toX(i)} y={H - PAD - 16} width={toX(i + 1) - toX(i)} height={10}
              fill={phaseColors[d.phase] || "var(--muted)"} opacity={0.5} />
          );
        })}

        {/* Area — flat low-opacity fill (no gradient, §11.6) */}
        <motion.path d={areaPath} fill="var(--caution)" fillOpacity={0.1}
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 1.5 }} />

        {/* Line */}
        <motion.path d={linePath} fill="none" stroke="var(--caution)" strokeWidth={2}
          initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }} />

        {/* Retirement marker */}
        {retX !== null && (
          <>
            <line x1={retX} y1={PAD - 6} x2={retX} y2={H - PAD} stroke="var(--ink)" strokeWidth={1.5} />
            <text x={retX} y={PAD - 10} textAnchor="middle" fill="var(--ink)" fontSize="11" fontFamily="var(--font-mono)">
              {2026 + retireOffset} · 60
            </text>
          </>
        )}

        {/* Year labels every 10 yrs */}
        {[0, 10, 20, 30, 40, 49].map((idx) => (
          <text key={idx} x={toX(idx)} y={H - 4} textAnchor="middle" fill="var(--dim)" fontSize="10" fontFamily="var(--font-mono)">
            {data[idx]?.year}
          </text>
        ))}

        {/* Phase tags (first occurrence) */}
        {["FRAG", "RESET", "RISE", "BUBBLE", "PEAK", "UNWIND"].map((phase) => {
          const idx = data.findIndex((d) => d.phase === phase);
          if (idx < 0) return null;
          return (
            <text key={phase} x={toX(idx) + 4} y={H - PAD - 20} fill={phaseColors[phase]} fontSize="9" fontFamily="var(--font-mono)" opacity={0.9}>
              {phase}
            </text>
          );
        })}
      </svg>
    </motion.div>
  );
}

/* ─── Era legend (explains what each stretch of years looks like) ───────────── */

function EraLegend({ lang }: { lang: LocKey }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 14 }}>
      {ERAS.map((e) => (
        <div key={e.phase} style={{ borderLeft: `2px solid ${e.col}`, paddingLeft: 8 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: e.col, letterSpacing: "0.08em", fontWeight: 700 }}>
            {e.phase} · {e.years}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>
            {e.desc[lang]}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Slider ───────────────────────────────────────────────────────────────── */

function Slider({ label, value, min, max, step, onChange, fmt, accent = "var(--caution)" }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt: (v: number) => string; accent?: string;
}) {
  return (
    <div style={{ padding: "16px 20px", background: "var(--bg-raised)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.12em" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: accent, lineHeight: 1 }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: accent, cursor: "pointer", minHeight: 44 }} />
    </div>
  );
}

/* ─── Act wrapper ──────────────────────────────────────────────────────────── */

function Act({ tag, head, sub, delay = 0, children }: {
  tag: string; head: string; sub: string; delay?: number; children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      style={{ marginBottom: 44, paddingTop: 28, borderTop: "1px solid var(--line)" }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", letterSpacing: "0.2em", fontWeight: 700 }}>{tag}</span>
        <h2 style={actHead}>{head}</h2>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 20px" }}>{sub}</p>
      {children}
    </motion.section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════════════════════════════════ */

export default function PlanPage() {
  const [lang, setLang]                 = useState<LocKey>("en");
  const [geo, setGeo]                   = useState<GeoKey>("th");
  const [age, setAge]                   = useState(30);
  const [salary, setSalary]             = useState(GEOS.th.defaultSalary);
  const [salaryGrowth, setSalaryGrowth] = useState(0.03);
  const [savingsRate, setSavingsRate]   = useState(0.20);
  const [alloc, setAlloc]               = useState<Allocation4>({ saving: 30, mm: 30, cm: 30, dv: 10 });

  const t = L[lang];
  const g = GEOS[geo];

  // ── Derived ──────────────────────────────────────────────────────────────
  const yearsToRetire   = Math.max(1, g.retireAge - age);
  const yearsPostRetire = Math.max(5, g.lifeExp - g.retireAge);
  const monthly         = Math.round(salary * savingsRate);
  const finalSalary     = salary * Math.pow(1 + salaryGrowth, yearsToRetire);
  const need            = finalSalary * 0.70 * 12 * yearsPostRetire;

  const series      = useMemo(() => projectWithCycle4(monthly, salaryGrowth, alloc, yearsToRetire),
    [monthly, salaryGrowth, alloc, yearsToRetire]);
  const projected   = series.length ? series[series.length - 1].value : 0;
  const savingsOnly = pureSavings(monthly, salaryGrowth, yearsToRetire);
  const gap         = need - projected;
  const onTrack     = projected >= need;
  const avgRate     = series.length ? series.reduce((s, p) => s + p.yearRate, 0) / series.length : 0;

  // ── Allocator rebalance (4 buckets → 100) ──────────────────────────────────
  function setBucket(key: keyof Allocation4, raw: number) {
    const nv = Math.max(0, Math.min(100, Math.round(raw)));
    const others = (["saving", "mm", "cm", "dv"] as (keyof Allocation4)[]).filter((k) => k !== key);
    const otherSum = others.reduce((s, k) => s + alloc[k], 0);
    const delta = nv - alloc[key];
    const next: Allocation4 = { ...alloc, [key]: nv };
    if (otherSum === 0) {
      const split = (100 - nv) / 3;
      others.forEach((k) => { next[k] = split; });
    } else {
      others.forEach((k) => { next[k] = Math.max(0, alloc[k] - (delta * alloc[k]) / otherSum); });
    }
    const r: Allocation4 = {
      saving: Math.round(next.saving), mm: Math.round(next.mm),
      cm: Math.round(next.cm), dv: Math.round(next.dv),
    };
    const total = r.saving + r.mm + r.cm + r.dv;
    if (total !== 100) {
      const fix = others.reduce((a, b) => (r[a] >= r[b] ? a : b));
      r[fix] = Math.max(0, r[fix] + (100 - total));
    }
    setAlloc(r);
  }

  // ── Suggestion when short ──────────────────────────────────────────────────
  const suggestion = useMemo<Allocation4 | null>(() => {
    if (onTrack) return null;
    const presets: Allocation4[] = [
      { saving: 20, mm: 30, cm: 45, dv: 5 },
      { saving: 10, mm: 25, cm: 60, dv: 5 },
      { saving: 10, mm: 15, cm: 70, dv: 5 },
      { saving: 5,  mm: 10, cm: 75, dv: 10 },
      { saving: 0,  mm: 10, cm: 75, dv: 15 },
    ];
    for (const p of presets) {
      const s = projectWithCycle4(monthly, salaryGrowth, p, yearsToRetire);
      if ((s[s.length - 1]?.value ?? 0) >= need) return p;
    }
    return null;
  }, [onTrack, monthly, salaryGrowth, yearsToRetire, need]);

  const buckets: { key: keyof Allocation4; label: string; desc: string; col: string }[] = [
    { key: "saving", label: t.bSaving, desc: t.bSavingD, col: "var(--muted)" },
    { key: "mm",     label: t.bMM,     desc: t.bMMD,     col: "var(--tech)" },
    { key: "cm",     label: t.bCM,     desc: t.bCMD,     col: "var(--bull)" },
    { key: "dv",     label: t.bDV,     desc: t.bDVD,     col: "var(--bear)" },
  ];

  // Accumulation sparkline (WHEN)
  const sparkPath = useMemo(() => {
    if (series.length < 2) return "";
    const W = 300, H = 44;
    const max = series[series.length - 1].value || 1;
    return series.map((p, i) =>
      `${i === 0 ? "M" : "L"} ${((i / (series.length - 1)) * W).toFixed(1)} ${(H - (p.value / max) * H).toFixed(1)}`
    ).join(" ");
  }, [series]);

  return (
    <div className="page page-enter" style={{ width: "100%", maxWidth: 920, margin: "0 auto", padding: "24px 16px 80px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.15em" }}>{t.tag}</span>
        <div style={{ display: "flex", gap: 2 }}>
          {(["en", "th", "zh"] as LocKey[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
              color: lang === l ? "#000" : "var(--dim)",
              background: lang === l ? "var(--caution)" : "var(--bg-raised)",
              border: "1px solid var(--line)", padding: "6px 12px", minHeight: 32,
              cursor: "pointer", fontWeight: lang === l ? 700 : 400,
            }}>
              {l === "en" ? "EN" : l === "th" ? "ไทย" : "中"}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: 36 }}>
        <h1 style={{ ...actHead, marginBottom: 12 }}>{t.title}</h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.6, maxWidth: 560, margin: 0 }}>{t.subtitle}</p>
      </motion.div>

      {/* Economic prediction — the engine */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
        style={{ marginBottom: 12, padding: "20px", background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.15em", marginBottom: 6 }}>{t.forecastTitle}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.5 }}>{t.forecastSub}</div>
        </div>
        <ForecastChart retireOffset={yearsToRetire} />
        <EraLegend lang={lang} />
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 14, lineHeight: 1.5, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          {t.cycleTie}
        </div>
      </motion.div>

      {/* WHAT */}
      <Act tag={t.what} head={t.whatSub} sub={t.investLine(fmtC(monthly, geo), yearsToRetire)} delay={0.05}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <Slider label={t.age} value={age} min={18} max={65} step={1} onChange={setAge} fmt={(v) => `${v}`} accent="var(--caution)" />
          <Slider label={t.salary} value={salary} min={5000} max={g.salaryMax} step={1000} onChange={setSalary} fmt={(v) => fmtC(v, geo)} accent="var(--tech)" />
          <Slider label={t.growth} value={salaryGrowth} min={0} max={0.15} step={0.005} onChange={setSalaryGrowth} fmt={(v) => `${(v * 100).toFixed(0)}%`} accent="var(--bull)" />
          <Slider label={t.savings} value={savingsRate} min={0.05} max={0.70} step={0.01} onChange={setSavingsRate} fmt={(v) => `${(v * 100).toFixed(0)}%`} accent="var(--caution)" />
        </div>
        {/* Geo picker */}
        <div style={{ marginTop: 12, padding: "16px 20px", background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.12em" }}>{t.location}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 4, marginTop: 8 }}>
            {(Object.entries(GEOS) as [GeoKey, typeof GEOS.th][]).map(([k, cfg]) => (
              <button key={k} onClick={() => { setGeo(k); setSalary(cfg.defaultSalary); }} style={{
                padding: "8px 4px", minHeight: 44,
                background: geo === k ? "color-mix(in srgb, var(--tech) 12%, transparent)" : "transparent",
                border: `1px solid ${geo === k ? "var(--tech)" : "var(--line)"}`,
                color: geo === k ? "var(--tech)" : "var(--muted)",
                fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", cursor: "pointer", textAlign: "center",
              }}>
                <div style={{ fontSize: 16 }}>{cfg.flag}</div>
                <div>{cfg.name}</div>
              </button>
            ))}
          </div>
        </div>
      </Act>

      {/* WHEN */}
      <Act tag={t.when} head={t.whenSub} sub={t.whenMath(fmtC(monthly, geo), Math.round(salaryGrowth * 100), Math.round(avgRate * 100), yearsToRetire)} delay={0.05}>
        <div style={{ padding: "24px", background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.12em", marginBottom: 8 }}>{t.projected}</div>
          <div style={{ ...bigNum, color: "var(--bull)" }}>{fmtC(projected, geo)}</div>
          {/* Accumulation sparkline */}
          {sparkPath && (
            <svg viewBox="0 0 300 44" style={{ width: "100%", height: 44, display: "block", marginTop: 16 }}>
              <path d={sparkPath} fill="none" stroke="var(--bull)" strokeWidth={2} />
            </svg>
          )}
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 10 }}>
            {t.savingOnly}: {fmtC(savingsOnly, geo)}
          </div>
        </div>
      </Act>

      {/* WHY */}
      <Act tag={t.why} head={t.whySub} sub={t.whyExplain(fmtC(Math.round(finalSalary), geo), yearsPostRetire)} delay={0.05}>
        <div style={{ padding: "24px", background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.12em", marginBottom: 8 }}>{t.need}</div>
          <div style={{ ...bigNum, color: "var(--caution)" }}>{fmtC(Math.round(need), geo)}</div>
        </div>
      </Act>

      {/* HOW */}
      <Act tag={t.how} head={t.howSub} sub="" delay={0.05}>
        {/* Gap banner */}
        <div style={{
          padding: "16px 20px", marginBottom: 16, textAlign: "center",
          border: `1px solid ${onTrack ? "var(--bull)" : "var(--bear)"}`,
          background: `color-mix(in srgb, ${onTrack ? "var(--bull)" : "var(--bear)"} 7%, transparent)`,
        }}>
          <div style={{ ...bigNum, fontSize: "var(--text-body)", color: onTrack ? "var(--bull)" : "var(--bear)" }}>
            {onTrack ? t.onTrack(fmtC(Math.abs(gap), geo)) : t.shortBy(fmtC(Math.abs(gap), geo))}
          </div>
        </div>

        {/* 4-bucket allocator */}
        {buckets.map((b) => (
          <div key={b.key} style={{ padding: "14px 0", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: b.col, letterSpacing: "0.08em", fontWeight: 700 }}>{b.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: b.col }}>{alloc[b.key]}%</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={alloc[b.key]}
              onChange={(e) => setBucket(b.key, Number(e.target.value))}
              style={{ width: "100%", accentColor: b.col, cursor: "pointer", minHeight: 44, display: "block" }} />
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", marginTop: 4 }}>{b.desc}</div>
          </div>
        ))}

        {/* Sum + suggestion */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>{t.sum}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--muted)" }}>{alloc.saving + alloc.mm + alloc.cm + alloc.dv}%</span>
        </div>
        {!onTrack && (
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--caution)", marginTop: 10, lineHeight: 1.5 }}>
            {suggestion ? t.suggest(suggestion) : t.noSuggest}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.15em", marginBottom: 12 }}>{t.actions}</div>
          {[t.act1, t.act2(fmtC(monthly, geo)), t.act3].map((text, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", marginBottom: 8, background: "var(--bg-raised)", border: "1px solid var(--line)", alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: "var(--caution)", flexShrink: 0, minWidth: 28 }}>0{i + 1}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.55 }}>{text}</div>
            </div>
          ))}
        </div>
      </Act>

      {/* Disclaimer */}
      <div style={{ textAlign: "center", paddingTop: 24, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.6 }}>{t.disclaimer}</div>
      </div>
    </div>
  );
}
