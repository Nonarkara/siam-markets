"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",          label: "DESK",      icon: DeskIcon     },
  { href: "/markets",   label: "MARKETS",   icon: MarketsIcon  },
  { href: "/regime",    label: "REGIME",    icon: RegimeIcon   },
  { href: "/signals",   label: "WEB",       icon: WebIcon      },
  { href: "/scan",      label: "BUYS",      icon: ScanIcon     },
  { href: "/funds",     label: "FUNDS",     icon: FundsIcon    },
  { href: "/newsroom",  label: "LIVE",      icon: NewsroomIcon },
  { href: "/money",     label: "PORTFOLIO", icon: MoneyIcon    },
  { href: "/plan",      label: "PLAN",      icon: PlanIcon     },
  { href: "/trade",     label: "TRADE",     icon: TradeIcon    },
  { href: "/about",     label: "ABOUT",     icon: AboutIcon    },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        height: "var(--nav-h)",
        background: "var(--bg-raised)",
        borderTop: "1px solid var(--line)",
        display: "flex",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        zIndex: 100,
      }}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: "0 0 72px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              color: active ? "var(--amber-nav)" : "var(--dim)",
              textDecoration: "none",
              minHeight: "var(--nav-h)",
              transition: "color 180ms var(--ease)",
              borderTop: active ? "2px solid var(--amber-nav)" : "2px solid transparent",
            }}
          >
            <Icon active={active} />
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-micro)",
              letterSpacing: "0.08em",
              fontWeight: active ? 700 : 400,
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Icons ───────────────────────────────────────────────────────

function DeskIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function MarketsIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function RegimeIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <line x1="4" y1="19" x2="20" y2="19" />
      <rect x="5" y="11" width="3" height="8" />
      <rect x="11" y="5" width="3" height="14" />
      <rect x="17" y="8" width="3" height="11" />
      <path d="M4 7h4l3 4 4-7 5 5" />
    </svg>
  );
}

function ScanIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function NewsroomIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="2" y="5" width="20" height="14" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="19" x2="12" y2="21" />
      <line x1="6" y1="9" x2="10" y2="9" />
      <line x1="6" y1="12" x2="14" y2="12" />
      <line x1="6" y1="15" x2="12" y2="15" />
    </svg>
  );
}

function TradeIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  );
}

function MoneyIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="2" y="7" width="20" height="14" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function FundsIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="3" y="12" width="4" height="9" />
      <rect x="10" y="7" width="4" height="14" />
      <rect x="17" y="3" width="4" height="18" />
    </svg>
  );
}

function BacktestIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <polyline points="3,17 8,12 13,15 21,7" />
      <polyline points="16,7 21,7 21,12" />
    </svg>
  );
}

function WebIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="12" cy="5"  r="2" />
      <circle cx="5"  cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <line x1="12" y1="7"  x2="5"  y2="17" />
      <line x1="12" y1="7"  x2="19" y2="17" />
      <line x1="5"  y1="19" x2="19" y2="19" />
    </svg>
  );
}

function AboutIcon({ active }: { active: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
