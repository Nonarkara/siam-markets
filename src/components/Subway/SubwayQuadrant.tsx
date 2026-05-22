"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  title: string;
  lineColor: string;
  children: ReactNode;
  href?: string;
  badge?: string;
}

export function SubwayQuadrant({ title, lineColor, children, href, badge }: Props) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      background: "var(--bg-raised)",
      borderLeft: `3px solid ${lineColor}`,
    }}>
      {/* Header — subway line style: minimal, colored, one row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 10px",
        borderBottom: "1px solid var(--line-dim)",
        flexShrink: 0,
      }}>
        <span style={{
          display: "inline-block",
          width: 8, height: 8,
          background: lineColor,
        }} />
        <span className="t-micro" style={{
          color: lineColor,
          letterSpacing: "0.16em",
          fontWeight: 700,
          fontSize: "0.625rem",
        }}>
          {title}
        </span>
        {badge && (
          <span className="t-mono" style={{
            fontSize: "0.5rem",
            color: "var(--dim)",
            border: "1px solid var(--line-dim)",
            padding: "0 4px",
            marginLeft: "auto",
          }}>
            {badge}
          </span>
        )}
        {href && (
          <Link
            href={href}
            className="t-micro"
            style={{
              color: "var(--dim)",
              textDecoration: "none",
              marginLeft: badge ? 0 : "auto",
              fontSize: "0.5rem",
              letterSpacing: "0.1em",
            }}
          >
            {href === "/markets" ? "ALL MARKETS →" :
             href === "/scan" ? "ALL BUYS →" :
             href === "/events" ? "ALL ALERTS →" :
             href === "/money" ? "PORTFOLIO →" : "FULL →"}
          </Link>
        )}
      </div>

      {/* Content — slight padding so text doesn't touch border */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "4px 6px",
      }}>
        {children}
      </div>
    </div>
  );
}
