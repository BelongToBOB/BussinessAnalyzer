'use client';

import { useRouter } from 'next/navigation';
import { useAssessment } from '@/lib/use-assessment';
import { money } from '@/lib/format';
import { BottomNav } from '@/components/ui/bottom-nav';
import { ChevronLeft, Printer, Trophy } from 'lucide-react';

export default function DealComparisonPage() {
  const router = useRouter();
  const { assessment, loading } = useAssessment();

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;
  if (!assessment?.s6Deals?.length) {
    return (
      <div className="min-h-screen bg-bg-secondary flex flex-col items-center justify-center gap-4 text-text-secondary">
        <div className="text-lg font-semibold">ยังไม่มีข้อมูล Deal</div>
        <p className="text-sm">กรุณาทำ Session 6 ก่อน</p>
        <button onClick={() => router.push('/ib/session/6-deal')} className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold cursor-pointer border-none">
          ไป Session 6 →
        </button>
      </div>
    );
  }

  const deals = assessment.s6Deals;
  const execution = assessment.s6Execution;
  const scores = assessment.readinessScores;
  const bestDeal = deals.find((d: any) => d.isBest);

  const SLOT_COLORS: Record<string, string> = { A: '#3B82F6', B: '#22C55E', C: '#8B5CF6' };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border print:hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <span className="text-[15px] font-semibold">Deal Comparison Report</span>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-transparent cursor-pointer text-text-secondary hover:bg-bg-secondary">
            <Printer size={14} /> พิมพ์
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Deal Comparison Report</h1>
          <p className="text-sm text-text-secondary mt-1">เปรียบเทียบข้อเสนอสินเชื่อจากธนาคาร</p>
        </div>

        {/* Best deal banner */}
        {bestDeal && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Trophy size={24} className="text-accent shrink-0" />
            <div>
              <div className="text-sm font-bold text-accent">ดีลที่แนะนำ: ดีล {bestDeal.slot} — {bestDeal.bankName || 'ธนาคาร'}</div>
              <div className="text-xs text-text-secondary">
                วงเงิน {money(Number(bestDeal.amount))} · {Number(bestDeal.interestRate)}% · {bestDeal.tenureYears} ปี · Score {Number(bestDeal.dealScore ?? 0).toFixed(0)}/100
              </div>
            </div>
          </div>
        )}

        {/* Side-by-side comparison table */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className="bg-text-primary text-bg-primary px-4 py-2.5 text-xs font-semibold">
            เปรียบเทียบ {deals.length} ข้อเสนอ
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary w-[30%]">รายการ</th>
                  {deals.map((d: any) => (
                    <th key={d.slot} className="text-center px-3 py-3 text-xs font-semibold" style={{ color: SLOT_COLORS[d.slot] }}>
                      ดีล {d.slot}{d.isBest && ' ⭐'}
                      <div className="text-[10px] text-text-tertiary font-normal">{d.bankName || '—'}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'วงเงิน', key: 'amount', fmt: (v: any) => money(Number(v)) },
                  { label: 'ดอกเบี้ย (%/ปี)', key: 'interestRate', fmt: (v: any) => Number(v) + '%' },
                  { label: 'ระยะเวลา (ปี)', key: 'tenureYears', fmt: (v: any) => v + ' ปี' },
                  { label: 'ค่างวด/เดือน', key: 'monthlyInstallment', fmt: (v: any) => v ? money(Math.round(Number(v))) : '—' },
                  { label: 'หลักทรัพย์', key: 'collateralRequired', fmt: (v: any) => v || '—' },
                  { label: 'ค่าธรรมเนียม', key: 'feeAmount', fmt: (v: any) => v ? money(Number(v)) : '—' },
                  { label: 'DSCR หลังกู้', key: 'dscrAfterDeal', fmt: (v: any) => v != null ? Number(v).toFixed(2) + 'x' : '—' },
                  { label: 'Deal Score', key: 'dealScore', fmt: (v: any) => v != null ? Number(v).toFixed(0) + '/100' : '—' },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5 text-xs font-medium text-text-secondary">{row.label}</td>
                    {deals.map((d: any) => {
                      const val = d[row.key];
                      const isDscr = row.key === 'dscrAfterDeal';
                      const isScore = row.key === 'dealScore';
                      return (
                        <td key={d.slot} className={`text-center px-3 py-2.5 text-xs font-medium ${
                          d.isBest && (isScore || isDscr) ? 'font-bold' : ''
                        } ${isDscr && val != null ? (Number(val) >= 1.25 ? 'text-status-good' : 'text-status-bad') : ''}`}>
                          {row.fmt(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="text-sm font-semibold mb-4">Score Breakdown</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-2 text-text-tertiary">มิติ</th>
                  {deals.map((d: any) => (
                    <th key={d.slot} className="text-center py-2 px-2" style={{ color: SLOT_COLORS[d.slot] }}>ดีล {d.slot}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['scoreAmount', 'scoreInterest', 'scoreTenure', 'scoreCollateral', 'scoreCovenants'].map((key) => {
                  const labels: Record<string, string> = {
                    scoreAmount: 'วงเงิน (20%)', scoreInterest: 'ดอกเบี้ย (20%)', scoreTenure: 'ระยะเวลา (15%)',
                    scoreCollateral: 'หลักประกัน (25%)', scoreCovenants: 'เงื่อนไข (20%)',
                  };
                  return (
                    <tr key={key} className="border-b border-border last:border-b-0">
                      <td className="py-1.5 pr-2 text-text-secondary">{labels[key]}</td>
                      {deals.map((d: any) => (
                        <td key={d.slot} className="text-center py-1.5 px-2 num font-medium">{d[key] != null ? Number(d[key]).toFixed(0) : '—'}</td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-border">
                  <td className="py-2 pr-2 font-bold">รวม</td>
                  {deals.map((d: any) => (
                    <td key={d.slot} className="text-center py-2 px-2 num font-bold" style={{ color: SLOT_COLORS[d.slot] }}>
                      {Number(d.dealScore ?? 0).toFixed(1)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Execution plan */}
        {execution && (
          <div className="bg-bg-card border border-border rounded-2xl p-5 mb-6">
            <div className="text-sm font-semibold mb-3">แผนปฏิบัติ 90 วัน</div>
            <div className="text-xs text-text-secondary mb-3">โหมดธุรกิจ: <span className="font-medium text-text-primary">{execution.businessMode === 'expanding' ? 'กำลังขยาย' : 'ทรงตัว/ปรับโครงสร้าง'}</span></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'เดือนที่ 1', value: execution.month1Plan },
                { label: 'เดือนที่ 2', value: execution.month2Plan },
                { label: 'เดือนที่ 3', value: execution.month3Plan },
              ].map((m) => (
                <div key={m.label} className="bg-bg-secondary rounded-xl p-3">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase mb-1">{m.label}</div>
                  <div className="text-xs text-text-primary">{m.value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FRS Score */}
        {scores && (
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Financial Readiness Score</div>
                <div className="text-xs text-text-secondary">{scores.frsBand}</div>
              </div>
              <div className="num text-3xl font-bold text-accent">{scores.compositeFrs}</div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
