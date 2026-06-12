'use client';

import { maskCurrency } from '@/lib/format';

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  readOnly?: boolean;
  error?: string | null;
  compact?: boolean;
}

export function NumberInput({
  value, onChange, suffix = 'บาท',
  placeholder = '0', readOnly = false, error, compact = false,
}: NumberInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(maskCurrency(e.target.value))}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`
            w-full rounded-xl num outline-none transition-colors border
            ${compact ? 'h-[38px] px-3 pr-10 text-sm font-medium' : 'h-[52px] px-4 pr-16 text-xl font-medium tracking-tight'}
            ${readOnly ? 'bg-bg-secondary text-text-secondary' : 'bg-bg-card text-text-primary'}
            ${error ? 'border-status-bad' : 'border-border focus:border-accent'}
          `}
        />
        <span className={`absolute top-1/2 -translate-y-1/2 text-text-tertiary font-medium ${compact ? 'right-2.5 text-[11px]' : 'right-4 text-sm'}`}>
          {suffix}
        </span>
      </div>
      {error && (
        <div className="mt-2 text-xs text-status-bad flex items-center gap-1.5">
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
}
