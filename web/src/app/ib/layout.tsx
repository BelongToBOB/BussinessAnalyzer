'use client';

import { IbSidebar } from '@/components/ui/ib-sidebar';

export default function IbLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme-ib="">
      <IbSidebar>
        {children}
      </IbSidebar>
    </div>
  );
}
