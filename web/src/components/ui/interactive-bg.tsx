'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  type: 'dot' | 'chart' | 'dollar' | 'ring';
  angle: number;
  speed: number;
}

const COLORS = ['#34C759', '#007AFF', '#FF9500', '#8B5CF6', '#EC4899', '#06B6D4'];

export function InteractiveBG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;

    function resize() {
      w = canvas!.width = canvas!.offsetWidth * window.devicePixelRatio;
      h = canvas!.height = canvas!.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initParticles() {
      const count = Math.min(Math.floor((w * h) / 25000), 60);
      const cw = canvas!.offsetWidth;
      const ch = canvas!.offsetHeight;
      particlesRef.current = Array.from({ length: count }, () => {
        const types: Particle['type'][] = ['dot', 'dot', 'dot', 'chart', 'dollar', 'ring'];
        return {
          x: Math.random() * cw,
          y: Math.random() * ch,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 3 + 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          type: types[Math.floor(Math.random() * types.length)],
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.005 + 0.002,
        };
      });
    }

    function drawIcon(ctx: CanvasRenderingContext2D, p: Particle, size: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.lineWidth = 1.2;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      const s = size;

      switch (p.type) {
        case 'chart':
          // Mini bar chart
          ctx.fillRect(-s * 0.6, 0, s * 0.3, -s * 0.5);
          ctx.fillRect(-s * 0.15, 0, s * 0.3, -s * 0.8);
          ctx.fillRect(s * 0.3, 0, s * 0.3, -s * 0.35);
          break;
        case 'dollar':
          // $ sign
          ctx.font = `${s * 1.4}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          break;
        case 'ring':
          // Circle ring
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.5, 0, Math.PI * 1.5);
          ctx.stroke();
          break;
        default:
          // Dot
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
      }
      ctx.restore();
    }

    function animate() {
      const cw = canvas!.offsetWidth;
      const ch = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, cw, ch);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const particles = particlesRef.current;

      // Update + draw particles
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150 * 0.8;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Friction
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Base drift
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.speed;

        // Bounds wrap
        if (p.x < -20) p.x = cw + 20;
        if (p.x > cw + 20) p.x = -20;
        if (p.y < -20) p.y = ch + 20;
        if (p.y > ch + 20) p.y = -20;

        const size = p.r * 3;
        const alpha = p.type === 'dot' ? 0.25 : 0.18;
        drawIcon(ctx!, p, size, alpha);
      }

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `rgba(150, 150, 160, ${(1 - dist / 120) * 0.08})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Mouse glow
      if (mx > 0 && my > 0) {
        const grad = ctx!.createRadialGradient(mx, my, 0, mx, my, 120);
        grad.addColorStop(0, 'rgba(0, 122, 255, 0.06)');
        grad.addColorStop(1, 'rgba(0, 122, 255, 0)');
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(mx, my, 120, 0, Math.PI * 2);
        ctx!.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    animate();

    const handleResize = () => { resize(); initParticles(); };
    window.addEventListener('resize', handleResize);

    const handleMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };

    canvas!.addEventListener('mousemove', handleMove);
    canvas!.addEventListener('mouseleave', handleLeave);

    // Touch support
    const handleTouch = (e: TouchEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const t = e.touches[0];
      if (t) mouseRef.current = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };
    canvas!.addEventListener('touchmove', handleTouch, { passive: true });
    canvas!.addEventListener('touchend', handleLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      canvas!.removeEventListener('mousemove', handleMove);
      canvas!.removeEventListener('mouseleave', handleLeave);
      canvas!.removeEventListener('touchmove', handleTouch);
      canvas!.removeEventListener('touchend', handleLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0"
      style={{ pointerEvents: 'auto' }}
    />
  );
}
