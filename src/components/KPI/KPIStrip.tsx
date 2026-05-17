"use client";

import { useState, useEffect } from "react";
import { loadProfile, statusColor, statusIcon, kpiStatus } from "@/lib/profile";
import { calcThaiTax, fgZone, setValuation, setValuationLabel } from "@/lib/graham";
import type { UserProfile } from "@/lib/profile";

interface LiveData {
  fearGreed: number;
  setPe: number;
  fedRate: number;
  thbUsd: number;
  bestMos: number;
  bestMosSymbol: string;
  winRate?: number;
  profitFactor?: number;
  maxDrawdown?: number;
  signalConf?: number;
  regime?: string;
  grahamStocks?: number;
  cape?: number;
}

interface Props {
  data: LiveData;
}

interface KPICell {
  label: string;
  value: string;
  subtext: string;
  status: "good" | "warn" | "bad" | "neutral";
}

function buildInvestorKPIs(profile: UserProfile, data: LiveData): KPICell[] {
  const taxResult = calcThaiTax({
    annualIncome: profile.annualIncome,
    rmfAmount: profile.rmfAmount,
    thaiEsgAmount: profile.thaiEsgAmount,
    ssfAmount: profile.ssfAmount,
  });
  const maxDeduction = Math.min(profile.annualIncome * 0.3, 800_000);
  const taxPct = maxDeduction > 0 ? (taxResult.totalDeduction / maxDeduction) * 100 : 0;
  const taxSaved = taxResult.estimatedTaxSaved;

  const fgS = kpiStatus(data.fearGreed, 25, "below");
  const peS = kpiStatus(data.setPe, 17.89, "below");
  const mosS = kpiStatus(data.bestMos, 30, "above");
  const taxS = kpiStatus(taxPct, 80, "above");

  const fgZoneLabel = fgZone(data.fearGreed);
  const peValuation = setValuationLabel(setValuation(data.setPe));

  return [
    {
      label: "TAX DEDUCTION",
      value: `${taxPct.toFixed(0)}%`,
      subtext: taxPct >= 100
        ? `฿${(taxSaved / 1000).toFixed(0)}K saved — maxed`
        : `฿${(taxResult.totalDeduction / 1000).toFixed(0)}K / ฿${(maxDeduction / 1000).toFixed(0)}K`,
      status: taxS,
    },
    {
      label: "F&G SENTIMENT",
      value: `${data.fearGreed}`,
      subtext: fgZoneLabel === "extreme_fear"
        ? "Extreme Fear — Buffett buys"
        : fgZoneLabel === "fear"
        ? "Fear — discount zone"
        : fgZoneLabel === "greed"
        ? "Greed — be cautious"
        : fgZoneLabel === "extreme_greed"
        ? "Extreme Greed — lock gains"
        : "Neutral — wait",
      status: fgS,
    },
    {
      label: "SET P/E",
      value: data.setPe.toFixed(1),
      subtext: peValuation,
      status: peS,
    },
    {
      label: "BEST MOS",
      value: `${data.bestMos > 0 ? "+" : ""}${data.bestMos.toFixed(0)}%`,
      subtext: `${data.bestMosSymbol.replace(".BK", "")} vs Graham №`,
      status: mosS,
    },
    {
      label: "THB/USD",
      value: data.thbUsd.toFixed(2),
      subtext: data.thbUsd > 35 ? "Baht weak" : data.thbUsd < 32 ? "Baht strong" : "Baht stable",
      status: data.thbUsd > 37 || data.thbUsd < 30 ? "warn" : "neutral",
    },
  ];
}

function buildValueKPIs(data: LiveData): KPICell[] {
  return [
    {
      label: "GRAHAM STOCKS",
      value: `${data.grahamStocks ?? 0}`,
      subtext: "pass P/E≤15 · P/B≤1.5",
      status: kpiStatus(data.grahamStocks ?? 0, 3, "above"),
    },
    {
      label: "SET P/E",
      value: data.setPe.toFixed(1),
      subtext: `${((data.setPe - 17.89) / 17.89 * 100).toFixed(0)}% vs hist avg`,
      status: kpiStatus(data.setPe, 15, "below"),
    },
    {
      label: "BEST MOS",
      value: `${data.bestMos > 0 ? "+" : ""}${data.bestMos.toFixed(0)}%`,
      subtext: `${data.bestMosSymbol.replace(".BK", "")} — ${data.bestMos >= 30 ? "buy zone" : "watch"}`,
      status: kpiStatus(data.bestMos, 30, "above"),
    },
    {
      label: "US CAPE",
      value: (data.cape ?? 34.2).toFixed(1),
      subtext: (data.cape ?? 34.2) > 30 ? "US expensive" : "US fair",
      status: kpiStatus(data.cape ?? 34.2, 30, "below"),
    },
    {
      label: "F&G",
      value: `${data.fearGreed}`,
      subtext: data.fearGreed <= 25 ? "Buffett buys" : data.fearGreed >= 75 ? "Buffett warns" : "neutral",
      status: kpiStatus(data.fearGreed, 25, "below"),
    },
  ];
}

function buildTraderKPIs(data: LiveData): KPICell[] {
  const wr   = data.winRate    ?? 0;
  const pf   = data.profitFactor ?? 0;
  const dd   = data.maxDrawdown  ?? 0;
  const conf = data.signalConf   ?? 0;

  return [
    {
      label: "WIN RATE",
      value: `${wr.toFixed(1)}%`,
      subtext: wr >= 55 ? `↑ target 55% ✓` : `target 55% — ${(55 - wr).toFixed(1)}% gap`,
      status: kpiStatus(wr, 55, "above"),
    },
    {
      label: "PROFIT FACTOR",
      value: pf.toFixed(2),
      subtext: pf >= 1.5 ? "excellent ✓" : pf >= 1.0 ? "break-even" : "losing system",
      status: kpiStatus(pf, 1.5, "above"),
    },
    {
      label: "MAX DRAWDOWN",
      value: `${dd.toFixed(1)}%`,
      subtext: dd >= -5 ? "within limit ✓" : "exceeds 5% — size down",
      status: kpiStatus(dd, -5, "above"),
    },
    {
      label: "TOP SIGNAL",
      value: conf > 0 ? `${conf.toFixed(0)}/100` : "—",
      subtext: conf >= 70 ? "strong signal" : conf >= 50 ? "moderate" : "no clear signal",
      status: conf >= 70 ? "good" : conf >= 50 ? "warn" : "neutral",
    },
    {
      label: "REGIME",
      value: data.regime ? data.regime.replace("_", " ").toUpperCase() : "—",
      subtext: data.regime?.includes("trending") ? "full size OK" : "half size — range",
      status: data.regime?.includes("trending_up") ? "good" : data.regime?.includes("ranging") ? "warn" : "neutral",
    },
  ];
}

export function KPIStrip({ data }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const mode = profile?.mode ?? "investor";
  const cells = mode === "trader"
    ? buildTraderKPIs(data)
    : mode === "value"
    ? buildValueKPIs(data)
    : buildInvestorKPIs(profile ?? { annualIncome: 1_000_000, rmfAmount: 200_000, thaiEsgAmount: 100_000, ssfAmount: 0 } as UserProfile, data);

  const goodCount = cells.filter(c => c.status === "good").length;
  const badCount  = cells.filter(c => c.status === "bad").length;
  const overallStatus =
    badCount >= 2 ? "bad" : badCount >= 1 ? "warn" : goodCount >= 3 ? "good" : "neutral";

  return (
    <div style={{
      background: "var(--bg-raised)",
      borderBottom: "1px solid var(--line)",
      padding: 0,
    }}>
      {/* Status header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 16px",
        borderBottom: "1px solid var(--line-dim)",
      }}>
        <span className="t-micro">
          YOUR KPIs — {mode.toUpperCase()} MODE
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-micro)",
          color: statusColor(overallStatus),
          fontWeight: 600,
        }}>
          {statusIcon(overallStatus)} {goodCount}/{cells.length} ON TARGET
        </span>
      </div>

      {/* KPI cells */}
      <div style={{
        display: "flex",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {cells.map((cell, i) => (
          <div
            key={cell.label}
            style={{
              flex: "1 0 120px",
              padding: "10px 16px",
              borderRight: i < cells.length - 1 ? "1px solid var(--line)" : "none",
              minWidth: 110,
            }}
          >
            <div className="t-micro" style={{ marginBottom: 4 }}>{cell.label}</div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1rem",
              fontWeight: 700,
              color: statusColor(cell.status),
              lineHeight: 1.2,
            }}>
              {statusIcon(cell.status)} {cell.value}
            </div>
            <div style={{
              fontSize: "var(--text-micro)",
              fontFamily: "var(--font-body)",
              color: "var(--dim)",
              marginTop: 3,
              lineHeight: 1.3,
            }}>
              {cell.subtext}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
