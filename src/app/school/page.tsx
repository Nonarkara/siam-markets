import { setValuationContext } from "@/lib/graham";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fgLabel, fgBuffettAdvice } from "@/lib/graham";
import type { Concept } from "@/lib/types";

export const revalidate = 3600;

const SET_PE = 15.4;
const CAPE = 34.2;

const VALUE_CONCEPTS: Concept[] = [
  {
    id: "margin-of-safety",
    title: "Margin of Safety",
    subtitle: "Graham's central principle",
    definition: "Buy a stock only when its price is significantly below what it is actually worth — so you are protected even if your analysis is wrong.",
    signal: `Graham Number is a stock's fair value ceiling. A 30%+ gap between price and Graham Number = strong safety.`,
    quote: "The margin of safety is always dependent on the price paid. It will be large at one price, small at some higher price, nonexistent at some still higher price.",
    quoteAuthor: "Benjamin Graham, The Intelligent Investor",
    learnMore: `If you calculate that a company is worth ฿100 but its stock trades at ฿65, you have a 35% margin of safety. Graham said: always demand at least 25–33%. This cushion protects you against calculation errors, unexpected bad news, or just being wrong.`,
  },
  {
    id: "mr-market",
    title: "Mr. Market",
    subtitle: "Graham's emotional market metaphor",
    definition: "Imagine the stock market as a moody business partner who offers to buy or sell your stake every day — at wildly irrational prices. Your job is to exploit his mood swings, not follow them.",
    signal: `Mr. Market today: see the Fear & Greed dial on the Pulse screen for his current mood.`,
    quote: "Mr. Market is there to serve you, not to guide you. It is his pocketbook, not his wisdom, that you will find useful.",
    quoteAuthor: "Benjamin Graham, The Intelligent Investor",
    learnMore: `When Mr. Market is panicked (Fear & Greed below 25), prices are often irrationally low — that is when Graham and Buffett buy. When he is euphoric (above 75), prices are often irrationally high — that is when they hold cash. The key: you never have to trade with him. You only trade when his price is better than fair.`,
  },
  {
    id: "economic-moat",
    title: "Economic Moat",
    subtitle: "Buffett's competitive advantage framework",
    definition: "A sustainable business advantage that protects a company from competition the way a moat protects a castle. Without a moat, any profit eventually attracts competition until it disappears.",
    signal: `4 moat types: Cost Advantage, Switching Costs, Network Effect, Intangible Assets (brand, patent, license). Wide moat = durable profit for 10+ years.`,
    quote: "The key to investing is not assessing how much an industry is going to affect society, or how much it will grow, but rather determining the competitive advantage of any given company and, above all, the durability of that advantage.",
    quoteAuthor: "Warren Buffett, Fortune Magazine, 1999",
    learnMore: `Thai examples: ADVANC has switching costs (you rarely change your phone carrier). AOT (Airports of Thailand) has regulatory scale — nobody builds a competing international airport. CPALL has network effects across 14,000+ 7-Eleven stores. These moats are why Buffett prefers holding periods of 10+ years.`,
  },
  {
    id: "cape-ratio",
    title: "Shiller CAPE Ratio",
    subtitle: "The 10-year market valuation signal",
    definition: "CAPE (Cyclically Adjusted P/E) divides the S&P 500 price by its average earnings over the past 10 years, adjusted for inflation. High CAPE = expensive market = poor future 10-year returns.",
    signal: `Current CAPE: ${CAPE.toFixed(1)} (historical median: 16). Levels above 35 have historically preceded corrections.`,
    quote: "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
    quoteAuthor: "Philip Fisher (via Warren Buffett)",
    learnMore: `CAPE above 30 has historically predicted poor 10-year forward returns (2–4% per year). CAPE below 15 has predicted excellent returns (10–12% per year). At ${CAPE.toFixed(1)}, the US market is expensive by this measure. Thailand's SET P/E at ${SET_PE} is closer to fair value — which is partly why SET may outperform US stocks over the next decade.`,
  },
  {
    id: "circle-of-competence",
    title: "Circle of Competence",
    subtitle: "Munger's risk management principle",
    definition: "Only invest in businesses you deeply understand. If you cannot explain how a company makes money in two minutes, it is outside your circle — and you are betting, not investing.",
    signal: `Start with industries you know: retail, banking, telecom, real estate. Add others only after you understand their economics.`,
    quote: "All I want to know is where I'm going to die, so I'll never go there.",
    quoteAuthor: "Charlie Munger",
    learnMore: `Munger's version of this: avoiding known failure modes is more reliable than finding unknown success. If you use 7-Eleven every day, you have an edge in understanding CPALL's business. If you have a KBank account, you understand retail banking better than most analysts who have never lived in Thailand. Start in your circle, expand it slowly.`,
  },
];

const TRADING_CONCEPTS: Concept[] = [
  {
    id: "price-action",
    title: "Price Action Trading",
    subtitle: "Al Brooks' indicator-free method",
    definition: "Read the market purely from candlesticks and price structure. No RSI, no MACD — just the story each bar tells about the battle between buyers and sellers.",
    signal: "Every candle tells a story. A hammer at support with volume = buyers stepping in. A shooting star at resistance = sellers taking control.",
    quote: "Trading is simple, but it is not easy. The hard part is controlling your emotions and following your rules.",
    quoteAuthor: "Al Brooks",
    learnMore: `Al Brooks, a former ophthalmologist turned full-time trader, lost all his money in his first 10 years. He now teaches that support and resistance are ZONES, not lines. His key insight: wait for the second entry (H2/L2) — if the first signal fails but the second confirms, probability is higher. Trade ranges at boundaries, trends on pullbacks.`,
  },
  {
    id: "risk-management",
    title: "The 1% Rule",
    subtitle: "The only holy grail in trading",
    definition: "Never risk more than 1-2% of your total capital on a single trade. This ensures that even a string of 10 losses cannot destroy your account.",
    signal: "Position Size = Risk Amount / (Entry - Stop). With ฿1M account and 1% risk, you can lose 10 times in a row and still have ฿900K.",
    quote: "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.",
    quoteAuthor: "Warren Buffett",
    learnMore: `Professional traders use the 1% rule religiously. A 1:2 risk-reward ratio means you can be wrong 60% of the time and still make money. The math: 40 wins × 2R = +80R, 60 losses × 1R = -60R, net = +20R. This is why risk management beats prediction.`,
  },
  {
    id: "support-resistance",
    title: "Support & Resistance Zones",
    subtitle: "Where price decisions happen",
    definition: "Support is a price level where buying pressure overcomes selling pressure. Resistance is where selling overcomes buying. These are zones, not precise lines — price can wick through before reversing.",
    signal: "Trade at the edges, not the middle. Buy near support in ranges. Sell near resistance. In trends, buy pullbacks to previous resistance-turned-support.",
    quote: "The trend is your friend until it ends.",
    quoteAuthor: "Unknown (trader proverb)",
    learnMore: `ICT (Inner Circle Trader) adds institutional context: liquidity grabs. Price often sweeps above/below key levels to trigger retail stop losses, then reverses. This is why stop placement should account for wicks, not just the level itself. Place stops beyond the zone, not on it.`,
  },
  {
    id: "multi-timeframe",
    title: "Multi-Timeframe Analysis",
    subtitle: "Align three timeframes for edge",
    definition: "Use a higher timeframe for trend direction, a trading timeframe for setup identification, and an execution timeframe for precise entry and stop placement.",
    signal: "Daily chart says uptrend → 1H chart shows pullback → 5M chart gives hammer candle entry with tight stop.",
    quote: "The higher timeframe is the boss. Never fight it.",
    quoteAuthor: "ICT (Michael J. Huddleston)",
    learnMore: `This is how professional traders avoid getting chopped. The daily/4H chart defines the bias. You only take long setups when the higher timeframe is bullish. Counter-trend trades need 2:1 better risk-reward to justify the lower probability. Timeframe alignment filters out 70% of bad trades.`,
  },
  {
    id: "market-regime",
    title: "Market Regime Detection",
    subtitle: "Trade what the market is doing",
    definition: "Markets are either trending, ranging, or in high volatility. Each regime requires a different strategy. Using a trend strategy in a range = death by a thousand cuts.",
    signal: "Trending: follow momentum, buy pullbacks. Ranging: fade extremes, buy support, sell resistance. High vol: reduce size or sit out entirely.",
    quote: "There is a time to go long, a time to go short, and a time to go fishing.",
    quoteAuthor: "Jesse Livermore",
    learnMore: `2026's best traders use regime detection as their first filter. Bollinger Band width < 2% = squeeze (volatility expansion coming). ADX > 40 = strong trend. ATR expanding = volatility rising, reduce position size by 50%. Adaptive bots that switch strategies by regime outperform static bots by 30%+.`,
  },
  {
    id: "news-reaction",
    title: "News Reaction Trading",
    subtitle: "Trade the reaction, not the headline",
    definition: "Markets do not move on news — they move on the DIFFERENCE between the news and what was expected. A 'bad' report that is less bad than feared = rally. A 'good' report priced in already = sell-off.",
    signal: "Fade the initial move 15-30 minutes after earnings/FOMC. The real direction emerges after emotional traders are stopped out.",
    quote: "Buy the rumor, sell the news. But the real money is in fading the overreaction.",
    quoteAuthor: "Bernard Baruch",
    learnMore: `Al Brooks says: stay out 15-30 minutes before and after major news. The initial spike is algorithmic and emotional. After that, price action reveals the true institutional bias. On the Trade Desk page, our news sentiment overlay scores headlines from -1 to +1 — combine this with technical levels for higher-probability entries.`,
  },
];

export default async function SchoolPage() {
  const fearGreed = await fetchFearGreed();
  const todaySignal = `${fgLabel(fearGreed.label).toUpperCase()} at ${fearGreed.score}/100 — ${fgBuffettAdvice(fearGreed.label)}`;

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Trading School</h1>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          From value investing foundations to professional day trading techniques.
        </p>
      </div>

      {/* Today's signal */}
      <div
        className="card"
        style={{ marginBottom: "var(--gap)", background: "var(--bg-surface)", borderColor: "var(--caution)" }}
      >
        <div className="t-micro" style={{ color: "var(--caution)", marginBottom: 6 }}>TODAY&apos;S SIGNAL</div>
        <div className="t-body">{setValuationContext(SET_PE)}</div>
        <div className="divider" style={{ margin: "10px 0" }} />
        <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{todaySignal}</div>
      </div>

      {/* Section: Day Trading */}
      <div className="t-micro" style={{ marginBottom: 12, color: "var(--bull)" }}>
        DAY TRADING FUNDAMENTALS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)", marginBottom: "var(--gap)" }}>
        {TRADING_CONCEPTS.map((concept, i) => (
          <ConceptCard key={concept.id} concept={concept} index={i} />
        ))}
      </div>

      {/* Section: Value Investing */}
      <div className="t-micro" style={{ marginBottom: 12, color: "var(--tech)" }}>
        VALUE INVESTING FOUNDATIONS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)", marginBottom: "var(--gap)" }}>
        {VALUE_CONCEPTS.map((concept, i) => (
          <ConceptCard key={concept.id} concept={concept} index={i + TRADING_CONCEPTS.length} />
        ))}
      </div>

      {/* Stats warning */}
      <div
        className="card"
        style={{
          background: "var(--bear-10)",
          borderColor: "var(--bear)",
          marginBottom: "var(--gap)",
        }}
      >
        <div className="t-micro" style={{ color: "var(--bear)", marginBottom: 6 }}>THE BRUTAL TRUTH</div>
        <div className="t-body" style={{ color: "var(--bear)", fontSize: "0.8rem", lineHeight: 1.6 }}>
          ~90% of day traders lose money within the first year. ~80% quit within 2 years.
          The 10% who survive share four traits: they risk 1-2% per trade, they journal every trade,
          they have a defined edge, and they understand that psychology is 80% of the game.
          This school exists to put you in the 10%.
        </div>
      </div>

      {/* Attribution */}
      <div
        className="card"
        style={{
          marginTop: "var(--gap)",
          padding: "16px",
          background: "transparent",
          borderColor: "var(--dim)",
          textAlign: "center",
        }}
      >
        <div className="t-micro" style={{ marginBottom: 8 }}>SOURCE MATERIAL</div>
        <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.6 }}>
          <em>The Intelligent Investor</em> — Benjamin Graham ·{" "}
          <em>Brooks Trading Course</em> — Al Brooks ·{" "}
          <em>ICT Mentorship</em> — Michael J. Huddleston ·{" "}
          <em>Poor Charlie&apos;s Almanack</em> — Charlie Munger ·{" "}
          <em>Berkshire Hathaway Annual Letters</em> — Warren Buffett
        </div>
      </div>
    </div>
  );
}

function ConceptCard({ concept, index }: { concept: Concept; index: number }) {
  const ACCENT_COLORS = ["var(--bull)", "var(--caution)", "var(--tech)", "var(--bear)", "var(--bull)", "var(--caution)", "var(--tech)", "var(--bear)", "var(--bull)", "var(--caution)", "var(--tech)"];
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <details
      className="card"
      style={{ borderLeft: `3px solid ${accent}`, padding: 0 }}
    >
      <summary
        style={{
          padding: "16px",
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          minHeight: 44,
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="t-body" style={{ fontWeight: 700, color: accent }}>{concept.title}</div>
          <div className="t-micro" style={{ marginTop: 2 }}>{concept.subtitle}</div>
        </div>
        <div
          style={{
            color: "var(--muted)",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          ▾
        </div>
      </summary>

      <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--line)" }}>
        {/* Definition */}
        <div className="t-body" style={{ marginTop: 14, lineHeight: 1.6 }}>
          {concept.definition}
        </div>

        {/* Signal box */}
        <div
          style={{
            background: "var(--bg-hover)",
            padding: "10px 12px",
            margin: "12px 0",
            borderLeft: `2px solid ${accent}`,
          }}
        >
          <div className="t-micro" style={{ color: accent, marginBottom: 4 }}>HOW TO APPLY</div>
          <div className="t-body" style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
            {concept.signal}
          </div>
        </div>

        {/* Learn more */}
        <div className="t-body" style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>
          {concept.learnMore}
        </div>

        {/* Quote */}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div
            className="t-body"
            style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--ink)", lineHeight: 1.6, marginBottom: 6 }}
          >
            &ldquo;{concept.quote}&rdquo;
          </div>
          <div className="t-micro">{concept.quoteAuthor}</div>
        </div>
      </div>
    </details>
  );
}
