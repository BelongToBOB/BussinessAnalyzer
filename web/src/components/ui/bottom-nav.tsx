'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBusiness } from '@/lib/api';

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z" />
    </svg>
  );
}

function IconSelect({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text-tertiary)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
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

function getInitialHome(): string {
  try {
    return localStorage.getItem('_template') === 'ib' ? '/ib' : '/dashboard';
  } catch { return '/dashboard'; }
}

export function BottomNav() {
  const pathname = usePathname();
  const [homeHref, setHomeHref] = useState(getInitialHome);

  useEffect(() => {
    // URL-based: immediate feedback
    if (pathname.startsWith('/ib')) {
      setHomeHref('/ib');
      try { localStorage.setItem('_template', 'ib'); } catch {}
    } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/entry') || pathname.startsWith('/s')) {
      setHomeHref('/dashboard');
      try { localStorage.setItem('_template', 'ibf'); } catch {}
    } else {
      // Neutral pages (settings, select) — read localStorage first, then verify from API
      try {
        const t = localStorage.getItem('_template');
        setHomeHref(t === 'ib' ? '/ib' : '/dashboard');
      } catch {}

      getBusiness()
        .then((biz: any) => {
          const t = biz.template || 'ibf';
          setHomeHref(t === 'ib' ? '/ib' : '/dashboard');
          try { localStorage.setItem('_template', t); } catch {}
        })
        .catch(() => {});
    }
  }, [pathname]);

  const tabs = [
    { label: 'หน้าหลัก', href: homeHref, Icon: IconHome },
    { label: 'เลือกเครื่องมือ', href: '/select', Icon: IconSelect },
    { label: 'บัญชี', href: '/settings', Icon: IconAccount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,8px)] pt-1.5 z-20">
      <div className="max-w-md mx-auto grid grid-cols-3 px-2">
      {tabs.map((tab) => {
        const active = tab.href === homeHref
          ? pathname === homeHref || pathname.startsWith(homeHref + '/')
          : pathname.startsWith(tab.href);
        return (
          <Link key={tab.label} href={tab.href}
            className={`flex flex-col items-center gap-1 py-2 no-underline text-xs font-semibold transition-all duration-200 ${active ? 'text-accent scale-105' : 'text-text-tertiary'}`}>
            <tab.Icon active={active} />
            {tab.label}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
