/**
 * TV Context API — one batched Anthropic call generating an AI-inferred
 * "what's likely on right now" line for every TV-wall channel.
 *
 * Caches for 10 minutes (s-maxage=600). Falls back to the channel's hardcoded
 * programming guess if the API key is missing or Anthropic errors.
 */

import { TV_CHANNELS, currentShow, localHour } from "@/lib/tv-channels";

export const runtime = "edge";
export const revalidate = 600;

export interface ChannelContext {
  id: string;
  show: string;       // best guess at the segment now on air
  topic: string;      // likely topic (1 short phrase)
  takeaway: string;   // one-line "why a Thai investor cares"
  source: "ai" | "schedule";
}

function fallback(): ChannelContext[] {
  const now = new Date();
  return TV_CHANNELS.map(ch => ({
    id: ch.id,
    show: currentShow(ch, now),
    topic: ch.focus,
    takeaway: `Local time at ${ch.name}: ${String(localHour(now, ch.tzOffset)).padStart(2, "0")}:00 · ${ch.focus}`,
    source: "schedule",
  }));
}

function extractJson(text: string): unknown | null {
  // Try fenced block first
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch { /* fall through */ }
  }
  // Then bare object/array
  const start = text.search(/[\[{]/);
  if (start === -1) return null;
  const end = text.lastIndexOf(text[start] === "[" ? "]" : "}");
  if (end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(fallback(), {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" },
    });
  }

  const now = new Date();
  const utc = now.toISOString();

  const lines = TV_CHANNELS.map(ch => {
    const lh = String(localHour(now, ch.tzOffset)).padStart(2, "0");
    return `- ${ch.id} | ${ch.name} (${ch.regionGroup}, local ${lh}:00) | focus: ${ch.focus} | schedule guess: ${currentShow(ch, now)}`;
  }).join("\n");

  const system = `You are a financial-TV producer briefing a Thai retail investor.
For each channel listed, infer what is most likely on air RIGHT NOW given (a) the channel's local time, (b) its programming bias, and (c) major market sessions globally (Tokyo open 09:00 JST, HK 09:30, SET 10:00 ICT, Frankfurt 09:00 CET, NYSE 09:30 ET).
Return STRICT JSON only — no prose, no markdown, no comments. Schema:
[{"id":"<channel id>","show":"<segment title or genre>","topic":"<3-6 word topic>","takeaway":"<one sentence (≤ 22 words) on why a Thai SET investor should care>"}]
Rules:
- Use English even for Thai/Chinese channels (the user reads English UI labels).
- "takeaway" must reference market mechanics (SET, THB, gold, oil, yields, Fed, BOJ, BOT) — never generic platitudes.
- Never invent specific tickers, numbers, or quotes. Stay at the level of "likely topic."`;

  const user = `UTC now: ${utc}\n\nChannels:\n${lines}\n\nReturn the JSON array.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!res.ok) return Response.json(fallback(), {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" },
    });

    const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find(b => b.type === "text")?.text ?? "";
    const parsed = extractJson(text);

    if (!Array.isArray(parsed)) return Response.json(fallback(), {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" },
    });

    const merged: ChannelContext[] = TV_CHANNELS.map(ch => {
      const hit = (parsed as Array<{ id?: string; show?: string; topic?: string; takeaway?: string }>)
        .find(p => p.id === ch.id);
      if (hit && hit.show && hit.topic && hit.takeaway) {
        return {
          id: ch.id,
          show: String(hit.show).slice(0, 90),
          topic: String(hit.topic).slice(0, 60),
          takeaway: String(hit.takeaway).slice(0, 180),
          source: "ai",
        };
      }
      return {
        id: ch.id,
        show: currentShow(ch, now),
        topic: ch.focus,
        takeaway: `${ch.regionGroup} channel · ${ch.focus}`,
        source: "schedule",
      };
    });

    return Response.json(merged, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" },
    });
  } catch {
    return Response.json(fallback(), {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" },
    });
  }
}
