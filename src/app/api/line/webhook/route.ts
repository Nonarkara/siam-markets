/**
 * DayTraders LINE Bot — Webhook handler
 * Edge-compatible: pure fetch, no SDK, Web Crypto for signature verification
 * Webhook URL: https://siam-markets.pages.dev/api/line/webhook
 *
 * Commands:
 *   /morning | ตลาดวันนี้   → AI morning brief
 *   /scan KBANK             → Stock analysis
 *   /fear | /fg             → Fear & Greed reading
 *   /help                   → Command list
 *   Any text                → AI general analysis
 */

import { NextResponse } from "next/server";
import { MORNING_NOTE_SKILL, STOCK_BRIEFING_SKILL, detectSkill } from "@/lib/ai/skills";
import { MOCK_MACRO, MOCK_STOCKS } from "@/lib/api/mock";

export const runtime = "edge";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";
const LINE_PUSH_URL  = "https://api.line.me/v2/bot/message/push";

// ─── Signature verification (HMAC-SHA256, Web Crypto) ────────────

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return signature === expected;
  } catch {
    return false;
  }
}

// ─── LINE message sending ─────────────────────────────────────────

async function replyText(replyToken: string, text: string, token: string) {
  await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text: text.slice(0, 5000) }],
    }),
  });
}

async function replyFlex(replyToken: string, altText: string, contents: object, token: string) {
  await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "flex", altText, contents }],
    }),
  });
}

// ─── Market context for AI ────────────────────────────────────────

function buildContext(): string {
  const top = [...MOCK_STOCKS].sort((a, b) => b.marginOfSafety - a.marginOfSafety)[0];
  const g = MOCK_STOCKS.filter(s => s.pe <= 15 && s.pb <= 1.5);
  return `
SET P/E: ${MOCK_MACRO.setPe} (hist avg: 17.89) · Fed: ${MOCK_MACRO.fedRate}% · THB/USD: ${MOCK_MACRO.thbUsd}
Best MOS: ${top.symbol.replace(".BK","")} at ${top.marginOfSafety.toFixed(0)}% below Graham Number
Graham stocks (P/E≤15, P/B≤1.5): ${g.map(s => s.symbol.replace(".BK","")).join(", ")}
`;
}

// ─── Claude call (direct fetch, edge-safe) ────────────────────────

async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "AI analysis requires ANTHROPIC_API_KEY to be configured.";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",   // fast + cheap for bot responses
        max_tokens: 600,
        system: systemPrompt + buildContext(),
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return "Analysis temporarily unavailable.";
    const json = await res.json();
    return json.content?.[0]?.text ?? "No response.";
  } catch {
    return "Analysis temporarily unavailable.";
  }
}

// ─── Command handlers ─────────────────────────────────────────────

async function handleMessage(text: string, replyToken: string, token: string) {
  const msg = text.trim();
  const lower = msg.toLowerCase();

  // /help
  if (lower === "/help" || lower === "help" || lower === "ช่วยด้วย") {
    await replyFlex(replyToken, "DayTraders Commands", buildHelpFlex(), token);
    return;
  }

  // /morning or ตลาดวันนี้
  if (lower === "/morning" || lower === "ตลาดวันนี้" || lower === "ตลาดเปิด" || lower.includes("morning brief")) {
    const brief = await callClaude(
      "Write the morning market note for Thai investors. What happened overnight and what should I watch in SET today? Under 250 words.",
      MORNING_NOTE_SKILL,
    );
    await replyFlex(replyToken, "☀ Morning Brief", buildBriefFlex("☀ MORNING BRIEF", brief, "#ffb800"), token);
    return;
  }

  // /fear or /fg
  if (lower === "/fear" || lower === "/fg" || lower.includes("fear") || lower.includes("greed")) {
    const fg = MOCK_MACRO.cape; // Use CAPE as proxy (replace with live F&G when key added)
    const score = 50; // mock
    const zone  = score <= 25 ? "EXTREME FEAR 😱" : score <= 45 ? "FEAR 😰" : score <= 55 ? "NEUTRAL 😐" : score <= 75 ? "GREED 😏" : "EXTREME GREED 🤑";
    const msg   = `Fear & Greed: ${score}/100 — ${zone}\n\n${score <= 25 ? "Buffett would be buying. This is historically the best entry window." : score >= 75 ? "Buffett is cautious. 'Be fearful when others are greedy.'" : "No extreme signal. Wait for fear or greed to peak before acting."}\n\n→ money.nonarkara.org`;
    await replyText(replyToken, msg, token);
    return;
  }

  // /scan TICKER or วิเคราะห์ TICKER
  const scanMatch = msg.match(/^(?:\/scan|วิเคราะห์)\s+([A-Za-z0-9]+)/i);
  if (scanMatch) {
    const ticker = scanMatch[1].toUpperCase();
    const stock  = MOCK_STOCKS.find(s => s.symbol === `${ticker}.BK`);
    const prompt = stock
      ? `Brief analysis of ${ticker}.BK: Price ฿${stock.price}, P/E ${stock.pe}, P/B ${stock.pb}, ROE ${stock.roe}%, MOS ${stock.marginOfSafety.toFixed(0)}%, Moat: ${stock.moat}. Under 200 words.`
      : `Brief analysis of ${ticker}.BK for a Thai retail investor. Graham Number, P/E context, moat type, main risk. Under 200 words.`;
    const analysis = await callClaude(prompt, STOCK_BRIEFING_SKILL);
    await replyFlex(replyToken, `${ticker} Analysis`, buildBriefFlex(`📊 ${ticker}`, analysis, "#00c896"), token);
    return;
  }

  // General AI question
  const skill = detectSkill(msg);
  const systemMap: Record<string, string> = {
    morning_note:   MORNING_NOTE_SKILL,
    stock_briefing: STOCK_BRIEFING_SKILL,
    sector_overview: STOCK_BRIEFING_SKILL,
    general: MORNING_NOTE_SKILL,
    comps: STOCK_BRIEFING_SKILL,
    earnings: STOCK_BRIEFING_SKILL,
    financial_plan: MORNING_NOTE_SKILL,
  };
  const response = await callClaude(msg, systemMap[skill] ?? MORNING_NOTE_SKILL);
  await replyText(replyToken, response, token);
}

// ─── Flex message builders ────────────────────────────────────────

function buildBriefFlex(title: string, body: string, accentColor: string) {
  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box", layout: "vertical",
      backgroundColor: "#0d0d0d", paddingAll: "14px",
      contents: [
        { type: "text", text: "DAYTRADERS", size: "xs", color: "rgba(0,200,150,0.5)", weight: "bold", letterSpacing: "2px" },
        { type: "text", text: title, size: "md", color: accentColor, weight: "bold", margin: "sm" },
      ],
    },
    body: {
      type: "box", layout: "vertical",
      backgroundColor: "#161616", paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: body.slice(0, 2000),
          wrap: true, color: "#e8e8e8", size: "sm", lineSpacing: "6px",
        },
      ],
    },
    footer: {
      type: "box", layout: "horizontal",
      backgroundColor: "#0d0d0d", paddingAll: "10px",
      contents: [
        {
          type: "button",
          action: { type: "uri", label: "Open Dashboard", uri: "https://money.nonarkara.org" },
          style: "primary", color: "#00c896", height: "sm",
        },
        {
          type: "button",
          action: { type: "uri", label: "Value Scanner", uri: "https://money.nonarkara.org/scan" },
          style: "secondary", height: "sm", margin: "sm",
        },
      ],
    },
  };
}

function buildHelpFlex() {
  const commands = [
    { label: "☀ Morning Brief",   cmd: "/morning",    desc: "Today's SET outlook" },
    { label: "📊 Stock Analysis", cmd: "/scan KBANK", desc: "Graham/Buffett analysis" },
    { label: "😱 Fear & Greed",   cmd: "/fear",       desc: "Market sentiment" },
  ];
  return {
    type: "bubble",
    header: {
      type: "box", layout: "vertical",
      backgroundColor: "#0d0d0d", paddingAll: "14px",
      contents: [
        { type: "text", text: "DAYTRADERS", size: "xs", color: "rgba(0,200,150,0.5)", weight: "bold" },
        { type: "text", text: "Commands", size: "lg", color: "#00c896", weight: "bold", margin: "sm" },
      ],
    },
    body: {
      type: "box", layout: "vertical",
      backgroundColor: "#161616", paddingAll: "12px",
      spacing: "md",
      contents: commands.map(c => ({
        type: "box", layout: "vertical", spacing: "xs",
        contents: [
          { type: "text", text: c.label, size: "sm", color: "#e8e8e8", weight: "bold" },
          { type: "text", text: `${c.cmd} — ${c.desc}`, size: "xs", color: "rgba(232,232,232,0.5)", wrap: true },
        ],
      })),
    },
    footer: {
      type: "box", layout: "vertical",
      backgroundColor: "#0d0d0d", paddingAll: "10px",
      contents: [{
        type: "button",
        action: { type: "uri", label: "Open Dashboard", uri: "https://money.nonarkara.org" },
        style: "primary", color: "#00c896", height: "sm",
      }],
    },
  };
}

// ─── Webhook endpoint ─────────────────────────────────────────────

export async function POST(req: Request) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  const token  = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!secret || !token) {
    return NextResponse.json({ error: "LINE credentials not configured" }, { status: 503 });
  }

  const body      = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  const valid = await verifySignature(body, signature, secret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const events  = payload.events ?? [];

  // Process all events (don't await — LINE expects fast 200 response)
  Promise.all(
    events
      .filter((e: { type: string; message?: { type: string } }) =>
        e.type === "message" && e.message?.type === "text"
      )
      .map((e: { replyToken: string; message: { text: string } }) =>
        handleMessage(e.message.text, e.replyToken, token)
      )
  ).catch(console.error);

  return NextResponse.json({ status: "ok" });
}

// LINE verifies the webhook with a GET request — respond 200
export async function GET() {
  return NextResponse.json({ status: "DayTraders LINE Bot active" });
}
