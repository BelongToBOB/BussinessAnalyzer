'use client';

import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ScoreRing({ score, size = 180, strokeWidth = 10, label = 'Business Score', sublabel }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r * 0.75; // 270 degrees (3/4 circle)
  const offset = circumference * (1 - animatedScore / 100);

  // Gradient colors based on score
  const getColor = (s: number) => {
    if (s >= 70) return { start: '#22C55E', end: '#16A34A', text: 'var(--status-good)' };
    if (s >= 40) return { start: '#F59E0B', end: '#D97706', text: 'var(--status-warn)' };
    if (s > 0) return { start: '#EF4444', end: '#DC2626', text: 'var(--status-bad)' };
    return { start: '#94A3B8', end: '#64748B', text: 'var(--text-tertiary)' };
  };
  const colors = getColor(score);

  const getMessage = (s: number) => {
    if (s >= 70) return 'พร้อมเสนอธนาคาร';
    if (s >= 40) return 'กำลังปรับตัว';
    if (s > 0) return 'ต้องปรับฐาน';
    return 'เริ่มสแกนเลย';
  };

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease out quart
      setAnimatedScore(score * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  // Arc path for 270 degrees (from 135° to 405°)
  const startAngle = 135;
  const endAngle = 405;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = size / 2, cy = size / 2;
  const arcPath = (angle: number) => {
    const rad = toRad(angle);
    return `${cx + r * Math.cos(rad)} ${cy + r * Math.sin(rad)}`;
  };
  const bgPath = `M ${arcPath(startAngle)} A ${r} ${r} 0 1 1 ${arcPath(endAngle)}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Score arc */}
        <path d={bgPath} fill="none" stroke="url(#scoreGrad)" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke 0.3s' }} />
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="num" style={{ fontSize: size * 0.22, fontWeight: 700, fill: colors.text }}>
          {Math.round(animatedScore)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-tertiary)' }}>
          / 100
        </text>
      </svg>
      <div className="text-center -mt-2">
        <div className="text-xs font-semibold" style={{ color: colors.text }}>{sublabel || getMessage(score)}</div>
        <div className="text-[10px] text-text-tertiary mt-0.5">{label}</div>
      </div>
    </div>
  );
}
