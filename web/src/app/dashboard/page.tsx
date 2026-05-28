'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VerdictRibbon } from '@/components/ui/verdict-ribbon';
import { MetricCard, SplitBar } from '@/components/ui/metric-card';
import { money } from '@/lib/format';
import { getBusiness, getEntry, getTrends, getSession, getExpenseItems } from '@/lib/api';
import { DashboardTrendChart } from '@/components/ui/charts';
import { exportDashboardPDF } from '@/lib/pdf-export';
import { BottomNav } from '@/components/ui/bottom-nav';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { WinTip } from '@/components/ui/win-tip';
import { WelcomeTour } from '@/components/ui/welcome-tour';

const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatMonthThai(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${THAI_MONTHS[m]} ${y + 543}`;
}

function currentYYYYMM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(yyyyMm: string, delta: number) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const GROUPS = [
  { idx: 1, title: 'ขายได้เท่าไหร่',     cards: [1, 2] },
  { idx: 2, title: 'เหลือจริงไหม',       cards: [3, 4] },
  { idx: 3, title: 'รั่วตรงไหน',         cards: [5, 6] },
  { idx: 4, title: 'เงินเข้าจริงเท่าไหร่', cards: [7, 8] },
  { idx: 5, title: 'พอโต/พอจ่ายหนี้ไหม',  cards: [9, 10] },
];

const CARD_META: Record<number, { label: string; goodIsUp?: boolean; variant?: string; key: string }> = {
  1:  { label: 'ยอดขายรวม',           key: '1_grossSales' },
  2:  { label: 'สัดส่วน สด/เชื่อ',    key: '2_salesMix', goodIsUp: false },
  3:  { label: 'Gross Margin',         key: '3_grossMargin' },
  4:  { label: 'Net Profit',           key: '4_netProfit' },
  5:  { label: 'ค่าใช้จ่ายกินยอดขาย',  key: '5_expenseRatio', goodIsUp: false },
  6:  { label: 'จุดรั่วเดือนนี้',     key: '6_leakNote', variant: 'text' },
  7:  { label: 'Cash In',              key: '7_cashIn' },
  8:  { label: 'ลูกหนี้ค้างเก็บ',     key: '8_arBalance', goodIsUp: false },
  9:  { label: 'เจ้าหนี้ค้างจ่าย',    key: '9_apBalance', goodIsUp: false },
  10: { label: 'Cash Runway',               key: '10_runway' },
};

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

const TOOLS = [
  { tag: 'S1', label: 'เช็คเงินจริง', desc: 'เทียบยอดขายกับเงินจริงในบัญชี', href: '/s1-check-cash', color: 'var(--status-good)', icon: 'search-cash', apiSlug: 's1-check-cash' },
  { tag: 'S2', label: 'อ่านงบ', desc: 'วิเคราะห์งบกำไรขาดทุน + margin', href: '/s2-income-statement', color: 'var(--accent)', icon: 'bar-chart', apiSlug: 's2-income-statement' },
  { tag: 'S2', label: 'งบเงินสด 2 ปี', desc: 'สร้างงบกระแสเงินสดจากงบ 2 ปี', href: '/s2-cashflow', color: 'var(--accent)', icon: 'compare', apiSlug: 's2-cashflow' },
  { tag: 'S3', label: 'Cashflow 4 Layers', desc: 'ไล่เงินจริง 4 ชั้น + วินิจฉัย', href: '/s3-cashflow', color: '#8B5CF6', icon: 'layers', apiSlug: 's3-cashflow' },
  { tag: 'S4', label: 'ตั้งราคา', desc: 'คำนวณราคาขายที่ได้กำไรจริง', href: '/s4-pricing', color: 'var(--status-warn)', icon: 'tag', apiSlug: 's4-pricing' },
  { tag: 'S4', label: 'CM + จุดคุ้มทุน', desc: 'Contribution Margin + Break-even', href: '/s4-cm', color: 'var(--status-warn)', icon: 'target', apiSlug: 's4-cm' },
  { tag: 'S4', label: 'Real Profit', desc: 'เงินสดที่เหลือจริงจากกำไร', href: '/s4-real-profit', color: 'var(--status-warn)', icon: 'diamond', apiSlug: 's4-real-profit' },
  { tag: 'S5', label: 'Expense Map', desc: 'แผนที่ค่าใช้จ่าย + 10 จุดรั่ว', href: '/expense-map', color: 'var(--status-bad)', icon: 'map', apiSlug: 'expense-map' },
  { tag: 'S6', label: 'ระบบ 5 ช่อง', desc: 'แยกเงินให้ชัด 5 บัญชี', href: '/s6-five-buckets', color: '#06B6D4', icon: 'boxes', apiSlug: 's6-five-buckets' },
  { tag: 'S7', label: 'แผน 1 หน้า', desc: 'แผนธุรกิจตอบ 4 คำถามธนาคาร', href: '/s7-business-plan', color: '#EC4899', icon: 'file-text', apiSlug: 's7-business-plan' },
];

function ToolChecklist({ tools, completedSlugs }: { tools: typeof TOOLS; completedSlugs: Set<string> }) {
  const [expanded, setExpanded] = useState(false);
  const doneCount = tools.filter(t => completedSlugs.has(t.apiSlug)).length;
  const total = tools.length;
  const pct = Math.round((doneCount / total) * 100);

  // Find next undone session
  const nextTool = tools.find(t => !completedSlugs.has(t.apiSlug));

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
      {/* Compact header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-transparent border-none text-left"
      >
        {/* Progress ring */}
        <div className="relative w-10 h-10 shrink-0">
          <svg width="40" height="40" viewBox="0 0 40 40" className="rotate-[-90deg]">
            <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle cx="20" cy="20" r="17" fill="none" stroke={doneCount === total ? 'var(--status-good)' : 'var(--accent)'} strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 17}`} strokeDashoffset={`${2 * Math.PI * 17 * (1 - pct / 100)}`}
              strokeLinecap="round" className="transition-all duration-500" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center num text-[11px] font-bold">{doneCount}/{total}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">เครื่องมือวิเคราะห์</div>
          <div className="text-[11px] text-text-secondary">
            {doneCount === total ? '✅ ทำครบทุกเครื่องมือแล้ว!' : nextTool ? `ถัดไป: ${nextTool.label}` : ''}
          </div>
        </div>

        {/* Next button or expand */}
        {!expanded && nextTool && (
          <a href={nextTool.href} onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white no-underline"
            style={{ background: nextTool.color }}>
            เริ่มทำ →
          </a>
        )}

        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"
          className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <path d="M4 6l4 4 4-4"/>
        </svg>
      </button>

      {/* Expanded list */}
      {expanded && (
        <div className="border-t border-border">
          {tools.map((t, i) => {
            const done = completedSlugs.has(t.apiSlug);
            return (
              <a key={t.href} href={t.href} className="group flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-bg-secondary transition-colors border-b border-border last:border-b-0">
                {/* Check circle */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? '' : 'border-[1.5px]'}`}
                  style={{
                    background: done ? t.color : 'transparent',
                    borderColor: done ? 'transparent' : 'var(--border-strong)',
                  }}>
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7l3 3 5-6"/></svg>
                  ) : (
                    <span className="text-[8px] font-bold text-text-tertiary">{t.tag}</span>
                  )}
                </div>

                <span className={`flex-1 text-[13px] font-medium ${done ? 'text-text-secondary' : 'text-text-primary'}`}>{t.label}</span>

                <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${done ? 'text-status-good bg-wash-good' : 'text-text-tertiary'}`}>
                  {done ? '✓' : 'ยังไม่ได้ทำ'}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToolIcon({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  const s = size;
  const sw = 1.8;
  const props = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'search-cash':
      return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>;
    case 'bar-chart':
      return <svg {...props}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>;
    case 'compare':
      return <svg {...props}><path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 5-9"/><circle cx="7" cy="16" r="1.5" fill={color}/><circle cx="11" cy="8" r="1.5" fill={color}/><circle cx="15" cy="13" r="1.5" fill={color}/><circle cx="20" cy="4" r="1.5" fill={color}/></svg>;
    case 'layers':
      return <svg {...props}><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/><path d="M12 2L2 7l10 5 10-5L12 2z"/></svg>;
    case 'tag':
      return <svg {...props}><path d="M12 2L2 7l10 5 10-5L12 2z" fill={color} opacity="0.15"/><path d="M12 2L2 7l10 5 10-5L12 2z"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="7" y1="12" x2="7" y2="15"/><line x1="17" y1="12" x2="17" y2="15"/></svg>;
    case 'target':
      return <svg {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill={color}/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>;
    case 'diamond':
      return <svg {...props}><path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M2 9h20" opacity="0.4"/><path d="M10 3l-2 6 4 13 4-13-2-6" opacity="0.4"/></svg>;
    case 'map':
      return <svg {...props}><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/><circle cx="6" cy="10" r="1.5" fill={color}/><circle cx="12" cy="13" r="1.5" fill={color}/><circle cx="18" cy="8" r="1.5" fill={color}/></svg>;
    case 'boxes':
      return <svg {...props}><rect x="2" y="3" width="8" height="8" rx="2"/><rect x="14" y="3" width="8" height="8" rx="2"/><rect x="2" y="13" width="8" height="8" rx="2"/><rect x="14" y="13" width="8" height="8" rx="2"/><rect x="8" y="8" width="8" height="8" rx="2" fill={color} opacity="0.2"/></svg>;
    case 'file-text':
      return <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

type StatusColor = 'good' | 'warn' | 'bad' | 'empty' | 'neutral';

function colorToStatus(c: string | null | undefined): StatusColor {
  if (c === 'green') return 'good';
  if (c === 'yellow') return 'warn';
  if (c === 'red') return 'bad';
  return 'neutral';
}

function verdictLevelMap(level: string): 'good' | 'warn' | 'bad' | 'empty' {
  if (level === 'ok') return 'good';
  if (level === 'warning') return 'warn';
  if (level === 'critical') return 'bad';
  return 'empty';
}

function formatBoxValue(box: any, cardNum: number): { big: string; unit?: string; status: StatusColor } {
  if (!box || box.value == null) {
    if (cardNum === 6 && box?.value === '') return { big: '—', status: 'neutral' };
    if (box?.months != null) {
      return { big: box.months.toFixed(1), unit: 'เดือน', status: colorToStatus(box.color) };
    }
    return { big: '—', status: 'empty' };
  }

  const status = colorToStatus(box.color);

  if (box.format === 'currency') return { big: money(box.value as number), unit: 'บาท', status };
  if (box.format === 'percent') return { big: ((box.value as number) * 100).toFixed(0), unit: '%', status };
  if (box.format === 'text') return { big: box.value as string, status: 'neutral' };
  return { big: String(box.value), status };
}

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-secondary"><DashboardSkeleton /></div>}>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(searchParams.get('month') || currentYYYYMM());
  const [data, setData] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Check session on mount — redirect immediately if not logged in
  const sessionChecked = useRef(false);
  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => { if (!s?.user?.id) window.location.href = '/login'; })
      .catch(() => {});
  }, []);

  const hasLoadedOnce = useRef(false);
  const loadData = useCallback(async (m: string) => {
    if (!hasLoadedOnce.current) setLoading(true);
    setError(false);
    try {
      const biz = await getBusiness();
      setBusiness(biz);

      // Check which sessions are completed
      try {
        const slugs = ['s1-check-cash','s2-income-statement','s2-cashflow','s3-cashflow','s4-pricing','s4-cm','s4-real-profit','s6-five-buckets','s7-business-plan'];
        const checks = await Promise.allSettled([
          ...slugs.map(s => getSession(s)),
          getExpenseItems(),
        ]);
        const done = new Set<string>();
        slugs.forEach((s, i) => {
          if (checks[i].status === 'fulfilled') {
            const val = (checks[i] as any).value;
            // API returns [] for list (no data) or { data, computed } for actual data
            const hasData = val && !Array.isArray(val) && (val.data || val.computed);
            const hasListData = Array.isArray(val) && val.length > 0;
            if (hasData || hasListData) done.add(s);
          }
        });
        if (checks[slugs.length].status === 'fulfilled') {
          const val = (checks[slugs.length] as any).value;
          if (val?.items?.length > 0) done.add('expense-map');
        }
        setCompletedSlugs(done);
      } catch { /* ignore */ }

      // Load trends for chart
      try {
        const t = await getTrends(6) as any[];
        setTrends(t.map((item: any) => ({
          month: item.month,
          np: typeof item.boxes?.['4_netProfit']?.value === 'number' ? item.boxes['4_netProfit'].value : null,
          rw: item.boxes?.['10_runway']?.months ?? null,
          gm: typeof item.boxes?.['3_grossMargin']?.value === 'number' ? item.boxes['3_grossMargin'].value * 100 : null,
        })));
      } catch { setTrends([]); }

      try {
        const entry = await getEntry(m);
        setData(entry);
      } catch {
        setData(null); // No entry for this month
      }
      hasLoadedOnce.current = true;
      setLoading(false);
    } catch (e: any) {
      console.error('Dashboard load error:', e);
      const msg = e.message || '';

      // Network error (backend down) → show error UI with retry
      if (e instanceof TypeError || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError(true);
        setLoading(false);
        return;
      }

      // Not logged in → go to login
      if (msg.includes('Missing') || msg.includes('login') || msg.includes('Unauthorized')) {
        window.location.href = '/login';
        return;
      }

      // Logged in but no business → go to onboarding
      if (msg.includes('No business') || msg.includes('Not Found')) {
        window.location.href = '/onboarding';
        return;
      }

      // Unknown error
      setError(true);
      setLoading(false);
    }
  }, []);

  // Always reload data — on mount, month change, back navigation, tab focus
  useEffect(() => {
    loadData(month);
  }, [month, loadData]);

  // Handle back button + tab switch
  useEffect(() => {
    const reload = () => { hasLoadedOnce.current = false; loadData(month); };
    const onVisibility = () => { if (document.visibilityState === 'visible') reload(); };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) reload(); };

    window.addEventListener('popstate', reload);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('popstate', reload);
      window.removeEventListener('pageshow', onPageShow as any);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [month, loadData]);

  const goMonth = (delta: number) => {
    const newMonth = shiftMonth(month, delta);
    // Don't go past current month
    if (newMonth > currentYYYYMM()) return;
    setMonth(newMonth);
  };

  const noEntry = !loading && !error && !data;
  const boxes = data?.boxes || {};
  const verdict = data?.verdict;

  return (
    <div className="min-h-screen bg-bg-secondary overflow-x-hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo-32.png" alt="WW" width={28} height={28} className="rounded" />
            <span className="text-[15px] font-semibold tracking-tight hidden sm:inline">WinWin Analyzer</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => goMonth(-1)} className="p-1.5 cursor-pointer bg-transparent border-none text-text-primary">←</button>
            <span className="text-[13px] sm:text-[15px] font-semibold text-center">{formatMonthThai(month)}</span>
            <button
              onClick={() => goMonth(1)}
              disabled={shiftMonth(month, 1) > currentYYYYMM()}
              className="p-2 cursor-pointer bg-transparent border-none text-text-primary disabled:text-text-tertiary"
            >→</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 pb-24">
        {/* Loading */}
        {loading && <DashboardSkeleton />}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-wash-bad text-status-bad flex items-center justify-center text-3xl font-bold">!</div>
            <div className="text-xl font-semibold">โหลดข้อมูลไม่สำเร็จ</div>
            <p className="text-sm text-text-secondary max-w-xs">ตอนนี้ออฟไลน์อยู่ หรือเชื่อมต่อไม่ติด — ลองอีกครั้ง</p>
            <button onClick={() => loadData(month)} className="mt-2 px-4 py-2.5 rounded-xl bg-text-primary text-bg-primary font-semibold text-sm cursor-pointer">
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {/* No entry for this month */}
        {noEntry && (
          <>
            <div className="mb-4 anim-fade-up anim-d1">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">{business?.name}</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{formatMonthThai(month)}</h1>
            </div>
            <div className="anim-scale-in anim-d2" data-tour="entry-button">
              <VerdictRibbon
                level="empty"
                title="ยังไม่ได้กรอกข้อมูลเดือนนี้"
                body="ใช้เวลา 5 นาที กรอก 9 ตัวเลข เพื่อเห็นภาพรวม"
                ctaLabel="กรอกเลย"
                onTap={() => router.push(`/entry/${month}`)}
              />
            </div>
            {/* Tools checklist */}
            <div className="mt-6 mb-6 anim-fade-up anim-d3" data-tour="checklist">
              <ToolChecklist tools={TOOLS} completedSlugs={completedSlugs} />
            </div>

            {/* Empty cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 md:gap-4 xl:gap-3">
              {GROUPS.map((g) => (
                <div key={g.idx}>
                  <div className="flex items-center gap-2 px-1 pb-2">
                    <span className="num text-base font-semibold text-text-secondary">{CIRCLED[g.idx - 1]}</span>
                    <span className="text-[13px] font-semibold text-text-secondary">{g.title}</span>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
                    {g.cards.map((n) => (
                      <MetricCard key={n} num={n} label={CARD_META[n].label} big="—" status="empty" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Has data */}
        {!loading && !error && data && (
          <>
            <div className="flex items-baseline justify-between mb-1.5 gap-3 flex-wrap anim-fade-up anim-d1">
              <div>
                <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">{business?.name}</div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{formatMonthThai(month)}</h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportDashboardPDF({
                    businessName: business?.name || '',
                    month: formatMonthThai(month),
                    boxes: data?.boxes || {},
                    verdict: data?.verdict || { level: 'ok', messages: [] },
                  })}
                  className="bg-bg-card border border-border rounded-[10px] px-3 py-2.5 text-sm font-semibold cursor-pointer text-text-secondary hover:text-text-primary transition-colors"
                >
                  PDF ↓
                </button>
                <button
                  onClick={() => { window.location.href = `/entry/${month}`; }}
                  data-tour="entry-button"
                  className="bg-text-primary text-bg-primary rounded-[10px] px-3.5 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer border-none"
                >
                  แก้ไขข้อมูล
                </button>
              </div>
            </div>

            {/* Verdict */}
            {verdict && (
              <div className="mt-3 mb-6 anim-scale-in anim-d2" data-tour="verdict">
                <VerdictRibbon
                  level={verdictLevelMap(verdict.level)}
                  title={verdict.messages[0] || ''}
                  body={verdict.messages.slice(1).join(' · ') || undefined}
                />
              </div>
            )}

            {/* Trend chart */}
            {trends.length >= 1 && (
              <div className="mb-6 anim-fade-up anim-d3">
                <DashboardTrendChart data={trends} />
              </div>
            )}

            {/* Tools checklist */}
            <div className="mb-6 anim-fade-up anim-d4" data-tour="checklist">
              <ToolChecklist tools={TOOLS} completedSlugs={completedSlugs} />
            </div>

            {/* Dashboard grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 md:gap-4 xl:gap-3 anim-fade-up anim-d5">
              {GROUPS.map((g) => (
                <div key={g.idx}>
                  <div className="flex items-center gap-2 px-1 pb-2">
                    <span className="num text-base font-semibold text-text-secondary">{CIRCLED[g.idx - 1]}</span>
                    <span className="text-[13px] font-semibold text-text-secondary">{g.title}</span>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
                    {g.cards.map((n) => {
                      const meta = CARD_META[n];
                      const box = boxes[meta.key];

                      // Box 2 — sales mix
                      if (n === 2) {
                        const hasMix = box?.cashPct != null;
                        return (
                          <MetricCard
                            key={n} num={n} label={meta.label}
                            status={hasMix ? colorToStatus(box?.color) : 'empty'}
                            variant="split" goodIsUp={meta.goodIsUp}
                          >
                            {hasMix
                              ? <SplitBar cashPct={Math.round(box.cashPct * 100)} creditPct={Math.round(box.creditPct * 100)} />
                              : <div className="num text-[22px] text-text-tertiary">—</div>
                            }
                          </MetricCard>
                        );
                      }

                      // Box 6 — text
                      if (meta.variant === 'text') {
                        return (
                          <MetricCard
                            key={n} num={n} label={meta.label}
                            variant="text" big={box?.value || '—'}
                            status={box?.value ? 'neutral' : 'empty'}
                          />
                        );
                      }

                      // Box 10 — runway
                      if (n === 10) {
                        const rv = formatBoxValue(box, n);
                        return (
                          <MetricCard
                            key={n} num={n} label={meta.label}
                            big={rv.big} unit={rv.unit} status={rv.status}
                          />
                        );
                      }

                      // Default number boxes
                      const rv = formatBoxValue(box, n);
                      return (
                        <MetricCard
                          key={n} num={n} label={meta.label}
                          big={rv.big} unit={rv.unit} status={rv.status}
                          goodIsUp={meta.goodIsUp}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {/* WinTip */}
        {!loading && !error && (
          <div className="mt-6">
            <WinTip page="dashboard" />
          </div>
        )}
      </main>

      <BottomNav />
      {!loading && !error && <WelcomeTour />}
    </div>
  );
}
