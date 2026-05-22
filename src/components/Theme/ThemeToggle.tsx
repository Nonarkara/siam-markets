"use client";

/**
 * Three-way theme toggle: DARK → LIGHT → INVERTED → DARK.
 * Persisted to localStorage; data-theme attribute on <html> is read by
 * globals.css. An inline script in layout.tsx sets the initial value
 * before paint, so there is no flash of the wrong theme.
 */

import { useEffect, useState } from "react";

export type Theme = "dark" | "light" | "inverted";

const STORAGE_KEY = "dt-theme";
const ORDER: Theme[] = ["dark", "light", "inverted"];
const NEXT_LABEL: Record<Theme, string> = {
  dark:     "DARK",
  light:    "LIGHT",
  inverted: "INVERT",
};
const NEXT_GLYPH: Record<Theme, string> = {
  dark:     "◐",
  light:    "○",
  inverted: "●",
};

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "inverted" || raw === "dark") return raw;
  return "dark";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const cycle = () => {
    const idx = ORDER.indexOf(theme);
    const next = ORDER[(idx + 1) % ORDER.length];
    setTheme(next);
    applyTheme(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode */ }
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to cycle.`}
      title={`Theme: ${theme}`}
      style={{
        background: "transparent",
        border: "1px solid var(--line)",
        color: "var(--ink)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.625rem",
        letterSpacing: "0.14em",
        fontWeight: 700,
        padding: "0 10px",
        minHeight: 32,
        minWidth: 88,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden style={{ fontSize: "0.875rem", lineHeight: 1 }}>{NEXT_GLYPH[theme]}</span>
      <span>{NEXT_LABEL[theme]}</span>
    </button>
  );
}

/** Inline script string — run in layout's <head> before paint. */
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t !== 'light' && t !== 'inverted' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
