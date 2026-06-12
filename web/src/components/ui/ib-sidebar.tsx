'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, FileText, MessageSquare, BarChart3,
  GitCompare, Star, Settings, PanelLeft, ChevronLeft,
  Brain, Heart, Waves, Building2, ClipboardList, Handshake,
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/ib' },
  { icon: TrendingUp, label: 'ประเมินใหม่', path: '/ib/session/1-mindset' },
  { icon: MessageSquare, label: 'Bank Simulation', path: '/ib/bank-sim' },
  { icon: Star, label: 'สรุปความพร้อม', path: '/ib/summary' },
  { icon: FileText, label: 'FRS Report', path: '/ib/report' },
  { icon: BarChart3, label: 'Business Plan', path: '/ib/business-plan' },
  { icon: GitCompare, label: 'Deal Comparison', path: '/ib/deal-comparison' },
];

const SESSION_ITEMS = [
  { icon: Brain, label: 'S01 Mindset', path: '/ib/session/1-mindset' },
  { icon: Heart, label: 'S02 Financial', path: '/ib/session/2-financial' },
  { icon: Waves, label: 'S03 Cashflow', path: '/ib/session/3-cashflow' },
  { icon: Building2, label: 'S04 Loan', path: '/ib/session/4-loan' },
  { icon: ClipboardList, label: 'S05 Plan', path: '/ib/session/5-plan' },
  { icon: Handshake, label: 'S06 Deal', path: '/ib/session/6-deal' },
];

export function IbSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const NavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => (
    <Link href={path} onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm no-underline transition-colors ${
        isActive(path)
          ? 'bg-accent/10 text-accent font-semibold'
          : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
      }`}>
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-bg-primary shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Header */}
        <div className="h-14 flex items-center gap-3 px-3 border-b border-border shrink-0">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-secondary cursor-pointer bg-transparent border-none text-text-tertiary">
            <PanelLeft size={16} />
          </button>
          {!collapsed && <span className="font-semibold text-sm tracking-tight">Business MRI</span>}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {MENU_ITEMS.map((item) => <NavItem key={item.path} {...item} />)}

          {!collapsed && <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide px-3 pt-4 pb-1">Sessions</div>}
          {collapsed && <div className="border-t border-border my-2" />}

          {SESSION_ITEMS.map((item) => <NavItem key={item.path} {...item} />)}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border shrink-0">
          {!collapsed && (
            <div className="text-[10px] text-text-tertiary">WinWin Analyzer</div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-bg-primary/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-text-primary">
          <PanelLeft size={20} />
        </button>
        <span className="text-sm font-semibold">Business MRI</span>
        <div className="w-9" />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-bg-primary border-r border-border flex flex-col animate-in slide-in-from-left">
            <div className="h-14 flex items-center gap-3 px-3 border-b border-border shrink-0">
              <button onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-secondary cursor-pointer bg-transparent border-none text-text-tertiary">
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-sm">Business MRI</span>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {MENU_ITEMS.map((item) => <NavItem key={item.path} {...item} />)}
              <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide px-3 pt-4 pb-1">Sessions</div>
              {SESSION_ITEMS.map((item) => <NavItem key={item.path} {...item} />)}
            </nav>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 md:overflow-y-auto">
        <div className="md:hidden h-14" /> {/* spacer for mobile header */}
        {children}
      </div>
    </div>
  );
}
