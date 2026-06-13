'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment, getCompletedSessions } from '@/lib/use-assessment';
import { rdSaveS4 } from '@/lib/api';
import { NumberInput } from '@/components/ui/number-input';
import { RdSessionProgress } from '@/components/ui/rd-session-progress';
import { ScoreRing } from '@/components/ui/score-ring';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Calculator } from 'lucide-react';

const METHODS = [
  { key: 'm1DebtCapacity', label: 'วิธีที่ 1: Debt Capacity', desc: 'EBITDA ÷ ยอดผ่อนรวม ≥ 1.25x → วงเงินสูงสุด', explain: 'ดูว่ากำไรพอจ่ายหนี้ไหม ถ้า DSCR ≥ 1.25 แปลว่ามีเงินเหลือหลังผ่อน แล้วคำนวณกลับว่ากู้ได้สูงสุดเท่าไหร่', color: '#CA8A04' },
  { key: 'm2Reverse', label: 'วิธีที่ 2: Reverse Calculation', desc: 'EBITDA − หนี้เดิม = เงินเหลือ → ผ่อนปลอดภัย → วงเงิน', explain: 'คิดจากเงินสดเหลือจริงหลังจ่ายหนี้เดิม แล้วเอาแค่ 50% มาผ่อน เพื่อเหลือเงินสำรอง', color: '#8B5CF6' },
  { key: 'm3RevenueMultiple', label: 'วิธีที่ 3: Revenue Multiple', desc: 'ยอดขาย/เดือน × 3 − หนี้เดิม', explain: 'ธนาคารมองว่ายอดขาย 1 บาท ควรรับหนี้ได้ไม่เกิน 3 บาท แล้วหักหนี้เดิมออก', color: '#3B82F6' },
  { key: 'm4WorkingCapital', label: 'วิธีที่ 4: Working Capital', desc: 'ยอดขาย/ปี × 20%', explain: 'สินเชื่อหมุนเวียน ธนาคารให้ประมาณ 20% ของรายได้ต่อปี เช่น ขายปีละ 200 ล้าน ได้ WC Loan ~40 ล้าน', color: '#22C55E' },
];

export default function Session4LoanPage() {
  const router = useRouter();
  const { assessmentId, assessment, loading, refresh } = useAssessment();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [annualRevenue, setAnnualRevenue] = useState('');
  const [annualEbitda, setAnnualEbitda] = useState('');
  const [existingMonthlyDebtService, setExistingMonthlyDebtService] = useState('');
  const [existingDebtBalance, setExistingDebtBalance] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [desiredLoan, setDesiredLoan] = useState('');
  const [assumedRate, setAssumedRate] = useState('7');
  const [assumedYears, setAssumedYears] = useState('7');

  useEffect(() => {
    if (!assessment) return;
    const s4 = assessment.s4;

    // Load S4 saved data only (no auto pre-fill from S2)
    if (s4) {
      if (s4.annualRevenue) setAnnualRevenue(maskCurrency(String(Math.round(Number(s4.annualRevenue)))));
      if (s4.annualEbitda) setAnnualEbitda(maskCurrency(String(Math.round(Number(s4.annualEbitda)))));
      if (s4.existingMonthlyDebtService) setExistingMonthlyDebtService(maskCurrency(String(Math.round(Number(s4.existingMonthlyDebtService)))));
      if (s4.existingDebtBalance) setExistingDebtBalance(maskCurrency(String(Math.round(Number(s4.existingDebtBalance)))));
      if (s4.collateralValue) setCollateralValue(maskCurrency(String(Math.round(Number(s4.collateralValue)))));
      if (s4.desiredLoan) setDesiredLoan(maskCurrency(String(Math.round(Number(s4.desiredLoan)))));
      if (s4.assumedRate) setAssumedRate(String(Number(s4.assumedRate) * 100));
      if (s4.assumedYears) setAssumedYears(String(s4.assumedYears));
      // Don't set result from DB — new formula fields not stored in DB
      // User needs to click "คำนวณวงเงิน" to see results
    }
  }, [assessment]);

  const flags = getCompletedSessions(assessment);
  const u = unmaskCurrency;

  const handleCalculate = async () => {
    if (!assessmentId || !annualRevenue || !annualEbitda) {
      toast.error('กรุณากรอก Revenue และ EBITDA ก่อน');
      return;
    }
    setSaving(true);
    try {
      const res: any = await rdSaveS4(assessmentId, {
        annualRevenue: u(annualRevenue), annualEbitda: u(annualEbitda),
        existingMonthlyDebtService: u(existingMonthlyDebtService),
        existingDebtBalance: u(existingDebtBalance),
        collateralValue: u(collateralValue),
        desiredLoan: u(desiredLoan) || undefined,
        assumedRate: (Number(assumedRate) || 7) / 100,
        assumedYears: Number(assumedYears) || 7,
      });
      setResult(res.result);
      toast.success('คำนวณวงเงินเรียบร้อย!');
      await refresh();
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
          <span className="text-[15px] font-semibold">Session 4 · ออกแบบวงเงิน</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-6 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 4 of 6</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">ออกแบบวงเงิน</h1>
          <p className="text-sm text-text-secondary mt-1">คำนวณวงเงินที่เหมาะสม 4 วิธี + ตรวจ DSCR หลังกู้</p>
        </div>

        <RdSessionProgress current={4} completedFlags={flags} />

        {false && (
          <div></div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Input */}
          <div className="space-y-4">
            <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
              <div className="text-sm font-semibold mb-4">ข้อมูลทางการเงิน</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block text-text-secondary">รายได้ต่อเดือน (Revenue) *</label>
                  <NumberInput value={annualRevenue} onChange={setAnnualRevenue} compact suffix="฿/เดือน" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-text-secondary">EBITDA ต่อเดือน *</label>
                  <NumberInput value={annualEbitda} onChange={setAnnualEbitda} compact suffix="฿/เดือน" />
                  {u(annualRevenue) > 0 && u(annualEbitda) > 0 && (
                    <div className="text-[10px] text-text-tertiary mt-1">EBITDA Margin: {((u(annualEbitda) / u(annualRevenue)) * 100).toFixed(1)}%</div>
                  )}
                </div>
                <div className="border-t border-border pt-3">
                  <label className="text-xs font-medium mb-1 block text-text-secondary">ผ่อนหนี้เดิมต่อเดือน</label>
                  <NumberInput value={existingMonthlyDebtService} onChange={setExistingMonthlyDebtService} compact suffix="฿/เดือน" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-text-secondary">ยอดหนี้คงเหลือรวม</label>
                  <NumberInput value={existingDebtBalance} onChange={setExistingDebtBalance} compact suffix="฿" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-text-secondary">มูลค่าหลักทรัพย์ค้ำประกัน</label>
                  <NumberInput value={collateralValue} onChange={setCollateralValue} compact suffix="฿" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-text-secondary">วงเงินที่ต้องการ (ถ้ามี)</label>
                  <NumberInput value={desiredLoan} onChange={setDesiredLoan} compact suffix="฿" />
                </div>
              </div>
            </div>

            {/* Advanced settings — collapsible */}
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              <button onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center gap-2 px-5 py-3 text-xs font-medium text-text-secondary bg-transparent border-none cursor-pointer hover:text-text-primary transition-colors text-left">
                <Calculator size={14} />
                สมมติฐานการคำนวณ
                <ChevronRight size={14} className={`ml-auto transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              </button>
              {showAdvanced && (
                <div className="px-5 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block text-text-secondary">อัตราดอกเบี้ย</label>
                      <NumberInput value={assumedRate} onChange={setAssumedRate} compact suffix="%/ปี" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block text-text-secondary">เทอมกู้</label>
                      <NumberInput value={assumedYears} onChange={setAssumedYears} compact suffix="ปี" />
                    </div>
                  </div>
                  <div className="text-[10px] text-text-tertiary">ใช้สำหรับคำนวณ DSCR หลังกู้ — ไม่ใช่เงื่อนไขจริงจากธนาคาร</div>
                </div>
              )}
            </div>

            <button onClick={handleCalculate} disabled={!annualRevenue || !annualEbitda || saving}
              className="w-full h-12 rounded-xl font-semibold text-sm cursor-pointer border-none disabled:opacity-40 transition-all gradient-accent flex items-center justify-center gap-2">
              <Calculator size={16} />
              {saving ? 'กำลังคำนวณ...' : 'คำนวณวงเงิน'}
            </button>
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* 4 Methods — colored cards */}
                <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
                  <div className="text-sm font-semibold mb-3">วงเงินจาก 4 วิธีคำนวณ</div>
                  <div className="space-y-2">
                    {METHODS.map((m) => {
                      const val = result[m.key];
                      return (
                        <div key={m.key} className="rounded-xl border p-3" style={{ borderColor: `${m.color}40`, background: `${m.color}08` }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</div>
                              <div className="text-[10px] text-text-tertiary">{m.desc}</div>
                            </div>
                            <span className="num text-sm font-bold" style={{ color: m.color }}>
                              {val != null ? money(Math.round(Number(val))) : 'N/A'}
                            </span>
                          </div>
                          <div className="text-[10px] text-text-secondary mt-2 leading-relaxed">{(m as any).explain}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended range */}
                <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 anim-fade-up">
                  <div className="text-sm font-bold text-accent mb-3">วงเงินแนะนำ</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-bg-primary rounded-xl p-2.5 border border-border">
                      <div className="text-[9px] text-text-tertiary">Conservative</div>
                      <div className="text-[8px] text-text-tertiary">ปลอดภัย</div>
                      <div className="num text-xs font-bold mt-0.5">{result.loanConservative ? money(Number(result.loanConservative)) : '—'}</div>
                    </div>
                    <div className="bg-accent/10 rounded-xl p-2.5 border border-accent/30">
                      <div className="text-[9px] text-accent">Practical ⭐</div>
                      <div className="text-[8px] text-accent/70">แนะนำ</div>
                      <div className="num text-xs font-bold text-accent mt-0.5">{result.loanPractical ? money(Number(result.loanPractical)) : '—'}</div>
                    </div>
                    <div className="bg-bg-primary rounded-xl p-2.5 border border-border">
                      <div className="text-[9px] text-text-tertiary">Stretch Max</div>
                      <div className="text-[8px] text-text-tertiary">สูงสุด</div>
                      <div className="num text-xs font-bold mt-0.5">{result.loanStretch ? money(Number(result.loanStretch)) : '—'}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-text-tertiary mt-3 leading-relaxed">
                    <strong>Conservative</strong> = วงเงินต่ำสุดจาก 4 วิธี (เสี่ยงน้อยสุด) · <strong>Practical</strong> = วงเงินจากวิธี Debt Capacity (สมดุลที่สุด) · <strong>Stretch Max</strong> = วงเงินสูงสุดที่ DSCR ยังผ่าน 1.25x (เสี่ยงสูง)
                  </div>
                </div>

                {/* DSCR before/after */}
                <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
                  <div className="text-sm font-semibold mb-3">วิเคราะห์ DSCR</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-bg-secondary rounded-xl p-3 text-center">
                      <div className="text-[10px] text-text-tertiary mb-1">DSCR ก่อนกู้</div>
                      <div className={`num text-xl font-bold ${result.dscrBefore != null && Number(result.dscrBefore) >= 1.25 ? 'text-status-good' : result.dscrBefore != null ? 'text-status-bad' : 'text-text-tertiary'}`}>
                        {result.dscrBefore != null ? Number(result.dscrBefore).toFixed(2) : '—'}
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">
                        {result.dscrBefore != null ? (Number(result.dscrBefore) >= 1.25 ? '✓ ผ่านเกณฑ์' : '⚠ ต่ำกว่าเกณฑ์') : 'ไม่มีหนี้เดิม'}
                      </div>
                    </div>
                    <div className="bg-bg-secondary rounded-xl p-3 text-center">
                      <div className="text-[10px] text-text-tertiary mb-1">DSCR หลังกู้</div>
                      <div className={`num text-xl font-bold ${result.dscrAfter != null && Number(result.dscrAfter) >= 1.25 ? 'text-status-good' : result.dscrAfter != null ? 'text-status-bad' : 'text-text-tertiary'}`}>
                        {result.dscrAfter != null ? Number(result.dscrAfter).toFixed(2) : '—'}
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">
                        {result.dscrAfter != null ? (Number(result.dscrAfter) >= 1.25 ? '✓ ยังจ่ายไหว' : '⚠ เกินกำลัง') : '—'}
                      </div>
                    </div>
                  </div>
                  <div className={`mt-3 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    result.verdict?.includes('✓') ? 'bg-wash-good text-status-good' : 'bg-wash-warn text-status-warn'
                  }`}>
                    {result.verdict}
                  </div>
                </div>

                {/* Capacity Score */}
                <div className="bg-bg-card border border-border rounded-2xl p-5 flex items-center justify-between anim-fade-up">
                  <div>
                    <div className="text-sm font-semibold">Capacity Score</div>
                    <div className="text-xs text-text-secondary">ความสามารถรับภาระหนี้ใหม่</div>
                  </div>
                  <ScoreRing score={result.capacityScore ?? 0} size={80} label="" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-text-tertiary gap-3">
                <Calculator size={48} strokeWidth={1} className="opacity-30" />
                <div className="text-center text-sm">กรอกข้อมูลและกด "คำนวณวงเงิน"<br />เพื่อดูผลการวิเคราะห์</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
          <button onClick={() => router.push('/ib/session/3-cashflow')}
            className="px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors">
            ← ย้อนกลับ
          </button>
          <button onClick={() => { if (result) router.push('/ib/session/5-plan'); else toast.error('กรุณาคำนวณก่อน'); }}
            disabled={!result}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border-none disabled:opacity-40 transition-all gradient-accent">
            ถัดไป: Bank Plan →
          </button>
        </div>
      </main>
    </div>
  );
}
