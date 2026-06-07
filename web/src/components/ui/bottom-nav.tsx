'use client';
import { usePathname } from 'next/navigation';

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z" />
    </svg>
  );
}

function IconHistory({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 2v4" /><path d="M16 2v4" /><path d="M3 10h18" />
    </svg>
  );
}

function IconAccount({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 00-16 0" />
    </svg>
  );
}

const TABS = [
  { label: 'หน้าหลัก', href: '/dashboard', match: '/dashboard', Icon: IconHome },
  { label: 'ย้อนหลัง', href: '/history', match: '/history', Icon: IconHistory },
  { label: 'บัญชี', href: '/settings', match: '/settings', Icon: IconAccount },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,8px)] pt-1.5 z-20">
      <div className="max-w-md mx-auto grid grid-cols-3 px-2">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.match);
        return (
          <a key={tab.label} href={tab.href}
            className={`flex flex-col items-center gap-1 py-2 no-underline text-xs font-semibold transition-colors ${active ? 'text-accent' : 'text-text-tertiary'}`}>
            <tab.Icon active={active} />
            {tab.label}
          </a>
        );
      })}
      </div>
    </nav>
  );
}
