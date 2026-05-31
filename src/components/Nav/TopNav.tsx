"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileBadge } from "@/components/KPI/ProfileBadge";
import { LangToggle } from "@/components/KPI/LangToggle";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";

const NAV = [
  { href: "/",          label: "DESK"      },
  { href: "/markets",   label: "MARKETS"   },
  { href: "/regime",    label: "REGIME"    },
  { href: "/signals",   label: "SIGNALS"   },
  { href: "/scan",      label: "BUYS"      },
  { href: "/funds",     label: "FUNDS"     },
  { href: "/newsroom",  label: "LIVE"      },
  { href: "/money",     label: "PORTFOLIO" },
  { href: "/plan",      label: "PLAN"      },
  { href: "/trade",     label: "TRADE"     },
  { href: "/about",     label: "◦ ABOUT"   },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="heartbeat-line" />
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: "var(--top-h)",
          background: "var(--bg-raised)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          zIndex: 100,
          gap: 0,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-body)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "var(--ink)",
            textDecoration: "none",
            marginRight: 8,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          DAYTRADERS
          <span style={{
            display: "inline-block",
            width: 5,
            height: 5,
            background: "var(--red-anchor)",
            flexShrink: 0,
          }} />
        </Link>
        <div style={{ marginRight: 16 }} />

      <div style={{ display: "flex", flex: 1, gap: 0 }}>
        {NAV.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro)",
                letterSpacing: "0.08em",
                fontWeight: active ? 700 : 400,
                color: active ? "var(--amber-nav)" : "var(--muted)",
                textDecoration: "none",
                padding: "0 14px",
                height: "var(--top-h)",
                display: "inline-flex",
                alignItems: "center",
                borderBottom: active ? "2px solid var(--amber-nav)" : "2px solid transparent",
                transition: "all 180ms var(--ease)",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ThemeToggle />
        <LangToggle />
        <ProfileBadge />
      </div>
    </nav>
    </>
  );
}
