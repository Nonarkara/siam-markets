/* ══════════════════════════════════════════════════════════════════════════════
   PLAN DATA LAYER  —  types, geo configs, investment styles, maslow, cycles,
   civilization spiral points, and pure math helpers.
   ══════════════════════════════════════════════════════════════════════════════ */

export type Lang = "en" | "th" | "zh";
export type GeoKey = "th" | "us" | "jp" | "eu" | "cn" | "kr";
export type StyleKey = "money" | "balanced" | "growth" | "people" | "derivatives";
export type CycleType = "contraction" | "recovery" | "expansion" | "late";

export interface GeoConfig {
  flag: string;
  name: string;
  currency: string;
  lifeExp: number;
  retireRef: number;
  retireAge: number;
  defaultSalary: number;
  defaultLiving: number;
  defaultTransport: number;
  defaultOther: number;
  defaultNeeds: [number, number, number, number, number];
  salaryMax: number;
  livingMax: number;
  transportMax: number;
  otherMax: number;
  needsMax: [number, number, number, number, number];
  /* new: country context */
  taxRate: number;       // approx marginal income tax %
  interestRate: number;  // approx risk-free / savings rate %
  marketNote: Record<Lang, string>;
}

export const GEOS: Record<GeoKey, GeoConfig> = {
  th: {
    flag: "🇹🇭",
    name: "Thailand",
    currency: "฿",
    lifeExp: 78,
    retireRef: 6_000_000,
    retireAge: 60,
    defaultSalary: 30_000,
    defaultLiving: 8_000,
    defaultTransport: 2_000,
    defaultOther: 3_000,
    defaultNeeds: [8_000, 2_000, 2_500, 2_500, 1_000],
    salaryMax: 200_000,
    livingMax: 80_000,
    transportMax: 30_000,
    otherMax: 50_000,
    needsMax: [50_000, 20_000, 20_000, 30_000, 20_000],
    taxRate: 15,
    interestRate: 2.0,
    marketNote: {
      en: "SET50 is concentrated in finance & energy. Low interest rates favor equities.",
      th: "SET50 เน้นการเงินและพลังงาน ดอกเบี้ยต่ำเอื้อต่อหุ้น",
      zh: "SET50集中在金融和能源板块。低利率利好股市。",
    },
  },
  us: {
    flag: "🇺🇸",
    name: "USA",
    currency: "$",
    lifeExp: 79,
    retireRef: 1_500_000,
    retireAge: 65,
    defaultSalary: 5_000,
    defaultLiving: 2_000,
    defaultTransport: 500,
    defaultOther: 500,
    defaultNeeds: [2_000, 500, 400, 500, 200],
    salaryMax: 20_000,
    livingMax: 8_000,
    transportMax: 2_000,
    otherMax: 3_000,
    needsMax: [8_000, 3_000, 3_000, 5_000, 3_000],
    taxRate: 24,
    interestRate: 5.0,
    marketNote: {
      en: "Deep, liquid markets. 401(k) + IRA are tax-advantaged vehicles.",
      th: "ตลาดลึกและสภาพคล่องสูง 401(k) + IRA ลดหย่อนภาษี",
      zh: "市场深度好、流动性高。401(k)和IRA享有税收优惠。",
    },
  },
  jp: {
    flag: "🇯🇵",
    name: "Japan",
    currency: "¥",
    lifeExp: 84,
    retireRef: 80_000_000,
    retireAge: 65,
    defaultSalary: 280_000,
    defaultLiving: 100_000,
    defaultTransport: 20_000,
    defaultOther: 30_000,
    defaultNeeds: [80_000, 15_000, 20_000, 25_000, 10_000],
    salaryMax: 1_500_000,
    livingMax: 500_000,
    transportMax: 150_000,
    otherMax: 200_000,
    needsMax: [500_000, 150_000, 150_000, 250_000, 100_000],
    taxRate: 20,
    interestRate: 0.5,
    marketNote: {
      en: "Long deflation memory. NISA offers tax-free investing. Very low rates.",
      th: "ประสบการณ์เงินฝืดยาว NISA ลงทุนฟรีภาษี ดอกเบี้ยต่ำมาก",
      zh: "长期通缩记忆。NISA提供免税投资。利率极低。",
    },
  },
  eu: {
    flag: "🇪🇺",
    name: "Europe",
    currency: "€",
    lifeExp: 82,
    retireRef: 800_000,
    retireAge: 65,
    defaultSalary: 3_500,
    defaultLiving: 1_200,
    defaultTransport: 200,
    defaultOther: 300,
    defaultNeeds: [1_000, 200, 200, 300, 100],
    salaryMax: 15_000,
    livingMax: 5_000,
    transportMax: 1_500,
    otherMax: 2_000,
    needsMax: [5_000, 1_500, 1_500, 3_000, 1_500],
    taxRate: 30,
    interestRate: 3.0,
    marketNote: {
      en: "Strong social safety nets. Diverse markets: DAX, CAC, FTSE. ECB policy matters.",
      th: "ระบบสวัสดิการแข็งแกร่ง ตลาดหลากหลาย: DAX CAC FTSE นโยบาย ECB สำคัญ",
      zh: "社会安全网强。市场多元：DAX、CAC、FTSE。欧央行政策关键。",
    },
  },
  cn: {
    flag: "🇨🇳",
    name: "China",
    currency: "¥",
    lifeExp: 78,
    retireRef: 6_000_000,
    retireAge: 60,
    defaultSalary: 15_000,
    defaultLiving: 4_000,
    defaultTransport: 800,
    defaultOther: 1_200,
    defaultNeeds: [3_000, 600, 600, 700, 300],
    salaryMax: 100_000,
    livingMax: 50_000,
    transportMax: 10_000,
    otherMax: 20_000,
    needsMax: [30_000, 8_000, 8_000, 15_000, 8_000],
    taxRate: 25,
    interestRate: 2.5,
    marketNote: {
      en: "Rapidly maturing markets. Property is cultural store of value. Pension system evolving.",
      th: "ตลาดโตเร็ว อสังหาฯ เป็นที่เก็บมูลค่า ระบบบำนาญกำลังพัฒนา",
      zh: "市场快速成熟。房产是文化价值储存。养老金制度正在演变。",
    },
  },
  kr: {
    flag: "🇰🇷",
    name: "Korea",
    currency: "₩",
    lifeExp: 83,
    retireRef: 1_500_000_000,
    retireAge: 63,
    defaultSalary: 3_500_000,
    defaultLiving: 1_000_000,
    defaultTransport: 300_000,
    defaultOther: 300_000,
    defaultNeeds: [800_000, 200_000, 200_000, 250_000, 100_000],
    salaryMax: 15_000_000,
    livingMax: 5_000_000,
    transportMax: 1_500_000,
    otherMax: 2_000_000,
    needsMax: [5_000_000, 1_500_000, 1_500_000, 2_500_000, 1_500_000],
    taxRate: 24,
    interestRate: 3.5,
    marketNote: {
      en: "High household debt, but KOSPI is tech-heavy. Jeonse system is unique.",
      th: "หนี้ครัวเรือนสูง แต่ KOSPI เน้นเทคโนโลยี ระบบ Jeonse เป็นเอกลักษณ์",
      zh: "家庭债务高，但KOSPI科技股集中。全租制度独特。",
    },
  },
};

export interface InvestStyle {
  key: StyleKey;
  icon: string;
  label: Record<Lang, string>;
  desc: Record<Lang, string>;
  ret: number;
  risk: string;
  color: string;
}

export const INVEST: InvestStyle[] = [
  {
    key: "money",
    icon: "💵",
    ret: 0.04,
    risk: "LOW",
    color: "#00ff88",
    label: { en: "Money Market", th: "ตลาดเงิน", zh: "货币市场" },
    desc: {
      en: "Savings, fixed deposits, government bonds. Sleep-well money.",
      th: "ออมทรัพย์ ฝากประจำ พันธบัตรรัฐ เงินที่นอนหลับสบาย",
      zh: "储蓄、定存、国债。让人安睡的钱。",
    },
  },
  {
    key: "balanced",
    icon: "⚖️",
    ret: 0.07,
    risk: "MEDIUM",
    color: "#00b4ff",
    label: { en: "Capital · Balanced", th: "ตลาดทุน · สมดุล", zh: "资本市场·均衡" },
    desc: {
      en: "Mutual funds + bonds. The rational choice for most people.",
      th: "กองทุนรวม + พันธบัตร ทางเลือกสมเหตุสมผลของคนส่วนใหญ่",
      zh: "公募基金+债券。大多数人的理性选择。",
    },
  },
  {
    key: "growth",
    icon: "🌱",
    ret: 0.1,
    risk: "HIGH",
    color: "#ffd60a",
    label: { en: "Capital · Growth", th: "ตลาดทุน · เติบโต", zh: "资本市场·成长" },
    desc: {
      en: "Equities + ESG funds + RMF. Long horizon, stomach required.",
      th: "หุ้น + กองทุน ESG + RMF ระยะยาว ต้องใจแข็ง",
      zh: "股票+ESG基金+RMF。长期持有，需要定力。",
    },
  },
  {
    key: "people",
    icon: "🫂",
    ret: 0.15,
    risk: "VARIABLE",
    color: "#7c84ff",
    label: { en: "Invest in People", th: "ลงทุนในคน", zh: "投资于人" },
    desc: {
      en: "Micro-lending, private equity, backing skilled people. ฿10K to a barista can return in 2 weeks.",
      th: "ปล่อยกู้ย่อย หุ้นส่วน สนับสนุนคนมีฝีมือ 10K ให้บาริสต้า คืนใน 2 สัปดาห์",
      zh: "小额贷款、私募、支持有技能的人。1万铢借给咖啡师两周可回本。",
    },
  },
  {
    key: "derivatives",
    icon: "⚡",
    ret: 0.18,
    risk: "EXTREME",
    color: "#ff2d55",
    label: { en: "Derivatives", th: "อนุพันธ์", zh: "衍生品" },
    desc: {
      en: "Leverage, options, futures. 90% of retail traders lose. Study 12+ months first.",
      th: "เลเวอเรจ ออปชัน ฟิวเจอร์ส 90% รายย่อยขาดทุน ศึกษา 12+ เดือนก่อน",
      zh: "杠杆、期权、期货。90%散户亏损。先学至少12个月。",
    },
  },
];

export const MASLOW = [
  {
    id: 1,
    icon: "🏠",
    color: "#00ff88",
    label: { en: "Shelter & Food", th: "ที่พักและอาหาร", zh: "住房与饮食" },
    desc: {
      en: "Rent, mortgage, food, utilities, clothing",
      th: "ค่าเช่า/ผ่อน อาหาร สาธารณูปโภค เสื้อผ้า",
      zh: "房租/房贷、饮食、水电、服装",
    },
  },
  {
    id: 2,
    icon: "🛡️",
    color: "#00b4ff",
    label: { en: "Safety & Health", th: "สุขภาพและความปลอดภัย", zh: "健康与安全" },
    desc: {
      en: "Health insurance, emergency fund, life cover",
      th: "ประกันสุขภาพ กองทุนฉุกเฉิน ประกันชีวิต",
      zh: "医疗保险、应急储备、人寿保险",
    },
  },
  {
    id: 3,
    icon: "🤝",
    color: "#ffd60a",
    label: { en: "Connection & Travel", th: "การเชื่อมต่อและเดินทาง", zh: "社交与出行" },
    desc: {
      en: "Transport, phone, family, social life",
      th: "ค่าเดินทาง โทรศัพท์ ครอบครัว สังคม",
      zh: "交通、通讯、家庭、社交",
    },
  },
  {
    id: 4,
    icon: "✨",
    color: "#ff9f0a",
    label: { en: "Growth & Experiences", th: "การเติบโตและประสบการณ์", zh: "成长与体验" },
    desc: {
      en: "Travel, learning, hobbies, culture",
      th: "ท่องเที่ยว เรียนรู้ งานอดิเรก วัฒนธรรม",
      zh: "旅行、学习、爱好、文化",
    },
  },
  {
    id: 5,
    icon: "🌟",
    color: "#ff9500",
    label: { en: "Purpose & Legacy", th: "จุดมุ่งหมายและมรดก", zh: "使命与传承" },
    desc: {
      en: "Charity, mentorship, creative work, giving back",
      th: "การกุศล การสอน งานสร้างสรรค์ ส่งต่อ",
      zh: "慈善、传授、创意、回馈社会",
    },
  },
] as const;

export const CYCLES = [
  { start: 2026, end: 2028, type: "contraction" as CycleType, label: "Contraction" },
  { start: 2028, end: 2033, type: "recovery" as CycleType, label: "Recovery" },
  { start: 2033, end: 2038, type: "expansion" as CycleType, label: "Expansion" },
  { start: 2038, end: 2044, type: "late" as CycleType, label: "Late Cycle" },
  { start: 2044, end: 2050, type: "contraction" as CycleType, label: "Contraction" },
  { start: 2050, end: 2055, type: "recovery" as CycleType, label: "Recovery" },
  { start: 2055, end: 2062, type: "expansion" as CycleType, label: "Expansion" },
];

export const CYCLE_C: Record<CycleType, { bg: string; text: string }> = {
  contraction: { bg: "rgba(255,45,85,0.22)", text: "#ff2d55" },
  recovery: { bg: "rgba(255,214,10,0.20)", text: "#ffd60a" },
  expansion: { bg: "rgba(0,255,136,0.22)", text: "#00ff88" },
  late: { bg: "rgba(255,149,0,0.18)", text: "#ff9500" },
};

/* ══════════════════════════════════════════════════════════════════════════════
   CIVILIZATION SPIRAL  (computed once at module load)
   ══════════════════════════════════════════════════════════════════════════════ */

function prosperity(year: number): number {
  const k = Math.sin(((year - 1815) / 55) * 2 * Math.PI) * 0.35;
  const ku = Math.sin(((year - 1800) / 20) * 2 * Math.PI) * 0.2;
  const j = Math.sin(((year - 1800) / 9) * 2 * Math.PI) * 0.15;
  let p = k + ku + j;
  const shocks: [number, number, number][] = [
    [1350, 12, -0.8],
    [1619, 25, -0.45],
    [1720, 6, -0.5],
    [1789, 12, -0.4],
    [1873, 22, -0.45],
    [1929, 16, -0.9],
    [1950, 25, 0.6],
    [1973, 8, -0.4],
    [1982, 18, 0.5],
    [2000, 4, -0.4],
    [2008, 5, -0.65],
    [2020, 2, -0.5],
    [2022, 2, 0.35],
  ];
  for (const [y, dur, d] of shocks) {
    const dist = Math.abs(year - y);
    if (dist < dur) p += (1 - dist / dur) * d;
  }
  return Math.max(-1, Math.min(1, p));
}

export interface SPt {
  x: number;
  y: number;
  year: number;
}

export const SPIRAL_PTS: SPt[] = (() => {
  const cx = 250,
    cy = 250,
    rMin = 18,
    rMax = 218;
  const ys = -1000,
    ye = 2026,
    yr = ye - ys;
  const pts: SPt[] = [];
  for (let y = ys; y <= ye; y += 4) {
    const t = (y - ys) / yr;
    const angle = (t * (yr / 55)) * 2 * Math.PI - Math.PI / 2;
    const r = rMin + t * (rMax - rMin) + prosperity(y) * 7;
    pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), year: y });
  }
  return pts;
})();

export const SPIRAL_D = SPIRAL_PTS.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

export function ptAt(year: number): SPt {
  return SPIRAL_PTS.reduce((a, b) => (Math.abs(b.year - year) < Math.abs(a.year - year) ? b : a));
}

export const EVENTS = [
  { year: 100, label: "Rome Peak", crisis: false, now: false },
  { year: 1350, label: "Black Death", crisis: true, now: false },
  { year: 1760, label: "Ind. Rev.", crisis: false, now: false },
  { year: 1929, label: "Depression", crisis: true, now: false },
  { year: 1950, label: "Post-War Boom", crisis: false, now: false },
  { year: 2008, label: "GFC", crisis: true, now: false },
  { year: 2026, label: "NOW", crisis: false, now: true },
];

/* ══════════════════════════════════════════════════════════════════════════════
   MATH HELPERS
   ══════════════════════════════════════════════════════════════════════════════ */

export function pureSavings(monthly: number, growth: number, years: number): number {
  if (years <= 0 || monthly <= 0) return 0;
  let total = 0,
    m = monthly;
  for (let y = 0; y < years; y++) {
    total += m * 12;
    m *= 1 + growth;
  }
  return total;
}

export function investAccum(monthly: number, growth: number, rate: number, years: number): number {
  if (years <= 0 || monthly <= 0) return 0;
  let port = 0,
    m = monthly;
  const mr = rate / 12;
  for (let y = 0; y < years; y++) {
    for (let mo = 0; mo < 12; mo++) port = port * (1 + mr) + m;
    m *= 1 + growth;
  }
  return port;
}

export function savSnaps(monthly: number, growth: number, years: number): number[] {
  const s = [0];
  let total = 0,
    m = monthly;
  for (let y = 0; y < years; y++) {
    total += m * 12;
    m *= 1 + growth;
    s.push(total);
  }
  return s;
}

export function invSnaps(monthly: number, growth: number, rate: number, years: number): number[] {
  const s = [0];
  let port = 0,
    m = monthly;
  const mr = rate / 12;
  for (let y = 0; y < years; y++) {
    for (let mo = 0; mo < 12; mo++) port = port * (1 + mr) + m;
    m *= 1 + growth;
    s.push(port);
  }
  return s;
}

export function fmtC(v: number, geo: GeoKey, short = true): string {
  const sym = GEOS[geo].currency,
    abs = Math.abs(v),
    sign = v < 0 ? "-" : "";
  if (!short) return `${sign}${sym}${Math.round(abs).toLocaleString()}`;
  if (abs >= 1_000_000_000) return `${sign}${sym}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${sym}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${sym}${Math.round(abs).toLocaleString()}`;
}

/* ══════════════════════════════════════════════════════════════════════════════
   COPY  —  section headlines & body text per language
   ══════════════════════════════════════════════════════════════════════════════ */

export const COPY = {
  hero: {
    en: {
      overline: "THE WEALTH JOURNEY",
      h1: "Every civilization has cycled through boom and collapse.",
      body: "The pattern is remarkably consistent. You were born into one of those cycles — and your retirement will be shaped by the ones still to come. Let's find your place on the spiral.",
      cta: "BEGIN YOUR JOURNEY",
      stage: "CURRENT POSITION · MAY 2026",
      stageSub: "Stage 5 of 6 · Fragility & Conflict",
      stageBody: 'Dalio: "What is happening now is more analogous to pre-1945 than post-1945. The cycle rhymes every time."',
    },
    th: {
      overline: "เส้นทางสู่ความมั่งคั่ง",
      h1: "ทุกอารยธรรมผ่านรอบขึ้น-ลงมาแล้ว",
      body: "รูปแบบนี้สม่ำเสมออย่างน่าทึ่ง คุณเกิดมาในวัฏจักรหนึ่ง และการเกษียณของคุณจะถูกกำหนดโดยวัฏจักรที่ยังจะมาถึง มาหาตำแหน่งของคุณบนวงก้นหอย",
      cta: "เริ่มเส้นทางของคุณ",
      stage: "ตำแหน่งปัจจุบัน · พฤษภาคม 2026",
      stageSub: "ขั้นที่ 5 จาก 6 · ความเปราะบางและความขัดแย้ง",
      stageBody: 'Dalio: "สิ่งที่เกิดขึ้นตอนนี้คล้ายช่วงก่อนปี 1945 มากกว่าหลังปี 1945 วัฏจักรนี้ซ้ำทุกครั้ง"',
    },
    zh: {
      overline: "财富之旅",
      h1: "每个文明都经历过繁荣与衰落的循环。",
      body: "这个模式出奇地一致。你生于其中一个周期——而你的退休将被即将到来的周期所塑造。让我们在螺旋上找到你的位置。",
      cta: "开始你的旅程",
      stage: "当前位置 · 2026年5月",
      stageSub: "第5阶段（共6阶段）· 脆弱期与冲突期",
      stageBody: '达利欧：「现在发生的事情更像1945年之前，而非之后。周期每次都惊人地相似。」',
    },
  },
  time: {
    en: {
      overline: "YOUR TIMELINE",
      h2: "Where do you sit on that spiral?",
      body: "Your age determines how many cycles you'll still live through. Let's place you on the map.",
      yourAge: "YOUR AGE",
      retireAt: "RETIRE AT",
      geoLabel: "YOUR GEOGRAPHY",
      left: (n: number, y: number) => `${n} years left · retiring in ${y}`,
      cycleNote: (u: number, d: number) =>
        `Based on Dalio + Benner cycles: ~${u} expansion${u !== 1 ? "s" : ""} and ${d} contraction${d !== 1 ? "s" : ""} ahead. Plan for both.`,
      forecastLabel: "ECONOMIC FORECAST FOR YOUR WORKING YEARS",
      taxLabel: "Marginal tax",
      rateLabel: "Risk-free rate",
    },
    th: {
      overline: "ไทม์ไลน์ของคุณ",
      h2: "คุณอยู่ที่ไหนในวงก้นหอย?",
      body: "อายุของคุณกำหนดว่าจะผ่านกี่วัฏจักร มาหาตำแหน่งของคุณบนแผนที่",
      yourAge: "อายุของคุณ",
      retireAt: "เกษียณที่อายุ",
      geoLabel: "ภูมิภาคของคุณ",
      left: (n: number, y: number) => `เหลือ ${n} ปี · เกษียณปี ${y}`,
      cycleNote: (u: number, d: number) =>
        `จากวัฏจักร Dalio + Benner: ขยายตัว ~${u} ครั้ง หดตัว ${d} ครั้ง วางแผนสำหรับทั้งสองอย่าง`,
      forecastLabel: "การพยากรณ์เศรษฐกิจในช่วงทำงานของคุณ",
      taxLabel: "ภาษีขั้นบันได",
      rateLabel: "อัตราปราศจากความเสี่ยง",
    },
    zh: {
      overline: "你的时间线",
      h2: "你在螺旋上的哪个位置？",
      body: "你的年龄决定了还会经历多少个周期。让我们在地图上找到你。",
      yourAge: "你的年龄",
      retireAt: "退休年龄",
      geoLabel: "你的地区",
      left: (n: number, y: number) => `还有 ${n} 年 · ${y}年退休`,
      cycleNote: (u: number, d: number) => `基于达利欧+本纳周期：约${u}次扩张和${d}次收缩。为两者做准备。`,
      forecastLabel: "你工作年限的经济预测",
      taxLabel: "边际税率",
      rateLabel: "无风险利率",
    },
  },
  needs: {
    en: {
      overline: "WHAT YOU NEED",
      h2: "What does your ideal retirement look like?",
      body: "Build your pyramid. Each layer you add reveals the true cost of freedom — your Ikigai Number.",
      monthly: "MONTHLY IN RETIREMENT",
      ikigaiLabel: "YOUR IKIGAI NUMBER",
      ref: (g: GeoConfig) => `Reference: most people in ${g.name} target around ${fmtC(g.retireRef, "th")}`,
      yearsLabel: (y: number) => `${y} years of retirement`,
    },
    th: {
      overline: "สิ่งที่คุณต้องการ",
      h2: "การเกษียณในอุดมคติของคุณเป็นอย่างไร?",
      body: "สร้างพีระมิดของคุณ แต่ละชั้นจะเผยต้นทุนของอิสรภาพ — ตัวเลข Ikigai",
      monthly: "รายจ่ายต่อเดือนยามเกษียณ",
      ikigaiLabel: "ตัวเลข IKIGAI ของคุณ",
      ref: (g: GeoConfig) => `อ้างอิง: คนส่วนใหญ่ใน${g.name}ต้องการประมาณ ${fmtC(g.retireRef, "th")}`,
      yearsLabel: (y: number) => `เกษียณ ${y} ปี`,
    },
    zh: {
      overline: "你需要什么",
      h2: "你理想的退休生活是什么样的？",
      body: "建造你的金字塔。每添加一层，就揭示了自由的真正成本——你的IKIGAI数字。",
      monthly: "退休后月支出",
      ikigaiLabel: "你的IKIGAI数字",
      ref: (g: GeoConfig) => `参考：${g.name}大多数人目标约${fmtC(g.retireRef, "th")}`,
      yearsLabel: (y: number) => `${y}年退休生活`,
    },
  },
  salary: {
    en: {
      overline: "WHAT YOU HAVE",
      h2: "What does your working life produce?",
      body: "Enter your income and expenses. We'll show what savings alone gets you — and whether that's enough.",
      income: "MONTHLY INCOME",
      growth: "ANNUAL SALARY GROWTH",
      livingL: "LIVING — food, rent, utilities",
      transportL: "TRANSPORT",
      otherL: "EVERYTHING ELSE",
      investL: "FREE TO INVEST / MONTH",
      savLabel: "IF YOU ONLY SAVE",
      noInv: "Nothing left to invest. Reduce expenses or raise income.",
      shortBy: (v: string) => `You're short by ${v}`,
      surplus: (v: string) => `You'd have ${v} extra`,
    },
    th: {
      overline: "สิ่งที่คุณมี",
      h2: "ชีวิตการทำงานของคุณให้อะไรบ้าง?",
      body: "ใส่รายได้และค่าใช้จ่าย เราจะแสดงให้เห็นว่าถ้าออมอย่างเดียวจะได้เท่าไหร่",
      income: "รายได้ต่อเดือน",
      growth: "การเพิ่มเงินเดือนต่อปี",
      livingL: "ค่าครองชีพ — อาหาร เช่า สาธารณูปโภค",
      transportL: "ค่าเดินทาง",
      otherL: "ค่าใช้จ่ายอื่นๆ",
      investL: "ลงทุนได้ต่อเดือน",
      savLabel: "ถ้าออมอย่างเดียว",
      noInv: "ไม่มีเงินลงทุน ลดค่าใช้จ่ายหรือเพิ่มรายได้",
      shortBy: (v: string) => `ขาดอีก ${v}`,
      surplus: (v: string) => `เหลือ ${v}`,
    },
    zh: {
      overline: "你拥有什么",
      h2: "你的职业生涯能产生多少？",
      body: "输入你的收入和支出。我们将展示仅靠储蓄到退休时能积累多少。",
      income: "月收入",
      growth: "年薪增长率",
      livingL: "生活开销 — 饮食、住房、水电",
      transportL: "交通",
      otherL: "其他一切",
      investL: "每月可投资金额",
      savLabel: "仅靠储蓄",
      noInv: "没有可投资余额。减少支出或增加收入。",
      shortBy: (v: string) => `还差 ${v}`,
      surplus: (v: string) => `多出 ${v}`,
    },
  },
  gap: {
    en: {
      overline: "CLOSE THE GAP",
      h2: "Here is the gap.",
      body: "Saving alone rarely gets you there. The shortfall is what investment is designed to fill. Choose your path.",
      savL: "SAVINGS ALONE",
      tgtL: "YOUR TARGET",
      gapL: "GAP",
      how: "HOW WOULD YOU CLOSE IT?",
      pick: "Select a strategy to see your projection →",
      noInv: "← Go back and create some investable income first.",
    },
    th: {
      overline: "เติมช่องว่าง",
      h2: "นี่คือช่องว่าง",
      body: "การออมอย่างเดียวแทบไม่เคยพอ ช่องว่างนี้คือสิ่งที่การลงทุนถูกออกแบบมาเพื่อเติมเต็ม",
      savL: "ออมอย่างเดียว",
      tgtL: "เป้าหมายของคุณ",
      gapL: "ช่องว่าง",
      how: "จะเติมมันอย่างไร?",
      pick: "เลือกกลยุทธ์เพื่อดูการประมาณการ →",
      noInv: "← กลับไปสร้างรายได้ที่ลงทุนได้ก่อน",
    },
    zh: {
      overline: "填补缺口",
      h2: "这就是缺口。",
      body: "单靠储蓄几乎永远不够。这个缺口正是投资设计来填补的。选择你的道路。",
      savL: "仅靠储蓄",
      tgtL: "你的目标",
      gapL: "缺口",
      how: "你如何填补它？",
      pick: "选择策略以查看预测 →",
      noInv: "← 返回先创造一些可投资收入。",
    },
  },
  scenario: {
    en: {
      overline: "YOUR SCENARIO",
      h2: "Your path, visualized.",
      body: "Three lines. One story. The dashed line is your target. See where compounding takes you.",
      savL: "Savings only",
      targetL: "Target",
      readL: "RETIREMENT READINESS",
      projL: "PROJECTED",
      tgtL: "TARGET",
      crossL: (n: number) => `✓ target reached in ${n} yrs`,
      warning:
        "2026–2028: hold defensive. 2028–2033: deploy when others fear. 2033+: compound through the new cycle. Stay invested through contractions — do not sell.",
      noStyle: "← Select an investment strategy above to see your scenario",
      actL: "YOUR NEXT 3 MOVES",
      restart: "START AGAIN",
      disc: "Pre-tax · Nominal values · No inflation adjustment · Past returns ≠ future results · Educational only.",
    },
    th: {
      overline: "สถานการณ์ของคุณ",
      h2: "เส้นทางของคุณ ในรูปภาพ",
      body: "สามเส้น หนึ่งเรื่องราว เส้นประคือเป้าหมาย ดูว่าการทบต้นพาคุณไปสู่ที่ไหน",
      savL: "ออมอย่างเดียว",
      targetL: "เป้าหมาย",
      readL: "ความพร้อมเกษียณ",
      projL: "การประมาณการ",
      tgtL: "เป้าหมาย",
      crossL: (n: number) => `✓ ถึงเป้าใน ${n} ปี`,
      warning:
        "2026–2028: ถือตำแหน่งป้องกัน · 2028–2033: ลงทุนตอนคนอื่นกลัว · 2033+: ทบต้นในวัฏจักรใหม่ ยังคงลงทุน — อย่าขาย",
      noStyle: "← เลือกกลยุทธ์การลงทุนด้านบนเพื่อดูสถานการณ์",
      actL: "3 สิ่งที่ต้องทำต่อไป",
      restart: "เริ่มใหม่",
      disc: "ก่อนภาษี · ค่าที่ไม่ปรับเงินเฟ้อ · ผลตอบแทนในอดีตไม่รับประกันอนาคต · เพื่อการศึกษาเท่านั้น",
    },
    zh: {
      overline: "你的情景",
      h2: "你的道路，可视化。",
      body: "三条线，一个故事。虚线是你的目标。看看复利会带你到哪里。",
      savL: "仅储蓄",
      targetL: "目标",
      readL: "退休准备度",
      projL: "预测",
      tgtL: "目标",
      crossL: (n: number) => `✓ ${n}年后达标`,
      warning:
        "2026–2028：保持防御仓位 · 2028–2033：在他人恐惧时布局 · 2033+：在新周期中复利增长。坚持投资，不要卖出。",
      noStyle: "← 在上面选择投资策略以查看你的情景",
      actL: "你的下3步",
      restart: "重新开始",
      disc: "税前 · 名义值 · 不含通货膨胀调整 · 历史收益不代表未来 · 仅供教育参考。",
    },
  },
} as const;

export const ACTIONS: Record<StyleKey, Record<Lang, string[]>> = {
  money: {
    en: [
      "Open a fixed deposit or T-bill account. Build 6 months emergency fund first.",
      "Set up auto-transfer on salary day — invest before you spend it.",
      "Review every 12 months. Rebalance. Then forget it.",
    ],
    th: [
      "เปิดบัญชีฝากประจำหรือพันธบัตร สร้างกองทุนฉุกเฉิน 6 เดือนก่อน",
      "ตั้งระบบโอนอัตโนมัติวันที่ได้เงินเดือน ลงทุนก่อนใช้จ่าย",
      "ทบทวนทุก 12 เดือน ปรับสมดุล แล้วลืมมัน",
    ],
    zh: [
      "开定期存款或国债账户。先建6个月应急储备。",
      "在发薪日设置自动转账——在花掉之前先投资。",
      "每12个月审视一次。再平衡。然后忘掉它。",
    ],
  },
  balanced: {
    en: [
      "Open a mutual fund account. Start at minimum amount.",
      "Auto-invest monthly. Never pause during market drops — that is when you buy cheap.",
      "Review allocation annually. Do not check daily prices.",
    ],
    th: [
      "เปิดบัญชีกองทุนรวม เริ่มที่จำนวนขั้นต่ำ",
      "ลงทุนอัตโนมัติทุกเดือน อย่าหยุดตอนตลาดร่วง นั่นคือตอนที่คุณซื้อถูก",
      "ทบทวนการจัดสรรทุกปี อย่าเช็คราคาทุกวัน",
    ],
    zh: [
      "开公募基金账户（先投最低金额）。",
      "每月自动投资。市场下跌时不要停——那是你低价买入的时机。",
      "每年审视配置。不要每天查价格。",
    ],
  },
  growth: {
    en: [
      "Open a brokerage account. Buy a broad market ETF as your first position.",
      "Add ESG + RMF for tax efficiency. Target 10–15% of income monthly.",
      "Think in decades. Every bear market is a buying opportunity.",
    ],
    th: [
      "เปิดบัญชีหุ้น ซื้อ ETF ตลาดกว้างเป็นตำแหน่งแรก",
      "เพิ่ม ESG + RMF เพื่อประสิทธิภาพทางภาษี ตั้งเป้า 10–15% ของรายได้ต่อเดือน",
      "คิดเป็นทศวรรษ ทุกตลาดหมีคือโอกาสซื้อ",
    ],
    zh: [
      "开证券账户。买入宽基ETF作为第一笔仓位。",
      "加入ESG+RMF以提高税务效率。目标每月投入收入的10-15%。",
      "以十年为单位思考。每次熊市都是买入机会。",
    ],
  },
  people: {
    en: [
      "Start small: lend to someone with a proven skill. Document everything.",
      "Agree terms before. 2–4 week turnaround at 15–25% annual return.",
      "Reinvest returns. Scale only what works. Exit cleanly what doesn't.",
    ],
    th: [
      "เริ่มเล็ก: ให้กู้คนที่มีทักษะพิสูจน์แล้ว บันทึกทุกอย่าง",
      "ตกลงเงื่อนไขก่อน 2–4 สัปดาห์ ผลตอบแทน 15–25% ต่อปี",
      "นำผลตอบแทนมาลงทุนซ้ำ ขยายเฉพาะสิ่งที่ได้ผล ออกจากสิ่งที่ไม่ได้อย่างสะอาด",
    ],
    zh: [
      "从小处开始：借给有技能的人。记录一切。",
      "事先约定条款。2-4周周转，年化15-25%。",
      "将回报再投资。只扩大有效的。干净退出无效的。",
    ],
  },
  derivatives: {
    en: [
      "Study options and futures for at least 12 months before your first live trade.",
      "Paper-trade first. If you cannot profit in simulation, do not risk real capital.",
      "Maximum 5% of portfolio in derivatives. Define your maximum loss before every position.",
    ],
    th: [
      "ศึกษา Options และ Futures อย่างน้อย 12 เดือนก่อนเทรดจริงครั้งแรก",
      "ทดลอง Paper Trade ก่อน ถ้าทำกำไรใน simulation ไม่ได้ อย่าเสี่ยงเงินจริง",
      "สูงสุด 5% ของพอร์ตในอนุพันธ์ กำหนดการขาดทุนสูงสุดก่อนเข้าทุกตำแหน่ง",
    ],
    zh: [
      "在第一笔实盘交易前，至少学习期权和期货12个月。",
      "先进行模拟交易。如果在模拟中无法盈利，不要冒险用真钱。",
      "衍生品最多占投资组合的5%。每次入仓前先确定最大亏损额度。",
    ],
  },
};

/* ══════════════════════════════════════════════════════════════════════════════
   DALIO CYCLE MATH  (ported from legacy plan page v1)
   ══════════════════════════════════════════════════════════════════════════════ */

export interface CyclePhase {
  stage: number;
  label: string;
  meanRate: number;
}

export function cycleStageForOffset(yearOffset: number): CyclePhase {
  if (yearOffset <= 2)  return { stage: 5, label: "FRAG",   meanRate:  0.01 };
  if (yearOffset <= 4)  return { stage: 6, label: "RESET",  meanRate: -0.05 };
  if (yearOffset <= 8)  return { stage: 1, label: "RISE",   meanRate:  0.15 };
  if (yearOffset <= 16) return { stage: 2, label: "BUBBLE", meanRate:  0.11 };
  if (yearOffset <= 19) return { stage: 3, label: "PEAK",   meanRate:  0.10 };
  if (yearOffset <= 24) return { stage: 4, label: "UNWIND", meanRate:  0.02 };
  return cycleStageForOffset(yearOffset - 25);
}

const MM_BETA = 0.3;
const CM_BETA = 1.0;
const DV_BETA = 2.5;

export interface Allocation { mm: number; cm: number; dv: number }

export function portfolioRateForCycle(cycleRate: number, a: Allocation): number {
  const mmRet = 0.04 + MM_BETA * (cycleRate - 0.07);
  const cmRet = CM_BETA * cycleRate;
  const dvRet = DV_BETA * cycleRate;
  return (a.mm / 100) * mmRet + (a.cm / 100) * cmRet + (a.dv / 100) * dvRet;
}

export interface YearPoint {
  year: number;
  value: number;
  phase: string;
  yearRate: number;
}

export function projectWithCycle(
  monthly: number,
  alloc: Allocation,
  years: number,
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
    out.push({ year: 2026 + y, value, phase: stage.label, yearRate: rate });
  }
  return out;
}

// Map investment style to implied allocation for cycle projection
export function styleToAllocation(key: StyleKey): Allocation {
  switch (key) {
    case "money":       return { mm: 100, cm: 0,  dv: 0 };
    case "balanced":    return { mm: 40,  cm: 55, dv: 5 };
    case "growth":      return { mm: 10,  cm: 75, dv: 15 };
    case "people":      return { mm: 0,   cm: 50, dv: 50 };
    case "derivatives": return { mm: 0,   cm: 20, dv: 80 };
  }
}

export function projectWithCycleV2(
  monthly: number,
  growth: number,
  styleKey: StyleKey,
  years: number,
): YearPoint[] {
  const alloc = styleToAllocation(styleKey);
  // Apply salary growth to monthly contribution
  let m = monthly;
  const out: YearPoint[] = [];
  let value = 0;
  for (let y = 0; y < years; y++) {
    const stage = cycleStageForOffset(y);
    const rate = portfolioRateForCycle(stage.meanRate, alloc);
    const mRate = rate / 12;
    const yrContrib = Math.abs(mRate) < 1e-9
      ? m * 12
      : m * ((Math.pow(1 + mRate, 12) - 1) / mRate);
    value = value * (1 + rate) + yrContrib;
    out.push({ year: 2026 + y, value, phase: stage.label, yearRate: rate });
    m *= 1 + growth;
  }
  return out;
}

/* ─── 4-bucket cycle projection (active model) ──────────────────────────────────
   Adds a SAVING bucket (bank/cash, beta 0) to the 3-bucket model above.
   The Dalio cycle (cycleStageForOffset) drives capital-market and derivative
   returns; saving + money-market are mostly cycle-insensitive. This is the
   engine the live /plan page rides — the forecast chart shows the same rates.   */

export interface Allocation4 { saving: number; mm: number; cm: number; dv: number } // sum 100

const SAVING_RATE = 0.01; // bank/cash — beta 0, ignores the cycle

export function portfolioRate4(cycleRate: number, a: Allocation4): number {
  const saveRet = SAVING_RATE;
  const mmRet   = 0.04 + MM_BETA * (cycleRate - 0.07); // money market — light cycle tilt
  const cmRet   = CM_BETA * cycleRate;                 // capital market — rides the cycle
  const dvRet   = DV_BETA * cycleRate;                 // derivatives — amplified
  return (a.saving / 100) * saveRet
       + (a.mm     / 100) * mmRet
       + (a.cm     / 100) * cmRet
       + (a.dv     / 100) * dvRet;
}

// Year-by-year accumulation with salary growth. Final value = last element.
export function projectWithCycle4(
  monthly: number,
  growth:  number,
  alloc:   Allocation4,
  years:   number,
): YearPoint[] {
  if (years <= 0 || monthly <= 0) return [];
  const out: YearPoint[] = [];
  let value = 0;
  let m = monthly;
  for (let y = 0; y < years; y++) {
    const stage = cycleStageForOffset(y);
    const rate  = portfolioRate4(stage.meanRate, alloc);
    const mRate = rate / 12;
    const yrContrib = Math.abs(mRate) < 1e-9
      ? m * 12
      : m * ((Math.pow(1 + mRate, 12) - 1) / mRate);
    value = value * (1 + rate) + yrContrib;
    out.push({ year: 2026 + y, value, phase: stage.label, yearRate: rate });
    m *= 1 + growth;
  }
  return out;
}
