"use client";

import { useState } from "react";
import allocationData from "@/lib/data/cache/allocation.json";

/* ══════════════════════════════════════════════════════════════════════════════
   EfficientFrontier — offline Riskfolio-Lib output, rendered as an honest
   "what cold math wants" reference. Data is computed offline (ingestion/
   optimize.py) and imported statically; nothing runs at the edge.
   Reference, NOT a recommendation — the disclaimer is load-bearing (§12).
   ══════════════════════════════════════════════════════════════════════════════ */

type Lang = "en" | "th" | "zh";

interface Weight { symbol: string; w: number }
interface FrontierPt { ret: number; vol: number }
interface Allocation {
  generatedAt: string; universe: string; lookbackDays: number;
  weights: { maxSharpe: Weight[]; minVol: Weight[]; hrp: Weight[] };
  frontier: FrontierPt[];
  picked: { ret: number; vol: number; sharpe: number };
  corr: { labels: string[]; matrix: number[][] };
}

const A = allocationData as Allocation;

type Obj = "maxSharpe" | "minVol" | "hrp";

const L: Record<Lang, {
  title: string; intro: string;
  objSharpe: string; objMinVol: string; objHRP: string;
  weights: string; frontier: string; corr: string;
  ret: string; vol: string; sharpe: string;
  axisVol: string; axisRet: string;
  disclaimer: string; generated: (d: string, n: number) => string;
}> = {
  en: {
    title: "OPTIMIZER · WHAT THE MATH WANTS",
    intro: "Mean-variance optimization over 3 years of SET50 returns (Ledoit-Wolf covariance). Three objectives.",
    objSharpe: "MAX SHARPE", objMinVol: "MIN VOL", objHRP: "RISK PARITY",
    weights: "OPTIMAL WEIGHTS", frontier: "EFFICIENT FRONTIER", corr: "CORRELATION",
    ret: "EXP. RETURN", vol: "VOLATILITY", sharpe: "SHARPE",
    axisVol: "volatility →", axisRet: "return →",
    disclaimer: "Optimizers trust their inputs blindly — they assume the past predicts the future, which it doesn't. A reference for what pure math wants, not a recommendation.",
    generated: (d, n) => `SET50 · ${n} trading days · generated ${d}`,
  },
  th: {
    title: "เครื่องมือจัดพอร์ต · สิ่งที่คณิตศาสตร์ต้องการ",
    intro: "การหาพอร์ตที่เหมาะสมแบบ mean-variance จากผลตอบแทน SET50 ย้อนหลัง 3 ปี (ความแปรปรวนร่วมแบบ Ledoit-Wolf) สามวัตถุประสงค์",
    objSharpe: "ชาร์ปสูงสุด", objMinVol: "ผันผวนต่ำสุด", objHRP: "เสี่ยงเท่ากัน",
    weights: "น้ำหนักที่เหมาะสม", frontier: "เส้นพรมแดนประสิทธิภาพ", corr: "สหสัมพันธ์",
    ret: "ผลตอบแทนคาดหวัง", vol: "ความผันผวน", sharpe: "ชาร์ป",
    axisVol: "ความผันผวน →", axisRet: "ผลตอบแทน →",
    disclaimer: "เครื่องมือหาพอร์ตเชื่อข้อมูลนำเข้าอย่างไม่ลืมหูลืมตา มันสมมติว่าอดีตทำนายอนาคตได้ ซึ่งไม่จริง นี่คือข้อมูลอ้างอิงว่าคณิตศาสตร์ล้วนๆ ต้องการอะไร ไม่ใช่คำแนะนำ",
    generated: (d, n) => `SET50 · ${n} วันทำการ · สร้างเมื่อ ${d}`,
  },
  zh: {
    title: "组合优化 · 纯数学想要什么",
    intro: "对SET50三年收益做均值-方差优化（Ledoit-Wolf协方差）。三个目标。",
    objSharpe: "最大夏普", objMinVol: "最小波动", objHRP: "风险平价",
    weights: "最优权重", frontier: "有效前沿", corr: "相关性",
    ret: "预期收益", vol: "波动率", sharpe: "夏普",
    axisVol: "波动率 →", axisRet: "收益 →",
    disclaimer: "优化器盲目相信输入——它假设过去能预测未来，而事实并非如此。这是纯数学想要什么的参考，不是建议。",
    generated: (d, n) => `SET50 · ${n} 个交易日 · 生成于 ${d}`,
  },
};

const tk = (s: string) => s.replace(".BK", "");

function corrFill(c: number): { fill: string; op: number } {
  if (c >= 0) return { fill: "var(--bull)", op: Math.max(0.06, Math.min(1, c)) };
  return { fill: "var(--bear)", op: Math.max(0.06, Math.min(1, Math.abs(c))) };
}

export function EfficientFrontier({ lang = "en" }: { lang?: Lang }) {
  const [obj, setObj] = useState<Obj>("maxSharpe");
  const t = L[lang];
  const weights = A.weights[obj];

  // ── Frontier geometry ──────────────────────────────────────────────────────
  const W = 320, H = 180, PAD = 28;
  const vols = A.frontier.map((p) => p.vol);
  const rets = A.frontier.map((p) => p.ret);
  const vMin = Math.min(...vols, A.picked.vol), vMax = Math.max(...vols, A.picked.vol);
  const rMin = Math.min(...rets, A.picked.ret), rMax = Math.max(...rets, A.picked.ret);
  const fx = (v: number) => PAD + ((v - vMin) / (vMax - vMin || 1)) * (W - PAD * 2);
  const fy = (r: number) => H - PAD - ((r - rMin) / (rMax - rMin || 1)) * (H - PAD * 2);
  const linePath = A.frontier.map((p, i) => `${i === 0 ? "M" : "L"} ${fx(p.vol).toFixed(1)} ${fy(p.ret).toFixed(1)}`).join(" ");

  const objBtns: { key: Obj; label: string }[] = [
    { key: "maxSharpe", label: t.objSharpe },
    { key: "minVol", label: t.objMinVol },
    { key: "hrp", label: t.objHRP },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

      {/* Heading */}
      <div>
        <div className="t-micro" style={{ color: "var(--caution)", letterSpacing: "0.1em", marginBottom: 6 }}>{t.title}</div>
        <p className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0, fontSize: "0.875rem" }}>{t.intro}</p>
      </div>

      {/* Objective toggle */}
      <div style={{ display: "flex", border: "1px solid var(--line)" }}>
        {objBtns.map((b, i) => (
          <button key={b.key} onClick={() => setObj(b.key)} style={{
            flex: 1, padding: "10px 6px", minHeight: 44,
            background: obj === b.key ? "var(--bg-hover)" : "transparent",
            border: "none", borderRight: i < 2 ? "1px solid var(--line)" : "none",
            color: obj === b.key ? "var(--bull)" : "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
            letterSpacing: "0.06em", fontWeight: obj === b.key ? 700 : 400, cursor: "pointer",
          }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Weights table */}
      <div className="card" style={{ padding: 16 }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{t.weights}</div>
        {weights.map((w) => (
          <div key={w.symbol} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", width: 72, flexShrink: 0 }}>{tk(w.symbol)}</span>
            <div style={{ flex: 1, height: 8, background: "var(--bg-raised)" }}>
              <div style={{ height: "100%", width: `${Math.min(100, w.w * 100)}%`, background: "var(--bull)", opacity: 0.7 }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink)", width: 44, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>
              {(w.w * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Efficient frontier */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span className="t-micro" style={{ color: "var(--dim)" }}>{t.frontier}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--caution)" }}>
            {t.sharpe} {A.picked.sharpe.toFixed(2)}
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} aria-label="Efficient frontier">
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--line)" strokeWidth={1} />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--line)" strokeWidth={1} />
          <path d={linePath} fill="none" stroke="var(--muted)" strokeWidth={1.5} opacity={0.7} />
          {A.frontier.map((p, i) => (
            <circle key={i} cx={fx(p.vol)} cy={fy(p.ret)} r={2} fill="var(--muted)" opacity={0.6} />
          ))}
          {/* Picked (max-Sharpe) — the one amber accent */}
          <circle cx={fx(A.picked.vol)} cy={fy(A.picked.ret)} r={5} fill="var(--caution)" />
          <text x={PAD} y={H - 6} fill="var(--dim)" fontSize="9" fontFamily="var(--font-mono)">{t.axisVol}</text>
          <text x={PAD} y={PAD - 8} fill="var(--dim)" fontSize="9" fontFamily="var(--font-mono)">{t.axisRet}</text>
        </svg>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <Stat label={t.ret} value={`${(A.picked.ret * 100).toFixed(1)}%`} col="var(--bull)" />
          <Stat label={t.vol} value={`${(A.picked.vol * 100).toFixed(1)}%`} col="var(--muted)" />
        </div>
      </div>

      {/* Correlation heatmap */}
      <div className="card" style={{ padding: 16 }}>
        <div className="t-micro" style={{ color: "var(--dim)", marginBottom: 12 }}>{t.corr}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
            <thead>
              <tr>
                <th />
                {A.corr.labels.map((l) => (
                  <th key={l} style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--dim)", fontWeight: 400, padding: "0 2px", textAlign: "center" }}>{tk(l)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {A.corr.matrix.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--dim)", paddingRight: 4, textAlign: "right", whiteSpace: "nowrap" }}>{tk(A.corr.labels[i])}</td>
                  {row.map((c, j) => {
                    const { fill, op } = corrFill(c);
                    return (
                      <td key={j} style={{ width: 26, height: 26, background: fill, opacity: op, textAlign: "center", border: "1px solid var(--bg)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--bg)", opacity: op > 0.4 ? 1 : 0 }}>
                          {c.toFixed(1)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer + provenance */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
        <div className="t-body" style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: "0.8rem" }}>{t.disclaimer}</div>
        <div className="t-micro" style={{ color: "var(--dim)", marginTop: 8 }}>{t.generated(A.generatedAt, A.lookbackDays)}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, col }: { label: string; value: string; col: string }) {
  return (
    <div>
      <div className="t-micro" style={{ color: "var(--dim)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body)", fontWeight: 700, color: col }}>{value}</div>
    </div>
  );
}
