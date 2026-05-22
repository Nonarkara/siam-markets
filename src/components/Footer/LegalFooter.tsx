"use client";

import Link from "next/link";

export function LegalFooter() {
  return (
    <footer style={{
      background: "var(--bg-raised)",
      borderTop: "1px solid var(--line)",
      padding: "10px 16px",
      flexShrink: 0,
    }}>
      <div style={{
        background: "var(--caution-10)",
        border: "1px solid var(--caution)",
        padding: "6px 10px",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700,
          color: "#000", background: "var(--caution)", padding: "1px 5px", letterSpacing: "0.1em",
        }}>
          RESEARCH PREVIEW
        </span>
        <span className="t-body" style={{ fontSize: "0.75rem", color: "var(--caution)", lineHeight: 1.4 }}>
          Experimental prototype. Do not use for actual trading. Data may be simulated or delayed.
        </span>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/privacy" className="t-micro" style={{ color: "var(--muted)", textDecoration: "none" }}>
            PRIVACY
          </Link>
          <Link href="/history" className="t-micro" style={{ color: "var(--muted)", textDecoration: "none" }}>
            HISTORY
          </Link>
        </div>
        <span className="t-micro" style={{ color: "var(--dim)" }}>
          © 2024–2026 Non Arkara. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
