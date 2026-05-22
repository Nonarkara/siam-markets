-- ─── GISTDA Thailand Geospatial Schema ────────────────────────────────
-- Run once in Supabase SQL editor.
-- Three tables corresponding to the three GISTDA ingestion streams.

-- 1. Fire Hotspots (MODIS + VIIRS daily)
CREATE TABLE IF NOT EXISTS gistda_hotspots (
    id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    date        date    NOT NULL,
    source      text    NOT NULL,   -- "MODIS" | "VIIRS"
    lon         float,
    lat         float,
    brightness  float,              -- brightness temperature (Kelvin)
    confidence  text,               -- "HIGH" | "NOMINAL" | "LOW" or numeric
    satellite   text,               -- "TERRA" | "AQUA" | "NOAA-20"
    acq_date    text,
    frp         float,              -- fire radiative power (MW)
    province    text,
    raw         text,               -- truncated raw attributes JSON
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotspots_date     ON gistda_hotspots (date DESC);
CREATE INDEX IF NOT EXISTS idx_hotspots_province ON gistda_hotspots (province, date DESC);

-- Daily summary view (used by API + dashboard)
CREATE OR REPLACE VIEW gistda_hotspots_daily AS
  SELECT
    date,
    source,
    count(*)                                                          AS count,
    count(*) FILTER (WHERE confidence IN ('HIGH','H','100','NOMINAL')) AS high_conf_count,
    array_agg(DISTINCT province) FILTER (WHERE province IS NOT NULL) AS provinces
  FROM gistda_hotspots
  GROUP BY date, source
  ORDER BY date DESC;

-- 2. Flood Extent (daily polygon aggregates)
CREATE TABLE IF NOT EXISTS gistda_floods (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date            date NOT NULL,
    region          text NOT NULL,  -- "national" | "central" | "northeast"
    feature_count   int,
    total_area_km2  float,
    provinces       jsonb,          -- array of flooded province names
    raw_sample      text,
    created_at      timestamptz DEFAULT now(),
    UNIQUE (date, region)
);

CREATE INDEX IF NOT EXISTS idx_floods_date ON gistda_floods (date DESC);

-- 3. Air Quality — hourly station readings
CREATE TABLE IF NOT EXISTS gistda_airquality (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date        date NOT NULL,
    station_id  text,
    station     text,
    province    text,
    lon         float,
    lat         float,
    pm25_ugm3   float,
    aqi         float,
    aqi_level   text,   -- "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy" | "Hazardous"
    timestamp   text,
    raw         text,
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aq_date     ON gistda_airquality (date DESC);
CREATE INDEX IF NOT EXISTS idx_aq_province ON gistda_airquality (province, date DESC);

-- Northern Thailand PM2.5 summary view (tourism sector signal)
CREATE OR REPLACE VIEW gistda_north_pm25 AS
  SELECT
    date,
    round(avg(pm25_ugm3)::numeric, 1)                    AS avg_pm25,
    round(max(pm25_ugm3)::numeric, 1)                    AS max_pm25,
    count(*)                                              AS station_count,
    count(*) FILTER (WHERE pm25_ugm3 > 75)               AS unhealthy_count
  FROM gistda_airquality
  WHERE province IN (
    'เชียงใหม่','เชียงราย','แม่ฮ่องสอน','ลำพูน','ลำปาง','พะเยา','น่าน','แพร่',
    'Chiang Mai','Chiang Rai','Mae Hong Son','Lamphun','Lampang','Phayao','Nan','Phrae'
  )
  GROUP BY date
  ORDER BY date DESC;

-- 4. GISTDA Sector Signals (pre-computed by ingestion script)
CREATE TABLE IF NOT EXISTS gistda_sector_signals (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date        date NOT NULL UNIQUE,
    signals     jsonb NOT NULL,  -- {AGRICULTURE: {score, color, reason, affected}, ...}
    hotspot_count  int,
    flood_area_km2 jsonb,        -- {national, central, northeast}
    air_stations   int,
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sector_signals_date ON gistda_sector_signals (date DESC);
