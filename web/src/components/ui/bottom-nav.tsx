'use client';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: '\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01', href: '/dashboard', match: '/dashboard' },
  { label: '\u0E01\u0E23\u0E2D\u0E01\u0E43\u0E2B\u0E21\u0E48', href: '/entry/', match: '/entry' },
  { label: '\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07', href: '/history', match: '/history' },
  { label: '\u0E1A\u0E31\u0E0D\u0E0A\u0E35', href: '/settings', match: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,12px)] pt-2 px-2 grid grid-cols-4 xl:hidden z-20">
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
