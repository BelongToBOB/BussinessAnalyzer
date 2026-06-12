'use client';

import { useRouter } from 'next/navigation';
import { useAssessment } from '@/lib/use-assessment';
import { money } from '@/lib/format';
import { ChevronLeft, Printer } from 'lucide-react';

export default function BusinessPlanPage() {
  const router = useRouter();
  const { assessment, loading } = useAssessment();

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;
  if (!assessment) return null;

  const s2 = assessment.s2Financials;
  const s2h = assessment.s2Health;
  const s3 = assessment.s3Summary;
  const s4 = assessment.s4;
  const s5 = assessment.s5;
  const scores = assessment.readinessScores;
  const latest = s2?.length ? s2[s2.length - 1] : null;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div className="bg-text-primary text-bg-primary px-4 py-2.5 text-xs font-semibold">{title}</div>
      <div className="p-5">{children}</div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-b-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs font-medium num">{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border print:hidden">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <span className="text-[15px] font-semibold">Business Plan Report</span>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-transparent cursor-pointer text-text-secondary hover:bg-bg-secondary">
            <Printer size={14} /> พิมพ์
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Business Plan Report</h1>
          <p className="text-sm text-text-secondary mt-1">สรุปแผนธุรกิจสำหรับยื่นสินเชื่อ</p>
          <p className="text-[10px] text-text-tertiary mt-1">สร้างเมื่อ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* FRS Score */}
        {scores && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-accent">Financial Readiness Score</div>
              <div className="text-xs text-text-secondary">{scores.frsBand}</div>
            </div>
            <div className="num text-4xl font-bold text-accent">{scores.compositeFrs}</div>
          </div>
        )}

        {/* Financial Summary */}
        {latest && (
          <Section title="ข้อมูลทางการเงิน">
            <Row label="รายได้ต่อปี (Revenue)" value={money(Number(latest.revenue))} />
            <Row label="EBITDA" value={money(Number(latest.ebitda))} />
            <Row label="กำไรสุทธิ (Net Profit)" value={money(Number(latest.netProfit))} />
            <Row label="สินทรัพย์รวม" value={money(Number(latest.totalAssets))} />
            <Row label="หนี้สินรวม" value={money(Number(latest.totalLiabilities))} />
            <Row label="ส่วนของผู้ถือหุ้น" value={money(Number(latest.equity))} />
            <Row label="ภาระหนี้ต่อปี" value={money(Number(latest.annualDebtService))} />
          </Section>
        )}

        {/* Health */}
        {s2h && (
          <Section title="สุขภาพการเงิน">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Health Score</span>
              <span className={`num text-lg font-bold ${s2h.healthScore >= 75 ? 'text-status-good' : s2h.healthScore >= 50 ? 'text-status-warn' : 'text-status-bad'}`}>{s2h.healthScore}/100</span>
            </div>
            <div className="text-xs text-text-secondary mb-2">สถานะ: <span className="font-semibold">{s2h.status}</span></div>
            {s2h.redFlags?.length > 0 && (
              <div className="p-3 rounded-xl bg-wash-bad space-y-1">
                {s2h.redFlags.map((f: string, i: number) => (
                  <div key={i} className="text-xs text-status-bad">• {f}</div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Cashflow */}
        {s3 && (
          <Section title="กระแสเงินสด">
            <Row label="ยอดขายเฉลี่ย/เดือน" value={money(Number(s3.avgMonthlySales))} />
            <Row label="Cash In เฉลี่ย" value={money(Number(s3.avgMonthlyCashIn))} />
            <Row label="Real Cash เฉลี่ย" value={money(Number(s3.avgRealCash))} />
            <Row label="Growth Cash เฉลี่ย" value={money(Number(s3.avgGrowth))} />
            <Row label="แนวโน้ม" value={s3.trend} />
            <Row label="Stability Score" value={`${s3.stabilityScore}/100`} />
          </Section>
        )}

        {/* Loan */}
        {s4 && (
          <Section title="วงเงินกู้">
            <Row label="วงเงินแนะนำ (Practical)" value={money(Number(s4.recommendedAmount))} />
            <Row label="DSCR ก่อนกู้" value={s4.dscrBefore != null ? Number(s4.dscrBefore).toFixed(2) + 'x' : 'ไม่มีหนี้'} />
            <Row label="DSCR หลังกู้" value={s4.dscrAfter != null ? Number(s4.dscrAfter).toFixed(2) + 'x' : '—'} />
            <Row label="Capacity Score" value={`${s4.capacityScore}/100`} />
            <Row label="สรุป" value={s4.verdict} />
          </Section>
        )}

        {/* Bank Plan */}
        {s5 && (
          <Section title="แผนยื่นกู้">
            <Row label="วงเงินที่ยื่น" value={s5.requestedAmount ? money(Number(s5.requestedAmount)) : '—'} />
            <Row label="สินค้า/บริการหลัก" value={s5.mainProduct} />
            <Row label="กลุ่มลูกค้า" value={s5.targetCustomers} />
            <Row label="แหล่งผ่อนชำระ" value={s5.repaymentSource} />
            <Row label="หลักทรัพย์" value={s5.collateralDetail} />
            <Row label="Loan Readiness Score" value={s5.loanReadinessScore != null ? `${s5.loanReadinessScore}/100` : '—'} />
            <Row label="ความสมบูรณ์" value={s5.planCompleteness != null ? `${Number(s5.planCompleteness).toFixed(0)}%` : '—'} />
          </Section>
        )}
      </main>

    </div>
  );
}
