/**
 * /api/sentinel — Sentinel-2 satellite acquisition metadata for 6 key
 * Thai economic zones via Element84 Earth Search STAC API.
 *
 * Free, no API key. Element84 hosts the AWS Open Data Sentinel archive.
 * Returns latest cloud-free scene per zone with date, cloud %, tile URL.
 *
 * Why this matters for investors:
 *   Laem Chabang Port throughput   → shipping/logistics sector (WHA)
 *   Eastern Economic Corridor      → industrial/tech sector (DELTA, WHA)
 *   Chao Phraya Delta agriculture  → soft-commodity prices, agri stocks
 *   Bangkok construction density   → real estate sector (CPN, LH, SPALI)
 *   GULF solar / wind farms        → energy sector (GULF, BGRIM, RATCH)
 *   Mekong water level proxy       → hydropower output (RATCH, EGCO)
 */

export const runtime   = "edge";
export const revalidate = 3600; // 1 hour — Sentinel passes every 5 days

const STAC_URL = "https://earth-search.aws.element84.com/v1/search";

export interface SentinelZone {
  id:          string;
  name:        string;
  sector:      string;        // which SET sector this monitors
  indicator:   string;        // what to look for in imagery
  lat:         number;
  lon:         number;
  bbox:        [number, number, number, number]; // [W, S, E, N]
  lastScene:   string | null; // ISO date of latest acquisition
  cloudPct:    number | null; // % cloud cover
  eoUrl:       string;        // direct link to EO Browser
  thumbUrl:    string | null; // thumbnail from STAC
  daysOld:     number | null; // days since last cloud-free scene
}

const ZONES: Omit<SentinelZone, "lastScene" | "cloudPct" | "thumbUrl" | "daysOld">[] = [
  {
    id:        "laem_chabang",
    name:      "Laem Chabang Port",
    sector:    "Logistics / Shipping (WHA, WHART)",
    indicator: "Container yard fill rate, ship traffic density",
    lat: 13.09, lon: 100.88,
    bbox: [100.78, 12.99, 100.98, 13.19],
    eoUrl: "https://apps.sentinel-hub.com/eo-browser/?zoom=12&lat=13.09&lng=100.88&themeId=DEFAULT-THEME&datasetId=S2L2A",
  },
  {
    id:        "eec",
    name:      "Eastern Economic Corridor",
    sector:    "Industrial / Tech (DELTA, WHA, AMATA)",
    indicator: "Factory footprint expansion, construction activity, thermal anomalies",
    lat: 13.15, lon: 101.20,
    bbox: [100.80, 12.80, 101.60, 13.50],
    eoUrl: "https://apps.sentinel-hub.com/eo-browser/?zoom=11&lat=13.15&lng=101.20&themeId=DEFAULT-THEME&datasetId=S2L2A",
  },
  {
    id:        "chao_phraya_agri",
    name:      "Chao Phraya Delta — Agriculture",
    sector:    "Agriculture (Thai sugar, rubber export prices)",
    indicator: "Rice paddy NDVI (crop health), flood extent, harvest timing",
    lat: 14.20, lon: 100.10,
    bbox: [99.60, 13.60, 100.60, 14.80],
    eoUrl: "https://apps.sentinel-hub.com/eo-browser/?zoom=11&lat=14.20&lng=100.10&themeId=DEFAULT-THEME&visualizationUrl=https%3A%2F%2Fservices.sentinel-hub.com%2Fogc%2Fwms%2F&datasetId=S2L2A&layers=NDVI",
  },
  {
    id:        "bangkok_construction",
    name:      "Greater Bangkok — Construction",
    sector:    "Real Estate (CPN, LH, SPALI, MAJOR)",
    indicator: "New building footprints, piling activity, site clearing",
    lat: 13.75, lon: 100.52,
    bbox: [100.30, 13.50, 100.80, 14.00],
    eoUrl: "https://apps.sentinel-hub.com/eo-browser/?zoom=11&lat=13.75&lng=100.52&themeId=DEFAULT-THEME&datasetId=S2L2A",
  },
  {
    id:        "gulf_solar",
    name:      "Central Thailand — Solar Farms",
    sector:    "Renewable Energy (GULF, BGRIM, RATCH, GPSC)",
    indicator: "PV panel reflectance, new farm construction, capacity expansion",
    lat: 15.30, lon: 100.80,
    bbox: [100.20, 14.80, 101.40, 15.80],
    eoUrl: "https://apps.sentinel-hub.com/eo-browser/?zoom=11&lat=15.30&lng=100.80&themeId=DEFAULT-THEME&datasetId=S2L2A",
  },
  {
    id:        "mekong_hydro",
    name:      "Upper Mekong — Water Level Proxy",
    sector:    "Hydropower (RATCH, EGCO, CKP)",
    indicator: "Reservoir surface area (proxy for water level / generation capacity)",
    lat: 18.00, lon: 102.00,
    bbox: [100.50, 17.00, 102.80, 18.80],
    eoUrl: "https://apps.sentinel-hub.com/eo-browser/?zoom=10&lat=18.00&lng=102.00&themeId=DEFAULT-THEME&datasetId=S2L2A",
  },
];

async function queryZone(zone: typeof ZONES[number]): Promise<SentinelZone> {
  const today    = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400_000);

  try {
    const res = await fetch(STAC_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collections: ["sentinel-2-l2a"],
        bbox:        zone.bbox,
        datetime:    `${thirtyDaysAgo.toISOString().slice(0, 10)}/${today.toISOString().slice(0, 10)}`,
        query:       { "eo:cloud_cover": { lt: 30 } },
        sortby:      [{ field: "properties.datetime", direction: "desc" }],
        limit:       1,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`STAC ${res.status}`);

    const data = await res.json() as {
      features?: Array<{
        properties?: { datetime?: string; "eo:cloud_cover"?: number };
        assets?: { thumbnail?: { href?: string }; overview?: { href?: string } };
      }>;
    };

    const item = data.features?.[0];
    if (!item) {
      return { ...zone, lastScene: null, cloudPct: null, thumbUrl: null, daysOld: null };
    }

    const sceneDate = item.properties?.datetime ?? null;
    const cloudPct  = item.properties?.["eo:cloud_cover"] ?? null;
    const thumbUrl  = item.assets?.thumbnail?.href ?? item.assets?.overview?.href ?? null;

    const daysOld = sceneDate
      ? Math.round((Date.now() - Date.parse(sceneDate)) / 86400_000)
      : null;

    return { ...zone, lastScene: sceneDate, cloudPct, thumbUrl, daysOld };
  } catch {
    return { ...zone, lastScene: null, cloudPct: null, thumbUrl: null, daysOld: null };
  }
}

export async function GET() {
  const results = await Promise.all(ZONES.map(queryZone));

  return Response.json(
    { zones: results, as_of: new Date().toISOString(), note: "Sentinel-2 L2A via Element84 Earth Search STAC. No API key required." },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
  );
}
