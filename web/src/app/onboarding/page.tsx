'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { maskCurrency, unmaskCurrency } from '@/lib/format';
import { getBusiness, createBusiness, upsertEntry } from '@/lib/api';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(true);
  const [consent, setConsent] = useState(false);

  // Skip onboarding if business already exists
  useEffect(() => {
    getBusiness()
      .then(() => { window.location.href = '/dashboard'; })
      .catch(() => { setChecking(false); });
  }, []);
  const [name, setName] = useState('');
  const [debt, setDebt] = useState('');
  const [useSample, setUseSample] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      await createBusiness({
        name: name.trim(),
        monthlyDebtService: debt ? unmaskCurrency(debt) : null,
      });

      if (useSample) {
        const now = new Date();
        const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await upsertEntry(yyyyMm, {
          grossSales: 500000,
          creditSales: 150000,
          cogs: 300000,
          otherExpenses: 135000,
          cashIn: 380000,
          arBalance: 220000,
          apBalance: 160000,
          cashOnHand: 280000,
          leakNote: 'ค่าขนส่งเกินงบ — 18,000 บาท (ข้อมูลตัวอย่าง)',
        });
      }

      toast.success('สร้างธุรกิจสำเร็จ');
      // Full page reload to reset all state
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Onboarding error:', err);
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setSaving(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังตรวจสอบ...</div>;
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[520px] bg-bg-card rounded-[20px] border border-border p-6 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-7">
          <img src="/logo-32.png" alt="WW" width={26} height={26} className="rounded" />
          <span className="text-sm font-semibold">WinWin Analyzer</span>
          <div className="flex-1" />
          <span className="num text-xs text-text-tertiary font-semibold">{step}/2</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className="h-1 rounded-full flex-1 transition-colors"
              style={{ background: s <= step ? 'var(--text-primary)' : 'var(--border)' }}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 className="text-2xl md:text-[32px] font-semibold tracking-tight leading-tight mb-2">
              เริ่มต้นเรียกชื่อ<br/>ธุรกิจของคุณก่อน
            </h1>
            <p className="text-sm text-text-secondary mb-7">
              ชื่อนี้จะขึ้นที่หัว Dashboard และเอกสาร Export
            </p>

            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">
              ชื่อธุรกิจ
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น บริษัท วินวิน จำกัด"
              autoFocus
              className="mt-2 block w-full h-[52px] rounded-xl border border-border-strong bg-bg-card px-4 text-base text-text-primary outline-none focus:border-accent font-thai"
            />

            {/* Consent */}
            <div className="mt-6 flex gap-3 items-start">
              <button
                onClick={() => setConsent(!consent)}
                className="mt-0.5 w-5 h-5 rounded-md border-none cursor-pointer p-0 shrink-0 flex items-center justify-center"
                style={{
                  background: consent ? 'var(--accent)' : 'transparent',
                  border: consent ? 'none' : '1.5px solid var(--text-tertiary)',
                }}
              >
                {consent && (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3 3 5-6"/></svg>
                )}
              </button>
              <div className="text-xs text-text-secondary leading-relaxed">
                ข้าพเจ้ายอมรับ{' '}
                <a href="/terms" target="_blank" className="text-accent underline">ข้อกำหนดการใช้งาน</a>
                {' '}และ{' '}
                <a href="/privacy" target="_blank" className="text-accent underline">นโยบายความเป็นส่วนตัว</a>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim() || !consent}
                className="h-12 px-6 rounded-xl bg-text-primary text-bg-primary font-semibold text-[15px] cursor-pointer disabled:opacity-40"
              >
                ต่อไป →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl md:text-[32px] font-semibold tracking-tight leading-tight mb-2">
              มีภาระผ่อนหนี้ทุกเดือน<br/>กี่บาท?
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              ใช้คำนวณ Cash Runway · ถ้าไม่มีให้ใส่ 0 หรือข้ามไป (แก้ที่ Settings ทีหลังได้)
            </p>

            <div className="relative">
              <input
                inputMode="numeric"
                value={debt}
                onChange={(e) => setDebt(maskCurrency(e.target.value))}
                placeholder="0"
                autoFocus
                className="w-full h-[52px] rounded-xl border border-border-strong bg-bg-card px-4 pr-16 num text-xl font-medium tracking-tight text-text-primary outline-none focus:border-accent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-medium">
                บาท
              </span>
            </div>

            {/* Sample data toggle */}
            <div className="mt-6 p-3.5 rounded-xl bg-wash-info flex gap-3 items-start">
              <button
                onClick={() => setUseSample(!useSample)}
                className="mt-0.5 w-[22px] h-[22px] rounded-md border-none cursor-pointer p-0 shrink-0 flex items-center justify-center"
                style={{
                  background: useSample ? 'var(--accent)' : 'transparent',
                  border: useSample ? 'none' : '1.5px solid var(--text-tertiary)',
                }}
              >
                {useSample && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7l3 3 5-6"/>
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <div className="text-sm font-semibold">ใช้ข้อมูลตัวอย่างเพื่อลองก่อน</div>
                <div className="text-xs text-text-secondary mt-1 leading-snug">
                  สร้างเดือนตัวอย่างให้ดู Dashboard ก่อนกรอกของจริง · ลบทิ้งทีหลังได้
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep(1)}
                className="text-text-secondary text-sm font-medium cursor-pointer bg-transparent border-none p-2"
              >
                ← กลับ
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="h-12 px-6 rounded-xl bg-text-primary text-bg-primary font-semibold text-[15px] cursor-pointer disabled:opacity-50"
              >
                {saving ? 'กำลังสร้าง...' : 'เริ่มใช้งาน →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
