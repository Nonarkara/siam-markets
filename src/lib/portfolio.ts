/**
 * Portfolio management — holdings, P&L, vs benchmark.
 * localStorage-backed. Supabase-ready (same interface, swap storage layer).
 */

export type AssetType = "stock" | "fund_rmf" | "fund_esg" | "fund_ssf" | "fund_other";

export interface Holding {
  id: string;
  symbol: string;       // "KBANK.BK" or fund code "K-CHINA"
  name: string;
  nameTh?: string;
  type: AssetType;
  shares: number;       // units / shares
  avgBuyPrice: number;  // THB per share/unit
  buyDate: string;      // ISO date
  notes?: string;
  // Computed at runtime (not stored):
  currentPrice?: number;
  currentValue?: number;
  pnlThb?: number;
  pnlPct?: number;
}

export interface PortfolioSnapshot {
  holdings: Holding[];
  totalCost: number;
  totalValue: number;
  totalPnlThb: number;
  totalPnlPct: number;
  setBenchmarkReturn: number;  // SET % return over same period
  updatedAt: string;
}

const STORAGE_KEY = "siam_portfolio_v1";

// ─── CRUD ─────────────────────────────────────────────────────────

export function loadHoldings(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultHoldings();
  } catch {
    return [];
  }
}

export function saveHoldings(holdings: Holding[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function addHolding(h: Omit<Holding, "id">): Holding {
  const holding: Holding = { ...h, id: crypto.randomUUID() };
  const all = loadHoldings();
  saveHoldings([...all, holding]);
  return holding;
}

export function removeHolding(id: string): void {
  saveHoldings(loadHoldings().filter(h => h.id !== id));
}

export function updateHolding(id: string, updates: Partial<Holding>): void {
  saveHoldings(loadHoldings().map(h => h.id === id ? { ...h, ...updates } : h));
}

// ─── P&L calculation ──────────────────────────────────────────────

export function computeHoldingPnL(
  holding: Holding,
  currentPrice: number,
): Holding {
  const cost = holding.avgBuyPrice * holding.shares;
  const value = currentPrice * holding.shares;
  const pnlThb = value - cost;
  const pnlPct = cost > 0 ? (pnlThb / cost) * 100 : 0;
  return { ...holding, currentPrice, currentValue: value, pnlThb, pnlPct };
}

export function computePortfolio(holdings: Holding[]): Omit<PortfolioSnapshot, "setBenchmarkReturn"> {
  const totalCost  = holdings.reduce((s, h) => s + h.avgBuyPrice * h.shares, 0);
  const totalValue = holdings.reduce((s, h) => s + (h.currentValue ?? h.avgBuyPrice * h.shares), 0);
  const totalPnlThb = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnlThb / totalCost) * 100 : 0;
  return {
    holdings,
    totalCost,
    totalValue,
    totalPnlThb,
    totalPnlPct,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Asset type helpers ───────────────────────────────────────────

export function assetTypeLabel(type: AssetType, lang: "en" | "th" = "en"): string {
  const labels: Record<AssetType, { en: string; th: string }> = {
    stock:       { en: "Stock",     th: "หุ้น"         },
    fund_rmf:    { en: "RMF",       th: "กองทุน RMF"   },
    fund_esg:    { en: "Thai ESG",  th: "Thai ESG"     },
    fund_ssf:    { en: "SSF",       th: "กองทุน SSF"   },
    fund_other:  { en: "Fund",      th: "กองทุน"       },
  };
  return labels[type][lang];
}

export function assetTypeColor(type: AssetType): string {
  switch (type) {
    case "stock":      return "var(--bull)";
    case "fund_rmf":   return "var(--tech)";
    case "fund_esg":   return "#22c55e";
    case "fund_ssf":   return "var(--caution)";
    case "fund_other": return "var(--muted)";
  }
}

// ─── Default demo portfolio ───────────────────────────────────────

function defaultHoldings(): Holding[] {
  return [
    {
      id: "demo-1",
      symbol: "KBANK.BK",
      name: "Kasikorn Bank",
      nameTh: "ธนาคารกสิกรไทย",
      type: "stock",
      shares: 1000,
      avgBuyPrice: 136.50,
      buyDate: "2024-03-15",
    },
    {
      id: "demo-2",
      symbol: "K-ESG",
      name: "Kasikorn Thai ESG Fund",
      nameTh: "กสิกร Thai ESG",
      type: "fund_esg",
      shares: 10000,
      avgBuyPrice: 10.20,
      buyDate: "2024-01-10",
    },
    {
      id: "demo-3",
      symbol: "KFGBFRMF",
      name: "KF Global Bond RMF",
      nameTh: "กสิกรพันธบัตรโลก RMF",
      type: "fund_rmf",
      shares: 20000,
      avgBuyPrice: 9.45,
      buyDate: "2023-12-20",
    },
  ];
}
