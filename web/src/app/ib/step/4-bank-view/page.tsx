'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/format';
import { getSession, saveSession } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, TrendingUp, Target, FileCheck, Settings } from 'lucide-react';

const QUESTIONS = [
  {
    key: 'revenueStability', label: 'รายได้สม่ำเสมอแค่ไหน', Icon: TrendingUp,
    desc: 'ย้อนดู 6-12 เดือน — ยอดขายขึ้นลงมากไหม',
    options: [
      { value: 0.3, label: 'ผันผวนมาก', desc: 'ต่างกัน >30%', color: 'bad' as const },
      { value: 0.6, label: 'ค่อนข้างสม่ำเสมอ', desc: 'ไม่เกิน 20%', color: 'warn' as const },
      { value: 0.9, label: 'สม่ำเสมอมาก', desc: 'มีลูกค้าประจำ', color: 'good' as const },
    ],
  },
  {
    key: 'salesGrowth', label: 'ยอดขายเติบโตไหม', Icon: TrendingUp,
    desc: 'เทียบปีนี้กับปีที่แล้ว',
    options: [
      { value: 0.2, label: 'ลดลง', desc: 'ลดจากปีก่อน', color: 'bad' as const },
      { value: 0.5, label: 'ทรงตัว', desc: 'เท่าเดิม ±5%', color: 'warn' as const },
      { value: 0.9, label: 'เติบโต', desc: 'เพิ่ม >10%', color: 'good' as const },
    ],
  },
  {
    key: 'useOfFundClear', label: 'รู้ชัดว่าจะกู้ทำอะไร', Icon: Target,
    desc: 'กู้ไปทำอะไร กี่บาท เมื่อไหร่ เงินกลับมายังไง',
    options: [
      { value: 0, label: 'ยังไม่ชัด', desc: 'ยังไม่มีแผน', color: 'bad' as const },
      { value: 0.5, label: 'พอรู้', desc: 'ยังไม่ละเอียด', color: 'warn' as const },
      { value: 1, label: 'ชัดเจน', desc: 'มีแผน+ตัวเลข', color: 'good' as const },
    ],
  },
  {
    key: 'structureCorrect', label: 'เลือกสินเชื่อถูกประเภทไหม', Icon: Settings,
    desc: 'เงินทุนหมุนเวียน vs สินเชื่อระยะยาว vs เช่าซื้อ',
    options: [
      { value: 0, label: 'ไม่แน่ใจ', desc: 'ไม่รู้ควรกู้แบบไหน', color: 'bad' as const },
      { value: 0.5, label: 'พอเข้าใจ', desc: 'รู้แต่ไม่มั่นใจ', color: 'warn' as const },
      { value: 1, label: 'ถูกต้อง', desc: 'ตรงกับวัตถุประสงค์', color: 'good' as const },
    ],
  },
];

const optBg = { good: 'border-status-good bg-wash-good', warn: 'border-status-warn bg-wash-warn', bad: 'border-status-bad bg-wash-bad' };
const optText = { good: 'text-status-good', warn: 'text-status-warn', bad: 'text-status-bad' };

export default function IbStep4Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [prevData, setPrevData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      getSession('ib-financial').catch(() => null),
      getSession('ib-cash-dna').catch(() => null),
      getSession('ib-bank-view').catch(() => null),
    ]).then(([fin, cash, bv]) => {
      const fc = (fin as any)?.computed;
      const cc = (cash as any)?.computed;
      if (fc || cc) setPrevData({ ebitdaMargin: fc?.ebitdaMargin, dscr: fc?.dscr, de: fc?.de, cycleDays: fc?.cashCycle?.ccc || 0, growthCash: cc?.growthCash || 0 });
      const d = (bv as any)?.data;
      if (d) {
        const a: Record<string, number> = {};
        QUESTIONS.forEach(q => { if (d[q.key] != null) a[q.key] = d[q.key]; });
        setAnswers(a);
      }
    });
  }, []);

  const answered = Object.keys(answers).length;

  // Compute live verdict per question
  const getQStatus = (key: string) => {
    const v = answers[key];
    if (v == null) return null;
    const q = QUESTIONS.find(q => q.key === key);
    return q?.options.find(o => o.value === v)?.color || null;
  };
  const goodCount = QUESTIONS.filter(q => getQStatus(q.key) === 'good').length;
  const warnCount = QUESTIONS.filter(q => getQStatus(q.key) === 'warn').length;
  const badCount = QUESTIONS.filter(q => getQStatus(q.key) === 'bad').length;

  let verdict = '';
  let verdictColor = 'var(--text-tertiary)';
  let verdictBg = 'bg-bg-card border border-border';
  if (answered === 4) {
    if (badCount >= 2) { verdict = 'ยังไม่พร้อม — ต้องเตรียมตัวก่อนเสนอแบงก์'; verdictColor = 'var(--status-bad)'; verdictBg = 'bg-wash-bad'; }
    else if (badCount >= 1) { verdict = 'มีจุดอ่อน — ต้องปรับก่อนยื่น'; verdictColor = 'var(--status-warn)'; verdictBg = 'bg-wash-warn'; }
    else if (warnCount >= 2) { verdict = 'พอใช้ — เตรียมเพิ่มอีกหน่อย'; verdictColor = 'var(--status-warn)'; verdictBg = 'bg-wash-warn'; }
    else { verdict = 'พร้อม — ธนาคารน่าจะมองบวก'; verdictColor = 'var(--status-good)'; verdictBg = 'bg-wash-good'; }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession('ib-bank-view', {
        ...answers,
        ebitdaMargin: prevData?.ebitdaMargin || 0, dscr: prevData?.dscr || 0,
        de: prevData?.de || 0, cycleDays: prevData?.cycleDays || 0,
        growthCash: prevData?.growthCash || 0,
      });
      toast.success('บันทึกสำเร็จ');
      setSaved(true);
    } catch (e: any) { toast.error(e.message || 'บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">Step 4 · มุมมองธนาคาร</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-4 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Step 4 of 7</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">ธนาคารมองคุณยังไง</h1>
          <p className="text-sm text-text-secondary mt-1">ตอบ 4 คำถาม — ดูว่าธนาคารจะมองธุรกิจคุณอย่างไร</p>
        </div>

        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: s <= 4 ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        {/* Auto metrics from Step 2-3 */}
        {prevData && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mb-5 anim-fade-up">
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-3">ตัวเลขจริงจากงบ (Step 2-3)</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-[10px] text-text-tertiary">ชำระหนี้</div>
                <div className={`num text-base font-bold ${prevData.dscr >= 1.5 ? 'text-status-good' : prevData.dscr >= 1.25 ? 'text-status-warn' : 'text-status-bad'}`}>{prevData.dscr?.toFixed(2) || '—'}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-text-tertiary">หนี้ต่อทุน</div>
                <div className={`num text-base font-bold ${prevData.de <= 2 ? 'text-status-good' : prevData.de <= 3 ? 'text-status-warn' : 'text-status-bad'}`}>{prevData.de?.toFixed(2) || '—'}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-text-tertiary">เงินเหลือเติบโต</div>
                <div className={`num text-base font-bold ${prevData.growthCash >= 0 ? 'text-status-good' : 'text-status-bad'}`}>{money(prevData.growthCash)}</div>
              </div>
            </div>
          </div>
        )}

        {!prevData && (
          <div className="bg-wash-warn rounded-xl p-4 mb-5 text-sm">กรุณาทำ Step 2-3 ก่อน เพื่อให้คะแนนแม่นยำ</div>
        )}

        {/* Questions */}
        <div className="space-y-4 mb-5">
          {QUESTIONS.map((q, qi) => {
            const qStatus = getQStatus(q.key);
            return (
              <div key={q.key} className={`bg-bg-card rounded-2xl p-4 anim-fade-up transition-colors border ${qStatus ? (qStatus === 'good' ? 'border-status-good/30' : qStatus === 'warn' ? 'border-status-warn/30' : 'border-status-bad/30') : 'border-border'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${qStatus ? (qStatus === 'good' ? 'bg-wash-good' : qStatus === 'warn' ? 'bg-wash-warn' : 'bg-wash-bad') : 'bg-bg-secondary'}`}>
                    {qStatus
                      ? <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke={qStatus === 'good' ? 'var(--status-good)' : qStatus === 'warn' ? 'var(--status-warn)' : 'var(--status-bad)'} strokeWidth="2.5" strokeLinecap="round"><path d="M3 7l3 3 5-6"/></svg>
                      : <span className="num text-[10px] font-bold text-text-tertiary">{qi + 1}</span>
                    }
                  </div>
                  <span className="text-sm font-semibold">{q.label}</span>
                </div>
                <div className="text-xs text-text-tertiary mb-3 ml-8">{q.desc}</div>
                <div className="grid grid-cols-3 gap-2 ml-8">
                  {q.options.map((opt) => {
                    const selected = answers[q.key] === opt.value;
                    return (
                      <button key={opt.value}
                        onClick={() => { setAnswers(a => ({ ...a, [q.key]: opt.value })); setSaved(false); }}
                        className={`p-2.5 rounded-xl text-left cursor-pointer transition-all border ${selected ? optBg[opt.color] : 'border-border bg-bg-secondary hover:border-border-strong'}`}>
                        <div className={`text-xs font-semibold ${selected ? optText[opt.color] : 'text-text-primary'}`}>{opt.label}</div>
                        <div className="text-[10px] text-text-tertiary mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live verdict */}
        {answered === 4 && (
          <div className={`rounded-2xl p-5 mb-5 ${verdictBg}`}>
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-2">ผลประเมิน</div>
            <div className="text-lg font-bold" style={{ color: verdictColor }}>{verdict}</div>
            <div className="flex gap-1.5 mt-3">
              {goodCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-wash-good text-status-good">{goodCount} ดี</span>}
              {warnCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-wash-warn text-status-warn">{warnCount} ระวัง</span>}
              {badCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-wash-bad text-status-bad">{badCount} ต้องปรับ</span>}
            </div>
          </div>
        )}

        {/* Save + Next */}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || answered < 4}
            className="flex-1 rounded-xl font-semibold cursor-pointer border-none text-sm disabled:opacity-40 transition-all gradient-accent"
            style={{ height: 48 }}>
            {saving ? 'กำลังบันทึก...' : answered < 4 ? `ตอบอีก ${4 - answered} ข้อ` : saved ? 'บันทึกแล้ว' : 'บันทึก'}
          </button>
          {saved && (
            <button onClick={() => router.push('/ib/step/5-capital')}
              className="flex-1 rounded-xl border border-border bg-bg-card font-semibold cursor-pointer text-sm text-text-primary"
              style={{ height: 48 }}>
              ไป Step 5 →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
