'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';
import { SessionSave } from '@/components/ui/session-save';
import { SessionGuide } from '@/components/ui/session-guide';

export default function S4PricingPage() {
  const router = useRouter();

  // Section A: Price Calculator
  const [costPerUnit, setCostPerUnit] = useState('');
  const [opexPct, setOpexPct] = useState('');
  const [profitPct, setProfitPct] = useState('');

  // Section B: Markup vs Margin
  const [costB, setCostB] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  const cost = unmaskCurrency(costPerUnit);
  const opex = Number(opexPct) || 0;
  const profit = Number(profitPct) || 0;

  const totalPct = opex + profit;
  const computedPrice = totalPct < 100 && cost > 0 ? cost / (1 - totalPct / 100) : 0;

  const costBNum = unmaskCurrency(costB);
  const sellNum = unmaskCurrency(sellingPrice);
  const markupPct = costBNum > 0 && sellNum > 0 ? ((sellNum - costBNum) / costBNum) * 100 : 0;
  const marginPct = sellNum > 0 ? ((sellNum - costBNum) / sellNum) * 100 : 0;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S4 &middot; ตั้งราคา</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">ตั้งราคาสินค้า</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">คำนวณราคาขายจากต้นทุน และเปรียบเทียบ Markup vs Margin</p>

        <SessionGuide page="s4-pricing" />

        {/* Section A */}
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2">A. คำนวณราคาขาย</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">ต้นทุนต่อหน่วย</label>
            <NumberInput value={costPerUnit} onChange={setCostPerUnit} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ค่าใช้จ่ายดำเนินงาน (%)</label>
            <div className="relative">
              <input
                inputMode="decimal"
                value={opexPct}
                onChange={(e) => setOpexPct(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="0"
                className="w-full h-[52px] rounded-xl px-4 pr-12 num text-xl font-medium tracking-tight outline-none border border-border bg-bg-card text-text-primary focus:border-accent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-medium">%</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">กำไรที่ต้องการ (%)</label>
            <div className="relative">
              <input
                inputMode="decimal"
                value={profitPct}
                onChange={(e) => setProfitPct(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="0"
                className="w-full h-[52px] rounded-xl px-4 pr-12 num text-xl font-medium tracking-tight outline-none border border-border bg-bg-card text-text-primary focus:border-accent"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-medium">%</span>
            </div>
          </div>

          {cost > 0 && computedPrice > 0 && (
            <div className="bg-wash-good rounded-xl p-4 mt-2">
              <div className="text-sm text-text-secondary">ราคาขายที่ควรตั้ง</div>
              <div className="num text-2xl font-bold text-status-good mt-1">{money(computedPrice)} บาท</div>
              <div className="text-xs text-text-secondary mt-1">
                สูตร: ต้นทุน / (1 - (ค่าใช้จ่าย% + กำไร%)) = {money(cost)} / (1 - {totalPct}%) = {money(computedPrice)}
              </div>
            </div>
          )}
        </div>

        {/* Section B */}
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2">B. เปรียบเทียบ Markup vs Margin</div>
        <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">ต้นทุนต่อหน่วย</label>
            <NumberInput value={costB} onChange={setCostB} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ราคาขาย</label>
            <NumberInput value={sellingPrice} onChange={setSellingPrice} />
          </div>

          {costBNum > 0 && sellNum > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-wash-info rounded-xl p-4">
                <div className="text-xs text-text-secondary">Markup %</div>
                <div className="num text-2xl font-bold mt-1">{markupPct.toFixed(1)}%</div>
                <div className="text-[10px] text-text-tertiary mt-1">({'\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22'} - {'\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19'}) / {'\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19'}</div>
              </div>
              <div className="bg-wash-good rounded-xl p-4">
                <div className="text-xs text-text-secondary">Margin %</div>
                <div className="num text-2xl font-bold mt-1">{marginPct.toFixed(1)}%</div>
                <div className="text-[10px] text-text-tertiary mt-1">({'\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22'} - {'\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19'}) / {'\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22'}</div>
              </div>
            </div>
          )}

          {costBNum > 0 && sellNum > 0 && (
            <div className="bg-bg-secondary rounded-xl p-4 mt-2 text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">ข้อแตกต่าง:</strong> Markup คิดจากต้นทุน ส่วน Margin คิดจากราคาขาย — Markup จะดูสูงกว่าเสมอ เช่น Markup 100% = Margin 50%
              ธนาคารและนักลงทุนดู Margin เป็นหลัก เพราะบอก{'\u0022'}ส่วนแบ่งที่เหลือจากยอดขาย{'\u0022'}ได้ชัดกว่า
            </div>
          )}
        </div>
        <div className="mt-6">
          <WinTip page="s4-pricing" />
        <SessionSave sessionType="s4-pricing" getData={() => ({ costPerUnit: unmaskCurrency(costPerUnit), opexPct: Number(opexPct)/100 || 0, profitPct: Number(profitPct)/100 || 0, costPerUnit2: unmaskCurrency(costB), sellingPrice: unmaskCurrency(sellingPrice) })} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
