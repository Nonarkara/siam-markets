/**
 * Paper Trading Simulator Engine
 * Pure functions for trade simulation, P&L tracking, and performance metrics.
 */

import type { OHLCV } from "./technical";

// ─── Types ───────────────────────────────────────────────────────

export interface SimulatedTrade {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  target: number;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  status: "open" | "closed" | "stopped" | "targeted";
  pnl?: number;
  pnlPct?: number;
  riskReward: number;
  reason: string;
  journal?: string;
}

export interface SimPortfolio {
  cash: number;
  initialCash: number;
  trades: SimulatedTrade[];
  equityCurve: { date: string; equity: number }[];
}

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  currentEquity: number;
  totalReturnPct: number;
}

// ─── Trade Execution ─────────────────────────────────────────────

export function enterTrade(
  portfolio: SimPortfolio,
  symbol: string,
  direction: "long" | "short",
  entryPrice: number,
  stopLoss: number,
  target: number,
  riskPct: number, // % of equity to risk
  reason: string,
  date: string,
): { portfolio: SimPortfolio; trade: SimulatedTrade } {
  const equity = portfolio.cash;
  const riskAmount = equity * (riskPct / 100);
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  const quantity = riskPerUnit > 0 ? Math.floor(riskAmount / riskPerUnit) : 0;
  const notional = quantity * entryPrice;

  if (notional > portfolio.cash || quantity === 0) {
    throw new Error("Insufficient funds or invalid stop loss");
  }

  const trade: SimulatedTrade = {
    id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    symbol,
    direction,
    entryPrice,
    stopLoss,
    target,
    quantity,
    entryDate: date,
    status: "open",
    riskReward: Math.abs((target - entryPrice) / (entryPrice - stopLoss)),
    reason,
  };

  const newPortfolio: SimPortfolio = {
    ...portfolio,
    cash: portfolio.cash - notional,
    trades: [...portfolio.trades, trade],
  };

  return { portfolio: newPortfolio, trade };
}

export function closeTrade(
  portfolio: SimPortfolio,
  tradeId: string,
  exitPrice: number,
  exitDate: string,
  status: "closed" | "stopped" | "targeted",
): SimPortfolio {
  const trades = portfolio.trades.map((t) => {
    if (t.id !== tradeId || t.status !== "open") return t;
    const pnl = t.direction === "long"
      ? (exitPrice - t.entryPrice) * t.quantity
      : (t.entryPrice - exitPrice) * t.quantity;
    const pnlPct = (pnl / (t.entryPrice * t.quantity)) * 100;
    return {
      ...t,
      exitPrice,
      exitDate,
      status,
      pnl,
      pnlPct,
    };
  });

  const closedTrade = trades.find((t) => t.id === tradeId);
  const cashReturned = closedTrade
    ? closedTrade.entryPrice * closedTrade.quantity + (closedTrade.pnl ?? 0)
    : 0;

  return {
    ...portfolio,
    cash: portfolio.cash + cashReturned,
    trades,
  };
}

// ─── Check Open Trades Against Price ─────────────────────────────

export function checkOpenTrades(
  portfolio: SimPortfolio,
  currentPrice: number,
  date: string,
): SimPortfolio {
  let updated = portfolio;
  for (const trade of portfolio.trades) {
    if (trade.status !== "open") continue;

    if (trade.direction === "long") {
      if (currentPrice <= trade.stopLoss) {
        updated = closeTrade(updated, trade.id, trade.stopLoss, date, "stopped");
      } else if (currentPrice >= trade.target) {
        updated = closeTrade(updated, trade.id, trade.target, date, "targeted");
      }
    } else {
      if (currentPrice >= trade.stopLoss) {
        updated = closeTrade(updated, trade.id, trade.stopLoss, date, "stopped");
      } else if (currentPrice <= trade.target) {
        updated = closeTrade(updated, trade.id, trade.target, date, "targeted");
      }
    }
  }
  return updated;
}

// ─── Performance Metrics ─────────────────────────────────────────

export function calculateMetrics(portfolio: SimPortfolio): PerformanceMetrics {
  const closed = portfolio.trades.filter((t) => t.status !== "open");
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0);

  const totalWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));

  const equityCurve = portfolio.equityCurve.map((e) => e.equity);
  let maxDrawdown = 0;
  let peak = equityCurve[0] ?? portfolio.initialCash;
  for (const equity of equityCurve) {
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Simple Sharpe proxy (daily returns vs risk-free = 0)
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push((equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1]);
  }
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 0
    ? returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

  const currentEquity = portfolio.cash + portfolio.trades
    .filter((t) => t.status === "open")
    .reduce((s, t) => s + t.entryPrice * t.quantity, 0);

  return {
    totalTrades: closed.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    avgWin: wins.length > 0 ? totalWin / wins.length : 0,
    avgLoss: losses.length > 0 ? totalLoss / losses.length : 0,
    profitFactor: totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Infinity : 0,
    maxDrawdownPct: maxDrawdown * 100,
    sharpeRatio: sharpe,
    currentEquity,
    totalReturnPct: ((currentEquity - portfolio.initialCash) / portfolio.initialCash) * 100,
  };
}

// ─── Position Sizing Calculator ──────────────────────────────────

export interface SizingInput {
  accountSize: number;
  riskPct: number;
  entryPrice: number;
  stopLoss: number;
}

export interface SizingResult {
  riskAmount: number;
  shares: number;
  notional: number;
  riskPerShare: number;
  riskReward?: number;
  target?: number;
}

export function calculatePositionSize(input: SizingInput, targetPrice?: number): SizingResult {
  const riskAmount = input.accountSize * (input.riskPct / 100);
  const riskPerShare = Math.abs(input.entryPrice - input.stopLoss);
  const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
  const notional = shares * input.entryPrice;
  const riskReward = targetPrice
    ? Math.abs((targetPrice - input.entryPrice) / riskPerShare)
    : undefined;

  return {
    riskAmount,
    shares,
    notional,
    riskPerShare,
    riskReward,
    target: targetPrice,
  };
}

// ─── Kelly Criterion ─────────────────────────────────────────────

export function kellyCriterion(winRate: number, avgWin: number, avgLoss: number): number {
  const b = avgLoss > 0 ? avgWin / avgLoss : 0;
  const p = winRate / 100;
  const q = 1 - p;
  const kelly = b > 0 ? (b * p - q) / b : 0;
  return Math.max(0, Math.min(1, kelly));
}

export function quarterKelly(winRate: number, avgWin: number, avgLoss: number): number {
  return kellyCriterion(winRate, avgWin, avgLoss) / 4;
}
