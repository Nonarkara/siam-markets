"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile, defaultProfile, type ProfileMode } from "@/lib/profile";

const MODE_LABELS: Record<ProfileMode, string> = {
  investor: "INVESTOR",
  value:    "VALUE",
  trader:   "TRADER",
};

const MODE_COLORS: Record<ProfileMode, string> = {
  investor: "var(--bull)",
  value:    "var(--tech)",
  trader:   "var(--caution)",
};

export function ProfileBadge() {
  const router = useRouter();
  const [mode, setMode] = useState<ProfileMode>("investor");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (p) setMode(p.mode);
  }, []);

  function switchMode(newMode: ProfileMode) {
    const current = loadProfile();
    if (!current) return;
    const updated = { ...defaultProfile(newMode), ...current, mode: newMode, kpiTargets: defaultProfile(newMode).kpiTargets };
    saveProfile(updated);
    setMode(newMode);
    setOpen(false);
    window.location.reload();
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: `1px solid ${MODE_COLORS[mode]}`,
          color: MODE_COLORS[mode],
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-micro)",
          fontWeight: 700,
          letterSpacing: "0.06em",
          padding: "4px 10px",
          cursor: "pointer",
          minHeight: 28,
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "all 180ms var(--ease)",
        }}
      >
        <span>◈</span>
        <span>{MODE_LABELS[mode]}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          right: 0,
          background: "var(--bg-raised)",
          border: "1px solid var(--line)",
          zIndex: 200,
          minWidth: 140,
        }}>
          {(["investor", "value", "trader"] as ProfileMode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 14px",
                background: m === mode ? "var(--bg-hover)" : "transparent",
                border: "none",
                borderBottom: "1px solid var(--line)",
                color: m === mode ? MODE_COLORS[m] : "var(--muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro)",
                fontWeight: m === mode ? 700 : 400,
                textAlign: "left",
                cursor: "pointer",
                minHeight: 44,
                letterSpacing: "0.06em",
              }}
            >
              {m === mode ? "◈ " : "◇ "}{MODE_LABELS[m]}
            </button>
          ))}
          <button
            onClick={() => { setOpen(false); router.push("/setup"); }}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              color: "var(--dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-micro)",
              textAlign: "left",
              cursor: "pointer",
              minHeight: 44,
              letterSpacing: "0.04em",
            }}
          >
            Edit my numbers →
          </button>
        </div>
      )}
    </div>
  );
}
