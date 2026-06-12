'use client';

import { AiChat } from '@/components/ui/ai-chat';

export default function IbLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme-ib="">
      {children}
      <AiChat />
    </div>
  );
}
