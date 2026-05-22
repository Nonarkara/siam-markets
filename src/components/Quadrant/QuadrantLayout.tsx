"use client";

import { ReactNode } from "react";

export function QuadrantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="quadrant-grid">
      {children}
    </div>
  );
}
