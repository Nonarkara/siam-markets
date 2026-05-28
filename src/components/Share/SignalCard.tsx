"use client";

import { useRef } from "react";

interface SignalCardProps {
  title: string;
  value: string;
  subtext: string;
  implication: string;
  color: string;
  metric?: string;
  source?: string;
}

export function SignalCard({
  title, value, subtext, implication, color, metric, source
}: SignalCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function generateCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 1080, H = 540;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, y, W, 2);
    }

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // Top accent bar
    ctx.fillStyle = color;
    ctx.fillRect(4, 4, W - 8, 4);

    // DAYTRADERS wordmark
    ctx.font = "bold 18px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(0,255,65,0.5)";
    ctx.textAlign = "left";
    ctx.fillText("DAYTRADERS · SIGNAL INTELLIGENCE", 40, 50);

    // Date
    ctx.font = "14px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(0,255,65,0.3)";
    ctx.textAlign = "right";
    ctx.fillText(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(), W - 40, 50);

    // Divider
    ctx.strokeStyle = "rgba(0,255,65,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 68);
    ctx.lineTo(W - 40, 68);
    ctx.stroke();

    // Main value — hero number
    ctx.font = "bold 96px 'IBM Plex Mono', monospace";
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(value, 40, 200);

    // Title
    ctx.font = "bold 28px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(0,255,65,0.9)";
    ctx.textAlign = "left";
    ctx.fillText(title.toUpperCase(), 40, 250);

    // Subtext
    ctx.font = "20px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(0,255,65,0.5)";
    ctx.fillText(subtext.toUpperCase(), 40, 286);

    // Divider
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, 310);
    ctx.lineTo(W - 40, 310);
    ctx.stroke();
    ctx.setLineDash([]);

    // → DO label
    ctx.font = "bold 14px 'IBM Plex Mono', monospace";
    ctx.fillStyle = color;
    ctx.fillText("→ WHAT IT MEANS", 40, 344);

    // Implication — word-wrap
    ctx.font = "18px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(232,232,232,0.9)";
    const words = implication.split(" ");
    let line = "";
    let y = 374;
    const maxW = W - 80;
    for (const word of words) {
      const test = line + (line ? " " : "") + word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, 40, y);
        line = word;
        y += 28;
        if (y > 460) break;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 40, y);

    // Footer
    ctx.font = "13px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(0,255,65,0.25)";
    ctx.textAlign = "left";
    ctx.fillText(`SRC: ${(source ?? "DAYTRADERS").toUpperCase()} · money.nonarkara.org · BUILT IN THAILAND`, 40, H - 30);

    // Metric tag (top right)
    if (metric) {
      ctx.font = "bold 13px 'IBM Plex Mono', monospace";
      ctx.fillStyle = color;
      ctx.textAlign = "right";
      ctx.fillText(metric.toUpperCase(), W - 40, 95);
    }
  }

  function downloadCard() {
    generateCard();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `siam-signal-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function shareCard() {
    generateCard();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "siam-signal.png", { type: "image/png" });
      if (navigator.share) {
        try {
          await navigator.share({ files: [file], title: `DAYTRADERS · ${title}` });
        } catch {
          downloadCard();
        }
      } else {
        downloadCard();
      }
    }, "image/png");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={shareCard}
          style={{
            flex: 1, padding: "8px 12px", minHeight: 44,
            background: "transparent",
            border: `1px solid ${color}`,
            color,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro)",
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>↑</span>
          <span>SHARE SIGNAL</span>
        </button>
      </div>
    </div>
  );
}
