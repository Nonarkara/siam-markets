export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6" style={{ fontFamily: "var(--font-body)" }}>
      <h1 className="t-display" style={{ marginBottom: "0.75rem" }}>
        Privacy Policy
      </h1>
      <p className="t-micro" style={{ color: "var(--dim)", marginBottom: "2rem" }}>
        Last updated: 21 May 2026
      </p>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          1. WHAT WE COLLECT
        </h2>
        <p className="t-body" style={{ lineHeight: 1.6, color: "var(--ink-dim)" }}>
          We do not collect personal identifiers such as your name, address, or phone number. We do not use cookies for tracking. We do not share data with third-party advertisers.
        </p>
        <p className="t-body" style={{ lineHeight: 1.6, color: "var(--ink-dim)", marginTop: "0.5rem" }}>
          The only data stored is your local portfolio simulation, which lives in your browser&apos;s localStorage and never leaves your device.
        </p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          2. ANALYTICS
        </h2>
        <p className="t-body" style={{ lineHeight: 1.6, color: "var(--ink-dim)" }}>
          We do not run Google Analytics, Meta Pixel, or any third-party analytics script. We measure nothing about your individual browsing behavior.
        </p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          3. EXTERNAL DATA SOURCES
        </h2>
        <p className="t-body" style={{ lineHeight: 1.6, color: "var(--ink-dim)" }}>
          Market data is fetched from public and licensed APIs (Yahoo Finance, Finnhub, FRED, BOT, GISTDA, Marketaux, JBlanked/ForexFactory, GDELT). These services may log your IP address in accordance with their own privacy policies.
        </p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          4. AI FEATURES
        </h2>
        <p className="t-body" style={{ lineHeight: 1.6, color: "var(--ink-dim)" }}>
          When AI-powered analysis is enabled, market summaries may be processed through language models. No personally identifiable information is transmitted.
        </p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 className="t-mono" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          5. YOUR RIGHTS
        </h2>
        <p className="t-body" style={{ lineHeight: 1.6, color: "var(--ink-dim)" }}>
          Because we store no personal data on our servers, there is no account to delete. Clear your browser&apos;s localStorage to remove any saved portfolio settings.
        </p>
      </section>

      <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--line-dim)" }}>
        <p className="t-micro" style={{ color: "var(--dim)" }}>
          This is a research preview. daytrade.town is not a registered investment advisor. Nothing on this site constitutes financial advice.
        </p>
      </div>
    </div>
  );
}
