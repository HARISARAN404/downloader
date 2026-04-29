"use client";

import { useEffect, useRef, useCallback } from "react";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  targetOpacity: number;
  fadeSpeed: number;
}

export default function FloatingDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const animRef = useRef<number>(0);
  const themeRef = useRef<"dark" | "light">("dark");

  const initDots = useCallback((width: number, height: number) => {
    // ~1 dot per 18000px² — gentle density
    const count = Math.max(20, Math.floor((width * height) / 18000));
    const dots: Dot[] = [];
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3,
        targetOpacity: Math.random() * 0.35 + 0.05,
        fadeSpeed: Math.random() * 0.007 + 0.003,
      });
    }
    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Detect theme
    const detectTheme = () => {
      themeRef.current = document.documentElement.classList.contains("light")
        ? "light"
        : "dark";
    };
    detectTheme();

    // Observe theme class changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initDots(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const isDark = themeRef.current === "dark";
      const dotColor = isDark ? "255,255,255" : "0,0,0";

      for (const dot of dotsRef.current) {
        // Drift
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Wrap around edges (with padding so dots don't pop in/out)
        if (dot.x < -10) dot.x = w + 10;
        if (dot.x > w + 10) dot.x = -10;
        if (dot.y < -10) dot.y = h + 10;
        if (dot.y > h + 10) dot.y = -10;

        // Gentle twinkling: ease toward targetOpacity, then pick a new one
        if (Math.abs(dot.opacity - dot.targetOpacity) < 0.01) {
          dot.targetOpacity = Math.random() * 0.35 + 0.05;
        }
        dot.opacity += (dot.targetOpacity - dot.opacity) * dot.fadeSpeed;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor}, ${dot.opacity})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [initDots]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
