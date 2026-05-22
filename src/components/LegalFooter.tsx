"use client";

import Link from "next/link";

export function LegalFooter() {
  return (
    <footer style={{
      borderTop: "1px solid var(--line-dim)",
      padding: "6px 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "6px 16px",
      fontFamily: "var(--font-mono)",
      fontSize: "0.5rem",
      color: "var(--dim)",
      letterSpacing: "0.06em",
      background: "var(--bg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span>© {new Date().getFullYear()} daytrade.town</span>
        <span style={{ color: "var(--bear)" }}>● RESEARCH PREVIEW</span>
        <span>NOT FINANCIAL ADVICE</span>
        <span style={{ color: "var(--dim)" }}>DATA MAY BE DELAYED OR SIMULATED</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link href="/privacy" style={{ color: "var(--dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
          Privacy
        </Link>
        <Link href="/history" style={{ color: "var(--dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
          Development
        </Link>
        <span>Built with Next.js · Chart.js · Tailwind CSS</span>
      </div>
    </footer>
  );
}
