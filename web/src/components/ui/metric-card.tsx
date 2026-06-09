'use client';

type Status = 'good' | 'warn' | 'bad' | 'empty' | 'neutral';

function CardIcon({ num, color }: { num: number; color: string }) {
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '1.8', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (num) {
    case 1: return <svg {...p}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; // ยอดขาย
    case 2: return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>; // สัดส่วน
    case 3: return <svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; // GM
    case 4: return <svg {...p}><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>; // NP
    case 5: return <svg {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>; // ค่าใช้จ่าย
    case 6: return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/></svg>; // จุดรั่ว
    case 7: return <svg {...p}><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4h-4z"/></svg>; // Cash In
    case 8: return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; // ลูกหนี้
    case 9: return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>; // เจ้าหนี้
    case 10: return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; // Runway
    default: return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

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
      className={`${wash} rounded-2xl p-3.5 pb-4 min-h-[130px] flex flex-col justify-between overflow-hidden anim-fade-up ${onTap ? 'cursor-pointer card-hover' : ''}`}
      style={{ animationDelay: `${cardNum * 0.04}s` }}
    >
      {/* Header: circled number + dot */}
      <div className="flex items-center justify-between">
        <CardIcon num={cardNum} color="var(--text-tertiary)" />
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
