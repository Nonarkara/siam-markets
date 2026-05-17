import { setValuationContext } from "@/lib/graham";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fgLabel, fgBuffettAdvice } from "@/lib/graham";
import type { Concept } from "@/lib/types";

export const revalidate = 3600;

const SET_PE = 15.4;
const CAPE = 34.2;

const CONCEPTS: Concept[] = [
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

export default async function SchoolPage() {
  const fearGreed = await fetchFearGreed();
  const todaySignal = `${fgLabel(fearGreed.label).toUpperCase()} at ${fearGreed.score}/100 — ${fgBuffettAdvice(fearGreed.label)}`;

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Investment School</h1>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          Decades of wisdom from Graham, Buffett, and Munger — translated for the real world.
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

      {/* Concept cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
        {CONCEPTS.map((concept, i) => (
          <ConceptCard key={concept.id} concept={concept} index={i} />
        ))}
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
          <em>The Intelligent Investor</em> — Benjamin Graham (1949) ·{" "}
          <em>Berkshire Hathaway Annual Letters</em> — Warren Buffett (1965–2025) ·{" "}
          <em>Poor Charlie&apos;s Almanack</em> — Charlie Munger
        </div>
      </div>
    </div>
  );
}

function ConceptCard({ concept, index }: { concept: Concept; index: number }) {
  const ACCENT_COLORS = ["var(--bull)", "var(--caution)", "var(--tech)", "var(--bear)", "var(--bull)"];
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
          <div className="t-micro" style={{ color: accent, marginBottom: 4 }}>CURRENT SIGNAL</div>
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
