# DayTraders — Live Config

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

## GISTDA API
GISTDA_API_KEY=        # PUSH TO CLOUDFLARE PAGES SECRETS — NEVER PASTE HERE
Base URL: https://api.gistda.or.th

## GISTDA API — Full Catalog (researched 2026-05-20)

### System A: Sphere API (uses Dr Non's API key)
Base: https://api.sphere.gistda.or.th
Auth: ?key=API_KEY query param
Services:
  - /services/geo/elevation?lon=LON&lat=LAT&key=KEY
  - /services/place/search?keyword=TEXT&key=KEY
  - /services/place/suggest?keyword=TEXT&key=KEY
  - /services/[nearPOI]?lon=LON&lat=LAT&span=DEG&limit=10&key=KEY
  - /services/[route]?...&key=KEY
  - /services/staticmap?...&key=KEY
  - /services/crop-info?...&key=KEY        ← seasonal agriculture data
  - /services/crop-suit?...&key=KEY        ← crop suitability zones
  - /services/disaster?...&key=KEY         ← disaster historical info

### System B: ArcGIS Portal (NO API KEY NEEDED)
Base: https://gistdaportal.gistda.or.th/data/rest/services
Query pattern: [ServiceURL]/[layerId]/query?where=1=1&outFields=*&f=geojson
Spatial filter: &geometry=LONMIN,LATMIN,LONMAX,LATMAX&geometryType=esriGeometryEnvelope

KEY DATASETS:
  Fire:
    /FR_Fire/hotspot_daily/MapServer/0/query         - MODIS daily hotspots
    /FR_Fire/hotspot_npp_daily/MapServer/0/query     - VIIRS 375m hotspots
    /FR_Fire/AirQuality_hourly/MapServer/0/query     - Hourly PM2.5
    /FR_Fire/AirQuality_daily/MapServer/0/query      - Daily AQI

  Flood:
    /FL_Flood/flood_daily/MapServer/0/query          - Real-time flood extent
    /FL_Flood/flood_daily_c/MapServer/0/query        - Central region
    /FL_Flood/flood_daily_ne/MapServer/0/query       - Northeast (rice belt)
    /FL_Flood/FL_RepeatedFlooding_GISTDA_50k_Y2005_Y2016/FeatureServer/0/query - Frequency map

  Agriculture:
    /L09_rice/Rice_YYYYMMDD/MapServer                - Rice cultivation archive
    /GMOS/SoilMoisture/MapServer/0/query             - Soil moisture (drought proxy)
    /GMOS/tree_stress/MapServer/0/query              - Vegetation health
    /GWater/WaterShortage_Area/MapServer/0/query     - Water shortage zones

  Land:
    /L09_Landuse/L09_Landuse_GISTDA_50k/MapServer   - Land use classification
    /EEC/Transportation/MapServer                    - EEC infrastructure
    /L10_Forest/L10_Forest_GISTDA_50k/MapServer     - Forest cover
    /L10_Forest/L10_FCDA_GISTDA_50k/MapServer       - Deforestation detection

  Admin:
    /L05_AdminBoundary/L05_Province_GISTDA_50k/MapServer  - 77 provinces
    /L05_AdminBoundary/L05_Amphoe_GISTDA_50k/MapServer    - 928 districts

## UNL Platform
API: https://api.unl.global/v1/
Auth: x-unl-api-key + x-project-id headers
Services: /geocode, /geocode/bulk, /routing, /routing/isoline, /routing/matrix
Use: address → geoID (proprietary 3D cell encoding), routing, distance matrix
Status: Lower priority — no data layers, purely routing/geocoding infrastructure
## News / calendar API keys
# All four below must be set as Cloudflare Pages secrets, NEVER committed.
# Push with: npx wrangler@latest pages secret put <NAME> --project-name siam-markets
#
# FINNHUB_API_KEY    — Free 60 req/min · finnhub.io/dashboard
# MARKETAUX_API_KEY  — Free 100/day   · marketaux.com/account/dashboard
# JBLANKED_API_KEY   — Free w/ acct   · jblanked.com (ForexFactory calendar)
# GISTDA_API_KEY     — Free w/ acct   · sphere.gistda.or.th
