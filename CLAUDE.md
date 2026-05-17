# SIAM MARKETS

Mobile-first financial intelligence dashboard — Thai market (SET) + global events, interpreted through Graham/Buffett/Munger frameworks.

Live: TBD (Cloudflare Pages)

## Tech Stack

Next.js 16.2.1 + React 19 + TypeScript + Tailwind CSS v4 + Chart.js + Framer Motion + Supabase

## Build & Deploy

```bash
npm run dev              # dev server (webpack mode)
npm run build            # production build
npm run type-check       # tsc --noEmit — run before every commit
```

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
| `src/lib/graham.ts` | All Graham/Buffett calculations — pure functions |
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/format.ts` | Number/currency formatting |
| `src/lib/api/mock.ts` | Full mock data — app renders without any API keys |
| `src/app/page.tsx` | Market Pulse — SET, Fear & Greed, macro |
| `src/app/scanner/page.tsx` | Value Scanner — Graham/Buffett screening table |
| `src/app/events/page.tsx` | World × Markets — GDELT events + SET correlation |
| `src/app/portfolio/page.tsx` | Tax calculator (RMF/ThaiESG/SSF) + projection |
| `src/app/school/page.tsx` | 5 investment concepts — Graham, Buffett, Munger |
| `ingestion/prices.py` | yfinance SET50 → Supabase |
| `ingestion/fundamentals.py` | FMP Graham metrics → Supabase |
| `ingestion/macro.py` | FRED + World Bank → Supabase |

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
3. **Font stack** — Josefin Sans + Source Sans 3 + IBM Plex Mono. Never substitute Roboto, Inter, Poppins, or any banned font (§11.10).
4. **Palette** — `--bull: #00c896`, `--bear: #ff3b30`, `--caution: #ff9500`. Do not change accent colors without explicit approval.
5. **Mock data in `src/lib/api/mock.ts`** — the app must render fully with no API keys. Never remove mock fallbacks.
6. **Investment philosophy** — this dashboard is built on **long-term value investing** (Graham/Buffett/Munger), not day trading. Do not add features that encourage short-term speculation: no intraday price feeds, no trading signals, no margin calls, no derivatives.
7. **Correlation disclaimer** — the `EventTimeline` component carries a note that events correlate but do not cause market moves. Do not remove this disclaimer.

## Pages & Routes

| Route | Page | Data |
|---|---|---|
| `/` | Market Pulse | SET, global indices, Fear & Greed, macro |
| `/events` | World × Markets | GDELT events + SET/SPX price correlation |
| `/scanner` | Value Scanner | SET50 Graham/Buffett screener |
| `/portfolio` | Portfolio & Tax | RMF/ThaiESG calculator + 10yr projection |
| `/school` | Investment School | 5 concepts — expandable cards |
