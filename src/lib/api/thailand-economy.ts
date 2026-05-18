/**
 * Thailand Economy — comprehensive data layer
 *
 * Sources:
 *   - World Bank Open Data API (no key) — GDP series, sector value-added
 *   - Tourism Authority of Thailand (curated)
 *   - Ministry of Tourism & Sports (curated)
 *   - Bank of Thailand (existing integration)
 *   - International Trade Centre (curated rankings)
 *
 * Strategy: World Bank gives us long historical series; sector + global
 * ranking data is curated from published official sources (refreshed
 * during data ingestion).
 */

const WB = "https://api.worldbank.org/v2/country/TH/indicator";

// ─── World Bank historical series ──────────────────────────────────

export interface GdpPoint {
  year: number;
  growthPct: number | null;     // annual GDP growth %
  gdpUsd?: number | null;       // GDP in current USD
}

async function fetchSeries(indicator: string, fromYear = 1980): Promise<{ year: number; value: number | null }[]> {
  try {
    const currentYear = new Date().getFullYear();
    const url = `${WB}/${indicator}?format=json&date=${fromYear}:${currentYear}&per_page=80`;
    const res = await fetch(url, { next: { revalidate: 86400 * 7 } });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = json?.[1] ?? [];
    return rows
      .map((r: { date: string; value: number | null }) => ({
        year: parseInt(r.date),
        value: r.value,
      }))
      .filter((r: { year: number }) => !isNaN(r.year))
      .sort((a: { year: number }, b: { year: number }) => a.year - b.year);
  } catch {
    return [];
  }
}

export async function fetchThaiGdpHistory(fromYear = 1980): Promise<GdpPoint[]> {
  const [growth, gdp] = await Promise.all([
    fetchSeries("NY.GDP.MKTP.KD.ZG", fromYear),  // annual growth %
    fetchSeries("NY.GDP.MKTP.CD",     fromYear),  // current USD
  ]);
  const gdpByYear = new Map(gdp.map(p => [p.year, p.value]));
  return growth.map(g => ({
    year: g.year,
    growthPct: g.value,
    gdpUsd: gdpByYear.get(g.year) ?? null,
  }));
}

// ─── Curated Thailand economic profile ─────────────────────────────
// Numbers as of 2023-2024 from BoT, Ministry of Tourism, NSO, World Bank.
// Refresh annually.

export interface ThaiEconomicProfile {
  // Macro
  gdpUsd: number;             // billion USD
  gdpRankGlobal: number;
  gdpPerCapita: number;       // USD
  population: number;         // million
  // Tourism
  tourismRevenue: number;     // billion USD
  tourismShareGdp: number;    // %
  tourismArrivals: number;    // million (latest year)
  tourismArrivalsPeak: number; // 2019 pre-COVID
  // Medical tourism
  medicalRevenue: number;     // billion USD
  medicalPatients: number;    // million per year
  medicalRankGlobal: number;
  // Agriculture
  agriShareGdp: number;       // %
  riceExports: number;        // million tonnes
  riceRankGlobal: number;
  rubberRankGlobal: number;
  // Manufacturing
  autoRankAsean: number;
  hddRankGlobal: number;
  // Trade
  tradeBalance: number;       // billion USD
  fdi: number;                // billion USD
  exportsTopDestination: string;
  // Currency
  thbPerUsd: number;
  // ICT/Digital
  internetPenetration: number; // %
  asOf: string;
}

export const THAILAND_PROFILE: ThaiEconomicProfile = {
  gdpUsd: 543.0,
  gdpRankGlobal: 27,
  gdpPerCapita: 7593,
  population: 71.6,
  tourismRevenue: 48.0,
  tourismShareGdp: 12.0,
  tourismArrivals: 35.4,    // 2024 estimate
  tourismArrivalsPeak: 39.9, // 2019
  medicalRevenue: 9.5,
  medicalPatients: 3.5,
  medicalRankGlobal: 1,      // by foreign patient revenue Asia, often top 3 globally
  agriShareGdp: 8.5,
  riceExports: 7.5,
  riceRankGlobal: 2,         // #1 or #2, swapping with India
  rubberRankGlobal: 1,
  autoRankAsean: 1,
  hddRankGlobal: 1,
  tradeBalance: 6.2,
  fdi: 13.8,
  exportsTopDestination: "United States",
  thbPerUsd: 36.2,
  internetPenetration: 88.0,
  asOf: "2024 Q4",
};

// ─── Thai sector stocks for the SET ─────────────────────────────────

export interface SectorStock {
  symbol: string;
  name: string;
  nameTh: string;
  marketCapBn: number;       // billion THB (approximate)
  description: string;
  globalNote?: string;        // optional global positioning note
}

export interface ThaiSector {
  id: "tourism" | "medical" | "agriculture" | "manufacturing" | "energy" | "banking";
  label: string;
  labelTh: string;
  shareOfGdp: number;        // %
  emoji: string;
  color: string;
  globalPosition: string;
  description: string;
  topStocks: SectorStock[];
}

export const THAI_SECTORS: ThaiSector[] = [
  {
    id: "tourism",
    label: "Tourism & Hospitality",
    labelTh: "ท่องเที่ยว",
    shareOfGdp: 12.0,
    emoji: "🏖",
    color: "var(--caution)",
    globalPosition: "#5 most visited country worldwide (39.9M peak)",
    description: "Tourism is Thailand's largest service export. Recovery from COVID is ahead of regional peers. Phuket / Bangkok / Pattaya / Chiang Mai are the four pillars.",
    topStocks: [
      { symbol: "AOT.BK",    name: "Airports of Thailand",   nameTh: "ท่าอากาศยานไทย",       marketCapBn: 902, description: "Operates Suvarnabhumi + 5 other airports — gateway monopoly.", globalNote: "World's most profitable airport operator pre-COVID" },
      { symbol: "MINT.BK",   name: "Minor International",     nameTh: "ไมเนอร์ อินเตอร์เนชั่นแนล", marketCapBn: 170, description: "NH Hotels, Anantara, Avani. >500 hotels across 56 countries.", globalNote: "Top 30 hotel operator globally" },
      { symbol: "CENTEL.BK", name: "Central Plaza Hotel",     nameTh: "เซ็นทรัล พลาซา",         marketCapBn: 56,  description: "Centara hotels + KFC Thailand franchise." },
      { symbol: "ERW.BK",    name: "Erawan Group",            nameTh: "ดิ เอราวัณ",              marketCapBn: 18,  description: "Grand Hyatt Erawan, Holiday Inn, ibis Bangkok." },
    ],
  },
  {
    id: "medical",
    label: "Medical Tourism",
    labelTh: "การท่องเที่ยวเชิงการแพทย์",
    shareOfGdp: 2.0,
    emoji: "🏥",
    color: "var(--bear)",
    globalPosition: "#1 Asia for medical tourism revenue (~$9.5B/yr)",
    description: "Thailand attracts ~3.5M medical tourists yearly — cosmetic surgery, dental, IVF, cardiac, gender-affirming care. JCI-accredited hospitals at 1/3 the US price.",
    topStocks: [
      { symbol: "BDMS.BK", name: "Bangkok Dusit Medical Services", nameTh: "บางกอกดุสิตเวชการ",   marketCapBn: 425, description: "Bangkok Hospital, BNH, Samitivej. 50+ hospitals.", globalNote: "Largest healthcare group in SE Asia" },
      { symbol: "BH.BK",   name: "Bumrungrad Hospital",            nameTh: "บำรุงราษฎร์",        marketCapBn: 175, description: "Single most famous Thai hospital for foreign patients.", globalNote: "Serves 1M+ international patients/yr" },
      { symbol: "CHG.BK",  name: "Chularat Hospital",              nameTh: "จุฬารัตน์",          marketCapBn: 36,  description: "Eastern Seaboard / Pattaya / Sriracha network." },
      { symbol: "BCH.BK",  name: "Bangkok Chain Hospital",         nameTh: "เครือบางกอกฯ",        marketCapBn: 50,  description: "Affordable tier — Kasemrad chain, social-security focus." },
    ],
  },
  {
    id: "agriculture",
    label: "Agriculture & Food",
    labelTh: "เกษตรกรรม",
    shareOfGdp: 8.5,
    emoji: "🌾",
    color: "var(--bull)",
    globalPosition: "#2 rice exporter · #1 natural rubber · #1 cassava · top-5 fruit",
    description: "Thailand feeds much of Asia and beyond. Rice, rubber, sugar, cassava, durian (now #1 export to China), pineapple, shrimp.",
    topStocks: [
      { symbol: "CPF.BK",   name: "CP Foods",            nameTh: "เจริญโภคภัณฑ์อาหาร", marketCapBn: 195, description: "Vertically integrated meat + seafood giant.", globalNote: "World's largest chicken producer (top 3)" },
      { symbol: "TU.BK",    name: "Thai Union Group",    nameTh: "ไทยยูเนี่ยน",        marketCapBn: 80,  description: "Chicken of the Sea, John West tuna brands.", globalNote: "World's largest tuna canner" },
      { symbol: "GFPT.BK",  name: "GFPT",                nameTh: "จีเอฟพีที",         marketCapBn: 12,  description: "Chicken processing for export (Japan/EU)." },
      { symbol: "KSL.BK",   name: "Khon Kaen Sugar",     nameTh: "น้ำตาลขอนแก่น",      marketCapBn: 8,   description: "Sugar producer + ethanol." },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    labelTh: "พลังงาน",
    shareOfGdp: 7.5,
    emoji: "⚡",
    color: "var(--tech)",
    globalPosition: "Regional petroleum hub via Strait of Malacca",
    description: "PTT Group dominates oil/gas. GULF and RATCH lead renewables expansion.",
    topStocks: [
      { symbol: "PTT.BK",    name: "PTT Public Company",   nameTh: "ปตท.",          marketCapBn: 1020, description: "National oil & gas company. Pipelines, refining, retail." },
      { symbol: "PTTEP.BK",  name: "PTT Exploration",      nameTh: "ปตท.สำรวจฯ",     marketCapBn: 615, description: "Upstream — owns Bongkot, Erawan gas fields." },
      { symbol: "GULF.BK",   name: "Gulf Energy",           nameTh: "กัลฟ์ เอ็นเนอร์จี", marketCapBn: 525, description: "Largest IPP. Major LNG + renewable bet." },
      { symbol: "RATCH.BK",  name: "Ratchaburi Group",     nameTh: "ราชบุรีโฮลดิ้ง", marketCapBn: 51,  description: "Power generation across ASEAN." },
    ],
  },
  {
    id: "manufacturing",
    label: "Manufacturing & Auto",
    labelTh: "อุตสาหกรรม",
    shareOfGdp: 27.0,
    emoji: "🚗",
    color: "var(--muted)",
    globalPosition: "#1 ASEAN auto producer · #1 global HDD exporter · 'Detroit of Asia'",
    description: "Thailand is Toyota, Honda, Isuzu, Mitsubishi's ASEAN manufacturing base. Western Digital + Seagate make most of the world's hard drives here.",
    topStocks: [
      { symbol: "DELTA.BK", name: "Delta Electronics (Thai)", nameTh: "เดลต้า อีเลคโทรนิคส์", marketCapBn: 1410, description: "Power electronics, data center, EV components.", globalNote: "Largest market cap on SET" },
      { symbol: "SCC.BK",   name: "Siam Cement Group",         nameTh: "ปูนซิเมนต์ไทย",     marketCapBn: 305, description: "Cement, chemicals, packaging. CP-aligned." },
      { symbol: "SCGP.BK",  name: "SCG Packaging",             nameTh: "เอสซีจี แพคเกจจิ้ง", marketCapBn: 110, description: "Asia's largest paper/pulp packaging player." },
      { symbol: "WHA.BK",   name: "WHA Corporation",           nameTh: "ดับบลิวเอชเอ",      marketCapBn: 87,  description: "Industrial estates — landlord to global manufacturers in EEC." },
    ],
  },
  {
    id: "banking",
    label: "Banking & Finance",
    labelTh: "ธนาคาร",
    shareOfGdp: 9.0,
    emoji: "🏦",
    color: "var(--tech)",
    globalPosition: "ASEAN top-5 banking sector by assets",
    description: "Highly concentrated — top 4 banks control ~75% of assets. Strong on capital ratios, slow on tech.",
    topStocks: [
      { symbol: "KBANK.BK", name: "Kasikorn Bank",    nameTh: "กสิกรไทย",    marketCapBn: 335, description: "Tech-forward retail bank. K-PLUS app dominates." },
      { symbol: "SCB.BK",   name: "SCB",              nameTh: "ไทยพาณิชย์",  marketCapBn: 367, description: "Largest by deposits. SCB X holding restructure." },
      { symbol: "BBL.BK",   name: "Bangkok Bank",     nameTh: "ธนาคารกรุงเทพ", marketCapBn: 300, description: "Most ASEAN-international. Owns Permata (Indonesia)." },
      { symbol: "KTB.BK",   name: "Krung Thai Bank",  nameTh: "กรุงไทย",     marketCapBn: 268, description: "State-linked. PromptPay infrastructure backbone." },
    ],
  },
];

// ─── Global rankings — where Thailand wins ─────────────────────────

export interface GlobalRanking {
  category: string;
  metric: string;
  rank: number;
  value: string;
  note: string;
  emoji: string;
}

export const THAILAND_GLOBAL_RANKINGS: GlobalRanking[] = [
  { category: "Tourism",       metric: "International arrivals",       rank: 5,  value: "39.9M peak",        note: "Tied with UK on peak years", emoji: "🏖" },
  { category: "Medical",       metric: "Medical tourism revenue",      rank: 3,  value: "$9.5B",             note: "After US, Turkey",            emoji: "🏥" },
  { category: "Rubber",        metric: "Natural rubber production",    rank: 1,  value: "4.7M tonnes",       note: "32% of global supply",        emoji: "🌳" },
  { category: "Rice",          metric: "Rice exports",                 rank: 2,  value: "7.5M tonnes",       note: "Behind India, ahead of Vietnam", emoji: "🌾" },
  { category: "Cassava",       metric: "Cassava exports",              rank: 1,  value: "12M tonnes",        note: "China's #1 supplier",         emoji: "🥔" },
  { category: "HDD",           metric: "Hard drive exports",           rank: 1,  value: "60% of world",      note: "Western Digital + Seagate",   emoji: "💾" },
  { category: "Pickup trucks", metric: "Pickup truck production",      rank: 1,  value: "1.8M/yr",           note: "World's largest assembly hub", emoji: "🛻" },
  { category: "Durian",        metric: "Durian exports to China",      rank: 1,  value: "$4.6B",             note: "95% of China's imports",      emoji: "🥭" },
  { category: "Tuna",          metric: "Tuna canning",                 rank: 1,  value: "30% global",        note: "Thai Union dominance",        emoji: "🐟" },
  { category: "Auto ASEAN",    metric: "Vehicle production",            rank: 1,  value: "1.5M/yr",           note: "'Detroit of Asia'",           emoji: "🚙" },
  { category: "Shrimp",        metric: "Shrimp aquaculture",            rank: 4,  value: "300K tonnes",       note: "Behind China, Ecuador, India", emoji: "🦐" },
  { category: "Orchids",       metric: "Orchid exports",                rank: 1,  value: "$80M",              note: "World's largest cut-flower orchid exporter", emoji: "🌺" },
];
