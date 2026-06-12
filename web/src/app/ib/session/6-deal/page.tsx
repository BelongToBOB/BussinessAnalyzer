'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment, getCompletedSessions } from '@/lib/use-assessment';
import { rdSaveS6 } from '@/lib/api';
import { NumberInput } from '@/components/ui/number-input';
import { RdSessionProgress } from '@/components/ui/rd-session-progress';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ChevronLeft, Trophy, Star, TrendingUp } from 'lucide-react';

interface DealData {
  slot: string; bankName: string;
  amount: string; interestRate: string; tenureYears: string;
  collateralRequired: string; feeAmount: string;
  dealScore?: number; dscrAfterDeal?: number | null; isBest?: boolean;
}

const SLOT_COLORS: Record<string, string> = {
  A: '#3B82F6', B: '#22C55E', C: '#8B5CF6',
};

function emptyDeal(slot: string): DealData {
  return { slot, bankName: '', amount: '', interestRate: '', tenureYears: '', collateralRequired: '', feeAmount: '' };
}

export default function Session6DealPage() {
  const router = useRouter();
  const { assessmentId, assessment, loading, refresh } = useAssessment();
  const [saving, setSaving] = useState(false);
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [businessMode, setBusinessMode] = useState<'expanding' | 'stable'>('expanding');
  const [month1Plan, setMonth1Plan] = useState('');
  const [month2Plan, setMonth2Plan] = useState('');
  const [month3Plan, setMonth3Plan] = useState('');
  const [deals, setDeals] = useState<DealData[]>([emptyDeal('A'), emptyDeal('B'), emptyDeal('C')]);

  useEffect(() => {
    if (!assessment) return;
    if (assessment.s6Deals?.length) {
      const loaded = assessment.s6Deals.map((d: any) => ({
        slot: d.slot, bankName: d.bankName ?? '',
        amount: d.amount ? maskCurrency(String(Math.round(Number(d.amount)))) : '',
        interestRate: d.interestRate ? String(Number(d.interestRate)) : '',
        tenureYears: d.tenureYears ? String(d.tenureYears) : '',
        collateralRequired: d.collateralRequired ?? '', feeAmount: d.feeAmount ? maskCurrency(String(Math.round(Number(d.feeAmount)))) : '',
        dealScore: d.dealScore ? Number(d.dealScore) : undefined,
        dscrAfterDeal: d.dscrAfterDeal ? Number(d.dscrAfterDeal) : null,
        isBest: d.isBest ?? false,
      }));
      setSavedDeals(loaded);
      setDeals(prev => prev.map(d => {
        const found = loaded.find((l: any) => l.slot === d.slot);
        return found ?? d;
      }));
    }
    if (assessment.s6Execution) {
      const e = assessment.s6Execution;
      setBusinessMode(e.businessMode ?? 'expanding');
      setMonth1Plan(e.month1Plan ?? ''); setMonth2Plan(e.month2Plan ?? ''); setMonth3Plan(e.month3Plan ?? '');
    }
  }, [assessment]);

  const flags = getCompletedSessions(assessment);
  const u = unmaskCurrency;

  const updateDeal = (slot: string, key: string, val: any) => {
    setDeals(prev => prev.map(d => d.slot === slot ? { ...d, [key]: val } : d));
  };

  const bestDeal = savedDeals.find((d: any) => d.isBest);

  const handleSave = async (andFinish = false) => {
    if (!assessmentId) return;
    const filledDeals = deals.filter(d => u(d.amount) > 0);
    if (filledDeals.length === 0) {
      toast.error('กรุณากรอกข้อมูลดีลอย่างน้อย 1 ดีล');
      return;
    }
    setSaving(true);
    try {
      const res: any = await rdSaveS6(assessmentId, {
        deals: filledDeals.map(d => ({
          slot: d.slot, bankName: d.bankName || undefined,
          amount: u(d.amount), interestRate: Number(d.interestRate) || 7,
          tenureYears: Number(d.tenureYears) || 7,
          collateralRequired: d.collateralRequired || undefined,
          feeAmount: u(d.feeAmount) || undefined,
        })),
        businessMode,
        month1Plan: month1Plan || undefined, month2Plan: month2Plan || undefined, month3Plan: month3Plan || undefined,
      });
      if (res.dealResults) {
        setSavedDeals(res.dealResults);
        setDeals(prev => prev.map(d => {
          const found = res.dealResults.find((r: any) => r.slot === d.slot);
          return found ? { ...d, dealScore: found.dealScore, dscrAfterDeal: found.dscrAfterDeal, isBest: found.isBest } : d;
        }));
      }
      toast.success('บันทึกดีลแล้ว');
      await refresh();
      if (andFinish) setTimeout(() => router.push('/ib/report'), 600);
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
          <span className="text-[15px] font-semibold">Session 6 · เลือกดีลและวางแผน</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-6 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 6 of 6</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">เลือกดีลและวางแผนหลังกู้</h1>
          <p className="text-sm text-text-secondary mt-1">เปรียบเทียบข้อเสนอจากธนาคาร และวางแผน 90 วัน</p>
        </div>

        <RdSessionProgress current={6} completedFlags={flags} />

        {/* Best deal banner */}
        {bestDeal && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-4 flex items-center gap-3 anim-scale-in">
            <Trophy size={20} className="text-accent shrink-0" />
            <div>
              <div className="text-sm font-bold">ดีลที่แนะนำ: ดีล {bestDeal.slot} — {bestDeal.bankName || 'ธนาคาร'}</div>
              <div className="text-xs text-text-secondary">
                วงเงิน {money(Number(String(bestDeal.amount).replace(/[,\s]/g, '')))} | {bestDeal.interestRate}% | {bestDeal.tenureYears} ปี
                {bestDeal.dealScore && ` | Score: ${Number(bestDeal.dealScore).toFixed(0)}/100`}
              </div>
            </div>
          </div>
        )}

        {/* 3 Deal cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {deals.map((deal) => {
            const color = SLOT_COLORS[deal.slot] ?? '#94A3B8';
            const saved = savedDeals.find((s: any) => s.slot === deal.slot);
            return (
              <div key={deal.slot}
                className={`bg-bg-card border-2 rounded-2xl p-4 anim-fade-up ${saved?.isBest ? 'ring-2 ring-accent' : ''}`}
                style={{ borderColor: `${color}40`, background: `${color}05` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold" style={{ color }}>ดีล {deal.slot}</span>
                  {saved?.isBest && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1"><Star size={10} />แนะนำ</span>}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-text-tertiary">ชื่อธนาคาร</label>
                    <input value={deal.bankName} onChange={(e) => updateDeal(deal.slot, 'bankName', e.target.value)}
                      placeholder="เช่น กสิกร, SCB..."
                      className="w-full h-[34px] rounded-lg border border-border px-2.5 text-xs bg-bg-card text-text-primary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary">วงเงิน</label>
                    <NumberInput value={deal.amount} onChange={(v) => updateDeal(deal.slot, 'amount', maskCurrency(v))} compact suffix="฿" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-text-tertiary">ดอกเบี้ย %</label>
                      <input value={deal.interestRate} onChange={(e) => updateDeal(deal.slot, 'interestRate', e.target.value)}
                        placeholder="7" className="w-full h-[34px] rounded-lg border border-border px-2.5 text-xs num bg-bg-card text-text-primary outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-tertiary">เทอม (ปี)</label>
                      <input value={deal.tenureYears} onChange={(e) => updateDeal(deal.slot, 'tenureYears', e.target.value)}
                        placeholder="5" className="w-full h-[34px] rounded-lg border border-border px-2.5 text-xs num bg-bg-card text-text-primary outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary">หลักทรัพย์ที่ต้องการ</label>
                    <input value={deal.collateralRequired} onChange={(e) => updateDeal(deal.slot, 'collateralRequired', e.target.value)}
                      placeholder="โฉนด, เครื่องจักร..." className="w-full h-[34px] rounded-lg border border-border px-2.5 text-xs bg-bg-card text-text-primary outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary">ค่าธรรมเนียม</label>
                    <NumberInput value={deal.feeAmount} onChange={(v) => updateDeal(deal.slot, 'feeAmount', maskCurrency(v))} compact suffix="฿" />
                  </div>

                  {/* Saved scores */}
                  {saved?.dealScore != null && (
                    <div className="pt-2 border-t border-border space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-tertiary">Deal Score</span>
                        <span className="num font-bold">{Number(saved.dealScore).toFixed(0)}/100</span>
                      </div>
                      {saved.dscrAfterDeal != null && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-text-tertiary">DSCR หลังกู้</span>
                          <span className={`num font-bold ${Number(saved.dscrAfterDeal) >= 1.25 ? 'text-status-good' : 'text-status-bad'}`}>
                            {Number(saved.dscrAfterDeal).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 90-day execution plan */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4 anim-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-sm font-semibold">แผน 90 วันหลังได้รับเงินกู้</span>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium mb-2 block text-text-secondary">โหมดธุรกิจ</label>
            <div className="flex gap-3">
              {[
                { id: 'expanding' as const, label: 'กำลังขยาย' },
                { id: 'stable' as const, label: 'ทรงตัว/ปรับโครงสร้าง' },
              ].map((m) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="bmode" checked={businessMode === m.id} onChange={() => setBusinessMode(m.id)} className="w-4 h-4" />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'เดือนที่ 1', value: month1Plan, set: setMonth1Plan, ph: 'จะทำอะไรก่อน?' },
              { label: 'เดือนที่ 2', value: month2Plan, set: setMonth2Plan, ph: 'ขั้นตอนต่อไป?' },
              { label: 'เดือนที่ 3', value: month3Plan, set: setMonth3Plan, ph: 'เป้าหมาย 90 วัน?' },
            ].map((m) => (
              <div key={m.label}>
                <label className="text-xs font-medium mb-1 block text-text-secondary">{m.label}</label>
                <textarea value={m.value} onChange={(e) => m.set(e.target.value)} placeholder={m.ph} rows={3}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <button onClick={() => router.push('/ib/session/5-plan')}
            className="px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors">
            ← ย้อนกลับ
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors disabled:opacity-40">
              {saving ? 'กำลังคำนวณ...' : 'บันทึกและคำนวณ'}
            </button>
            <button onClick={() => handleSave(true)} disabled={deals.filter(d => u(d.amount) > 0).length === 0 || saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border-none disabled:opacity-40 transition-all gradient-accent">
              เสร็จสิ้น →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
