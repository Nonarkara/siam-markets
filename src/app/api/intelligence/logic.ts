import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAssetClasses, fetchAllRegional } from "@/lib/api/yahoo";
import { MOCK_MACRO, MOCK_EVENTS } from "@/lib/api/mock";

export const REGIMES = [
  {
    id: "taper-tantrum",
    name: "Taper Tantrum",
    date: "Jun 2013",
    dna: [35, 72, 25, 18, 78, 45],
    description: "Fed hinted at QE tapering. Bonds crashed, EM currencies sold off. SET fell 15% in 2 months.",
    whatHappenedNext: "EM rout continued 6 weeks. Thai Baht hit 32.5. SET found bottom after BOT rate cut.",
  },
  {
    id: "covid-crash",
    name: "COVID Crash Bottom",
    date: "Mar 2020",
    dna: [22, 12, 15, 8, 95, 82],
    description: "Global lockdowns. VIX hit 82. Oil went negative. Every asset class correlated to 1.",
    whatHappenedNext: "Central banks printed $10T. S&P 500 doubled in 18 months. SET recovered +65%.",
  },
  {
    id: "post-covid-rally",
    name: "Post-COVID Euphoria",
    date: "Nov 2021",
    dna: [88, 92, 78, 88, 18, 22],
    description: "Meme stocks, crypto peak, everything risk-on. Retail FOMO at maximum. No fear anywhere.",
    whatHappenedNext: "Fed pivoted hawkish. Nasdaq fell 33%. Crypto crashed 70%. SET corrected 12%.",
  },
  {
    id: "inflation-peak",
    name: "Inflation Peak Panic",
    date: "Oct 2022",
    dna: [42, 35, 30, 22, 72, 55],
    description: "US CPI 9.1%. Fed at 3.25% and hiking fast. Dollar wrecking ball. Everything risk-off.",
    whatHappenedNext: "CPI rolled over. Fed slowed hikes. Q4 2022 was the generational bottom for bonds.",
  },
  {
    id: "soft-landing",
    name: "Soft Landing Hope",
    date: "Dec 2024",
    dna: [58, 62, 55, 58, 35, 30],
    description: "Goldilocks narrative. Inflation down, jobs up, no recession. AI hype driving tech multiples.",
    whatHappenedNext: "Rate cuts began. Small caps lagged. Magnificent 7 concentrated rally continued.",
  },
  {
    id: "asian-crisis",
    name: "Asian Financial Crisis",
    date: "Jul 1997",
    dna: [28, 18, 12, 15, 88, 75],
    description: "Baht depegged. Contagion across ASEAN. IMF bailouts. SET collapsed 75% from peak.",
    whatHappenedNext: "3 years of restructuring. Thai economy contracted 10.5% in 1998. SET bottomed Oct 1998.",
  },
];

export function dnaSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (magA * magB);
}

export type Anomaly = {
  id: string;
  severity: "critical" | "warning" | "notice";
  title: string;
  description: string;
  metric: string;
  expectation: string;
};

export type NarrativeReality = {
  topic: string;
  narrativeTone: number;
  narrativeVolume: number;
  measuredValue: string;
  measuredContext: string;
  verdict: "CONFIRMED" | "UNDERSTATED" | "OVERSTATED" | "CALM";
  verdictColor: string;
};

export type Flow = {
  from: string;
  to: string;
  strength: number;
  label: string;
};

function fmt(n: number): string {
  return (n > 0 ? "+" : "") + n.toFixed(2);
}

export function computeMarketDNA(
  macro: Awaited<ReturnType<typeof fetchMacro>>,
  fg: Awaited<ReturnType<typeof fetchFearGreed>>,
  _thb: Awaited<ReturnType<typeof fetchThbRate>>,
  assets: Awaited<ReturnType<typeof fetchAssetClasses>>,
  regional: Awaited<ReturnType<typeof fetchAllRegional>>,
) {
  const setPe = MOCK_MACRO.setPe;
  const vix = macro.vix ?? 18;
  const fgScore = fg.score;
  const yieldSpread = macro.yieldCurveSpread ?? 0.5;
  const fedRate = macro.usFedFundsRate ?? 5.25;

  const valuation = Math.min(100, Math.max(0, ((setPe - 10) / 15) * 100));
  const setChange = regional.thai[0]?.changePct ?? -0.3;
  const momentum = Math.min(100, Math.max(0, 50 + setChange * 20));
  const fedLiquidity = Math.min(100, Math.max(0, (6 - fedRate) / 6 * 100));
  const spreadLiquidity = Math.min(100, Math.max(0, (yieldSpread + 1) / 2 * 100));
  const liquidity = fedLiquidity * 0.6 + spreadLiquidity * 0.4;
  const sentiment = fgScore;
  const volatility = Math.min(100, Math.max(0, ((vix - 10) / 70) * 100));

  const gold = assets.find(a => a.symbol === "GC=F");
  const set = regional.thai[0];
  const goldSetCorr = gold && set ? (gold.changePct * set.changePct > 0 ? 1 : -1) : 0;
  const vixSetDiv = vix < 20 && setChange < -1 ? 1 : 0;
  const divergence = Math.min(100, (goldSetCorr < 0 ? 40 : 0) + (vixSetDiv ? 50 : 0) + (yieldSpread < 0 ? 20 : 0));

  const scores = [
    Math.round(valuation),
    Math.round(momentum),
    Math.round(liquidity),
    Math.round(sentiment),
    Math.round(volatility),
    Math.round(divergence),
  ];

  let bestMatch = REGIMES[0];
  let bestSim = -1;
  for (const regime of REGIMES) {
    const sim = dnaSimilarity(scores, regime.dna);
    if (sim > bestSim) {
      bestSim = sim;
      bestMatch = regime;
    }
  }

  return { scores, regime: bestMatch.name, confidence: Math.round(bestSim * 100) };
}

export function detectAnomalies(
  macro: Awaited<ReturnType<typeof fetchMacro>>,
  fg: Awaited<ReturnType<typeof fetchFearGreed>>,
  assets: Awaited<ReturnType<typeof fetchAssetClasses>>,
  regional: Awaited<ReturnType<typeof fetchAllRegional>>,
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const vix = macro.vix ?? 18;
  const yieldSpread = macro.yieldCurveSpread ?? 0.5;
  const set = regional.thai[0];
  const gold = assets.find(a => a.symbol === "GC=F");
  const oil = assets.find(a => a.symbol === "CL=F");
  const btc = assets.find(a => a.symbol === "BTC-USD");
  const us10y = assets.find(a => a.symbol === "^TNX");

  if (vix < 15 && set && set.changePct < -0.5) {
    anomalies.push({
      id: "vix-complacency",
      severity: "warning",
      title: "VIX Complacency Gap",
      description: "VIX is abnormally low given negative SET momentum. Options market is underpricing downside risk.",
      metric: `VIX ${vix.toFixed(1)} vs SET ${fmt(set.changePct)}%`,
      expectation: "Watch for sudden volatility expansion. Similar to Feb 2018 and Aug 2024.",
    });
  }

  if (gold && set && gold.changePct * set.changePct < 0 && Math.abs(gold.changePct) > 0.3 && Math.abs(set.changePct) > 0.3) {
    anomalies.push({
      id: "gold-set-decoupling",
      severity: "notice",
      title: "Gold ↔ SET Decoupling",
      description: `Gold and SET are moving in opposite directions. Gold ${fmt(gold.changePct)}% vs SET ${fmt(set.changePct)}%.`,
      metric: "Correlation flip",
      expectation: "Normally correlated in risk-off. Divergence suggests sector-specific or FX-driven moves.",
    });
  }

  if (yieldSpread > -0.2 && yieldSpread < 0.3) {
    anomalies.push({
      id: "yield-normalization",
      severity: yieldSpread > 0 ? "warning" : "notice",
      title: yieldSpread > 0 ? "Yield Curve Un-Inverted" : "Yield Curve Near Un-Inversion",
      description: yieldSpread > 0
        ? "10Y-2Y spread turned positive. Historically, recession follows 6–18 months after un-inversion."
        : "Spread is hovering near zero. The most inverted portion of the cycle may be ending.",
      metric: `Spread: ${yieldSpread > 0 ? "+" : ""}${yieldSpread.toFixed(2)}%`,
      expectation: yieldSpread > 0
        ? "Past 6 recessions all began after un-inversion. Defensive positioning warranted."
        : "Watch for the actual flip — it's the signal, not the inversion itself.",
    });
  }

  if (btc && set && Math.abs(btc.changePct - set.changePct * 3) > 3) {
    anomalies.push({
      id: "crypto-equity-div",
      severity: "notice",
      title: "Crypto ↔ Equity Divergence",
      description: `BTC moving ${btc.changePct > set.changePct * 3 ? "much faster" : "slower"} than SET. Risk appetite is sector-specific.`,
      metric: `BTC ${fmt(btc.changePct)}% vs SET ${fmt(set.changePct)}%`,
      expectation: "Crypto often leads global risk appetite by 1–3 days. Monitor for SET catch-up.",
    });
  }

  if (us10y && us10y.changePct > 1.5) {
    anomalies.push({
      id: "bond-yield-spike",
      severity: "critical",
      title: "Treasury Yield Spike",
      description: `US 10Y yields surging ${us10y.changePct.toFixed(1)}%. Bond market is pricing in hawkish Fed or inflation surprise.`,
      metric: `10Y: ${us10y.price?.toFixed(2) ?? "—"}%`,
      expectation: "EM typically underperforms 48–72 hours after US yield spikes. THB may weaken.",
    });
  }

  if (fg.score > 70 && set && set.changePct < 0) {
    anomalies.push({
      id: "sentiment-gap",
      severity: "warning",
      title: "Sentiment-Price Divergence",
      description: "Fear & Greed is greedy but SET is falling. Retail optimism may be masking institutional selling.",
      metric: `F&G ${fg.score}/100 vs SET ${fmt(set.changePct)}%`,
      expectation: "This divergence often resolves with a sharp correction as sentiment catches down to price.",
    });
  } else if (fg.score < 25 && set && set.changePct > 0.5) {
    anomalies.push({
      id: "sentiment-gap-bull",
      severity: "notice",
      title: "Fear vs Positive Price",
      description: "Fear & Greed is fearful but SET is rising. Possible stealth accumulation phase.",
      metric: `F&G ${fg.score}/100 vs SET +${set.changePct.toFixed(2)}%`,
      expectation: "Historically a contrarian buy signal when F&G < 25 and price turns positive.",
    });
  }

  if (oil && Math.abs(oil.changePct) > 2) {
    anomalies.push({
      id: "oil-thb-feedback",
      severity: "notice",
      title: `Oil ${oil.changePct > 0 ? "Surge" : "Drop"} — THB Impact`,
      description: `Oil ${oil.changePct > 0 ? "up" : "down"} ${Math.abs(oil.changePct).toFixed(1)}%. Thailand is net oil importer — ${oil.changePct > 0 ? "negative" : "positive"} for trade balance.`,
      metric: `Oil: $${oil.price?.toFixed(2) ?? "—"}`,
      expectation: oil.changePct > 0
        ? "Energy sector may rally but transport/tourism costs rise. Watch PTT vs AOT divergence."
        : "Lower energy costs support consumer names. CPALL, HMPRO may benefit.",
    });
  }

  const severityOrder = { critical: 0, warning: 1, notice: 2 };
  return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function computeNarrativeReality(setChangePct: number): NarrativeReality {
  const events = MOCK_EVENTS;
  const thEvents = events.filter(e => e.country === "TH" || e.country === "US");
  const latest = thEvents[0] ?? events[0];
  const tone = latest.sentiment * 10;
  const volume = thEvents.length;

  const narrativeNegative = tone < -2;
  const marketNegative = setChangePct < -0.5;

  let verdict: NarrativeReality["verdict"] = "CALM";
  let verdictColor = "var(--muted)";

  if (narrativeNegative && marketNegative) {
    verdict = "CONFIRMED";
    verdictColor = "var(--bear)";
  } else if (!narrativeNegative && marketNegative) {
    verdict = "UNDERSTATED";
    verdictColor = "var(--caution)";
  } else if (narrativeNegative && !marketNegative) {
    verdict = "OVERSTATED";
    verdictColor = "var(--tech)";
  }

  return {
    topic: latest.headline.split(" ").slice(0, 4).join(" ") + "…",
    narrativeTone: Number(tone.toFixed(1)),
    narrativeVolume: volume,
    measuredValue: `SET ${setChangePct > 0 ? "+" : ""}${setChangePct.toFixed(2)}%`,
    measuredContext: setChangePct < -1 ? "Significant decline" : setChangePct < -0.3 ? "Mild weakness" : setChangePct > 1 ? "Strong rally" : "Stable",
    verdict,
    verdictColor,
  };
}

export function computeFlowMatrix(
  assets: Awaited<ReturnType<typeof fetchAssetClasses>>,
  regional: Awaited<ReturnType<typeof fetchAllRegional>>,
): Flow[] {
  const set = regional.thai[0];
  const spx = regional.global?.find((r: { symbol: string }) => r.symbol === "^GSPC");
  const gold = assets.find(a => a.symbol === "GC=F");
  const btc = assets.find(a => a.symbol === "BTC-USD");
  const us10y = assets.find(a => a.symbol === "^TNX");
  const dxy = assets.find(a => a.symbol === "DX-Y.NYB");

  const flows: Flow[] = [];

  if (dxy && set) {
    const strength = -(dxy.changePct * 2);
    flows.push({
      from: "US Dollar",
      to: "Thailand SET",
      strength: Math.max(-1, Math.min(1, strength)),
      label: strength > 0.3 ? "INFLOW" : strength < -0.3 ? "OUTFLOW" : "NEUTRAL",
    });
  }

  if (us10y && spx) {
    const strength = us10y.changePct > 0.5 ? -0.6 : us10y.changePct < -0.3 ? 0.4 : 0;
    flows.push({
      from: "US Treasuries",
      to: "Global Equities",
      strength,
      label: strength > 0.2 ? "ROTATION IN" : strength < -0.2 ? "ROTATION OUT" : "STABLE",
    });
  }

  if (gold && btc) {
    const strength = (btc.changePct - gold.changePct) * 0.3;
    flows.push({
      from: "Gold",
      to: "Bitcoin",
      strength: Math.max(-1, Math.min(1, strength)),
      label: strength > 0.3 ? "RISK-ON" : strength < -0.3 ? "RISK-OFF" : "BALANCED",
    });
  }

  if (btc && set) {
    const strength = btc.changePct > 2 ? 0.5 : btc.changePct < -2 ? -0.4 : 0.1;
    flows.push({
      from: "Bitcoin",
      to: "Thailand SET",
      strength: Math.max(-1, Math.min(1, strength)),
      label: strength > 0.3 ? "LEADING UP" : strength < -0.2 ? "LEADING DOWN" : "DECOUPLED",
    });
  }

  return flows;
}
