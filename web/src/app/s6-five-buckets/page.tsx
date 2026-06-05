'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { getSession, saveSession } from '@/lib/api';
import { FiveBucketsChart } from '@/components/ui/charts';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';
import { SessionGuide } from '@/components/ui/session-guide';

const DEFAULT_BUCKETS = [
  { name: 'ต้นทุนสินค้า/บริการ', pct: 40 },
  { name: 'ค่าใช้จ่ายดำเนินงาน (OPEX)', pct: 25 },
  { name: 'ภาษี + ผ่อนหนี้', pct: 15 },
  { name: 'เงินสำรอง (Reserve)', pct: 10 },
  { name: 'เจ้าของ + ขยายธุรกิจ', pct: 10 },
];

const BUCKET_DESCRIPTIONS = [
  'ซื้อวัตถุดิบ/สินค้าเพื่อขายรอบถัดไป',
  'เงินเดือน ค่าเช่า ค่าน้ำไฟ การตลาด',
  'กันไว้จ่ายภาษีและชำระหนี้ ไม่ผิดนัด',
  'กันชนเวลาเดือนชะลอ/เหตุฉุกเฉิน',
  'เงินเดือนเจ้าของ + ทุนสำหรับเติบโต',
];

const BUCKET_COLORS = [
  'bg-accent/20 text-accent',
  'bg-wash-warn text-status-warn',
  'bg-wash-bad text-status-bad',
  'bg-wash-good text-status-good',
  'bg-wash-info text-text-primary',
];
const BAR_COLORS = ['bg-accent', 'bg-status-warn', 'bg-status-bad', 'bg-status-good', 'bg-text-primary'];

export default function S6FiveBucketsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [revenue, setRevenue] = useState('');
  const [buckets, setBuckets] = useState(DEFAULT_BUCKETS);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSession('s6-five-buckets') as any;
        if (data) {
          if (data.revenue) setRevenue(maskCurrency(String(data.revenue)));
          if (data.buckets) setBuckets(data.buckets);
        }
      } catch { /* new session */ }
    }
    load();
  }, []);

  const revNum = unmaskCurrency(revenue);
  const totalPct = buckets.reduce((s, b) => s + b.pct, 0);
  const isBalanced = Math.abs(totalPct - 100) < 0.01;

  const setBucketPct = (i: number, pct: number) => {
    setBuckets((old) => old.map((b, idx) => idx === i ? { ...b, pct } : b));
  };
  const setBucketName = (i: number, name: string) => {
    setBuckets((old) => old.map((b, idx) => idx === i ? { ...b, name } : b));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession('s6-five-buckets', {
        revenue: unmaskCurrency(revenue),
        buckets,
      });
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S6 &middot; ระบบ 5 ช่อง</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">ระบบ 5 ช่อง</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">แบ่งรายรับออกเป็น 5 ช่อง เพื่อบริหารเงินอย่างเป็นระบบ</p>

        <SessionGuide page="s6-five-buckets" />

        <div className="mb-6">
          <label className="text-sm font-medium mb-1.5 block">รายรับต่อเดือน</label>
          <NumberInput value={revenue} onChange={setRevenue} />
        </div>

        {/* Visual bar */}
        {revNum > 0 && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">สัดส่วนการจัดสรร</div>
            <div className="flex rounded-xl overflow-hidden h-8 mb-2">
              {buckets.map((b, i) => (
                b.pct > 0 ? (
                  <div
                    key={i}
                    className={`${BAR_COLORS[i]} flex items-center justify-center text-[10px] text-white font-semibold transition-all`}
                    style={{ width: `${Math.max(b.pct, 2)}%` }}
                  >
                    {b.pct >= 8 ? `${b.pct}%` : ''}
                  </div>
                ) : null
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {buckets.map((b, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px]">
                  <div className={`w-2 h-2 rounded-full ${BAR_COLORS[i]}`} />
                  <span className="text-text-secondary">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5 Buckets */}
        <div className="space-y-3">
          {buckets.map((bucket, i) => (
            <div key={i} className={`${BUCKET_COLORS[i]} rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-1">
                <input
                  value={bucket.name}
                  onChange={(e) => setBucketName(i, e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-semibold w-full font-thai"
                />
                <span className="num text-sm font-bold shrink-0 ml-2">
                  {revNum > 0 ? money(Math.round(revNum * bucket.pct / 100)) : '—'} บาท
                </span>
              </div>
              <div className="text-xs text-text-secondary mb-2">{BUCKET_DESCRIPTIONS[i]}</div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bucket.pct}
                  onChange={(e) => setBucketPct(i, Number(e.target.value))}
                  className="flex-1 accent-current"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    inputMode="decimal"
                    value={bucket.pct}
                    onChange={(e) => setBucketPct(i, Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
                    className="w-12 h-8 rounded-lg border border-border bg-white/50 px-2 text-sm text-center num outline-none"
                  />
                  <span className="text-xs">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual chart */}
        {revNum > 0 && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mt-4">
            <FiveBucketsChart
              revenue={revNum}
              buckets={buckets.map((b: any, i: number) => ({
                name: b.name || `ช่อง ${i + 1}`,
                pct: (b.pct || 0) / 100,
                amount: revNum * ((b.pct || 0) / 100),
              }))}
            />
          </div>
        )}

        {/* Verdict */}
        <div className={`rounded-2xl p-4 mt-4 ${isBalanced ? 'bg-wash-good' : 'bg-wash-warn'}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">
              {isBalanced ? '\u2705 รวม 100% พอดี' : '\u26A0\uFE0F รวม ' + totalPct + '% — ยังไม่ครบ 100%'}
            </span>
            <span className="num font-bold">{totalPct}%</span>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm mt-6 disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        <div className="mt-6">
          <WinTip page="s6-five-buckets" />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
