"use client";

import { useEffect, useRef } from "react";

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let particles: Array<{
      x: number; y: number; vx: number; vy: number; size: number; alpha: number;
    }> = [];
    let animId = 0;

    const c = canvas;
    const g = ctx;

    function resize() {
      const parent = c.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      c.width = w * window.devicePixelRatio;
      c.height = h * window.devicePixelRatio;
      g.scale(window.devicePixelRatio, window.devicePixelRatio);

      particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      }));
    }

    function draw() {
      g.clearRect(0, 0, w, h);

      // Draw subtle grid
      g.strokeStyle = "rgba(0, 240, 255, 0.03)";
      g.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
      }

      // Draw particles and connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        g.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
        g.beginPath();
        g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        g.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            g.strokeStyle = `rgba(0, 240, 255, ${0.08 * (1 - dist / 120)})`;
            g.lineWidth = 0.5;
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.lineTo(q.x, q.y);
            g.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
