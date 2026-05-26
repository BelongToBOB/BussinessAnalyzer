'use client';

type VerdictLevel = 'good' | 'warn' | 'bad' | 'empty';

interface VerdictRibbonProps {
  level: VerdictLevel;
  title: string;
  body?: string;
  ctaLabel?: string | null;
  onTap?: () => void;
}

const CONFIG = {
  good:  { wash: 'bg-wash-good',  icon: '✓', badge: 'สุขภาพดี', dot: 'bg-status-good' },
  warn:  { wash: 'bg-wash-warn',  icon: '!', badge: 'ระวัง',    dot: 'bg-status-warn' },
  bad:   { wash: 'bg-wash-bad',   icon: '!', badge: 'วิกฤต',    dot: 'bg-status-bad'  },
  empty: { wash: 'bg-wash-empty', icon: '·', badge: 'ยังไม่กรอก', dot: 'bg-status-empty' },
};

export function VerdictRibbon({ level, title, body, ctaLabel, onTap }: VerdictRibbonProps) {
  const c = CONFIG[level];

  return (
    <div className={`${c.wash} rounded-[18px] p-4 md:p-5 flex items-center gap-3.5`}>
      <div className={`w-10 h-10 rounded-full bg-white/55 flex items-center justify-center shrink-0`}>
        <span className={`text-xl font-bold ${level === 'good' ? 'text-status-good' : level === 'warn' ? 'text-status-warn' : level === 'bad' ? 'text-status-bad' : 'text-status-empty'}`}>
          {c.icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold tracking-wide uppercase text-text-secondary mb-0.5">
          {c.badge}
        </div>
        <div className="text-[15px] md:text-[18px] font-semibold text-text-primary leading-tight">
          {title}
        </div>
        {body && (
          <div className="text-[13px] md:text-sm text-text-secondary leading-snug mt-1">
            {body}
          </div>
        )}
      </div>

      {ctaLabel && (
        <button
          onClick={onTap}
          className="shrink-0 bg-text-primary text-bg-primary border-none rounded-[10px] px-3.5 py-2.5 text-[13px] font-semibold cursor-pointer font-thai whitespace-nowrap"
        >
          {ctaLabel} →
        </button>
      )}
    </div>
  );
}
