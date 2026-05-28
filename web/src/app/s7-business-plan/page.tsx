'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { getSession, saveSession } from '@/lib/api';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';

const READINESS_ITEMS = [
  'มีงบการเงินย้อนหลัง 3 ปี',
  'มี Statement ธนาคาร 6 เดือน',
  'มีหลักประกัน/ผู้ค้ำ',
  'มีแผนธุรกิจพร้อมนำเสนอ',
];

const DONT_DO_TABLE = [
  { dont: '"ผมอยากได้เงิน 5 ล้าน"', doSay: '"ธุรกิจต้องการเงินทุนหมุนเวียนเพิ่ม 5 ล้าน เพื่อรองรับออเดอร์ที่เพิ่มขึ้น 30%"' },
  { dont: '"ผมจะคืนแน่ๆ"', doSay: '"Cash Flow เฉลี่ย 500K/เดือน หักค่าใช้จ่ายเหลือ 150K พอชำระงวดละ 100K ได้สบาย"' },
  { dont: '"ธุรกิจผมดีมาก"', doSay: '"Revenue เติบโต YoY 25% Gross Margin 45% Net Margin 12%"' },
  { dont: '"ผมทำมานานแล้ว"', doSay: '"ดำเนินธุรกิจมา 8 ปี ฐานลูกค้าประจำ 200+ ราย Retention Rate 85%"' },
  { dont: '"ไม่มีความเสี่ยงหรอก"', doSay: '"ความเสี่ยงหลักคือ X มีแผนรับมือคือ Y และมีแผนสำรองคือ Z"' },
];

export default function S7BusinessPlanPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Business info
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('');
  const [bizAge, setBizAge] = useState('');
  const [bizProduct, setBizProduct] = useState('');
  const [bizCustomer, setBizCustomer] = useState('');
  const [bizStrength, setBizStrength] = useState('');

  // Section 1: Purpose
  const [purpose, setPurpose] = useState('');

  // Section 2: Repayment
  const [cashFlow, setCashFlow] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [repaymentNote, setRepaymentNote] = useState('');

  // Section 3: Risk
  const [risk1, setRisk1] = useState('');
  const [risk2, setRisk2] = useState('');
  const [risk3, setRisk3] = useState('');

  // Section 4: Control
  const [control, setControl] = useState('');

  // Readiness
  const [readiness, setReadiness] = useState<boolean[]>(Array(READINESS_ITEMS.length).fill(false));

  useEffect(() => {
    async function load() {
      try {
        const data = await getSession('s7-business-plan') as any;
        if (data) {
          if (data.bizName) setBizName(data.bizName);
          if (data.bizType) setBizType(data.bizType);
          if (data.bizAge) setBizAge(data.bizAge);
          if (data.bizProduct) setBizProduct(data.bizProduct);
          if (data.bizCustomer) setBizCustomer(data.bizCustomer);
          if (data.bizStrength) setBizStrength(data.bizStrength);
          if (data.purpose) setPurpose(data.purpose);
          if (data.cashFlow) setCashFlow(maskCurrency(String(data.cashFlow)));
          if (data.monthlyPayment) setMonthlyPayment(maskCurrency(String(data.monthlyPayment)));
          if (data.repaymentNote) setRepaymentNote(data.repaymentNote);
          if (data.risk1) setRisk1(data.risk1);
          if (data.risk2) setRisk2(data.risk2);
          if (data.risk3) setRisk3(data.risk3);
          if (data.control) setControl(data.control);
          if (data.readiness) setReadiness(data.readiness);
        }
      } catch { /* new session */ }
    }
    load();
  }, []);

  const cfNum = unmaskCurrency(cashFlow);
  const pmtNum = unmaskCurrency(monthlyPayment);
  const ratio = pmtNum > 0 ? cfNum / pmtNum : 0;

  const toggleReadiness = (i: number) => {
    setReadiness((old) => old.map((v, idx) => idx === i ? !v : v));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession('s7-business-plan', {
        bizName, bizType, bizAge, bizProduct, bizCustomer, bizStrength,
        purpose,
        cashFlow: unmaskCurrency(cashFlow), monthlyPayment: unmaskCurrency(monthlyPayment), repaymentNote,
        risk1, risk2, risk3,
        control,
        readiness,
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
          <span className="text-[15px] font-semibold">S7 &middot; แผน 1 หน้า</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">แผนธุรกิจ 1 หน้า</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">สรุปแผนธุรกิจในรูปแบบที่ธนาคารต้องการ</p>

        {/* Business Info */}
        <SectionTitle text="ข้อมูลธุรกิจ" />
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
          <TextFieldRow label="ชื่อธุรกิจ" value={bizName} onChange={setBizName} />
          <TextFieldRow label="ประเภทธุรกิจ" value={bizType} onChange={setBizType} />
          <TextFieldRow label="อายุธุรกิจ (ปี)" value={bizAge} onChange={setBizAge} />
          <TextFieldRow label="สินค้า/บริการหลัก" value={bizProduct} onChange={setBizProduct} />
          <TextFieldRow label="กลุ่มลูกค้าเป้าหมาย" value={bizCustomer} onChange={setBizCustomer} />
          <TextFieldRow label="จุดแข็ง/ความต่าง" value={bizStrength} onChange={setBizStrength} />
        </div>

        {/* 1. Purpose */}
        <SectionTitle text="\u2460 วัตถุประสงค์ — ขอกู้เพื่ออะไร?" />
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={3}
            placeholder="เช่น ขอสินเชื่อเพื่อเพิ่มทุนหมุนเวียนรองรับการเติบโต 30% ใน Q3-Q4..."
            className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm outline-none focus:border-accent font-thai resize-none"
          />
        </div>

        {/* 2. Repayment */}
        <SectionTitle text="\u2461 ความสามารถในการชำระ" />
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">กระแสเงินสดสุทธิ/เดือน</label>
            <NumberInput value={cashFlow} onChange={setCashFlow} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">งวดชำระ/เดือน (ที่จะขอ)</label>
            <NumberInput value={monthlyPayment} onChange={setMonthlyPayment} />
          </div>
          {cfNum > 0 && pmtNum > 0 && (
            <div className={`rounded-xl p-3 ${ratio >= 1.5 ? 'bg-wash-good' : ratio >= 1 ? 'bg-wash-warn' : 'bg-wash-bad'}`}>
              <div className="text-xs text-text-secondary">DSCR (Debt Service Coverage Ratio)</div>
              <div className="num text-xl font-bold mt-0.5">{ratio.toFixed(2)}x</div>
              <div className="text-xs text-text-secondary mt-1">
                {ratio >= 1.5 ? '\u2705 ดีมาก (>= 1.5x)' : ratio >= 1 ? '\u26A0\uFE0F พอได้ แต่แน่น' : '\uD83D\uDD34 ไม่ผ่าน (< 1x)'}
              </div>
            </div>
          )}
          <textarea
            value={repaymentNote}
            onChange={(e) => setRepaymentNote(e.target.value)}
            rows={2}
            placeholder="อธิบายเพิ่มเติม..."
            className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm outline-none focus:border-accent font-thai resize-none"
          />
        </div>

        {/* 3. Risk */}
        <SectionTitle text="\u2462 ความเสี่ยง และแผนรับมือ" />
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
          {[
            { label: 'ความเสี่ยงที่ 1', value: risk1, set: setRisk1 },
            { label: 'ความเสี่ยงที่ 2', value: risk2, set: setRisk2 },
            { label: 'ความเสี่ยงที่ 3', value: risk3, set: setRisk3 },
          ].map((r) => (
            <div key={r.label}>
              <label className="text-sm font-medium mb-1.5 block">{r.label} + แผนรับมือ</label>
              <textarea
                value={r.value}
                onChange={(e) => r.set(e.target.value)}
                rows={2}
                placeholder="ความเสี่ยง: ... / แผนรับมือ: ..."
                className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm outline-none focus:border-accent font-thai resize-none"
              />
            </div>
          ))}
        </div>

        {/* 4. Control */}
        <SectionTitle text="\u2463 ระบบควบคุม" />
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
          <textarea
            value={control}
            onChange={(e) => setControl(e.target.value)}
            rows={3}
            placeholder="เช่น ทำบัญชีรายวัน ตรวจ Cash Flow ทุกสัปดาห์ แยกบัญชีธุรกิจ/ส่วนตัว..."
            className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm outline-none focus:border-accent font-thai resize-none"
          />
        </div>

        {/* Readiness Checklist */}
        <SectionTitle text="ความพร้อม" />
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-6">
          {READINESS_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
              <button
                onClick={() => toggleReadiness(i)}
                className="w-6 h-6 rounded-md border-none cursor-pointer p-0 shrink-0 flex items-center justify-center"
                style={{
                  background: readiness[i] ? 'var(--status-good)' : 'transparent',
                  border: readiness[i] ? 'none' : '1.5px solid var(--text-tertiary)',
                }}
              >
                {readiness[i] && <span className="text-white text-xs font-bold">{'\u2713'}</span>}
              </button>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>

        {/* Language table */}
        <SectionTitle text="ภาษาที่ใช้ตอนคุยกับธนาคาร" />
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className="grid grid-cols-2 gap-0">
            <div className="px-4 py-2.5 bg-wash-bad text-xs font-semibold uppercase tracking-wide text-status-bad border-b border-border">
              อย่าพูด
            </div>
            <div className="px-4 py-2.5 bg-wash-good text-xs font-semibold uppercase tracking-wide text-status-good border-b border-border">
              ให้พูด
            </div>
            {DONT_DO_TABLE.map((row, i) => (
              <div key={i} className="contents">
                <div className="px-4 py-3 text-sm text-text-secondary border-b border-border">{row.dont}</div>
                <div className="px-4 py-3 text-sm border-b border-border font-medium">{row.doSay}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        <div className="mt-6">
          <WinTip page="s7-business-plan" />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2 mt-4">{text}</div>;
}

function TextFieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl border border-border bg-bg-card px-4 text-sm outline-none focus:border-accent font-thai"
      />
    </div>
  );
}
