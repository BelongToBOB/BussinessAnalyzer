'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/format';

const THAI_MONTHS_SHORT = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function shortMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${THAI_MONTHS_SHORT[m]} ${(y + 543) % 100}`;
}

function fullMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${THAI_MONTHS[m]} ${y + 543}`;
}

type Metric = 'np' | 'gm' | 'rw';

interface TrendPoint {
  month: string;
  np: number | null;
  gm: number | null;
  rw: number | null;
  level: string;
}

function extractTrend(item: any): TrendPoint {
  const boxes = item.boxes || {};
  const b4 = boxes['4_netProfit'];
  const b3 = boxes['3_grossMargin'];
  const b10 = boxes['10_runway'];

  return {
    month: item.month,
    np: typeof b4?.value === 'number' ? b4.value : null,
    gm: typeof b3?.value === 'number' ? b3.value * 100 : null,
    rw: b10?.months ?? null,
    level: item.verdict?.level || 'ok',
  };
}

function levelToStatus(level: string): string {
  if (level === 'critical') return 'bad';
  if (level === 'warning') return 'warn';
  return 'good';
}

const METRIC_CONFIG: Record<Metric, { name: string; color: string; suffix: string; format: (v: number) => string }> = {
  np: { name: 'Net Profit', color: 'var(--text-primary)', suffix: 'บาท', format: (v) => (v >= 0 ? '+' : '−') + money(Math.abs(v)) },
  gm: { name: 'Gross Margin', color: 'var(--status-good)', suffix: '%', format: (v) => v.toFixed(0) + '%' },
  rw: { name: 'Runway', color: 'var(--accent)', suffix: 'เดือน', format: (v) => v.toFixed(1) },
};

function MiniChart({ data, metric }: { data: TrendPoint[]; metric: Metric }) {
  const series = [...data].reverse();
  const values = series.map((d) => d[metric]).filter((v): v is number => v != null);
  if (values.length < 2) {
    return <div className="h-[180px] flex items-center justify-center text-sm text-text-tertiary">ข้อมูลไม่เพียงพอสำหรับกราฟ</div>;
  }

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const w = 700, h = 180, padL = 50, padR = 12, padT = 12, padB = 28;

  const allValues = series.map((d) => d[metric]);
  const validIndices = allValues.map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0);
  const xs = validIndices.map((_, j) => padL + (j * (w - padL - padR)) / Math.max(validIndices.length - 1, 1));
  const ys = validIndices.map((i) => padT + (h - padT - padB) * (1 - ((allValues[i]! - min) / range)));

  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const area = path + ` L ${xs[xs.length - 1]} ${h - padB} L ${xs[0]} ${h - padB} Z`;
  const mc = METRIC_CONFIG[metric];

  const ticks = min < 0 ? [max, 0, min] : [max, (max + min) / 2, min];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[180px] block">
      <defs>
        <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mc.color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={mc.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = padT + (h - padT - padB) * (1 - (t - min) / range);
        return (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray={t === 0 ? '0' : '2 4'} />
            <text x={padL - 6} y={y + 3} fontSize="10" fill="var(--text-tertiary)" textAnchor="end" fontFamily="Inter">
              {metric === 'np' ? (Math.abs(t / 1000).toFixed(0) + (t < 0 ? 'k −' : 'k')) : t.toFixed(metric === 'rw' ? 1 : 0) + mc.suffix}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#grad-${metric})`} />
      <path d={path} fill="none" stroke={mc.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 4 : 2.5}
          fill={i === xs.length - 1 ? mc.color : 'var(--bg-card)'}
          stroke={mc.color} strokeWidth={i === xs.length - 1 ? 0 : 1.6} />
      ))}
      {validIndices.map((origIdx, j) => j % 2 === 0 && (
        <text key={j} x={xs[j]} y={h - 6} fontSize="9" fill="var(--text-tertiary)" textAnchor="middle" fontFamily="Inter">
          {shortMonth(series[origIdx].month)}
        </text>
      ))}
    </svg>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [metric, setMetric] = useState<Metric>('np');
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  useEffect(() => {
    async function load() {
      try {
        const [bizRes, trendRes] = await Promise.all([
          fetch(`${apiUrl}/api/business`, { credentials: 'include' }),
          fetch(`${apiUrl}/api/entries/trends?months=12`, { credentials: 'include' }),
        ]);
        if (bizRes.ok) setBusiness(await bizRes.json());
        if (trendRes.ok) {
          const data = await trendRes.json();
          setTrends(data.map(extractTrend));
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [apiUrl]);

  const latest = trends.length > 0 ? trends[trends.length - 1] : null;
  const latestVal = latest ? latest[metric] : null;

  const STATUS_COLORS: Record<string, string> = {
    good: 'bg-status-good', warn: 'bg-status-warn', bad: 'bg-status-bad',
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
            </button>
            <span className="text-[15px] font-semibold">ย้อนหลัง</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">{business?.name}</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">ย้อนหลัง 12 เดือน</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">ดูพัฒนาการ · เห็น pattern ที่ Dashboard เดือนเดียวมองไม่ออก</p>

        {loading && <div className="py-20 text-center text-text-secondary">กำลังโหลด...</div>}

        {!loading && trends.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-xl font-semibold mb-2">ยังไม่มีข้อมูล</div>
            <p className="text-sm text-text-secondary mb-4">กรอกข้อมูลอย่างน้อย 1 เดือนเพื่อเริ่มดูย้อนหลัง</p>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2.5 rounded-xl bg-text-primary text-bg-primary font-semibold text-sm cursor-pointer">
              กลับ Dashboard
            </button>
          </div>
        )}

        {!loading && trends.length > 0 && (
          <>
            {/* Metric tabs */}
            <div className="flex gap-1 mb-4">
              {(['np', 'rw', 'gm'] as Metric[]).map((m) => (
                <button key={m} onClick={() => setMetric(m)} className="px-3.5 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer font-thai transition-colors" style={{
                  background: metric === m ? 'var(--text-primary)' : 'var(--bg-card)',
                  color: metric === m ? 'var(--bg-primary)' : 'var(--text-primary)',
                  border: metric === m ? 'none' : '1px solid var(--border)',
                }}>
                  {METRIC_CONFIG[m].name}
                </button>
              ))}
            </div>

            {/* Chart card */}
            <div className="bg-bg-card border border-border rounded-2xl p-[18px] mb-4">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">{METRIC_CONFIG[metric].name} · ล่าสุด</div>
                  <div className="num text-[26px] font-semibold tracking-tight mt-1">
                    {latestVal != null ? METRIC_CONFIG[metric].format(latestVal) + ' ' + METRIC_CONFIG[metric].suffix : '—'}
                  </div>
                </div>
              </div>
              <MiniChart data={trends} metric={metric} />
            </div>

            {/* Table */}
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[14px_1.4fr_1fr_1fr_1fr_24px] gap-3 px-[18px] py-3 text-[11px] text-text-secondary uppercase tracking-wide font-semibold border-b border-border">
                <span />
                <span>เดือน</span>
                <span>Net Profit</span>
                <span>Runway</span>
                <span>Gross Margin</span>
                <span />
              </div>

              {/* Rows — most recent first */}
              {[...trends].reverse().map((row) => {
                const status = levelToStatus(row.level);
                return (
                  <button
                    key={row.month}
                    onClick={() => router.push(`/dashboard?month=${row.month}`)}
                    className="grid grid-cols-[14px_1.4fr_1fr_1fr_1fr_24px] gap-3 items-center w-full px-[18px] py-3.5 text-left border-b border-border last:border-b-0 bg-transparent cursor-pointer hover:bg-bg-secondary transition-colors font-thai"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status] || 'bg-status-good'}`} />
                    <span className="text-sm font-semibold">{fullMonth(row.month)}</span>
                    <span className={`num text-sm font-medium ${row.np != null && row.np < 0 ? 'text-status-bad' : 'text-text-primary'}`}>
                      {row.np != null ? money(row.np) : '—'} <span className="text-[11px] text-text-tertiary">NP</span>
                    </span>
                    <span className="num text-sm font-medium">
                      {row.rw != null ? row.rw.toFixed(1) : '—'} <span className="text-[11px] text-text-tertiary">เดือน</span>
                    </span>
                    <span className="num text-sm font-medium">
                      {row.gm != null ? row.gm.toFixed(0) + '%' : '—'} <span className="text-[11px] text-text-tertiary">GM</span>
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round"><path d="M5 3l4 4-4 4"/></svg>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/92 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom,12px)] pt-2 px-2 grid grid-cols-4 xl:hidden z-20">
        {[
          { label: 'หน้าหลัก', href: '/dashboard' },
          { label: 'กรอกใหม่', href: '/entry/new' },
          { label: 'ย้อนหลัง', href: '/history' },
          { label: 'บัญชี',   href: '/settings' },
        ].map((tab) => (
          <a key={tab.label} href={tab.href} className={`flex flex-col items-center gap-0.5 py-1.5 no-underline text-[10px] font-medium ${tab.href === '/history' ? 'text-text-primary' : 'text-text-tertiary'}`}>
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
