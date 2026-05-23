"use client";

/**
 * PanelBoundary — React error boundary scoped to a single dashboard panel.
 *
 * Drop around any panel that fetches API data or computes from external
 * inputs. On error, the rest of the page keeps working; only this panel
 * renders a Braun-styled "Data unavailable · retry" card.
 *
 * Heritage: hairline border, zero radius, monospaced caption, single
 * vibe-bear accent. No friendly cartoon — this is a tool, not an app.
 */

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  /** Optional label shown in the fallback ("Trade Desk · SIGNAL"). */
  label?:    string;
  /** Optional explicit reset key — when this changes, the boundary resets. */
  resetKey?: string | number;
  children:  ReactNode;
}

interface State {
  hasError: boolean;
  message:  string;
}

export class PanelBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || "Unknown error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface to browser console for debugging; never crash the page.
    // eslint-disable-next-line no-console
    console.error("[PanelBoundary]", this.props.label ?? "panel", error, info.componentStack);
  }

  componentDidUpdate(prev: Props): void {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: "" });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 20,
          background: "var(--bg-surface)",
          border: "1px solid var(--bear)",
          borderLeft: "3px solid var(--bear)",
          minHeight: 120,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.5rem",
            letterSpacing: "0.22em",
            color: "var(--bear)",
            border: "1px solid var(--bear)",
            padding: "2px 8px",
          }}
        >
          DATA UNAVAILABLE
        </span>
        <span
          className="t-body"
          style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", maxWidth: 280 }}
        >
          {this.props.label ? `${this.props.label} — ` : ""}
          this panel hit an error. The rest of the page is unaffected.
        </span>
        <span
          className="t-micro"
          style={{ color: "var(--dim)", maxWidth: 280, textAlign: "center", fontSize: "0.5625rem", marginTop: 2 }}
        >
          {this.state.message.slice(0, 140)}
        </span>
        <button
          onClick={this.handleRetry}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.5625rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "var(--tech)",
            border: "1px solid var(--tech)",
            background: "transparent",
            padding: "5px 14px",
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          RETRY
        </button>
      </div>
    );
  }
}
