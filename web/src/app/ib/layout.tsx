'use client';

import { useEffect, useState } from 'react';
import { AiChat } from '@/components/ui/ai-chat';

export default function IbLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    setTheme(stored || '');
  }, []);

  return (
    <div data-theme-ib="" data-theme={theme === 'dark' ? 'dark' : undefined}>
      {children}
      <AiChat />
    </div>
  );
}
