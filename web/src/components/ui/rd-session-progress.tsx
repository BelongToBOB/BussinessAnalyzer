'use client';

import Link from 'next/link';

const SESSIONS = [
  { num: 1, label: 'Mindset', href: '/ib/session/1-mindset' },
  { num: 2, label: 'Financial', href: '/ib/session/2-financial' },
  { num: 3, label: 'Cashflow', href: '/ib/session/3-cashflow' },
  { num: 4, label: 'Loan', href: '/ib/session/4-loan' },
  { num: 5, label: 'Plan', href: '/ib/session/5-plan' },
  { num: 6, label: 'Deal', href: '/ib/session/6-deal' },
  { num: 8, label: 'Cash Cycle', href: '/ib/session/8-cashcycle' },
  { num: 9, label: 'Bank Offers', href: '/ib/session/9-bankoffers' },
  { num: 10, label: 'Approved', href: '/ib/session/10-approved' },
];

interface Props {
  current: number;
  completedFlags: Record<string, boolean>;
}

export function RdSessionProgress({ current, completedFlags }: Props) {
  return (
    <div className="flex gap-1 mb-6 overflow-x-auto">
      {SESSIONS.map((s) => {
        const isDone = completedFlags[`s${s.num}`] === true;
        const isCurrent = s.num === current;
        const isBonus = s.num >= 8;
        return (
          <Link key={s.num} href={s.href} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 no-underline cursor-pointer group">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all group-hover:scale-110 ${
                isDone
                  ? 'bg-status-good text-white'
                  : isCurrent
                    ? 'border-2 text-text-primary'
                    : isBonus
                      ? 'border border-dashed border-border text-text-tertiary group-hover:border-accent'
                      : 'border border-border text-text-tertiary group-hover:border-accent'
              }`}
              style={isCurrent && !isDone ? { borderColor: 'var(--accent)' } : {}}
            >
              {isDone ? (
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 7l3 3 5-6" />
                </svg>
              ) : (
                s.num
              )}
            </div>
            <div
              className="h-1 w-full rounded-full transition-all duration-500"
              style={{
                background: isDone
                  ? 'var(--status-good)'
                  : isCurrent
                    ? 'var(--accent)'
                    : 'var(--border)',
              }}
            />
            <span className={`text-[8px] hidden sm:block transition-colors truncate ${isCurrent ? 'text-accent font-semibold' : 'text-text-tertiary group-hover:text-text-secondary'}`}>{s.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
