"use client";

import { useState } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   AgeLens — the plan adapts to who you are.
   • Young (<30): explain what saving even means; show the cost of waiting.
   • Building (30 → retire): the mortgage question — overpay vs invest.
   • Retired (≥ retire): "how much have you saved?" → runway + the 4% rule,
     and how to get back in the game without risking the nest egg.
   Self-contained: reads the plan's age/salary read-only, holds its own
   mortgage / savings inputs, does its own honest arithmetic.
   ══════════════════════════════════════════════════════════════════════════════ */

type Lang = "en" | "th" | "zh";

export function AgeLens({ lang, age, retireAge, salary, yearsToRetire, yearsPostRetire, currency }: {
  lang: Lang; age: number; retireAge: number; salary: number;
  yearsToRetire: number; yearsPostRetire: number; currency: string;
}) {
  const band: "young" | "building" | "retired" =
    age >= retireAge ? "retired" : age < 30 ? "young" : "building";

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)", letterSpacing: "0.16em", marginBottom: 12 }}>
        {band === "young" ? "EARLY · 18–29" : band === "building" ? "BUILDING · 30–RETIRE" : "RETIRED · DRAW-DOWN"}
      </div>
      {band === "young"    && <Young    lang={lang} salary={salary} yearsToRetire={yearsToRetire} currency={currency} />}
      {band === "building" && <Building lang={lang} salary={salary} currency={currency} />}
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
    en: { h: "You're early. That's the whole advantage.",
          b: "Saving isn't complicated: spend less than you earn, and put the gap somewhere it grows. You don't need to understand markets yet — you need to start. The decade you have right now is worth more than the money.",
          start: "Start now", wait: "Wait 10 years", cost: (c: string) => `Waiting 10 years costs you ${c}`,
          note: (m: string) => `Saving ${m}/month (≈10% of pay) at 7% a year.` },
    th: { h: "คุณยังเด็ก นั่นคือข้อได้เปรียบทั้งหมด",
          b: "การออมไม่ซับซ้อน: ใช้น้อยกว่าที่หาได้ แล้วเอาส่วนต่างไปไว้ที่ที่มันงอกเงย คุณยังไม่ต้องเข้าใจตลาด แค่ต้องเริ่ม ทศวรรษที่คุณมีตอนนี้มีค่ากว่าตัวเงิน",
          start: "เริ่มตอนนี้", wait: "รออีก 10 ปี", cost: (c: string) => `การรอ 10 ปี ทำให้คุณเสีย ${c}`,
          note: (m: string) => `ออม ${m}/เดือน (~10% ของรายได้) ที่ 7% ต่อปี` },
    zh: { h: "你还年轻，这就是全部优势。",
          b: "储蓄不复杂：花得比赚得少，把差额放到会增长的地方。你还不需要懂市场——你需要开始。你现在拥有的这十年，比钱更值钱。",
          start: "现在开始", wait: "等10年", cost: (c: string) => `等10年让你损失 ${c}`,
          note: (m: string) => `每月存 ${m}（约收入10%），年化7%。` },
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
function Building({ lang, salary, currency }: { lang: Lang; salary: number; currency: string }) {
  const [pay, setPay]   = useState(Math.round(salary * 0.3));
  const [bal, setBal]   = useState(2_000_000);
  const [rate, setRate] = useState(0.06);
  const EXP_RET = 0.08;
  const mr = rate / 12;
  // months to payoff (amortization); Infinity if payment ≤ interest
  const monthsLeft = pay <= bal * mr ? Infinity : Math.ceil(-Math.log(1 - (bal * mr) / pay) / Math.log(1 + mr));
  const yrsLeft = monthsLeft === Infinity ? null : monthsLeft / 12;
  const investWins = EXP_RET > rate;
  const payPct = salary > 0 ? Math.round((pay / salary) * 100) : 0;
  const t = {
    en: { h: "The building years — and the mortgage question.",
          b: "By now you carry a mortgage. The key decision: spare baht each month — overpay the loan, or invest it? A loan is a guaranteed return equal to its rate; investing is a higher but uncertain one.",
          pay: "MORTGAGE / MONTH", bal: "BALANCE LEFT", rate: "MORTGAGE RATE",
          payoff: (y: string) => `Paid off in ~${y} years at this pace`, never: "Payment barely covers interest — it won't clear",
          load: (p: number) => `That's ${p}% of your pay servicing the house`,
          win: `Invest the spare baht — 8% expected beats your mortgage rate`,
          lose: `Overpay the mortgage — its rate beats a safe 8% expectation` },
    th: { h: "ช่วงสร้างเนื้อสร้างตัว — และคำถามเรื่องบ้าน",
          b: "ถึงตอนนี้คุณมีภาระผ่อนบ้าน การตัดสินใจสำคัญ: เงินเหลือแต่ละเดือน — โปะหนี้ หรือเอาไปลงทุน? หนี้คือผลตอบแทนที่แน่นอนเท่าอัตราดอกเบี้ย การลงทุนสูงกว่าแต่ไม่แน่นอน",
          pay: "ผ่อนบ้าน/เดือน", bal: "ยอดคงเหลือ", rate: "ดอกเบี้ยบ้าน",
          payoff: (y: string) => `ผ่อนหมดใน ~${y} ปี ที่อัตรานี้`, never: "ค่างวดแทบไม่พอดอกเบี้ย — ไม่มีวันหมด",
          load: (p: number) => `คิดเป็น ${p}% ของรายได้ที่ผ่อนบ้าน`,
          win: `เอาเงินเหลือไปลงทุน — คาดหวัง 8% ชนะดอกเบี้ยบ้าน`,
          lose: `โปะบ้านก่อน — ดอกเบี้ยบ้านสูงกว่า 8% ที่คาดหวังแบบปลอดภัย` },
    zh: { h: "建设期——以及房贷问题。",
          b: "此时你背着房贷。关键决定：每月余钱——多还贷款，还是拿去投资？贷款是等于其利率的确定回报；投资更高但不确定。",
          pay: "月供", bal: "剩余本金", rate: "房贷利率",
          payoff: (y: string) => `按此速度约 ${y} 年还清`, never: "月供勉强覆盖利息——还不清",
          load: (p: number) => `即 ${p}% 的收入在供房`,
          win: `把余钱拿去投资——预期8%高于房贷利率`,
          lose: `先多还房贷——其利率高于8%的安全预期` },
  }[lang];
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
        </div>
      </div>
    </div>
  );
}

// ─── RETIRED ──────────────────────────────────────────────────────────────────
function Retired({ lang, yearsPostRetire, currency }: { lang: Lang; yearsPostRetire: number; currency: string }) {
  const [savings, setSavings] = useState(3_000_000);
  const [spend, setSpend]     = useState(30_000);
  const annualSpend = spend * 12;
  const runwayFlat = annualSpend > 0 ? savings / annualSpend : 0;     // zero-growth years
  const safeDraw = savings * 0.04;                                    // 4% rule / year
  const safeDrawMo = safeDraw / 12;
  const covers = safeDraw >= annualSpend;
  const t = {
    en: { h: "Retired — can it last, and can it grow?",
          b: "The question flips. Not 'how much will I build' but 'how long does what I have last — and how do I get a little back in the game without risking it?'",
          sav: "SAVED TODAY", sp: "SPEND / MONTH",
          runway: (y: string) => `${y} years if it just sits there (no growth)`,
          rule: (mo: string) => `The 4% rule: draw ${mo}/month indefinitely if invested`,
          ok: "Your safe draw covers your spending — stay mostly defensive, a slice in growth to beat inflation",
          gap: "Your spending exceeds the safe draw — trim spend, or keep a growth sleeve working" },
    th: { h: "เกษียณแล้ว — เงินจะอยู่ได้นานแค่ไหน และจะโตได้ไหม?",
          b: "คำถามกลับด้าน ไม่ใช่ 'จะสะสมได้เท่าไหร่' แต่เป็น 'ที่มีอยู่จะอยู่ได้นานแค่ไหน — และจะกลับเข้าเกมนิดหน่อยยังไงโดยไม่เสี่ยง'",
          sav: "เงินที่มีตอนนี้", sp: "ใช้จ่าย/เดือน",
          runway: (y: string) => `อยู่ได้ ${y} ปี ถ้าปล่อยไว้เฉยๆ (ไม่โต)`,
          rule: (mo: string) => `กฎ 4%: ถอนได้ ${mo}/เดือน ไปเรื่อยๆ ถ้านำไปลงทุน`,
          ok: "เงินถอนปลอดภัยพอกับค่าใช้จ่าย — เน้นตั้งรับ เก็บส่วนหนึ่งให้โตชนะเงินเฟ้อ",
          gap: "ค่าใช้จ่ายเกินเงินถอนปลอดภัย — ลดรายจ่าย หรือคงส่วนที่ลงทุนให้ทำงาน" },
    zh: { h: "已退休——能撑多久，还能增长吗？",
          b: "问题反转了。不是'我能攒多少'，而是'手上的能撑多久——以及如何在不冒险的前提下重新入场一点'。",
          sav: "现有储蓄", sp: "月支出",
          runway: (y: string) => `若闲置不增长可用 ${y} 年`,
          rule: (mo: string) => `4%法则：若投资可永久每月提取 ${mo}`,
          ok: "安全提取覆盖支出——以防守为主，留一部分增长跑赢通胀",
          gap: "支出超过安全提取——削减开支，或保留增长仓位运作" },
  }[lang];
  return (
    <div>
      <h2 style={H2}>{t.h}</h2>
      <p style={BODY}>{t.b}</p>
      <div className="card" style={{ padding: 16 }}>
        <Slider label={t.sav} value={savings} min={0} max={30_000_000} step={100_000} onChange={setSavings} fmt={(v) => fmtM(currency, v)} />
        <Slider label={t.sp}  value={spend}   min={5000} max={300_000} step={1000}    onChange={setSpend}   fmt={(v) => fmtM(currency, v)} />
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-display)", fontWeight: 700, color: runwayFlat >= yearsPostRetire ? "var(--bull)" : "var(--bear)", lineHeight: 1 }}>
            {runwayFlat.toFixed(0)}<span style={{ fontSize: "var(--text-body)", color: "var(--dim)" }}> yrs</span>
          </div>
          <div style={{ ...MICRO, marginTop: 4, textTransform: "none", letterSpacing: 0 }}>{t.runway(runwayFlat.toFixed(0))}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: "var(--tech)", marginTop: 10 }}>{t.rule(fmtM(currency, safeDrawMo))}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body)", fontWeight: 700, color: covers ? "var(--bull)" : "var(--caution)", marginTop: 8, lineHeight: 1.5 }}>
            {covers ? t.ok : t.gap}
          </div>
        </div>
      </div>
    </div>
  );
}
