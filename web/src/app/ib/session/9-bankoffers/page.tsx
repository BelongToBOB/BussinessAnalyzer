'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/lib/use-assessment';
import { NumberInput } from '@/components/ui/number-input';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ChevronLeft, Star } from 'lucide-react';

interface Offer {
  slot: string; bankName: string; productType: string;
  amount: string; interestRate: string; tenureMonths: string;
  collateral: string; covenants: string; fee: string;
  scoreCost: number; scoreFlexibility: number; scoreSpeed: number; scoreRelationship: number;
}

const emptyOffer = (slot: string): Offer => ({
  slot, bankName: '', productType: 'term_loan',
  amount: '', interestRate: '', tenureMonths: '',
  collateral: '', covenants: '', fee: '',
  scoreCost: 50, scoreFlexibility: 50, scoreSpeed: 50, scoreRelationship: 50,
});

const PRODUCT_TYPES = [
  { id: 'term_loan', label: 'สินเชื่อระยะยาว' },
  { id: 'od', label: 'OD (วงเงินเบิกเกินบัญชี)' },
  { id: 'wc_loan', label: 'สินเชื่อหมุนเวียน' },
  { id: 'leasing', label: 'ลีสซิ่ง' },
  { id: 'factoring', label: 'แฟคตอริ่ง' },
  { id: 'other', label: 'อื่นๆ' },
];

const SLOT_COLORS: Record<string, string> = { A: '#3B82F6', B: '#22C55E', C: '#8B5CF6' };

export default function Session9BankOffersPage() {
  const router = useRouter();
  const { loading } = useAssessment();
  const [offers, setOffers] = useState<Offer[]>([emptyOffer('A'), emptyOffer('B'), emptyOffer('C')]);
  const [activeOffer, setActiveOffer] = useState(0);

  const u = unmaskCurrency;

  const updateOffer = (key: string, val: any) => {
    setOffers(prev => prev.map((o, i) => i === activeOffer ? { ...o, [key]: val } : o));
  };

  // Calculate total score per offer (weighted: Cost 30%, Flexibility 25%, Speed 20%, Relationship 25%)
  const calcScore = (o: Offer) => Math.round(o.scoreCost * 0.30 + o.scoreFlexibility * 0.25 + o.scoreSpeed * 0.20 + o.scoreRelationship * 0.25);
  const scores = offers.map(calcScore);
  const bestIdx = scores.indexOf(Math.max(...scores));
  const hasData = offers.some(o => u(o.amount) > 0);

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const offer = offers[activeOffer];

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border print:hidden">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary"><ChevronLeft size={20} /></button>
          <span className="text-[15px] font-semibold">S09 · Bank Offers</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-6">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 9</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Bank Offer Matrix</h1>
          <p className="text-sm text-text-secondary mt-1">เปรียบเทียบข้อเสนอจริงจากธนาคาร — ให้คะแนน 4 มิติ</p>
        </div>

        {/* Offer tabs */}
        <div className="flex gap-2 mb-4">
          {offers.map((o, i) => (
            <button key={o.slot} onClick={() => setActiveOffer(i)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 cursor-pointer transition-all ${
                i === activeOffer ? 'text-white border-transparent' : 'bg-transparent border-border text-text-secondary'
              }`}
              style={i === activeOffer ? { background: SLOT_COLORS[o.slot], borderColor: SLOT_COLORS[o.slot] } : {}}>
              ดีล {o.slot} {i === bestIdx && hasData && '⭐'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input */}
          <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="text-sm font-semibold" style={{ color: SLOT_COLORS[offer.slot] }}>ข้อเสนอดีล {offer.slot}</div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">ชื่อธนาคาร</label>
              <input value={offer.bankName} onChange={(e) => updateOffer('bankName', e.target.value)} placeholder="เช่น กสิกร, SCB"
                className="w-full h-9 rounded-xl border border-border px-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">ประเภทสินเชื่อ</label>
              <select value={offer.productType} onChange={(e) => updateOffer('productType', e.target.value)}
                className="w-full h-9 rounded-xl border border-border px-3 text-sm bg-bg-card text-text-primary outline-none">
                {PRODUCT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">วงเงิน</label>
              <NumberInput value={offer.amount} onChange={(v) => updateOffer('amount', maskCurrency(v))} compact suffix="฿" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">ดอกเบี้ย %/ปี</label>
                <input value={offer.interestRate} onChange={(e) => updateOffer('interestRate', e.target.value)} placeholder="6.5"
                  className="w-full h-9 rounded-xl border border-border px-3 text-sm num bg-bg-card text-text-primary outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">ระยะเวลา (เดือน)</label>
                <input value={offer.tenureMonths} onChange={(e) => updateOffer('tenureMonths', e.target.value)} placeholder="84"
                  className="w-full h-9 rounded-xl border border-border px-3 text-sm num bg-bg-card text-text-primary outline-none focus:border-accent" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">หลักทรัพย์ค้ำประกัน</label>
              <input value={offer.collateral} onChange={(e) => updateOffer('collateral', e.target.value)} placeholder="โฉนดที่ดิน, เครื่องจักร"
                className="w-full h-9 rounded-xl border border-border px-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">ค่าธรรมเนียม</label>
              <NumberInput value={offer.fee} onChange={(v) => updateOffer('fee', maskCurrency(v))} compact suffix="฿" />
            </div>

            {/* Scoring sliders */}
            <div className="border-t border-border pt-3 mt-3">
              <div className="text-xs font-semibold mb-3">ให้คะแนน 4 มิติ (0-100)</div>
              {[
                { key: 'scoreCost', label: 'ต้นทุน (ดอกเบี้ย+ค่าธรรมเนียม)', weight: '30%' },
                { key: 'scoreFlexibility', label: 'ความยืดหยุ่น (เงื่อนไข/covenant)', weight: '25%' },
                { key: 'scoreSpeed', label: 'ความเร็ว (อนุมัติ+เบิกเงิน)', weight: '20%' },
                { key: 'scoreRelationship', label: 'ความสัมพันธ์ (RM/สาขา)', weight: '25%' },
              ].map(s => (
                <div key={s.key} className="mb-2">
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-text-secondary">{s.label} ({s.weight})</span>
                    <span className="num font-bold">{(offer as any)[s.key]}</span>
                  </div>
                  <input type="range" min={0} max={100} value={(offer as any)[s.key]}
                    onChange={(e) => updateOffer(s.key, Number(e.target.value))}
                    className="w-full accent-accent" />
                </div>
              ))}
            </div>
          </div>

          {/* Comparison */}
          {hasData && (
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              <div className="text-sm font-semibold mb-4">เปรียบเทียบ 3 ข้อเสนอ</div>
              <div className="space-y-3">
                {offers.map((o, i) => {
                  const score = scores[i];
                  const isBest = i === bestIdx && u(o.amount) > 0;
                  return (
                    <div key={o.slot} className={`p-4 rounded-xl border-2 ${isBest ? 'border-accent bg-accent/5' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold" style={{ color: SLOT_COLORS[o.slot] }}>
                          ดีล {o.slot} {o.bankName && `— ${o.bankName}`}
                        </span>
                        <div className="flex items-center gap-1">
                          {isBest && <Star size={14} className="text-accent" />}
                          <span className="num text-lg font-bold">{score}</span>
                          <span className="text-[10px] text-text-tertiary">/100</span>
                        </div>
                      </div>
                      {u(o.amount) > 0 && (
                        <div className="text-xs text-text-secondary">
                          {money(u(o.amount))} · {o.interestRate}% · {o.tenureMonths} เดือน
                        </div>
                      )}
                      {/* Score bars */}
                      <div className="grid grid-cols-4 gap-1 mt-2">
                        {['scoreCost','scoreFlexibility','scoreSpeed','scoreRelationship'].map(k => (
                          <div key={k} className="h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${(o as any)[k]}%` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
