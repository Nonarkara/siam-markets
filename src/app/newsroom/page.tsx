/**
 * NEWSROOM · Viewport-locked broadcast bullpen.
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  [TV WALL] [NEWS] [TRENDS] [MIXED]               theme · lang│   ← tabs
 *   ├──────────────────────────────────────────────────────────────┤
 *   │                                                              │
 *   │              ── active sub-dashboard fills here ──            │
 *   │                                                              │
 *   └──────────────────────────────────────────────────────────────┘
 *
 *   • TV WALL — hero + 10 muted previews, click to swap, hover for AI read
 *   • NEWS    — trilingual ticker (EN / TH / ZH) — Thai market + macro
 *   • TRENDS  — Google Trends Thailand, financial first
 *   • MIXED   — all three in one dense grid for desktop power users
 *
 * No body scroll on desktop. Each panel scrolls internally where needed.
 */

import type { Metadata } from "next";
import { NewsroomShell } from "./NewsroomShell";

export const metadata: Metadata = {
  title: "Newsroom · DayTraders",
  description: "Live financial TV wall, trilingual news ticker, Google Trends Thailand.",
};

export const runtime = "edge";
export const revalidate = 0;

export default function NewsroomPage() {
  return <NewsroomShell />;
}
