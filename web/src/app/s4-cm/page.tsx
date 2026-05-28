'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';
import { SessionSave } from '@/components/ui/session-save';
import { SessionGuide } from '@/components/ui/session-guide';

const VC_LABELS = [
  'วัตถุดิบ/ต้นทุนสินค้า',
  'ค่าแรงทางตรง',
  'ค่าบรรจุภัณฑ์',
  'ค่าขนส่ง',
  'ค่าคอมมิชชั่น',
  'ต้นทุนผันแปรอื่น',
];

export default function S4CMPage() {
  const router = useRouter();

  const [price, setPrice] = useState('');
  const [vc, setVc] = useState<string[]>(Array(6).fill(''));
  const [fixedCost, setFixedCost] = useState('');
  const [financingCost, setFinancingCost] = useState('');

  const priceNum = unmaskCurrency(price);
  const vcNums = vc.map(unmaskCurrency);
  const totalVC = vcNums.reduce((a, b) => a + b, 0);
  const fixedNum = unmaskCurrency(fixedCost);
  const finNum = unmaskCurrency(financingCost);

  const cm = priceNum - totalVC;
  const cmRatio = priceNum > 0 ? cm / priceNum : 0;

  const operatingBEUnits = cm > 0 ? Math.ceil(fixedNum / cm) : 0;
  const operatingBEBaht = operatingBEUnits * priceNum;
  const cashBEUnits = cm > 0 ? Math.ceil((fixedNum + finNum) / cm) : 0;
  const cashBEBaht = cashBEUnits * priceNum;

  const hasInput = priceNum > 0;

  const setVcAt = (i: number, val: string) => {
    setVc((old) => old.map((v, idx) => idx === i ? maskCurrency(val) : v));
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S4 &middot; Contribution Margin</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Contribution Margin</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">วิเคราะห์กำไรส่วนเกินต่อหน่วย และจุดคุ้มทุน</p>

        <SessionGuide page="s4-cm" />

        {/* Per-product */}
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2">ราคาขายและต้นทุนผันแปร (ต่อหน่วย)</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">ราคาขายต่อหน่วย</label>
            <NumberInput value={price} onChange={setPrice} />
          </div>
          {VC_LABELS.map((label, i) => (
            <div key={label}>
              <label className="text-sm font-medium mb-1.5 block">{label}</label>
              <NumberInput value={vc[i]} onChange={(v) => setVcAt(i, v)} />
            </div>
          ))}
        </div>

        {/* CM Result */}
        {hasInput && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Contribution Margin</div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-3 ${cm >= 0 ? 'bg-wash-good' : 'bg-wash-bad'}`}>
                <div className="text-[11px] text-text-secondary">CM ต่อหน่วย</div>
                <div className="num text-lg font-semibold mt-0.5">{money(cm)} บาท</div>
              </div>
              <div className={`rounded-xl p-3 ${cmRatio >= 0.3 ? 'bg-wash-good' : cmRatio >= 0.15 ? 'bg-wash-warn' : 'bg-wash-bad'}`}>
                <div className="text-[11px] text-text-secondary">CM Ratio</div>
                <div className="num text-lg font-semibold mt-0.5">{(cmRatio * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-text-secondary">
              ราคาขาย {money(priceNum)} - ต้นทุนผันแปร {money(totalVC)} = CM {money(cm)} ({(cmRatio * 100).toFixed(1)}%)
            </div>
          </div>
        )}

        {/* Fixed cost + Break-even */}
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2">ต้นทุนคงที่ และจุดคุ้มทุน</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">ต้นทุนคงที่ต่อเดือน (Fixed Cost)</label>
            <NumberInput value={fixedCost} onChange={setFixedCost} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ค่าใช้จ่ายทางการเงิน/เดือน (ชำระหนี้+ดอกเบี้ย)</label>
            <NumberInput value={financingCost} onChange={setFinancingCost} />
          </div>

          {hasInput && cm > 0 && (fixedNum > 0 || finNum > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-wash-info rounded-xl p-4">
                <div className="text-xs text-text-secondary font-semibold">Operating Break-Even</div>
                <div className="num text-xl font-bold mt-1">{money(operatingBEUnits)} หน่วย</div>
                <div className="num text-sm text-text-secondary">{money(operatingBEBaht)} บาท</div>
                <div className="text-[10px] text-text-tertiary mt-1">Fixed Cost / CM = {money(fixedNum)} / {money(cm)}</div>
              </div>
              <div className="bg-wash-warn rounded-xl p-4">
                <div className="text-xs text-text-secondary font-semibold">Cash Break-Even</div>
                <div className="num text-xl font-bold mt-1">{money(cashBEUnits)} หน่วย</div>
                <div className="num text-sm text-text-secondary">{money(cashBEBaht)} บาท</div>
                <div className="text-[10px] text-text-tertiary mt-1">(Fixed + Financing) / CM = {money(fixedNum + finNum)} / {money(cm)}</div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6">
          <WinTip page="s4-cm" />
        <SessionSave sessionType="s4-cm" getData={() => ({ price: unmaskCurrency(price), materials: unmaskCurrency(vc[0]), variableLabor: unmaskCurrency(vc[1]), commission: unmaskCurrency(vc[2]), shipping: unmaskCurrency(vc[3]), platformFee: unmaskCurrency(vc[4]), fixedCost: unmaskCurrency(fixedCost), financingCost: unmaskCurrency(financingCost) })} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
