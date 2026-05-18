"use client";

import { useState, useRef, useEffect } from "react";
import type { SkillType } from "@/lib/ai/skills";

interface Message {
  role: "user" | "assistant";
  content: string;
  skill?: string;
}

const QUICK_PROMPTS: { label: string; prompt: string; skill: SkillType; color: string }[] = [
  {
    label: "Morning Note",
    prompt: "Write this morning's market note for Thai investors. What happened overnight and what should I watch today?",
    skill: "morning_note",
    color: "var(--caution)",
  },
  {
    label: "Best Value Stock",
    prompt: "Which SET50 stock currently has the best margin of safety vs its Graham Number? Give me a full stock briefing.",
    skill: "stock_briefing",
    color: "var(--bull)",
  },
  {
    label: "Banking Sector",
    prompt: "Give me an overview of the Thai banking sector right now — valuations, macro drivers, and which bank passes Graham's criteria.",
    skill: "sector_overview",
    color: "var(--tech)",
  },
  {
    label: "Tax Plan",
    prompt: "I earn ฿1,000,000/year and want to maximize my RMF and Thai ESG deductions. How much should I invest and what are my tax savings?",
    skill: "financial_plan",
    color: "var(--bull)",
  },
  {
    label: "SET Valuation",
    prompt: "Is the SET Index cheap or expensive right now compared to history? What would Graham and Buffett say?",
    skill: "general",
    color: "var(--muted)",
  },
  {
    label: "KBANK Analysis",
    prompt: "Give me a full stock briefing on KBANK.BK — what does it do, Graham metrics, Buffett moat assessment, main risks.",
    skill: "stock_briefing",
    color: "var(--tech)",
  },
];

const SKILL_LABELS: Record<string, string> = {
  morning_note: "MORNING NOTE",
  stock_briefing: "STOCK BRIEF",
  sector_overview: "SECTOR",
  comps: "COMPS",
  earnings: "EARNINGS",
  financial_plan: "FINANCIAL PLAN",
  general: "ANALYSIS",
};

export function AnalysisPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<SkillType>("general");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(message: string, skill?: SkillType) {
    if (!message.trim() || loading) return;

    const userMsg: Message = { role: "user", content: message };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    const selectedSkill = skill ?? currentSkill;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          skill: selectedSkill,
          history: messages.slice(-6), // last 3 exchanges for context
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      // Stream the response
      const skillUsed = (res.headers.get("X-Skill-Used") ?? selectedSkill) as SkillType;
      const assistantMsg: Message = { role: "assistant", content: "", skill: skillUsed };
      setMessages(prev => [...prev, assistantMsg]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          const chunk = decoder.decode(value);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + chunk },
            ];
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setMessages(prev => prev.slice(0, -1)); // remove empty assistant message if any
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 400,
      background: "var(--bg)",
      border: "1px solid var(--line)",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 16px",
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro)",
            color: "var(--bull)",
            fontWeight: 700,
            border: "1px solid var(--bull)",
            padding: "2px 6px",
            letterSpacing: "0.06em",
          }}>
            AI
          </span>
          <span className="t-micro">FINANCIAL ANALYSIS · anthropics/financial-services</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setError(null); }}
            style={{
              background: "none", border: "none",
              color: "var(--dim)", cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
              minHeight: 28,
            }}
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Quick prompts — shown only when no messages */}
      {messages.length === 0 && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
          <div className="t-micro" style={{ marginBottom: 8 }}>QUICK ANALYSIS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QUICK_PROMPTS.map(qp => (
              <button
                key={qp.label}
                onClick={() => send(qp.prompt, qp.skill)}
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${qp.color}`,
                  color: qp.color,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  padding: "5px 10px",
                  cursor: "pointer",
                  minHeight: 30,
                  transition: "background 180ms var(--ease)",
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 200,
      }}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--dim)" }}>
            <div className="t-body" style={{ marginBottom: 4 }}>6 financial skills adapted from Anthropic&apos;s official repo</div>
            <div className="t-micro">Morning note · Stock brief · Sector · Comps · Earnings · Financial plan</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            gap: 4,
          }}>
            {msg.skill && msg.role === "assistant" && (
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.5rem",
                color: "var(--bull)",
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}>
                {SKILL_LABELS[msg.skill] ?? msg.skill}
              </span>
            )}
            <div style={{
              maxWidth: "90%",
              padding: "10px 12px",
              background: msg.role === "user" ? "var(--bull-10)" : "var(--bg-surface)",
              border: `1px solid ${msg.role === "user" ? "var(--bull)" : "var(--line)"}`,
              color: "var(--ink)",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
              {msg.role === "assistant" && loading && i === messages.length - 1 && msg.content === "" && (
                <span style={{ color: "var(--dim)" }}>Analyzing...</span>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div style={{ padding: "8px 12px", background: "var(--bear-10)", border: "1px solid var(--bear)", color: "var(--bear)", fontSize: "0.8rem", fontFamily: "var(--font-body)" }}>
            {error.includes("ANTHROPIC_API_KEY") ? (
              <>Add <code style={{ background: "var(--bg)" }}>ANTHROPIC_API_KEY=sk-ant-...</code> to your <code style={{ background: "var(--bg)" }}>.env.local</code> file to enable AI analysis.</>
            ) : error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 12px",
        background: "var(--bg-raised)",
        borderTop: "1px solid var(--line)",
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything — Morning note, KBANK analysis, Thai sector overview..."
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            background: "var(--bg)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            padding: "8px 10px",
            outline: "none",
            lineHeight: 1.5,
            minHeight: 44,
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading ? "var(--bull)" : "var(--line)",
            border: "none",
            color: input.trim() && !loading ? "#000" : "var(--dim)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro)",
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "0 16px",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            minHeight: 44,
            alignSelf: "stretch",
            transition: "all 180ms var(--ease)",
          }}
        >
          {loading ? "..." : "→"}
        </button>
      </div>
    </div>
  );
}
