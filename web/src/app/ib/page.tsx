'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/format';
import { getBusiness, getSession } from '@/lib/api';
import { calcBusinessScore } from '@/lib/ib-score';
import { BusinessScoreBar } from '@/components/ui/business-score';
import { ScoreRing } from '@/components/ui/score-ring';
import { BottomNav } from '@/components/ui/bottom-nav';
import { IbWelcomeTour } from '@/components/ui/ib-welcome-tour';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const STEPS = [
  { num: 1, slug: 'ib-identity', label: 'ข้อมูลธุรกิจ', desc: 'ธุรกิจคุณคืออะไร', href: '/ib/step/1-identity' },
  { num: 2, slug: 'ib-financial', label: 'สแกนงบการเงิน', desc: 'กำไร · ชำระหนี้ · หนี้ต่อทุน · สภาพคล่อง', href: '/ib/step/2-financial' },
  { num: 3, slug: 'ib-cash-dna', label: 'กระแสเงินสด 4 ชั้น', desc: 'เงินเข้า → เงินจริง → เงินเหลือ → เงินโต', href: '/ib/step/3-cash-dna' },
  { num: 4, slug: 'ib-bank-view', label: 'มุมมองธนาคาร', desc: 'ธนาคารมองคุณยังไง — 4 มิติ', href: '/ib/step/4-bank-view' },
  { num: 5, slug: 'ib-capital', label: 'ออกแบบวงเงินกู้', desc: 'วัตถุประสงค์ · ทุน · หลักประกัน', href: '/ib/step/5-capital' },
  { num: 6, slug: 'ib-growth', label: 'กู้ได้เท่าไหร่', desc: 'วงเงิน 3 ระดับ — ปลอดภัย/สูงสุด/อันตราย', href: '/ib/step/6-growth' },
  { num: 7, slug: 'ib-loan-action', label: 'เตรียมยื่นกู้', desc: 'เอกสาร · เรื่องเล่า · แผนปฏิบัติ', href: '/ib/step/7-action' },
  { num: 8, slug: 'ib-bank-sim', label: 'Bank Simulation', desc: 'จำลองสัมภาษณ์สินเชื่อกับ Virtual RM', href: '/ib/bank-sim' },
];

interface HealthItem {
  metric: string;
  value: string;
  status: 'good' | 'warn' | 'bad' | 'none';
  note: string;
}

export default function IbDashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stepStatus, setStepStatus] = useState<Record<string, any>>({});
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState<HealthItem[]>([]);
  const [moves, setMoves] = useState<{ metric: string; text: string }[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [showAllSteps, setShowAllSteps] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const biz = await getBusiness();
        setBusiness(biz);

        const statuses: Record<string, any> = {};
        let fin: any = null, cash: any = null;

        for (const step of STEPS) {
          try {
            const res = await getSession(step.slug) as any;
            if (res?.data) {
              statuses[step.slug] = { done: true, verdict: res.verdict, computed: res.computed, data: res.data };
              if (step.slug === 'ib-financial') fin = res.computed;
              if (step.slug === 'ib-cash-dna') cash = res.computed;
            }
          } catch { /* not done */ }
        }

        setStepStatus(statuses);
        const { score: s, completed: c } = calcBusinessScore(statuses);
        setScore(s);

        // Build health summary
        if (fin || cash) {
          const h: HealthItem[] = [];
          if (fin?.dscr != null) {
            const v = fin.dscr;
            h.push({ metric: 'ความสามารถชำระหนี้ (DSCR)', value: v.toFixed(2), status: v >= 1.5 ? 'good' : v >= 1.25 ? 'warn' : 'bad', note: v >= 1.5 ? 'ชำระหนี้ได้ดี' : v >= 1.25 ? 'พอไหว — ควรเพิ่มกำไร' : 'ต่ำกว่าเกณฑ์ — ปรับโครงสร้างหนี้' });
          }
          if (fin?.de != null) {
            const v = fin.de;
            h.push({ metric: 'สัดส่วนหนี้ต่อทุน (D/E)', value: v.toFixed(2), status: v <= 2 ? 'good' : v <= 3 ? 'warn' : 'bad', note: v <= 2 ? 'หนี้ต่อทุนอยู่ในเกณฑ์ดี' : v <= 3 ? 'หนี้ค่อนข้างสูง' : 'หนี้สูงเกินไป — ลดหนี้/เพิ่มทุน' });
          }
          if (fin?.ebitdaMargin != null) {
            const v = fin.ebitdaMargin;
            h.push({ metric: 'อัตรากำไร (EBITDA Margin)', value: v.toFixed(1) + '%', status: v >= 15 ? 'good' : v >= 8 ? 'warn' : 'bad', note: v >= 15 ? 'กำไรก่อนหักหนี้ดี' : v >= 8 ? 'กำไรบาง — ลดต้นทุน' : 'กำไรต่ำ — ปรับราคาหรือลดต้นทุน' });
          }
          if (fin?.currentRatio != null) {
            const v = fin.currentRatio;
            h.push({ metric: 'สภาพคล่อง (Current Ratio)', value: v.toFixed(2), status: v >= 1.5 ? 'good' : v >= 1.0 ? 'warn' : 'bad', note: v >= 1.5 ? 'สภาพคล่องดี' : v >= 1.0 ? 'สภาพคล่องพอใช้' : 'สภาพคล่องต่ำ — เสี่ยง' });
          }
          if (cash?.growthCash != null) {
            const v = cash.growthCash;
            h.push({ metric: 'เงินเหลือสำหรับเติบโต', value: money(v), status: v > 0 ? 'good' : v >= 0 ? 'warn' : 'bad', note: v > 0 ? 'มีเงินเหลือหลังจ่ายหมดแล้ว' : v >= 0 ? 'เท่าทุน — ไม่มีเงินเหลือโต' : 'ติดลบ — ต้องอุดรอยรั่วก่อน' });
          }
          setHealth(h);

          // Build 3 Moves
          const m: { metric: string; text: string }[] = [];
          if (fin?.dscr != null && fin.dscr < 1.5) m.push({ metric: 'ความสามารถชำระหนี้', text: `ยกระดับจาก ${fin.dscr.toFixed(2)} ไป ≥1.5 — ลดค่างวดหรือเพิ่มกำไร` });
          if (cash?.growthCash < 0) m.push({ metric: 'เงินเหลือสำหรับเติบโต', text: `อุดรอยรั่ว เงินเหลือติดลบ ${money(cash.growthCash)} — ลดค่าใช้จ่ายหรือเพิ่มรายได้` });
          if (fin?.de != null && fin.de > 2.5) m.push({ metric: 'สัดส่วนหนี้ต่อทุน', text: `ลดหนี้ให้ต่ำกว่า 2.5 เท่า (ตอนนี้ ${fin.de.toFixed(2)})` });
          if (fin?.currentRatio != null && fin.currentRatio < 1.0) m.push({ metric: 'สภาพคล่อง', text: `สภาพคล่อง ${fin.currentRatio.toFixed(2)} ต่ำเกินไป — เพิ่มเงินสด/ลดหนี้สั้น` });
          setMoves(m.slice(0, 3));

          // Radar chart
          const normalize = (val: number, max: number) => Math.min(100, Math.max(0, (val / max) * 100));
          setRadarData([
            { dimension: 'ชำระหนี้', value: fin?.dscr != null ? normalize(fin.dscr, 2) : 0, fullMark: 100 },
            { dimension: 'กำไร', value: fin?.ebitdaMargin != null ? normalize(fin.ebitdaMargin, 25) : 0, fullMark: 100 },
            { dimension: 'สภาพคล่อง', value: fin?.currentRatio != null ? normalize(fin.currentRatio, 2) : 0, fullMark: 100 },
            { dimension: 'เงินเหลือโต', value: cash?.growthCash != null ? (cash.growthCash > 0 ? 80 : cash.growthCash >= 0 ? 40 : 10) : 0, fullMark: 100 },
            { dimension: 'หนี้ต่อทุน', value: fin?.de != null ? normalize(Math.max(0, 4 - fin.de), 4) : 0, fullMark: 100 },
            { dimension: 'จ่ายหนี้ทันที', value: fin?.quickRatio != null ? normalize(fin.quickRatio, 1.5) : 0, fullMark: 100 },
          ]);
        }
      } catch {
        router.push('/select');
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const completed = STEPS.filter(s => stepStatus[s.slug]?.done).length;
  const nextStep = STEPS.find(s => !stepStatus[s.slug]?.done);
  const statusColor = (s: string) => s === 'good' ? 'bg-status-good' : s === 'warn' ? 'bg-status-warn' : s === 'bad' ? 'bg-status-bad' : 'bg-border';
  const statusText = (s: string) => s === 'good' ? 'text-status-good' : s === 'warn' ? 'text-status-warn' : s === 'bad' ? 'text-status-bad' : 'text-text-tertiary';

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-32.png" alt="WW" width={24} height={24} className="rounded" />
            <span className="text-[15px] font-semibold">WinWin Analyzer</span>
          </div>
          <span className="text-xs text-text-tertiary">{(business as any)?.name}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">Inside Bank</h1>
        <p className="text-sm text-text-secondary mb-6">สแกนธุรกิจพร้อมกู้ — เห็นภาพรวมและจุดที่ต้องแก้จากมุมมองธนาคาร</p>

        {/* Score Ring */}
        <div data-tour="ib-score" className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col items-center anim-fade-up">
          <ScoreRing score={score} size={180} />
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: STEPS.length }).map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < completed ? 'bg-accent' : 'bg-border'}`} />
            ))}
          </div>
          <div className="text-[10px] text-text-tertiary mt-1.5">{completed}/{STEPS.length} steps</div>
        </div>

        {/* Report button */}
        {completed >= 3 && (
          <button data-tour="ib-report" onClick={() => router.push('/ib/report')}
            className="w-full mt-4 h-12 rounded-xl gradient-accent text-white font-semibold cursor-pointer border-none text-sm hover:opacity-90 transition">
            ดู MRI Report →
          </button>
        )}

        {/* Health Summary + Radar Chart */}
        {health.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Radar */}
            <div className="bg-bg-card border border-border rounded-2xl p-4 anim-fade-up">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-2">ภาพรวมสุขภาพธุรกิจ</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Health items */}
            <div className="bg-bg-card border border-border rounded-2xl p-4 anim-fade-up anim-d2">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-3">ตัวชี้วัดสำคัญ</div>
              <div className="space-y-3">
                {health.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor(h.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-medium">{h.metric}</span>
                        <span className={`num text-sm font-bold ${statusText(h.status)}`}>{h.value}</span>
                      </div>
                      <div className="text-[11px] text-text-tertiary">{h.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3 Moves */}
        {moves.length > 0 && (
          <div data-tour="ib-moves" className="mt-4 bg-bg-card border border-border rounded-2xl p-4 anim-fade-up anim-d3">
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-3">สิ่งที่ต้องแก้ไข</div>
            {moves.map((m, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-t border-border first:border-t-0">
                <div className="w-6 h-6 rounded-lg bg-wash-bad flex items-center justify-center shrink-0">
                  <span className="num text-xs font-bold text-status-bad">{i + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">{m.metric}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{m.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No data prompt */}
        {health.length === 0 && (
          <div className="mt-6 bg-bg-card border border-border rounded-2xl p-6 text-center anim-fade-up">
            <div className="text-lg font-semibold mb-2">เริ่มสแกนธุรกิจ</div>
            <p className="text-sm text-text-secondary mb-4">ทำ Step 1-3 เพื่อเห็นภาพรวมสุขภาพธุรกิจ และคำแนะนำจากมุมแบงก์</p>
            <button onClick={() => router.push('/ib/step/1-identity')}
              className="px-6 h-11 rounded-xl bg-text-primary text-bg-primary font-semibold text-sm cursor-pointer border-none">
              เริ่ม Step 1 →
            </button>
          </div>
        )}

        {/* Steps — IBF-style checklist */}
        <div data-tour="ib-steps" className="mt-6 bg-bg-card border border-border rounded-2xl overflow-hidden anim-fade-up anim-d4">
          <button onClick={() => setShowAllSteps(!showAllSteps)}
            className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-transparent border-none text-left">
            {/* Progress ring */}
            <div className="relative w-10 h-10 shrink-0">
              <svg width="40" height="40" viewBox="0 0 40 40" className="rotate-[-90deg]">
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle cx="20" cy="20" r="17" fill="none" stroke={completed === STEPS.length ? 'var(--status-good)' : 'var(--accent)'} strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 17}`} strokeDashoffset={`${2 * Math.PI * 17 * (1 - completed / STEPS.length)}`}
                  strokeLinecap="round" className="transition-all duration-500" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center num text-[11px] font-bold">{completed}/{STEPS.length}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">สแกนธุรกิจ</div>
              <div className="text-[11px] text-text-secondary">
                {completed === STEPS.length ? 'ทำครบทุก Step แล้ว' : nextStep ? `ถัดไป: ${nextStep.label}` : ''}
              </div>
            </div>
            {!showAllSteps && nextStep && (
              <a href={nextStep.href} onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent text-white no-underline">
                เริ่มทำ →
              </a>
            )}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"
              className={`shrink-0 transition-transform ${showAllSteps ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </button>

          {showAllSteps && (
            <div className="border-t border-border">
              {STEPS.map((step) => {
                const status = stepStatus[step.slug];
                const done = status?.done;
                const verdict = status?.verdict;
                return (
                  <a key={step.slug} href={step.href}
                    className="group flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-bg-secondary transition-colors border-b border-border last:border-b-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-status-good' : 'border-[1.5px] border-border-strong'}`}>
                      {done ? (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7l3 3 5-6"/></svg>
                      ) : (
                        <span className="num text-[9px] font-bold text-text-tertiary">{step.num}</span>
                      )}
                    </div>
                    <span className={`flex-1 text-[13px] font-medium ${done ? 'text-text-secondary' : 'text-text-primary'}`}>{step.label}</span>
                    {done && verdict ? (
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${verdict === 'green' ? 'text-status-good bg-wash-good' : verdict === 'yellow' ? 'text-status-warn bg-wash-warn' : 'text-status-bad bg-wash-bad'}`}>
                        {verdict === 'green' ? 'ดี' : verdict === 'yellow' ? 'ระวัง' : 'แก้ไข'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-text-tertiary">ยังไม่ได้ทำ</span>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
      <IbWelcomeTour />
    </div>
  );
}
