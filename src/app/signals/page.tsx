import { MarketGraph } from "@/components/Desk/MarketGraph";

export const metadata = {
  title: "Signal Web — DayTraders",
  description: "The market as a web of cause and effect. Tap any node to trace what moves it and what it moves — the second-order relationships traders carry in their heads.",
};

export default function SignalsPage() {
  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 16 }}>
        <h1 className="t-display" style={{ marginBottom: 6 }}>Signal Web</h1>
        <p className="t-body" style={{ color: "var(--muted)", maxWidth: "62ch" }}>
          The market is a web of cause and effect. Each line is a relationship — Oil drives Energy; the Fed drives the baht, which lifts exporters; the cycle stage we&apos;re in drags banks and lifts gold. Tap a node to trace what moves it and what it moves.
        </p>
      </div>
      <MarketGraph />
    </div>
  );
}
