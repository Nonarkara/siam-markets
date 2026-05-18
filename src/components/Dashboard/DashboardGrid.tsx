"use client";

import Link from "next/link";
import type { YahooQuote } from "@/lib/api/yahoo";
import type { StockFundamentals, FearGreed } from "@/lib/types";
import type { MarketSignal } from "@/lib/signals";
import { fmtNum, fmtPct, pctColor, pctClass } from "@/lib/format";
import { yieldCurveContext, vixContext } from "@/lib/stats";

interface Props {
  liveSet: YahooQuote | null;
  fearGreed: FearGreed;
  assetClasses: YahooQuote[];
  regionalAsean: YahooQuote[];
  regionalChina: YahooQuote[];
  signals: MarketSignal[];
  topStocks: StockFundamentals[];
  yieldSpread: number | null;
  vix: number | null;
  cfnai: number | null;
}

// Section header that links to the deep-dive page
function SectionLink({ label, href, count }: { label: string; href: string; count?: string }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      marginBottom: 6,
    }}>
      <span className="t-micro">{label}</span>
      <Link
        href={href}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-micro)",
          color: "var(--tech)",
          textDecoration: "none",
          letterSpacing: "0.06em",
        }}
      >
        {count ?? "→ MORE"}
      </Link>
    </div>
  );
}

// Compact index tile
function IndexTile({ quote, size = "normal" }: { quote: YahooQuote; size?: "large" | "normal" }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--line)",
      padding: size === "large" ? "14px" : "10px 12px",
      flex: 1,
      minWidth: 0,
    }}>
      <div className="t-micro" style={{ marginBottom: 4 }}>{quote.name}</div>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: size === "large" ? "1.25rem" : "0.9375rem",
        fontWeight: 700,
        lineHeight: 1,
      }}>
        {fmtNum(quote.price, quote.price > 1000 ? 0 : 2)}
      </div>
      <div className={`t-mono ${pctClass(quote.changePct)}`} style={{ fontSize: "0.75rem", marginTop: 4 }}>
        {fmtPct(quote.changePct)}
      </div>
    </div>
  );
}

// Compact signal card
function SignalCard({ signal }: { signal: MarketSignal }) {
  const actionColors: Record<string, string> = {
    buy: "var(--bull)", watch: "var(--caution)", sell: "var(--bear)",
    hold: "var(--muted)", avoid: "var(--bear)", info: "var(--tech)",
  };
  const color = actionColors[signal.action] ?? "var(--muted)";

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--line)",
      borderLeft: `3px solid ${color}`,
      padding: "10px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          fontWeight: 700,
          color,
          border: `1px solid ${color}`,
          padding: "1px 5px",
          letterSpacing: "0.08em",
        }}>
          {signal.action.toUpperCase()}
        </span>
        <span className="t-micro">{signal.value}</span>
      </div>
      <div className="t-body" style={{ fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.3, marginBottom: 4 }}>
        {signal.title}
      </div>
      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>
        → {signal.implication.slice(0, 80)}{signal.implication.length > 80 ? "…" : ""}
      </div>
    </div>
  );
}

// Compact asset row
function AssetRow({ asset }: { asset: YahooQuote }) {
  const isVix = asset.symbol === "^VIX";
  const changePct = isVix ? -asset.changePct : asset.changePct;
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "7px 12px",
      borderBottom: "1px solid var(--line)",
      minHeight: 36,
    }}>
      <span className="t-body" style={{ fontSize: "0.8125rem" }}>{asset.name}</span>
      <div style={{ textAlign: "right" }}>
        <div className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
          {asset.price > 10000 ? `$${(asset.price / 1000).toFixed(1)}K` :
           asset.price > 100  ? `$${fmtNum(asset.price, 1)}` :
           `$${fmtNum(asset.price, 3)}`}
        </div>
        <div className={`t-mono ${pctClass(changePct)}`} style={{ fontSize: "0.6875rem" }}>
          {fmtPct(asset.changePct)}
        </div>
      </div>
    </div>
  );
}

export function DashboardGrid({
  liveSet,
  fearGreed,
  assetClasses,
  regionalAsean,
  regionalChina,
  signals,
  topStocks,
  yieldSpread,
  vix,
  cfnai,
}: Props) {
  const ycCtx  = yieldSpread !== null ? yieldCurveContext(yieldSpread) : null;
  const vixCtx = vix !== null ? vixContext(vix) : null;

  // Pick key assets for the compact strip
  const gold   = assetClasses.find(a => a.symbol === "GC=F");
  const oil    = assetClasses.find(a => a.symbol === "CL=F");
  const btc    = assetClasses.find(a => a.symbol === "BTC-USD");
  const vixQ   = assetClasses.find(a => a.symbol === "^VIX");
  const us10y  = assetClasses.find(a => a.symbol === "^TNX");

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* ── Row 1: SET + F&G ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 1, background: "var(--line)", marginBottom: 1 }}>
        {/* SET hero cell */}
        <div style={{
          flex: 2,
          background: "var(--bg-surface)",
          padding: "16px",
        }}>
          <div className="t-micro" style={{ marginBottom: 6 }}>SET INDEX · LIVE</div>
          {liveSet ? (
            <>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.875rem",
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: 6,
              }}>
                {fmtNum(liveSet.price, 2)}
              </div>
              <div className="t-mono" style={{ color: pctColor(liveSet.changePct), fontSize: "1rem", fontWeight: 600 }}>
                {fmtPct(liveSet.changePct)}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                {[
                  { label: "52W H", value: fmtNum(liveSet.high52w, 2) },
                  { label: "52W L", value: fmtNum(liveSet.low52w, 2) },
                ].map(item => (
                  <div key={item.label}>
                    <div className="t-micro">{item.label}</div>
                    <div className="t-mono" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="shimmer" style={{ height: 50 }} />
          )}
        </div>

        {/* F&G compact cell */}
        <div style={{
          flex: 1,
          background: "var(--bg-surface)",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
        }}>
          <div className="t-micro">MR. MARKET</div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "2rem",
            fontWeight: 700,
            color: fearGreed.score <= 25 ? "var(--bull)" : fearGreed.score >= 75 ? "var(--caution)" : "var(--muted)",
            lineHeight: 1,
          }}>
            {fearGreed.score}
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.55rem",
            letterSpacing: "0.08em",
            color: fearGreed.score <= 25 ? "var(--bull)" : fearGreed.score >= 75 ? "var(--caution)" : "var(--muted)",
            fontWeight: 700,
            textAlign: "center",
          }}>
            {fearGreed.label.replace("_", " ").toUpperCase()}
          </div>
          {fearGreed.score <= 25 && (
            <div style={{ fontSize: "0.6rem", color: "var(--bull)", textAlign: "center", fontFamily: "var(--font-body)" }}>
              BUFFETT BUYS
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Signals ───────────────────────────────────── */}
      <div style={{ padding: "0 16px" }}>
        <SectionLink label="SIGNAL INTELLIGENCE" href="/" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {signals.slice(0, 2).map(s => <SignalCard key={s.id} signal={s} />)}
        </div>
      </div>

      {/* ── Row 3: Regional + Assets (2-col) ─────────────────── */}
      <div style={{ display: "flex", gap: 1, background: "var(--line)", marginBottom: 12 }}>
        {/* Regional compact */}
        <div style={{ flex: 1, background: "var(--bg-raised)", minWidth: 0 }}>
          <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <span className="t-micro">REGIONAL</span>
            <Link href="/markets" style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--tech)", textDecoration: "none", letterSpacing: "0.06em" }}>→</Link>
          </div>
          {[...(regionalAsean.slice(0, 3))].map(q => (
            <div key={q.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", borderBottom: "1px solid var(--line)", minHeight: 36 }}>
              <span className="t-body" style={{ fontSize: "0.8125rem" }}>{q.name}</span>
              <div style={{ textAlign: "right" }}>
                <div className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{fmtNum(q.price, 0)}</div>
                <div className={`t-mono ${pctClass(q.changePct)}`} style={{ fontSize: "0.6875rem" }}>{fmtPct(q.changePct)}</div>
              </div>
            </div>
          ))}
          {[...(regionalChina.slice(0, 2))].map(q => (
            <div key={q.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", borderBottom: "1px solid var(--line)", minHeight: 36 }}>
              <span className="t-body" style={{ fontSize: "0.8125rem" }}>{q.name}</span>
              <div style={{ textAlign: "right" }}>
                <div className="t-mono" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{fmtNum(q.price, 0)}</div>
                <div className={`t-mono ${pctClass(q.changePct)}`} style={{ fontSize: "0.6875rem" }}>{fmtPct(q.changePct)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Key assets compact */}
        <div style={{ flex: 1, background: "var(--bg-raised)", minWidth: 0 }}>
          <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <span className="t-micro">ASSETS</span>
            <Link href="/markets" style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--tech)", textDecoration: "none", letterSpacing: "0.06em" }}>→</Link>
          </div>
          {[gold, oil, btc, vixQ, us10y].filter(Boolean).map(asset => (
            <AssetRow key={asset!.symbol} asset={asset!} />
          ))}
        </div>
      </div>

      {/* ── Row 4: Recession indicators strip ────────────────── */}
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <SectionLink label="RECESSION WATCH" href="/markets" />
        <div style={{ display: "flex", gap: 1, background: "var(--line)" }}>
          {[
            {
              label: "YIELD CURVE",
              value: yieldSpread !== null ? `${yieldSpread > 0 ? "+" : ""}${yieldSpread.toFixed(2)}%` : "—",
              sub: ycCtx?.signal.toUpperCase() ?? "—",
              color: ycCtx?.color ?? "var(--muted)",
            },
            {
              label: "VIX",
              value: vix ? vix.toFixed(1) : "—",
              sub: vixCtx?.label ?? "—",
              color: vixCtx?.color ?? "var(--muted)",
            },
            {
              label: "CFNAI",
              value: cfnai !== null ? `${cfnai > 0 ? "+" : ""}${cfnai.toFixed(2)}` : "—",
              sub: cfnai !== null ? (cfnai >= 0 ? "AT TREND" : cfnai >= -0.7 ? "BELOW TREND" : "RECESSION SIG") : "—",
              color: cfnai === null ? "var(--muted)" : cfnai >= 0 ? "var(--bull)" : cfnai >= -0.7 ? "var(--caution)" : "var(--bear)",
            },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              flex: 1,
              background: "var(--bg-surface)",
              padding: "10px 12px",
            }}>
              <div className="t-micro" style={{ marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: item.color }}>{item.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: item.color, marginTop: 3, letterSpacing: "0.06em", fontWeight: 700 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 5: Value scanner preview ─────────────────────── */}
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <SectionLink label="VALUE SCANNER — SET50" href="/scan" count={`${topStocks.filter(s => s.marginOfSafety > 0).length} BUY ZONES →`} />
        <div style={{ background: "var(--bg-raised)", border: "1px solid var(--line)" }}>
          {/* Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "5px 12px", background: "var(--bg)", borderBottom: "1px solid var(--line)", gap: 4 }}>
            {["STOCK", "P/E", "P/B", "MOS"].map(h => <div key={h} className="t-micro">{h}</div>)}
          </div>
          {topStocks.slice(0, 5).map((stock, i) => (
            <div key={stock.symbol} style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              padding: "7px 12px",
              borderBottom: i < 4 ? "1px solid var(--line)" : "none",
              gap: 4,
              minHeight: 36,
              alignItems: "center",
              background: stock.marginOfSafety >= 30 ? "var(--bull-10)" : "transparent",
            }}>
              <div>
                <div className="t-mono" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{stock.symbol.replace(".BK", "")}</div>
              </div>
              <div className="t-mono" style={{ fontSize: "0.8125rem", color: stock.pe <= 15 ? "var(--bull)" : stock.pe <= 20 ? "var(--caution)" : "var(--bear)" }}>
                {stock.pe.toFixed(1)}
              </div>
              <div className="t-mono" style={{ fontSize: "0.8125rem", color: stock.pb <= 1.5 ? "var(--bull)" : "var(--muted)" }}>
                {stock.pb.toFixed(2)}
              </div>
              <div className="t-mono" style={{ fontSize: "0.8125rem", color: stock.marginOfSafety >= 30 ? "var(--bull)" : stock.marginOfSafety >= 0 ? "var(--caution)" : "var(--bear)", fontWeight: 700 }}>
                {stock.marginOfSafety > 0 ? "+" : ""}{stock.marginOfSafety.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
