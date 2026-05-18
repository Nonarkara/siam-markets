/**
 * Thailand Digital Economy + Global AI
 *
 * Thailand context:
 * - Digital economy targeted at 30% of GDP by 2030 (currently ~12%)
 * - Internet penetration: 88% — one of highest in ASEAN
 * - PromptPay: world's #2 retail real-time payment system by volume
 * - AWS, Google Cloud, Microsoft all opened Thailand regions 2024-2025
 * - "Thailand 4.0" + EEC (Eastern Economic Corridor) for digital+advanced manufacturing
 * - Retail CBDC piloted by Bank of Thailand
 *
 * Strategy: SET-listed digital/AI infrastructure stocks first,
 * then global AI mega-caps for context.
 */

import { fetchYahooQuote, type YahooQuote } from "./yahoo";

// ─── Thailand Digital Economy KPIs (curated, refresh yearly) ──────

export interface DigitalKPI {
  label: string;
  value: string;
  sub: string;
  trend: "up" | "stable" | "down";
  color: string;
}

export const THAILAND_DIGITAL_KPIS: DigitalKPI[] = [
  { label: "DIGITAL GDP",      value: "12%",    sub: "Target: 30% by 2030 (Thailand 4.0)",            trend: "up",     color: "var(--tech)"     },
  { label: "INTERNET",         value: "88%",    sub: "Penetration · 61M users · #2 in ASEAN",          trend: "up",     color: "var(--bull)"     },
  { label: "E-COMMERCE",       value: "$30B",   sub: "Market size 2024 · +20% YoY · #2 SEA",           trend: "up",     color: "var(--bull)"     },
  { label: "PROMPTPAY",        value: "$200B",  sub: "Annual TXN value · #2 global retail RTP",        trend: "up",     color: "#00c896"         },
  { label: "AI WORKFORCE",     value: "~45K",   sub: "AI-skilled workers · Singapore: 90K",            trend: "up",     color: "var(--caution)"  },
  { label: "DATA CENTERS",     value: "26+",    sub: "Operational · AWS · GCP · Azure all 2024+",      trend: "up",     color: "var(--tech)"     },
];

// ─── The Thai Digital Stack — SET-listed exposure ─────────────────

export interface ThaiDigitalStock {
  symbol: string;
  name: string;
  nameTh: string;
  category: "telecom" | "datacenter" | "fintech" | "cloud" | "satellite" | "device" | "energy_digital";
  marketCapBn: number;       // billion THB
  whatTheyDo: string;
  digitalAngle: string;
}

export const THAI_DIGITAL_STACK: ThaiDigitalStock[] = [
  {
    symbol: "DELTA.BK",
    name: "Delta Electronics (Thai)",
    nameTh: "เดลต้า อีเลคโทรนิคส์",
    category: "datacenter",
    marketCapBn: 1410,
    whatTheyDo: "Power systems, EV components, data center cooling.",
    digitalAngle: "Sells the picks-and-shovels of the AI data center boom. Stock 5x'd on AI infrastructure spending.",
  },
  {
    symbol: "ADVANC.BK",
    name: "Advanced Info Service",
    nameTh: "แอดวานซ์ อินโฟร์ เซอร์วิส",
    category: "telecom",
    marketCapBn: 700,
    whatTheyDo: "Thailand's #1 mobile carrier. 5G leadership.",
    digitalAngle: "Operates AIS Cloud, AIS Play (streaming), AIS Insurance. Foundational digital platform.",
  },
  {
    symbol: "TRUE.BK",
    name: "True Corporation",
    nameTh: "ทรู คอร์ปอเรชั่น",
    category: "telecom",
    marketCapBn: 270,
    whatTheyDo: "Post-merger telecom giant (True + DTAC).",
    digitalAngle: "TrueMoney e-wallet, TrueID streaming, content + 5G + IoT bundles.",
  },
  {
    symbol: "INTUCH.BK",
    name: "Intouch Holdings",
    nameTh: "อินทัช โฮลดิ้งส์",
    category: "satellite",
    marketCapBn: 245,
    whatTheyDo: "Holding company — owns 40% of ADVANC + Thaicom.",
    digitalAngle: "Pure digital + satellite play. Gulf Energy now owns Intouch — major rollup.",
  },
  {
    symbol: "THCOM.BK",
    name: "Thaicom",
    nameTh: "ไทยคม",
    category: "satellite",
    marketCapBn: 16,
    whatTheyDo: "Satellite communications — broadband + broadcast.",
    digitalAngle: "Bridging rural connectivity. Software-defined satellite (Thaicom-9) launching.",
  },
  {
    symbol: "GULF.BK",
    name: "Gulf Energy Development",
    nameTh: "กัลฟ์ เอ็นเนอร์จี",
    category: "energy_digital",
    marketCapBn: 525,
    whatTheyDo: "Power generation, LNG, renewables — now also data centers via Intouch buyout.",
    digitalAngle: "Building hyperscale data center campus + grid power. Major bet on AI-era infra demand.",
  },
  {
    symbol: "WHA.BK",
    name: "WHA Corporation",
    nameTh: "ดับบลิวเอชเอ",
    category: "datacenter",
    marketCapBn: 87,
    whatTheyDo: "Industrial estates in the EEC — landlord to global manufacturers.",
    digitalAngle: "Hosts the AWS + GCP + Microsoft hyperscale data centers. Solar + grid + fiber + water.",
  },
  {
    symbol: "INSET.BK",
    name: "Infraset",
    nameTh: "อินฟราเซต",
    category: "datacenter",
    marketCapBn: 11,
    whatTheyDo: "Telecom + ICT infrastructure construction.",
    digitalAngle: "Direct beneficiary of fiber rollout + data center construction wave.",
  },
  {
    symbol: "INET.BK",
    name: "Internet Thailand",
    nameTh: "อินเทอร์เน็ตประเทศไทย",
    category: "cloud",
    marketCapBn: 6,
    whatTheyDo: "Cloud + colocation + managed services.",
    digitalAngle: "Smaller domestic cloud — Thailand's answer to AWS regionally.",
  },
  {
    symbol: "SAMART.BK",
    name: "Samart Corporation",
    nameTh: "สามารถ คอร์ปอเรชั่น",
    category: "device",
    marketCapBn: 7,
    whatTheyDo: "ICT, mobile, digital broadcasting, air-traffic control systems.",
    digitalAngle: "Diversified tech conglomerate — legacy mobile retail + ATC modernization.",
  },
  {
    symbol: "HUMAN.BK",
    name: "Humanica",
    nameTh: "ฮิวแมนิก้า",
    category: "fintech",
    marketCapBn: 4,
    whatTheyDo: "HR tech, payroll, employee benefits SaaS.",
    digitalAngle: "Pure SaaS — recurring revenue, Thailand's leading payroll software.",
  },
  {
    symbol: "NETBAY.BK",
    name: "Netbay",
    nameTh: "เน็ตเบย์",
    category: "cloud",
    marketCapBn: 3,
    whatTheyDo: "Government e-services, trade digitization (customs etc.).",
    digitalAngle: "Long-duration government digitization contracts.",
  },
];

export const DIGITAL_CATEGORY_LABEL: Record<ThaiDigitalStock["category"], string> = {
  telecom: "Telecom",
  datacenter: "Data Centers",
  fintech: "Fintech / SaaS",
  cloud: "Cloud",
  satellite: "Satellite",
  device: "Devices / ICT",
  energy_digital: "Energy × Digital",
};

export const DIGITAL_CATEGORY_COLOR: Record<ThaiDigitalStock["category"], string> = {
  telecom: "var(--tech)",
  datacenter: "var(--bull)",
  fintech: "var(--caution)",
  cloud: "#a78bfa",
  satellite: "#06b6d4",
  device: "var(--muted)",
  energy_digital: "var(--bear)",
};

// ─── Global AI Leaders ────────────────────────────────────────────

export interface GlobalAILeader {
  symbol: string;             // Yahoo ticker
  name: string;
  flag: string;
  role: "chips" | "model" | "cloud" | "platform" | "infra" | "foundry";
  whyItMatters: string;
}

export const GLOBAL_AI_LEADERS: GlobalAILeader[] = [
  { symbol: "NVDA",   name: "NVIDIA",          flag: "🇺🇸", role: "chips",   whyItMatters: "GPU monopoly powering every AI lab. ~90%+ training share." },
  { symbol: "MSFT",   name: "Microsoft",       flag: "🇺🇸", role: "platform",whyItMatters: "OpenAI partner. Azure AI = enterprise AI default. Copilot in everything." },
  { symbol: "GOOGL",  name: "Alphabet",        flag: "🇺🇸", role: "model",   whyItMatters: "Gemini, DeepMind, Vertex AI, TPUs. Only full-stack rival to OpenAI." },
  { symbol: "META",   name: "Meta",            flag: "🇺🇸", role: "model",   whyItMatters: "LLaMa open-weights — the open-source AI default." },
  { symbol: "AMZN",   name: "Amazon",          flag: "🇺🇸", role: "cloud",   whyItMatters: "AWS Bedrock (multi-model marketplace), Trainium chips." },
  { symbol: "AAPL",   name: "Apple",           flag: "🇺🇸", role: "platform",whyItMatters: "Apple Intelligence — on-device AI for 2B+ devices." },
  { symbol: "TSM",    name: "TSMC",            flag: "🇹🇼", role: "foundry", whyItMatters: "Manufactures Nvidia, Apple, AMD chips. No TSMC = no AI." },
  { symbol: "AVGO",   name: "Broadcom",        flag: "🇺🇸", role: "chips",   whyItMatters: "Custom AI ASICs (Google TPU, Meta MTIA). Hyperscaler exposure." },
  { symbol: "AMD",    name: "AMD",             flag: "🇺🇸", role: "chips",   whyItMatters: "Only credible Nvidia challenger. MI300 GPU line." },
  { symbol: "ASML",   name: "ASML",            flag: "🇳🇱", role: "foundry", whyItMatters: "EUV lithography monopoly. The only company that can make machines for the chips." },
  { symbol: "BABA",   name: "Alibaba",         flag: "🇨🇳", role: "cloud",   whyItMatters: "Qwen LLM (open source) + Alibaba Cloud — China's AWS+AI." },
  { symbol: "9988.HK",name: "Tencent",         flag: "🇨🇳", role: "model",   whyItMatters: "Hunyuan model, WeChat AI agent at 1.4B-user scale." },
  { symbol: "PLTR",   name: "Palantir",        flag: "🇺🇸", role: "platform",whyItMatters: "AIP (AI for enterprise/defense). Fastest enterprise-AI revenue ramp." },
  { symbol: "ARM",    name: "ARM Holdings",    flag: "🇬🇧", role: "chips",   whyItMatters: "Every smartphone + Apple Silicon + edge AI chip designed on ARM." },
];

export interface GlobalAIQuote extends GlobalAILeader {
  price: number;
  changePct: number;
  marketCapTrillionUsd?: number;
}

/** Fetch live quotes for global AI leaders via Yahoo Finance. */
export async function fetchGlobalAIQuotes(): Promise<GlobalAIQuote[]> {
  const results = await Promise.all(
    GLOBAL_AI_LEADERS.map(async (leader): Promise<GlobalAIQuote | null> => {
      const quote = await fetchYahooQuote(leader.symbol, leader.name);
      if (!quote) return null;
      return {
        ...leader,
        price: quote.price,
        changePct: quote.changePct,
      };
    }),
  );
  return results.filter((q): q is GlobalAIQuote => q !== null);
}

// ─── AI / Digital Market Sizes (curated, refresh yearly) ──────────

export interface DigitalMarket {
  category: string;
  globalSize: string;
  thailandShare: string;
  growth: string;
  emoji: string;
}

export const DIGITAL_MARKETS: DigitalMarket[] = [
  { category: "AI Software",          globalSize: "$391B",   thailandShare: "~$1.2B",  growth: "+36% CAGR → $1.8T by 2030", emoji: "🧠" },
  { category: "Cloud Computing",      globalSize: "$700B",   thailandShare: "~$2.6B",  growth: "+20% YoY",                  emoji: "☁️" },
  { category: "Semiconductors",       globalSize: "$626B",   thailandShare: "$45B exports", growth: "AI cycle driving record capex", emoji: "💾" },
  { category: "Data Center Capex",    globalSize: "$250B/yr", thailandShare: "~$2B",   growth: "Hyperscaler footprint 2024+", emoji: "🏢" },
  { category: "E-commerce",           globalSize: "$6.8T",   thailandShare: "$30B",    growth: "+8% global, +20% TH",        emoji: "🛒" },
  { category: "Digital Payments",     globalSize: "$11T TXN",thailandShare: "$200B",   growth: "PromptPay = world's #2 retail RTP", emoji: "💸" },
  { category: "Cybersecurity",        globalSize: "$215B",   thailandShare: "~$0.6B",  growth: "+14% CAGR",                  emoji: "🔐" },
  { category: "Streaming Media",      globalSize: "$540B",   thailandShare: "~$1.5B",  growth: "Netflix, iQIYI, Viu dominate", emoji: "📺" },
];
