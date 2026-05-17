"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",          label: "Pulse",   icon: PulseIcon },
  { href: "/trade",     label: "Trade",   icon: TradeIcon },
  { href: "/simulate",  label: "Sim",     icon: SimIcon },
  { href: "/scanner",   label: "Scan",    icon: ScanIcon },
  { href: "/school",    label: "Learn",   icon: SchoolIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--nav-h)",
        background: "var(--bg-raised)",
        borderTop: "1px solid var(--line)",
        display: "flex",
        zIndex: 100,
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              color: active ? "var(--bull)" : "var(--dim)",
              textDecoration: "none",
              minHeight: "var(--nav-h)",
              transition: "color 200ms var(--ease)",
            }}
          >
            <Icon active={active} />
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: active ? 600 : 400,
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Icons (SVG, 20×20) ──────────────────────────────────────────

function PulseIcon({ active }: { active: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  );
}

function TradeIcon({ active }: { active: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  );
}

function SimIcon({ active }: { active: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="2" y="3" width="20" height="14" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function ScanIcon({ active }: { active: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="3" y="3" width="18" height="18" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="15" x2="12" y2="15" />
    </svg>
  );
}

function SchoolIcon({ active }: { active: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
