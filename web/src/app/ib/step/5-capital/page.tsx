'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { getSession, saveSession } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, RefreshCcw, Expand, Truck, Building, Landmark, PiggyBank, Shield } from 'lucide-react';

const PURPOSES = [
  { id: 'working', label: 'เงินทุนหมุนเวียน', desc: 'ซื้อวัตถุดิบ / จ่าย supplier', Icon: RefreshCcw, color: '#3B82F6' },
  { id: 'expansion', label: 'ขยายกิจการ', desc: 'เปิดสาขาใหม่ / เพิ่มกำลังผลิต', Icon: Expand, color: '#22C55E' },
  { id: 'asset', label: 'ซื้อสินทรัพย์', desc: 'ที่ดิน อาคาร เครื่องจักร รถ', Icon: Truck, color: '#F59E0B' },
  { id: 'refinance', label: 'รีไฟแนนซ์', desc: 'ปรับโครงสร้างหนี้ / ลดดอกเบี้ย', Icon: Building, color: '#A855F7' },
];

export default function IbStep5Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [projectValue, setProjectValue] = useState('');
  const [ownCapital, setOwnCapital] = useState('');
  const [collateralValue, setCollateralValue] = useState('');

  useEffect(() => {
    getSession('ib-capital').then((res: any) => {
      const d = res?.data;
      if (!d) return;
      if (d.purpose) setPurpose(d.purpose);
      if (d.projectValue) setProjectValue(maskCurrency(String(d.projectValue)));
      if (d.ownCapital) setOwnCapital(maskCurrency(String(d.ownCapital)));
      if (d.collateralValue) setCollateralValue(maskCurrency(String(d.collateralValue)));
    }).catch(() => {});
  }, []);

  const u = unmaskCurrency;
  const pv = u(projectValue), oc = u(ownCapital), cv = u(collateralValue);
  const loanNeeded = Math.max(0, pv - oc);
  const ltv = cv > 0 ? loanNeeded / cv * 100 : null;
  const ownPct = pv > 0 ? oc / pv * 100 : 0;
  const selectedPurpose = PURPOSES.find(p => p.id === purpose);

  // Verdict
  let verdict = '';
  let verdictColor = 'var(--text-tertiary)';
  let verdictBg = 'bg-bg-card border border-border';
  const warnings: string[] = [];
  if (pv > 0) {
    if (ownPct < 20) warnings.push('ทุนตัวเองต่ำกว่า 20% — ธนาคารอาจไม่พิจารณา');
    if (ltv != null && ltv > 80) warnings.push(`วงเงินกู้ต่อหลักประกัน ${ltv.toFixed(0)}% สูงกว่า 80%`);
    if (ltv == null && loanNeeded > 0) warnings.push('ไม่มีหลักประกัน — ธนาคารส่วนใหญ่ต้องการ');

    if (warnings.length === 0) { verdict = 'โครงสร้างดี — พร้อมเสนอ'; verdictColor = 'var(--status-good)'; verdictBg = 'bg-wash-good'; }
    else if (warnings.length === 1) { verdict = 'ต้องปรับ 1 จุด'; verdictColor = 'var(--status-warn)'; verdictBg = 'bg-wash-warn'; }
    else { verdict = 'โครงสร้างมีปัญหา — ต้องปรับก่อน'; verdictColor = 'var(--status-bad)'; verdictBg = 'bg-wash-bad'; }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession('ib-capital', { purpose, projectValue: pv, ownCapital: oc, collateralValue: cv });
      toast.success('บันทึกสำเร็จ');
      setSaved(true);
    } catch (e: any) { toast.error(e.message || 'บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary"><ChevronLeft size={20} strokeWidth={2} /></button>
          <span className="text-[15px] font-semibold">Step 5 · ออกแบบวงเงินกู้</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-4 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Step 5 of 7</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">ออกแบบวงเงินกู้</h1>
          <p className="text-sm text-text-secondary mt-1">กู้ทำอะไร เท่าไหร่ มีทุนเท่าไหร่ หลักประกันอะไร</p>
        </div>

        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: s <= 5 ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        {/* Purpose selection */}
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary px-1 pb-2">วัตถุประสงค์การกู้</div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {PURPOSES.map(p => {
            const selected = purpose === p.id;
            return (
              <button key={p.id} onClick={() => { setPurpose(p.id); setSaved(false); }}
                className={`text-left p-4 rounded-2xl cursor-pointer transition-all border ${selected ? 'shadow-md scale-[1.01]' : 'bg-bg-card border-border hover:border-border-strong'}`}
                style={selected ? { borderColor: p.color, background: `color-mix(in srgb, ${p.color} 6%, var(--bg-card))` } : {}}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${p.color} 12%, transparent)` }}>
                    <p.Icon size={14} strokeWidth={1.5} color={p.color} />
                  </div>
                  <span className="text-sm font-semibold">{p.label}</span>
                </div>
                <div className="text-xs text-text-tertiary ml-9">{p.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Numbers */}
        <div className="space-y-3 mb-5">
          {[
            { label: 'มูลค่าโครงการ', desc: 'ต้องใช้เงินทั้งหมดเท่าไหร่', Icon: Landmark, color: '#3B82F6', value: projectValue, onChange: (v: string) => { setProjectValue(v); setSaved(false); } },
            { label: 'ทุนตัวเอง', desc: 'เงินที่มีอยู่แล้ว ไม่ต้องกู้', Icon: PiggyBank, color: '#22C55E', value: ownCapital, onChange: (v: string) => { setOwnCapital(v); setSaved(false); } },
            { label: 'มูลค่าหลักประกัน', desc: 'ที่ดิน อาคาร สินทรัพย์ค้ำ — ไม่มีใส่ 0', Icon: Shield, color: '#F59E0B', value: collateralValue, onChange: (v: string) => { setCollateralValue(v); setSaved(false); } },
          ].map((f, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: `color-mix(in srgb, ${f.color} 10%, transparent)` }}>
                <f.Icon size={18} strokeWidth={1.5} color={f.color} />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-0.5 block">{f.label} (บาท)</label>
                <p className="text-xs text-text-tertiary mb-2">{f.desc}</p>
                <NumberInput value={f.value} onChange={f.onChange} />
              </div>
            </div>
          ))}
        </div>

        {/* Live result */}
        {pv > 0 && (
          <div className="mb-5">
            {/* Verdict */}
            <div className={`rounded-2xl p-5 mb-3 ${verdictBg}`}>
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-1">ผลวิเคราะห์โครงสร้าง</div>
              <div className="text-lg font-bold" style={{ color: verdictColor }}>{verdict}</div>
            </div>

            {/* Visual breakdown — stacked bar */}
            <div className="bg-bg-card border border-border rounded-2xl p-4 mb-3">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-3">โครงสร้างเงินทุน</div>
              {/* Stacked bar: own vs loan */}
              <div className="h-8 rounded-lg overflow-hidden flex" style={{ background: 'var(--border)' }}>
                {ownPct > 0 && (
                  <div className="h-full flex items-center justify-center text-[10px] font-bold transition-all duration-500"
                    style={{ width: `${ownPct}%`, background: 'var(--status-good)', color: '#fff', minWidth: ownPct > 5 ? 'auto' : 0 }}>
                    {ownPct >= 10 && `ทุน ${ownPct.toFixed(0)}%`}
                  </div>
                )}
                <div className="h-full flex items-center justify-center text-[10px] font-bold flex-1 transition-all duration-500"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  กู้ {(100 - ownPct).toFixed(0)}%
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <div className="text-[10px] text-text-tertiary">ต้องกู้</div>
                  <div className="num text-sm font-bold">{money(loanNeeded)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-text-tertiary">ทุนตัวเอง</div>
                  <div className={`num text-sm font-bold ${ownPct >= 20 ? 'text-status-good' : 'text-status-bad'}`}>{ownPct.toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-text-tertiary">LTV</div>
                  <div className={`num text-sm font-bold ${ltv != null && ltv <= 80 ? 'text-status-good' : 'text-status-bad'}`}>
                    {ltv != null ? ltv.toFixed(0) + '%' : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-bg-card border border-border rounded-2xl p-4">
                <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-2">จุดที่ต้องแก้</div>
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-t border-border first:border-t-0">
                    <div className="w-4 h-4 rounded bg-wash-bad flex items-center justify-center shrink-0 mt-0.5">
                      <span className="num text-[9px] font-bold text-status-bad">{i + 1}</span>
                    </div>
                    <span className="text-xs text-text-primary">{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save + Next */}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || !purpose || pv === 0}
            className="flex-1 rounded-xl font-semibold cursor-pointer border-none text-sm disabled:opacity-40 transition-all gradient-accent"
            style={{ height: 48 }}>
            {saving ? 'กำลังบันทึก...' : !purpose ? 'เลือกวัตถุประสงค์ก่อน' : pv === 0 ? 'กรอกมูลค่าโครงการ' : saved ? 'บันทึกแล้ว' : 'บันทึก'}
          </button>
          {saved && (
            <button onClick={() => router.push('/ib/step/6-growth')}
              className="flex-1 rounded-xl border border-border bg-bg-card font-semibold cursor-pointer text-sm text-text-primary"
              style={{ height: 48 }}>
              ไป Step 6 →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
