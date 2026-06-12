'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/lib/use-assessment';
import { NumberInput } from '@/components/ui/number-input';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

type Signal = 'green' | 'yellow' | 'red';

const RISK_SIGNALS = [
  { key: 'cashflow', label: 'กระแสเงินสด (Cash Flow)' },
  { key: 'dscr', label: 'ความสามารถจ่ายหนี้ (DSCR)' },
  { key: 'debtStructure', label: 'โครงสร้างหนี้ (D/E)' },
  { key: 'documents', label: 'เอกสารพร้อม' },
  { key: 'ownerMindset', label: 'Mindset เจ้าของ' },
];

const signalColor = (s: Signal) => s === 'green' ? 'bg-status-good' : s === 'yellow' ? 'bg-status-warn' : 'bg-status-bad';
const signalLabel = (s: Signal) => s === 'green' ? 'ดี' : s === 'yellow' ? 'ระวัง' : 'ต้องแก้';

export default function Session10ApprovedPage() {
  const router = useRouter();
  const { loading } = useAssessment();

  const [bankName, setBankName] = useState('');
  const [productType, setProductType] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [dscrAfter, setDscrAfter] = useState('');

  const [signals, setSignals] = useState<Record<string, Signal>>({
    cashflow: 'green', dscr: 'green', debtStructure: 'yellow', documents: 'green', ownerMindset: 'green',
  });

  const [ownerActions, setOwnerActions] = useState('');
  const [bankActions, setBankActions] = useState('');

  const toggleSignal = (key: string) => {
    setSignals(prev => {
      const order: Signal[] = ['green', 'yellow', 'red'];
      const current = prev[key] ?? 'green';
      const next = order[(order.indexOf(current) + 1) % 3];
      return { ...prev, [key]: next };
    });
  };

  const greenCount = Object.values(signals).filter(s => s === 'green').length;
  const u = unmaskCurrency;

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border print:hidden">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary"><ChevronLeft size={20} /></button>
          <span className="text-[15px] font-semibold">S10 · Formula Approved</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-6">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 10</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Formula Approved</h1>
          <p className="text-sm text-text-secondary mt-1">บันทึกผลอนุมัติสินเชื่อ + ตั้งสัญญาณเตือน + Next Steps</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Approved Loan Details */}
          <div className="space-y-4">
            <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold">ผลอนุมัติสินเชื่อ</div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">ธนาคารที่อนุมัติ</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="เช่น กสิกรไทย"
                  className="w-full h-9 rounded-xl border border-border px-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">ประเภทสินเชื่อ</label>
                <input value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="Term Loan / OD / WC"
                  className="w-full h-9 rounded-xl border border-border px-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">วงเงินอนุมัติ</label>
                <NumberInput value={approvedAmount} onChange={setApprovedAmount} compact suffix="฿" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">ดอกเบี้ย %/ปี</label>
                  <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="6.5"
                    className="w-full h-9 rounded-xl border border-border px-3 text-sm num bg-bg-card text-text-primary outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">ระยะเวลา (เดือน)</label>
                  <input value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} placeholder="84"
                    className="w-full h-9 rounded-xl border border-border px-3 text-sm num bg-bg-card text-text-primary outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">ค่างวด/เดือน</label>
                <NumberInput value={monthlyInstallment} onChange={setMonthlyInstallment} compact suffix="฿/เดือน" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">DSCR หลังกู้</label>
                <input value={dscrAfter} onChange={(e) => setDscrAfter(e.target.value)} placeholder="1.25"
                  className="w-full h-9 rounded-xl border border-border px-3 text-sm num bg-bg-card text-text-primary outline-none focus:border-accent" />
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold">Next Steps</div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">สิ่งที่เจ้าของต้องทำ</label>
                <textarea value={ownerActions} onChange={(e) => setOwnerActions(e.target.value)} rows={3}
                  placeholder="เช่น เตรียมเอกสารเพิ่ม, ปรับงบ, ..."
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">สิ่งที่ธนาคารต้องทำ</label>
                <textarea value={bankActions} onChange={(e) => setBankActions(e.target.value)} rows={3}
                  placeholder="เช่น ประเมินหลักทรัพย์, อนุมัติสัญญา, ..."
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
              </div>
            </div>
          </div>

          {/* Risk Signals */}
          <div className="space-y-4">
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              <div className="text-sm font-semibold mb-4">5 สัญญาณเตือน (กดเพื่อเปลี่ยนสี)</div>
              <div className="space-y-2">
                {RISK_SIGNALS.map(s => (
                  <button key={s.key} onClick={() => toggleSignal(s.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer bg-transparent hover:bg-bg-secondary transition-colors text-left">
                    <div className={`w-5 h-5 rounded-full shrink-0 ${signalColor(signals[s.key])}`} />
                    <span className="text-sm flex-1">{s.label}</span>
                    <span className={`text-[11px] font-semibold ${signals[s.key] === 'green' ? 'text-status-good' : signals[s.key] === 'yellow' ? 'text-status-warn' : 'text-status-bad'}`}>
                      {signalLabel(signals[s.key])}
                    </span>
                  </button>
                ))}
              </div>
              <div className={`mt-4 p-3 rounded-xl text-center text-sm font-semibold ${
                greenCount === 5 ? 'bg-wash-good text-status-good' : greenCount >= 3 ? 'bg-wash-warn text-status-warn' : 'bg-wash-bad text-status-bad'
              }`}>
                {greenCount}/5 สัญญาณเขียว — {greenCount === 5 ? 'พร้อมเบิกเงิน' : greenCount >= 3 ? 'เกือบพร้อม' : 'ต้องแก้ก่อน'}
              </div>
            </div>

            {/* Summary */}
            {u(approvedAmount) > 0 && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={20} className="text-accent" />
                  <div className="text-sm font-bold text-accent">สรุปผลอนุมัติ</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-bg-primary rounded-xl p-2.5">
                    <div className="text-[10px] text-text-tertiary">วงเงิน</div>
                    <div className="num text-sm font-bold">{money(u(approvedAmount))}</div>
                  </div>
                  <div className="bg-bg-primary rounded-xl p-2.5">
                    <div className="text-[10px] text-text-tertiary">ดอกเบี้ย</div>
                    <div className="num text-sm font-bold">{interestRate || '—'}%</div>
                  </div>
                  <div className="bg-bg-primary rounded-xl p-2.5">
                    <div className="text-[10px] text-text-tertiary">ค่างวด/เดือน</div>
                    <div className="num text-sm font-bold">{money(u(monthlyInstallment))}</div>
                  </div>
                  <div className="bg-bg-primary rounded-xl p-2.5">
                    <div className="text-[10px] text-text-tertiary">DSCR หลังกู้</div>
                    <div className={`num text-sm font-bold ${Number(dscrAfter) >= 1.25 ? 'text-status-good' : 'text-status-bad'}`}>{dscrAfter || '—'}x</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
