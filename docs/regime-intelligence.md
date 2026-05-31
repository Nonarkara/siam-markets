# Market Regime Intelligence

Compiled 2026-06-01. This document records why the Regime page exists, what it reads, and how to treat its output.

## Why This Exists

DayTraders already answers three questions well:

- what is moving now
- what is cheap enough to deserve attention
- how much risk a trade can take

The missing question was upstream of all three: **what kind of market are we standing in?**

The `/regime` page is the gate before trading, portfolio allocation, and planning. It does not predict the future. It classifies the current tape so the rest of the app can change its posture before the user reaches for risk.

## Data Contract

`/api/regime` returns:

```ts
interface RegimeSummary {
  today: RegimeDay;
  regime_counts_60d: Record<"bull" | "bear" | "ranging", number>;
  history: RegimeDay[];
  run_date: string;
  note: string;
  source: "supabase" | "demo";
}
```

`RegimeDay` contains bull, bear, and ranging probabilities plus optional context fields:

- `set_return_5d`
- `set_vol_20d`
- `vix`

When Supabase has `market_regimes` rows, the API labels the output `source: "supabase"`. When not, it uses the deterministic demo fallback in `src/lib/regime.ts` and labels it `source: "demo"`.

## Classification Meaning

| Regime | Meaning | Default posture |
|---|---|---|
| `bull` | Trend and liquidity are constructive. | Risk-on, but still require valuation and stops. |
| `ranging` | Direction is unresolved. | Smaller trades, take profits near edges, keep cash optionality. |
| `bear` | Capital preservation dominates. | Defensive Graham split, quality first, no casual averaging down. |

The UI shows probability, evidence, 60-day tape, and a contextual allocation stance. The stance is not a portfolio order.

## Methodology

The intended live classifier is a 3-component GMM over SET returns, volatility, VIX, THB, and macro context, populated into Supabase by `ingestion/regime.py`.

The fallback is deterministic by design:

- no `Math.random()`
- stable for a given run date
- visually useful for development
- clearly labeled as demo data

## Intellectual Honesty Rules

- Regime is context, not prophecy.
- Low volatility is not the same as low risk.
- A bull regime does not override Graham valuation.
- A bear regime does not forbid buying; it raises the required margin of safety.
- Demo fallback must never be presented as live model output.

## Connected Surfaces

- `/regime`: source of truth for current market context.
- `/trade`: position size and trade aggressiveness should respect regime.
- `/money`: entry-regime gap explains why timing and valuation mattered.
- `/plan`: savings and cash runway should be protected before speculative risk.

The goal is not prediction theater. The goal is disciplined context.
