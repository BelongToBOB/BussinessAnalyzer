'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { ExpenseDonutChart } from '@/components/ui/charts';
import { getExpenseItems, createExpenseItem, updateExpenseItem, deleteExpenseItem, getLeakChecks, upsertLeakCheck } from '@/lib/api';

const CATEGORIES = ['ลงทุน', 'ดำเนินงาน', 'สูญเปล่า'] as const;
const CAT_COLORS: Record<string, string> = {
  'ลงทุน': 'bg-wash-good text-status-good',
  'ดำเนินงาน': 'bg-wash-info text-accent',
  'สูญเปล่า': 'bg-wash-bad text-status-bad',
};
const CAT_ACTIONS: Record<string, string> = {
  'ลงทุน': 'MAXIMIZE — เพิ่มถ้ายังคุ้ม',
  'ดำเนินงาน': 'OPTIMIZE — ปรับให้คุ้มที่สุด',
  'สูญเปล่า': 'ELIMINATE — ตัดทิ้ง',
};

export default function ExpenseMapPage() {
  const router = useRouter();
  const [items, setItems] = useState<any>(null);
  const [leaks, setLeaks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add item form
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<string>('ดำเนินงาน');
  const [newAmount, setNewAmount] = useState('');
  const [newDecision, setNewDecision] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [itemsData, leaksData] = await Promise.all([getExpenseItems(), getLeakChecks()]);
        setItems(itemsData);
        setLeaks(leaksData);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const refresh = async () => {
    const [itemsData, leaksData] = await Promise.all([getExpenseItems(), getLeakChecks()]);
    setItems(itemsData);
    setLeaks(leaksData);
  };

  const handleAddItem = async () => {
    if (!newName.trim() || !newAmount) return;
    await createExpenseItem({ name: newName.trim(), category: newCat, amount: unmaskCurrency(newAmount), decision: newDecision || null });
    setNewName(''); setNewAmount(''); setNewDecision('');
    await refresh();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return;
    await deleteExpenseItem(id);
    await refresh();
  };

  const handleToggleLeak = async (checkNumber: number, current: any) => {
    await upsertLeakCheck(checkNumber, { found: !current.found, leakAmount: current.leakAmount, fixPlan: current.fixPlan });
    await refresh();
  };

  const handleLeakDetail = async (checkNumber: number, field: string, value: any) => {
    const current = (leaks as any).checks.find((c: any) => c.checkNumber === checkNumber);
    await upsertLeakCheck(checkNumber, { found: current.found, leakAmount: current.leakAmount, fixPlan: current.fixPlan, [field]: value });
    await refresh();
  };

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const itemsData = items as any;
  const leaksData = leaks as any;

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S5 · Expense Map</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">แผนที่ค่าใช้จ่าย</h1>
        <p className="text-sm text-text-secondary mt-1 mb-2">อุดรอยรั่วก่อนเร่งยอดขาย — ปริมาณการขายไม่ช่วยอุดรอยรั่ว</p>

        {/* Category legend */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">ค่าใช้จ่าย 3 กลุ่ม</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <div key={cat} className={`${CAT_COLORS[cat]} rounded-xl p-3`}>
                <div className="text-sm font-semibold">{cat}</div>
                <div className="text-xs mt-0.5 opacity-80">{CAT_ACTIONS[cat]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 1: Expense Items */}
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2">ส่วนที่ 1 · แผนที่ค่าใช้จ่ายของคุณ</div>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_100px_80px_40px] gap-2 px-4 py-2.5 text-[11px] text-text-secondary uppercase tracking-wide font-semibold border-b border-border">
            <span>รายการ</span>
            <span>กลุ่ม</span>
            <span className="text-right">บาท/เดือน</span>
            <span>ตัดสินใจ</span>
            <span />
          </div>

          {/* Items */}
          {(itemsData?.items || []).map((item: any) => (
            <div key={item.id} className="grid grid-cols-[1fr_100px_100px_80px_40px] gap-2 items-center px-4 py-2.5 border-b border-border last:border-b-0 text-sm">
              <span className="font-medium">{item.name}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg text-center ${CAT_COLORS[item.category] || ''}`}>{item.category}</span>
              <span className="num text-right">{money(Number(item.amount))}</span>
              <span className="text-xs text-text-secondary">{item.decision || '—'}</span>
              <button onClick={() => handleDeleteItem(item.id)} className="text-status-bad text-xs cursor-pointer bg-transparent border-none p-1">✕</button>
            </div>
          ))}

          {/* Add row */}
          <div className="grid grid-cols-[1fr_100px_100px_80px_40px] gap-2 items-center px-4 py-3 bg-bg-secondary">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="รายการใหม่..." className="h-9 rounded-lg border border-border bg-bg-card px-2.5 text-sm outline-none focus:border-accent font-thai" />
            <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="h-9 rounded-lg border border-border bg-bg-card px-1.5 text-xs outline-none font-thai">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input inputMode="numeric" value={newAmount} onChange={(e) => setNewAmount(maskCurrency(e.target.value))} placeholder="0" className="h-9 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
            <select value={newDecision} onChange={(e) => setNewDecision(e.target.value)} className="h-9 rounded-lg border border-border bg-bg-card px-1.5 text-xs outline-none font-thai">
              <option value="">—</option>
              <option value="ตัด">ตัด</option>
              <option value="เพิ่ม">เพิ่ม</option>
              <option value="ปรับ">ปรับ</option>
            </select>
            <button onClick={handleAddItem} disabled={!newName.trim() || !newAmount} className="h-9 w-9 rounded-lg bg-text-primary text-bg-primary font-bold cursor-pointer disabled:opacity-30 border-none text-lg">+</button>
          </div>
        </div>

        {/* Summary */}
        {itemsData && itemsData.items.length > 0 && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
            <ExpenseDonutChart
              invest={itemsData.byCategory.invest}
              operate={itemsData.byCategory.operate}
              waste={itemsData.byCategory.waste}
            />
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">รวมทั้งหมด</span>
                <span className="num text-base font-semibold">{money(itemsData.total)} บาท/เดือน</span>
              </div>
              <div className="text-sm font-medium leading-relaxed">{itemsData.verdict}</div>
            </div>
          </div>
        )}

        {/* Part 2: 10 Leak Checkpoints */}
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2 mt-8">ส่วนที่ 2 · เช็ค 10 จุดรั่วที่เจ้าของมักมองข้าม</div>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4">
          {(leaksData?.checks || []).map((check: any) => (
            <div key={check.checkNumber} className={`px-4 py-3 border-b border-border last:border-b-0 ${check.found ? 'bg-wash-bad/30' : ''}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleLeak(check.checkNumber, check)}
                  className="w-6 h-6 rounded-md border-none cursor-pointer p-0 shrink-0 flex items-center justify-center"
                  style={{
                    background: check.found ? 'var(--status-bad)' : 'transparent',
                    border: check.found ? 'none' : '1.5px solid var(--text-tertiary)',
                  }}
                >
                  {check.found && <span className="text-white text-xs font-bold">✓</span>}
                </button>
                <div className="flex-1">
                  <div className="text-sm font-medium">{check.checkNumber}. {check.label}</div>
                </div>
              </div>
              {check.found && (
                <div className="mt-2 ml-9 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-text-secondary mb-1">เงินรั่ว/เดือน (ประมาณ)</div>
                    <input
                      inputMode="numeric"
                      value={check.leakAmount ? money(check.leakAmount) : ''}
                      onBlur={(e) => handleLeakDetail(check.checkNumber, 'leakAmount', unmaskCurrency(e.target.value))}
                      onChange={(e) => {/* controlled locally via onBlur */}}
                      placeholder="0"
                      className="h-8 w-full rounded-lg border border-border bg-bg-card px-2.5 text-sm num outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-text-secondary mb-1">แผนแก้</div>
                    <input
                      defaultValue={check.fixPlan || ''}
                      onBlur={(e) => handleLeakDetail(check.checkNumber, 'fixPlan', e.target.value)}
                      placeholder="วางแผนแก้..."
                      className="h-8 w-full rounded-lg border border-border bg-bg-card px-2.5 text-sm outline-none focus:border-accent font-thai"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Leak summary */}
        {leaksData && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <SummaryCard label="จุดรั่วที่พบ" value={`${leaksData.foundCount} / 10`} color={leaksData.foundCount >= 4 ? 'bad' : leaksData.foundCount >= 1 ? 'warn' : 'good'} />
              <SummaryCard label="เงินรั่วรวม/เดือน" value={money(leaksData.totalLeak) + ' บาท'} color="bad" />
            </div>
            <div className="text-sm font-medium leading-relaxed">{leaksData.verdict}</div>
          </div>
        )}

        {/* 3 measures */}
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2 mt-8">3 มาตรการหยุดเลือดไหล (Stop Bleeding)</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
          <MeasureRow num={1} title="สร้างระบบ (Policy)" body="แยกบัญชีธุรกิจ/ส่วนตัว 100% · No Bill No Pay · ตั้งงบประมาณคุมเพดาน" />
          <MeasureRow num={2} title="ตรวจสอบ (Audit)" body="นับสต็อกทุกเดือนหา Dead Stock · รีวิว Subscription · ตรวจ Statement หาค่าธรรมเนียมแฝง" />
          <MeasureRow num={3} title="ปรับปรุง (Optimize)" body="เจรจา Supplier ขอเครดิตเพิ่ม · ตัด Ads ที่ ROAS ต่ำ · Lean องค์กรลดขั้นตอนซ้ำซ้อน" />
        </div>

        <p className="text-xs text-text-tertiary mt-4 px-1">
          * การอุดรอยรั่วคือการเพิ่มกำไรสุทธิที่ง่ายและเร็วที่สุด โดยไม่ต้องหายอดขายเพิ่ม
        </p>
      </main>

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,12px)] pt-2 px-2 grid grid-cols-4 xl:hidden z-20">
        {[
          { label: 'หน้าหลัก', href: '/dashboard' },
          { label: 'Expense Map', href: '/expense-map' },
          { label: 'ย้อนหลัง', href: '/history' },
          { label: 'บัญชี', href: '/settings' },
        ].map((tab) => (
          <a key={tab.label} href={tab.href} className={`flex flex-col items-center gap-0.5 py-1.5 no-underline text-[10px] font-medium ${tab.href === '/expense-map' ? 'text-text-primary' : 'text-text-tertiary'}`}>
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const bg = color === 'good' ? 'bg-wash-good' : color === 'bad' ? 'bg-wash-bad' : color === 'warn' ? 'bg-wash-warn' : color === 'info' ? 'bg-wash-info' : 'bg-bg-secondary';
  return (
    <div className={`${bg} rounded-xl p-3`}>
      <div className="text-[11px] text-text-secondary">{label}</div>
      <div className="num text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function MeasureRow({ num, title, body }: { num: number; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-text-primary text-bg-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{num}</div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
