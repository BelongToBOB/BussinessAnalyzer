'use client';

type Status = 'good' | 'warn' | 'bad' | 'empty' | 'neutral';

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

const WASH_MAP: Record<Status, string> = {
  good: 'bg-wash-good',
  warn: 'bg-wash-warn',
  bad: 'bg-wash-bad',
  empty: 'bg-wash-empty',
  neutral: 'bg-bg-card border border-border',
};

const DOT_MAP: Record<string, string> = {
  good: 'bg-status-good',
  warn: 'bg-status-warn',
  bad: 'bg-status-bad',
};

interface MetricCardProps {
  num: number;
  label: string;
  big?: string;
  unit?: string;
  status?: Status;
  delta?: number | null;
  goodIsUp?: boolean;
  note?: string | null;
  variant?: 'number' | 'text' | 'split';
  children?: React.ReactNode;
  onTap?: () => void;
}

function Delta({ value, goodIsUp = true }: { value: number; goodIsUp?: boolean }) {
  const up = value > 0;
  const neutral = value === 0;
  const isGood = neutral ? false : up === goodIsUp;
  const color = neutral ? 'text-text-tertiary' : isGood ? 'text-status-good' : 'text-status-bad';
  const arrow = neutral ? '·' : up ? '↑' : '↓';

  return (
    <span className={`num inline-flex items-center gap-0.5 text-[13px] font-medium ${color}`}>
      <span>{arrow}</span><span>{Math.abs(value)}%</span>
    </span>
  );
}

export function MetricCard({
  num: cardNum, label, big, unit, status = 'neutral',
  delta, goodIsUp = true, note, variant = 'number',
  children, onTap,
}: MetricCardProps) {
  const wash = WASH_MAP[status];
  const hasDot = status !== 'neutral' && status !== 'empty';

  return (
    <div
      onClick={onTap}
      className={`${wash} rounded-2xl p-3.5 pb-4 min-h-[130px] flex flex-col justify-between transition-transform overflow-hidden ${onTap ? 'cursor-pointer hover:shadow-[var(--shadow-pop)]' : ''}`}
    >
      {/* Header: circled number + dot */}
      <div className="flex items-center justify-between">
        <span className="num text-xs font-semibold text-text-tertiary">
          {CIRCLED[cardNum - 1]}
        </span>
        {hasDot && <span className={`w-[7px] h-[7px] rounded-full ${DOT_MAP[status]}`} />}
        {status === 'empty' && <span className="text-[11px] text-text-tertiary">—</span>}
      </div>

      {/* Value */}
      <div className="flex-1 flex flex-col justify-end mt-2.5">
        {variant === 'number' && (
          <div className={`num text-[18px] sm:text-[22px] md:text-[28px] font-semibold leading-none tracking-tight break-all ${status === 'empty' ? 'text-text-tertiary' : 'text-text-primary'}`}>
            {big}
            {unit && <span className="text-[11px] sm:text-[13px] font-medium text-text-secondary ml-1">{unit}</span>}
          </div>
        )}
        {variant === 'text' && (
          <div className="text-sm font-medium text-text-primary leading-snug">{big}</div>
        )}
        {variant === 'split' && children}
      </div>

      {/* Footer: label + delta */}
      <div className="mt-2.5 flex items-end justify-between gap-1.5">
        <div className="text-xs text-text-secondary leading-tight flex-1 min-w-0">{label}</div>
        {delta != null && <Delta value={delta} goodIsUp={goodIsUp} />}
        {note && (
          <div className="text-[11px] text-text-secondary text-right max-w-[60%] leading-tight">{note}</div>
        )}
      </div>
    </div>
  );
}

export function SplitBar({ cashPct = 70, creditPct = 30 }: { cashPct: number; creditPct: number }) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="num text-[22px] font-semibold text-status-good tracking-tight">{cashPct}%</span>
        <span className="text-[11px] text-text-secondary">สด</span>
        <span className="text-[11px] text-text-tertiary mx-0.5">·</span>
        <span className="num text-sm font-medium text-text-secondary">{creditPct}%</span>
        <span className="text-[11px] text-text-tertiary">เชื่อ</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-status-empty overflow-hidden flex">
        <div style={{ width: `${cashPct}%` }} className="bg-status-good" />
      </div>
    </div>
  );
}
