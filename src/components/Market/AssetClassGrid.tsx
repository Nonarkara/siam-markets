"use client";

import type { YahooQuote } from "@/lib/api/yahoo";
import { fmtNum, fmtPct, pctColor, pctClass } from "@/lib/format";

interface Props {
  assets: YahooQuote[];
}

const CATEGORY_ORDER = ["commodity", "crypto", "volatility", "bonds", "currency"];
const CATEGORY_LABELS: Record<string, string> = {
  commodity:  "COMMODITIES",
  crypto:     "CRYPTO",
  volatility: "VOLATILITY",
  bonds:      "BONDS",
  currency:   "CURRENCIES",
};

const ASSET_CATEGORY: Record<string, string> = {
  "GC=F":     "commodity",
  "SI=F":     "commodity",
  "CL=F":     "commodity",
  "NG=F":     "commodity",
  "HG=F":     "commodity",
  "BTC-USD":  "crypto",
  "^VIX":     "volatility",
  "^TNX":     "bonds",
  "^IRX":     "bonds",
  "DX-Y.NYB": "currency",
};

// VIX is inverse — higher = worse
function assetColor(symbol: string, changePct: number): string {
  if (symbol === "^VIX") return pctColor(-changePct);
  return pctColor(changePct);
}

function assetClass(symbol: string, changePct: number): string {
  if (symbol === "^VIX") return pctClass(-changePct);
  return pctClass(changePct);
}

// Format price based on asset type
function formatPrice(symbol: string, price: number): string {
  if (symbol === "BTC-USD") return `$${(price / 1000).toFixed(1)}K`;
  if (symbol === "^VIX" || symbol === "^TNX" || symbol === "^IRX") return price.toFixed(2);
  if (symbol === "DX-Y.NYB") return price.toFixed(2);
  if (price > 1000) return `$${(price / 1000).toFixed(1)}K`;
  if (price > 100)  return `$${price.toFixed(1)}`;
  return `$${price.toFixed(3)}`;
}

function getUnit(symbol: string): string {
  if (symbol === "^TNX" || symbol === "^IRX") return "% yield";
  if (symbol === "^VIX") return "index";
  if (symbol === "DX-Y.NYB") return "DXY";
  if (symbol === "NG=F") return "MMBtu";
  if (symbol === "HG=F") return "lb";
  if (symbol === "SI=F") return "oz";
  if (symbol === "GC=F") return "oz";
  if (symbol === "CL=F") return "bbl";
  return "";
}

export function AssetClassGrid({ assets }: Props) {
  // Group by category
  const grouped: Record<string, YahooQuote[]> = {};
  for (const a of assets) {
    const cat = ASSET_CATEGORY[a.symbol] ?? "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  }

  return (
    <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
      {/* Header */}
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span className="t-micro">GLOBAL ASSET CLASSES · LIVE</span>
        <span className="t-micro" style={{ color: "var(--dim)" }}>Yahoo Finance · no key</span>
      </div>

      {/* Asset rows */}
      {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
        <div key={cat}>
          {/* Category label */}
          <div style={{
            padding: "5px 16px",
            background: "var(--bg)",
            borderBottom: "1px solid var(--line)",
          }}>
            <span className="t-micro" style={{ color: "var(--dim)" }}>{CATEGORY_LABELS[cat]}</span>
          </div>

          {/* Asset rows in this category */}
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {grouped[cat].map((asset, i) => (
              <div
                key={asset.symbol}
                style={{
                  flex: "1 0 160px",
                  padding: "10px 16px",
                  borderRight: "1px solid var(--line)",
                  borderBottom: "1px solid var(--line)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: 52,
                }}
              >
                <div>
                  <div className="t-body" style={{ fontWeight: 600 }}>{asset.name}</div>
                  <div className="t-micro">{getUnit(asset.symbol)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="t-mono" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                    {formatPrice(asset.symbol, asset.price)}
                  </div>
                  <div
                    className={`t-mono ${assetClass(asset.symbol, asset.changePct)}`}
                    style={{ fontSize: "0.75rem", marginTop: 2 }}
                  >
                    {fmtPct(asset.changePct)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
