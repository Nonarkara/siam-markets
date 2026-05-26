"use client";

import { useState, useMemo } from "react";
import { fmtThb } from "@/lib/format";
import { DigitalBeaver } from "@/components/Mascot/DigitalBeaver";

// ═══════════════════════════════════════════════════════════════════════════════
// Plan page — narrative finance journey
// 7 chapters · Kiyosaki tone · Dalio-driven projection · 3-bucket builder
// All copy is honest about what this is and is not (illustrative, not advice).
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Thailand reference constants ────────────────────────────────────────────

const TH_LIFE_EXPECTANCY              = 78;       // World Bank 2023
const TH_RETIRE_AGE                   = 60;
const TH_MIDDLE_CLASS_BASELINE        = 18_000;   // NESDC 2024, THB/mo
const TH_MEDIAN_SAVINGS_AT_RETIREMENT = 350_000;  // BoT 2023 survey, THB (referenced in copy)

const NOW_YEAR = 2026;

// ─── Dalio cycle phase mapping ───────────────────────────────────────────────

interface CyclePhase {
  stage:    number;
  label:    string;
  meanRate: number;   // expected equity rate for the year
}

function cycleStageForOffset(yearOffset: number): CyclePhase {
  if (yearOffset <= 2)  return { stage: 5, label: "FRAG",   meanRate:  0.01 };
  if (yearOffset <= 4)  return { stage: 6, label: "RESET",  meanRate: -0.05 };
  if (yearOffset <= 8)  return { stage: 1, label: "RISE",   meanRate:  0.15 };
  if (yearOffset <= 16) return { stage: 2, label: "BUBBLE", meanRate:  0.11 };
  if (yearOffset <= 19) return { stage: 3, label: "PEAK",   meanRate:  0.10 };
  if (yearOffset <= 24) return { stage: 4, label: "UNWIND", meanRate:  0.02 };
  return cycleStageForOffset(yearOffset - 25);
}

// ─── Asset betas vs cycle ────────────────────────────────────────────────────

const MM_BETA = 0.3;
const CM_BETA = 1.0;
const DV_BETA = 2.5;

interface Allocation { mm: number; cm: number; dv: number }  // each 0–100, sum 100

function portfolioRateForCycle(cycleRate: number, a: Allocation): number {
  const mmRet = 0.04 + MM_BETA * (cycleRate - 0.07);
  const cmRet = CM_BETA * cycleRate;
  const dvRet = DV_BETA * cycleRate;
  return (a.mm / 100) * mmRet + (a.cm / 100) * cmRet + (a.dv / 100) * dvRet;
}

interface YearPoint {
  year:     number;
  value:    number;
  phase:    string;
  yearRate: number;
}

function projectWithCycle(
  monthly: number,
  alloc:   Allocation,
  years:   number,
): YearPoint[] {
  if (years <= 0 || monthly <= 0) return [];
  const out: YearPoint[] = [];
  let value = 0;
  for (let y = 0; y < years; y++) {
    const stage = cycleStageForOffset(y);
    const rate  = portfolioRateForCycle(stage.meanRate, alloc);
    const mRate = rate / 12;
    const yrContrib = Math.abs(mRate) < 1e-9
      ? monthly * 12
      : monthly * ((Math.pow(1 + mRate, 12) - 1) / mRate);
    value = value * (1 + rate) + yrContrib;
    out.push({ year: NOW_YEAR + y, value, phase: stage.label, yearRate: rate });
  }
  return out;
}

// Simple compound (for the "just save" chapter)
function projectAt(monthly: number, annualRate: number, years: number): number {
  if (years <= 0 || monthly <= 0) return 0;
  if (annualRate === 0) return monthly * 12 * years;
  const mr = annualRate / 12;
  return monthly * ((Math.pow(1 + mr, years * 12) - 1) / mr);
}

// Suggested allocation: scan a coarse grid, return first that meets target
function suggestAllocation(monthly: number, target: number, years: number): Allocation | null {
  if (monthly <= 0 || target <= 0 || years <= 0) return null;
  const candidates: Allocation[] = [
    { mm: 70, cm: 28, dv:  2 },
    { mm: 50, cm: 45, dv:  5 },
    { mm: 30, cm: 60, dv: 10 },
    { mm: 20, cm: 70, dv: 10 },
    { mm: 15, cm: 70, dv: 15 },
    { mm: 10, cm: 70, dv: 20 },
    { mm:  5, cm: 70, dv: 25 },
  ];
  for (const a of candidates) {
    const series = projectWithCycle(monthly, a, years);
    const final  = series[series.length - 1]?.value ?? 0;
    if (final >= target) return a;
  }
  return null;
}

// ─── Format helpers ──────────────────────────────────────────────────────────

function fmtM(v: number): string {
  if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `฿${(v / 1_000).toFixed(0)}K`;
  return fmtThb(Math.round(v));
}

// ─── Translations ────────────────────────────────────────────────────────────

type Lang = "en" | "th" | "zh";

interface Translations {
  appTag: string;
  ch1: string; ch2: string; ch3: string; ch4: string; ch5: string; ch6: string; ch7: string;
  hookHead: string; hookSub: string; hookFig: string; hookCite: string; hookHint: string;
  curveHead: string; curveBody: string;
  curveLabelPeak: string; curveLabelEnd: string; curveAge: string; curvePost: string;
  nHead:    string;
  nIncome:  string; nExpense: string;
  nTarget:  (years: number, amount: string) => string;
  nYrsLeft: (n: number) => string;
  nYrsPost: (n: number) => string;
  saveHead: string; saveMatt: string; saveBank: string; saveTarget: string;
  saveResult: (shortBy: string) => string;
  saveOnTrack: string; saveCite: string;
  cycleHead: string; cycleBody: string; cycleNote: string;
  cyclePhaseHere: string; cycleRetAge: string;
  buildHead: string;
  buildMM:  string; buildMMd: string;
  buildCM:  string; buildCMd: string;
  buildDV:  string; buildDVd: string;
  buildSum: string;
  buildProj: string; buildOK: string;
  buildShort: (amt: string) => string;
  buildSugg:  (mm: number, cm: number, dv: number) => string;
  buildNoSugg: string;
  commHead: string; commYouAre: string;
  commIncomeLabel: string; commExpenseLabel: string;
  commTargetLabel: string; commProjectedLabel: string; commAllocLabel: string;
  commAct1: string;
  commAct2: (amt: string) => string;
  commAct3: string;
  commShare: string; commCopy: string;
  commNoSave: string;
  footnote: string;
}

const T: Record<Lang, Translations> = {
  en: {
    appTag: "SIAM · PLAN",
    ch1: "01 · HOOK",     ch2: "02 · CURVE",   ch3: "03 · NUMBERS",
    ch4: "04 · SAVING",   ch5: "05 · CYCLE",   ch6: "06 · BUILDER",
    ch7: "07 · COMMIT",
    hookHead: "Do you know your own finance?",
    hookSub:  "No. Most don't. The ones who do retire on time.",
    hookFig:  "฿350,000",
    hookCite: "median Thai household savings AT retirement · BoT 2023",
    hookHint: "scroll · find out what yours has to be",
    curveHead: "The curve nobody draws for you.",
    curveBody: "Federer was the best at 27. Magnus Carlsen peaked at 31. The athletes you know are retired by 35. You will hit the same curve — you just don't see your peak until you're past it. The years on the way down are paid for by the years on the way up. Did you stack enough?",
    curveLabelPeak: "peak",
    curveLabelEnd:  "78",
    curveAge:       "AGE",
    curvePost:      "you · today",
    nHead:    "Two numbers. That's all.",
    nIncome:  "income · per month",
    nExpense: "expenses · per month",
    nTarget:  (yrs: number) => `To live ${yrs} years after 60 at middle-class minimum in Thailand, you need this the day you turn 60:`,
    nYrsLeft: (n: number) => `${n} years to build`,
    nYrsPost: (n: number) => `${n} years after`,
    saveHead: "What happens if you just save?",
    saveMatt: "MATTRESS · 0%",
    saveBank: "BANK · 1% real",
    saveTarget: "TARGET",
    saveResult: (s: string) => `Short by ${s}. Saving keeps the number. It loses the value.`,
    saveOnTrack: "Saving alone gets you there. Most don't have your income.",
    saveCite: "The Thai baht lost ~30% of purchasing power 2014–2024 · BoT CPI",
    cycleHead: "The world isn't a smooth line.",
    cycleBody: "Stages from Ray Dalio's Big Debt Crises (2018). Pattern match across ~16 historical cycles. No fixed duration. Not a forecast — a structure recognition.",
    cycleNote: "rate per year if you went 100% equities. your portfolio rate depends on allocation.",
    cyclePhaseHere: "we are here · stage 5 FRAG",
    cycleRetAge:    "your 60",
    buildHead: "Now allocate. Watch the number react.",
    buildMM:  "MONEY MARKET",
    buildMMd: "deposits · gov bonds · ~4%/yr · inflation eats some",
    buildCM:  "CAPITAL MARKET",
    buildCMd: "mutual funds · equities · 7–10%/yr long-term · volatile",
    buildDV:  "DERIVATIVES",
    buildDVd: "options · leverage · crypto · −100% to +600% · 90% lose",
    buildSum: "SUM",
    buildProj:  "PROJECTED AT 60",
    buildOK:    "✓ ON TRACK",
    buildShort: (a: string) => `✗ STILL SHORT BY ${a}`,
    buildSugg:  (mm: number, cm: number, dv: number) => `Try ${mm} / ${cm} / ${dv} to close the gap.`,
    buildNoSugg: "Even aggressive can't close the gap. Income or expenses must change.",
    commHead: "Three things, and you walk away.",
    commYouAre:        "YOUR PLAN",
    commIncomeLabel:   "INCOME",
    commExpenseLabel:  "EXPENSES",
    commTargetLabel:   "TARGET · AT 60",
    commProjectedLabel:"PROJECTED",
    commAllocLabel:    "ALLOCATION",
    commAct1: "Open auto-invest at a TH broker — Krungsri, Kasikorn, SCB, Bualuang.",
    commAct2: (a: string) => `Set a monthly transfer of ${a} into the chosen mix. Don't touch it.`,
    commAct3: "Review once every 12 months. Rebalance. Then forget it again.",
    commShare:  "share this plan",
    commCopy:   "link copied",
    commNoSave: "This page does not save your numbers. Take a screenshot. Talk to a real advisor. Or send this link to a friend who needs it.",
    footnote:   "Rates derived from Ray Dalio Big Debt Crises (2018) · illustrative only · not investment advice",
  },
  th: {
    appTag: "SIAM · แผน",
    ch1: "01 · เปิด",    ch2: "02 · เส้นโค้ง",  ch3: "03 · ตัวเลข",
    ch4: "04 · ออม",     ch5: "05 · วัฏจักร",  ch6: "06 · จัดพอร์ต",
    ch7: "07 · ลงมือ",
    hookHead: "คุณรู้จักการเงินของคุณดีพอไหม?",
    hookSub:  "ไม่หรอก คนส่วนมากไม่รู้ คนที่รู้ คือคนที่เกษียณทันเวลา",
    hookFig:  "฿350,000",
    hookCite: "ค่ามัธยฐานเงินออมครัวเรือนไทย ณ วันเกษียณ · ธปท. 2023",
    hookHint: "เลื่อนลง · ดูตัวเลขของคุณ",
    curveHead: "เส้นโค้งที่ไม่มีใครวาดให้คุณดู",
    curveBody: "เฟเดอเรอร์ที่ดีที่สุดตอนอายุ 27 คาร์ลเซนสุดยอดตอน 31 นักกีฬาที่คุณรู้จักเลิกเล่นกันที่ 35 คุณก็จะเจอเส้นโค้งเดียวกัน — เพียงแต่จะเห็นจุดสูงสุดของตัวเองได้ตอนผ่านไปแล้ว ปีที่กำลังตกต่ำต้องอาศัยเงินที่ปีขาขึ้นเก็บไว้ คุณเก็บพอหรือยัง?",
    curveLabelPeak: "จุดพีค",
    curveLabelEnd:  "78",
    curveAge:       "อายุ",
    curvePost:      "คุณ · วันนี้",
    nHead:    "แค่สองตัวเลข",
    nIncome:  "รายได้ · ต่อเดือน",
    nExpense: "ค่าใช้จ่าย · ต่อเดือน",
    nTarget:  (yrs: number) => `เพื่อให้อยู่ได้ ${yrs} ปีหลังอายุ 60 ที่ระดับชนชั้นกลางในประเทศไทย คุณต้องมีจำนวนนี้ในวันที่อายุครบ 60:`,
    nYrsLeft: (n: number) => `เหลือ ${n} ปีก่อนเกษียณ`,
    nYrsPost: (n: number) => `${n} ปีหลังเกษียณ`,
    saveHead: "ถ้าออมเงินอย่างเดียว จะเป็นยังไง?",
    saveMatt: "ใต้หมอน · 0%",
    saveBank: "ฝากธนาคาร · 1% จริง",
    saveTarget: "เป้าหมาย",
    saveResult: (s: string) => `ขาดอยู่ ${s} การออมเก็บตัวเลขไว้ได้ แต่เก็บมูลค่าไว้ไม่ได้`,
    saveOnTrack: "ออมอย่างเดียวก็พอ แต่คนส่วนใหญ่ไม่มีรายได้เท่าคุณ",
    saveCite: "เงินบาทเสียกำลังซื้อ ~30% ระหว่าง 2014–2024 · ธปท. CPI",
    cycleHead: "โลกไม่ใช่เส้นตรงเรียบๆ",
    cycleBody: "ขั้นจากหนังสือ Big Debt Crises ของ Ray Dalio (2018) จับรูปแบบจากวัฏจักรในประวัติศาสตร์ ~16 รอบ ไม่มีระยะเวลาที่แน่นอน ไม่ใช่การพยากรณ์ — เป็นการรู้จักโครงสร้าง",
    cycleNote: "อัตราต่อปีหากลงหุ้น 100% อัตราพอร์ตจริงขึ้นกับการจัดสรรของคุณ",
    cyclePhaseHere: "เราอยู่ตรงนี้ · ขั้น 5 FRAG",
    cycleRetAge:    "อายุ 60 ของคุณ",
    buildHead: "ลองจัดสรรดู ดูตัวเลขเปลี่ยน",
    buildMM:  "ตลาดเงิน",
    buildMMd: "เงินฝาก · พันธบัตรรัฐ · ~4%/ปี · เงินเฟ้อกินบ้าง",
    buildCM:  "ตลาดทุน",
    buildCMd: "กองทุนรวม · หุ้น · 7–10%/ปี ระยะยาว · ผันผวน",
    buildDV:  "อนุพันธ์",
    buildDVd: "ออปชั่น · เลเวอเรจ · คริปโต · −100% ถึง +600% · 90% ขาดทุน",
    buildSum: "รวม",
    buildProj:  "ประมาณการตอนอายุ 60",
    buildOK:    "✓ ตรงตามเป้า",
    buildShort: (a: string) => `✗ ขาดอยู่ ${a}`,
    buildSugg:  (mm: number, cm: number, dv: number) => `ลอง ${mm} / ${cm} / ${dv} เพื่อปิดช่องว่าง`,
    buildNoSugg: "ถึงจะเสี่ยงสุด ก็ยังไม่ถึงเป้า ต้องปรับรายได้หรือค่าใช้จ่าย",
    commHead: "สามอย่าง แล้วเดินจากไปได้",
    commYouAre:         "แผนของคุณ",
    commIncomeLabel:    "รายได้",
    commExpenseLabel:   "ค่าใช้จ่าย",
    commTargetLabel:    "เป้า · 60",
    commProjectedLabel: "ประมาณการ",
    commAllocLabel:     "การจัดสรร",
    commAct1: "เปิดบัญชีลงทุนอัตโนมัติกับโบรกเกอร์ไทย — กรุงศรี กสิกร SCB บัวหลวง",
    commAct2: (a: string) => `ตั้งโอนเงินเข้าทุกเดือน ${a} ห้ามแตะ`,
    commAct3: "ทบทวนปีละครั้ง ปรับสมดุล แล้วลืมมันไป",
    commShare:  "ส่งแผนนี้",
    commCopy:   "คัดลอกลิงก์แล้ว",
    commNoSave: "หน้านี้ไม่ได้บันทึกตัวเลขของคุณ บันทึกหน้าจอไว้ คุยกับที่ปรึกษาตัวจริง หรือส่งลิงก์นี้ให้เพื่อนที่ต้องการ",
    footnote:   "อ้างอิงอัตราจาก Ray Dalio Big Debt Crises (2018) · เพียงตัวอย่าง · ไม่ใช่คำแนะนำการลงทุน",
  },
  zh: {
    appTag: "SIAM · 计划",
    ch1: "01 · 钩子",  ch2: "02 · 曲线",  ch3: "03 · 数字",
    ch4: "04 · 储蓄",  ch5: "05 · 周期",  ch6: "06 · 配置",
    ch7: "07 · 行动",
    hookHead: "你真的了解自己的财务吗？",
    hookSub:  "不。大多数人都不。了解的人，会准时退休。",
    hookFig:  "฿350,000",
    hookCite: "退休时泰国家庭储蓄中位数 · 泰央行 2023",
    hookHint: "向下滑动 · 算出你自己的数字",
    curveHead: "没人为你画过的那条曲线。",
    curveBody: "费德勒27岁登顶。卡尔森31岁达到巅峰。你认识的运动员35岁就退役。你也会遇到同一条曲线 — 只是过了顶点才会发现。下坡的年份要靠上坡的年份养着。你攒够了吗？",
    curveLabelPeak: "顶点",
    curveLabelEnd:  "78",
    curveAge:       "年龄",
    curvePost:      "你 · 今天",
    nHead:    "两个数字。仅此而已。",
    nIncome:  "月收入",
    nExpense: "月支出",
    nTarget:  (yrs: number) => `要在60岁后于泰国按中产基本生活水准过 ${yrs} 年，你需要在60岁那天拥有:`,
    nYrsLeft: (n: number) => `还有 ${n} 年`,
    nYrsPost: (n: number) => `退休后 ${n} 年`,
    saveHead: "如果只是储蓄会怎样？",
    saveMatt: "床垫下 · 0%",
    saveBank: "银行存款 · 1% 实际",
    saveTarget: "目标",
    saveResult: (s: string) => `还差 ${s}。储蓄保住了数字，失去了价值。`,
    saveOnTrack: "光储蓄就够了。大多数人没你这样的收入。",
    saveCite: "泰铢2014–2024年累计贬值约30%购买力 · 泰央行 CPI",
    cycleHead: "世界不是一条直线。",
    cycleBody: "阶段来自瑞·达利欧《大债务危机》(2018)。模式识别基于约16个历史周期。没有固定期限。不是预测 — 是对结构的认知。",
    cycleNote: "100%股票时的年化率。组合实际利率取决于你的配置。",
    cyclePhaseHere: "我们在这 · 第5阶段 FRAG",
    cycleRetAge:    "你的60岁",
    buildHead: "现在配置。看数字反应。",
    buildMM:  "货币市场",
    buildMMd: "存款 · 政府债 · ~4%/年 · 通胀吃掉一些",
    buildCM:  "资本市场",
    buildCMd: "公募基金 · 股票 · 长期7–10%/年 · 短期波动",
    buildDV:  "衍生品",
    buildDVd: "期权 · 杠杆 · 加密 · −100% 到 +600% · 90%亏损",
    buildSum: "合计",
    buildProj:  "60岁预计",
    buildOK:    "✓ 达标",
    buildShort: (a: string) => `✗ 还差 ${a}`,
    buildSugg:  (mm: number, cm: number, dv: number) => `试试 ${mm} / ${cm} / ${dv} 来补齐。`,
    buildNoSugg: "即便激进配置也补不齐。必须调整收入或支出。",
    commHead: "三件事，然后你可以离开。",
    commYouAre:         "你的计划",
    commIncomeLabel:    "收入",
    commExpenseLabel:   "支出",
    commTargetLabel:    "目标 · 60",
    commProjectedLabel: "预计",
    commAllocLabel:     "配置",
    commAct1: "在泰国券商开自动定投账户 — 大城、开泰、SCB、Bualuang。",
    commAct2: (a: string) => `设置每月自动转账 ${a} 进入你选的配置。别碰它。`,
    commAct3: "每12个月回看一次。再平衡。然后再忘掉它。",
    commShare:  "分享这份计划",
    commCopy:   "链接已复制",
    commNoSave: "本页不保存你的数字。截图。和真正的顾问聊聊。或把链接发给需要的朋友。",
    footnote:   "利率参考自瑞·达利欧《大债务危机》(2018) · 仅作示例 · 不构成投资建议",
  },
};

// ─── Slider primitive ────────────────────────────────────────────────────────

function Slider({ value, min, max, step, onChange, accent }: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; accent?: string;
}) {
  return (
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: "100%", height: 3, minHeight: 44, display: "block",
        accentColor: accent ?? "var(--caution)", cursor: "pointer",
      }}
    />
  );
}

// ─── Chapter wrapper ─────────────────────────────────────────────────────────

function Chapter({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <section style={{
      padding: "36px 0 44px",
      borderTop: "1px solid var(--line)",
      display: "flex", flexDirection: "column",
      gap: 16,
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
        color: "var(--dim)", letterSpacing: "0.16em",
      }}>
        {tag}
      </div>
      {children}
    </section>
  );
}

function ChapterHead({ text }: { text: string }) {
  return (
    <h2 style={{
      fontFamily: "var(--font-display, 'Josefin Sans'), sans-serif",
      fontSize: "var(--text-display)",
      fontWeight: 700, color: "var(--ink)", lineHeight: 1.1, margin: 0,
      letterSpacing: "-0.01em",
    }}>
      {text}
    </h2>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ch 1 — HOOK
// ═══════════════════════════════════════════════════════════════════════════════

function HookChapter({ t }: { t: Translations }) {
  return (
    <Chapter tag={t.ch1}>
      <ChapterHead text={t.hookHead} />
      <p className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
        {t.hookSub}
      </p>
      <div style={{
        marginTop: 12, padding: "16px 0",
        borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--text-display)",
          fontWeight: 700, color: "var(--caution)", lineHeight: 1,
        }}>
          {t.hookFig}
        </div>
        <div className="t-micro" style={{
          color: "var(--dim)", marginTop: 6, textTransform: "none", letterSpacing: 0,
        }}>
          {t.hookCite}
        </div>
      </div>
      <div className="t-micro" style={{ color: "var(--muted)", marginTop: 4 }}>
        ↓ {t.hookHint}
      </div>
    </Chapter>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ch 2 — BELL CURVE
// ═══════════════════════════════════════════════════════════════════════════════

function BellCurveChapter({ t, age, setAge }: {
  t: Translations; age: number; setAge: (v: number) => void;
}) {
  const W = 600, H = 200;
  const PEAK_AGE = 42;
  function ageToX(a: number) { return ((a - 18) / (78 - 18)) * W; }
  function capability(a: number) {
    const d = (a - PEAK_AGE) / 24;
    return Math.max(0, 1 - d * d);
  }
  function capToY(c: number) { return H - 30 - c * (H - 60); }

  const points: string[] = [];
  for (let a = 18; a <= 78; a++) {
    points.push(`${ageToX(a).toFixed(1)},${capToY(capability(a)).toFixed(1)}`);
  }
  const dotX = ageToX(age);
  const dotY = capToY(capability(age));

  return (
    <Chapter tag={t.ch2}>
      <ChapterHead text={t.curveHead} />
      <p className="t-body" style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
        {t.curveBody}
      </p>

      <div style={{ marginTop: 12, padding: "12px 0", borderTop: "1px solid var(--line)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
          aria-label="Capability vs age curve"
        >
          <line x1={0} y1={H - 30} x2={W} y2={H - 30} stroke="var(--line)" strokeWidth={1} />
          <polyline points={points.join(" ")} fill="none" stroke="var(--ink)" strokeWidth={1.5} opacity={0.7} />
          <line x1={ageToX(PEAK_AGE)} y1={H - 30} x2={ageToX(PEAK_AGE)} y2={capToY(1)} stroke="var(--dim)" strokeDasharray="3 3" strokeWidth={1} />
          <circle cx={dotX} cy={dotY} r={6} fill="var(--caution)" />
          <line x1={dotX} y1={dotY} x2={dotX} y2={H - 30} stroke="var(--caution)" strokeWidth={1.5} />
          <text x={dotX} y={H - 12} fill="var(--caution)" fontSize="13" fontFamily="var(--font-mono)" fontWeight={700}
            textAnchor={age < 28 ? "start" : age > 68 ? "end" : "middle"}>
            {age}
          </text>
          <text x={W - 4} y={H - 12} fill="var(--dim)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="end">
            {t.curveLabelEnd}
          </text>
          <text x={ageToX(PEAK_AGE)} y={capToY(1) - 8} fill="var(--dim)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle">
            {t.curveLabelPeak} · {PEAK_AGE}
          </text>
        </svg>
      </div>

      <div style={{ paddingTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{t.curveAge}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--caution)" }}>
            {age}
          </span>
        </div>
        <Slider value={age} min={18} max={65} step={1} onChange={setAge} />
        <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: 8 }}>
          {t.curvePost}
        </div>
      </div>
    </Chapter>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ch 3 — NUMBERS
// ═══════════════════════════════════════════════════════════════════════════════

function NumbersChapter({ t, income, setIncome, expenses, setExpenses, target, yearsToRetire, yearsPostRetire }: {
  t: Translations;
  income: number;   setIncome:   (v: number) => void;
  expenses: number; setExpenses: (v: number) => void;
  target: number; yearsToRetire: number; yearsPostRetire: number;
}) {
  return (
    <Chapter tag={t.ch3}>
      <ChapterHead text={t.nHead} />

      <div style={{ padding: "12px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{t.nIncome.toUpperCase()}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>
            {fmtThb(income)}
          </span>
        </div>
        <Slider value={income} min={5_000} max={300_000} step={1_000} onChange={setIncome} />
      </div>

      <div style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{t.nExpense.toUpperCase()}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>
            {fmtThb(expenses)}
          </span>
        </div>
        <Slider value={expenses} min={8_000} max={100_000} step={500} onChange={setExpenses} />
      </div>

      <div style={{ display: "flex", gap: 32, paddingTop: 8 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--caution)" }}>
            {yearsToRetire}
          </div>
          <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0 }}>
            {t.nYrsLeft(yearsToRetire)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--muted)" }}>
            {yearsPostRetire}
          </div>
          <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0 }}>
            {t.nYrsPost(yearsPostRetire)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, padding: "16px 0 0", borderTop: "1px solid var(--line)" }}>
        <p className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
          {t.nTarget(yearsPostRetire, "")}
        </p>
        <div style={{
          marginTop: 12,
          fontFamily: "var(--font-mono)", fontSize: "var(--text-display)",
          fontWeight: 700, color: "var(--caution)", lineHeight: 1,
        }}>
          {fmtM(target)}
        </div>
      </div>
    </Chapter>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ch 4 — JUST SAVING
// ═══════════════════════════════════════════════════════════════════════════════

function JustSavingChapter({ t, income, expenses, target, yearsToRetire }: {
  t: Translations;
  income: number; expenses: number; target: number; yearsToRetire: number;
}) {
  const investable = Math.max(0, income - expenses);
  const mattress   = investable * 12 * yearsToRetire;
  const bank       = projectAt(investable, 0.01, yearsToRetire);
  const best       = Math.max(mattress, bank);
  const shortBy    = Math.max(0, target - best);
  const maxBar     = Math.max(target, best) || 1;
  const wMatt      = (mattress / maxBar) * 100;
  const wBank      = (bank / maxBar)     * 100;

  return (
    <Chapter tag={t.ch4}>
      <ChapterHead text={t.saveHead} />

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", width: 124, flexShrink: 0 }}>
            {t.saveMatt}
          </div>
          <div style={{ flex: 1, height: 18, background: "var(--bg-raised)", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${wMatt}%`, background: "var(--muted)", opacity: 0.6 }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", width: 78, textAlign: "right", flexShrink: 0 }}>
            {fmtM(mattress)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", width: 124, flexShrink: 0 }}>
            {t.saveBank}
          </div>
          <div style={{ flex: 1, height: 18, background: "var(--bg-raised)", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${wBank}%`, background: "var(--ink)", opacity: 0.7 }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", width: 78, textAlign: "right", flexShrink: 0 }}>
            {fmtM(bank)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", width: 124, flexShrink: 0 }}>
            {t.saveTarget}
          </div>
          <div style={{ flex: 1, height: 18, background: "var(--bg-raised)", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "100%", background: "var(--caution)", opacity: 0.85 }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", width: 78, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>
            {fmtM(target)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, padding: "16px 0 0", borderTop: "1px solid var(--line)" }}>
        <p className="t-body" style={{
          color: shortBy > 0 ? "var(--bear)" : "var(--bull)",
          lineHeight: 1.6, margin: 0, fontWeight: 700,
        }}>
          {shortBy > 0 ? t.saveResult(fmtM(shortBy)) : t.saveOnTrack}
        </p>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 10, textTransform: "none", letterSpacing: 0 }}>
          {t.saveCite}
        </div>
      </div>
    </Chapter>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ch 5 — CYCLE
// ═══════════════════════════════════════════════════════════════════════════════

function CycleChapter({ t, yearsToRetire }: { t: Translations; yearsToRetire: number }) {
  const ILLU_MONTHLY = 10_000;
  const ILLU_ALLOC: Allocation = { mm: 0, cm: 100, dv: 0 };
  const series = useMemo(
    () => projectWithCycle(ILLU_MONTHLY, ILLU_ALLOC, Math.max(yearsToRetire, 20)),
    [yearsToRetire],
  );

  if (series.length === 0) return (
    <Chapter tag={t.ch5}><ChapterHead text={t.cycleHead} /></Chapter>
  );

  const W = 600, H = 200;
  const vals = series.map(p => p.value);
  const maxV = Math.max(...vals);
  const minV = Math.min(...vals, 0);
  const rng  = (maxV - minV) || 1;
  function xAt(i: number) { return (i / (series.length - 1)) * W; }
  function yAt(v: number) { return H - 38 - ((v - minV) / rng) * (H - 60); }
  const path = series.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.value).toFixed(1)}`).join(" ");

  const retX = yearsToRetire <= series.length ? xAt(yearsToRetire - 1) : null;

  const phaseColors: Record<string, string> = {
    FRAG:   "var(--bear)",
    RESET:  "var(--bear)",
    RISE:   "var(--bull)",
    BUBBLE: "var(--bull)",
    PEAK:   "var(--caution)",
    UNWIND: "var(--muted)",
  };

  return (
    <Chapter tag={t.ch5}>
      <ChapterHead text={t.cycleHead} />
      <p className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
        {t.cycleBody}
      </p>

      <div style={{ marginTop: 12 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
          aria-label="Year-by-year equity projection with cycle phases"
        >
          <line x1={0} y1={yAt(0)} x2={W} y2={yAt(0)} stroke="var(--line)" strokeDasharray="3 3" />

          {series.map((p, i) => {
            const x  = xAt(i);
            const x2 = i < series.length - 1 ? xAt(i + 1) : W;
            return (
              <rect key={i} x={x} y={H - 28} width={x2 - x} height={7}
                fill={phaseColors[p.phase] ?? "var(--muted)"} opacity={0.55} />
            );
          })}

          <path d={path} fill="none" stroke="var(--caution)" strokeWidth={2} />
          {series.map((p, i) => (
            <circle key={i} cx={xAt(i)} cy={yAt(p.value)} r={2.5}
              fill={p.yearRate < 0 ? "var(--bear)" : "var(--bull)"} />
          ))}

          {retX !== null && (
            <>
              <line x1={retX} y1={20} x2={retX} y2={H - 28} stroke="var(--caution)" strokeWidth={1.5} />
              <text x={retX} y={16} fill="var(--caution)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle">
                {t.cycleRetAge}
              </text>
            </>
          )}

          {(["FRAG", "RESET", "RISE", "BUBBLE", "PEAK", "UNWIND"] as const).map(label => {
            const firstIdx = series.findIndex(p => p.phase === label);
            if (firstIdx < 0) return null;
            return (
              <text key={label} x={xAt(firstIdx) + 2} y={H - 12} fill={phaseColors[label]}
                fontSize="9" fontFamily="var(--font-mono)" textAnchor="start" opacity={0.9}>
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="t-micro" style={{
        color: "var(--dim)", marginTop: 8, textTransform: "none", letterSpacing: 0, lineHeight: 1.5,
      }}>
        {t.cycleNote} · {t.cyclePhaseHere}
      </div>
    </Chapter>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ch 6 — BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

function BuilderChapter({ t, alloc, setAlloc, projected, target, suggestion }: {
  t: Translations;
  alloc: Allocation; setAlloc: (a: Allocation) => void;
  projected: number; target: number;
  suggestion: Allocation | null;
}) {
  function updateBucket(key: keyof Allocation, newVal: number) {
    const v   = Math.max(0, Math.min(100, Math.round(newVal)));
    const old = alloc[key];
    const delta = v - old;
    const others = (["mm", "cm", "dv"] as (keyof Allocation)[]).filter(k => k !== key);
    const otherSum = others.reduce((s, k) => s + alloc[k], 0);
    let n: Allocation = { ...alloc, [key]: v };
    if (otherSum === 0) {
      const split = (100 - v) / 2;
      n = { ...n, [others[0]]: split, [others[1]]: split };
    } else {
      n = {
        ...n,
        [others[0]]: Math.max(0, alloc[others[0]] - (delta * alloc[others[0]]) / otherSum),
        [others[1]]: Math.max(0, alloc[others[1]] - (delta * alloc[others[1]]) / otherSum),
      };
    }
    const r: Allocation = {
      mm: Math.round(n.mm),
      cm: Math.round(n.cm),
      dv: Math.round(n.dv),
    };
    const total = r.mm + r.cm + r.dv;
    if (total !== 100) {
      const adj = 100 - total;
      const tgt = others.reduce((a, b) => r[a] > r[b] ? a : b);
      r[tgt] = Math.max(0, r[tgt] + adj);
    }
    setAlloc(r);
  }

  const shortBy = Math.max(0, target - projected);
  const onTrack = projected >= target;

  const buckets: { key: keyof Allocation; label: string; desc: string; col: string }[] = [
    { key: "mm", label: t.buildMM, desc: t.buildMMd, col: "var(--tech)" },
    { key: "cm", label: t.buildCM, desc: t.buildCMd, col: "var(--bull)" },
    { key: "dv", label: t.buildDV, desc: t.buildDVd, col: "var(--bear)" },
  ];

  return (
    <Chapter tag={t.ch6}>
      <ChapterHead text={t.buildHead} />

      <div style={{ marginTop: 12 }}>
        {buckets.map(b => (
          <div key={b.key} style={{
            padding: "14px 0",
            borderTop: "1px solid var(--line)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
                color: b.col, letterSpacing: "0.08em", fontWeight: 700,
              }}>
                {b.label}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "var(--text-body)",
                fontWeight: 700, color: b.col,
              }}>
                {alloc[b.key]}%
              </span>
            </div>
            <Slider value={alloc[b.key]} min={0} max={100} step={1}
              onChange={v => updateBucket(b.key, v)} accent={b.col} />
            <div className="t-micro" style={{
              color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: 4,
            }}>
              {b.desc}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 0",
        borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
      }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>{t.buildSum}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--muted)" }}>
          {alloc.mm + alloc.cm + alloc.dv}%
        </span>
      </div>

      <div style={{ paddingTop: 14 }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>
          {t.buildProj}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--text-display)",
          fontWeight: 700, color: onTrack ? "var(--bull)" : "var(--bear)", lineHeight: 1,
        }}>
          {fmtM(projected)}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--text-body)",
          fontWeight: 700, color: onTrack ? "var(--bull)" : "var(--bear)", marginTop: 8,
        }}>
          {onTrack ? t.buildOK : t.buildShort(fmtM(shortBy))}
        </div>
        {!onTrack && (
          <div className="t-micro" style={{
            color: "var(--caution)", marginTop: 6, textTransform: "none", letterSpacing: 0,
          }}>
            {suggestion
              ? t.buildSugg(suggestion.mm, suggestion.cm, suggestion.dv)
              : t.buildNoSugg}
          </div>
        )}
      </div>
    </Chapter>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ch 7 — COMMITMENT
// ═══════════════════════════════════════════════════════════════════════════════

function CommitmentChapter({ t, income, expenses, alloc, target, projected, yearsToRetire }: {
  t: Translations;
  income: number; expenses: number; alloc: Allocation;
  target: number; projected: number; yearsToRetire: number;
}) {
  const investable = Math.max(0, income - expenses);
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const text = `Retirement target: ${fmtM(target)} · allocation: ${alloc.mm}/${alloc.cm}/${alloc.dv}`;
    const nav = navigator as unknown as {
      share?: (d: { title: string; text: string; url: string }) => Promise<void>;
    };
    if (nav.share) {
      try { await nav.share({ title: "Siam Markets · Plan", text, url }); }
      catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* clipboard blocked */ }
    }
  }

  return (
    <Chapter tag={t.ch7}>
      <ChapterHead text={t.commHead} />

      <div style={{
        padding: "16px 0",
        borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
      }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 10 }}>
          {t.commYouAre}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
          <div>
            <div className="t-micro" style={{ color: "var(--dim)" }}>{t.commIncomeLabel}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>
              {fmtThb(income)}
            </div>
          </div>
          <div>
            <div className="t-micro" style={{ color: "var(--dim)" }}>{t.commExpenseLabel}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>
              {fmtThb(expenses)}
            </div>
          </div>
          <div>
            <div className="t-micro" style={{ color: "var(--dim)" }}>{t.commTargetLabel}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--caution)" }}>
              {fmtM(target)}
            </div>
          </div>
          <div>
            <div className="t-micro" style={{ color: "var(--dim)" }}>{t.commProjectedLabel}</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "var(--text-body)",
              fontWeight: 700, color: projected >= target ? "var(--bull)" : "var(--bear)",
            }}>
              {fmtM(projected)}
            </div>
          </div>
          <div style={{ gridColumn: "span 2", paddingTop: 4 }}>
            <div className="t-micro" style={{ color: "var(--dim)" }}>{t.commAllocLabel}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700 }}>
              <span style={{ color: "var(--tech)" }}>{alloc.mm}%</span>{" · "}
              <span style={{ color: "var(--bull)" }}>{alloc.cm}%</span>{" · "}
              <span style={{ color: "var(--bear)" }}>{alloc.dv}%</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 12 }}>
        {[t.commAct1, t.commAct2(fmtThb(investable)), t.commAct3].map((line, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, padding: "12px 0",
            borderBottom: i < 2 ? "1px solid var(--line)" : "none",
            alignItems: "flex-start",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
              fontWeight: 700, color: "var(--caution)", flexShrink: 0, paddingTop: 1,
              width: 24,
            }}>
              0{i + 1}
            </div>
            <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.55 }}>
              {line}
            </div>
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={share} style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
          color: "#000", background: "var(--caution)",
          border: "none", borderBottom: "3px solid rgba(0,0,0,0.25)",
          padding: "0 22px", cursor: "pointer", minHeight: 44,
          letterSpacing: "0.1em", fontWeight: 700,
        }}>
          {copied ? t.commCopy : t.commShare}
        </button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" }}>
          {yearsToRetire} yrs · {alloc.mm}/{alloc.cm}/{alloc.dv}
        </span>
      </div>

      <div className="t-micro" style={{
        color: "var(--dim)", lineHeight: 1.6, textTransform: "none", letterSpacing: 0,
        marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)",
      }}>
        {t.commNoSave}
      </div>
    </Chapter>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════════

export default function PlanPage() {
  const [lang,     setLang]     = useState<Lang>("en");
  const [age,      setAge]      = useState(30);
  const [income,   setIncome]   = useState(35_000);
  const [expenses, setExpenses] = useState(TH_MIDDLE_CLASS_BASELINE);
  const [alloc,    setAlloc]    = useState<Allocation>({ mm: 30, cm: 60, dv: 10 });

  const t = T[lang];

  const yearsToRetire   = Math.max(1, TH_RETIRE_AGE - age);
  const yearsPostRetire = Math.max(1, TH_LIFE_EXPECTANCY - TH_RETIRE_AGE);
  const target          = expenses * 12 * yearsPostRetire;
  const investable      = Math.max(0, income - expenses);

  const projSeries = useMemo(
    () => projectWithCycle(investable, alloc, yearsToRetire),
    [investable, alloc, yearsToRetire],
  );
  const projected = projSeries[projSeries.length - 1]?.value ?? 0;

  const suggestion = useMemo(
    () => projected < target ? suggestAllocation(investable, target, yearsToRetire) : null,
    [projected, target, investable, yearsToRetire],
  );

  return (
    <div className="page">
      {/* Sticky header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--bg)",
        padding: "8px 0 14px",
        borderBottom: "1px solid var(--line)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DigitalBeaver size={20} color="var(--caution)" animated aria-hidden />
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
            color: "var(--dim)", letterSpacing: "0.12em",
          }}>
            {t.appTag}
          </span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {(["en", "th", "zh"] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
              color: lang === l ? "#000" : "var(--dim)",
              background: lang === l ? "var(--caution)" : "var(--bg-raised)",
              border: "1px solid var(--line)",
              borderBottom: lang === l ? "3px solid rgba(0,0,0,0.3)" : "1px solid var(--line)",
              padding: "0 12px", cursor: "pointer", letterSpacing: "0.06em",
              minHeight: 32, fontWeight: lang === l ? 700 : 400,
            }}>
              {l === "en" ? "EN" : l === "th" ? "ไทย" : "中"}
            </button>
          ))}
        </div>
      </div>

      {/* Narrative — centered single column */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <HookChapter      t={t} />
        <BellCurveChapter t={t} age={age} setAge={setAge} />
        <NumbersChapter
          t={t}
          income={income}     setIncome={setIncome}
          expenses={expenses} setExpenses={setExpenses}
          target={target} yearsToRetire={yearsToRetire} yearsPostRetire={yearsPostRetire}
        />
        <JustSavingChapter
          t={t} income={income} expenses={expenses}
          target={target} yearsToRetire={yearsToRetire}
        />
        <CycleChapter     t={t} yearsToRetire={yearsToRetire} />
        <BuilderChapter
          t={t} alloc={alloc} setAlloc={setAlloc}
          projected={projected} target={target} suggestion={suggestion}
        />
        <CommitmentChapter
          t={t} income={income} expenses={expenses}
          alloc={alloc} target={target} projected={projected}
          yearsToRetire={yearsToRetire}
        />

        <div style={{
          marginTop: 48, paddingTop: 24, paddingBottom: 32,
          borderTop: "1px solid var(--line)", textAlign: "center",
        }}>
          <div className="t-micro" style={{
            color: "var(--dim)", textTransform: "none", letterSpacing: 0, lineHeight: 1.6,
          }}>
            {t.footnote}
          </div>
        </div>
      </div>
    </div>
  );
}
