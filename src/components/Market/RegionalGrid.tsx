"use client";

import { useState } from "react";
import type { YahooQuote } from "@/lib/api/yahoo";
import { REGIONAL_MARKETS, VIETNAM_PLACEHOLDER } from "@/lib/api/yahoo";
import { fmtNum, fmtPct, pctClass, pctColor } from "@/lib/format";

interface Props {
  thai:   YahooQuote[];
  asean:  YahooQuote[];
  china:  YahooQuote[];
  global: YahooQuote[];
}

const TABS = [
  { key: "asean",  label: "ASEAN" },
  { key: "china",  label: "China" },
  { key: "global", label: "Global" },
] as const;

type TabKey = typeof TABS[number]["key"];

function QuoteRow({ quote, meta }: {
  quote: YahooQuote;
  meta: { flag: string; region: string };
}) {
  const isUp = quote.changePct >= 0;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "11px 16px",
      borderBottom: "1px solid var(--line)",
      minHeight: 44,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{meta.flag}</span>
        <div>
          <div className="t-body" style={{ fontWeight: 600 }}>{quote.name}</div>
          <div className="t-micro">{meta.region}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="t-mono" style={{ fontWeight: 600 }}>
          {fmtNum(quote.price, quote.price > 1000 ? 0 : 2)}
        </div>
        <div className={`t-mono ${pctClass(quote.changePct)}`} style={{ fontSize: "0.75rem" }}>
          {fmtPct(quote.changePct)}
        </div>
      </div>
    </div>
  );
}

function VietnamRow() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "11px 16px",
      borderBottom: "1px solid var(--line)",
      minHeight: 44,
      opacity: 0.5,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.1rem" }}>{VIETNAM_PLACEHOLDER.flag}</span>
        <div>
          <div className="t-body" style={{ fontWeight: 600 }}>{VIETNAM_PLACEHOLDER.name}</div>
          <div className="t-micro">{VIETNAM_PLACEHOLDER.region}</div>
        </div>
      </div>
      <div className="t-micro" style={{ color: "var(--dim)", textAlign: "right", maxWidth: 100 }}>
        {VIETNAM_PLACEHOLDER.note}
      </div>
    </div>
  );
}

export function RegionalGrid({ thai, asean, china, global }: Props) {
  const [tab, setTab] = useState<TabKey>("asean");

  const dataMap = { asean, china, global };
  const metaMap = {
    asean:  REGIONAL_MARKETS.asean,
    china:  REGIONAL_MARKETS.china,
    global: REGIONAL_MARKETS.global,
  };

  const rows = dataMap[tab];
  const metas = metaMap[tab];

  // SET bar — always shown at top
  const set = thai[0];

  return (
    <div className="card" style={{ padding: 0 }}>
      {/* SET hero row */}
      {set ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid var(--line)",
          background: "var(--bg-hover)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.1rem" }}>🇹🇭</span>
            <div>
              <div className="t-body" style={{ fontWeight: 700 }}>SET Index</div>
              <div className="t-micro">Thailand · live</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="t-mono" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {fmtNum(set.price, 2)}
            </div>
            <div
              className="t-mono"
              style={{ color: pctColor(set.changePct), fontSize: "0.875rem" }}
            >
              {fmtPct(set.changePct)}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-hover)" }}>
          <div className="t-micro">SET — loading...</div>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: "10px 8px",
              minHeight: 44,
              background: tab === key ? "var(--bg-hover)" : "transparent",
              border: "none",
              borderBottom: tab === key ? `2px solid var(--bull)` : "2px solid transparent",
              color: tab === key ? "var(--ink)" : "var(--muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-micro)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: tab === key ? 600 : 400,
              cursor: "pointer",
              transition: "all 180ms var(--ease)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Rows */}
      {rows.map((quote, i) => {
        const meta = metas[i] as { flag: string; region: string; name: string };
        return <QuoteRow key={quote.symbol} quote={quote} meta={meta} />;
      })}

      {/* Vietnam placeholder — show in ASEAN tab */}
      {tab === "asean" && <VietnamRow />}

      {/* Thai investor context */}
      {tab === "china" && (
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)" }}>
          <div className="t-micro" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
            China funds are among the most popular foreign investments for Thai retail investors (K-CHINA, B-CHINA).
          </div>
        </div>
      )}
      {tab === "asean" && (
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)" }}>
          <div className="t-micro" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
            Thai investors increasingly hold ASEAN exposure through regional equity funds and ETFs.
          </div>
        </div>
      )}
    </div>
  );
}
