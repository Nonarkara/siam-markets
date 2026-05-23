"use client";

/**
 * Tabs — a row of sub-dashboard buttons.
 * Children render the active tab's body. Locked to one tab visible at a time.
 *
 *   <Tabs
 *     tabs={[
 *       { id: "wall",   label: "TV WALL", content: <TVWall /> },
 *       { id: "news",   label: "NEWS",    content: <NewsTicker /> },
 *     ]}
 *   />
 */

import { useState, type ReactNode } from "react";
import { PanelBoundary } from "@/components/ErrorBoundary/PanelBoundary";

export interface Tab {
  id: string;
  label: string;
  badge?: string;   // small mono text rendered after the label
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
  defaultId?: string;
  /** Right-side controls (filters, toggles) shown next to the tab bar. */
  trailing?: ReactNode;
}

export function Tabs({ tabs, defaultId, trailing }: Props) {
  const [active, setActive] = useState<string>(defaultId ?? tabs[0]?.id ?? "");
  const current = tabs.find(t => t.id === active) ?? tabs[0];

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          background: "var(--bg-raised)",
          borderBottom: "1px solid var(--line)",
          flexShrink: 0,
        }}
      >
        <div className="tabs-bar" role="tablist" aria-label="Sub-dashboards" style={{ flex: 1, minWidth: 0, borderBottom: "none" }}>
          {tabs.map(t => {
            const isActive = t.id === current?.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${t.id}`}
                id={`tab-${t.id}`}
                className={`tab ${isActive ? "tab--active" : ""}`}
                onClick={() => setActive(t.id)}
              >
                {t.label}
                {t.badge && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.55rem",
                      color: isActive ? "var(--tech)" : "var(--dim)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {trailing && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 16px",
              borderLeft: "1px solid var(--line)",
              flexShrink: 0,
            }}
          >
            {trailing}
          </div>
        )}
      </div>
      <div
        className="tabs-body"
        role="tabpanel"
        id={`tabpanel-${current?.id}`}
        aria-labelledby={`tab-${current?.id}`}
      >
        {/* Per-tab error isolation — boundary resets when user switches tabs */}
        <PanelBoundary
          key={current?.id}
          resetKey={current?.id}
          label={current?.label}
        >
          {current?.content}
        </PanelBoundary>
      </div>
    </>
  );
}
