'use client';

import { useEffect, useRef } from 'react';

export function AuroraBG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = canvas!.offsetWidth;
      h = canvas!.offsetHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Aurora ribbons
    const ribbons = [
      { color1: [52, 199, 89],   color2: [0, 122, 255],   yBase: 0.35, amp: 0.12, freq: 0.8,  speed: 0.0004, width: 0.25, phase: 0 },
      { color1: [0, 122, 255],   color2: [139, 92, 246],  yBase: 0.45, amp: 0.15, freq: 0.6,  speed: 0.0003, width: 0.30, phase: 2 },
      { color1: [139, 92, 246],  color2: [236, 72, 153],  yBase: 0.55, amp: 0.10, freq: 1.0,  speed: 0.0005, width: 0.20, phase: 4 },
      { color1: [6, 182, 212],   color2: [52, 199, 89],   yBase: 0.40, amp: 0.18, freq: 0.5,  speed: 0.00035, width: 0.28, phase: 1 },
      { color1: [255, 149, 0],   color2: [255, 59, 48],   yBase: 0.60, amp: 0.08, freq: 1.2,  speed: 0.00045, width: 0.15, phase: 3 },
    ];

    function drawRibbon(
      t: number,
      mx: number, my: number,
      r: typeof ribbons[0],
    ) {
      const steps = 120;
      const segW = w / steps;

      for (let i = 0; i <= steps; i++) {
        const x = i * segW;
        const nx = i / steps; // 0..1

        // Mouse influence
        const mdx = nx - mx;
        const mdy = r.yBase - my;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        const mInfluence = Math.max(0, 1 - mDist / 0.4) * 0.06;
        const mPush = mInfluence * Math.sin(t * 0.002 + nx * 3);

        // Wave
        const wave1 = Math.sin(nx * Math.PI * 2 * r.freq + t * r.speed + r.phase) * r.amp;
        const wave2 = Math.sin(nx * Math.PI * 3 * r.freq + t * r.speed * 1.3 + r.phase + 1) * r.amp * 0.4;
        const wave3 = Math.sin(nx * Math.PI * 5 * r.freq + t * r.speed * 0.7 + r.phase + 2) * r.amp * 0.2;

        const yCenter = (r.yBase + wave1 + wave2 + wave3 + mPush) * h;
        const ribbonH = r.width * h * (0.6 + 0.4 * Math.sin(nx * Math.PI));

        // Color interpolation
        const blend = (Math.sin(nx * Math.PI * 2 + t * 0.0003) + 1) / 2;
        const cr = r.color1[0] + (r.color2[0] - r.color1[0]) * blend;
        const cg = r.color1[1] + (r.color2[1] - r.color1[1]) * blend;
        const cb = r.color1[2] + (r.color2[2] - r.color1[2]) * blend;

        // Fade at edges
        const edgeFade = Math.sin(nx * Math.PI);
        const alpha = 0.035 * edgeFade;

        // Draw vertical gradient slice
        const grad = ctx!.createLinearGradient(x, yCenter - ribbonH, x, yCenter + ribbonH);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb}, 0)`);
        grad.addColorStop(0.3, `rgba(${cr},${cg},${cb}, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${cr},${cg},${cb}, ${alpha * 1.5})`);
        grad.addColorStop(0.7, `rgba(${cr},${cg},${cb}, ${alpha})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb}, 0)`);

        ctx!.fillStyle = grad;
        ctx!.fillRect(x, yCenter - ribbonH, segW + 1, ribbonH * 2);
      }
    }

    function animate(now: number) {
      timeRef.current = now;
      ctx!.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw each ribbon
      for (const r of ribbons) {
        drawRibbon(now, mx, my, r);
      }

      // Soft vignette
      const vig = ctx!.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.03)');
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(animate);
    }

    resize();
    rafRef.current = requestAnimationFrame(animate);

    window.addEventListener('resize', resize);

    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / w, y: e.clientY / h };
    };
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) mouseRef.current = { x: t.clientX / w, y: t.clientY / h };
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleTouch, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}
