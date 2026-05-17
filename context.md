# SIAM MARKETS — Live Config

## API Keys

Set these in `.env.local` (never commit):

```
SUPABASE_URL=            # From Supabase project settings
SUPABASE_ANON_KEY=       # Public anon key
SUPABASE_SERVICE_KEY=    # Secret service key (for ingestion scripts only)

FMP_API_KEY=             # Free at: https://financialmodelingprep.com/developer/docs
                         # 250 requests/day · no CC required

FRED_API_KEY=            # Free at: https://fredaccount.stlouisfed.org/apikeys
                         # 120 requests/minute · no CC required

BOT_API_KEY=             # Free at: https://portal.api.bot.or.th
                         # Official Bank of Thailand exchange rate API
```

## Supabase Tables (when ready to connect)

```sql
-- Daily stock prices
CREATE TABLE prices (
  symbol      TEXT,
  date        DATE,
  close       NUMERIC,
  updated_at  TIMESTAMPTZ,
  PRIMARY KEY (symbol, date)
);

-- Graham/Buffett fundamentals
CREATE TABLE fundamentals (
  symbol          TEXT PRIMARY KEY,
  name            TEXT,
  sector          TEXT,
  price           NUMERIC,
  eps             NUMERIC,
  bvps            NUMERIC,
  pe              NUMERIC,
  pb              NUMERIC,
  roe             NUMERIC,
  dividend_yield  NUMERIC,
  debt_to_equity  NUMERIC,
  gross_margin    NUMERIC,
  graham_number   NUMERIC,
  margin_of_safety NUMERIC,
  market_cap      NUMERIC,
  updated_at      TIMESTAMPTZ
);

-- Macro indicators
CREATE TABLE macro_indicators (
  key         TEXT PRIMARY KEY,   -- "us_fed_rate", "th_gdp_growth"
  value       NUMERIC,
  date        DATE,
  updated_at  TIMESTAMPTZ
);
```

## Notes

- All pages render with mock data when no API keys are set.
- Run `ingestion/prices.py` and `ingestion/fundamentals.py` daily after 18:00 Bangkok.
- Run `ingestion/macro.py` weekly (data changes slowly).
- yfinance occasionally rate-limits — the ingestion script handles this gracefully.
- GDELT is live in the `/api/events` route; Supabase not required for events.
- FearGreedChart.com requires no API key and is called directly from the API route.
