'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment, getCompletedSessions } from '@/lib/use-assessment';
import { rdSwitchFrsProfile } from '@/lib/api';
import { ScoreRing } from '@/components/ui/score-ring';
import { PillarChart } from '@/components/ui/pillar-chart';
import { money } from '@/lib/format';
import { ChevronLeft } from 'lucide-react';

export default function FrsReportPage() {
  const router = useRouter();
  const { assessmentId, assessment, loading, refresh } = useAssessment();
  const [switching, setSwitching] = useState(false);

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;
  if (!assessment) return null;

  const scores = assessment.readinessScores;
  const frs = scores?.compositeFrs ?? 0;
  const frsBand = scores?.frsBand ?? 'ยังไม่พร้อม';
  const profile = scores?.frsProfile ?? 'learning';

  const bandColor = frsBand === 'พร้อมยื่น' ? 'var(--status-good)' : frsBand === 'เกือบพร้อม' ? 'var(--status-warn)' : 'var(--status-bad)';

  const pillars = [
    { label: 'Mindset', score: scores?.mindsetScore ?? 0, weight: profile === 'bank' ? 0.10 : 0.20 },
    { label: 'สุขภาพการเงิน', score: scores?.healthScore ?? 0, weight: profile === 'bank' ? 0.35 : 0.25 },
    { label: 'เสถียรภาพกระแสเงินสด', score: scores?.stabilityScore ?? 0, weight: profile === 'bank' ? 0.25 : 0.20 },
    { label: 'กำลังชำระหนี้', score: scores?.capacityScore ?? 0, weight: profile === 'bank' ? 0.20 : 0.20 },
    { label: 'ความพร้อมยื่นแบงก์', score: scores?.bankReadinessScore ?? 0, weight: profile === 'bank' ? 0.10 : 0.15 },
  ];

  const handleSwitchProfile = async (p: 'learning' | 'bank') => {
    if (!assessmentId || p === profile) return;
    setSwitching(true);
    try {
      await rdSwitchFrsProfile(assessmentId, p);
      await refresh();
    } catch {}
    setSwitching(false);
  };

  const s2h = assessment.s2Health;
  const s3sum = assessment.s3Summary;
  const s4 = assessment.s4;
  const s1 = assessment.s1;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">FRS Report</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        {/* FRS Score */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 text-center anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-2">Financial Readiness Score</div>
          <ScoreRing score={frs} size={200} label="" sublabel={frsBand} />
          <div className="mt-3 px-4 py-1.5 rounded-full text-sm font-semibold inline-block"
            style={{ color: bandColor, background: `color-mix(in srgb, ${bandColor} 12%, transparent)` }}>
            {frsBand}
          </div>
        </div>

        {/* Profile switcher */}
        <div className="mt-4 flex gap-2">
          {[
            { id: 'learning' as const, label: 'มุมมองผู้เรียน', desc: 'น้ำหนัก Mindset สูง' },
            { id: 'bank' as const, label: 'มุมมองธนาคาร', desc: 'น้ำหนัก Health/Stability สูง' },
          ].map((p) => (
            <button key={p.id} onClick={() => handleSwitchProfile(p.id)} disabled={switching}
              className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all text-left ${
                profile === p.id ? 'border-accent bg-accent/5' : 'border-border bg-bg-card'
              }`}>
              <div className="text-xs font-semibold">{p.label}</div>
              <div className="text-[10px] text-text-tertiary">{p.desc}</div>
            </button>
          ))}
        </div>

        {/* 5-Pillar Chart */}
        <div className="mt-6 bg-bg-card border border-border rounded-2xl p-5 anim-fade-up anim-d1">
          <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-4">5 เสาหลัก</div>
          <PillarChart pillars={pillars} />
        </div>

        {/* S1: Mindset */}
        {s1 && (
          <div className="mt-4 bg-bg-card border border-border rounded-2xl p-5 anim-fade-up anim-d2">
            <div className="text-sm font-semibold mb-3">Session 1: Mindset</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-[10px] text-text-tertiary">Operator</div>
                <div className="num text-lg font-bold">{s1.operatorScore}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-text-tertiary">Owner</div>
                <div className="num text-lg font-bold">{s1.ownerScore}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-text-tertiary">Combined</div>
                <div className="num text-lg font-bold text-accent">{s1.ownerMindsetScore}</div>
              </div>
            </div>
            {s1.readiness && <div className="mt-2 text-xs text-text-secondary text-center">{s1.readiness}</div>}
            {s1.verdict && <div className="mt-1 text-xs text-text-tertiary text-center">{s1.verdict}</div>}
          </div>
        )}

        {/* S2: Health */}
        {s2h && (
          <div className="mt-4 bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Session 2: สุขภาพการเงิน</div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                s2h.status === 'แข็งแรง' ? 'bg-wash-good text-status-good' :
                s2h.status === 'พอใช้' ? 'bg-wash-warn text-status-warn' : 'bg-wash-bad text-status-bad'
              }`}>{s2h.status}</span>
            </div>
            <div className="num text-2xl font-bold text-center mb-2">{s2h.healthScore} <span className="text-sm text-text-tertiary font-normal">/ 100</span></div>
            {s2h.redFlags?.length > 0 && (
              <div className="mt-2 space-y-1">
                {s2h.redFlags.map((f: string, i: number) => (
                  <div key={i} className="text-xs text-status-bad flex items-start gap-1.5"><span>!</span> {f}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* S3: Cashflow */}
        {s3sum && (
          <div className="mt-4 bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
            <div className="text-sm font-semibold mb-3">Session 3: กระแสเงินสด</div>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[10px] text-text-tertiary">ยอดขายเฉลี่ย/เดือน</div><div className="num text-sm font-bold">{money(Number(s3sum.avgMonthlySales))}</div></div>
              <div><div className="text-[10px] text-text-tertiary">Cash In เฉลี่ย</div><div className="num text-sm font-bold">{money(Number(s3sum.avgMonthlyCashIn))}</div></div>
              <div><div className="text-[10px] text-text-tertiary">Real Cash เฉลี่ย</div><div className="num text-sm font-bold">{money(Number(s3sum.avgRealCash))}</div></div>
              <div><div className="text-[10px] text-text-tertiary">Growth Cash เฉลี่ย</div>
                <div className={`num text-sm font-bold ${Number(s3sum.avgGrowth) >= 0 ? 'text-status-good' : 'text-status-bad'}`}>
                  {money(Number(s3sum.avgGrowth))}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-text-secondary">
              แนวโน้ม: <span className="font-semibold">{s3sum.trend}</span> · Stability Score: <span className="num font-bold">{s3sum.stabilityScore}</span>
            </div>
            {s3sum.warnings?.length > 0 && (
              <div className="mt-2 space-y-1">
                {s3sum.warnings.map((w: string, i: number) => (
                  <div key={i} className="text-xs text-status-warn flex items-start gap-1.5"><span>⚠</span> {w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* S4: Loan */}
        {s4 && (
          <div className="mt-4 bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
            <div className="text-sm font-semibold mb-3">Session 4: วงเงินกู้</div>
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-3">
              <div className="text-[10px] text-text-tertiary uppercase">วงเงินแนะนำ</div>
              <div className="num text-xl font-bold text-accent">{money(Number(s4.recommendedAmount))}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-text-tertiary">DSCR ก่อนกู้</div>
                <div className="num text-sm font-bold">{s4.dscrBefore != null ? Number(s4.dscrBefore).toFixed(2) : 'ไม่มีหนี้'}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-tertiary">DSCR หลังกู้</div>
                <div className={`num text-sm font-bold ${s4.dscrAfter != null && Number(s4.dscrAfter) >= 1.25 ? 'text-status-good' : 'text-status-warn'}`}>
                  {s4.dscrAfter != null ? Number(s4.dscrAfter).toFixed(2) : '—'}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-text-secondary">{s4.verdict}</div>
          </div>
        )}

        {/* Best deal */}
        {assessment.s6Deals?.length > 0 && (
          <div className="mt-4 bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
            <div className="text-sm font-semibold mb-3">Session 6: Deal Comparison</div>
            {assessment.s6Deals.map((d: any) => (
              <div key={d.slot} className={`p-3 rounded-xl border mb-2 last:mb-0 ${d.isBest ? 'border-status-good bg-wash-good' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{d.bankName || `แบงก์ ${d.slot}`}</span>
                  <span className="num text-sm font-bold">{Number(d.dealScore ?? 0).toFixed(1)}</span>
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  {money(Number(d.amount))} · {Number(d.interestRate)}% · {d.tenureYears} ปี
                  {d.isBest && <span className="text-status-good font-semibold ml-2">Best</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bank Simulation CTA */}
        <a href="/ib/bank-sim"
          className="mt-6 flex items-center gap-3 bg-bg-card border border-accent/30 rounded-2xl p-4 no-underline hover:bg-accent/5 transition-colors anim-fade-up">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-accent">AI</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-accent">Bank Simulation</div>
            <div className="text-[11px] text-text-tertiary">ทดลองสัมภาษณ์สินเชื่อกับ Virtual RM</div>
          </div>
          <span className="text-[11px] text-accent font-medium">เริ่มแชท →</span>
        </a>
      </main>

    </div>
  );
}
