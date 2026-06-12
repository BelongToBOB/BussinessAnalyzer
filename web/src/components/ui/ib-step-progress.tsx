'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/api';

const STEPS = [
  { num: 1, slug: 'ib-identity' },
  { num: 2, slug: 'ib-financial' },
  { num: 3, slug: 'ib-cash-dna' },
  { num: 4, slug: 'ib-bank-view' },
  { num: 5, slug: 'ib-capital' },
  { num: 6, slug: 'ib-growth' },
  { num: 7, slug: 'ib-loan-action' },
  { num: 8, slug: 'ib-bank-sim' },
];

export function IbStepProgress({ current }: { current: number }) {
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all(
      STEPS.map(async (s) => {
        try {
          const res = (await getSession(s.slug)) as any;
          return res?.data ? s.num : null;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      setDone(new Set(results.filter((n): n is number => n !== null)));
    });
  }, []);

  return (
    <div className="flex gap-1.5 mb-6">
      {STEPS.map((s) => {
        const isDone = done.has(s.num);
        const isCurrent = s.num === current;
        return (
          <div key={s.num} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                isDone
                  ? 'bg-status-good text-white'
                  : isCurrent
                    ? 'border-2 text-text-primary'
                    : 'border border-border text-text-tertiary'
              }`}
              style={isCurrent && !isDone ? { borderColor: 'var(--accent)' } : {}}
            >
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
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
          </div>
        );
      })}
    </div>
  );
}
