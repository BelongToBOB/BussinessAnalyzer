'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { maskCurrency, unmaskCurrency, money } from '@/lib/format';

function SettingsRow({ label, value, trailing, onTap, last, danger }: {
  label: string; value?: string; trailing?: React.ReactNode;
  onTap?: () => void; last?: boolean; danger?: boolean;
}) {
  return (
    <div
      onClick={onTap}
      role={onTap ? 'button' : undefined}
      tabIndex={onTap ? 0 : undefined}
      className={`flex items-center w-full px-[18px] py-3.5 gap-3 cursor-${onTap ? 'pointer' : 'default'} hover:${onTap ? 'bg-bg-secondary' : ''} transition-colors ${last ? '' : 'border-b border-border'}`}
    >
      <div className="flex-1">
        <div className={`text-[15px] font-medium ${danger ? 'text-status-bad' : 'text-text-primary'}`}>{label}</div>
        {value && <div className="text-[13px] text-text-secondary mt-0.5">{value}</div>}
      </div>
      {trailing}
    </div>
  );
}

function Chevron() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round"><path d="M5 3l4 4-4 4"/></svg>;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onChange(!on); }} className="w-11 h-[26px] rounded-full p-0.5 border-none cursor-pointer transition-colors" style={{ background: on ? 'var(--status-good)' : 'var(--border-strong)' }}>
      <div className="w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform" style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [notifMonth, setNotifMonth] = useState(true);
  const [notifQuarter, setNotifQuarter] = useState(false);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editingDebt, setEditingDebt] = useState(false);
  const [editDebt, setEditDebt] = useState('');
  const [saving, setSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/business`, { credentials: 'include' });
        if (res.ok) {
          const biz = await res.json();
          setBusiness(biz);
          setEditName(biz.name);
          setEditDebt(biz.monthlyDebtService ? money(Number(biz.monthlyDebtService)) : '');
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();

    // Load theme
    const stored = localStorage.getItem('theme') || 'light';
    setTheme(stored);
  }, [apiUrl]);

  const handleTheme = (t: string) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    if (t === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (t === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      // auto
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    }
  };

  const saveBusiness = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/business`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setBusiness(updated);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    await saveBusiness({ name: editName.trim() });
    setEditingName(false);
  };

  const handleSaveDebt = async () => {
    const val = editDebt ? unmaskCurrency(editDebt) : null;
    await saveBusiness({ monthlyDebtService: val });
    setEditingDebt(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('ลบข้อมูลทั้งหมดจริงหรือ? การกระทำนี้ย้อนกลับไม่ได้')) return;
    if (!confirm('ยืนยันอีกครั้ง — ข้อมูลทั้งหมดจะหายถาวร')) return;
    // TODO: implement DELETE /api/business (cascade)
    await signOut({ callbackUrl: '/login' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-text-secondary">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">ตั้งค่า</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">{business?.name}</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">ตั้งค่า</h1>
        <p className="text-sm text-text-secondary mt-1 mb-7">บัญชี · ธีม · การแจ้งเตือน · ข้อมูล</p>

        {/* Account */}
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary px-1 pb-2">บัญชี</div>
        <div className="bg-bg-card border border-border rounded-[14px] overflow-hidden mb-7">
          {!editingName ? (
            <SettingsRow label="ชื่อธุรกิจ" value={business?.name} trailing={<Chevron />} onTap={() => setEditingName(true)} />
          ) : (
            <div className="px-[18px] py-3.5 border-b border-border">
              <div className="text-[15px] font-medium mb-2">ชื่อธุรกิจ</div>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                className="w-full h-11 rounded-xl border border-border-strong bg-bg-card px-3 text-sm text-text-primary outline-none focus:border-accent font-thai" />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveName} disabled={saving} className="px-3 py-1.5 rounded-lg bg-text-primary text-bg-primary text-xs font-semibold cursor-pointer disabled:opacity-50">บันทึก</button>
                <button onClick={() => { setEditingName(false); setEditName(business?.name || ''); }} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold cursor-pointer bg-bg-card">ยกเลิก</button>
              </div>
            </div>
          )}

          {!editingDebt ? (
            <SettingsRow label="ภาระผ่อนหนี้ต่อเดือน" value={business?.monthlyDebtService ? money(Number(business.monthlyDebtService)) + ' บาท' : 'ยังไม่ได้ตั้ง'} trailing={<Chevron />} onTap={() => setEditingDebt(true)} />
          ) : (
            <div className="px-[18px] py-3.5 border-b border-border">
              <div className="text-[15px] font-medium mb-2">ภาระผ่อนหนี้ต่อเดือน</div>
              <div className="relative">
                <input inputMode="numeric" value={editDebt} onChange={(e) => setEditDebt(maskCurrency(e.target.value))} autoFocus
                  className="w-full h-11 rounded-xl border border-border-strong bg-bg-card px-3 pr-14 num text-sm font-medium text-text-primary outline-none focus:border-accent" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">บาท</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveDebt} disabled={saving} className="px-3 py-1.5 rounded-lg bg-text-primary text-bg-primary text-xs font-semibold cursor-pointer disabled:opacity-50">บันทึก</button>
                <button onClick={() => { setEditingDebt(false); setEditDebt(business?.monthlyDebtService ? money(Number(business.monthlyDebtService)) : ''); }} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold cursor-pointer bg-bg-card">ยกเลิก</button>
              </div>
            </div>
          )}

          <SettingsRow label="เข้าสู่ระบบด้วย" value="LINE / อีเมล" last
            trailing={<span className="text-xs text-text-tertiary">ไม่สามารถแก้ได้</span>} />
        </div>

        {/* Theme */}
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary px-1 pb-2">ธีม</div>
        <div className="bg-bg-secondary rounded-xl p-1 flex gap-1 max-w-[360px] mb-7">
          {[
            { id: 'light', label: 'สว่าง' },
            { id: 'dark', label: 'มืด' },
            { id: 'auto', label: 'อัตโนมัติ' },
          ].map((t) => (
            <button key={t.id} onClick={() => handleTheme(t.id)} className="flex-1 h-10 rounded-lg border-none text-[13px] font-semibold cursor-pointer font-thai transition-all" style={{
              background: theme === t.id ? 'var(--bg-card)' : 'transparent',
              boxShadow: theme === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              color: theme === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary px-1 pb-2">แจ้งเตือน</div>
        <div className="bg-bg-card border border-border rounded-[14px] overflow-hidden mb-7">
          <SettingsRow label="แจ้งเตือนกรอกสิ้นเดือน" value="ทุกวันที่ 1 เวลา 9:00"
            trailing={<Toggle on={notifMonth} onChange={setNotifMonth} />} />
          <SettingsRow label="สรุปทุกไตรมาส" value="ส่งทางอีเมล" last
            trailing={<Toggle on={notifQuarter} onChange={setNotifQuarter} />} />
        </div>

        {/* Data */}
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary px-1 pb-2">ข้อมูล</div>
        <div className="bg-bg-card border border-border rounded-[14px] overflow-hidden mb-7">
          <SettingsRow label="ออกจากระบบ" onTap={() => signOut({ callbackUrl: '/login' })} last trailing={<Chevron />} />
        </div>

        {/* Danger zone */}
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary px-1 pb-2">โซนอันตราย</div>
        <div className="bg-bg-card border border-border rounded-[14px] overflow-hidden mb-7">
          <SettingsRow label="ลบข้อมูลทั้งหมด" danger last onTap={handleDeleteAccount} trailing={<Chevron />} />
        </div>

        <div className="mt-4 text-[11px] text-text-tertiary">InsideBank · v0.1 · WinWin Wealth Creation</div>
      </main>

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,12px)] pt-2 px-2 grid grid-cols-4 xl:hidden z-20">
        {[
          { label: 'หน้าหลัก', href: '/dashboard' },
          { label: 'กรอกใหม่', href: '/entry/new' },
          { label: 'ย้อนหลัง', href: '/history' },
          { label: 'บัญชี',   href: '/settings' },
        ].map((tab) => (
          <a key={tab.label} href={tab.href} className={`flex flex-col items-center gap-0.5 py-1.5 no-underline text-[10px] font-medium ${tab.href === '/settings' ? 'text-text-primary' : 'text-text-tertiary'}`}>
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
