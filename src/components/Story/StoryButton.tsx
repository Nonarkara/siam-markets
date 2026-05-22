"use client";

import { useState } from "react";
import { StoryModal } from "./StoryModal";

interface Props {
  variant?: "inline" | "chip";
}

export function StoryButton({ variant = "inline" }: Props) {
  const [open, setOpen] = useState(false);

  const baseStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--line)",
    color: "var(--muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.55rem",
    letterSpacing: "0.1em",
    padding: variant === "chip" ? "2px 6px" : "3px 8px",
    cursor: "pointer",
    minHeight: variant === "chip" ? 20 : 24,
    pointerEvents: "auto",
  };

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        aria-label="About DayTraders"
        style={baseStyle}
      >
        STORY
      </button>
      <StoryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
