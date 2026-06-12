'use client';

import { IbSidebar } from '@/components/ui/ib-sidebar';
import { AiChat } from '@/components/ui/ai-chat';

export default function IbLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme-ib="">
      <IbSidebar>
        {children}
      </IbSidebar>
      <AiChat />
    </div>
  );
}
