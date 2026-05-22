import { BacktestEngine } from "@/components/Backtest/BacktestEngine";

export const revalidate = 300;

export default function BacktestPage() {
  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 24 }}>
        <div className="t-micro" style={{ marginBottom: 6, color: "var(--tech)" }}>
          STRATEGY LAB
        </div>
        <h1 className="t-display" style={{ marginBottom: 8, fontSize: "1.5rem" }}>
          Would Graham Have Won?
        </h1>
        <p className="t-body" style={{ color: "var(--muted)", maxWidth: 600, lineHeight: 1.6 }}>
          Test Benjamin Graham's value investing rules against 5 years of simulated SET50 history.
          Compare strategy returns vs buy-and-hold. See the equity curve. Understand the drawdowns.
        </p>
      </div>

      <BacktestEngine />
    </div>
  );
}
