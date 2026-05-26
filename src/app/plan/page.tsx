"use client";

import { useState, useMemo, useEffect } from "react";
import { fmtThb } from "@/lib/format";
import { DigitalBeaver } from "@/components/Mascot/DigitalBeaver";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS   = 12;
const RETIRE   = 60;
const LIFE_EXP = 80;

// ─── Investment styles ────────────────────────────────────────────────────────

const STYLES = {
  safe: {
    en: "SAFE",     th: "ปลอดภัย",  zh: "稳健",
    descEN: "Savings + gov bonds. Zero volatility.",
    descTH: "ออมทรัพย์ + พันธบัตร ไม่ผันผวน",
    descZH: "储蓄+国债，零波动。",
    riskEN: "LOW",      riskTH: "ต่ำ",       riskZH: "低",
    ret: 0.04, color: "var(--tech)",
  },
  balanced: {
    en: "BALANCED", th: "สมดุล",     zh: "均衡",
    descEN: "Mutual funds + bonds. Rational default.",
    descTH: "กองทุนรวม + พันธบัตร สมเหตุสมผล",
    descZH: "公募基金+债券，理性之选。",
    riskEN: "MEDIUM",   riskTH: "กลาง",      riskZH: "中",
    ret: 0.07, color: "var(--bull)",
  },
  growth: {
    en: "GROWTH",   th: "เติบโต",    zh: "成长",
    descEN: "RMF / ThaiESG + equities. Long horizon.",
    descTH: "RMF / ThaiESG + หุ้น ต้องการระยะยาว",
    descZH: "RMF/ThaiESG+股票，需长期视野。",
    riskEN: "HIGH",     riskTH: "สูง",        riskZH: "高",
    ret: 0.10, color: "var(--caution)",
  },
  allin: {
    en: "ALL-IN",   th: "เต็มสูบ",   zh: "全押",
    descEN: "Derivatives + leverage. 90% lose.",
    descTH: "อนุพันธ์ + เลเวอเรจ 90% ขาดทุน",
    descZH: "衍生品+杠杆，90%散户亏损。",
    riskEN: "EXTREME",  riskTH: "สูงมาก",    riskZH: "极高",
    ret: 0.18, color: "var(--bear)",
  },
} as const;

type StyleKey = keyof typeof STYLES;

// ─── World markets 2024 reference ────────────────────────────────────────────

const WORLD_2024 = [
  { label: "NASDAQ",    ytd:  29.6 },
  { label: "S&P 500",   ytd:  23.3 },
  { label: "Nikkei",    ytd:  19.2 },
  { label: "DAX",       ytd:  18.9 },
  { label: "Hang Seng", ytd:  17.7 },
  { label: "SET",       ytd:  -4.8 },
] as const;

// ─── Forecast types ───────────────────────────────────────────────────────────

interface ForecastRow {
  target_date: string;
  predicted:   number;
  lower_80:    number;
  upper_80:    number;
}

interface ForecastData {
  last_close: number;
  rows:       ForecastRow[];
  note:       string;
}

// ─── Translations ─────────────────────────────────────────────────────────────

type Lang = "en" | "th" | "zh";

interface Translations {
  s1head: string; s1sub: string; s1left: (n: number) => string;
  s2head: string; s2l1: string; s2l2: string; s2l3: string;
  s2inv: string; s2warn: string;
  s3head: string; s3risk: string; s3ret: string; s3pick: string;
  s4head: string; s4ref: string; s4ai: string; s4note: string;
  s4proj: string; s4age: string;
  s5head: string; s5tgt: string; s5proj: string; s5good: string; s5gap: string;
  s5read: string; s5act: string; s5yrs: (n: number) => string; s5rs: string;
  // Pyramid
  t1: string; t2: string; t3: string; t4: string; t5: string;
  tapStart: string;
  ikigaiTitle: string;
  ikigaiFormula: string;
  ikigaiReadiness: string;
}

const T: Record<Lang, Translations> = {
  en: {
    s1head:  "How old are you?",
    s1sub:   "Monthly income",
    s1left:  (n: number) => `${n} years to build wealth`,
    s2head:  "Monthly expenses",
    s2l1:    "LIVING — food, rent, utilities",
    s2l2:    "TRANSPORT",
    s2l3:    "EVERYTHING ELSE",
    s2inv:   "INVESTABLE / MONTH",
    s2warn:  "Nothing to invest. Cut expenses or raise income.",
    s3head:  "Investment style",
    s3risk:  "RISK",
    s3ret:   "RETURN",
    s3pick:  "PICK THE ONE YOU'LL HOLD FOR 20 YEARS WITHOUT SELLING",
    s4head:  "Here is what the world looked like in 2024.",
    s4ref:   "2024 FULL YEAR · MAJOR INDICES · REFERENCE ONLY",
    s4ai:    "AI FORECAST · SET · 5-DAY · TIMESFM (GOOGLE)",
    s4note:  "80% confidence band. Past training data. Not a trade signal.",
    s4proj:  "TRAJECTORY IF NOTHING CHANGES",
    s4age:   "age",
    s5head:  "The result",
    s5tgt:   "RETIREMENT TARGET",
    s5proj:  "PROJECTION",
    s5good:  "ON TRACK",
    s5gap:   "BEHIND TARGET",
    s5read:  "RETIREMENT READINESS",
    s5act:   "WHAT TO DO NOW",
    s5yrs:   (n: number) => `${n} yrs · monthly compounding · pre-tax`,
    s5rs:    "RUN AGAIN WITH DIFFERENT NUMBERS",
    t1: "INCOME", t2: "BUDGET", t3: "GROW", t4: "FREEDOM", t5: "IKIGAI",
    tapStart:      "TAP A TIER TO EXPLORE",
    ikigaiTitle:   "FINANCIAL INDEPENDENCE NUMBER",
    ikigaiFormula: "annual expenses ÷ return rate",
    ikigaiReadiness: "IKIGAI READINESS",
  },
  th: {
    s1head:  "คุณอายุเท่าไหร่?",
    s1sub:   "รายได้ต่อเดือน",
    s1left:  (n: number) => `เหลือ ${n} ปีสร้างความมั่งคั่ง`,
    s2head:  "ค่าใช้จ่ายต่อเดือน",
    s2l1:    "ครองชีพ — อาหาร เช่า สาธารณูปโภค",
    s2l2:    "ค่าเดินทาง",
    s2l3:    "ค่าใช้จ่ายอื่นๆ",
    s2inv:   "ลงทุนได้ต่อเดือน",
    s2warn:  "ไม่มีเงินลงทุน ต้องลดรายจ่ายหรือเพิ่มรายได้",
    s3head:  "สไตล์การลงทุน",
    s3risk:  "ความเสี่ยง",
    s3ret:   "ผลตอบแทน",
    s3pick:  "เลือกตัวที่คุณยึดได้ 20 ปีโดยไม่ขายตอนตลาดร่วง",
    s4head:  "นี่คือสิ่งที่เกิดขึ้นในโลกปี 2024",
    s4ref:   "ผลตอบแทนทั้งปี 2024 · ดัชนีหลัก · ข้อมูลอ้างอิงเท่านั้น",
    s4ai:    "AI คาดการณ์ · SET · 5 วัน · TIMESFM (Google)",
    s4note:  "ช่วงความเชื่อมั่น 80% ข้อมูลในอดีต ไม่ใช่สัญญาณซื้อขาย",
    s4proj:  "วิถีถ้าไม่มีอะไรเปลี่ยนแปลง",
    s4age:   "อายุ",
    s5head:  "ผลลัพธ์",
    s5tgt:   "เป้าเกษียณ",
    s5proj:  "การประมาณการ",
    s5good:  "ตรงตามเป้า",
    s5gap:   "ยังขาดอยู่",
    s5read:  "ความพร้อมเกษียณ",
    s5act:   "ทำอะไรตอนนี้",
    s5yrs:   (n: number) => `${n} ปี · ทบต้นรายเดือน · ก่อนภาษี`,
    s5rs:    "ลองใส่ตัวเลขใหม่",
    t1: "รายได้", t2: "งบ", t3: "เติบโต", t4: "อิสรภาพ", t5: "อิคิไก",
    tapStart:      "แตะชั้นที่ต้องการดู",
    ikigaiTitle:   "ตัวเลขอิสรภาพทางการเงิน",
    ikigaiFormula: "ค่าใช้จ่ายต่อปี ÷ อัตราผลตอบแทน",
    ikigaiReadiness: "ความพร้อม IKIGAI",
  },
  zh: {
    s1head:  "你几岁了？",
    s1sub:   "每月收入",
    s1left:  (n: number) => `还有${n}年积累财富`,
    s2head:  "每月支出",
    s2l1:    "生活 — 饮食、住房、水电",
    s2l2:    "交通",
    s2l3:    "其他一切",
    s2inv:   "每月可投资金额",
    s2warn:  "无可投资余额，先削减支出或增加收入。",
    s3head:  "投资风格",
    s3risk:  "风险",
    s3ret:   "回报",
    s3pick:  "选你能坚守20年不在下跌时卖出的那个",
    s4head:  "2024年，世界发生了这些。",
    s4ref:   "2024全年 · 主要指数 · 仅供参考",
    s4ai:    "AI预测 · 泰股 · 5天 · TIMESFM（谷歌）",
    s4note:  "80%置信区间。历史训练数据。不是买卖信号。",
    s4proj:  "什么都不变的情况下的轨迹",
    s4age:   "岁",
    s5head:  "结果",
    s5tgt:   "退休目标",
    s5proj:  "预测",
    s5good:  "达标",
    s5gap:   "还差",
    s5read:  "退休准备度",
    s5act:   "现在做什么",
    s5yrs:   (n: number) => `${n}年 · 月复利 · 税前`,
    s5rs:    "换个数字重算",
    t1: "收入", t2: "预算", t3: "增长", t4: "自由", t5: "生き甲斐",
    tapStart:      "点击一个层级探索",
    ikigaiTitle:   "财务独立数字",
    ikigaiFormula: "年支出 ÷ 回报率",
    ikigaiReadiness: "IKIGAI准备度",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function projectAt(monthly: number, rate: number, years: number): number {
  if (years <= 0 || monthly <= 0) return 0;
  const mr = rate / MONTHS;
  const m  = years * MONTHS;
  return monthly * ((Math.pow(1 + mr, m) - 1) / mr);
}

function monthlyNeeded(target: number, rate: number, years: number): number {
  if (years <= 0 || rate <= 0 || target <= 0) return 0;
  const mr = rate / MONTHS;
  const m  = years * MONTHS;
  return target / ((Math.pow(1 + mr, m) - 1) / mr);
}

function doublesIn(rate: number): number {
  return Math.round((72 / (rate * 100)) * 10) / 10;
}

function fmtM(v: number): string {
  if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `฿${(v / 1_000).toFixed(0)}K`;
  return fmtThb(v);
}

function getActions(style: StyleKey, investable: number, lang: Lang): string[] {
  const inv = fmtThb(investable);
  if (lang === "th") {
    const first: Record<StyleKey, string> = {
      safe:     "เปิดบัญชีฝากประจำ สร้างกองทุนฉุกเฉิน 6 เดือนก่อน",
      balanced: "เปิดบัญชีกองทุนรวม (กรุงศรี / กสิกร / SCB) เริ่มที่ 1,000 บาท/เดือน",
      growth:   "เปิดบัญชีหุ้น ซื้อ SET50 ETF (TDEX) เป็นจุดเริ่มต้น",
      allin:    "ศึกษา Options และ Futures ≥ 12 เดือนก่อนเทรดครั้งแรก",
    };
    return [first[style], `ตั้งระบบลงทุนอัตโนมัติ ${inv}/เดือน ห้ามแตะ`, "ทบทวนทุก 12 เดือน ปรับสมดุล แล้วลืมมันไป"];
  }
  if (lang === "zh") {
    const first: Record<StyleKey, string> = {
      safe:     "开定期存款账户，先建6个月应急储备。",
      balanced: "开公募基金账户，从每月1,000铢起投。",
      growth:   "开证券账户，买入SET50 ETF (TDEX)作为第一笔仓位。",
      allin:    "在首次衍生品交易前，至少学习期权和期货12个月。",
    };
    return [first[style], `设置自动投资：${inv}/月，不要动它。`, "每12个月审视配置，再平衡，然后再次忘掉它。"];
  }
  const first: Record<StyleKey, string> = {
    safe:     "Open a fixed deposit account. Build 6 months of emergency fund first.",
    balanced: "Open a mutual fund account (Krungsri / Kasikorn / SCB). Start at ฿1,000/month.",
    growth:   "Open a brokerage account. Buy the SET50 ETF (TDEX) as your first position.",
    allin:    "Study options and futures for ≥ 12 months before your first derivatives trade.",
  };
  return [first[style], `Set up auto-invest: ${inv}/month. Never touch it.`, "Review allocation every 12 months. Rebalance. Then forget it again."];
}

// ─── Pyramid SVG ──────────────────────────────────────────────────────────────

function PyramidSVG({ currentLevel, activeTier, onTierClick, t }: {
  currentLevel: number;
  activeTier:   1|2|3|4|5|null;
  onTierClick:  (n: 1|2|3|4|5) => void;
  t:            Translations;
}) {
  // viewBox 0 0 280 162 · Tier 5=apex(top), Tier 1=base(bottom)
  const POLYS: Record<1|2|3|4|5, string> = {
    5: "140,2 108,34 172,34",
    4: "108,34 172,34 200,66 80,66",
    3: "80,66 200,66 228,98 52,98",
    2: "52,98 228,98 256,130 24,130",
    1: "24,130 256,130 278,160 2,160",
  };
  const CENTERS: Record<1|2|3|4|5, [number, number]> = {
    5: [140, 22], 4: [140, 52], 3: [140, 83], 2: [140, 115], 1: [140, 147],
  };
  const LABELS: Record<1|2|3|4|5, string> = {
    1: t.t1, 2: t.t2, 3: t.t3, 4: t.t4, 5: t.t5,
  };

  const tiers: (1|2|3|4|5)[] = [5, 4, 3, 2, 1];

  return (
    <svg
      viewBox="0 0 280 162"
      style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }}
      aria-label="Financial independence pyramid"
    >
      {tiers.map(n => {
        const achieved = n <= currentLevel;
        const isNext   = n === currentLevel + 1;
        const isSel    = activeTier === n;
        const isIkigai = n === 5;

        const fill   = achieved && isIkigai ? "rgba(255,149,0,0.22)"
                     : achieved             ? "rgba(0,200,150,0.14)"
                     : isNext               ? "rgba(255,255,255,0.03)"
                     : "rgba(255,255,255,0.01)";
        const stroke = achieved && isIkigai ? "#ff9500"
                     : achieved             ? "#00c896"
                     : isSel || isNext      ? "#ff9500"
                     : "#2a2a2a";
        const sw     = isSel ? 2.5 : isNext ? 1.5 : 1;
        const tc     = achieved && isIkigai ? "#ff9500"
                     : achieved             ? "#00c896"
                     : isNext               ? "#ff9500"
                     : "#444";
        const [cx, cy] = CENTERS[n];

        return (
          <g key={n} onClick={() => onTierClick(n)} style={{ cursor: "pointer" }}>
            <polygon points={POLYS[n]} style={{ fill, stroke, strokeWidth: sw }} />
            <text
              x={cx} y={cy}
              textAnchor="middle" dominantBaseline="middle"
              style={{
                fill: tc,
                fontFamily: "var(--font-mono, monospace)",
                fontSize: n === 5 ? "8px" : "9px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {LABELS[n]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Level indicator ──────────────────────────────────────────────────────────

function LevelIndicator({ currentLevel, activeTier, t, lang, onTrack, investable, style }: {
  currentLevel: number; activeTier: 1|2|3|4|5|null;
  t: Translations; lang: Lang; onTrack: boolean;
  investable: number; style: StyleKey | null;
}) {
  const tierNames: Record<1|2|3|4|5, string> = {
    1: t.t1, 2: t.t2, 3: t.t3, 4: t.t4, 5: t.t5,
  };
  const hints: Record<0|1|2|3|4|5, string> = {
    0: lang === "th" ? "ใส่รายได้เพื่อเริ่ม" : lang === "zh" ? "输入收入以开始" : "enter income to begin",
    1: lang === "th" ? "ลดค่าใช้จ่ายเพื่อปลดล็อกการลงทุน" : lang === "zh" ? "减少支出以解锁投资" : "reduce expenses to unlock investing",
    2: lang === "th" ? "เลือกสไตล์การลงทุน" : lang === "zh" ? "选择投资风格" : "select an investment style",
    3: lang === "th" ? "เพิ่มการลงทุนเพื่อให้ถึงเป้า" : lang === "zh" ? "增加投资以达标" : "increase investment to reach target",
    4: lang === "th" ? "เกษียณตรงเป้า — IKIGAI รออยู่" : lang === "zh" ? "退休达标 — IKIGAI等你" : "retirement on track — IKIGAI awaits",
    5: lang === "th" ? "อิสรภาพทางการเงิน" : lang === "zh" ? "财务独立" : "financial independence",
  };

  const color = currentLevel >= 5 ? "var(--caution)"
              : currentLevel >= 4 ? "var(--bull)"
              : currentLevel >= 2 ? "var(--caution)"
              : "var(--dim)";

  const levelName = currentLevel >= 1 && currentLevel <= 5
    ? tierNames[currentLevel as 1|2|3|4|5] : "";
  const hint = hints[currentLevel as 0|1|2|3|4|5] ?? "";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 0 10px",
      borderBottom: "1px solid var(--line)",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
        fontWeight: 700, color,
        letterSpacing: "0.1em", flexShrink: 0,
      }}>
        {currentLevel > 0 ? `LEVEL ${currentLevel}` : "LEVEL 0"}
        {levelName ? ` · ${levelName}` : ""}
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.62rem",
        color: "var(--dim)", letterSpacing: "0.04em",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {hint}
      </div>
    </div>
  );
}

// ─── Tier Panel ───────────────────────────────────────────────────────────────

type TierPanelProps = {
  tier:             1|2|3|4|5;
  lang:             Lang;
  t:                Translations;
  age:              number; setAge:       (v: number)   => void;
  salary:           number; setSalary:    (v: number)   => void;
  living:           number; setLiving:    (v: number)   => void;
  transport:        number; setTransport: (v: number)   => void;
  other:            number; setOther:     (v: number)   => void;
  style:            StyleKey | null; setStyle: (v: StyleKey) => void;
  investable:       number;
  monthlyExpenses:  number;
  yearsToRetire:    number;
  retirementTarget: number;
  projectedValue:   number;
  onTrack:          boolean;
  readiness:        number;
  ikigaiTarget:     number;
  ikigaiReadiness:  number;
  forecast:         ForecastData | null;
  onRestart:        () => void;
};

function TierPanel(p: TierPanelProps) {
  const { tier, t, lang } = p;

  const header = (
    <div className="t-micro" style={{ color: "var(--caution)", padding: "10px 0 8px", letterSpacing: "0.12em" }}>
      {tier === 1 ? t.t1 : tier === 2 ? t.t2 : tier === 3 ? t.t3 : tier === 4 ? t.t4 : t.t5}
    </div>
  );

  // ── Tier 1: INCOME ──────────────────────────────────────────────────────────
  if (tier === 1) return (
    <div>
      {header}
      <div style={{ borderBottom: "1px solid var(--line)", padding: "12px 0 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{t.s1head.toUpperCase()}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 700, color: "var(--caution)", lineHeight: 1 }}>{p.age}</span>
        </div>
        <input type="range" min={18} max={55} step={1} value={p.age}
          onChange={e => p.setAge(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--caution)", cursor: "pointer", height: 3, minHeight: 44, display: "block" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>18</span>
          <span className="t-micro" style={{ color: "var(--caution)" }}>{t.s1left(p.yearsToRetire)}</span>
          <span className="t-micro" style={{ color: "var(--dim)" }}>55</span>
        </div>
      </div>
      <div style={{ borderBottom: "1px solid var(--line)", padding: "12px 0 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{t.s1sub.toUpperCase()}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{fmtThb(p.salary)}</span>
        </div>
        <input type="range" min={5_000} max={150_000} step={1_000} value={p.salary}
          onChange={e => p.setSalary(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--caution)", cursor: "pointer", height: 3, minHeight: 44, display: "block" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>฿5k</span>
          <span className="t-micro" style={{ color: "var(--dim)" }}>฿150k</span>
        </div>
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 0",
      }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          {lang === "th" ? "เป้าเกษียณ" : lang === "zh" ? "退休目标" : "RETIREMENT TARGET"}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--muted)" }}>
          {fmtM(p.retirementTarget)}
        </span>
      </div>
    </div>
  );

  // ── Tier 2: BUDGET ──────────────────────────────────────────────────────────
  if (tier === 2) {
    const total    = p.living + p.transport + p.other;
    const pct      = p.salary > 0 ? Math.min(100, Math.round((total / p.salary) * 100)) : 0;
    const barColor = pct > 90 ? "var(--bear)" : pct > 70 ? "var(--caution)" : "var(--bull)";
    const rows: { label: string; value: number; set: (v: number) => void; max: number }[] = [
      { label: t.s2l1, value: p.living,    set: p.setLiving,    max: 50_000 },
      { label: t.s2l2, value: p.transport, set: p.setTransport, max: 20_000 },
      { label: t.s2l3, value: p.other,     set: p.setOther,     max: 30_000 },
    ];
    return (
      <div>
        {header}
        <div style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>{fmtThb(total)} / {fmtThb(p.salary)}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: barColor }}>{pct}% spent</span>
          </div>
          <div style={{ height: 4, background: "var(--line)" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: barColor, transition: "width 200ms ease" }} />
          </div>
        </div>
        {rows.map(row => (
          <div key={row.label} style={{ borderBottom: "1px solid var(--line)", padding: "10px 0 8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span className="t-micro" style={{ color: "var(--dim)" }}>{row.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>{fmtThb(row.value)}</span>
            </div>
            <input type="range" min={0} max={row.max} step={500} value={row.value}
              onChange={e => row.set(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--caution)", cursor: "pointer", height: 3, minHeight: 40, display: "block" }} />
          </div>
        ))}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 0", paddingLeft: 12,
          borderLeft: `3px solid ${p.investable > 0 ? "var(--bull)" : "var(--bear)"}`,
          marginTop: 4,
        }}>
          <span className="t-micro" style={{ color: p.investable > 0 ? "var(--bull)" : "var(--bear)" }}>{t.s2inv}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700, color: p.investable > 0 ? "var(--bull)" : "var(--bear)", lineHeight: 1 }}>
            {fmtThb(p.investable)}
          </span>
        </div>
        {p.investable <= 0 && (
          <div className="t-micro" style={{ color: "var(--bear)", textTransform: "none", letterSpacing: 0, paddingTop: 4 }}>{t.s2warn}</div>
        )}
      </div>
    );
  }

  // ── Tier 3: GROW ────────────────────────────────────────────────────────────
  if (tier === 3) {
    const actions = p.style ? getActions(p.style, p.investable, lang) : [];
    return (
      <div>
        {header}
        <div className="t-micro" style={{ color: "var(--dim)", padding: "0 0 8px" }}>
          {t.s3head.toUpperCase()} — {t.s3risk.toUpperCase()} vs {t.s3ret.toUpperCase()}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginBottom: 10 }}>
          {(Object.entries(STYLES) as [StyleKey, typeof STYLES[StyleKey]][]).map(([key, s]) => {
            const selected = p.style === key;
            const label = lang === "zh" ? s.zh : lang === "th" ? s.th : s.en;
            const desc  = lang === "zh" ? s.descZH : lang === "th" ? s.descTH : s.descEN;
            const risk  = lang === "zh" ? s.riskZH : lang === "th" ? s.riskTH : s.riskEN;
            const est   = projectAt(p.investable, s.ret, p.yearsToRetire);
            const dbl   = doublesIn(s.ret);
            return (
              <button key={key} onClick={() => p.setStyle(key)} style={{
                padding: "14px 12px",
                background: selected ? s.color : "var(--bg-raised)",
                border: `1px solid ${selected ? s.color : "var(--line)"}`,
                borderBottom: selected ? `4px solid rgba(0,0,0,0.25)` : `1px solid var(--line)`,
                cursor: "pointer", textAlign: "left", minHeight: 110,
                display: "flex", flexDirection: "column", gap: 3,
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: selected ? "#000" : s.color, letterSpacing: "0.08em" }}>
                  {label}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 700, color: selected ? "#000" : s.color, lineHeight: 1 }}>
                  +{(s.ret * 100).toFixed(0)}%
                </div>
                <div className="t-micro" style={{ color: selected ? "rgba(0,0,0,0.6)" : "var(--dim)", textTransform: "none", letterSpacing: 0 }}>
                  {t.s3risk}: {risk} · {lang === "th" ? "สองเท่าใน" : lang === "zh" ? "翻倍" : "×2 in"} {dbl}y
                </div>
                <div className="t-micro" style={{ color: selected ? "rgba(0,0,0,0.55)" : "var(--dim)", textTransform: "none", letterSpacing: 0, lineHeight: 1.3 }}>
                  {desc}
                </div>
                {p.investable > 0 && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: selected ? "#000" : s.color, marginTop: 4, paddingTop: 4, borderTop: `1px solid ${selected ? "rgba(0,0,0,0.2)" : "var(--line)"}` }}>
                    → {fmtM(est)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {!p.style && (
          <div className="t-micro" style={{ color: "var(--dim)", textAlign: "center", padding: "4px 0 8px" }}>{t.s3pick}</div>
        )}
        {actions.length > 0 && (
          <div style={{ paddingTop: 4 }}>
            <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 6 }}>{t.s5act}</div>
            {actions.map((action, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, padding: "10px 12px", marginBottom: 2,
                background: "var(--bg-raised)", border: "1px solid var(--line)", alignItems: "flex-start",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: p.style ? STYLES[p.style].color : "var(--caution)", flexShrink: 0, paddingTop: 1 }}>
                  0{i + 1}
                </div>
                <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.5 }}>{action}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Tier 4: FREEDOM ─────────────────────────────────────────────────────────
  if (tier === 4) {
    const sel      = p.style ? STYLES[p.style] : null;
    const maxAbs   = Math.max(...WORLD_2024.map(m => Math.abs(m.ytd)));
    const color    = p.onTrack ? "var(--bull)" : p.readiness >= 70 ? "var(--caution)" : "var(--bear)";
    const barW     = Math.min(100, p.readiness);
    const milestones = [10, 20, p.yearsToRetire].filter((y, i, a) => a.indexOf(y) === i && y > 0);
    return (
      <div>
        {header}
        {/* Readiness */}
        <div style={{ borderBottom: "1px solid var(--line)", padding: "10px 0 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>{t.s5read}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color }}>{p.readiness}%</span>
          </div>
          <div style={{ height: 5, background: "var(--line)" }}>
            <div style={{ height: "100%", width: `${barW}%`, background: color, transition: "width 800ms ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <div>
              <div className="t-micro" style={{ color: "var(--dim)" }}>{t.s5tgt}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--muted)" }}>{fmtM(Math.round(p.retirementTarget / 1000) * 1000)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="t-micro" style={{ color }}>{p.onTrack ? t.s5good : t.s5gap}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color }}>{fmtM(Math.round(p.projectedValue / 1000) * 1000)}</div>
            </div>
          </div>
        </div>
        {/* World markets */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "10px 12px", marginTop: 8, marginBottom: 3 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 10 }}>{t.s4ref}</div>
          {[...WORLD_2024].sort((a, b) => b.ytd - a.ytd).map(m => {
            const pos    = m.ytd >= 0;
            const barPct = (Math.abs(m.ytd) / maxAbs) * 100;
            const col    = pos ? "var(--bull)" : "var(--bear)";
            return (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: m.label === "SET" ? "var(--caution)" : "var(--muted)", width: 68, flexShrink: 0 }}>{m.label}</div>
                <div style={{ flex: 1, height: 12, background: "var(--bg-raised)", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${barPct}%`, background: col, opacity: 0.75 }} />
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: col, width: 48, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>
                  {pos ? "+" : ""}{m.ytd}%
                </div>
              </div>
            );
          })}
        </div>
        {/* SET forecast */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "10px 12px", marginBottom: 3 }}>
          <div className="t-micro" style={{ color: "var(--caution)", marginBottom: 8 }}>{t.s4ai}</div>
          {p.forecast
            ? <ForecastChart data={p.forecast} note={t.s4note} />
            : <div className="t-micro" style={{ color: "var(--dim)", padding: "8px 0", textTransform: "none", letterSpacing: 0 }}>
                {lang === "th" ? "กำลังโหลด…" : lang === "zh" ? "加载中…" : "Loading forecast…"}
              </div>
          }
        </div>
        {/* Trajectory */}
        {sel && (
          <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "10px 12px" }}>
            <div className="t-micro" style={{ color: sel.color, marginBottom: 10 }}>{t.s4proj}</div>
            {milestones.map(yrs => {
              const val   = projectAt(p.investable, sel.ret, yrs);
              const ageAt = p.age + yrs;
              return (
                <div key={yrs} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", width: 52, flexShrink: 0 }}>{t.s4age} {ageAt}</div>
                  <div style={{ flex: 1, height: 8, background: "var(--bg-raised)" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (yrs / p.yearsToRetire) * 100)}%`, background: sel.color, opacity: 0.6 }} />
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", width: 72, textAlign: "right", flexShrink: 0 }}>{fmtM(val)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Tier 5: IKIGAI ──────────────────────────────────────────────────────────
  const sel       = p.style ? STYLES[p.style] : null;
  const ikColor   = p.ikigaiReadiness >= 100 ? "var(--caution)" : p.ikigaiReadiness >= 60 ? "var(--bull)" : "var(--muted)";
  const ikBarW    = Math.min(100, p.ikigaiReadiness);
  return (
    <div>
      {header}
      {/* Ikigai target */}
      <div style={{ borderBottom: "1px solid var(--line)", padding: "10px 0 12px" }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 4 }}>{t.ikigaiTitle}</div>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 8, textTransform: "none", letterSpacing: 0 }}>{t.ikigaiFormula}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: "var(--caution)", lineHeight: 1, marginBottom: 4 }}>
          {fmtM(p.ikigaiTarget)}
        </div>
        {sel && (
          <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0 }}>
            {fmtThb(p.monthlyExpenses)} × 12 ÷ {(sel.ret * 100).toFixed(0)}% = {fmtM(p.ikigaiTarget)}
          </div>
        )}
      </div>
      {/* Ikigai readiness */}
      <div style={{ borderBottom: "1px solid var(--line)", padding: "10px 0 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{t.ikigaiReadiness}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 700, color: ikColor }}>{p.ikigaiReadiness}%</span>
        </div>
        <div style={{ height: 5, background: "var(--line)" }}>
          <div style={{ height: "100%", width: `${ikBarW}%`, background: ikColor, transition: "width 800ms ease" }} />
        </div>
        {sel && (
          <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: 4 }}>
            {fmtM(p.projectedValue)} projected → {fmtM(p.ikigaiTarget)} target
          </div>
        )}
      </div>
      {/* Dalio 6-bucket */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "10px 12px", marginTop: 8, marginBottom: 3 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div className="t-micro" style={{ color: "var(--bear)" }}>
            {lang === "th" ? "Dalio ขั้น 5/6 · วิธีจัดพอร์ตตอนนี้" : lang === "zh" ? "达利欧5/6阶段 · 现在怎么配" : "DALIO 5/6 · HOW TO BUILD THE PORTFOLIO NOW"}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--bear)", border: "1px solid var(--bear)", padding: "0 4px", lineHeight: 1.6 }}>5/6</div>
        </div>
        {([
          { label: lang === "th" ? "ทอง" : lang === "zh" ? "黄金" : "GOLD",          pct: 15, col: "var(--caution)" },
          { label: lang === "th" ? "หุ้นปันผล" : lang === "zh" ? "贵族股息" : "ARISTOCRATS", pct: 25, col: "var(--bull)" },
          { label: lang === "th" ? "โครงสร้างพื้นฐาน" : lang === "zh" ? "基础设施" : "INFRA",       pct: 20, col: "var(--tech)" },
          { label: lang === "th" ? "พันธบัตร TIPS" : lang === "zh" ? "通胀债券" : "TIPS/BONDS",   pct: 20, col: "var(--muted)" },
          { label: lang === "th" ? "เงินสด" : lang === "zh" ? "现金" : "CASH",         pct: 15, col: "var(--dim)" },
          { label: lang === "th" ? "เก็งกำไร" : lang === "zh" ? "投机" : "SPECULATIVE",  pct: 5,  col: "var(--bear)" },
        ] as { label: string; pct: number; col: string }[]).map(bucket => (
          <div key={bucket.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: bucket.col, width: 96, flexShrink: 0 }}>{bucket.label}</span>
            <div style={{ flex: 1, height: 6, background: "var(--bg-raised)" }}>
              <div style={{ width: `${bucket.pct * 4}%`, height: "100%", background: bucket.col, opacity: 0.8 }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: bucket.col, width: 28, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>{bucket.pct}%</span>
          </div>
        ))}
        <div style={{ marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 6 }}>
            {lang === "th" ? "ไทม์ไลน์สะสม" : lang === "zh" ? "积累时间线" : "ACCUMULATION TIMELINE"}
          </div>
          {([
            { period: "2026–27", action: lang === "th" ? "รักษาทุน ไม่ต้องเร่ง ขั้น 5 ยังอยู่" : lang === "zh" ? "保本守势。不急。第5阶段还在。" : "Preserve capital. Do not chase. Stage 5 is still here.", col: "var(--bear)" },
            { period: "2028–29", action: lang === "th" ? "ลงทุนตอนโลกตื่นตระหนก ราคาต่ำ = โอกาส" : lang === "zh" ? "恐慌时入场。低价=机会。" : "Deploy when the world is afraid. Low prices are the compensation for courage.", col: "var(--caution)" },
            { period: "2030+",   action: lang === "th" ? "ทบต้น รอบใหม่เริ่ม แค่อยู่ให้ครบ" : lang === "zh" ? "复利生长。新周期开始。活到那一天。" : "Compound. New cycle begins. Stay alive until then.", col: "var(--bull)" },
          ] as { period: string; action: string; col: string }[]).map(row => (
            <div key={row.period} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--line)", alignItems: "flex-start" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: row.col, width: 56, flexShrink: 0, fontWeight: 700 }}>{row.period}</span>
              <span className="t-body" style={{ fontSize: "var(--text-micro)", color: "var(--muted)", lineHeight: 1.4 }}>{row.action}</span>
            </div>
          ))}
        </div>
        <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: 8 }}>
          {lang === "th" ? "อ้างอิง: Ray Dalio Big Debt Cycles + Wyckoff Method · 2026" : lang === "zh" ? "参考：瑞·达利欧债务周期 + 威科夫理论 · 2026" : "Ref: Ray Dalio Big Debt Cycles + Wyckoff Method · 2026"}
        </div>
      </div>
      {/* Restart */}
      <button onClick={p.onRestart} style={{
        background: "transparent", border: "1px solid var(--line)",
        color: "var(--dim)", fontFamily: "var(--font-mono)",
        fontSize: "var(--text-micro)", letterSpacing: "0.08em",
        padding: "0 20px", cursor: "pointer", minHeight: 40, width: "100%", marginTop: 12,
      }}>
        {t.s5rs}
      </button>
    </div>
  );
}

// ─── Forecast SVG Chart ───────────────────────────────────────────────────────

function ForecastChart({ data, note }: { data: ForecastData; note: string }) {
  const { last_close, rows } = data;
  if (!rows?.length) return null;

  const all  = [last_close, ...rows.map(r => r.predicted), ...rows.map(r => r.lower_80), ...rows.map(r => r.upper_80)];
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const rng  = maxV - minV || 1;
  const W = 280; const H = 64;

  const pts  = [last_close, ...rows.map(r => r.predicted)];
  const toX  = (i: number) => (i / (pts.length - 1)) * W;
  const toY  = (v: number) => H - ((v - minV) / rng) * (H - 4) - 2;

  const linePath  = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ");
  const bandUpper = rows.map((r, i) => `${i === 0 ? "M" : "L"} ${toX(i + 1).toFixed(1)} ${toY(r.upper_80).toFixed(1)}`).join(" ");
  const bandLower = [...rows].reverse().map((r, i) => `L ${toX(rows.length - i).toFixed(1)} ${toY(r.lower_80).toFixed(1)}`).join(" ");
  const band      = `${bandUpper} ${bandLower} Z`;

  const last    = rows[rows.length - 1];
  const dir     = last.predicted >= last_close;
  const lineCol = dir ? "var(--bull)" : "var(--bear)";
  const chg     = ((last.predicted / last_close - 1) * 100).toFixed(1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--muted)" }}>{last_close.toFixed(2)}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: lineCol, fontWeight: 700 }}>
          {last.predicted.toFixed(2)}  {dir ? "▲" : "▼"} {dir ? "+" : ""}{chg}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 56, display: "block" }} aria-label="SET 5-day AI forecast">
        <path d={band} fill={lineCol} fillOpacity={0.12} stroke="none" />
        <line x1={toX(0)} y1={toY(last_close)} x2={toX(pts.length - 1)} y2={toY(last_close)}
          stroke="var(--line)" strokeWidth="1" strokeDasharray="4 3" />
        <path d={linePath} fill="none" stroke={lineCol} strokeWidth={2} />
        {rows.map((r, i) => (
          <circle key={i} cx={toX(i + 1).toFixed(1)} cy={toY(r.predicted).toFixed(1)} r={2.5} fill={lineCol} />
        ))}
        <circle cx={toX(0).toFixed(1)} cy={toY(last_close).toFixed(1)} r={3} fill="var(--ink)" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span className="t-micro" style={{ color: "var(--dim)" }}>Today</span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>{rows[rows.length - 1]?.target_date}</span>
      </div>
      <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: 4 }}>{note}</div>
    </div>
  );
}

// ─── Context Panel (desktop right column) ────────────────────────────────────

type ContextProps = {
  lang: Lang; t: Translations;
  age: number; salary: number; investable: number;
  retirementTarget: number; style: StyleKey | null;
  projectedValue: number; readiness: number; onTrack: boolean;
  forecast: ForecastData | null; yearsToRetire: number;
  activeTier: 1|2|3|4|5|null; currentLevel: number;
};

function ContextPanel(p: ContextProps) {
  const sel    = p.style ? STYLES[p.style] : null;
  const maxAbs = Math.max(...WORLD_2024.map(m => Math.abs(m.ytd)));
  const hasInv = p.investable > 0;

  const milestoneYears: number[] = [];
  for (let y = 5; y <= p.yearsToRetire; y += 5) milestoneYears.push(y);
  if (milestoneYears[milestoneYears.length - 1] !== p.yearsToRetire) milestoneYears.push(p.yearsToRetire);

  const ctxKey = p.activeTier ?? Math.max(1, Math.min(5, p.currentLevel)) as 1|2|3|4|5;
  const ctxNote: Record<1|2|3|4|5, Record<Lang, string>> = {
    1: { en: "Income is the foundation. Every constraint upstream traces back here.", th: "รายได้คือรากฐาน ข้อจำกัดทุกอย่างมาจากจุดนี้", zh: "收入是基础，所有上游约束都追溯于此。" },
    2: { en: "Every extra ฿1,000/month invested compounds to ≈ ฿1.6M over 30 years at 7%.", th: "ทุก ฿1,000/เดือนที่ลงทุนเพิ่ม ≈ ฿1.6M ใน 30 ปีที่ 7%", zh: "每多投1,000铢/月，30年7%收益约复利至160万铢。" },
    3: { en: "Choose the style you can hold through market crashes without selling.", th: "เลือกสไตล์ที่คุณยึดได้แม้ตลาดร่วงหนัก โดยไม่ขาย", zh: "选择即便市场崩溃也能坚守、不会抛售的风格。" },
    4: { en: "The world is the market. SET is one instrument in it.", th: "โลกคือตลาด SET เป็นแค่หนึ่งในนั้น", zh: "世界就是市场，泰股只是其中一个工具。" },
    5: { en: "Passive income at IKIGAI level = money pressure ends. That is the whole game.", th: "รายได้ passive ระดับ IKIGAI = แรงกดดันเรื่องเงินหายไป นั่นคือทั้งหมดของเกม", zh: "被动收入达到IKIGAI水平=金钱压力消失。这就是整个游戏。" },
  };

  return (
    <>
      {/* Context note */}
      <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 6 }}>
          {p.activeTier ? `TIER ${p.activeTier} · ${["", p.t.t1, p.t.t2, p.t.t3, p.t.t4, p.t.t5][p.activeTier]}` : `LEVEL ${p.currentLevel} / 5`}
        </div>
        <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          {ctxNote[ctxKey]?.[p.lang]}
        </div>
      </div>

      {/* World markets */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "12px 16px" }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{p.t.s4ref}</div>
        {[...WORLD_2024].sort((a, b) => b.ytd - a.ytd).map(m => {
          const pos    = m.ytd >= 0;
          const barPct = (Math.abs(m.ytd) / maxAbs) * 100;
          const col    = pos ? "var(--bull)" : "var(--bear)";
          return (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: m.label === "SET" ? "var(--caution)" : "var(--muted)", width: 72, flexShrink: 0 }}>{m.label}</div>
              <div style={{ flex: 1, height: 16, background: "var(--bg-raised)", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${barPct}%`, background: col, opacity: 0.75, transition: "width 600ms ease" }} />
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: col, width: 52, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>
                {pos ? "+" : ""}{m.ytd}%
              </div>
            </div>
          );
        })}
      </div>

      {/* SET Forecast */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "12px 16px" }}>
        <div className="t-micro" style={{ color: "var(--caution)", marginBottom: 10 }}>{p.t.s4ai}</div>
        {p.forecast
          ? <ForecastChart data={p.forecast} note={p.t.s4note} />
          : <div className="t-micro" style={{ color: "var(--dim)", padding: "8px 0", textTransform: "none", letterSpacing: 0 }}>
              {p.lang === "th" ? "กำลังโหลด…" : p.lang === "zh" ? "加载中…" : "Loading forecast…"}
            </div>
        }
      </div>

      {/* Style matrix */}
      {hasInv && (
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "12px 16px" }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 10 }}>
            {p.lang === "th" ? "เปรียบเทียบ 4 สไตล์ · ข้อมูลเดียวกัน" : p.lang === "zh" ? "四种风格对比 · 相同输入" : "STYLE MATRIX · SAME INPUTS · 4 PATHS"}
          </div>
          {(Object.entries(STYLES) as [StyleKey, typeof STYLES[StyleKey]][]).map(([key, s]) => {
            const proj    = projectAt(p.investable, s.ret, p.yearsToRetire);
            const diffPct = p.retirementTarget > 0 ? Math.round((proj / p.retirementTarget - 1) * 100) : 0;
            const isSel   = p.style === key;
            const label   = p.lang === "zh" ? s.zh : p.lang === "th" ? s.th : s.en;
            return (
              <div key={key} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                borderBottom: "1px solid var(--line)",
                background: isSel ? `color-mix(in srgb, ${s.color} 6%, transparent)` : "transparent",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: isSel ? s.color : "var(--muted)", width: 68, flexShrink: 0, fontWeight: isSel ? 700 : 400 }}>{label}{isSel ? " ▶" : ""}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", width: 36, flexShrink: 0 }}>+{(s.ret * 100).toFixed(0)}%</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: isSel ? s.color : "var(--ink)", fontWeight: isSel ? 700 : 400, flex: 1, textAlign: "right" }}>{fmtM(proj)}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: diffPct >= 0 ? "var(--bull)" : "var(--bear)", fontWeight: 700, width: 44, textAlign: "right", flexShrink: 0 }}>
                  {diffPct >= 0 ? "+" : ""}{diffPct}%
                </div>
              </div>
            );
          })}
          <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: 6 }}>
            {p.lang === "th" ? "% เทียบกับเป้าหมายเกษียณของคุณ" : p.lang === "zh" ? "% 相对于你的退休目标" : "% vs your retirement target"}
          </div>
        </div>
      )}

      {/* Inverse calculator */}
      {p.retirementTarget > 0 && (
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "12px 16px" }}>
          <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 10 }}>
            {p.lang === "th" ? `ต้องลงทุนเดือนละเท่าไหร่เพื่อ ${fmtM(p.retirementTarget)}` : p.lang === "zh" ? `每月需投多少才能达到 ${fmtM(p.retirementTarget)}` : `MONTHLY NEEDED TO HIT ${fmtM(p.retirementTarget)}`}
          </div>
          {(Object.entries(STYLES) as [StyleKey, typeof STYLES[StyleKey]][]).map(([key, s]) => {
            const needed = monthlyNeeded(p.retirementTarget, s.ret, p.yearsToRetire);
            const canHit = p.investable >= needed;
            const isSel  = p.style === key;
            const label  = p.lang === "zh" ? s.zh : p.lang === "th" ? s.th : s.en;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: isSel ? s.color : "var(--muted)", width: 68, flexShrink: 0, fontWeight: isSel ? 700 : 400 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", width: 36, flexShrink: 0 }}>+{(s.ret * 100).toFixed(0)}%</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: canHit ? "var(--bull)" : "var(--bear)", fontWeight: 700, flex: 1, textAlign: "right" }}>
                  {fmtThb(Math.ceil(needed / 100) * 100)}/mo
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: canHit ? "var(--bull)" : "var(--bear)", width: 44, textAlign: "right", flexShrink: 0 }}>
                  {canHit ? "✓" : "✗"}
                </div>
              </div>
            );
          })}
          <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: 6 }}>
            {p.lang === "th" ? `เปรียบกับรายรับของคุณ ${fmtThb(p.investable)}/เดือน` : p.lang === "zh" ? `你当前可投：${fmtThb(p.investable)}/月` : `Your current investable: ${fmtThb(p.investable)}/mo`}
          </div>
        </div>
      )}

      {/* Year-by-year milestones */}
      {sel && hasInv && (
        <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "12px 16px" }}>
          <div className="t-micro" style={{ color: sel.color, marginBottom: 10 }}>
            {p.lang === "th" ? `วิถีความมั่งคั่ง · ${sel.th} · +${(sel.ret * 100).toFixed(0)}%/ปี` : p.lang === "zh" ? `财富轨迹 · ${sel.zh} · +${(sel.ret * 100).toFixed(0)}%/年` : `WEALTH TRAJECTORY · ${sel.en} · +${(sel.ret * 100).toFixed(0)}%/YR`}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "0 0 4px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
            <span className="t-micro" style={{ color: "var(--dim)", width: 52, flexShrink: 0 }}>AGE</span>
            <span className="t-micro" style={{ color: "var(--dim)", width: 36, flexShrink: 0 }}>+YRS</span>
            <span className="t-micro" style={{ color: "var(--dim)", flex: 1, textAlign: "right" }}>PROJECTED</span>
          </div>
          {milestoneYears.map(yrs => {
            const val   = projectAt(p.investable, sel.ret, yrs);
            const ageAt = p.age + yrs;
            const isRet = yrs === p.yearsToRetire;
            return (
              <div key={yrs} style={{
                display: "flex", gap: 8, padding: "5px 0",
                borderBottom: isRet ? `1px solid ${sel.color}` : "1px solid var(--line)",
                background: isRet ? `color-mix(in srgb, ${sel.color} 6%, transparent)` : "transparent",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: isRet ? sel.color : "var(--muted)", width: 52, flexShrink: 0, fontWeight: isRet ? 700 : 400 }}>{ageAt}{isRet ? " ←" : ""}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", width: 36, flexShrink: 0 }}>+{yrs}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: isRet ? sel.color : "var(--ink)", fontWeight: isRet ? 700 : 400, flex: 1, textAlign: "right" }}>{fmtM(val)}</div>
              </div>
            );
          })}
          <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: 6 }}>
            {p.lang === "th" ? "ลงทุน " + fmtThb(p.investable) + "/เดือน · ทบต้นรายเดือน · ไม่หักภาษี"
              : p.lang === "zh" ? `月投 ${fmtThb(p.investable)} · 月复利 · 未扣税`
              : `${fmtThb(p.investable)}/mo invested · monthly compounding · pre-tax`}
          </div>
        </div>
      )}

      {/* Rule of 72 */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "12px 16px" }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 10 }}>
          {p.lang === "th" ? "กฎ 72 — เงินสองเท่าในกี่ปี?" : p.lang === "zh" ? "72法则 — 几年翻倍？" : "RULE OF 72 — YEARS TO DOUBLE"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {(Object.entries(STYLES) as [StyleKey, typeof STYLES[StyleKey]][]).map(([key, s]) => {
            const dbl   = doublesIn(s.ret);
            const isSel = p.style === key;
            const label = p.lang === "zh" ? s.zh : p.lang === "th" ? s.th : s.en;
            return (
              <div key={key} style={{
                padding: "8px 10px",
                background: isSel ? `color-mix(in srgb, ${s.color} 10%, var(--bg-raised))` : "var(--bg-raised)",
                border: `1px solid ${isSel ? s.color : "var(--line)"}`,
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: isSel ? s.color : "var(--muted)" }}>{label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: isSel ? s.color : "var(--ink)", lineHeight: 1.1 }}>
                  {dbl}<span style={{ fontSize: "var(--text-micro)", fontWeight: 400, color: "var(--dim)" }}> yrs</span>
                </div>
                <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0 }}>+{(s.ret * 100).toFixed(0)}%/yr</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="t-micro" style={{ color: "var(--dim)", textTransform: "none", letterSpacing: 0, marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        {p.lang === "th"
          ? "ข้อมูลตลาดโลก: อ้างอิงปี 2024 · AI Forecast: TIMESFM (Google) · ผลตอบแทนในอดีตไม่รับประกันอนาคต"
          : p.lang === "zh"
          ? "全球市场：2024年参考数据 · AI预测：TIMESFM（谷歌）· 历史收益不代表未来"
          : "World markets: 2024 reference · AI forecast: TIMESFM (Google) · Past returns ≠ future results"}
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const [lang,        setLang]       = useState<Lang>("en");
  const [activeTier,  setActiveTier] = useState<1|2|3|4|5|null>(null);
  const [age,         setAge]        = useState(22);
  const [salary,      setSalary]     = useState(15_000);
  const [living,      setLiving]     = useState(8_000);
  const [transport,   setTransport]  = useState(1_500);
  const [other,       setOther]      = useState(2_000);
  const [style,       setStyle]      = useState<StyleKey | null>(null);
  const [forecast,    setForecast]   = useState<ForecastData | null>(null);

  const t = T[lang];

  useEffect(() => {
    fetch("/api/forecast-set")
      .then(r => r.json())
      .then((d: ForecastData) => { if (d?.rows?.length) setForecast(d); })
      .catch(() => {});
  }, []);

  const yearsToRetire    = Math.max(1, RETIRE - age);
  const monthlyExpenses  = living + transport + other;
  const investable       = Math.max(0, salary - monthlyExpenses);
  const retirementTarget = monthlyExpenses * MONTHS * (LIFE_EXP - RETIRE);
  const styleReturn      = style ? STYLES[style].ret : 0.07;
  const ikigaiTarget     = monthlyExpenses > 0 ? (monthlyExpenses * 12) / styleReturn : 0;

  const projectedValue = useMemo(() =>
    style ? projectAt(investable, STYLES[style].ret, yearsToRetire) : 0,
    [style, investable, yearsToRetire]
  );

  const onTrack        = projectedValue >= retirementTarget;
  const readiness      = retirementTarget > 0
    ? Math.min(150, Math.round((projectedValue / retirementTarget) * 100)) : 0;
  const ikigaiReadiness = ikigaiTarget > 0
    ? Math.min(150, Math.round((projectedValue / ikigaiTarget) * 100)) : 0;

  const currentLevel: 0|1|2|3|4|5 =
    salary   <= 0   ? 0 :
    investable <= 0 ? 1 :
    !style          ? 2 :
    !onTrack        ? 3 :
    projectedValue < ikigaiTarget ? 4 :
    5;

  function handleTierClick(n: 1|2|3|4|5) {
    setActiveTier(prev => prev === n ? null : n);
  }

  function restart() {
    setStyle(null);
    setActiveTier(null);
  }

  const tierPanelProps = {
    lang, t,
    age, setAge, salary, setSalary,
    living, setLiving, transport, setTransport, other, setOther,
    style, setStyle,
    investable, monthlyExpenses, yearsToRetire,
    retirementTarget, projectedValue, onTrack, readiness,
    ikigaiTarget, ikigaiReadiness,
    forecast, onRestart: restart,
  };

  const contextProps = {
    lang, t, age, salary, investable,
    retirementTarget, style, projectedValue, readiness, onTrack,
    forecast, yearsToRetire,
    activeTier, currentLevel,
  };

  return (
    <div className="page page-enter plan-page">

      {/* ── Wizard column ──────────────────────────────────────────── */}
      <div className="plan-wizard">

        {/* Language toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DigitalBeaver size={20} color="var(--caution)" animated aria-hidden />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.1em" }}>
              SIAM · PLAN
            </span>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {(["en","th","zh"] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
                color: lang === l ? "#000" : "var(--dim)",
                background: lang === l ? "var(--caution)" : "var(--bg-raised)",
                border: "1px solid var(--line)",
                borderBottom: lang === l ? "3px solid rgba(0,0,0,0.3)" : "1px solid var(--line)",
                padding: "0 12px", cursor: "pointer", letterSpacing: "0.06em", minHeight: 32,
                fontWeight: lang === l ? 700 : 400,
              }}>
                {l === "en" ? "EN" : l === "th" ? "ไทย" : "中"}
              </button>
            ))}
          </div>
        </div>

        {/* Pyramid */}
        <PyramidSVG
          currentLevel={currentLevel}
          activeTier={activeTier}
          onTierClick={handleTierClick}
          t={t}
        />

        {/* Level indicator */}
        <LevelIndicator
          currentLevel={currentLevel}
          activeTier={activeTier}
          t={t} lang={lang}
          onTrack={onTrack}
          investable={investable}
          style={style}
        />

        {/* Tier detail */}
        {activeTier !== null ? (
          <TierPanel tier={activeTier} {...tierPanelProps} />
        ) : (
          <div style={{
            padding: "24px 0",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)", letterSpacing: "0.1em" }}>
              {t.tapStart}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {([1,2,3,4,5] as (1|2|3|4|5)[]).map(n => (
                <button
                  key={n}
                  onClick={() => handleTierClick(n)}
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
                    padding: "6px 10px", minHeight: 32,
                    background: n <= currentLevel ? "rgba(0,200,150,0.1)" : n === currentLevel + 1 ? "rgba(255,149,0,0.1)" : "var(--bg-raised)",
                    border: `1px solid ${n <= currentLevel ? "var(--bull)" : n === currentLevel + 1 ? "var(--caution)" : "var(--line)"}`,
                    color: n <= currentLevel ? "var(--bull)" : n === currentLevel + 1 ? "var(--caution)" : "var(--dim)",
                    cursor: "pointer",
                    fontWeight: n === currentLevel + 1 ? 700 : 400,
                    letterSpacing: "0.06em",
                  }}
                >
                  {[t.t1, t.t2, t.t3, t.t4, t.t5][n - 1]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Context panel (desktop only) ───────────────────────────── */}
      <div className="plan-context">
        <ContextPanel {...contextProps} />
      </div>

    </div>
  );
}
