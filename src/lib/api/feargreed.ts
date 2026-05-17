import type { FearGreed } from "../types";
import { fgZone } from "../graham";

// FearGreedChart.com — free, no API key required
const ENDPOINT = "https://api.feargreedchart.com/v1/fgi";

let cache: { data: FearGreed; ts: number } | null = null;
const TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchFearGreed(): Promise<FearGreed> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data;

  try {
    const res = await fetch(ENDPOINT, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`FGI HTTP ${res.status}`);
    const json = await res.json();

    const score = typeof json.score === "number" ? json.score : Number(json.fgi?.now?.value ?? 50);
    const data: FearGreed = {
      score,
      label: fgZone(score),
      updatedAt: new Date().toISOString(),
    };

    cache = { data, ts: Date.now() };
    return data;
  } catch {
    // Fallback: neutral
    return { score: 50, label: "neutral", updatedAt: new Date().toISOString() };
  }
}
