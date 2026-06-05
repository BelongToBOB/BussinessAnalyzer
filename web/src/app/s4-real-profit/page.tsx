'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';
import { SessionSave } from '@/components/ui/session-save';
import { SessionGuide } from '@/components/ui/session-guide';

export default function S4RealProfitPage() {
  const router = useRouter();

  // Step 1
  const [netProfit, setNetProfit] = useState('');
  const [depreciation, setDepreciation] = useState('');
  // Step 2
  const [deltaAR, setDeltaAR] = useState('');
  const [deltaInventory, setDeltaInventory] = useState('');
  const [deltaAP, setDeltaAP] = useState('');
  const [deltaTax, setDeltaTax] = useState('');
  // Step 3
  const [debtPrincipal, setDebtPrincipal] = useState('');
  const [ownerDraw, setOwnerDraw] = useState('');
  // Step 4
  const [reinvestment, setReinvestment] = useState('');

  const u = unmaskCurrency;

  const cashFromProfit = u(netProfit) + u(depreciation);
  const wcChange = u(deltaAR) + u(deltaInventory) - u(deltaAP) - u(deltaTax);
  const afterWC = cashFromProfit - wcChange;
  const payments = u(debtPrincipal) + u(ownerDraw);
  const afterPayments = afterWC - payments;
  const realProfit = afterPayments - u(reinvestment);

  const hasInput = u(netProfit) > 0 || u(depreciation) > 0;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S4 &middot; Real Profit</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">กำไรจริง (Real Profit)</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">4 ขั้นตอน เปลี่ยนกำไรทางบัญชี เป็นเงินสดจริง</p>

        <SessionGuide page="s4-real-profit" />

        {/* Step 1 */}
        <StepHeader num={1} title="เงินสดตั้งต้นจากกำไร" />
        <div className="text-xs text-text-secondary bg-wash-info rounded-xl px-3 py-2 mb-2">ค่าเสื่อมคือรายจ่ายในงบ แต่ไม่ได้จ่ายเงินสดจริง &#8594; บวกกลับเข้ามา</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-2 space-y-3">
          <Field label="กำไรสุทธิ (Net Profit)" value={netProfit} onChange={setNetProfit} />
          <Field label="+ ค่าเสื่อมราคา (Depreciation)" value={depreciation} onChange={setDepreciation} />
        </div>
        {hasInput && <RunningTotal label="เงินสดจากกำไร" value={cashFromProfit} />}

        {/* Step 2 */}
        <StepHeader num={2} title="ลบ: เงินที่ยังไม่กลับมาเป็นเงินสด" />
        <div className="text-xs text-text-secondary bg-wash-info rounded-xl px-3 py-2 mb-2">ใช้ &lsquo;ปลายงวด &#8722; ต้นงวด&rsquo; ของงวดที่วิเคราะห์เท่านั้น ห้ามนำยอดสะสมทั้งปีมาใส่ทุกเดือน</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-2 space-y-3">
          <Field label="ลูกหนี้เพิ่มขึ้น (Delta AR)" value={deltaAR} onChange={setDeltaAR} />
          <Field label="สินค้าคงเหลือเพิ่มขึ้น (Delta Inventory)" value={deltaInventory} onChange={setDeltaInventory} />
          <Field label="เจ้าหนี้เพิ่มขึ้น (Delta AP) — ลดภาระ" value={deltaAP} onChange={setDeltaAP} />
          <Field label="ภาษีค้างจ่ายเพิ่มขึ้น (Delta Tax) — ลดภาระ" value={deltaTax} onChange={setDeltaTax} />
        </div>
        {hasInput && <RunningTotal label="หลังหัก Working Capital" value={afterWC} />}

        {/* Step 3 */}
        <StepHeader num={3} title="ลบ: เงินสดที่ต้องจ่ายจริง" />
        <div className="text-xs text-text-secondary bg-wash-info rounded-xl px-3 py-2 mb-2">เริ่มจากกำไรสุทธิ (หลังหักดอกเบี้ย+ภาษีแล้ว) — ห้ามหักดอกเบี้ยหรือภาษีซ้ำอีก ใส่แค่เงินต้นหนี้ที่จ่ายจริง</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-2 space-y-3">
          <Field label="ชำระเงินต้น (Debt Principal)" value={debtPrincipal} onChange={setDebtPrincipal} />
          <Field label="เจ้าของถอนใช้ส่วนตัว (Owner Draw)" value={ownerDraw} onChange={setOwnerDraw} />
        </div>
        {hasInput && <RunningTotal label="หลังชำระหนี้+ถอนเงิน" value={afterPayments} />}

        {/* Step 4 */}
        <StepHeader num={4} title="ลบ: เงินที่ต้องเก็บไว้ใช้ต่อ" />
        <div className="text-xs text-text-secondary bg-wash-info rounded-xl px-3 py-2 mb-2">เช่น ซื้อเครื่องจักรเพิ่ม ซ่อมของสำคัญ เติมทุนหมุนเวียนที่จำเป็น</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-2 space-y-3">
          <Field label="ลงทุนเพิ่ม (Reinvestment / CAPEX)" value={reinvestment} onChange={setReinvestment} />
        </div>

        {/* Final Verdict */}
        {hasInput && (
          <div className={`rounded-2xl p-4 mt-4 ${realProfit >= 0 ? 'bg-wash-good' : 'bg-wash-bad'}`}>
            <div className="text-sm text-text-secondary">กำไรจริง (Real Profit)</div>
            <div className={`num text-3xl font-bold mt-1 ${realProfit >= 0 ? 'text-status-good' : 'text-status-bad'}`}>{money(realProfit)} บาท</div>
            <div className="text-sm mt-2 font-medium">
              {realProfit >= 0
                ? '\u2705 ธุรกิจมีกำไรจริงเป็นบวก — เงินเหลือจริงหลังจ่ายทุกอย่าง'
                : '\uD83D\uDD34 กำไรจริงติดลบ — แม้งบบอกว่ากำไร แต่เงินสดไม่เหลือ'}
            </div>
          </div>
        )}

        {/* Checklist if negative */}
        {hasInput && realProfit < 0 && (
          <div className="bg-wash-warn rounded-2xl p-4 mt-4">
            <div className="text-sm font-semibold mb-3">ถ้าติดลบ ให้ดู 3 จุดนี้ก่อน:</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span>&#9744;</span><span>เก็บลูกหนี้ช้าเกินไป</span></div>
              <div className="flex items-center gap-2"><span>&#9744;</span><span>สต็อกมากเกินไป</span></div>
              <div className="flex items-center gap-2"><span>&#9744;</span><span>กำไรบาง / ภาระหนี้สูง / ต้องใช้เงินหมุนมาก</span></div>
            </div>
          </div>
        )}

        {/* Formula Summary */}
        {hasInput && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mt-4">
            <div className="text-sm font-semibold mb-2">สูตรสรุป:</div>
            <div className="text-xs text-text-secondary leading-relaxed font-mono whitespace-pre-line">{`เงินสดที่เหลือจริง = กำไรสุทธิ + ค่าเสื่อม
  \u2212 เงินที่ยังไม่เป็นเงินสดสุทธิ (\u0394ลูกหนี้ + \u0394สต็อก \u2212 \u0394เจ้าหนี้ \u2212 \u0394VAT)
  \u2212 เงินต้นหนี้ที่จ่ายจริง \u2212 เงินเจ้าของถอนใช้
  \u2212 เงินลงทุน/เงินหมุนต่อที่จำเป็น`}</div>
          </div>
        )}

        <div className="mt-6">
          <WinTip page="s4-real-profit" />
        <SessionSave sessionType="s4-real-profit" getData={() => ({ netProfit: unmaskCurrency(netProfit), depreciation: unmaskCurrency(depreciation), deltaAR: unmaskCurrency(deltaAR), deltaInventory: unmaskCurrency(deltaInventory), deltaAP: unmaskCurrency(deltaAP), deltaTax: unmaskCurrency(deltaTax), debtPrincipal: unmaskCurrency(debtPrincipal), ownerDraw: unmaskCurrency(ownerDraw), reinvestment: unmaskCurrency(reinvestment) })} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <NumberInput value={value} onChange={onChange} />
    </div>
  );
}

function StepHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-2">
      <div className="w-7 h-7 rounded-full bg-text-primary text-bg-primary flex items-center justify-center text-xs font-bold shrink-0">{num}</div>
      <div className="text-sm font-semibold">{title}</div>
    </div>
  );
}

function RunningTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className={`flex justify-between items-center px-4 py-3 rounded-xl mb-4 ${value >= 0 ? 'bg-wash-good' : 'bg-wash-bad'}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className={`num text-lg font-bold ${value >= 0 ? 'text-status-good' : 'text-status-bad'}`}>{money(value)}</span>
    </div>
  );
}
