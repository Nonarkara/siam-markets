"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",          label: "Market Pulse" },
  { href: "/trade",     label: "Trade Desk" },
  { href: "/simulate",  label: "Simulator" },
  { href: "/events",    label: "World × Markets" },
  { href: "/scanner",   label: "Value Scanner" },
  { href: "/portfolio", label: "Portfolio & Tax" },
  { href: "/school",    label: "Trading School" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--top-h)",
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        gap: 0,
        zIndex: 100,
      }}
    >
      {/* Wordmark */}
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink)",
          textDecoration: "none",
          marginRight: 32,
          whiteSpace: "nowrap",
        }}
      >
        SIAM MARKETS
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 0, flex: 1 }}>
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-micro)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--bull)" : "var(--muted)",
                textDecoration: "none",
                padding: "0 16px",
                height: "var(--top-h)",
                display: "inline-flex",
                alignItems: "center",
                borderBottom: active ? "2px solid var(--bull)" : "2px solid transparent",
                transition: "all 200ms var(--ease)",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
