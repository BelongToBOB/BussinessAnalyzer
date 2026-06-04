'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'ภาพรวม' },
  { href: '/admin/users', label: 'ผู้ใช้ทั้งหมด' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Top nav */}
      <header className="sticky top-0 z-20 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-accent no-underline font-medium shrink-0">
            &larr; กลับ Dashboard
          </Link>
          <div className="h-5 w-px bg-border" />
          <span className="text-[15px] font-semibold tracking-tight shrink-0">Admin Backoffice</span>
          <nav className="flex items-center gap-1 ml-4">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                    isActive
                      ? 'bg-text-primary text-bg-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-wash-empty'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
