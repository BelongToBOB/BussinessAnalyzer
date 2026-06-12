'use client';

interface Pillar {
  label: string;
  score: number;
  weight: number;
}

interface Props {
  pillars: Pillar[];
}

export function PillarChart({ pillars }: Props) {
  const getColor = (s: number) =>
    s >= 75 ? 'var(--status-good)' : s >= 50 ? 'var(--status-warn)' : 'var(--status-bad)';

  return (
    <div className="space-y-3">
      {pillars.map((p) => (
        <div key={p.label}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">{p.label}</span>
            <span className="num text-xs font-bold" style={{ color: getColor(p.score) }}>
              {Math.round(p.score)}
              <span className="text-text-tertiary font-normal ml-1">({Math.round(p.weight * 100)}%)</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(p.score, 100)}%`, background: getColor(p.score) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
