'use client';

import { useRouter } from 'next/navigation';
import { useAssessment } from '@/lib/use-assessment';
import { ChevronLeft } from 'lucide-react';

type Signal = 'green' | 'yellow' | 'red' | 'gray';

function getSignals(assessment: any): { label: string; signal: Signal; note: string }[] {
  const s2h = assessment?.s2Health;
  const s3 = assessment?.s3Summary;
  const s4 = assessment?.s4;
  const s5 = assessment?.s5;
  const s1 = assessment?.s1;

  // Cashflow
  const avgGrowth = s3 ? Number(s3.avgGrowth) : null;
  const cfSignal: Signal = avgGrowth === null ? 'gray' : avgGrowth > 0 ? 'green' : avgGrowth >= -50000 ? 'yellow' : 'red';
  const cfNote = avgGrowth === null ? 'ยังไม่ได้กรอก' : avgGrowth > 0 ? 'Growth Cash เป็นบวก' : 'Growth Cash ติดลบ — ต้องหาเงินมาโปะ';

  // DSCR
  const dscr = s4?.dscrAfter != null ? Number(s4.dscrAfter) : null;
  const dscrSignal: Signal = dscr === null ? 'gray' : dscr >= 1.25 ? 'green' : dscr >= 1.0 ? 'yellow' : 'red';
  const dscrNote = dscr === null ? 'ยังไม่ได้คำนวณ' : dscr >= 1.25 ? `DSCR ${dscr.toFixed(2)}x ผ่านเกณฑ์` : `DSCR ${dscr.toFixed(2)}x ต่ำกว่าเกณฑ์`;

  // Debt Structure (D/E)
  const de = s2h ? (() => {
    const eq = assessment.s2Financials?.length ? Number(assessment.s2Financials[assessment.s2Financials.length - 1].equity) : 0;
    const liab = assessment.s2Financials?.length ? Number(assessment.s2Financials[assessment.s2Financials.length - 1].totalLiabilities) : 0;
    return eq > 0 ? liab / eq : null;
  })() : null;
  const deSignal: Signal = de === null ? 'gray' : de < 3 ? 'green' : de < 5 ? 'yellow' : 'red';
  const deNote = de === null ? 'ยังไม่ได้กรอก' : de < 3 ? `D/E ${de.toFixed(2)}x อยู่ในเกณฑ์ดี` : `D/E ${de.toFixed(2)}x หนี้สูง`;

  // Documents
  const docs = s5?.documents ? Object.values(s5.documents as Record<string, boolean>).filter(Boolean).length : 0;
  const docSignal: Signal = docs >= 5 ? 'green' : docs >= 3 ? 'yellow' : docs > 0 ? 'red' : 'gray';
  const docNote = docs === 0 ? 'ยังไม่ได้เช็คเอกสาร' : `เตรียมได้ ${docs}/5 รายการ`;

  // Owner Mindset
  const mindset = s1?.ownerMindsetScore;
  const msSignal: Signal = mindset == null ? 'gray' : mindset >= 75 ? 'green' : mindset >= 50 ? 'yellow' : 'red';
  const msNote = mindset == null ? 'ยังไม่ได้ประเมิน' : `Mindset Score ${mindset} — ${s1.readiness}`;

  return [
    { label: 'Cash Flow', signal: cfSignal, note: cfNote },
    { label: 'DSCR (ความสามารถจ่ายหนี้)', signal: dscrSignal, note: dscrNote },
    { label: 'โครงสร้างหนี้ (D/E)', signal: deSignal, note: deNote },
    { label: 'เอกสารพร้อม', signal: docSignal, note: docNote },
    { label: 'Owner Mindset', signal: msSignal, note: msNote },
  ];
}

const signalColor = (s: Signal) => s === 'green' ? 'bg-status-good' : s === 'yellow' ? 'bg-status-warn' : s === 'red' ? 'bg-status-bad' : 'bg-border';
const signalBg = (s: Signal) => s === 'green' ? 'bg-wash-good' : s === 'yellow' ? 'bg-wash-warn' : s === 'red' ? 'bg-wash-bad' : 'bg-bg-secondary';
const signalText = (s: Signal) => s === 'green' ? 'text-status-good' : s === 'yellow' ? 'text-status-warn' : s === 'red' ? 'text-status-bad' : 'text-text-tertiary';

export default function SummaryPage() {
  const router = useRouter();
  const { assessment, loading } = useAssessment();

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const signals = getSignals(assessment);
  const scores = assessment?.readinessScores;
  const greenCount = signals.filter(s => s.signal === 'green').length;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">WinWin Summary</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">สรุปความพร้อม</h1>
          <p className="text-sm text-text-secondary mt-1">5 สัญญาณบอกว่าธุรกิจพร้อมขอกู้แค่ไหน</p>
        </div>

        {/* FRS Score */}
        {scores && (
          <div className="bg-bg-card border border-border rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">Financial Readiness Score</div>
              <div className={`text-xs font-semibold mt-1 ${scores.frsBand === 'พร้อมยื่น' ? 'text-status-good' : scores.frsBand === 'เกือบพร้อม' ? 'text-status-warn' : 'text-status-bad'}`}>
                {scores.frsBand}
              </div>
            </div>
            <div className="num text-4xl font-bold text-accent">{scores.compositeFrs}</div>
          </div>
        )}

        {/* Traffic lights */}
        <div className="space-y-3">
          {signals.map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 flex items-center gap-4 ${signalBg(s.signal)} border-transparent`}>
              <div className={`w-5 h-5 rounded-full shrink-0 ${signalColor(s.signal)}`} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{s.label}</div>
                <div className={`text-xs mt-0.5 ${signalText(s.signal)}`}>{s.note}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className={`mt-6 rounded-2xl border p-5 text-center ${
          greenCount === 5 ? 'bg-wash-good border-status-good/20' :
          greenCount >= 3 ? 'bg-wash-warn border-status-warn/20' :
          'bg-wash-bad border-status-bad/20'
        }`}>
          <div className="text-lg font-bold">
            {greenCount === 5 ? 'พร้อมยื่นกู้' : greenCount >= 3 ? 'เกือบพร้อม — ปรับอีกนิด' : 'ต้องปรับก่อนยื่น'}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            ผ่าน {greenCount}/5 สัญญาณ
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/ib/report')} className="bg-bg-card border border-border rounded-xl p-4 text-left cursor-pointer hover:bg-bg-secondary transition-colors">
            <div className="text-xs font-semibold">FRS Report</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">รายละเอียดทุก session</div>
          </button>
          <button onClick={() => router.push('/ib/business-plan')} className="bg-bg-card border border-border rounded-xl p-4 text-left cursor-pointer hover:bg-bg-secondary transition-colors">
            <div className="text-xs font-semibold">Business Plan</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">สรุปแผนธุรกิจ</div>
          </button>
          <button onClick={() => router.push('/ib/deal-comparison')} className="bg-bg-card border border-border rounded-xl p-4 text-left cursor-pointer hover:bg-bg-secondary transition-colors">
            <div className="text-xs font-semibold">Deal Comparison</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">เปรียบเทียบดีล</div>
          </button>
          <button onClick={() => router.push('/ib/bank-sim')} className="bg-bg-card border border-border rounded-xl p-4 text-left cursor-pointer hover:bg-bg-secondary transition-colors">
            <div className="text-xs font-semibold">Bank Simulation</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">จำลองสัมภาษณ์</div>
          </button>
        </div>
      </main>

    </div>
  );
}
