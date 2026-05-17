import { NextResponse } from "next/server";
import { fetchWorldEvents } from "@/lib/api/gdelt";
import { MOCK_EVENTS } from "@/lib/api/mock";
import type { ApiResponse, WorldEvent } from "@/lib/types";

export const runtime = "edge";

export const revalidate = 900; // 15 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country"); // "TH", "US", "CN", etc.

  try {
    let events = await fetchWorldEvents(30);

    // Fall back to mock data if GDELT returned nothing
    if (events.length === 0) events = MOCK_EVENTS;

    if (country && country !== "all") {
      events = events.filter((e) => e.country === country);
    }

    return NextResponse.json(
      { success: true, data: events as WorldEvent[] } satisfies ApiResponse<WorldEvent[]>,
    );
  } catch {
    return NextResponse.json(
      { success: true, data: MOCK_EVENTS } satisfies ApiResponse<WorldEvent[]>,
    );
  }
}
