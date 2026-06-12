'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment, getCompletedSessions } from '@/lib/use-assessment';
import { rdSaveS1 } from '@/lib/api';
import { RdSessionProgress } from '@/components/ui/rd-session-progress';
import { ScoreRing } from '@/components/ui/score-ring';
import { toast } from 'sonner';
import { ChevronLeft, AlertTriangle, ShieldCheck, Lightbulb } from 'lucide-react';

const OPERATOR_FLAGS = [
  { key: 'doEverything', label: 'ทำทุกอย่างเอง ไม่มีทีม' },
  { key: 'noFinancials', label: 'ไม่มีงบการเงิน / ไม่รู้ตัวเลข' },
  { key: 'noCashflow', label: 'ไม่รู้ Cash Flow รายเดือน' },
  { key: 'noGoal', label: 'ไม่มีเป้าหมายธุรกิจชัดเจน' },
  { key: 'fearDebt', label: 'กลัวหนี้ / มองว่าหนี้ = ภาระ' },
  { key: 'noSystem', label: 'ไม่มีระบบบัญชี / ใช้เงินสดล้วน' },
  { key: 'revenueOnly', label: 'สนใจแค่ยอดขาย ไม่สนกำไร' },
  { key: 'noExpansionPlan', label: 'ยังไม่มีแผนขยายธุรกิจ' },
];

const OWNER_FLAGS = [
  { key: 'hasTeam', label: 'มีทีมงานรับผิดชอบแต่ละส่วน' },
  { key: 'knowsNumbers', label: 'รู้ตัวเลขธุรกิจ: Revenue, EBITDA, DSCR' },
  { key: 'hasCashflowPlan', label: 'วางแผน Cash Flow ล่วงหน้า' },
  { key: 'hasExpansionGoal', label: 'มีเป้าหมายขยายธุรกิจชัดเจน' },
  { key: 'debtIsLeverage', label: 'มองหนี้ดีเป็น Leverage ไม่ใช่ภาระ' },
  { key: 'hasAccounting', label: 'มีระบบบัญชีและงบการเงิน' },
  { key: 'focusProfit', label: 'โฟกัสกำไรและ Cash Flow มากกว่ายอดขาย' },
  { key: 'hasStrategy', label: 'มีกลยุทธ์ธุรกิจและแผนการเงิน' },
];

const LEVERAGE_CHOICES = [
  { id: 'B', label: 'กู้เพื่อขยาย', desc: 'มีแผนชัดเจน รู้ว่าเงินไปทำอะไร', color: '#22C55E' },
  { id: 'A', label: 'ใช้เงินตัวเอง', desc: 'ไม่อยากมีหนี้ ขยายช้าๆ แต่มั่นคง', color: '#3B82F6' },
  { id: 'C', label: 'กู้เพราะจำเป็น', desc: 'เงินสดตึง ต้องการทุนหมุน', color: '#F59E0B' },
  { id: 'D', label: 'ยังไม่แน่ใจ', desc: 'ต้องการข้อมูลเพิ่มก่อนตัดสินใจ', color: '#94A3B8' },
];

export default function Session1MindsetPage() {
  const router = useRouter();
  const { assessmentId, assessment, loading, refresh } = useAssessment();
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState<any>(null);

  const [operatorFlags, setOperatorFlags] = useState<Record<string, boolean>>({});
  const [ownerFlags, setOwnerFlags] = useState<Record<string, boolean>>({});
  const [leverageChoice, setLeverageChoice] = useState('');
  const [expansionGoal, setExpansionGoal] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [biggestWorry, setBiggestWorry] = useState('');
  const [leverageReason, setLeverageReason] = useState('');

  useEffect(() => {
    if (!assessment?.s1) return;
    const s = assessment.s1;
    if (s.operatorFlags) setOperatorFlags(s.operatorFlags);
    if (s.ownerFlags) setOwnerFlags(s.ownerFlags);
    if (s.leverageChoice) setLeverageChoice(s.leverageChoice);
    if (s.expansionGoal) setExpansionGoal(s.expansionGoal);
    if (s.loanPurpose) setLoanPurpose(s.loanPurpose);
    if (s.biggestWorry) setBiggestWorry(s.biggestWorry);
    if (s.leverageReason) setLeverageReason(s.leverageReason);
    if (s.ownerMindsetScore != null) {
      setScores({
        ownerMindsetScore: s.ownerMindsetScore,
        operatorScore: s.operatorScore,
        ownerScore: s.ownerScore,
        verdict: s.verdict,
        readiness: s.readiness,
      });
    }
  }, [assessment?.s1]);

  const flags = getCompletedSessions(assessment);

  const toggleFlag = (group: 'operator' | 'owner', key: string) => {
    if (group === 'operator') {
      setOperatorFlags(prev => ({ ...prev, [key]: !prev[key] }));
    } else {
      setOwnerFlags(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const operatorCount = Object.values(operatorFlags).filter(Boolean).length;
  const ownerCount = Object.values(ownerFlags).filter(Boolean).length;

  const handleSave = async (andNavigate = false) => {
    if (!assessmentId || !leverageChoice) {
      toast.error('กรุณาเลือกท่าทีการกู้เงิน');
      return;
    }
    setSaving(true);
    try {
      const result: any = await rdSaveS1(assessmentId, {
        operatorFlags, ownerFlags, leverageChoice, leverageReason,
        expansionGoal: expansionGoal || null,
        loanPurpose: loanPurpose || null,
        biggestWorry: biggestWorry || null,
      });
      setScores(result.scores);
      toast.success('บันทึก Mindset แล้ว');
      await refresh();
      if (andNavigate) {
        setTimeout(() => router.push('/ib/session/2-financial'), 600);
      }
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
          <span className="text-[15px] font-semibold">Session 1 · Mindset ผู้ประกอบการ</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-6 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 1 of 6</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Mindset ผู้ประกอบการ</h1>
          <p className="text-sm text-text-secondary mt-1">ประเมิน Mindset และความพร้อมทางความคิด</p>
        </div>

        <RdSessionProgress current={1} completedFlags={flags} />

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Left column: Operator + Owner flags */}
          <div className="space-y-4">
            {/* Operator behaviors (negative) */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-status-bad shrink-0" />
                <span className="text-sm font-semibold">พฤติกรรม Operator (ติ๊กถ้าตรงกับตัวเอง)</span>
              </div>
              <div className="text-xs text-text-tertiary mb-4">Operator = ทำทุกอย่างเอง ไม่มีระบบ → ธนาคารมองว่าเสี่ยง</div>
              <div className="space-y-1.5">
                {OPERATOR_FLAGS.map((f) => (
                  <label key={f.key} className="flex items-center gap-3 py-1.5 cursor-pointer">
                    <input type="checkbox" checked={operatorFlags[f.key] ?? false} onChange={() => toggleFlag('operator', f.key)}
                      className="w-4.5 h-4.5 rounded shrink-0" />
                    <span className="text-sm">{f.label}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-text-tertiary mt-3">เลือก {operatorCount}/{OPERATOR_FLAGS.length} รายการ</div>
            </div>

            {/* Owner mindset (positive) */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up anim-d1">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-status-good shrink-0" />
                <span className="text-sm font-semibold">พฤติกรรม Owner (ติ๊กถ้าตรงกับตัวเอง)</span>
              </div>
              <div className="text-xs text-text-tertiary mb-4">Owner = มีระบบ รู้ตัวเลข วางแผนได้ → ธนาคารมองว่าน่าเชื่อถือ</div>
              <div className="space-y-1.5">
                {OWNER_FLAGS.map((f) => (
                  <label key={f.key} className="flex items-center gap-3 py-1.5 cursor-pointer">
                    <input type="checkbox" checked={ownerFlags[f.key] ?? false} onChange={() => toggleFlag('owner', f.key)}
                      className="w-4.5 h-4.5 rounded shrink-0" />
                    <span className="text-sm">{f.label}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-text-tertiary mt-3">เลือก {ownerCount}/{OWNER_FLAGS.length} รายการ</div>
            </div>
          </div>

          {/* Right column: Leverage choice + text fields + score */}
          <div className="space-y-4">
            {/* Leverage choice */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 anim-fade-up anim-d2">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-status-warn shrink-0" />
                <span className="text-sm font-semibold">คุณมองเรื่องการกู้เงินอย่างไร? *</span>
              </div>
              <div className="space-y-2">
                {LEVERAGE_CHOICES.map((c) => {
                  const selected = leverageChoice === c.id;
                  return (
                    <button key={c.id} onClick={() => setLeverageChoice(c.id)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all text-left ${
                        selected ? 'border-accent bg-accent/5' : 'border-border bg-transparent hover:bg-bg-secondary'
                      }`}>
                      <div className={`w-4.5 h-4.5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                        selected ? 'border-accent' : 'border-border-strong'
                      }`}>
                        {selected && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{c.label}</div>
                        <div className="text-[11px] text-text-tertiary">{c.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text fields — always visible */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-4 anim-fade-up anim-d3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">เป้าหมายขยายธุรกิจของคุณคืออะไร?</label>
                <textarea value={expansionGoal} onChange={(e) => setExpansionGoal(e.target.value)}
                  placeholder="เช่น เปิดสาขาที่ 2, ซื้อเครื่องจักรใหม่, ขยายทีมขาย..."
                  rows={2}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">ถ้ากู้ จะเอาเงินไปทำอะไร?</label>
                <textarea value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="เช่น ซื้อสต็อก, ลงทุนเครื่องจักร, เพิ่มทุนหมุนเวียน..."
                  rows={2}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">ความกังวลใหญ่สุดเรื่องการเงินตอนนี้คืออะไร?</label>
                <textarea value={biggestWorry} onChange={(e) => setBiggestWorry(e.target.value)}
                  placeholder="เช่น เงินสดไม่พอ, กลัวกู้ไม่ผ่าน, ไม่รู้จะเริ่มต้นยังไง..."
                  rows={2}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
              </div>
            </div>

            {/* Score display after save */}
            {scores && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 anim-scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-accent">Mindset Score</div>
                    <div className="text-xs text-text-secondary mt-1">{scores.verdict}</div>
                    <div className="text-xs font-medium mt-1">{scores.readiness}</div>
                  </div>
                  <ScoreRing score={scores.ownerMindsetScore} size={100} label="" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-bg-primary rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-text-tertiary">Owner Score</div>
                    <div className="num text-lg font-bold text-status-good">{scores.ownerScore}</div>
                  </div>
                  <div className="bg-bg-primary rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-text-tertiary">Operator Score</div>
                    <div className="num text-lg font-bold text-status-warn">{scores.operatorScore}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions — matching source: ย้อนกลับ / บันทึก / ถัดไป */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
          <button onClick={() => router.push('/ib')}
            className="px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors">
            ← ย้อนกลับ
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors disabled:opacity-40">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button onClick={() => handleSave(true)} disabled={!leverageChoice || saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border-none disabled:opacity-40 transition-all gradient-accent">
              ถัดไป: สุขภาพการเงิน →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
