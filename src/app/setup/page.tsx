"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { defaultProfile, saveProfile, type ProfileMode } from "@/lib/profile";
import { fmtThb } from "@/lib/format";

const MODES: {
  key: ProfileMode;
  label: string;
  subtitle: string;
  kpis: string[];
  accent: string;
}[] = [
  {
    key: "investor",
    label: "Long-Term Investor",
    subtitle: "Mutual funds, RMF/ThaiESG tax deduction, buy-and-hold SET50",
    kpis: ["Tax deduction utilized %", "vs SET benchmark", "Best margin of safety", "Fear & Greed timing", "THB strength"],
    accent: "var(--bull)",
  },
  {
    key: "value",
    label: "Value Investor",
    subtitle: "Graham/Buffett framework, P/E screening, patience-driven entry",
    kpis: ["Graham-approved stocks count", "SET P/E vs history", "Best margin of safety", "US CAPE ratio", "Fear & Greed"],
    accent: "var(--tech)",
  },
  {
    key: "trader",
    label: "Active Trader",
    subtitle: "Technical analysis, swing/day trading, 1% rule discipline",
    kpis: ["Win rate (target: 55%)", "Profit factor (target: 1.5x)", "Max drawdown (limit: 5%)", "Top signal confidence", "Market regime"],
    accent: "var(--caution)",
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<ProfileMode>("investor");
  const [income, setIncome] = useState(1_000_000);
  const [rmf, setRmf] = useState(200_000);
  const [esg, setEsg] = useState(100_000);
  const [account, setAccount] = useState(500_000);

  function complete() {
    const profile = defaultProfile(mode);
    saveProfile({
      ...profile,
      annualIncome: income,
      rmfAmount: rmf,
      thaiEsgAmount: esg,
      accountSize: account,
      setupComplete: true,
    });
    router.push("/");
  }

  const selected = MODES.find(m => m.key === mode)!;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      padding: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 16px",
        borderBottom: "1px solid var(--line)",
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.875rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 4,
        }}>
          DAYTRADERS
        </div>
        <div className="t-micro">SETUP — {step}/2</div>
      </div>

      <div style={{ flex: 1, padding: "24px 16px", maxWidth: 600, margin: "0 auto", width: "100%" }}>

        {step === 1 && (
          <>
            <div className="t-display" style={{ marginBottom: 8 }}>Who are you?</div>
            <div className="t-body" style={{ color: "var(--muted)", marginBottom: 24 }}>
              This sets your 5 KPIs — the metrics the system tracks for you, personally.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {MODES.map(m => {
                const isSelected = mode === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    style={{
                      background: isSelected ? "var(--bg-surface)" : "var(--bg-raised)",
                      border: `1px solid ${isSelected ? m.accent : "var(--line)"}`,
                      borderLeft: `4px solid ${isSelected ? m.accent : "var(--line)"}`,
                      padding: "16px 16px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 180ms var(--ease)",
                      minHeight: 44,
                    }}
                  >
                    <div style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                      color: isSelected ? m.accent : "var(--ink)",
                      fontSize: "var(--text-body)",
                      marginBottom: 4,
                    }}>
                      {m.label}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-micro)",
                      color: "var(--muted)",
                      marginBottom: 12,
                      lineHeight: 1.4,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}>
                      {m.subtitle}
                    </div>
                    {isSelected && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {m.kpis.map((kpi, i) => (
                          <div key={i} style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-micro)",
                            color: m.accent,
                            display: "flex",
                            gap: 8,
                          }}>
                            <span style={{ opacity: 0.5 }}>KPI {i + 1}</span>
                            <span>{kpi}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: "100%",
                marginTop: 16,
                padding: "16px",
                background: selected.accent,
                border: "none",
                color: "#000",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-body)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                minHeight: 52,
              }}
            >
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="t-display" style={{ marginBottom: 8 }}>Your numbers</div>
            <div className="t-body" style={{ color: "var(--muted)", marginBottom: 24 }}>
              {mode === "trader"
                ? "Position sizing is calculated from your account size. Adjust anytime."
                : "Used to calculate your tax savings and benchmark comparisons. Private — stored only on your device."}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {mode !== "trader" && (
                <>
                  <NumberInput label="Annual Income (THB)" value={income} onChange={setIncome} max={10_000_000} step={100_000} />
                  <NumberInput label="RMF contribution this year" value={rmf} onChange={setRmf} max={500_000} step={10_000} />
                  <NumberInput label="Thai ESG Fund this year" value={esg} onChange={setEsg} max={300_000} step={10_000} />
                </>
              )}
              <NumberInput label="Trading / Investment Account (THB)" value={account} onChange={setAccount} max={10_000_000} step={100_000} />
            </div>

            {/* Summary */}
            {mode !== "trader" && (
              <div style={{
                marginTop: 16,
                padding: "14px 16px",
                background: "var(--bg-surface)",
                border: "1px solid var(--bull)",
              }}>
                <div className="t-micro" style={{ color: "var(--bull)", marginBottom: 8 }}>ESTIMATED TAX SAVINGS</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 700, color: "var(--bull)" }}>
                  {fmtThb(Math.min(rmf + esg, Math.min(income * 0.3, 800_000)) * (income > 2_000_000 ? 0.30 : income > 1_000_000 ? 0.25 : 0.20))}
                </div>
                <div className="t-micro" style={{ marginTop: 4, color: "var(--dim)" }}>estimated per year</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "transparent",
                  border: "1px solid var(--line)",
                  color: "var(--muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-micro)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  minHeight: 48,
                }}
              >
                ← Back
              </button>
              <button
                onClick={complete}
                style={{
                  flex: 3,
                  padding: "14px",
                  background: selected.accent,
                  border: "none",
                  color: "#000",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-body)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  minHeight: 48,
                }}
              >
                Start Tracking →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, max, step }: {
  label: string; value: number; onChange: (v: number) => void; max: number; step: number;
}) {
  return (
    <div style={{
      background: "var(--bg-raised)",
      border: "1px solid var(--line)",
      padding: "14px 16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="t-body" style={{ color: "var(--muted)" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>
          ฿{value.toLocaleString()}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--bull)", cursor: "pointer", height: 4 }}
      />
    </div>
  );
}
