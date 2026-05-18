import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SKILLS, detectSkill, type SkillType } from "@/lib/ai/skills";
import { MOCK_MACRO, MOCK_STOCKS } from "@/lib/api/mock";

export const runtime = "edge";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

// Live market context injected into every request
function buildMarketContext(): string {
  const topStock = MOCK_STOCKS.sort((a, b) => b.marginOfSafety - a.marginOfSafety)[0];
  return `
## Live Market Data (as of this request)
- SET P/E: ${MOCK_MACRO.setPe} (historical avg: 17.89)
- Fear & Greed: ${MOCK_MACRO.cape > 30 ? "Elevated — US market expensive" : "Moderate"}
- US CAPE: ${MOCK_MACRO.cape} (>30 = expensive, historical median ~16)
- Fed Funds Rate: ${MOCK_MACRO.fedRate}%
- THB/USD: ~${MOCK_MACRO.thbUsd}
- Best MOS in SET50: ${topStock.symbol.replace(".BK","")} at ${topStock.marginOfSafety.toFixed(0)}% below Graham Number
- SET50 stocks passing Graham's P/E≤15 AND P/B≤1.5: ${MOCK_STOCKS.filter(s => s.pe <= 15 && s.pb <= 1.5).length} stocks
- Top value stocks: ${MOCK_STOCKS.filter(s => s.pe <= 15 && s.pb <= 1.5).map(s => `${s.symbol.replace(".BK","")} (MOS: ${s.marginOfSafety.toFixed(0)}%)`).join(", ") || "none meeting both criteria"}
`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured. Add it to .env.local." },
      { status: 503 },
    );
  }

  try {
    const { message, skill, history } = await req.json() as {
      message: string;
      skill?: SkillType;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    const selectedSkill: SkillType = skill ?? detectSkill(message);
    const systemPrompt = SKILLS[selectedSkill] + buildMarketContext();

    const messages: Anthropic.MessageParam[] = [
      ...(history ?? []).map(h => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    // Stream the response
    const stream = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      system: systemPrompt,
      messages,
      stream: true,
    });

    // Return as streaming text
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
