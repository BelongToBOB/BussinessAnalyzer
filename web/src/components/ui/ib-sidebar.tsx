'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, FileText, Bot, BarChart3,
  GitCompare, Star, PanelLeft, ChevronLeft, ChevronsLeft, ChevronsRight,
  Brain, Heart, Waves, Building2, ClipboardList, Handshake, LogOut, Home, Repeat2, CheckSquare,
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/ib' },
  { icon: TrendingUp, label: 'ประเมินใหม่', path: '/ib/session/1-mindset' },
  { icon: Bot, label: 'RM WinBank', path: '/ib/winbank' },
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
  { icon: Repeat2, label: 'S08 Cash Cycle', path: '/ib/session/8-cashcycle' },
  { icon: Building2, label: 'S09 Bank Offers', path: '/ib/session/9-bankoffers' },
  { icon: CheckSquare, label: 'S10 Approved', path: '/ib/session/10-approved' },
];

export function IbSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('_ib_sidebar') === 'collapsed'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('_ib_sidebar', collapsed ? 'collapsed' : 'open'); } catch {}
  }, [collapsed]);

  const isActive = (path: string) => pathname === path;

  const NavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => (
    <Link href={path} onClick={() => setMobileOpen(false)}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg text-[13px] no-underline transition-colors ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'} ${
        isActive(path)
          ? 'bg-white/10 text-white font-semibold'
          : 'text-white/60 hover:bg-white/5 hover:text-white/90'
      }`}>
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop, navy */}
      <aside className={`hidden md:flex flex-col shrink-0 transition-all duration-300 relative ${collapsed ? 'w-14' : 'w-60'}`}
        style={{ background: '#0F172A' }}>
        {/* Collapse triangle button — fixed top-right, aligned with header */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="fixed top-4 z-20 w-5 h-8 flex items-center justify-center cursor-pointer bg-[#0F172A] border border-white/10 border-l-0 rounded-r-md hover:bg-[#1E293B] transition-all"
          style={{ left: collapsed ? '56px' : '240px' }}
          title={collapsed ? 'ขยาย' : 'พับเก็บ'}>
          <svg width="7" height="12" viewBox="0 0 8 14" fill="none">
            <path d={collapsed ? 'M2 1L7 7L2 13' : 'M6 1L1 7L6 13'} stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
        </button>
        {/* Header */}
        <div className={`h-14 flex items-center shrink-0 border-b border-white/10 ${collapsed ? 'px-2 justify-center' : 'px-3 gap-3'}`}>
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer bg-transparent border-none text-white/50">
            <PanelLeft size={16} />
          </button>
          {!collapsed && <span className="font-semibold text-sm text-white tracking-tight">Business MRI</span>}
        </div>

        {/* Menu */}
        <nav className={`flex-1 overflow-y-auto py-2 space-y-0.5 ${collapsed ? 'px-1' : 'px-2'}`}>
          {MENU_ITEMS.map((item) => <NavItem key={item.label + item.path} {...item} />)}

          {!collapsed && <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wide px-3 pt-4 pb-1">Sessions</div>}
          {collapsed && <div className="border-t border-white/10 my-2 mx-1" />}

          {SESSION_ITEMS.map((item) => <NavItem key={item.label + item.path} {...item} />)}
        </nav>

        {/* Footer — home + logout */}
        <div className={`border-t border-white/10 shrink-0 space-y-0.5 ${collapsed ? 'p-1' : 'p-2'}`}>
          <Link href="/select" title="เปลี่ยนเครื่องมือ"
            className={`flex items-center gap-3 rounded-lg text-[13px] no-underline text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'}`}>
            <Home size={16} className="shrink-0" />
            {!collapsed && <span>เปลี่ยนเครื่องมือ</span>}
          </Link>
          <button onClick={() => { window.location.href = '/api/auth/signout'; }}
            title="ออกจากระบบ"
            className={`w-full flex items-center gap-3 rounded-lg text-[13px] text-white/40 hover:bg-red-500/10 hover:text-red-400 cursor-pointer bg-transparent border-none transition-colors ${collapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'}`}>
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Mobile header — navy */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{ background: 'rgba(15, 23, 42, 0.97)', backdropFilter: 'blur(8px)' }}>
        <button onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-white/70">
          <PanelLeft size={20} />
        </button>
        <span className="text-sm font-semibold text-white">Business MRI</span>
        <div className="w-9" />
      </div>

      {/* Mobile sidebar overlay — navy */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col"
            style={{ background: '#0F172A', animation: 'slideInLeft 0.2s ease-out' }}>
            <div className="h-14 flex items-center gap-3 px-3 border-b border-white/10 shrink-0">
              <button onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer bg-transparent border-none text-white/50">
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-sm text-white">Business MRI</span>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {MENU_ITEMS.map((item) => <NavItem key={item.label + item.path} {...item} />)}
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wide px-3 pt-4 pb-1">Sessions</div>
              {SESSION_ITEMS.map((item) => <NavItem key={item.label + item.path} {...item} />)}
            </nav>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 md:overflow-y-auto">
        <div className="md:hidden h-14" />
        {children}
      </div>
    </div>
  );
}
