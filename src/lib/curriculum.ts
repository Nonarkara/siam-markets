export type Station = {
  id: string;
  title: string;
  subtitle: string;
  definition: string;
  signal: string;
  quote: string;
  quoteAuthor: string;
  learnMore: string;
  kanji: string;
};

export type TransitLine = {
  id: string;
  name: string;
  color: string;
  stations: Station[];
};

export const CURRICULUM: TransitLine[] = [
  {
    id: "value",
    name: "Value Line",
    color: "var(--tech)", // Blue-ish
    stations: [
      {
        id: "margin-of-safety",
        kanji: "防", // Defense
        title: "Margin of Safety",
        subtitle: "Graham's central principle",
        definition: "Buy a stock only when its price is significantly below what it is actually worth — so you are protected even if your analysis is wrong.",
        signal: "Graham Number is a stock's fair value ceiling. A 30%+ gap between price and Graham Number = strong safety.",
        quote: "The margin of safety is always dependent on the price paid. It will be large at one price, small at some higher price, nonexistent at some still higher price.",
        quoteAuthor: "Benjamin Graham",
        learnMore: "If you calculate that a company is worth ฿100 but its stock trades at ฿65, you have a 35% margin of safety. Graham said: always demand at least 25–33%. This cushion protects you against calculation errors, unexpected bad news, or just being wrong.",
      },
      {
        id: "mr-market",
        kanji: "狂", // Madness
        title: "Mr. Market",
        subtitle: "Graham's emotional market metaphor",
        definition: "Imagine the stock market as a moody business partner who offers to buy or sell your stake every day — at wildly irrational prices. Your job is to exploit his mood swings, not follow them.",
        signal: "Mr. Market today: see the Fear & Greed dial on the Pulse screen for his current mood.",
        quote: "Mr. Market is there to serve you, not to guide you.",
        quoteAuthor: "Benjamin Graham",
        learnMore: "When Mr. Market is panicked (Fear & Greed below 25), prices are often irrationally low — that is when Graham and Buffett buy. When he is euphoric (above 75), prices are often irrationally high — that is when they hold cash.",
      },
      {
        id: "economic-moat",
        kanji: "城", // Castle
        title: "Economic Moat",
        subtitle: "Buffett's competitive advantage framework",
        definition: "A sustainable business advantage that protects a company from competition the way a moat protects a castle.",
        signal: "4 moat types: Cost Advantage, Switching Costs, Network Effect, Intangible Assets.",
        quote: "The key to investing is determining the competitive advantage of any given company and, above all, the durability of that advantage.",
        quoteAuthor: "Warren Buffett",
        learnMore: "Thai examples: ADVANC has switching costs. AOT has regulatory scale. CPALL has network effects across 14,000+ stores. These moats are why Buffett prefers holding periods of 10+ years.",
      },
      {
        id: "intrinsic-value",
        kanji: "本", // Intrinsic/Root
        title: "Intrinsic Value",
        subtitle: "The discounted cash flow reality",
        definition: "The present value of all future cash flows a business will generate over its lifetime.",
        signal: "If Intrinsic Value > Price, the stock is cheap. If Price > Intrinsic Value, it's expensive.",
        quote: "Price is what you pay. Value is what you get.",
        quoteAuthor: "Warren Buffett",
        learnMore: "A business is not a ticker symbol; it is an economic machine. The value of that machine is simply the cash it will spit out from now until judgment day, discounted back to today's purchasing power.",
      }
    ]
  },
  {
    id: "price-action",
    name: "Action Line",
    color: "var(--bull)", // Emerald
    stations: [
      {
        id: "price-action-pure",
        kanji: "裸", // Naked/Pure
        title: "Pure Price Action",
        subtitle: "Al Brooks' indicator-free method",
        definition: "Read the market purely from candlesticks and price structure. No RSI, no MACD — just the story each bar tells about the battle between buyers and sellers.",
        signal: "Every candle tells a story. A hammer at support with volume = buyers stepping in.",
        quote: "Trading is simple, but it is not easy. The hard part is controlling your emotions and following your rules.",
        quoteAuthor: "Al Brooks",
        learnMore: "Wait for the second entry (H2/L2) — if the first signal fails but the second confirms, probability is higher. Trade ranges at boundaries, trends on pullbacks.",
      },
      {
        id: "support-resistance",
        kanji: "壁", // Wall
        title: "Support & Resistance",
        subtitle: "Where price decisions happen",
        definition: "Support is a price level where buying pressure overcomes selling pressure. Resistance is where selling overcomes buying. These are zones, not precise lines.",
        signal: "Trade at the edges, not the middle. Buy near support in ranges. Sell near resistance.",
        quote: "The trend is your friend until it ends.",
        quoteAuthor: "Trader Proverb",
        learnMore: "ICT adds institutional context: liquidity grabs. Price often sweeps above/below key levels to trigger retail stop losses, then reverses. Stop placement should account for wicks.",
      },
      {
        id: "multi-timeframe",
        kanji: "層", // Layer
        title: "Multi-Timeframe Analysis",
        subtitle: "Align three timeframes for edge",
        definition: "Use a higher timeframe for trend direction, a trading timeframe for setup identification, and an execution timeframe for precise entry.",
        signal: "Daily chart says uptrend → 1H chart shows pullback → 5M chart gives entry.",
        quote: "The higher timeframe is the boss. Never fight it.",
        quoteAuthor: "ICT",
        learnMore: "The daily/4H chart defines the bias. You only take long setups when the higher timeframe is bullish. Timeframe alignment filters out 70% of bad trades.",
      },
      {
        id: "market-regime",
        kanji: "境", // Environment
        title: "Market Regime",
        subtitle: "Trade what the market is doing",
        definition: "Markets are either trending, ranging, or in high volatility. Each regime requires a different strategy.",
        signal: "Trending: follow momentum. Ranging: fade extremes. High vol: reduce size.",
        quote: "There is a time to go long, a time to go short, and a time to go fishing.",
        quoteAuthor: "Jesse Livermore",
        learnMore: "Using a trend strategy in a range = death by a thousand cuts. Adaptive bots that switch strategies by regime outperform static bots by 30%+.",
      }
    ]
  },
  {
    id: "risk",
    name: "Risk Line",
    color: "var(--caution)", // Amber
    stations: [
      {
        id: "one-percent-rule",
        kanji: "一", // One
        title: "The 1% Rule",
        subtitle: "The only holy grail in trading",
        definition: "Never risk more than 1-2% of your total capital on a single trade. This ensures that even a string of 10 losses cannot destroy your account.",
        signal: "Position Size = Risk Amount / (Entry - Stop).",
        quote: "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.",
        quoteAuthor: "Warren Buffett",
        learnMore: "A 1:2 risk-reward ratio means you can be wrong 60% of the time and still make money. 40 wins × 2R = +80R, 60 losses × 1R = -60R, net = +20R.",
      },
      {
        id: "stop-loss",
        kanji: "止", // Stop
        title: "The Hard Stop",
        subtitle: "Ego removal mechanism",
        definition: "An automated order to exit a losing position at a predetermined price. It separates your analytical brain from your panicked brain.",
        signal: "Set your stop before entering the trade. Never move it further away once in.",
        quote: "If you can't take a small loss, sooner or later you will take the mother of all losses.",
        quoteAuthor: "Ed Seykota",
        learnMore: "Amateurs move their stops because they can't admit they are wrong. Professionals know that taking a paper cut is better than an amputation.",
      },
      {
        id: "expectancy",
        kanji: "望", // Expectation
        title: "Expectancy Math",
        subtitle: "The casino edge",
        definition: "The average amount you expect to win or lose per trade over the long run. (Win% × Avg Win) - (Loss% × Avg Loss).",
        signal: "If Expectancy > 0, you are the casino. If < 0, you are the gambler.",
        quote: "I don't care if I win or lose a trade. I just want to follow my rules.",
        quoteAuthor: "Mark Douglas",
        learnMore: "You don't need to win 80% of the time. Trend followers often win 35% of the time, but their winners are 4x larger than their losers.",
      }
    ]
  },
  {
    id: "macro",
    name: "Macro Line",
    color: "var(--dim)", // Gray
    stations: [
      {
        id: "fed-rates",
        kanji: "金", // Gold/Money
        title: "Fed Funds Rate",
        subtitle: "The price of gravity",
        definition: "The interest rate at which banks lend to each other overnight. It sets the baseline cost of capital for the entire world.",
        signal: "When rates go up, growth stocks fall. When rates go down, risk assets rise.",
        quote: "Interest rates are to asset prices what gravity is to the apple.",
        quoteAuthor: "Warren Buffett",
        learnMore: "The Thai BOT must often follow the US Fed. If the US raises rates and Thailand doesn't, the THB weakens as capital flows out. Watch the spread.",
      },
      {
        id: "inflation",
        kanji: "膨", // Swell/Expand
        title: "Inflation & CPI",
        subtitle: "The silent thief",
        definition: "The rate at which the general level of prices for goods and services is rising, eroding purchasing power.",
        signal: "High inflation = Fed rate hikes = bad for stocks. Deflation = bad for economy.",
        quote: "Inflation is taxation without legislation.",
        quoteAuthor: "Milton Friedman",
        learnMore: "Assets like real estate, gold, and companies with pricing power survive inflation. Cash and long-term bonds get destroyed.",
      },
      {
        id: "yield-curve",
        kanji: "曲", // Curve
        title: "The Yield Curve",
        subtitle: "The ultimate recession predictor",
        definition: "A line plotting interest rates of bonds having equal credit quality but differing maturity dates. An inverted curve (2yr > 10yr) precedes recessions.",
        signal: "Inversion is a warning. Steepening AFTER an inversion is when the crash usually happens.",
        quote: "The bond market is the smart money. The stock market is the emotional money.",
        quoteAuthor: "Wall Street Adage",
        learnMore: "Why does inversion matter? Banks borrow short-term and lend long-term. When short-term rates are higher, bank lending halts. Credit dries up.",
      }
    ]
  }
];
