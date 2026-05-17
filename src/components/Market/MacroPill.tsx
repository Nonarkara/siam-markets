"use client";

import type { MacroPill as MacroPillType } from "@/lib/types";
import { fmtNum } from "@/lib/format";
import { setValuation, setValuationLabel } from "@/lib/graham";

interface Props {
  data: MacroPillType;
  botPolicyRate?: number | null;
  botMlr?: number | null;
}

export function MacroPillBar({ data, botPolicyRate, botMlr }: Props) {
  const val = setValuation(data.setPe);
  const valLabel = setValuationLabel(val);
  const valColor =
    val === "cheap" ? "var(--bull)" :
    val === "fair"  ? "var(--bull)" :
    val === "moderate" ? "var(--caution)" :
    "var(--bear)";

  const items = [
    { label: "FED RATE",  value: `${fmtNum(data.fedRate, 2)}%` },
    // BOT Policy Rate — live when subscribed, otherwise Thai CPI
    botPolicyRate != null
      ? { label: "BOT RATE", value: `${fmtNum(botPolicyRate, 2)}%`, note: "Policy rate" }
      : { label: "TH CPI",   value: `${fmtNum(data.thCpi, 1)}%` },
    { label: "SET P/E",   value: fmtNum(data.setPe, 1), color: valColor, note: valLabel },
    { label: "CAPE",      value: fmtNum(data.cape, 1),  color: data.cape > 30 ? "var(--bear)" : "var(--caution)" },
    // MLR (lending rate) — live when subscribed, otherwise THB/USD
    botMlr != null
      ? { label: "MLR",     value: `${fmtNum(botMlr, 2)}%`, note: "Min lending" }
      : { label: "THB/USD", value: fmtNum(data.thbUsd, 2) },
  ];

  return (
    <div
      className="card"
      style={{
        display: "flex",
        gap: 0,
        overflowX: "auto",
        padding: 0,
        scrollbarWidth: "none",
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          style={{
            flex: "0 0 auto",
            padding: "12px 16px",
            borderRight: i < items.length - 1 ? "1px solid var(--line)" : "none",
            minWidth: 80,
          }}
        >
          <div className="t-micro" style={{ marginBottom: 4 }}>{item.label}</div>
          <div
            className="t-mono"
            style={{ fontWeight: 600, color: item.color ?? "var(--ink)" }}
          >
            {item.value}
          </div>
          {item.note && (
            <div style={{ fontSize: "0.6rem", color: item.color, marginTop: 2, fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {item.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
