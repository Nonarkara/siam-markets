"use client";

import { useState, useEffect } from "react";
import {
  loadHoldings, saveHoldings, addHolding, removeHolding,
  computeHoldingPnL, computePortfolio,
  assetTypeLabel, assetTypeColor,
  type Holding, type AssetType,
} from "@/lib/portfolio";
import { MOCK_STOCKS } from "@/lib/api/mock";
import { mockFundNAV, POPULAR_FUNDS } from "@/lib/api/thaisec";
import { fmtThb, fmtPct, pctColor } from "@/lib/format";

// Live price lookup — stocks from mock, funds from SEC
function getPrice(symbol: string, type: AssetType): number {
  if (type === "stock") {
    const s = MOCK_STOCKS.find(s => s.symbol === symbol);
    return s?.price ?? 0;
  }
  return mockFundNAV(symbol).nav;
}

function PnLBadge({ pnlPct, pnlThb }: { pnlPct: number; pnlThb: number }) {
  const color = pctColor(pnlPct);
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 700, color }}>
        {fmtThb(pnlThb, true)}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color }}>
        {fmtPct(pnlPct)}
      </div>
    </div>
  );
}

function AddHoldingForm({ onAdd, onCancel }: { onAdd: (h: Omit<Holding, "id">) => void; onCancel: () => void }) {
  const [symbol, setSymbol]   = useState("");
  const [name, setName]       = useState("");
  const [type, setType]       = useState<AssetType>("stock");
  const [shares, setShares]   = useState("");
  const [price, setPrice]     = useState("");
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [tab, setTab]         = useState<"stock" | "fund">("stock");

  const inputStyle = {
    background: "var(--bg)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    padding: "8px 10px",
    width: "100%",
    outline: "none",
    minHeight: 40,
  };

  function handleAdd() {
    if (!symbol || !shares || !price) return;
    onAdd({
      symbol: symbol.toUpperCase() + (tab === "stock" && !symbol.includes(".") ? ".BK" : ""),
      name: name || symbol,
      type,
      shares: parseFloat(shares),
      avgBuyPrice: parseFloat(price),
      buyDate: date,
    });
  }

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--bull)", padding: 16 }}>
      <div className="t-micro" style={{ color: "var(--bull)", marginBottom: 12 }}>ADD HOLDING</div>

      {/* Stock vs Fund tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
        {(["stock", "fund"] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setType(t === "fund" ? "fund_rmf" : "stock"); }}
            style={{
              flex: 1, padding: "8px", minHeight: 36,
              background: tab === t ? "var(--bull)" : "transparent",
              border: `1px solid ${tab === t ? "var(--bull)" : "var(--line)"}`,
              color: tab === t ? "#000" : "var(--muted)",
              fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
              fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer",
            }}
          >
            {t === "stock" ? "STOCK" : "MUTUAL FUND"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tab === "stock" ? (
          <div>
            <div className="t-micro" style={{ marginBottom: 4 }}>TICKER (e.g. KBANK)</div>
            <input
              style={inputStyle}
              value={symbol}
              onChange={e => {
                setSymbol(e.target.value.toUpperCase());
                const found = MOCK_STOCKS.find(s => s.symbol === e.target.value.toUpperCase() + ".BK");
                if (found) { setName(found.name); setType("stock"); }
              }}
              placeholder="KBANK"
            />
          </div>
        ) : (
          <div>
            <div className="t-micro" style={{ marginBottom: 4 }}>FUND CODE</div>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={symbol}
              onChange={e => {
                const f = POPULAR_FUNDS.find(f => f.code === e.target.value);
                setSymbol(e.target.value);
                if (f) {
                  setName(f.name);
                  setType(f.type === "RMF" ? "fund_rmf" : f.type === "ThaiESG" ? "fund_esg" : f.type === "SSF" ? "fund_ssf" : "fund_other");
                }
              }}
            >
              <option value="">Select fund...</option>
              {POPULAR_FUNDS.map(f => (
                <option key={f.code} value={f.code}>{f.code} — {f.nameTh}</option>
              ))}
              <option value="CUSTOM">Other (type manually)</option>
            </select>
            {symbol === "CUSTOM" && (
              <input style={{ ...inputStyle, marginTop: 6 }} placeholder="Fund code" onChange={e => setSymbol(e.target.value)} />
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <div className="t-micro" style={{ marginBottom: 4 }}>{tab === "stock" ? "SHARES" : "UNITS"}</div>
            <input style={inputStyle} type="number" value={shares} onChange={e => setShares(e.target.value)} placeholder="1000" />
          </div>
          <div>
            <div className="t-micro" style={{ marginBottom: 4 }}>AVG BUY PRICE (฿)</div>
            <input style={inputStyle} type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="141.00" />
          </div>
        </div>

        <div>
          <div className="t-micro" style={{ marginBottom: 4 }}>BUY DATE</div>
          <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {shares && price && (
          <div style={{ padding: "8px 10px", background: "var(--bull-10)", border: "1px solid var(--bull)" }}>
            <div className="t-micro" style={{ color: "var(--bull)" }}>TOTAL COST</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--bull)" }}>
              {fmtThb(parseFloat(shares || "0") * parseFloat(price || "0"))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", background: "transparent",
            border: "1px solid var(--line)", color: "var(--muted)",
            fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", cursor: "pointer", minHeight: 40,
          }}>CANCEL</button>
          <button onClick={handleAdd} disabled={!symbol || !shares || !price} style={{
            flex: 2, padding: "10px",
            background: symbol && shares && price ? "var(--bull)" : "var(--line)",
            border: "none",
            color: symbol && shares && price ? "#000" : "var(--dim)",
            fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)",
            fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", minHeight: 40,
          }}>ADD TO PORTFOLIO →</button>
        </div>
      </div>
    </div>
  );
}

export function PortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const raw = loadHoldings();
    // Enrich with live prices
    const enriched = raw.map(h => computeHoldingPnL(h, getPrice(h.symbol, h.type)));
    setHoldings(enriched);
  }, []);

  function handleAdd(h: Omit<Holding, "id">) {
    const newH = addHolding(h);
    const enriched = computeHoldingPnL(newH, getPrice(newH.symbol, newH.type));
    setHoldings(prev => [...prev, enriched]);
    setAdding(false);
  }

  function handleRemove(id: string) {
    removeHolding(id);
    setHoldings(prev => prev.filter(h => h.id !== id));
  }

  const portfolio = computePortfolio(holdings);
  const setBenchmarkReturn = 1.92; // mock: live SET return since earliest buy date

  // Group by type
  const stocks = holdings.filter(h => h.type === "stock");
  const funds  = holdings.filter(h => h.type !== "stock");

  const SectionHeader = ({ label, count }: { label: string; count: number }) => (
    <div style={{ padding: "6px 16px", background: "var(--bg)", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
      <span className="t-micro">{label}</span>
      <span className="t-micro" style={{ color: "var(--dim)" }}>{count} holdings</span>
    </div>
  );

  const HoldingRow = ({ h }: { h: Holding }) => {
    const isExpanded = expanded === h.id;
    const typeColor = assetTypeColor(h.type);
    return (
      <div style={{ borderBottom: "1px solid var(--line)" }}>
        <button
          onClick={() => setExpanded(isExpanded ? null : h.id)}
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 16px", width: "100%",
            background: isExpanded ? "var(--bg-hover)" : "transparent",
            border: "none", borderLeft: `3px solid ${typeColor}`,
            cursor: "pointer", textAlign: "left", minHeight: 56,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span className="t-body" style={{ fontWeight: 700 }}>{h.symbol.replace(".BK", "")}</span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "0.5rem",
                color: typeColor, border: `1px solid ${typeColor}`,
                padding: "1px 4px", letterSpacing: "0.06em",
              }}>
                {assetTypeLabel(h.type)}
              </span>
            </div>
            <div className="t-micro">{h.nameTh ?? h.name}</div>
          </div>
          <PnLBadge pnlPct={h.pnlPct ?? 0} pnlThb={h.pnlThb ?? 0} />
        </button>

        {isExpanded && (
          <div style={{ padding: "10px 16px 14px", background: "var(--bg-surface)", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { l: "SHARES/UNITS", v: h.shares.toLocaleString() },
                { l: "AVG BUY", v: `฿${h.avgBuyPrice.toFixed(2)}` },
                { l: "CURRENT", v: h.currentPrice ? `฿${h.currentPrice.toFixed(2)}` : "—" },
                { l: "COST", v: fmtThb(h.avgBuyPrice * h.shares, true) },
                { l: "VALUE", v: fmtThb(h.currentValue ?? 0, true) },
                { l: "BUY DATE", v: h.buyDate },
              ].map(item => (
                <div key={item.l}>
                  <div className="t-micro" style={{ marginBottom: 2 }}>{item.l}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600 }}>{item.v}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleRemove(h.id)}
              style={{
                background: "none", border: "1px solid var(--bear)",
                color: "var(--bear)", fontFamily: "var(--font-mono)",
                fontSize: "0.55rem", letterSpacing: "0.06em",
                padding: "4px 10px", cursor: "pointer", minHeight: 28,
              }}
            >
              REMOVE
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

      {/* Portfolio summary */}
      <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
        <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--line)" }}>
          <span className="t-micro">MY PORTFOLIO · LIVE P&L</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {[
            { label: "TOTAL VALUE",  value: fmtThb(portfolio.totalValue, true),   color: "var(--ink)" },
            { label: "TOTAL COST",   value: fmtThb(portfolio.totalCost, true),    color: "var(--muted)" },
            { label: "TOTAL P&L",    value: fmtThb(portfolio.totalPnlThb, true),  color: pctColor(portfolio.totalPnlPct) },
            { label: "RETURN",       value: fmtPct(portfolio.totalPnlPct),         color: pctColor(portfolio.totalPnlPct) },
          ].map((item, i) => (
            <div key={item.label} style={{
              padding: "12px 16px",
              borderRight: i % 2 === 0 ? "1px solid var(--line)" : "none",
              borderBottom: i < 2 ? "1px solid var(--line)" : "none",
            }}>
              <div className="t-micro" style={{ marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* vs SET benchmark */}
        <div style={{ padding: "10px 16px", background: "var(--bg)", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
          <span className="t-micro">vs SET BENCHMARK</span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 700,
            color: portfolio.totalPnlPct > setBenchmarkReturn ? "var(--bull)" : "var(--caution)",
          }}>
            {portfolio.totalPnlPct > setBenchmarkReturn ? "▲ BEATING" : "▼ LAGGING"} SET by {Math.abs(portfolio.totalPnlPct - setBenchmarkReturn).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Add form */}
      {adding ? (
        <AddHoldingForm onAdd={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            width: "100%", padding: "12px", minHeight: 48,
            background: "transparent", border: "1px dashed var(--bull)",
            color: "var(--bull)", fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro)", fontWeight: 700,
            letterSpacing: "0.08em", cursor: "pointer",
          }}
        >
          + ADD STOCK OR FUND
        </button>
      )}

      {/* Holdings list */}
      {holdings.length > 0 && (
        <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
          {stocks.length > 0 && (
            <>
              <SectionHeader label="STOCKS" count={stocks.length} />
              {stocks.map(h => <HoldingRow key={h.id} h={h} />)}
            </>
          )}
          {funds.length > 0 && (
            <>
              <SectionHeader label="MUTUAL FUNDS" count={funds.length} />
              {funds.map(h => <HoldingRow key={h.id} h={h} />)}
            </>
          )}
        </div>
      )}

      <div className="t-micro" style={{ textAlign: "center", color: "var(--dim)" }}>
        Prices: mock until ingestion runs · Holdings stored on this device · Not financial advice
      </div>
    </div>
  );
}
