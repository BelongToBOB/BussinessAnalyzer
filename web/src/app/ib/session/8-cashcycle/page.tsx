'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/lib/use-assessment';
import { NumberInput } from '@/components/ui/number-input';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

export default function Session8CashCyclePage() {
  const router = useRouter();
  const { loading } = useAssessment();
  const [dio, setDio] = useState('');
  const [dso, setDso] = useState('');
  const [dpo, setDpo] = useState('');
  const [avgMonthlyCogs, setAvgMonthlyCogs] = useState('');
  const [avgMonthlyRevenue, setAvgMonthlyRevenue] = useState('');
  const [currentAssets, setCurrentAssets] = useState('');
  const [currentLiabilities, setCurrentLiabilities] = useState('');

  const u = unmaskCurrency;
  const nDio = Number(dio) || 0;
  const nDso = Number(dso) || 0;
  const nDpo = Number(dpo) || 0;
  const cashCycleDays = nDio + nDso - nDpo;
  const dailyCogs = u(avgMonthlyCogs) / 30;
  const wcGap = cashCycleDays * dailyCogs;
  const wcLoanNeeded = wcGap > 0 ? wcGap : 0;
  const curAssets = u(currentAssets);
  const curLiab = u(currentLiabilities);
  const currentRatio = curLiab > 0 ? curAssets / curLiab : null;
  const riskLevel = cashCycleDays > 90 ? 'high' : cashCycleDays > 45 ? 'medium' : 'low';
  const hasData = nDio > 0 || nDso > 0;

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border print:hidden">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary"><ChevronLeft size={20} /></button>
          <span className="text-[15px] font-semibold">S08 · Cash Cycle</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-6">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 8</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Cash Cycle & Working Capital</h1>
          <p className="text-sm text-text-secondary mt-1">วิเคราะห์วงจรเงินสด — เงินจมกี่วัน ต้องกู้เท่าไหร่</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input */}
          <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="text-sm font-semibold">ข้อมูล Cash Cycle</div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">DIO — สินค้าค้างสต็อกกี่วัน</label>
              <input value={dio} onChange={(e) => setDio(e.target.value.replace(/\D/g,''))} placeholder="เช่น 45"
                className="w-full h-10 rounded-xl border border-border px-3 text-sm num bg-bg-card text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">DSO — เก็บเงินลูกหนี้กี่วัน</label>
              <input value={dso} onChange={(e) => setDso(e.target.value.replace(/\D/g,''))} placeholder="เช่น 60"
                className="w-full h-10 rounded-xl border border-border px-3 text-sm num bg-bg-card text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">DPO — จ่ายเจ้าหนี้กี่วัน</label>
              <input value={dpo} onChange={(e) => setDpo(e.target.value.replace(/\D/g,''))} placeholder="เช่น 30"
                className="w-full h-10 rounded-xl border border-border px-3 text-sm num bg-bg-card text-text-primary outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">ต้นทุนเฉลี่ย/เดือน (COGS)</label>
              <NumberInput value={avgMonthlyCogs} onChange={setAvgMonthlyCogs} compact suffix="฿" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">รายได้เฉลี่ย/เดือน</label>
              <NumberInput value={avgMonthlyRevenue} onChange={setAvgMonthlyRevenue} compact suffix="฿" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">สินทรัพย์หมุนเวียน</label>
              <NumberInput value={currentAssets} onChange={setCurrentAssets} compact suffix="฿" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">หนี้สินหมุนเวียน</label>
              <NumberInput value={currentLiabilities} onChange={setCurrentLiabilities} compact suffix="฿" />
            </div>
          </div>

          {/* Results */}
          {hasData && (
            <div className="space-y-4">
              <div className="bg-bg-card border border-border rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4">ผลวิเคราะห์ Cash Cycle</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-secondary rounded-xl p-3 text-center">
                    <div className="text-[10px] text-text-tertiary">Cash Cycle</div>
                    <div className={`num text-2xl font-bold ${cashCycleDays > 90 ? 'text-status-bad' : cashCycleDays > 45 ? 'text-status-warn' : 'text-status-good'}`}>{cashCycleDays} วัน</div>
                    <div className="text-[10px] text-text-tertiary">DIO + DSO − DPO</div>
                  </div>
                  <div className="bg-bg-secondary rounded-xl p-3 text-center">
                    <div className="text-[10px] text-text-tertiary">WC Loan ที่ต้องการ</div>
                    <div className="num text-lg font-bold text-accent">{money(wcLoanNeeded)}</div>
                    <div className="text-[10px] text-text-tertiary">เงินที่จมในวงจร</div>
                  </div>
                  {currentRatio != null && (
                    <div className="bg-bg-secondary rounded-xl p-3 text-center">
                      <div className="text-[10px] text-text-tertiary">Current Ratio</div>
                      <div className={`num text-xl font-bold ${currentRatio >= 1.5 ? 'text-status-good' : currentRatio >= 1.0 ? 'text-status-warn' : 'text-status-bad'}`}>{currentRatio.toFixed(2)}x</div>
                    </div>
                  )}
                  <div className="bg-bg-secondary rounded-xl p-3 text-center">
                    <div className="text-[10px] text-text-tertiary">ระดับความเสี่ยง</div>
                    <div className={`text-sm font-bold ${riskLevel === 'high' ? 'text-status-bad' : riskLevel === 'medium' ? 'text-status-warn' : 'text-status-good'}`}>
                      {riskLevel === 'high' ? 'สูง' : riskLevel === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                    </div>
                  </div>
                </div>
              </div>
              <div className={`rounded-2xl p-4 text-sm ${cashCycleDays > 60 ? 'bg-wash-warn text-status-warn' : 'bg-wash-good text-status-good'}`}>
                {cashCycleDays > 60 ? `เงินจม ${cashCycleDays} วัน — ต้องมีเงินทุนหมุนเวียน ${money(wcLoanNeeded)} รองรับ` : `วงจรเงินสด ${cashCycleDays} วัน อยู่ในเกณฑ์ดี`}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
