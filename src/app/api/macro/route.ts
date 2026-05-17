import { NextResponse } from "next/server";
import { fetchMacro } from "@/lib/api/fred";
import { fetchThaiMacro } from "@/lib/api/worldbank";
import type { ApiResponse, MacroIndicator } from "@/lib/types";

export const revalidate = 86400; // 24 hours — macro data is slow-moving

export async function GET() {
  const [usMacro, thMacro] = await Promise.all([
    fetchMacro(),
    fetchThaiMacro(),
  ]);

  const indicators: MacroIndicator[] = [
    {
      key: "us_fed_rate",
      label: "US Fed Rate",
      value: usMacro.usFedFundsRate ?? 5.25,
      unit: "%",
      updatedAt: new Date().toISOString(),
      trend: "flat",
    },
    {
      key: "us_10y_treasury",
      label: "US 10Y Treasury",
      value: usMacro.us10YTreasury ?? 4.35,
      unit: "%",
      updatedAt: new Date().toISOString(),
      trend: "up",
    },
    {
      key: "th_cpi",
      label: "Thai Inflation (CPI)",
      value: thMacro.cpiInflation ?? 2.1,
      unit: "%",
      updatedAt: new Date().toISOString(),
      trend: "down",
    },
    {
      key: "th_gdp_growth",
      label: "Thai GDP Growth",
      value: thMacro.gdpGrowth ?? 3.2,
      unit: "%",
      updatedAt: new Date().toISOString(),
      trend: "up",
    },
    {
      key: "us_cpi",
      label: "US Inflation (CPI)",
      value: usMacro.usCpi ?? 318.2,
      unit: "index",
      updatedAt: new Date().toISOString(),
      trend: "down",
    },
  ];

  return NextResponse.json(
    { success: true, data: indicators } satisfies ApiResponse<MacroIndicator[]>,
  );
}
