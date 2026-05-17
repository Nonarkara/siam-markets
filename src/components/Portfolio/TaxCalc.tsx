"use client";

import { useState } from "react";
import { calcThaiTax } from "@/lib/graham";
import { fmtThb } from "@/lib/format";

const FUND_INFO = {
  RMF: {
    label: "RMF — Retirement Mutual Fund",
    desc: "Deduct up to ฿500,000 or 30% of income. Lock-up: 5 years min.",
    maxBaht: 500_000,
  },
  ThaiESG: {
    label: "Thai ESG Fund",
    desc: "Sustainability-focused. Deduct up to ฿300,000 or 30% of income. Lock-up: 5 years.",
    maxBaht: 300_000,
  },
  SSF: {
    label: "SSF — Super Savings Fund",
    desc: "Deduct up to ฿200,000 or 30% of income. Lock-up: 10 years.",
    maxBaht: 200_000,
  },
} as const;

function SliderRow({
  label, value, onChange, max,
}: {
  label: string; value: number; onChange: (v: number) => void; max: number;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="t-body" style={{ color: "var(--muted)" }}>{label}</span>
        <span className="t-mono" style={{ fontWeight: 600 }}>{fmtThb(value)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={10_000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: 4,
          accentColor: "var(--bull)",
          cursor: "pointer",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span className="t-micro">฿0</span>
        <span className="t-micro">{fmtThb(max)}</span>
      </div>
    </div>
  );
}

export function TaxCalc() {
  const [income, setIncome]         = useState(1_000_000);
  const [rmf, setRmf]               = useState(200_000);
  const [thaiEsg, setThaiEsg]       = useState(100_000);
  const [ssf, setSsf]               = useState(0);

  const result = calcThaiTax({
    annualIncome: income,
    rmfAmount: rmf,
    thaiEsgAmount: thaiEsg,
    ssfAmount: ssf,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      {/* Income slider */}
      <div className="card">
        <div className="t-micro" style={{ marginBottom: 16 }}>ANNUAL INCOME (THB)</div>
        <SliderRow label="Your income" value={income} onChange={setIncome} max={5_000_000} />
        <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
          Marginal tax rate: <span className="t-mono" style={{ color: "var(--ink)" }}>{result.marginalRate.toFixed(0)}%</span>
        </div>
      </div>

      {/* Fund sliders */}
      <div className="card">
        <div className="t-micro" style={{ marginBottom: 16 }}>FUND CONTRIBUTIONS</div>
        <SliderRow label="RMF"       value={rmf}     onChange={setRmf}     max={500_000} />
        <SliderRow label="Thai ESG"  value={thaiEsg} onChange={setThaiEsg} max={300_000} />
        <SliderRow label="SSF"       value={ssf}     onChange={setSsf}     max={200_000} />
      </div>

      {/* Result */}
      <div className="card" style={{ background: "var(--bull-10)", borderColor: "var(--bull)" }}>
        <div className="t-micro" style={{ marginBottom: 12 }}>ESTIMATED TAX SAVINGS</div>
        <div className="t-mono-display" style={{ color: "var(--bull)" }}>
          {fmtThb(result.estimatedTaxSaved)}
        </div>
        <div className="t-body" style={{ color: "var(--muted)", marginTop: 4 }}>
          per year, based on {result.marginalRate.toFixed(0)}% marginal rate
        </div>
        <div className="divider" style={{ margin: "14px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div className="t-micro">RMF DEDUCTION</div>
            <div className="t-mono" style={{ marginTop: 4 }}>{fmtThb(result.rmfDeduction)}</div>
          </div>
          <div>
            <div className="t-micro">THAI ESG DEDUCTION</div>
            <div className="t-mono" style={{ marginTop: 4 }}>{fmtThb(result.thaiEsgDeduction)}</div>
          </div>
          <div>
            <div className="t-micro">SSF DEDUCTION</div>
            <div className="t-mono" style={{ marginTop: 4 }}>{fmtThb(result.ssfDeduction)}</div>
          </div>
          <div>
            <div className="t-micro">TOTAL DEDUCTION</div>
            <div className="t-mono" style={{ marginTop: 4, fontWeight: 700 }}>
              {fmtThb(result.totalDeduction)}
            </div>
          </div>
        </div>
        <div className="t-micro" style={{ marginTop: 14, color: "var(--dim)" }}>
          Combined ceiling: ฿800,000. Tax saved = deduction × marginal rate. Consult a tax advisor for exact figures.
        </div>
      </div>

      {/* Fund explainers */}
      {(Object.entries(FUND_INFO) as [keyof typeof FUND_INFO, typeof FUND_INFO[keyof typeof FUND_INFO]][]).map(([key, info]) => (
        <div key={key} className="card">
          <div className="t-body" style={{ fontWeight: 600, marginBottom: 6 }}>{info.label}</div>
          <div className="t-body" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{info.desc}</div>
        </div>
      ))}
    </div>
  );
}
