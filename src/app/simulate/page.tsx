"use client";

import { useState, useMemo } from "react";
import type { SimulatedTrade, SimPortfolio, PerformanceMetrics } from "@/lib/types";
import { enterTrade, closeTrade, checkOpenTrades, calculateMetrics, calculatePositionSize } from "@/lib/trading";
import { MOCK_OHLCV_PTT, MOCK_OHLCV_ADVANC, MOCK_OHLCV_KBANK } from "@/lib/api/mock";
import { fmtNum, pctColor } from "@/lib/format";

const STOCKS = [
  { symbol: "PTT.BK", name: "PTT", price: MOCK_OHLCV_PTT[MOCK_OHLCV_PTT.length - 1].close },
  { symbol: "ADVANC.BK", name: "Advanced Info", price: MOCK_OHLCV_ADVANC[MOCK_OHLCV_ADVANC.length - 1].close },
  { symbol: "KBANK.BK", name: "Kasikorn Bank", price: MOCK_OHLCV_KBANK[MOCK_OHLCV_KBANK.length - 1].close },
];

const TABS = ["Open Trades", "History", "Performance"] as const;
type Tab = typeof TABS[number];

function createInitialPortfolio(): SimPortfolio {
  const now = new Date().toISOString();
  return {
    cash: 1_000_000,
    initialCash: 1_000_000,
    trades: [],
    equityCurve: [{ date: now, equity: 1_000_000 }],
  };
}

export default function SimulatePage() {
  const [portfolio, setPortfolio] = useState<SimPortfolio>(createInitialPortfolio);
  const [tab, setTab] = useState<Tab>("Open Trades");
  const [symbol, setSymbol] = useState("PTT.BK");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [riskPct, setRiskPct] = useState(1);
  const [reason, setReason] = useState("");
  const [journal, setJournal] = useState("");
  const [error, setError] = useState("");

  const metrics = useMemo(() => calculateMetrics(portfolio), [portfolio]);
  const openTrades = portfolio.trades.filter((t) => t.status === "open");
  const closedTrades = portfolio.trades.filter((t) => t.status !== "open");

  const selectedStock = STOCKS.find((s) => s.symbol === symbol);

  const sizing = useMemo(() => {
    const entry = Number(entryPrice);
    const stop = Number(stopLoss);
    if (!entry || !stop || entry <= 0) return null;
    return calculatePositionSize({
      accountSize: portfolio.cash,
      riskPct,
      entryPrice: entry,
      stopLoss: stop,
    }, target ? Number(target) : undefined);
  }, [entryPrice, stopLoss, target, portfolio.cash, riskPct]);

  function handleEnterTrade() {
    setError("");
    const entry = Number(entryPrice);
    const stop = Number(stopLoss);
    const tgt = target ? Number(target) : undefined;

    if (!entry || !stop || entry <= 0) {
      setError("Enter valid entry and stop loss prices");
      return;
    }
    if (direction === "long" && stop >= entry) {
      setError("For long trades, stop loss must be below entry price");
      return;
    }
    if (direction === "short" && stop <= entry) {
      setError("For short trades, stop loss must be above entry price");
      return;
    }
    if (!reason.trim()) {
      setError("Enter a reason for this trade");
      return;
    }

    try {
      const { portfolio: newPort } = enterTrade(
        portfolio,
        symbol,
        direction,
        entry,
        stop,
        tgt ?? (direction === "long" ? entry * 1.03 : entry * 0.97),
        riskPct,
        reason,
        new Date().toISOString(),
      );
      setPortfolio(newPort);
      setEntryPrice("");
      setStopLoss("");
      setTarget("");
      setReason("");
      setJournal("");
    } catch (e) {
      setError(String(e));
    }
  }

  function handleCloseTrade(tradeId: string, exitPrice: number, status: "closed" | "stopped" | "targeted") {
    const newPort = closeTrade(portfolio, tradeId, exitPrice, new Date().toISOString(), status);
    setPortfolio(newPort);
  }

  return (
    <div className="page page-enter">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div className="t-micro" style={{ marginBottom: 6 }}>PAPER TRADING</div>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Simulator</h1>
        <p className="t-body" style={{ color: "var(--muted)" }}>
          Trade with fake money. Prove your edge before risking real capital.
        </p>
      </div>

      {/* Portfolio summary */}
      <div className="grid-2" style={{ marginBottom: "var(--gap)" }}>
        <div className="card">
          <div className="t-micro" style={{ marginBottom: 4 }}>CASH AVAILABLE</div>
          <div className="t-mono" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            ฿{fmtNum(portfolio.cash, 0)}
          </div>
        </div>
        <div className="card">
          <div className="t-micro" style={{ marginBottom: 4 }}>TOTAL RETURN</div>
          <div className="t-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: pctColor(metrics.totalReturnPct) }}>
            {metrics.totalReturnPct >= 0 ? "+" : ""}{fmtNum(metrics.totalReturnPct, 2)}%
          </div>
        </div>
      </div>

      {/* New trade form */}
      <div className="t-micro" style={{ marginBottom: 8 }}>NEW TRADE</div>
      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>STOCK</label>
            <select
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                const s = STOCKS.find((x) => x.symbol === e.target.value);
                if (s) setEntryPrice(s.price.toFixed(2));
              }}
              style={{
                width: "100%",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "8px 12px",
                fontSize: "0.875rem",
                fontFamily: "var(--font-body)",
              }}
            >
              {STOCKS.map((s) => (
                <option key={s.symbol} value={s.symbol}>{s.symbol.replace(".BK", "")} — {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>DIRECTION</label>
            <div style={{ display: "flex", gap: 0, border: "1px solid var(--line)" }}>
              <button
                onClick={() => setDirection("long")}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: direction === "long" ? "var(--bull-20)" : "transparent",
                  border: "none",
                  color: direction === "long" ? "var(--bull)" : "var(--muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                LONG
              </button>
              <button
                onClick={() => setDirection("short")}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: direction === "short" ? "var(--bear-20)" : "transparent",
                  border: "none",
                  borderLeft: "1px solid var(--line)",
                  color: direction === "short" ? "var(--bear)" : "var(--muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                SHORT
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>ENTRY PRICE</label>
            <input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "8px 12px",
                fontSize: "0.875rem",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>STOP LOSS</label>
            <input
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "8px 12px",
                fontSize: "0.875rem",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>TARGET (OPTIONAL)</label>
            <input
              type="number"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "8px 12px",
                fontSize: "0.875rem",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>RISK %</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
              style={{
                width: "100%",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "8px 12px",
                fontSize: "0.875rem",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>
          <div>
            <label className="t-micro" style={{ display: "block", marginBottom: 4 }}>TRADE REASON</label>
            <input
              type="text"
              placeholder="e.g. EMA crossover + RSI oversold"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                padding: "8px 12px",
                fontSize: "0.875rem",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>
        </div>

        {sizing && (
          <div style={{ background: "var(--bg-raised)", padding: "10px 12px", marginBottom: 12, border: "1px solid var(--line)" }}>
            <div className="t-micro" style={{ marginBottom: 4, color: "var(--caution)" }}>POSITION SIZE</div>
            <div className="t-body" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {sizing.shares} shares · ฿{fmtNum(sizing.notional, 0)} notional · Risk: ฿{fmtNum(sizing.riskAmount, 0)}
              {sizing.riskReward ? ` · R:R 1:${sizing.riskReward.toFixed(2)}` : ""}
            </div>
          </div>
        )}

        {error && (
          <div className="t-body" style={{ color: "var(--bear)", fontSize: "0.8rem", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleEnterTrade}
          style={{
            width: "100%",
            padding: "14px",
            background: direction === "long" ? "var(--bull)" : "var(--bear)",
            border: "none",
            color: "var(--bg)",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          {direction === "long" ? "BUY" : "SELL"} {symbol.replace(".BK", "")}
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          marginBottom: "var(--gap)",
          border: "1px solid var(--line)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "12px 8px",
              minHeight: 44,
              background: tab === t ? "var(--bg-hover)" : "transparent",
              border: "none",
              borderRight: t !== "Performance" ? "1px solid var(--line)" : "none",
              color: tab === t ? "var(--bull)" : "var(--muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-micro)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: tab === t ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Open Trades" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {openTrades.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 24 }}>
              <div className="t-body" style={{ color: "var(--muted)" }}>No open positions</div>
              <div className="t-micro" style={{ marginTop: 6 }}>Enter a trade above to start</div>
            </div>
          ) : (
            openTrades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} onClose={handleCloseTrade} />
            ))
          )}
        </div>
      )}

      {tab === "History" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {closedTrades.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 24 }}>
              <div className="t-body" style={{ color: "var(--muted)" }}>No closed trades yet</div>
            </div>
          ) : (
            closedTrades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))
          )}
        </div>
      )}

      {tab === "Performance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          <div className="card">
            <div className="t-micro" style={{ marginBottom: 12 }}>PERFORMANCE METRICS</div>
            <div className="grid-2">
              <PerfMetric label="Total Trades" value={metrics.totalTrades.toString()} />
              <PerfMetric label="Win Rate" value={`${fmtNum(metrics.winRate, 1)}%`} color={metrics.winRate > 50 ? "var(--bull)" : "var(--bear)"} />
              <PerfMetric label="Avg Win" value={`฿${fmtNum(metrics.avgWin, 0)}`} color="var(--bull)" />
              <PerfMetric label="Avg Loss" value={`฿${fmtNum(metrics.avgLoss, 0)}`} color="var(--bear)" />
              <PerfMetric label="Profit Factor" value={metrics.profitFactor.toFixed(2)} color={metrics.profitFactor > 1.5 ? "var(--bull)" : metrics.profitFactor > 1 ? "var(--caution)" : "var(--bear)"} />
              <PerfMetric label="Max Drawdown" value={`${fmtNum(metrics.maxDrawdownPct, 2)}%`} color="var(--bear)" />
              <PerfMetric label="Sharpe Ratio" value={metrics.sharpeRatio.toFixed(2)} color={metrics.sharpeRatio > 1 ? "var(--bull)" : "var(--muted)"} />
              <PerfMetric label="Current Equity" value={`฿${fmtNum(metrics.currentEquity, 0)}`} />
            </div>
          </div>

          <div className="card">
            <div className="t-micro" style={{ marginBottom: 8 }}>THE 1% RULE CHECK</div>
            <div className="t-body" style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.6 }}>
              {metrics.totalTrades < 20
                ? "You need at least 20 trades for statistically meaningful metrics. Keep trading and journaling."
                : metrics.winRate < 40
                ? "Your win rate is below 40%. Review your setups. Are you trading against the trend? Are your stops too tight?"
                : metrics.profitFactor < 1
                ? "Your profit factor is below 1.0 — you are losing more than you win. Stop. Review. Fix your risk management."
                : metrics.profitFactor < 1.5
                ? "Breaking even is not enough. Aim for profit factor > 1.5. Focus on letting winners run and cutting losers fast."
                : "Solid performance. Profit factor > 1.5 with discipline suggests a real edge. Consider going live with 1% risk."}
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      <div style={{ marginTop: "var(--gap)", textAlign: "center" }}>
        <button
          onClick={() => {
            if (confirm("Reset portfolio to ฿1,000,000? All trades will be lost.")) {
              setPortfolio(createInitialPortfolio());
            }
          }}
          style={{
            background: "transparent",
            border: "1px solid var(--line)",
            color: "var(--muted)",
            padding: "10px 20px",
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            cursor: "pointer",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Reset Portfolio
        </button>
      </div>
    </div>
  );
}

function TradeCard({ trade, onClose }: { trade: SimulatedTrade; onClose?: (id: string, price: number, status: "closed" | "stopped" | "targeted") => void }) {
  const isOpen = trade.status === "open";
  const pnl = trade.pnl ?? 0;
  const pnlColor = pnl > 0 ? "var(--bull)" : pnl < 0 ? "var(--bear)" : "var(--muted)";

  return (
    <div className="card" style={{ borderLeft: `3px solid ${pnlColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="t-mono" style={{ fontWeight: 700, fontSize: "1rem" }}>{trade.symbol.replace(".BK", "")}</span>
            <span
              className="t-micro"
              style={{
                color: trade.direction === "long" ? "var(--bull)" : "var(--bear)",
                border: `1px solid ${trade.direction === "long" ? "var(--bull)" : "var(--bear)"}`,
                padding: "2px 6px",
              }}
            >
              {trade.direction.toUpperCase()}
            </span>
          </div>
          <div className="t-micro" style={{ marginTop: 2 }}>
            {trade.quantity} shares · Entry: ฿{fmtNum(trade.entryPrice, 2)}
          </div>
        </div>
        {!isOpen && (
          <div style={{ textAlign: "right" }}>
            <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 700, color: pnlColor }}>
              {pnl >= 0 ? "+" : ""}฿{fmtNum(pnl, 0)}
            </div>
            <div className="t-micro" style={{ color: pnlColor }}>
              {trade.pnlPct?.toFixed(2)}% · {trade.status.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        <Metric label="Stop" value={`฿${fmtNum(trade.stopLoss, 2)}`} color="var(--bear)" />
        <Metric label="Target" value={`฿${fmtNum(trade.target, 2)}`} color="var(--bull)" />
        <Metric label="R:R" value={`1:${trade.riskReward.toFixed(2)}`} color="var(--caution)" />
      </div>

      <div className="t-body" style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: isOpen ? 8 : 0 }}>
        Reason: {trade.reason}
      </div>

      {isOpen && onClose && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => onClose(trade.id, trade.target, "targeted")}
            style={{
              flex: 1,
              padding: "8px",
              background: "var(--bull-20)",
              border: "1px solid var(--bull)",
              color: "var(--bull)",
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            HIT TARGET
          </button>
          <button
            onClick={() => onClose(trade.id, trade.stopLoss, "stopped")}
            style={{
              flex: 1,
              padding: "8px",
              background: "var(--bear-20)",
              border: "1px solid var(--bear)",
              color: "var(--bear)",
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            HIT STOP
          </button>
          <button
            onClick={() => {
              const mid = (trade.entryPrice + trade.target) / 2;
              onClose(trade.id, mid, "closed");
            }}
            style={{
              flex: 1,
              padding: "8px",
              background: "var(--bg-hover)",
              border: "1px solid var(--line)",
              color: "var(--muted)",
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  );
}

function PerfMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: "8px 0" }}>
      <div className="t-micro" style={{ marginBottom: 2 }}>{label}</div>
      <div className="t-mono" style={{ fontSize: "1rem", fontWeight: 600, color: color ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="t-micro" style={{ marginBottom: 2 }}>{label}</div>
      <div className="t-mono" style={{ fontSize: "0.8rem", fontWeight: 600, color: color ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}
