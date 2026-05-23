"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { PanelBoundary } from "@/components/ErrorBoundary/PanelBoundary";

interface Props {
  title: string;
  accentColor?: string;
  children: ReactNode;
  href?: string;
  hrefLabel?: string;
}

export function QuadrantPanel({
  title,
  accentColor = "var(--tech)",
  children,
  href,
  hrefLabel = "FULL →",
}: Props) {
  return (
    <div className="quadrant-panel">
      <div className="quadrant-header">
        <div
          className="quadrant-header-dot"
          style={{ background: accentColor }}
        />
        <span className="quadrant-header-title" style={{ color: accentColor }}>
          {title}
        </span>
        {href && (
          <Link href={href} className="quadrant-header-link">
            {hrefLabel}
          </Link>
        )}
      </div>
      <div className="quadrant-content">
        <PanelBoundary label={`DESK · ${title}`}>
          {children}
        </PanelBoundary>
      </div>
    </div>
  );
}
