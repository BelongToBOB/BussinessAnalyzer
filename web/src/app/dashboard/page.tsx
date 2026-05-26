'use client';

import { VerdictRibbon } from '@/components/ui/verdict-ribbon';
import { MetricCard, SplitBar } from '@/components/ui/metric-card';

// Sample data from design doc section 6
const SAMPLE = {
  business: 'บริษัท วินวิน จำกัด',
  month: 'มกราคม 2567',
  verdict: {
    level: 'warn' as const,
    title: 'Runway 1.6 เดือน · ต่ำกว่า 3 เดือน',
    body: 'Cash In ต่ำกว่ายอดขาย — เงินไปจมที่ลูกหนี้ ไล่อุดที่ Expense Map',
  },
  cards: {
    1:  { big: '500,000', unit: 'บาท', delta: 5,  status: 'neutral' as const },
    2:  { cashPct: 70, creditPct: 30, status: 'good' as const, delta: -5 },
    3:  { big: '40',      unit: '%',    delta: 2,  status: 'good' as const },
    4:  { big: '65,000',  unit: 'บาท', delta: -8, status: 'good' as const },
    5:  { big: '27',      unit: '%',    delta: 3,  status: 'warn' as const },
    6:  { text: 'ค่าขนส่งเกินงบ — 18,000 บาท', status: 'neutral' as const },
    7:  { big: '380,000', unit: 'บาท', delta: -4, status: 'warn' as const, note: 'ต่ำกว่ายอดขาย 24%' },
    8:  { big: '220,000', unit: 'บาท', delta: 12, status: 'neutral' as const },
    9:  { big: '160,000', unit: 'บาท', delta: 6,  status: 'neutral' as const },
    10: { big: '1.6',     unit: 'เดือน', delta: -22, status: 'bad' as const },
  },
};

const GROUPS = [
  { idx: 1, title: 'ขายได้เท่าไหร่',     cards: [1, 2] },
  { idx: 2, title: 'เหลือจริงไหม',       cards: [3, 4] },
  { idx: 3, title: 'รั่วตรงไหน',         cards: [5, 6] },
  { idx: 4, title: 'เงินเข้าจริงเท่าไหร่', cards: [7, 8] },
  { idx: 5, title: 'พอโต/พอจ่ายหนี้ไหม',  cards: [9, 10] },
];

const CARD_META: Record<number, { label: string; goodIsUp?: boolean; variant?: string }> = {
  1:  { label: 'ยอดขายรวม' },
  2:  { label: 'สัดส่วน สด/เชื่อ', goodIsUp: false },
  3:  { label: 'Gross Margin' },
  4:  { label: 'Net Profit' },
  5:  { label: 'ค่าใช้จ่ายกินยอดขาย', goodIsUp: false },
  6:  { label: 'จุดรั่วเดือนนี้', variant: 'text' },
  7:  { label: 'Cash In' },
  8:  { label: 'ลูกหนี้ค้างเก็บ', goodIsUp: false },
  9:  { label: 'เจ้าหนี้ค้างจ่าย', goodIsUp: false },
  10: { label: 'Runway' },
};

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

function CardCell({ num: cardNum }: { num: number }) {
  const meta = CARD_META[cardNum];
  const d = SAMPLE.cards[cardNum as keyof typeof SAMPLE.cards] as any;

  if (meta.variant === 'text') {
    return <MetricCard num={cardNum} label={meta.label} variant="text" big={d.text} status={d.status} />;
  }
  if (cardNum === 2) {
    return (
      <MetricCard num={cardNum} label={meta.label} status={d.status} variant="split" delta={d.delta} goodIsUp={meta.goodIsUp}>
        {d.cashPct != null ? <SplitBar cashPct={d.cashPct} creditPct={d.creditPct} /> : <div className="num text-[22px] text-text-tertiary">—</div>}
      </MetricCard>
    );
  }
  return (
    <MetricCard
      num={cardNum} label={meta.label}
      big={d.big} unit={d.unit} status={d.status}
      delta={d.delta} goodIsUp={meta.goodIsUp ?? true} note={d.note}
    />
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-text-primary flex items-center justify-center">
              <span className="text-bg-primary text-[10px] font-bold">IB</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">InsideBank</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-text-primary">←</button>
            <span className="text-[15px] font-semibold">{SAMPLE.month}</span>
            <button className="p-2 text-text-primary">→</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 pb-24">
        {/* Title row */}
        <div className="flex items-baseline justify-between mb-1.5 gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">
              {SAMPLE.business}
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{SAMPLE.month}</h1>
          </div>
          <a href="/entry/2567-01" className="bg-text-primary text-bg-primary rounded-[10px] px-3.5 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5">
            + กรอกข้อมูลเดือนใหม่
          </a>
        </div>

        {/* Verdict */}
        <div className="mt-3 mb-6">
          <VerdictRibbon
            level={SAMPLE.verdict.level}
            title={SAMPLE.verdict.title}
            body={SAMPLE.verdict.body}
            ctaLabel="ดูคำแนะนำ"
          />
        </div>

        {/* Dashboard grid — 5 groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 md:gap-4 xl:gap-3">
          {GROUPS.map((g) => (
            <div key={g.idx}>
              <div className="flex items-center gap-2 px-1 pb-2">
                <span className="num text-base font-semibold text-text-secondary">{CIRCLED[g.idx - 1]}</span>
                <span className="text-[13px] font-semibold text-text-secondary">{g.title}</span>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
                {g.cards.map((n) => <CardCell key={n} num={n} />)}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom tabs (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,12px)] pt-2 px-2 grid grid-cols-4 xl:hidden z-20">
        {[
          { id: 'dashboard', label: 'หน้าหลัก', href: '/dashboard' },
          { id: 'entry',     label: 'กรอกใหม่', href: '/entry/new' },
          { id: 'history',   label: 'ย้อนหลัง', href: '/history' },
          { id: 'settings',  label: 'บัญชี',   href: '/settings' },
        ].map((tab) => (
          <a key={tab.id} href={tab.href} className="flex flex-col items-center gap-0.5 py-1.5 text-text-tertiary no-underline">
            <span className="text-[10px] font-medium">{tab.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
