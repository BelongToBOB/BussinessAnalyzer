'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/format';
import { getBusiness, getSession } from '@/lib/api';
import { calcBusinessScore } from '@/lib/ib-score';
import { BusinessScoreBar } from '@/components/ui/business-score';
import { BottomNav } from '@/components/ui/bottom-nav';
import { ChevronLeft } from 'lucide-react';

export default function IbReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [biz, setBiz] = useState<any>(null);
  const [data, setData] = useState<Record<string, any>>({});

  useEffect(() => {
    async function load() {
      try {
        const b = await getBusiness();
        setBiz(b);
        const slugs = ['ib-identity', 'ib-financial', 'ib-cash-dna', 'ib-bank-view', 'ib-capital', 'ib-growth', 'ib-loan-action'];
        const results = await Promise.allSettled(slugs.map(s => getSession(s)));
        const d: Record<string, any> = {};
        slugs.forEach((s, i) => {
          if (results[i].status === 'fulfilled') d[s] = (results[i] as any).value;
        });
        setData(d);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const fin = data['ib-financial']?.computed;
  const cash = data['ib-cash-dna']?.computed;
  const identity = data['ib-identity']?.data;
  const growth = data['ib-growth']?.computed;
  const loanAction = data['ib-loan-action']?.computed;

  // Score — shared calculation
  const { score, completed } = calcBusinessScore(data);

  // Verdict — null DSCR = no debt = healthy, null D/E = no liabilities = healthy
  const dscrVal = fin?.dscr;
  const deVal = fin?.de;
  const effectiveDscr = dscrVal ?? Infinity;
  const effectiveDe = deVal ?? 0;
  const growthPositive = (cash?.growthCash || 0) >= 0;
  const hasFinData = !!fin;

  let verdict = { group: 'ยังไม่มีข้อมูลเพียงพอ', color: 'text-text-tertiary', action: 'กรุณาทำ Step 1-7 ให้ครบ' };
  if (hasFinData) {
    if (effectiveDscr < 1.0 || (!growthPositive && effectiveDe > 3)) verdict = { group: 'High Risk', color: 'text-status-bad', action: 'ยังไม่ควรกู้เพิ่ม ต้องปรับฐานก่อน' };
    else if (effectiveDscr >= 1.5 && effectiveDe <= 2.5 && growthPositive) verdict = { group: 'Ready to Structure', color: 'text-status-good', action: 'ตัวเลขพร้อม — จัดแพ็กเกจกู้ได้' };
    else if (effectiveDscr < 1.25 || !growthPositive || effectiveDe > 2.5) verdict = { group: 'Need Cleanup', color: 'text-status-warn', action: 'ต้องจัดบ้านก่อน' };
    else verdict = { group: 'Ready to Structure', color: 'text-status-good', action: 'ตัวเลขพร้อม — จัดแพ็กเกจกู้ได้' };
  }

  // 3 Moves
  const moves: { metric: string; text: string }[] = [];
  if (dscrVal != null && dscrVal < 1.5) moves.push({ metric: 'DSCR', text: `ยกระดับ DSCR จาก ${dscrVal?.toFixed(2)} ไป ≥1.5` });
  if (cash?.growthCash < 0) moves.push({ metric: 'Growth Cash', text: `อุดรอยรั่ว: Growth Cash ติดลบ ${money(cash.growthCash)}` });
  if (deVal != null && deVal > 2.5) moves.push({ metric: 'D/E', text: `ลดหนี้ให้ D/E < 2.5 (ตอนนี้ ${deVal?.toFixed(2)})` });

  // Bank Sim — null DSCR = no debt = approve-ready
  let bankStance = 'ยังไม่มีข้อมูล';
  if (hasFinData) {
    if (effectiveDscr >= 1.5 && growthPositive && effectiveDe <= 2.5) bankStance = 'อนุมัติได้';
    else if (effectiveDscr >= 1.25 && growthPositive) bankStance = 'อนุมัติแบบมีเงื่อนไข';
    else bankStance = 'ยังไม่อนุมัติ — ปรับฐานก่อน';
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary"><ChevronLeft size={20} strokeWidth={2} /></button>
          <span className="text-[15px] font-semibold">MRI Report</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">{(biz as any)?.name} · {identity?.bizType}</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Business MRI Report</h1>

        <BusinessScoreBar score={score} stepsCompleted={completed} totalSteps={8} />

        {/* Verdict */}
        <div className={`mt-6 rounded-2xl p-5 ${verdict.color.includes('good') ? 'bg-wash-good' : verdict.color.includes('warn') ? 'bg-wash-warn' : verdict.color.includes('bad') ? 'bg-wash-bad' : 'bg-bg-card border border-border'}`}>
          <div className={`text-xl font-bold ${verdict.color}`}>{verdict.group}</div>
          <div className="text-sm text-text-secondary mt-1">{verdict.action}</div>
        </div>

        {/* Key Metrics */}
        {fin && (
          <div className="mt-6">
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-2">ตัวเลขสำคัญ</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-bg-card border border-border rounded-xl p-3 text-center">
                <div className="text-[10px] text-text-secondary">ชำระหนี้ (DSCR)</div>
                <div className={`num text-xl font-bold ${dscrVal == null ? 'text-status-good' : dscrVal >= 1.5 ? 'text-status-good' : dscrVal >= 1.25 ? 'text-status-warn' : 'text-status-bad'}`}>{dscrVal != null ? dscrVal.toFixed(2) : 'ไม่มีหนี้'}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-xl p-3 text-center">
                <div className="text-[10px] text-text-secondary">หนี้ต่อทุน (D/E)</div>
                <div className={`num text-xl font-bold ${deVal == null ? 'text-status-good' : deVal <= 2 ? 'text-status-good' : deVal <= 3 ? 'text-status-warn' : 'text-status-bad'}`}>{deVal != null ? deVal.toFixed(2) : 'ไม่มีหนี้'}</div>
              </div>
              <div className="bg-bg-card border border-border rounded-xl p-3 text-center">
                <div className="text-[10px] text-text-secondary">เงินเหลือเติบโต</div>
                <div className={`num text-xl font-bold ${cash?.growthCash >= 0 ? 'text-status-good' : 'text-status-bad'}`}>{cash ? money(cash.growthCash) : '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Growth Capacity */}
        {growth?.safe && (
          <div className="mt-6 bg-bg-card border border-border rounded-2xl p-5">
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-3">วงเงินที่กู้ได้</div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-status-good">ปลอดภัย</span><span className="num text-sm font-bold">{growth.safe.loanAmount > 0 ? money(growth.safe.loanAmount) : 'กู้เพิ่มไม่ได้'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-status-warn">สูงสุด</span><span className="num text-sm font-bold">{growth.max.loanAmount > 0 ? money(growth.max.loanAmount) : 'กู้เพิ่มไม่ได้'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-status-bad">อันตราย</span><span className="num text-sm font-bold">{growth.danger.loanAmount > 0 ? money(growth.danger.loanAmount) : 'กู้เพิ่มไม่ได้'}</span></div>
            </div>
          </div>
        )}

        {/* 3 Moves */}
        {moves.length > 0 && (
          <div className="mt-6 bg-bg-card border border-border rounded-2xl p-5">
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-3">3 Moves to Become Bankable</div>
            {moves.slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-t border-border first:border-t-0">
                <span className="num text-xs font-bold text-accent mt-0.5">{i + 1}</span>
                <div>
                  <div className="text-sm font-semibold">{m.metric}</div>
                  <div className="text-xs text-text-secondary">{m.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bank Simulation */}
        <div className={`mt-6 rounded-2xl overflow-hidden ${
          bankStance.includes('อนุมัติได้') ? 'bg-wash-good border-2 border-status-good' :
          bankStance.includes('เงื่อนไข') ? 'bg-wash-warn border-2 border-status-warn' :
          'bg-wash-bad border-2 border-status-bad'
        }`}>
          <div className={`px-5 py-3 text-xs font-bold tracking-wide uppercase ${
            bankStance.includes('อนุมัติได้') ? 'bg-status-good/20 text-status-good' :
            bankStance.includes('เงื่อนไข') ? 'bg-status-warn/20 text-status-warn' :
            'bg-status-bad/20 text-status-bad'
          }`}>
            Bank Simulation — ถ้าคุณเป็นธนาคาร
          </div>
          <div className="p-5">
            <div className={`text-2xl font-bold mb-2 ${
              bankStance.includes('อนุมัติได้') ? 'text-status-good' :
              bankStance.includes('เงื่อนไข') ? 'text-status-warn' :
              'text-status-bad'
            }`}>{bankStance}</div>

            {/* RM Comment */}
            <div className="bg-bg-primary/50 rounded-xl p-4 mt-3">
              <div className="text-[11px] font-semibold text-text-secondary mb-2">ความเห็นเจ้าหน้าที่สินเชื่อ (จำลอง)</div>
              <div className="text-sm text-text-primary leading-relaxed">
                {dscrVal == null && 'ไม่มีภาระหนี้เดิม — จุดแข็งในการกู้ใหม่ '}
                {dscrVal != null && dscrVal >= 1.5 && 'ธุรกิจมีความสามารถในการชำระหนี้ดี '}
                {dscrVal != null && dscrVal >= 1.25 && dscrVal < 1.5 && 'DSCR พอใช้แต่ยังไม่ถึงระดับแข็งแรง '}
                {dscrVal != null && dscrVal < 1.25 && 'DSCR ต่ำกว่าเกณฑ์ — ภาระหนี้สูงเกินกำลัง '}
                {cash?.growthCash < 0 && 'Growth Cash ติดลบแสดงว่าเงินสดไม่พอหมุน '}
                {deVal != null && deVal > 2.5 && `D/E ${deVal.toFixed(2)} สูง — หนี้มากกว่าทุน ควรลดก่อนกู้เพิ่ม `}
                {fin?.quickRatio != null && fin.quickRatio < 1 && 'สภาพคล่องเร็วยังต่ำ ระวังพึ่งสต็อกมากเกินไป '}
                {effectiveDscr >= 1.5 && cash?.growthCash >= 0 && effectiveDe <= 2.5 && 'พร้อมจัดโครงสร้างวงเงินได้'}
              </div>
            </div>

            <p className="text-[10px] text-text-tertiary mt-3">ผลลัพธ์นี้เป็นการประเมินเบื้องต้นเพื่อการเรียนรู้ ไม่ใช่ผลอนุมัติสินเชื่อจริง ธนาคารอาจพิจารณาปัจจัยอื่นร่วมด้วย</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => window.print()} className="flex-1 h-12 rounded-xl border border-border bg-bg-card text-sm font-semibold cursor-pointer">
            Print / PDF
          </button>
          <button onClick={() => router.push('/ib')} className="flex-1 h-12 rounded-xl bg-text-primary text-bg-primary text-sm font-semibold cursor-pointer border-none">
            กลับ Dashboard
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
