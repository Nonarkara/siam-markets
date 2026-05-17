"use client";

import type { MarketSignal, SignalAction } from "@/lib/signals";

interface Props {
  signals: MarketSignal[];
  maxVisible?: number;
}

const ACTION_COLOR: Record<SignalAction, string> = {
  buy:   "var(--bull)",
  watch: "var(--caution)",
  sell:  "var(--bear)",
  hold:  "var(--muted)",
  avoid: "var(--bear)",
  info:  "var(--tech)",
};

const ACTION_LABEL: Record<SignalAction, string> = {
  buy:   "BUY",
  watch: "WATCH",
  sell:  "SELL",
  hold:  "HOLD",
  avoid: "AVOID",
  info:  "INFO",
};

const PRIORITY_BORDER: Record<string, string> = {
  critical: "var(--bear)",
  high:     "var(--caution)",
  medium:   "var(--tech)",
  low:      "var(--line)",
};

export function SignalFeed({ signals, maxVisible = 4 }: Props) {
  const visible = signals.slice(0, maxVisible);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Header */}
      <div style={{
        padding: "8px 16px",
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span className="t-micro">SIGNAL INTELLIGENCE</span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          {signals.filter(s => s.action === "buy").length} buy · {signals.filter(s => s.action === "watch").length} watch
        </span>
      </div>

      {visible.map((signal) => (
        <div
          key={signal.id}
          style={{
            background: "var(--bg-surface)",
            borderLeft: `3px solid ${PRIORITY_BORDER[signal.priority]}`,
            padding: "14px 16px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          {/* Signal header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
            gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}>
                {/* Action badge */}
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-micro)",
                  fontWeight: 700,
                  color: ACTION_COLOR[signal.action],
                  letterSpacing: "0.08em",
                  padding: "2px 6px",
                  border: `1px solid ${ACTION_COLOR[signal.action]}`,
                  lineHeight: 1.4,
                }}>
                  {ACTION_LABEL[signal.action]}
                </span>
                {/* Source */}
                <span className="t-micro">{signal.source}</span>
                {/* Value */}
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-micro)",
                  color: ACTION_COLOR[signal.action],
                  fontWeight: 600,
                }}>
                  {signal.value}
                </span>
              </div>
              {/* Title */}
              <div className="t-body" style={{ fontWeight: 600, lineHeight: 1.3 }}>
                {signal.title}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="t-body" style={{
            color: "var(--muted)",
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            marginBottom: 10,
          }}>
            {signal.body}
          </div>

          {/* Implication */}
          <div style={{
            borderTop: "1px solid var(--line)",
            paddingTop: 10,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-micro)",
              color: ACTION_COLOR[signal.action],
              fontWeight: 700,
              flexShrink: 0,
              marginTop: 2,
              letterSpacing: "0.06em",
            }}>
              → DO
            </span>
            <div className="t-body" style={{
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              color: "var(--ink)",
            }}>
              {signal.implication}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
