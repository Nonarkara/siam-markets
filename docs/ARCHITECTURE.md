# DayTraders — Architecture & Provenance

*The canonical map of the system, its data, and how it was built. Read this
before adding a feature, and especially before adding a number to the screen.*

Live: **day.nonarkara.org** · Repo: `Nonarkara/siam-markets` · Cloudflare Pages (edge)

---

## 1. What this is

A mobile-first financial-intelligence dashboard for the Thai market (SET) and the
world. It teaches both **value investing** (Graham / Buffett / Munger) and
**tactical reading** (technicals, cycles, macro), and it does so for *everyone* —
from a 22-year-old's first paycheck to a retiree managing draw-down.

It is built by a small swarm of AI agents working with Dr Non. That makes one
discipline non-negotiable: **honesty about data**. See §5 and `/integrity`.

## 2. Stack & deploy

- **Next.js 16 · React 19 · TypeScript · Tailwind v4**, deployed to **Cloudflare
  Pages** on the **edge runtime**.
- **The edge cannot run Python, `fs`, or Node-only SDKs.** Anything heavy runs
  *offline* and is committed as static JSON the app imports at build time.
- Deploy: `npm run build` → `npx @cloudflare/next-on-pages@latest` →
  `wrangler pages deploy .vercel/output/static --project-name siam-markets --branch main`.

## 3. The core pattern: offline compute → static JSON → edge import

This is the spine of the whole system. Heavy or credentialed work never runs at
request time. Instead an **ingestion script** produces a JSON file under
`src/lib/data/cache/`, which a route or component imports statically.

```
ingestion/<script>.py   ──►  src/lib/data/cache/<name>.json  ──►  edge route / component
   (M3, offline)                  (committed)                        (read-only)
```

| Engine (ingestion/) | Output | Consumed by |
|---|---|---|
| `prices.py` / `fetch_all_to_json.py` | `prices.json` (SET50 OHLCV) | `/api/ohlcv`, `/api/technical`, `/trade`, `/scan` |
| `optimize.py` (Riskfolio-Lib) | `allocation.json` | `/portfolio` · Optimizer tab |
| `forward_view.py` | `forward-view.json` | `/signals` Forward View, `/money` hover cones |
| `track_dream.py` | `dream-history.json` | `/money` · Mine-vs-Dream proxy trends |
| `alphaearth.py` (GEE, **pending auth**) | `earth-signal.json` | `/signals` · Earth Signal |
| `forecast.py` (darts) | `forecast_latest.json` / Supabase | DESK forecast |
| `causal_data.py` → `granger/regime/breaks.py` | Supabase / JSON | `/api/granger`, `/api/regime`, `/events` |

Orchestrated by `ingestion/run_daily.py` (cron-friendly). Heavy solver deps live
in `ingestion/requirements_opt.txt` (opt-in).

## 4. Routes & surfaces

| Route | Nav label | What it is |
|---|---|---|
| `/` | DESK | Command center: 2×2 PULSE/SCAN/INTEL/MONEY quadrants + desktop "Are you positioned?" strip (book × forward) |
| `/markets` | MARKETS | World map + market columns |
| `/signals` | SIGNALS | **Intelligence hub**: Market Web (relationships) + Forward View (TimesFM/cone) + Earth Signal (AlphaEarth) |
| `/scan` | BUYS | Graham/Buffett screener + Dividend Aristocrats |
| `/funds` | FUNDS | Fund search & comparison |
| `/money` | PORTFOLIO | **Mine vs Dream** (real book + hover history) · Tax · Projection · Optimizer · Perfect Portfolio |
| `/plan` | PLAN | Age-adaptive wizard: START→YOU→MONEY→NEEDS→INVEST + AgeLens (4 life stages) |
| `/trade` | TRADE | Trade Desk: indicators, levels, fundamentals, flow, macro |
| `/about` | ABOUT | Story |
| `/integrity` | *(footer)* | **Data provenance ledger** — every number, sourced (§5) |

Nav: `TopNav` (desktop) + `BottomNav` (mobile) → note "PORTFOLIO" routes to
`/money`, not `/portfolio`. (`/portfolio` exists but is not in the nav — a known
artifact; the live PORTFOLIO tab is `/money`.)

## 5. Data provenance — the trust spine

Because the app blends live feeds, offline snapshots, honest models, and mock
fallbacks, **every surface is cataloged** in `src/lib/provenance.ts` and rendered
at **`/integrity`** with its kind, source, method, freshness, and one stated
limitation (Dr Non §12.5).

Kinds: `live` · `cached` · `computed` · `illustrative` · `reference` · `yours` ·
`pending` · `mock`. The rule that governs everything: **never dress a fabricated
or synthetic number up as real.** Mock fallbacks exist so the app renders with
zero API keys — they are labeled, never hidden. The Forward View is an honest
vol-cone baseline (upgradeable to TimesFM), not a forecast claim. Earth Signal
shows *no* numbers until real Earth-Engine embeddings are pulled.

When you add or change a data surface, update `provenance.ts`. Keeping it honest
is a deliberate act, not an automated one.

## 6. Design DNA (hard rules)

Dieter Rams × Braun × Vignelli. Enforced, not stylistic:
- Zero `border-radius` (true circles excepted). No gradients (except dark photo
  overlays). No drop shadows (inset hairlines / focus rings only).
- **Three text sizes**: display 32 · body 14 · micro 11. Mono (IBM Plex Mono) for
  all numerals. Josefin Sans + Source Sans 3; Cormorant for elegant headlines.
- **One amber accent** (`--caution`); green/red reserved for market semantics.
- Mobile-first; every interactive target ≥ 44px. Full anti-regression law in the
  workspace `CLAUDE.md` §11.

## 7. Collaboration log — a history-making swarm build

This project was built by **Dr Non** directing a rotating set of AI agents, often
in parallel on the same tree. The record matters:

- **Claude (Anthropic)** — DESK command center & Market Web; the `/signals`
  Intelligence hub (TimesFM Forward View + AlphaEarth Earth Signal pipelines);
  the Riskfolio optimizer; the real-vs-dream portfolio + hover history on
  `/money`; the AgeLens life-stage adaptation; repeated reconciliation of
  parallel work, build-unblocking, and **this provenance + integrity layer**.
- **Codex (OpenAI)** — the original command-center redesign and several
  supporting routes/components.
- **Kimi (Moonshot)** — the plan-tab wizard refactor (savings pile, needs
  breakdown, healthcare/mortgage), the 4-band AgeLens extension, and the Firebase
  analytics layer.

Lessons paid for in this build, now law:
1. **Reachability** — ship on the route the nav actually opens (the portfolio
   analysis sat unreachable on `/portfolio` while PORTFOLIO → `/money`).
2. **One shared tree, many hands** — commit consistent, buildable units; preserve
   parallel work rather than clobber it; never leave HEAD broken.
3. **The edge is strict** — no `fs`, no Node SDKs in routes; offline → JSON.
4. **Honesty over polish** — a labeled mock beats a convincing fake; a pending
   pipeline beats fabricated satellite numbers.

## 8. Where to look first

- Add a number → `src/lib/provenance.ts` + `/integrity`.
- Add offline data → an `ingestion/*.py` → `src/lib/data/cache/*.json`.
- Portfolio data → `src/lib/portfolio-data.ts` (`REAL_HOLDINGS` = your book).
- Design tokens → `src/app/globals.css`.
- The rules → workspace `CLAUDE.md` (§11 anti-regression, §12 voice/integrity).
