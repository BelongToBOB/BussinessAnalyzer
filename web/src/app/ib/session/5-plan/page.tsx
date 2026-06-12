'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment, getCompletedSessions } from '@/lib/use-assessment';
import { rdSaveS5 } from '@/lib/api';
import { RdSessionProgress } from '@/components/ui/rd-session-progress';
import { ScoreRing } from '@/components/ui/score-ring';
import { NumberInput } from '@/components/ui/number-input';
import { maskCurrency, unmaskCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ChevronLeft, FileText, Building } from 'lucide-react';

const BANK_QUESTIONS = [
  { no: 1, q: 'ธุรกิจทำอะไร? ขายอะไร? ให้ใคร?' },
  { no: 2, q: 'รายได้มาจากไหน? ลูกค้าหลักคือใคร?' },
  { no: 3, q: 'ยอดขายปีที่แล้วเท่าไร? ปีนี้คาดว่าเท่าไร?' },
  { no: 4, q: 'กำไรสุทธิปีที่แล้วเท่าไร? EBITDA เท่าไร?' },
  { no: 5, q: 'Cash Flow รายเดือนเป็นอย่างไร? มีเดือนที่ตึงไหม?' },
  { no: 6, q: 'ต้องการกู้เงินไปทำอะไร? มีแผนชัดเจนไหม?' },
  { no: 7, q: 'จะเอาเงินไปลงทุนอะไร? ROI คาดว่าเท่าไร?' },
  { no: 8, q: 'จะผ่อนคืนจากแหล่งไหน? มีความมั่นใจแค่ไหน?' },
  { no: 9, q: 'มีหลักทรัพย์ค้ำประกันอะไรบ้าง? มูลค่าเท่าไร?' },
  { no: 10, q: 'มีหนี้อยู่ที่ไหนบ้าง? ผ่อนเดือนละเท่าไร?' },
  { no: 11, q: 'ธุรกิจมีความเสี่ยงอะไรบ้าง? จัดการอย่างไร?' },
  { no: 12, q: 'ใครเป็นคู่แข่ง? จุดแข็งของคุณคืออะไร?' },
  { no: 13, q: 'ถ้าธุรกิจไม่เป็นไปตามแผน จะทำอย่างไร?' },
];

const DOCUMENTS = [
  { key: 'financials3y', label: 'งบการเงิน 3 ปีย้อนหลัง (ตรวจสอบโดย CPA)' },
  { key: 'bankStatement12m', label: 'Statement ธนาคาร 12 เดือน' },
  { key: 'businessPlan', label: 'Business Plan / แผนธุรกิจ' },
  { key: 'collateralDocs', label: 'เอกสารหลักทรัพย์ค้ำประกัน' },
  { key: 'taxCertificate', label: 'ใบรับรองการเสียภาษี / ภ.พ.20' },
];

export default function Session5PlanPage() {
  const router = useRouter();
  const { assessmentId, assessment, loading, refresh } = useAssessment();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [answers, setAnswers] = useState<Record<number, { answered: boolean; answer: string }>>({});
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [biz, setBiz] = useState({
    requestedAmount: '', mainProduct: '', targetCustomers: '',
    repaymentSource: '', collateralDetail: '',
  });

  useEffect(() => {
    if (assessment?.s5) {
      const p = assessment.s5;
      setBiz({
        requestedAmount: p.requestedAmount ? maskCurrency(String(Math.round(Number(p.requestedAmount)))) : '',
        mainProduct: p.mainProduct ?? '', targetCustomers: p.targetCustomers ?? '',
        repaymentSource: p.repaymentSource ?? '', collateralDetail: p.collateralDetail ?? '',
      });
      setDocs((p.documents as Record<string, boolean>) ?? {});
      if (p.loanReadinessScore != null) {
        setResult({ loanReadinessScore: p.loanReadinessScore, planCompleteness: Number(p.planCompleteness ?? 0) });
      }
    }
    if (assessment?.s5Questions?.length) {
      const ans: Record<number, { answered: boolean; answer: string }> = {};
      assessment.s5Questions.forEach((q: any) => {
        ans[q.qNo] = { answered: q.answered, answer: q.answer ?? '' };
      });
      setAnswers(ans);
    }
  }, [assessment?.s5, assessment?.s5Questions]);

  const flags = getCompletedSessions(assessment);
  const answeredCount = BANK_QUESTIONS.filter(q => answers[q.no]?.answered).length;
  const docCount = Object.values(docs).filter(Boolean).length;
  const completeness = ((answeredCount / 13) * 0.7 + (docCount / 5) * 0.3) * 100;

  const handleSave = async (andNavigate = false) => {
    if (!assessmentId) return;
    setSaving(true);
    try {
      const res: any = await rdSaveS5(assessmentId, {
        requestedAmount: unmaskCurrency(biz.requestedAmount) || undefined,
        mainProduct: biz.mainProduct, targetCustomers: biz.targetCustomers,
        repaymentSource: biz.repaymentSource, collateralDetail: biz.collateralDetail,
        documents: docs,
        questions: BANK_QUESTIONS.map(q => ({
          qNo: q.no,
          answered: answers[q.no]?.answered ?? false,
          answer: answers[q.no]?.answer ?? '',
        })),
      });
      setResult(res);
      toast.success('บันทึก Bank Plan แล้ว');
      await refresh();
      if (andNavigate) setTimeout(() => router.push('/ib/session/6-deal'), 600);
    } catch (e: any) {
      toast.error(e.message || 'บันทึกไม่สำเร็จ');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">Session 5 · Bank Plan</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-6 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 5 of 6</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Bank Plan</h1>
          <p className="text-sm text-text-secondary mt-1">เตรียมข้อมูลสำหรับยื่นกู้ธนาคาร</p>
        </div>

        <RdSessionProgress current={5} completedFlags={flags} />

        {/* Progress bar */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-text-secondary">ความสมบูรณ์ของ Plan</span>
            <span className="num text-xs font-bold text-accent">{completeness.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${completeness}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-text-tertiary">
            <span>ตอบคำถาม {answeredCount}/13</span>
            <span>เอกสาร {docCount}/5</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Business Info + Docs */}
          <div className="space-y-4">
            <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
              <div className="flex items-center gap-2 mb-4">
                <Building size={14} className="text-accent" />
                <span className="text-sm font-semibold">ข้อมูลธุรกิจสำหรับยื่นกู้</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block text-text-secondary">วงเงินที่ต้องการยื่น</label>
                  <NumberInput value={biz.requestedAmount} onChange={(v) => setBiz(p => ({ ...p, requestedAmount: maskCurrency(v) }))} compact suffix="฿" />
                </div>
                {[
                  { key: 'mainProduct', label: 'สินค้า/บริการหลัก', ph: 'อธิบายสั้นๆ' },
                  { key: 'targetCustomers', label: 'กลุ่มลูกค้าหลัก', ph: 'ลูกค้าคือใคร?' },
                  { key: 'repaymentSource', label: 'แหล่งที่มาของการผ่อนชำระ', ph: 'จะผ่อนจากรายได้ส่วนไหน?' },
                  { key: 'collateralDetail', label: 'หลักทรัพย์ค้ำประกัน', ph: 'มีอะไรบ้าง? มูลค่าประมาณเท่าไร?' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-medium mb-1 block text-text-secondary">{f.label}</label>
                    <textarea value={(biz as any)[f.key]} onChange={(e) => setBiz(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.ph} rows={2}
                      className="w-full rounded-xl border border-border px-3 py-2 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up anim-d1">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={14} className="text-accent" />
                <span className="text-sm font-semibold">เอกสารที่เตรียมได้แล้ว ({docCount}/5)</span>
              </div>
              <div className="space-y-2">
                {DOCUMENTS.map((d) => (
                  <label key={d.key} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                    <input type="checkbox" checked={docs[d.key] ?? false}
                      onChange={() => setDocs(p => ({ ...p, [d.key]: !p[d.key] }))}
                      className="w-4 h-4 rounded shrink-0" />
                    <span className="text-sm">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: 13 Questions */}
          <div className="space-y-4">
            <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up anim-d2">
              <div className="text-sm font-semibold mb-1">13 คำถามที่ธนาคารถาม ({answeredCount}/13)</div>
              <div className="text-xs text-text-tertiary mb-4">ติ๊กถ้าคุณตอบได้ และกรอกคำตอบสั้นๆ</div>
              <div className="space-y-2">
                {BANK_QUESTIONS.map((q) => {
                  const a = answers[q.no];
                  const checked = a?.answered ?? false;
                  return (
                    <div key={q.no} className={`rounded-xl border p-3 transition-colors ${checked ? 'bg-wash-good border-status-good/30' : 'bg-bg-secondary border-border'}`}>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={checked}
                          onChange={() => setAnswers(p => ({
                            ...p, [q.no]: { answered: !checked, answer: p[q.no]?.answer ?? '' },
                          }))}
                          className="w-4 h-4 rounded shrink-0 mt-0.5" />
                        <span className="text-xs font-medium">Q{q.no}: {q.q}</span>
                      </label>
                      {checked && (
                        <textarea value={a?.answer ?? ''}
                          onChange={(e) => setAnswers(p => ({ ...p, [q.no]: { ...p[q.no], answer: e.target.value } }))}
                          placeholder="คำตอบสั้นๆ..."
                          rows={2}
                          className="w-full mt-2 rounded-lg border border-border px-3 py-2 text-xs bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loan Readiness Score */}
            {result && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex items-center justify-between anim-scale-in">
                <div>
                  <div className="text-sm font-bold text-accent">Loan Readiness Score</div>
                  <div className="text-xs text-text-secondary">ความพร้อมยื่นกู้</div>
                </div>
                <ScoreRing score={result.loanReadinessScore ?? 0} size={80} label="" />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
          <button onClick={() => router.push('/ib/session/4-loan')}
            className="px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors">
            ← ย้อนกลับ
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors disabled:opacity-40">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button onClick={() => handleSave(true)} disabled={answeredCount < 8 || saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border-none disabled:opacity-40 transition-all gradient-accent">
              ถัดไป: ดีล →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
