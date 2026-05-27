'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VerdictRibbon } from '@/components/ui/verdict-ribbon';
import { MetricCard, SplitBar } from '@/components/ui/metric-card';
import { money } from '@/lib/format';
import { getBusiness, getEntry } from '@/lib/api';

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
  10: { label: 'Runway',               key: '10_runway' },
};

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

const TOOLS = [
  { tag: 'S1', label: 'เช็คเงินจริง', desc: 'เทียบยอดขายกับเงินจริงในบัญชี', href: '/s1-check-cash' },
  { tag: 'S2', label: 'อ่านงบ', desc: 'วิเคราะห์งบกำไรขาดทุน + margin', href: '/s2-income-statement' },
  { tag: 'S2', label: 'งบเงินสด 2 ปี', desc: 'สร้างงบกระแสเงินสดจากงบ 2 ปี', href: '/s2-cashflow' },
  { tag: 'S3', label: 'Cashflow 4 Layers', desc: 'ไล่เงินจริง 4 ชั้น + วินิจฉัย', href: '/s3-cashflow' },
  { tag: 'S4', label: 'ตั้งราคา', desc: 'คำนวณราคาขายที่ได้กำไรจริง', href: '/s4-pricing' },
  { tag: 'S4', label: 'CM + จุดคุ้มทุน', desc: 'Contribution Margin + Break-even', href: '/s4-cm' },
  { tag: 'S4', label: 'Real Profit', desc: 'เงินสดที่เหลือจริงจากกำไร', href: '/s4-real-profit' },
  { tag: 'S5', label: 'Expense Map', desc: 'แผนที่ค่าใช้จ่าย + 10 จุดรั่ว', href: '/expense-map' },
  { tag: 'S6', label: 'ระบบ 5 ช่อง', desc: 'แยกเงินให้ชัด 5 บัญชี', href: '/s6-five-buckets' },
  { tag: 'S7', label: 'แผน 1 หน้า', desc: 'แผนธุรกิจตอบ 4 คำถามธนาคาร', href: '/s7-business-plan' },
];

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
    <Suspense fallback={<div className="min-h-screen bg-bg-secondary flex items-center justify-center"><div className="text-text-secondary">กำลังโหลด...</div></div>}>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async (m: string) => {
    setLoading(true);
    setError(false);
    try {
      const biz = await getBusiness();
      setBusiness(biz);

      try {
        const entry = await getEntry(m);
        setData(entry);
      } catch {
        setData(null); // No entry for this month
      }
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

  useEffect(() => {
    loadData(month);
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
            <button onClick={() => goMonth(-1)} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">←</button>
            <span className="text-[15px] font-semibold min-w-[140px] text-center">{formatMonthThai(month)}</span>
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
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-text-secondary">กำลังโหลด...</div>
          </div>
        )}

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
            <div className="mb-4">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">{business?.name}</div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{formatMonthThai(month)}</h1>
            </div>
            <VerdictRibbon
              level="empty"
              title="ยังไม่ได้กรอกข้อมูลเดือนนี้"
              body="ใช้เวลา 5 นาที กรอก 9 ตัวเลข เพื่อเห็นภาพรวม"
              ctaLabel="กรอกเลย"
              onTap={() => router.push(`/entry/${month}`)}
            />
            {/* Tools grid */}
            <div className="mt-6 mb-6">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-2">เครื่องมือวิเคราะห์</div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                {TOOLS.map((t) => (
                  <a key={t.href} href={t.href} className="bg-bg-card border border-border rounded-xl p-3 no-underline hover:shadow-[var(--shadow-pop)] transition-shadow">
                    <div className="text-[11px] text-text-tertiary font-semibold">{t.tag}</div>
                    <div className="text-sm font-semibold text-text-primary mt-0.5">{t.label}</div>
                    <div className="text-[11px] text-text-secondary mt-1 leading-snug">{t.desc}</div>
                  </a>
                ))}
              </div>
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
            <div className="flex items-baseline justify-between mb-1.5 gap-3 flex-wrap">
              <div>
                <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">{business?.name}</div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{formatMonthThai(month)}</h1>
              </div>
              <a
                href={`/entry/${month}`}
                className="bg-text-primary text-bg-primary rounded-[10px] px-3.5 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5 no-underline"
              >
                แก้ไขข้อมูล
              </a>
            </div>

            {/* Verdict */}
            {verdict && (
              <div className="mt-3 mb-6">
                <VerdictRibbon
                  level={verdictLevelMap(verdict.level)}
                  title={verdict.messages[0] || ''}
                  body={verdict.messages.slice(1).join(' · ') || undefined}
                />
              </div>
            )}

            {/* Tools grid */}
            <div className="mb-6">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-2">เครื่องมือวิเคราะห์</div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                {TOOLS.map((t) => (
                  <a key={t.href} href={t.href} className="bg-bg-card border border-border rounded-xl p-3 no-underline hover:shadow-[var(--shadow-pop)] transition-shadow">
                    <div className="text-[11px] text-text-tertiary font-semibold">{t.tag}</div>
                    <div className="text-sm font-semibold text-text-primary mt-0.5">{t.label}</div>
                    <div className="text-[11px] text-text-secondary mt-1 leading-snug">{t.desc}</div>
                  </a>
                ))}
              </div>
            </div>

            {/* Dashboard grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 md:gap-4 xl:gap-3">
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
      </main>

      {/* Bottom tabs (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,12px)] pt-2 px-2 grid grid-cols-4 xl:hidden z-20">
        {[
          { label: 'หน้าหลัก', href: '/dashboard' },
          { label: 'กรอกใหม่', href: `/entry/${currentYYYYMM()}` },
          { label: 'ย้อนหลัง', href: '/history' },
          { label: 'บัญชี',   href: '/settings' },
        ].map((tab) => (
          <a key={tab.label} href={tab.href} className="flex flex-col items-center gap-0.5 py-1.5 text-text-tertiary no-underline text-[10px] font-medium">
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
