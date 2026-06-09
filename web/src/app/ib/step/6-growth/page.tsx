'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/format';
import { getSession, saveSession } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, ShieldCheck, AlertTriangle, XOctagon, TrendingUp, Landmark } from 'lucide-react';

const LEVELS = [
  { label: 'ปลอดภัย', desc: 'กู้แล้วยังชำระหนี้สบาย', Icon: ShieldCheck, color: '#22C55E', dscr: '≥ 1.5' },
  { label: 'สูงสุด', desc: 'กู้ได้แต่ต้องระวัง', Icon: AlertTriangle, color: '#F59E0B', dscr: '≥ 1.25' },
  { label: 'อันตราย', desc: 'เสี่ยงชำระหนี้ไม่ไหว', Icon: XOctagon, color: '#EF4444', dscr: '≥ 1.0' },
];

export default function IbStep6Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rate, setRate] = useState(7);
  const [rateText, setRateText] = useState('7');
  const [years, setYears] = useState(7);
  const [yearsText, setYearsText] = useState('7');
  const [ebitda, setEbitda] = useState(0);
  const [existingDS, setExistingDS] = useState(0);
  const [capacity, setCapacity] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      getSession('ib-financial').catch(() => null),
      getSession('ib-growth').catch(() => null),
    ]).then(([fin, gr]) => {
      const fc = (fin as any)?.computed;
      if (fc) { setEbitda(fc.ebitda || 0); setExistingDS(fc.annualDebtService || 0); }
      const d = (gr as any)?.data;
      if (d) {
        if (d.rate) { setRate(d.rate * 100); setRateText(String(d.rate * 100)); }
        if (d.years) { setYears(d.years); setYearsText(String(d.years)); }
      }
    });
  }, []);

  useEffect(() => {
    if (ebitda <= 0) { setCapacity(null); return; }
    const r = rate / 100;
    const level = (targetDSCR: number) => {
      const maxS = ebitda / targetDSCR;
      const newS = Math.max(0, maxS - existingDS);
      const loan = r === 0 ? newS * years : newS * (1 - Math.pow(1 + r, -years)) / r;
      return { targetDSCR, loan: Math.round(loan), newServicePerYear: Math.round(newS) };
    };
    setCapacity({ safe: level(1.5), max: level(1.25), danger: level(1.0) });
  }, [ebitda, existingDS, rate, years]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession('ib-growth', { ebitda, annualDebtService: existingDS, rate: rate / 100, years });
      toast.success('บันทึกสำเร็จ');
      setSaved(true);
    } catch (e: any) { toast.error(e.message || 'บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  const maxLoan = capacity?.danger?.loan || 1;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary"><ChevronLeft size={20} strokeWidth={2} /></button>
          <span className="text-[15px] font-semibold">Step 6 · กู้ได้เท่าไหร่</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-4 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Step 6 of 7</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">กู้ได้เท่าไหร่</h1>
          <p className="text-sm text-text-secondary mt-1">ปรับสมมติฐาน แล้วดูวงเงิน 3 ระดับทันที</p>
        </div>

        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: s <= 6 ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        {ebitda <= 0 && (
          <div className="bg-wash-warn rounded-xl p-4 mb-5 text-sm">กรุณาทำ Step 2 ก่อน เพื่อให้ได้ค่ากำไรก่อนหัก</div>
        )}

        {/* Data from Step 2 */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #22C55E 10%, transparent)' }}>
              <TrendingUp size={18} strokeWidth={1.5} color="#22C55E" />
            </div>
            <div>
              <div className="text-[10px] text-text-tertiary">กำไรก่อนหัก/ปี</div>
              <div className="num text-base font-bold">{money(ebitda)}</div>
            </div>
          </div>
          <div className="bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #EF4444 10%, transparent)' }}>
              <Landmark size={18} strokeWidth={1.5} color="#EF4444" />
            </div>
            <div>
              <div className="text-[10px] text-text-tertiary">ภาระหนี้/ปี</div>
              <div className="num text-base font-bold">{money(existingDS)}</div>
            </div>
          </div>
        </div>

        {/* Assumptions — sliders */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-4">สมมติฐานเงินกู้</div>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">อัตราดอกเบี้ย</label>
                <div className="flex items-center gap-1">
                  <input inputMode="decimal" value={rateText}
                    onChange={(e) => { setRateText(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 30) { setRate(v); setSaved(false); } }}
                    onBlur={() => setRateText(String(rate))}
                    className="w-14 h-8 rounded-lg border border-border bg-bg-secondary px-2 text-sm text-center num outline-none focus:border-accent" />
                  <span className="text-xs text-text-tertiary">%/ปี</span>
                </div>
              </div>
              <input type="range" min={3} max={15} step={0.5} value={rate}
                onChange={(e) => { setRate(Number(e.target.value)); setRateText(e.target.value); setSaved(false); }}
                className="w-full" />
              <div className="flex justify-between text-[9px] text-text-tertiary mt-0.5"><span>3%</span><span>15%</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">ระยะเวลากู้</label>
                <div className="flex items-center gap-1">
                  <input inputMode="numeric" value={yearsText}
                    onChange={(e) => { setYearsText(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 30) { setYears(v); setSaved(false); } }}
                    onBlur={() => setYearsText(String(years))}
                    className="w-14 h-8 rounded-lg border border-border bg-bg-secondary px-2 text-sm text-center num outline-none focus:border-accent" />
                  <span className="text-xs text-text-tertiary">ปี</span>
                </div>
              </div>
              <input type="range" min={1} max={15} step={1} value={years}
                onChange={(e) => { setYears(Number(e.target.value)); setYearsText(e.target.value); setSaved(false); }}
                className="w-full" />
              <div className="flex justify-between text-[9px] text-text-tertiary mt-0.5"><span>1 ปี</span><span>15 ปี</span></div>
            </div>
          </div>
        </div>

        {/* Results — 3 level cards */}
        {capacity && (
          <div className="space-y-3 mb-5">
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary px-1">วงเงินที่กู้ได้</div>
            {LEVELS.map((lv, i) => {
              const data = i === 0 ? capacity.safe : i === 1 ? capacity.max : capacity.danger;
              const canBorrow = data.loan > 0;
              return (
                <div key={i} className="bg-bg-card border rounded-2xl p-4 transition-colors"
                  style={{ borderColor: `color-mix(in srgb, ${lv.color} 30%, var(--border))` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in srgb, ${lv.color} 10%, transparent)` }}>
                      <lv.Icon size={20} strokeWidth={1.5} color={lv.color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold">{lv.label}</span>
                          <span className="text-[10px] text-text-tertiary ml-1.5">DSCR {lv.dscr}</span>
                        </div>
                        <span className="num text-base font-bold" style={{ color: lv.color }}>
                          {canBorrow ? money(data.loan) : 'กู้เพิ่มไม่ได้'}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-tertiary mt-0.5">{lv.desc}</div>
                    </div>
                  </div>
                  {canBorrow && (
                    <div className="mt-3">
                      <div className="h-3 rounded-md overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-md transition-all duration-700"
                          style={{ width: `${Math.min(100, data.loan / maxLoan * 100)}%`, background: lv.color }} />
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-1">ผ่อนเพิ่มได้ {money(data.newServicePerYear)} บาท/ปี</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Save + Next */}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || ebitda <= 0}
            className="flex-1 rounded-xl font-semibold cursor-pointer border-none text-sm disabled:opacity-40 transition-all gradient-accent"
            style={{ height: 48 }}>
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึก'}
          </button>
          {saved && (
            <button onClick={() => router.push('/ib/step/7-action')}
              className="flex-1 rounded-xl border border-border bg-bg-card font-semibold cursor-pointer text-sm text-text-primary"
              style={{ height: 48 }}>
              ไป Step 7 →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
