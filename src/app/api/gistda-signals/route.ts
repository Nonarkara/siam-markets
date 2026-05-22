/**
 * /api/gistda-signals — GISTDA Thailand sector risk signals.
 *
 * Serves pre-computed sector risk scores from ingestion/gistda.py output.
 * Falls back to direct GISTDA ArcGIS Portal queries on cache miss
 * (no API key required for the portal endpoints).
 *
 * Sector signals derived from:
 *   • Fire hotspot density by province → AGRICULTURE / ENERGY risk
 *   • Flood extent km² by region → AGRICULTURE / INDUSTRIAL risk
 *   • Northern Thailand PM2.5 → TOURISM risk
 *
 * Cached 1 hour (data refreshes daily via cron).
 */

import { createClient } from "@supabase/supabase-js";

export const runtime    = "edge";
export const revalidate = 3600;

const PORTAL = "https://gistdaportal.gistda.or.th/data/rest/services";
const BBOX   = "97.539,5.772,105.443,20.315"; // Thailand

export interface SectorSignal {
  score:    number;          // 0–100 risk score
  color:    string;          // CSS variable
  reason:   string;          // plain English
  affected: string[];        // SET tickers
}

export interface GistdaSignalResponse {
  as_of:          string;
  hotspot_count:  number;
  flood_regions:  Record<string, number>;  // region → km²
  air_stations:   number;
  sector_signals: Record<string, SectorSignal>;
  source:         "supabase" | "live" | "fallback";
  note:           string;
}

// ─── Live direct portal query (fallback when Supabase is empty) ──

async function liveHotspotCount(): Promise<number> {
  try {
    const url = `${PORTAL}/FR_Fire/hotspot_daily/MapServer/0/query?where=1%3D1&geometry=${BBOX}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&returnCountOnly=true&f=json`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return 0;
    const d = await r.json() as { count?: number };
    return d.count ?? 0;
  } catch { return 0; }
}

async function liveFloodArea(): Promise<Record<string, number>> {
  const regions: Record<string, string> = {
    national:  "FL_Flood/flood_daily/MapServer/0",
    central:   "FL_Flood/flood_daily_c/MapServer/0",
    northeast: "FL_Flood/flood_daily_ne/MapServer/0",
  };
  const out: Record<string, number> = {};
  await Promise.all(
    Object.entries(regions).map(async ([key, path]) => {
      try {
        const url = `${PORTAL}/${path}/query?where=1%3D1&outStatistics=[{"statisticType":"sum","onStatisticField":"Shape_Area","outStatisticFieldName":"total_area"}]&f=json`;
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) { out[key] = 0; return; }
        const d = await r.json() as { features?: Array<{ attributes?: { total_area?: number } }> };
        const raw = d.features?.[0]?.attributes?.total_area ?? 0;
        out[key] = Math.round(raw / 1_000_000 * 100) / 100; // m² → km²
      } catch { out[key] = 0; }
    }),
  );
  return out;
}

async function liveNorthPM25(): Promise<number> {
  try {
    const url = `${PORTAL}/FR_Fire/AirQuality_hourly/MapServer/0/query?where=1%3D1&geometry=97.5,16.0,101.5,20.5&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=PM2_5,PM25,VALUE,pm25&f=geojson`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return 0;
    const d = await r.json() as { features?: Array<{ properties?: Record<string, unknown> }> };
    const vals = (d.features ?? []).map(f => {
      const p = f.properties ?? {};
      const v = p["PM2_5"] ?? p["PM25"] ?? p["pm25"] ?? p["VALUE"];
      return v !== null && v !== undefined ? Number(v) : null;
    }).filter((v): v is number => v !== null && !isNaN(v));
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  } catch { return 0; }
}

function buildSignals(
  hotspotCount: number,
  floodRegions: Record<string, number>,
  avgNorthPM25: number,
): Record<string, SectorSignal> {
  const agriScore = Math.min(100, hotspotCount * 0.15 + (floodRegions.northeast ?? 0) * 0.02);
  const tourScore = Math.min(100, avgNorthPM25 * 1.2);
  const indScore  = Math.min(100, (floodRegions.central ?? 0) * 0.05);
  const engScore  = Math.min(100, hotspotCount * 0.03);

  const riskColor = (s: number) => s > 40 ? "var(--bear)" : s > 15 ? "var(--caution)" : "var(--bull)";

  return {
    AGRICULTURE: {
      score:    Math.round(agriScore * 10) / 10,
      color:    riskColor(agriScore),
      reason:   `${hotspotCount} fire hotspots · ${(floodRegions.northeast ?? 0).toFixed(0)} km² NE flood`,
      affected: ["KSL", "KTIS", "TVO", "TRUBB", "CPF"],
    },
    TOURISM: {
      score:    Math.round(tourScore * 10) / 10,
      color:    riskColor(tourScore),
      reason:   `Northern Thailand avg PM2.5: ${avgNorthPM25.toFixed(1)} µg/m³`,
      affected: ["CENTEL", "MINT", "ERW", "DELTA"],
    },
    INDUSTRIAL: {
      score:    Math.round(indScore * 10) / 10,
      color:    riskColor(indScore),
      reason:   `${(floodRegions.central ?? 0).toFixed(0)} km² central plain flooded`,
      affected: ["WHA", "AMATA", "HANA", "DELTA"],
    },
    ENERGY: {
      score:    Math.round(engScore * 10) / 10,
      color:    engScore > 20 ? "var(--caution)" : "var(--bull)",
      reason:   `${hotspotCount} total hotspots (biomass burning signal)`,
      affected: ["GULF", "BGRIM", "RATCH", "GPSC"],
    },
  };
}

// ─── Main handler ────────────────────────────────────────────

export async function GET(): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);

  // Try Supabase first
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const sb = createClient(url, key);
      const { data } = await sb
        .from("gistda_sector_signals")
        .select("*")
        .eq("date", today)
        .single();

      if (data) {
        return Response.json({
          ...data,
          source: "supabase",
          note: "GISTDA Thailand · fire hotspots + flood extent + air quality",
        } as GistdaSignalResponse, {
          headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
        });
      }
    } catch { /* fall through to live */ }
  }

  // Live query from GISTDA Portal (free, no key)
  const [hotspotCount, floodRegions, avgNorthPM25] = await Promise.all([
    liveHotspotCount(),
    liveFloodArea(),
    liveNorthPM25(),
  ]);

  const payload: GistdaSignalResponse = {
    as_of:          today,
    hotspot_count:  hotspotCount,
    flood_regions:  floodRegions,
    air_stations:   0,
    sector_signals: buildSignals(hotspotCount, floodRegions, avgNorthPM25),
    source:         "live",
    note:           "GISTDA ArcGIS Portal · no API key · hotspots + flood + PM2.5",
  };

  return Response.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
  });
}
