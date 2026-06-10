'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/format';
import { getSession, saveSession } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, TrendingUp, Target, Settings, Check } from 'lucide-react';

const QUESTIONS = [
  {
    key: 'revenueStability', label: 'รายได้สม่ำเสมอแค่ไหน',
    desc: 'ย้อนดู 6-12 เดือน — ยอดขายขึ้นลงมากไหม',
    options: [
      { value: 0.3, label: 'ผันผวนมาก', desc: 'ต่างกัน >30%', color: 'bad' as const },
      { value: 0.6, label: 'ค่อนข้างสม่ำเสมอ', desc: 'ไม่เกิน 20%', color: 'warn' as const },
      { value: 0.9, label: 'สม่ำเสมอมาก', desc: 'มีลูกค้าประจำ', color: 'good' as const },
    ],
  },
  {
    key: 'salesGrowth', label: 'ยอดขายเติบโตไหม',
    desc: 'เทียบปีนี้กับปีที่แล้ว',
    options: [
      { value: 0.2, label: 'ลดลง', desc: 'ลดจากปีก่อน', color: 'bad' as const },
      { value: 0.5, label: 'ทรงตัว', desc: 'เท่าเดิม ±5%', color: 'warn' as const },
      { value: 0.9, label: 'เติบโต', desc: 'เพิ่ม >10%', color: 'good' as const },
    ],
  },
  {
    key: 'useOfFundClear', label: 'รู้ชัดว่าจะกู้ทำอะไร',
    desc: 'กู้ไปทำอะไร กี่บาท เมื่อไหร่ เงินกลับมายังไง',
    options: [
      { value: 0, label: 'ยังไม่ชัด', desc: 'ยังไม่มีแผน', color: 'bad' as const },
      { value: 0.5, label: 'พอรู้', desc: 'ยังไม่ละเอียด', color: 'warn' as const },
      { value: 1, label: 'ชัดเจน', desc: 'มีแผน+ตัวเลข', color: 'good' as const },
    ],
  },
  {
    key: 'structureCorrect', label: 'เลือกสินเชื่อถูกประเภทไหม',
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
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [prevData, setPrevData] = useState<any>(null);
  const [done, setDone] = useState(false);
  const [animDir, setAnimDir] = useState<'in' | 'out'>('in');

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
        if (Object.keys(a).length === 4) setDone(true);
      }
    });
  }, []);

  const selectAnswer = useCallback((value: number) => {
    const q = QUESTIONS[currentQ];
    setAnswers(a => ({ ...a, [q.key]: value }));
    // Auto advance after short delay
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setAnimDir('out');
        setTimeout(() => { setCurrentQ(c => c + 1); setAnimDir('in'); }, 200);
      } else {
        setDone(true);
      }
    }, 400);
  }, [currentQ]);

  // Keyboard: Enter = confirm, arrow keys = navigate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === 'ArrowRight' && currentQ < QUESTIONS.length - 1) {
        setAnimDir('out');
        setTimeout(() => { setCurrentQ(c => c + 1); setAnimDir('in'); }, 200);
      }
      if (e.key === 'ArrowLeft' && currentQ > 0) {
        setAnimDir('out');
        setTimeout(() => { setCurrentQ(c => c - 1); setAnimDir('in'); }, 200);
      }
      if (e.key >= '1' && e.key <= '3') {
        const idx = parseInt(e.key) - 1;
        const q = QUESTIONS[currentQ];
        if (q.options[idx]) selectAnswer(q.options[idx].value);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQ, done, selectAnswer]);

  const answered = Object.keys(answers).length;
  const goodCount = QUESTIONS.filter(q => { const v = answers[q.key]; return q.options.find(o => o.value === v)?.color === 'good'; }).length;
  const warnCount = QUESTIONS.filter(q => { const v = answers[q.key]; return q.options.find(o => o.value === v)?.color === 'warn'; }).length;
  const badCount = QUESTIONS.filter(q => { const v = answers[q.key]; return q.options.find(o => o.value === v)?.color === 'bad'; }).length;

  let verdict = '';
  let verdictColor = 'var(--text-tertiary)';
  let verdictBg = 'bg-bg-card border border-border';
  if (answered === 4) {
    if (badCount >= 2) { verdict = 'ยังไม่พร้อม — ต้องเตรียมตัวก่อน'; verdictColor = 'var(--status-bad)'; verdictBg = 'bg-wash-bad'; }
    else if (badCount >= 1) { verdict = 'มีจุดอ่อน — ปรับก่อนยื่น'; verdictColor = 'var(--status-warn)'; verdictBg = 'bg-wash-warn'; }
    else if (warnCount >= 2) { verdict = 'พอใช้ — เตรียมเพิ่มอีกหน่อย'; verdictColor = 'var(--status-warn)'; verdictBg = 'bg-wash-warn'; }
    else { verdict = 'พร้อม — ธนาคารมองบวก'; verdictColor = 'var(--status-good)'; verdictBg = 'bg-wash-good'; }
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
      setTimeout(() => router.push('/ib/step/5-capital'), 800);
    } catch (e: any) { toast.error(e.message || 'บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  const q = QUESTIONS[currentQ];

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">Step 4 · มุมมองธนาคาร</span>
          <div className="flex-1" />
          <span className="num text-xs text-text-tertiary">{answered}/4</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        {/* Step progress */}
        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: s <= 4 ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        {/* Not done — Typeform style: one question at a time */}
        {!done && (
          <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
            {/* Question progress dots */}
            <div className="flex gap-2 mb-8">
              {QUESTIONS.map((_, i) => (
                <button key={i} onClick={() => { setAnimDir('out'); setTimeout(() => { setCurrentQ(i); setAnimDir('in'); }, 200); }}
                  className={`w-3 h-3 rounded-full cursor-pointer border-none transition-all ${
                    i === currentQ ? 'scale-125' : ''
                  }`}
                  style={{ background: answers[QUESTIONS[i].key] != null
                    ? (QUESTIONS[i].options.find(o => o.value === answers[QUESTIONS[i].key])?.color === 'good' ? 'var(--status-good)' : QUESTIONS[i].options.find(o => o.value === answers[QUESTIONS[i].key])?.color === 'warn' ? 'var(--status-warn)' : 'var(--status-bad)')
                    : i === currentQ ? 'var(--accent)' : 'var(--border)'
                  }} />
              ))}
            </div>

            {/* Question card */}
            <div className={`w-full max-w-lg transition-all duration-200 ${animDir === 'in' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="text-center mb-8">
                <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>คำถามที่ {currentQ + 1} จาก 4</div>
                <h2 className="text-xl md:text-2xl font-bold mt-2">{q.label}</h2>
                <p className="text-sm text-text-secondary mt-1">{q.desc}</p>
              </div>

              <div className="space-y-3">
                {q.options.map((opt, oi) => {
                  const selected = answers[q.key] === opt.value;
                  return (
                    <button key={opt.value} onClick={() => selectAnswer(opt.value)}
                      className={`w-full p-5 rounded-2xl text-left cursor-pointer transition-all border ${
                        selected ? optBg[opt.color] + ' scale-[1.02] shadow-lg' : 'border-border bg-bg-card hover:border-border-strong hover:shadow-md'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${selected ? '' : 'bg-bg-secondary'}`}
                          style={selected ? { background: opt.color === 'good' ? 'var(--status-good)' : opt.color === 'warn' ? 'var(--status-warn)' : 'var(--status-bad)' } : {}}>
                          {selected
                            ? <Check size={16} strokeWidth={3} color="#fff" />
                            : <span className="num text-xs font-bold text-text-tertiary">{oi + 1}</span>}
                        </div>
                        <div>
                          <div className={`text-base font-semibold ${selected ? optText[opt.color] : 'text-text-primary'}`}>{opt.label}</div>
                          <div className="text-xs text-text-tertiary mt-0.5">{opt.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="text-center text-[10px] text-text-tertiary mt-6">
                กด 1, 2, 3 เพื่อเลือก · ← → เปลี่ยนคำถาม
              </div>
            </div>

            {/* Nav arrows */}
            <div className="flex gap-4 mt-6">
              {currentQ > 0 && (
                <button onClick={() => { setAnimDir('out'); setTimeout(() => { setCurrentQ(c => c - 1); setAnimDir('in'); }, 200); }}
                  className="w-10 h-10 rounded-xl border border-border bg-bg-card flex items-center justify-center cursor-pointer">
                  <ChevronLeft size={18} color="var(--text-tertiary)" />
                </button>
              )}
              {currentQ < QUESTIONS.length - 1 && answers[q.key] != null && (
                <button onClick={() => { setAnimDir('out'); setTimeout(() => { setCurrentQ(c => c + 1); setAnimDir('in'); }, 200); }}
                  className="w-10 h-10 rounded-xl border border-border bg-bg-card flex items-center justify-center cursor-pointer">
                  <ChevronRight size={18} color="var(--text-tertiary)" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Done — Result */}
        {done && (
          <div className="anim-fade-up">
            <div className="text-center mb-6">
              <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Step 4 of 7</div>
              <h1 className="text-2xl font-bold mt-1">ธนาคารมองคุณยังไง</h1>
            </div>

            {/* Verdict */}
            <div className={`rounded-2xl p-6 mb-4 text-center ${verdictBg}`}>
              <div className="text-xl font-bold" style={{ color: verdictColor }}>{verdict}</div>
              <div className="flex gap-1.5 justify-center mt-3">
                {goodCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-wash-good text-status-good">{goodCount} ดี</span>}
                {warnCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-wash-warn text-status-warn">{warnCount} ระวัง</span>}
                {badCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-wash-bad text-status-bad">{badCount} ต้องปรับ</span>}
              </div>
            </div>

            {/* Answers summary */}
            <div className="bg-bg-card border border-border rounded-2xl p-4 mb-4">
              {QUESTIONS.map((q, i) => {
                const v = answers[q.key];
                const opt = q.options.find(o => o.value === v);
                return (
                  <div key={i} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt?.color === 'good' ? 'bg-status-good' : opt?.color === 'warn' ? 'bg-status-warn' : 'bg-status-bad'}`} />
                    <span className="text-sm text-text-secondary flex-1">{q.label}</span>
                    <span className={`text-sm font-semibold ${opt?.color === 'good' ? 'text-status-good' : opt?.color === 'warn' ? 'text-status-warn' : 'text-status-bad'}`}>{opt?.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Redo + Save */}
            <div className="flex gap-2">
              <button onClick={() => { setDone(false); setCurrentQ(0); setAnimDir('in'); }}
                className="flex-1 h-12 rounded-xl border border-border bg-bg-card text-sm font-semibold cursor-pointer text-text-primary">
                ตอบใหม่
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 h-12 rounded-xl font-semibold cursor-pointer border-none text-sm gradient-accent disabled:opacity-50">
                {saving ? 'กำลังบันทึก...' : 'บันทึก · ไป Step 5 →'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
