"use client";

import { useLang } from "@/lib/i18n/useLang";

export function LangToggle() {
  const { lang, toggle } = useLang();

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${lang === "en" ? "Thai" : "English"}`}
      style={{
        background: "transparent",
        border: "1px solid var(--line)",
        color: "var(--muted)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-micro)",
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "4px 10px",
        cursor: "pointer",
        minHeight: 28,
        display: "flex",
        alignItems: "center",
        gap: 5,
        transition: "all 180ms var(--ease)",
      }}
    >
      <span style={{ opacity: lang === "en" ? 1 : 0.4 }}>EN</span>
      <span style={{ color: "var(--line)" }}>│</span>
      <span style={{ opacity: lang === "th" ? 1 : 0.4, fontFamily: "IBM Plex Sans Thai, sans-serif" }}>ไทย</span>
    </button>
  );
}
