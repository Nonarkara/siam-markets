# DayTraders

Mobile-first financial intelligence dashboard — Thai market (SET) + global events, with day trading education, technical analysis, paper trading simulator, and Graham/Buffett/Munger value frameworks.

Live: https://nonarkara.org (Cloudflare Pages)

## Tech Stack

Next.js 16.2.1 + React 19 + TypeScript + Tailwind CSS v4 + Chart.js + Framer Motion + Supabase

## Build & Deploy

```bash
npm run dev              # dev server (webpack mode)
npm run build            # production build
npm run type-check       # tsc --noEmit — run before every commit
```

## Design Heritage (Hardcoded — Dr Non's Lineage)

This dashboard descends directly from **Dieter Rams** and **Braun**. Every new
component must answer "would this fit on a 1965 Braun travel clock?" before
it ships. If a thing is decorative — remove it. If a thing is informational —
expose it with mathematical precision. This is not a stylistic preference.
It's the project's DNA. Apply Rams' 10 principles to every UI decision:

1. **Innovative** — but never novelty for novelty's sake
2. **Useful** — every element must inform a decision
3. **Aesthetic** — calm, never loud
4. **Understandable** — self-explanatory, no manual needed
5. **Unobtrusive** — recede when not needed
6. **Honest** — never inflate; never hide
7. **Long-lasting** — avoids trend
8. **Thorough down to the last detail** — pixel alignment, kerning, hairline weights
9. **Environmentally friendly** — minimal weight, fast loads
10. **As little design as possible** — *less, but better* (weniger, aber besser)

Visual cues that belong to this heritage:
- Black or near-black backgrounds (#0d0d0d, never gradient)
- Hairline borders (1px, low-opacity white)
- Generous whitespace
- Helvetica / grotesque sans (Source Sans 3 is the project's stand-in)
- Monospace for all numerals (IBM Plex Mono)
- Single high-contrast accent — Braun yellow (#ffd000) or Braun orange (#ff5e00)
  may appear sparingly as a "second hand" callout. Never as a fill.
- Lowercase labels for cities/places when matching the GMT Weltzeit reference
- Dots as honest position markers (not decorative bullets)
- Vertical hairlines as the *only* "map" — geography is the timezone grid

Components that explicitly inherit this: `WorldMarketClock`, `TerminalChart`,
`CompactMacroStrip`. New components should reference these as templates.

## Design System

### Palette (Financial Dark)

```css
--bg: #0d0d0d;          /* near-black */
--bg-raised: #161616;
--bg-surface: #1e1e1e;
--ink: #e8e8e8;
--muted: #888884;
--line: #2a2a2a;

--bull: #00c896;         /* gain, buy signal */
--bear: #ff3b30;         /* loss, sell signal */
--caution: #ff9500;      /* watch, neutral */
--tech: #007aff;         /* UI chrome */

/* Braun accents — sparing, "second hand" callouts only */
--braun-yellow: #ffd000;
--braun-orange: #ff5e00;
```

### Typography (3 sizes — §11.7)

- **Display** (32px) — Josefin Sans — page title, hero numbers ONLY
- **Body** (14px) — Source Sans 3 — everything else
- **Micro** (11px) — Source Sans 3 uppercase — eyebrows, timestamps
- **Mono** — IBM Plex Mono — all numeric data values

### Mobile-First (§11.8)

- Base CSS: 390px. Desktop scales up at ≥1024px.
- Bottom nav on mobile (5 tabs), top nav on desktop.
- All touch targets ≥44px (min-height: 44px).
- Zero `border-radius` on any element — enforced via globals.css reset.

## Data Sources

| Data | Source | Cadence |
|---|---|---|
| SET50 prices | yfinance `.BK` tickers | Daily (ingestion/prices.py) |
| Fundamentals (P/E, P/B, ROE) | FMP free | Daily (ingestion/fundamentals.py) |
| Global indices | FMP free | Daily |
| Fear & Greed | feargreedchart.com (no key) | Live (5 min) |
| THB/USD | Bank of Thailand API | Daily |
| US macro (Fed rate, CPI) | FRED API | Daily (ingestion/macro.py) |
| Thai macro (GDP, CPI) | World Bank API | Weekly |
| World events + sentiment | GDELT DOC 2.0 | Live (15 min) |
| Technical indicators | Calculated client-side | Real-time |
| News sentiment | Finnhub / RSS + NLP | Real-time (when API connected) |

## Environment Variables

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
FMP_API_KEY=            # financialmodelingprep.com — free tier
FRED_API_KEY=           # fredaccount.stlouisfed.org/apikeys — free
BOT_API_KEY=            # portal.api.bot.or.th — free
```

## Key Files

| File | Purpose |
|---|---|
| `src/lib/technical.ts` | Technical analysis engine — EMA, RSI, MACD, BB, VWAP, ATR, patterns, regime detection, signal generation |
| `src/lib/trading.ts` | Paper trading simulator — position sizing, trade execution, P&L, performance metrics, Kelly criterion |
| `src/lib/graham.ts` | Graham/Buffett calculations — pure functions |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/format.ts` | Number/currency formatting |
| `src/lib/api/mock.ts` | Full mock data — app renders without any API keys |
| `src/app/page.tsx` | Market Pulse — SET, Fear & Greed, macro |
| `src/app/trade/page.tsx` | Trade Desk — technical indicators, signals, S/R, position sizer, news sentiment |
| `src/app/simulate/page.tsx` | Paper Trading Simulator — virtual portfolio, trade journal, performance metrics |
| `src/app/events/page.tsx` | World × Markets — GDELT events + SET correlation |
| `src/app/scanner/page.tsx` | Value Scanner — Graham/Buffett screening table |
| `src/app/portfolio/page.tsx` | Portfolio & Tax — RMF/ThaiESG/SSF calculator + projection |
| `src/app/school/page.tsx` | Trading School — day trading + value investing concepts |
| `src/app/api/technical/route.ts` | Technical indicators API endpoint |
| `ingestion/prices.py` | yfinance SET50 → Supabase |
| `ingestion/fundamentals.py` | FMP Graham metrics → Supabase |
| `ingestion/macro.py` | FRED + World Bank → Supabase |

## Technical Analysis Engine

All in `src/lib/technical.ts`:

- **EMA 9/21**: Trend momentum and crossover signals
- **RSI (14)**: Overbought (>70) / oversold (<30) detection
- **MACD**: Histogram divergence and crossover signals
- **Bollinger Bands**: Mean reversion and volatility squeeze detection
- **VWAP**: Institutional benchmark for bullish/bearish bias
- **ATR (14)**: Stop loss and volatility-based position sizing
- **Support/Resistance**: Zone detection with touch count and strength
- **Candlestick Patterns**: Doji, hammer, shooting star, engulfing, inside bar
- **Market Regime**: Trending up/down, ranging, high volatility
- **Signal Generator**: Multi-factor scoring (0-100 confidence) combining all indicators

## Paper Trading Simulator

All in `src/lib/trading.ts`:

- **Position Sizing**: Account risk % → shares based on entry-stop distance
- **Trade Execution**: Long/short entry with stop, target, and reason
- **P&L Tracking**: Realized and unrealized P&L per trade
- **Performance Metrics**: Win rate, profit factor, max drawdown, Sharpe ratio
- **Kelly Criterion**: Optimal bet sizing based on win rate and avg win/loss
- **The 1% Rule Check**: Automated feedback on trading performance

## Graham/Buffett Calculations

All in `src/lib/graham.ts`:

- **Graham Number**: `√(22.5 × EPS × BVPS)` — fair value ceiling
- **Margin of Safety**: `(GN − Price) / GN × 100` — ≥30% = strong, ≥15% = moderate
- **Defensive Score** (0–7): Graham's 7 criteria — P/E ≤15, P/B ≤1.5, ROE stable, etc.
- **Buffett Score** (0–10): ROE avg ≥20%, debt <1.0, FCF > NI, gross margin
- **Thai Tax Calc**: RMF/ThaiESG/SSF deductions + marginal rate → tax saved in THB
- **10-Year Projection**: lump sum + monthly contribution at 6/8/10% compound rates

## Thai Market Constants

```typescript
SET_CONSTANTS.historicalPeAvg = 17.89  // long-term SET P/E average
SET_CONSTANTS.grahamFairPe    = 15     // Graham's preferred threshold
SET_CONSTANTS.grahamCheapPe   = 12     // "deep value" zone for SET
```

## Anti-Regression — Do Not Touch

See `/Users/nonarkara/Projects/CLAUDE.md` §11 for workspace-wide rules. Project-specific:

1. **Zero border-radius — enforced in globals.css**. Do not remove the `border-radius: 0 !important` reset. It is load-bearing.
2. **Three font sizes only** — Display/Body/Micro. Do not introduce `1.1rem`, `0.82rem`, or any fourth size.
3. **Font stack** — Josefin Sans + Source Sans 3 + IBM Plex Mono + EB Garamond (serif). Never substitute Roboto, Inter, Poppins, or any banned font (§11.10).
4. **Palette** — `--bull: #00c896`, `--bear: #ff3b30`, `--caution: #ff9500`. Do not change accent colors without explicit approval.
5. **Mock data in `src/lib/api/mock.ts`** — the app must render fully with no API keys. Never remove mock fallbacks.
6. **Correlation disclaimer** — the `EventTimeline` component carries a note that events correlate but do not cause market moves. Do not remove this disclaimer.

## Design DNA — Hardcoded Rules (2026-05-25)

*Derived from Design_DNA_Aesthetic_Profile.md. Permanent operating rules for every surface in this project.*

### Token Semantics — Never Confuse These

| Token | Value | Role |
|---|---|---|
| `--amber-nav` | `#ffd000` | **Wayfinding only** — nav active state, tab underline. The Braun equals-key principle: one amber button in a grid of grey. |
| `--braun-yellow` | `#ffd000` | Sparing callout accent — "second hand" use only. Not for wayfinding. |
| `--bull` | `#00c896` | **Signal only** — gain, buy, positive state. Never use for navigation active state. |
| `--red-anchor` | `#e8002d` | **Brand identity only** — the Leica red dot / hinomaru wordmark marker. Never use for bull/bear state, never for alerts. |
| `--night` | `#0a0c12` | **Atmospheric surface** — Wong Kar-wai register. Use on interpretive/editorial panels (Signal Web regime, philosophy copy). Deeper than `--bg`. |

### Typography Register

- **`--font-serif` (`EB Garamond`)** — editorial counterpart to the Swiss grid. Use for: regime interpretation copy, trading philosophy quotes, any paragraph that *interprets* rather than *reports*. Always italic at body size.
- **`.t-serif`** class = `font-family: var(--font-serif); font-style: italic; line-height: 1.7`. Use instead of inline fontStyle/fontSize.
- The serif and sans never compete on the same surface. Serif = mood/interpretation. Sans = data/labels.

### Permanent UI Elements

- **Heartbeat line** — 1px amber (`--amber-nav`) fixed stripe at `top: 0`, `z-index: 200`. Added via `.heartbeat-line` class in TopNav. Never remove. Never recolor. It is the project's permanent signature.
- **Red dot wordmark** — 5×5px `--red-anchor` square inline after DAYTRADERS in TopNav. Brand identity, not decoration. Never remove.

### The Braun Principle Applied

- Amber = wayfinding. Green = signal (gain). Red = signal (loss) or brand identity. These three channels must never bleed into each other.
- If you see `color: active ? "var(--bull)"` on a nav element: that is a regression. Replace with `var(--amber-nav)`.
- If you see the red anchor (`--red-anchor`) on a P&L row or market signal: that is a regression. The red anchor is for the wordmark only.

## Pages & Routes

| Route | Page | Data |
|---|---|---|
| `/` | Market Pulse | SET, global indices, Fear & Greed, macro |
| `/trade` | Trade Desk | Technical indicators, AI signals, S/R, position sizer, news |
| `/simulate` | Simulator | Paper trading with journal and performance metrics |
| `/events` | World × Markets | GDELT events + SET/SPX price correlation |
| `/scanner` | Value Scanner | SET50 Graham/Buffett screener |
| `/portfolio` | Portfolio & Tax | RMF/ThaiESG calculator + 10yr projection |
| `/school` | Trading School | Day trading + value investing concepts |

## Philosophy

This dashboard teaches both **short-term tactical trading** (technical analysis, risk management, news reaction) and **long-term value investing** (Graham/Buffett/Munger frameworks). The two are complementary:

- **Value investing filters WHAT to trade** — only quality companies with margin of safety
- **Technical analysis filters WHEN to trade** — precise entries, defined stops, clear targets
- **Risk management ensures you SURVIVE** — 1% rule, position sizing, journaling

> "Quality at a reasonable price" becomes "Quality at a technical entry."
