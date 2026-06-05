'use client';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'หน้าหลัก', href: '/dashboard', match: '/dashboard' },
  { label: 'ย้อนหลัง', href: '/history', match: '/history' },
  { label: 'บัญชี', href: '/settings', match: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,12px)] pt-2 px-2 grid grid-cols-3 xl:hidden z-20">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.match);
        return (
          <a key={tab.label} href={tab.href}
            className={`flex flex-col items-center gap-0.5 py-1.5 no-underline text-[10px] font-medium ${active ? 'text-accent' : 'text-text-tertiary'}`}>
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
