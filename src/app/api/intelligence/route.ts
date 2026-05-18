import { NextResponse } from "next/server";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fetchThbRate } from "@/lib/api/bot";
import { fetchMacro } from "@/lib/api/fred";
import { fetchAssetClasses, fetchAllRegional } from "@/lib/api/yahoo";
import {
  computeMarketDNA,
  detectAnomalies,
  computeNarrativeReality,
  computeFlowMatrix,
  REGIMES,
  dnaSimilarity,
} from "./logic";
import type { ApiResponse } from "@/lib/types";

export const revalidate = 300;

export interface IntelligenceData {
  marketDNA: {
    dimensions: string[];
    scores: number[];
    regime: string;
    regimeConfidence: number;
    historicalAvg: number[];
  };
  anomalies: ReturnType<typeof detectAnomalies>;
  patternMatch: {
    bestMatch: typeof REGIMES[0];
    similarity: number;
    allMatches: Array<{ regime: typeof REGIMES[0]; similarity: number }>;
  };
  narrativeReality: ReturnType<typeof computeNarrativeReality>;
  flowMatrix: ReturnType<typeof computeFlowMatrix>;
  timestamp: string;
}

export async function GET() {
  try {
    const [fearGreed, thb, macro, assets, regional] = await Promise.all([
      fetchFearGreed(),
      fetchThbRate(),
      fetchMacro(),
      fetchAssetClasses(),
      fetchAllRegional(),
    ]);

    const dna = computeMarketDNA(macro, fearGreed, thb, assets, regional);
    const anomalies = detectAnomalies(macro, fearGreed, assets, regional);
    const setChange = regional.thai[0]?.changePct ?? -0.62;
    const narrativeReality = computeNarrativeReality(setChange);
    const flowMatrix = computeFlowMatrix(assets, regional);

    const allMatches = REGIMES.map(r => ({
      regime: r,
      similarity: Math.round(dnaSimilarity(dna.scores, r.dna) * 100),
    })).sort((a, b) => b.similarity - a.similarity);

    const data: IntelligenceData = {
      marketDNA: {
        dimensions: ["Value", "Momentum", "Liquid", "Sentiment", "Volatility", "Diverge"],
        scores: dna.scores,
        regime: dna.regime,
        regimeConfidence: dna.confidence,
        historicalAvg: [52, 55, 50, 50, 45, 30],
      },
      anomalies,
      patternMatch: {
        bestMatch: allMatches[0].regime,
        similarity: allMatches[0].similarity,
        allMatches,
      },
      narrativeReality,
      flowMatrix,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data } satisfies ApiResponse<IntelligenceData>);
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: String(err) } satisfies ApiResponse<null>,
      { status: 500 },
    );
  }
}
