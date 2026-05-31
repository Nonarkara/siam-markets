"use client";

import { useState } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   AgeLens — the plan speaks your language, based on where you are in life.
   • Young (<30): Time is your superpower. Show cost of waiting.
   • Building (30–50): The hard work years. Mortgage, family, trade-offs.
   • Peak (50–retire): The final stretch. Catch up, healthcare, reality check.
   • Retired (≥ retire): Living off the pile. Make it last, stay in the game.
   ══════════════════════════════════════════════════════════════════════════════ */

type Lang = "en" | "th" | "zh";

export function AgeLens({ lang, age, retireAge, salary, yearsToRetire, yearsPostRetire, currency }: {
  lang: Lang; age: number; retireAge: number; salary: number;
  yearsToRetire: number; yearsPostRetire: number; currency: string;
}) {
  const band: "young" | "building" | "peak" | "retired" =
    age >= retireAge ? "retired" : age >= 50 ? "peak" : age < 30 ? "young" : "building";

  const bandLabels = {
    en: { young: "EARLY · TIME IS FREE", building: "BUILDING · THE GRIND", peak: "PEAK · FINAL STRETCH", retired: "RETIRED · DRAW-DOWN" },
    th: { young: "ช่วงต้น · เวลาคือของฟรี", building: "สร้างเนื้อสร้างตัว · ช่วงหนัก", peak: "ช่วงปลาย ·  Sprint สุดท้าย", retired: "เกษียณ · ใช้เงินที่สะสม" },
    zh: { young: "早期 · 时间是免费的", building: "建设期 · 奋斗阶段", peak: "高峰期 · 最后冲刺", retired: "退休 · 动用积蓄" },
  }[lang];

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", letterSpacing: "0.16em", marginBottom: 12 }}>
        {bandLabels[band]}
      </div>
      {band === "young"    && <Young    lang={lang} salary={salary} yearsToRetire={yearsToRetire} currency={currency} />}
      {band === "building" && <Building lang={lang} salary={salary} yearsToRetire={yearsToRetire} currency={currency} />}
      {band === "peak"     && <Peak     lang={lang} salary={salary} yearsToRetire={yearsToRetire} yearsPostRetire={yearsPostRetire} currency={currency} />}
      {band === "retired"  && <Retired  lang={lang} yearsPostRetire={yearsPostRetire} currency={currency} />}
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtM(c: string, v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${c}${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000)     return `${c}${(v / 1_000).toFixed(0)}K`;
  return `${c}${Math.round(v).toLocaleString()}`;
}
function fv(monthly: number, annual: number, years: number): number {
  const r = annual / 12, n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}
const H2: React.CSSProperties = { fontFamily: "var(--font-elegant), Georgia, serif", fontSize: "var(--text-display)", fontWeight: 500, color: "var(--ink)", lineHeight: 1.12, margin: "0 0 10px" };
const BODY: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: "var(--muted)", lineHeight: 1.65, margin: "0 0 16px", maxWidth: "60ch" };
const MICRO: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--dim)" };

function Slider({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={MICRO}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--caution)", cursor: "pointer", minHeight: 44, display: "block" }} />
    </div>
  );
}

// ─── YOUNG ──────────────────────────────────────────────────────────────────
function Young({ lang, salary, yearsToRetire, currency }: { lang: Lang; salary: number; yearsToRetire: number; currency: string }) {
  const monthly = Math.max(1000, Math.round(salary * 0.1));
  const RATE = 0.07;
  const nowFV  = fv(monthly, RATE, yearsToRetire);
  const waitFV = fv(monthly, RATE, Math.max(1, yearsToRetire - 10));
  const cost = nowFV - waitFV;
  const t = {
    en: { h: "You have time. That's everything.",
          b: "You don't need to be smart. You just need to start. Save a little every month, let it grow, and time does the heavy lifting. The biggest mistake is waiting until you 'know enough'.",
          start: "Start now", wait: "Wait 10 years", cost: (c: string) => `Waiting costs you ${c}`,
          note: (m: string) => `Saving just ${m}/month (10% of pay) at 7% a year.` },
    th: { h: "คุณมีเวลา นั่นคือทุกอย่าง",
          b: "ไม่ต้องฉลาด แค่ต้องเริ่ม ออมนิดหน่อยทุกเดือน ปล่อยให้มันโต เวลาจะทำงานหนักแทนคุณ ความผิดพลาดที่ใหญ่ที่สุดคือรอจนกว่าจะ 'รู้พอ'",
          start: "เริ่มตอนนี้", wait: "รออีก 10 ปี", cost: (c: string) => `การรอทำให้เสีย ${c}`,
          note: (m: string) => `ออมแค่ ${m}/เดือน (10% ของรายได้) ที่ 7% ต่อปี` },
    zh: { h: "你有时间。这就是一切。",
          b: "你不需要聪明。你只需要开始。每月存一点，让它增长，时间会做重活。最大的错误是等到'懂得够多'才开始。",
          start: "现在开始", wait: "等10年", cost: (c: string) => `等待让你损失 ${c}`,
          note: (m: string) => `每月只存 ${m}（收入的10%），年化7%。` },
  }[lang];
  const max = Math.max(nowFV, waitFV) || 1;
  return (
    <div>
      <h2 style={H2}>{t.h}</h2>
      <p style={BODY}>{t.b}</p>
      <div className="card" style={{ padding: 16 }}>
        {[{ l: t.start, v: nowFV, c: "var(--bull)" }, { l: t.wait, v: waitFV, c: "var(--muted)" }].map(r => (
          <div key={r.l} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={MICRO}>{r.l}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: r.c }}>{fmtM(currency, r.v)}</span>
            </div>
            <div style={{ height: 8, background: "var(--bg)" }}><div style={{ height: "100%", width: `${(r.v / max) * 100}%`, background: r.c, opacity: 0.7 }} /></div>
          </div>
        ))}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--caution)", marginTop: 6 }}>{t.cost(fmtM(currency, cost))}</div>
        <div style={{ ...MICRO, marginTop: 6, textTransform: "none", letterSpacing: 0 }}>{t.note(fmtM(currency, monthly))}</div>
      </div>
    </div>
  );
}

// ─── BUILDING ─────────────────────────────────────────────────────────────────
function Building({ lang, salary, yearsToRetire, currency }: { lang: Lang; salary: number; yearsToRetire: number; currency: string }) {
  const [pay, setPay]   = useState(Math.round(salary * 0.3));
  const [bal, setBal]   = useState(2_000_000);
  const [rate, setRate] = useState(0.06);
  const EXP_RET = 0.08;
  const mr = rate / 12;
  const monthsLeft = pay <= bal * mr ? Infinity : Math.ceil(-Math.log(1 - (bal * mr) / pay) / Math.log(1 + mr));
  const yrsLeft = monthsLeft === Infinity ? null : monthsLeft / 12;
  const investWins = EXP_RET > rate;
  const payPct = salary > 0 ? Math.round((pay / salary) * 100) : 0;
  const t = {
    en: { h: "The building years.",
          b: "This is when life gets expensive — house, kids, car. The trick is: don't stop saving. Even 10% of your pay, kept steady, builds a pile. The mortgage question: if your loan rate is lower than 8%, invest the spare. If higher, pay it down.",
          pay: "MORTGAGE / MONTH", bal: "BALANCE LEFT", rate: "MORTGAGE RATE",
          payoff: (y: string) => `Paid off in ~${y} years`, never: "Payment barely covers interest",
          load: (p: number) => `That's ${p}% of your pay on the house`,
          win: `Invest spare cash — 8% expected beats your mortgage`,
          lose: `Overpay mortgage — its rate beats safe 8%`,
          pileNote: (y: number, amt: string) => `If you save 10% for ${y} more years, you'll have ${amt}` },
    th: { h: "ช่วงสร้างเนื้อสร้างตัว",
          b: "นี่คือช่วงที่ชีวิตแพง — บ้าน ลูก รถ เคล็ดลับคือ: อย่าหยุดออม แค่ 10% ของรายได้ สม่ำเสมอ ก็สร้างกองเงินได้ คำถามบ้าน: ถ้าดอกเบี้ยต่ำกว่า 8% เอาไปลงทุน ถ้าสูงกว่า โปะหนี้ก่อน",
          pay: "ผ่อนบ้าน/เดือน", bal: "ยอดคงเหลือ", rate: "ดอกเบี้ยบ้าน",
          payoff: (y: string) => `ผ่อนหมดใน ~${y} ปี`, never: "ค่างวดแทบไม่พอดอกเบี้ย",
          load: (p: number) => `คิดเป็น ${p}% ของรายได้ที่ผ่อนบ้าน`,
          win: `เอาเงินเหลือไปลงทุน — 8% ชนะดอกบ้าน`,
          lose: `โปะบ้านก่อน — ดอกบ้านสูงกว่า 8%`,
          pileNote: (y: number, amt: string) => `ถ้าออม 10% อีก ${y} ปี จะมี ${amt}` },
    zh: { h: "建设期",
          b: "这是生活变贵的阶段——房子、孩子、车子。诀窍是：不要停止储蓄。即使只存收入的10%，坚持下去也能攒下一堆。房贷问题：如果贷款利率低于8%，把余钱拿去投资。如果更高，先还贷。",
          pay: "月供", bal: "剩余本金", rate: "房贷利率",
          payoff: (y: string) => `按此速度约 ${y} 年还清`, never: "月供勉强覆盖利息",
          load: (p: number) => `即 ${p}% 的收入在供房`,
          win: `余钱投资——预期8%高于房贷利率`,
          lose: `先多还房贷——其利率高于8%安全预期`,
          pileNote: (y: number, amt: string) => `如果再存10%，${y}年后你会有${amt}` },
  }[lang];

  const pileAmt = fv(Math.round(salary * 0.1), 0.07, yearsToRetire);

  return (
    <div>
      <h2 style={H2}>{t.h}</h2>
      <p style={BODY}>{t.b}</p>
      <div className="card" style={{ padding: 16 }}>
        <Slider label={t.pay}  value={pay}  min={0} max={Math.max(80000, salary)} step={500}  onChange={setPay}  fmt={(v) => fmtM(currency, v)} />
        <Slider label={t.bal}  value={bal}  min={0} max={15_000_000} step={50_000} onChange={setBal} fmt={(v) => fmtM(currency, v)} />
        <Slider label={t.rate} value={rate} min={0.01} max={0.12} step={0.0025} onChange={setRate} fmt={(v) => `${(v * 100).toFixed(2)}%`} />
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: yrsLeft ? "var(--ink)" : "var(--bear)" }}>
            {yrsLeft ? t.payoff(yrsLeft.toFixed(1)) : t.never}
          </div>
          <div style={{ ...MICRO, marginTop: 4, textTransform: "none", letterSpacing: 0 }}>{t.load(payPct)}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", fontWeight: 700, color: investWins ? "var(--bull)" : "var(--caution)", marginTop: 10, lineHeight: 1.5 }}>
            {investWins ? t.win : t.lose}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--tech)", marginTop: 10, lineHeight: 1.5 }}>
            {t.pileNote(yearsToRetire, fmtM(currency, pileAmt))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PEAK ──────────────────────────────────────────────────────────────────
function Peak({ lang, salary, yearsToRetire, yearsPostRetire, currency }: { lang: Lang; salary: number; yearsToRetire: number; yearsPostRetire: number; currency: string }) {
  const [savings, setSavings] = useState(1_500_000);
  const monthlySave = Math.round(salary * 0.2);
  const pileAtRetire = savings + fv(monthlySave, 0.07, yearsToRetire);
  const needPerYear = Math.round(salary * 0.6);
  const totalNeed = needPerYear * yearsPostRetire;
  const short = totalNeed - pileAtRetire;
  const t = {
    en: { h: "The final stretch.",
          b: "You don't have decades anymore — you have years. Every decision now is magnified. Can you save 20%? Can you delay retirement by 2-3 years? These moves matter more than any investment pick.",
          sav: "CURRENT SAVINGS", saveRate: "SAVE 20% / MONTH",
          pile: "PILE AT RETIREMENT", need: "TOTAL NEED",
          short: (v: string) => `Short by ${v}`,
          ok: (v: string) => `Surplus of ${v}`,
          action: "Catch-up moves: max out RMF/SSF, cut luxuries, consider working 2-3 extra years.",
          delay: "Delaying retirement 3 years = 30% more savings + 3 fewer years of drawdown." },
    th: { h: "Sprint สุดท้าย",
          b: "ไม่มีทศวรรษแล้ว — มีแค่ปี ทุกการตัดสินใจตอนนี้ถูกขยาย ออม 20% ได้ไหม? เลื่อนเกษียณ 2-3 ปีได้ไหม? การเคลื่อนไหวพวกนี้สำคัญกว่าการเลือกลงทุน",
          sav: "เงินที่มีตอนนี้", saveRate: "ออม 20% / เดือน",
          pile: "กองเงินตอนเกษียณ", need: "ที่ต้องการทั้งหมด",
          short: (v: string) => `ขาด ${v}`,
          ok: (v: string) => `เหลือ ${v}`,
          action: "ทางออก: เต็ม RMF/SSF ตัดฟุ่มเฟือย พิจารณาทำงานต่ออีก 2-3 ปี",
          delay: "เลื่อนเกษียณ 3 ปี = ออมเพิ่ม 30% + ใช้เงินน้อยลง 3 ปี" },
    zh: { h: "最后冲刺",
          b: "你不再有几十年的时间——只有几年。现在的每一个决定都被放大。你能存20%吗？能推迟退休2-3年吗？这些动作比任何投资选择都重要。",
          sav: "现有储蓄", saveRate: "每月存20%",
          pile: "退休时的积蓄", need: "总需求",
          short: (v: string) => `还差 ${v}`,
          ok: (v: string) => `多出 ${v}`,
          action: "追赶措施：最大化RMF/SSF，削减奢侈消费，考虑多工作2-3年。",
          delay: "推迟退休3年 = 多存30% + 少花3年。" },
  }[lang];

  return (
    <div>
      <h2 style={H2}>{t.h}</h2>
      <p style={BODY}>{t.b}</p>
      <div className="card" style={{ padding: 16 }}>
        <Slider label={t.sav} value={savings} min={0} max={30_000_000} step={100_000} onChange={setSavings} fmt={(v) => fmtM(currency, v)} />
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={MICRO}>{t.saveRate}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--bull)" }}>{fmtM(currency, monthlySave)}/mo</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={MICRO}>{t.pile}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--tech)" }}>{fmtM(currency, pileAtRetire)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={MICRO}>{t.need}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--ink)" }}>{fmtM(currency, totalNeed)}</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: short > 0 ? "var(--bear)" : "var(--bull)", marginTop: 10, lineHeight: 1.1 }}>
            {short > 0 ? t.short(fmtM(currency, short)) : t.ok(fmtM(currency, Math.abs(short)))}
          </div>
        </div>
      </div>
      <div className="plan-v3-callout" style={{ marginTop: 12, textAlign: "left", maxWidth: "none" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.5, margin: 0 }}>{t.action}</p>
      </div>
      <div className="plan-v3-callout" style={{ marginTop: 8, textAlign: "left", maxWidth: "none", borderColor: "var(--amber-nav)" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--amber-nav)", lineHeight: 1.5, margin: 0 }}>{t.delay}</p>
      </div>
    </div>
  );
}

// ─── RETIRED ──────────────────────────────────────────────────────────────────
function Retired({ lang, yearsPostRetire, currency }: { lang: Lang; yearsPostRetire: number; currency: string }) {
  const [savings, setSavings] = useState(3_000_000);
  const [spend, setSpend]     = useState(30_000);
  const annualSpend = spend * 12;
  const runwayFlat = annualSpend > 0 ? savings / annualSpend : 0;
  const safeDraw = savings * 0.04;
  const safeDrawMo = safeDraw / 12;
  const covers = safeDraw >= annualSpend;
  const t = {
    en: { h: "Living off what you built.",
          b: "The question flips. Not 'how much will I build' but 'how long does what I have last — and how do I stay in the game without risking the nest egg?'",
          sav: "SAVED TODAY", sp: "SPEND / MONTH",
          runway: (y: string) => `${y} years if it just sits there (no growth)`,
          rule: (mo: string) => `4% rule: draw ${mo}/month forever if invested`,
          ok: "Your safe draw covers spending — stay mostly defensive, a slice in growth to beat inflation",
          gap: "Spending exceeds safe draw — trim spend, or keep a growth sleeve working",
          health: "Healthcare tip: Thailand's 30-baht scheme covers basics. Keep a buffer for dental, specialist visits, and medicine." },
    th: { h: "ใช้ชีวิตจากสิ่งที่สร้างไว้",
          b: "คำถามกลับด้าน ไม่ใช่ 'จะสะสมได้เท่าไหร่' แต่ 'ที่มีอยู่จะอยู่ได้นานแค่ไหน — และจะกลับเข้าเกมนิดหน่อยยังไงโดยไม่เสี่ยง'",
          sav: "เงินที่มีตอนนี้", sp: "ใช้จ่าย/เดือน",
          runway: (y: string) => `อยู่ได้ ${y} ปี ถ้าปล่อยไว้เฉยๆ`,
          rule: (mo: string) => `กฎ 4%: ถอนได้ ${mo}/เดือน ไปเรื่อยๆ ถ้านำไปลงทุน`,
          ok: "เงินถอนปลอดภัยพอกับค่าใช้จ่าย — เน้นตั้งรับ เก็บส่วนหนึ่งให้โตชนะเงินเฟ้อ",
          gap: "ค่าใช้จ่ายเกินเงินถอนปลอดภัย — ลดรายจ่าย หรือคงส่วนที่ลงทุนให้ทำงาน",
          health: "เคล็ดลับสุขภาพ: สิทธิ์ 30 บาทรักษาทุกโรคครอบคลุมพื้นฐาน เก็บ buffer สำหรับฟัน ผู้เชี่ยวชาญ และยา" },
    zh: { h: "靠积蓄生活",
          b: "问题反转了。不是'我能攒多少'，而是'手上的能撑多久——以及如何在不冒险的前提下重新入场一点'。",
          sav: "现有储蓄", sp: "月支出",
          runway: (y: string) => `若闲置不增长可用 ${y} 年`,
          rule: (mo: string) => `4%法则：若投资可永久每月提取 ${mo}`,
          ok: "安全提取覆盖支出——以防守为主，留一部分增长跑赢通胀",
          gap: "支出超过安全提取——削减开支，或保留增长仓位运作",
          health: "医疗提示：泰国30泰铢计划覆盖基础医疗。为牙科、专科就诊和药物预留缓冲。" },
  }[lang];
  return (
    <div>
      <h2 style={H2}>{t.h}</h2>
      <p style={BODY}>{t.b}</p>
      <div className="card" style={{ padding: 16 }}>
        <Slider label={t.sav} value={savings} min={0} max={30_000_000} step={100_000} onChange={setSavings} fmt={(v) => fmtM(currency, v)} />
        <Slider label={t.sp}  value={spend}   min={5000} max={300_000} step={1000}    onChange={setSpend}   fmt={(v) => fmtM(currency, v)} />
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--display)", fontWeight: 700, color: runwayFlat >= yearsPostRetire ? "var(--bull)" : "var(--bear)", lineHeight: 1 }}>
            {runwayFlat.toFixed(0)}<span style={{ fontSize: "var(--text-body)", color: "var(--dim)" }}> yrs</span>
          </div>
          <div style={{ ...MICRO, marginTop: 4, textTransform: "none", letterSpacing: 0 }}>{t.runway(runwayFlat.toFixed(0))}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--tech)", marginTop: 10 }}>{t.rule(fmtM(currency, safeDrawMo))}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", fontWeight: 700, color: covers ? "var(--bull)" : "var(--caution)", marginTop: 8, lineHeight: 1.5 }}>
            {covers ? t.ok : t.gap}
          </div>
        </div>
      </div>
      <div className="plan-v3-callout" style={{ marginTop: 12, textAlign: "left", maxWidth: "none" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-micro)", color: "var(--dim)", lineHeight: 1.5, margin: 0 }}>{t.health}</p>
      </div>
    </div>
  );
}
