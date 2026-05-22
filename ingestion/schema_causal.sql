-- ─── Causal Intelligence Schema ──────────────────────────────────────
-- Run once in Supabase SQL editor to create the analytics tables.
-- Separate from operational price/fundamental tables.
-- All tables have RLS disabled (read-only public data; tighten if needed).

-- ─── 1. Granger Causality Signal Table ────────────────────────────────
-- Stores bivariate Granger test results: does driver Granger-cause target?
-- Populated weekly by ingestion/granger.py

CREATE TABLE IF NOT EXISTS granger_signals (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date      date     NOT NULL,   -- date this batch ran
    driver        text     NOT NULL,   -- e.g. "VIX", "OIL_WTI", "FED_RATE"
    driver_label  text     NOT NULL,   -- human label e.g. "CBOE VIX"
    target        text     NOT NULL DEFAULT 'SET',
    lag_days      int      NOT NULL,   -- lag tested (1, 3, 5, 10)
    f_stat        float,
    p_value       float    NOT NULL,
    is_significant boolean GENERATED ALWAYS AS (p_value < 0.05) STORED,
    direction     text     NOT NULL DEFAULT 'driver→SET',  -- or 'SET→driver'
    n_obs         int,                 -- observations used
    data_from     date,
    data_to       date,
    created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_granger_run_date ON granger_signals (run_date DESC);
CREATE INDEX IF NOT EXISTS idx_granger_driver   ON granger_signals (driver);

-- Latest run only view
CREATE OR REPLACE VIEW granger_latest AS
  SELECT DISTINCT ON (driver, lag_days, direction)
    driver, driver_label, target, lag_days, f_stat, p_value,
    is_significant, direction, n_obs, data_from, data_to, run_date
  FROM granger_signals
  ORDER BY driver, lag_days, direction, run_date DESC;

-- ─── 2. Structural Breaks (ruptures) ──────────────────────────────────
-- One row per detected change-point in the series.
-- Populated weekly by ingestion/breaks.py

CREATE TABLE IF NOT EXISTS structural_breaks (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date         date     NOT NULL,
    break_date       date     NOT NULL,
    series           text     NOT NULL DEFAULT 'SET',   -- which series
    break_series     text     NOT NULL,                 -- e.g. "returns", "volatility"
    cost_model       text     NOT NULL DEFAULT 'rbf',   -- ruptures cost model
    penalty          float,                             -- penalty used
    regime_before    text,    -- e.g. "low-vol-bull"
    regime_after     text,
    mean_before      float,
    mean_after       float,
    std_before       float,
    std_after        float,
    -- GDELT events in the 1–7 days before this break
    preceding_events jsonb DEFAULT '[]',
    created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breaks_break_date ON structural_breaks (break_date DESC);
CREATE INDEX IF NOT EXISTS idx_breaks_series     ON structural_breaks (series, break_series);

-- ─── 3. Market Regime Classifications (GMM) ───────────────────────────
-- Daily: which regime is today's market in?
-- Populated daily by ingestion/regime.py

CREATE TABLE IF NOT EXISTS market_regimes (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date         date     NOT NULL UNIQUE,
    regime       text     NOT NULL,   -- "bull", "bear", "ranging"
    bull_prob    float    NOT NULL,
    bear_prob    float    NOT NULL,
    ranging_prob float    NOT NULL,
    -- Features used for classification
    set_return_5d  float,
    set_return_20d float,
    set_vol_20d    float,
    vix            float,
    thb_change_5d  float,
    dxy_change_5d  float,
    created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regime_date ON market_regimes (date DESC);

-- ─── 4. SET Forecast (darts) ──────────────────────────────────────────
-- 5-day ahead probabilistic forecast for SET index.
-- Populated daily by ingestion/forecast.py

CREATE TABLE IF NOT EXISTS set_forecast (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_date date     NOT NULL,   -- when this was generated
    target_date   date     NOT NULL,   -- the date being forecast
    predicted     float    NOT NULL,
    lower_80      float,
    upper_80      float,
    lower_95      float,
    upper_95      float,
    model         text     NOT NULL DEFAULT 'lgbm',
    covariates    text[],              -- which macro vars were included
    created_at    timestamptz DEFAULT now(),
    UNIQUE (forecast_date, target_date, model)
);

CREATE INDEX IF NOT EXISTS idx_forecast_dates ON set_forecast (forecast_date DESC, target_date);

-- ─── 5. Sentiment Daily ────────────────────────────────────────────────
-- Daily aggregate sentiment from English + Thai financial news.
-- Populated daily by ingestion/sentiment.py

CREATE TABLE IF NOT EXISTS sentiment_daily (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date            date     NOT NULL,
    lang            text     NOT NULL,    -- "en", "th"
    source          text     NOT NULL,    -- "reuters_rss", "thairath_rss", etc.
    pos_count       int      NOT NULL DEFAULT 0,
    neg_count       int      NOT NULL DEFAULT 0,
    neu_count       int      NOT NULL DEFAULT 0,
    avg_score       float    NOT NULL DEFAULT 0.0,   -- -1 bearish … +1 bullish
    total_articles  int      NOT NULL DEFAULT 0,
    sample_headlines jsonb   DEFAULT '[]',
    model_used      text     DEFAULT 'finbert',
    created_at      timestamptz DEFAULT now(),
    UNIQUE (date, lang, source)
);

CREATE INDEX IF NOT EXISTS idx_sentiment_date ON sentiment_daily (date DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_lang ON sentiment_daily (lang, date DESC);

-- ─── 6. Transfer Entropy Pairs ────────────────────────────────────────
-- Optional: nonlinear causality between key series pairs.
-- Populated monthly by ingestion/transfer_entropy.py

CREATE TABLE IF NOT EXISTS transfer_entropy (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date       date  NOT NULL,
    source_series  text  NOT NULL,
    target_series  text  NOT NULL,
    lag_days       int   NOT NULL,
    te_value       float NOT NULL,
    te_shuffled    float,             -- null model (shuffled baseline)
    is_significant boolean,
    window_days    int   NOT NULL DEFAULT 504,
    created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_te_run_date ON transfer_entropy (run_date DESC);
