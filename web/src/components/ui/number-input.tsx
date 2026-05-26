'use client';

import { maskCurrency } from '@/lib/format';

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  readOnly?: boolean;
  error?: string | null;
}

export function NumberInput({
  value, onChange, suffix = 'บาท',
  placeholder = '0', readOnly = false, error,
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
            w-full h-[52px] rounded-xl px-4 pr-16 num text-xl font-medium tracking-tight outline-none transition-colors
            ${readOnly ? 'bg-bg-secondary text-text-secondary' : 'bg-bg-card text-text-primary'}
            ${error ? 'border-status-bad' : 'border-border focus:border-accent'}
            border
          `}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-medium">
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
