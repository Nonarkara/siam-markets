"use client";

import { useEffect } from "react";
import { APP_VERSION } from "@/lib/version";

interface Props {
  open: boolean;
  onClose: () => void;
}

const REPO_URL     = "https://github.com/Nonarkara/siam-markets";
const EMAIL        = "nonsmartcity@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/drnon";
const GITHUB_URL   = "https://github.com/Nonarkara";

export function StoryModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DayTraders story"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          border: "1px solid var(--line)",
          maxWidth: 680,
          width: "100%",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          padding: "24px 28px",
          fontFamily: "var(--font-body)",
          color: "var(--ink)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: "1px solid var(--line)",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.0625rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}>
              DAYTRADERS
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              color: "var(--dim)",
              letterSpacing: "0.08em",
            }}>
              v{APP_VERSION}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "1px solid var(--line)",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              padding: "3px 10px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              minHeight: 28,
            }}
          >
            CLOSE  ✕
          </button>
        </div>

        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          color: "var(--caution)",
          letterSpacing: "0.1em",
          marginBottom: 22,
        }}>
          A WINDOW ON THE MARKETS · FOR THAI INVESTORS
        </div>

        <Section eyebrow="THE STORY">
          <p>
            This started as a private dashboard. A friend wanted to understand
            his Thai mutual funds — RMF, ThaiESG, SSF — the basic mechanics:
            tax deductions, what the SET is doing, whether his picks are
            reasonable. The retail brokerage apps assume you already know. The
            financial news sites bury the actual data under headlines designed
            to make you anxious. Nothing showed both the trees and the forest.
          </p>
          <p>So I built one for us.</p>
        </Section>

        <Section eyebrow="WHAT I WAS LOOKING AT">
          <p>
            Dieter Rams and Braun — the GMT Weltzeit clock on the desk is a
            direct homage to the 1965 travel piece. Bloomberg's terminal
            aesthetic — dense, monospace, geometry over decoration. Vignelli's
            NYC subway map, which abstracts a city to what's load-bearing and
            removes everything else. None of these decorate. Each tells you
            exactly one thing, with no theatre.
          </p>
          <p>The two worlds the dashboard tries to bridge:</p>
          <ul style={{ paddingLeft: 18, margin: "0 0 12px" }}>
            <li>
              <strong style={{ color: "var(--ink)" }}>Value investing</strong>{" "}
              (Graham · Buffett · Munger) — answers <em>what</em> to own.
            </li>
            <li>
              <strong style={{ color: "var(--ink)" }}>Technical analysis</strong>{" "}
              — answers <em>when</em> to act.
            </li>
          </ul>
          <p>
            Most platforms pick a side. Day traders dismiss value. Long-term
            holders dismiss timing. The honest answer is that the two
            complement each other. Quality at a technical entry beats quality
            at a random entry. A precise entry into a junk company is still a
            junk company.
          </p>
        </Section>

        <Section eyebrow="WHAT WE'RE TRYING TO ACHIEVE">
          <p>
            A dashboard a non-professional Thai investor can open in the
            morning and walk away with three things:
          </p>
          <ol style={{ paddingLeft: 18, margin: "0 0 12px" }}>
            <li>What the world did overnight, without panic.</li>
            <li>What the SET looks like today, without hype.</li>
            <li>What is — or isn't — worth doing before the next opening bell.</li>
          </ol>
          <p>
            All free APIs. No paywalled data. Mobile-first because everyone in
            Thailand checks the market on a phone, not at a desk.
          </p>
        </Section>

        <Section eyebrow="COLLABORATE">
          <p>
            If something here is useful to you — or if you're working on
            adjacent problems — I would like to hear from you. The code is
            open. Use it, fork it, send patches, or tell me what's broken.
          </p>
          <ContactRow label="EMAIL"    value={EMAIL}        href={`mailto:${EMAIL}`} />
          <ContactRow label="LINKEDIN" value="/in/drnon"    href={LINKEDIN_URL} />
          <ContactRow label="GITHUB"   value="@Nonarkara"   href={GITHUB_URL} />
          <ContactRow label="REPO"     value="siam-markets" href={REPO_URL} />
        </Section>

        <div style={{
          marginTop: 22,
          paddingTop: 14,
          borderTop: "1px solid var(--line)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          color: "var(--dim)",
          letterSpacing: "0.08em",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <span>BUILT WITH NEXT.JS · TYPESCRIPT · YFINANCE · FRED · GDELT · TIMESFM</span>
          <span>BANGKOK · 2026</span>
        </div>
      </div>
    </div>
  );
}

function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.55rem",
        color: "var(--tech)",
        letterSpacing: "0.1em",
        fontWeight: 700,
        marginBottom: 8,
        paddingBottom: 6,
        borderBottom: "1px solid var(--line)",
      }}>
        {eyebrow}
      </div>
      <div style={{
        fontSize: "0.875rem",
        lineHeight: 1.7,
        color: "var(--muted)",
      }}>
        {children}
      </div>
    </section>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      style={{
        display: "grid",
        gridTemplateColumns: "84px 1fr",
        gap: 12,
        padding: "8px 10px",
        margin: "4px 0",
        border: "1px solid var(--line)",
        textDecoration: "none",
        color: "var(--ink)",
        background: "var(--bg-raised)",
        alignItems: "center",
      }}
    >
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.55rem",
        color: "var(--dim)",
        letterSpacing: "0.08em",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.8125rem",
        color: "var(--ink)",
      }}>
        {value}
      </span>
    </a>
  );
}
