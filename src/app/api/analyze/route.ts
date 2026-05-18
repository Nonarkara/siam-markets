/**
 * AI Analysis endpoint — calls Anthropic Messages API directly via fetch.
 * Uses edge runtime (no Node.js dependencies).
 * Skills adapted from: github.com/anthropics/financial-services
 */

import { NextResponse } from "next/server";
import { SKILLS, detectSkill, type SkillType } from "@/lib/ai/skills";
import { MOCK_MACRO, MOCK_STOCKS } from "@/lib/api/mock";

export const runtime = "edge";

function buildMarketContext(): string {
  const topStock = [...MOCK_STOCKS].sort((a, b) => b.marginOfSafety - a.marginOfSafety)[0];
  const grahamCount = MOCK_STOCKS.filter(s => s.pe <= 15 && s.pb <= 1.5).length;
  return `
## Live Market Data (as of this request)
- SET P/E: ${MOCK_MACRO.setPe} (historical avg: 17.89)
- US CAPE: ${MOCK_MACRO.cape} (>30 = expensive, historical median ~16)
- Fed Funds Rate: ${MOCK_MACRO.fedRate}%
- THB/USD: ~${MOCK_MACRO.thbUsd}
- Best MOS in SET50: ${topStock.symbol.replace(".BK", "")} at ${topStock.marginOfSafety.toFixed(0)}% below Graham Number
- SET50 stocks passing Graham criteria (P/E≤15 AND P/B≤1.5): ${grahamCount} stocks
- Top Graham stocks: ${MOCK_STOCKS.filter(s => s.pe <= 15 && s.pb <= 1.5).map(s => `${s.symbol.replace(".BK", "")} (MOS: ${s.marginOfSafety.toFixed(0)}%, P/E: ${s.pe.toFixed(1)})`).join(", ") || "none"}
`;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured. Add it to .env.local and to Cloudflare Pages secrets." },
      { status: 503 },
    );
  }

  let body: { message: string; skill?: SkillType; history?: AnthropicMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { message, skill, history = [] } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const selectedSkill: SkillType = skill ?? detectSkill(message);
  const systemPrompt = SKILLS[selectedSkill] + buildMarketContext();

  const messages: AnthropicMessage[] = [
    ...history.slice(-6),
    { role: "user", content: message },
  ];

  // Call Anthropic Messages API directly via fetch (edge-compatible)
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return NextResponse.json(
      { error: `Anthropic API error ${anthropicRes.status}: ${err.slice(0, 200)}` },
      { status: 502 },
    );
  }

  // Pass Anthropic's SSE stream through to the client, extracting text deltas
  const reader = anthropicRes.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              controller.enqueue(encoder.encode(parsed.delta.text));
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Skill-Used": selectedSkill,
      "Transfer-Encoding": "chunked",
    },
  });
}
