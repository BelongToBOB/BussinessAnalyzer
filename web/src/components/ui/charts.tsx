'use client';

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart,
} from 'recharts';
import { money } from '@/lib/format';

// ─── Gauge Card (single month) ─────────────────────────────

interface GaugeThreshold {
  pct: number; // 0-1 position on arc
  color: string;
}

function GaugeCard({ label, value, max, min, format, thresholds }: {
  label: string;
  value: number;
  max: number;
  min: number;
  format: 'currency' | 'months';
  thresholds: GaugeThreshold[];
}) {
  const range = max - min;
  const normalized = Math.max(0, Math.min(1, (value - min) / (range || 1)));

  // Arc geometry
  const cx = 80, cy = 72, r = 58;
  const startAngle = Math.PI * 0.8;  // ~144°
  const endAngle = Math.PI * 0.2;    // ~36°
  const totalAngle = Math.PI * 1.6;  // 288° sweep

  // Needle angle
  const needleAngle = startAngle - normalized * totalAngle;
  const needleX = cx + Math.cos(needleAngle) * (r - 12);
  const needleY = cy - Math.sin(needleAngle) * (r - 12);

  // Arc segments
  const segments = thresholds.map((t, i) => {
    const nextPct = i < thresholds.length - 1 ? thresholds[i + 1].pct : 1;
    const a1 = startAngle - t.pct * totalAngle;
    const a2 = startAngle - nextPct * totalAngle;
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy - Math.sin(a1) * r;
    const x2 = cx + Math.cos(a2) * r;
    const y2 = cy - Math.sin(a2) * r;
    const large = (nextPct - t.pct) * totalAngle > Math.PI ? 1 : 0;
    return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}" stroke="${t.color}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.25"/>`;
  }).join('');

  // Active arc (filled portion)
  const activeEnd = startAngle - normalized * totalAngle;
  const ax1 = cx + Math.cos(startAngle) * r;
  const ay1 = cy - Math.sin(startAngle) * r;
  const ax2 = cx + Math.cos(activeEnd) * r;
  const ay2 = cy - Math.sin(activeEnd) * r;
  const activeLarge = normalized * totalAngle > Math.PI ? 1 : 0;

  // Color based on position
  const activeColor = normalized < 0.35 ? 'var(--status-bad)' : normalized < 0.5 ? 'var(--status-warn)' : 'var(--status-good)';

  const displayValue = format === 'currency'
    ? `${value >= 0 ? '+' : ''}${Math.round(value).toLocaleString('en-US')}`
    : value.toFixed(1);
  const unit = format === 'currency' ? 'บาท' : 'เดือน';

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="100" viewBox="0 0 160 100">
        <g dangerouslySetInnerHTML={{ __html: segments }} />
        {normalized > 0 && (
          <path d={`M ${ax1} ${ay1} A ${r} ${r} 0 ${activeLarge} 1 ${ax2} ${ay2}`}
            stroke={activeColor} strokeWidth="8" fill="none" strokeLinecap="round" />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="var(--text-primary)" />
      </svg>
      <div className={`num text-lg font-semibold -mt-2 ${format === 'currency' && value < 0 ? 'text-status-bad' : format === 'months' && value < 3 ? 'text-status-bad' : ''}`}>
        {displayValue} <span className="text-xs font-normal text-text-tertiary">{unit}</span>
      </div>
      <div className="text-[11px] text-text-secondary mt-1 text-center">{label}</div>
    </div>
  );
}

// ─── Dashboard Mini Trend (last 6 months) ─────────────────

interface TrendPoint {
  month: string;
  np: number | null;
  rw: number | null;
  gm: number | null;
}

export function DashboardTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-2xl p-4">
        <div className="h-[120px] flex flex-col items-center justify-center text-center">
          <div className="text-sm text-text-secondary mb-1">ยังไม่มีข้อมูล</div>
          <div className="text-xs text-text-tertiary">กรอกข้อมูลรายเดือนอย่างน้อย 3 เดือนย้อนหลัง เพื่อเห็นกราฟแนวโน้ม</div>
        </div>
      </div>
    );
  }

  // 1 เดือน → แสดง metric cards แทนกราฟเส้น
  if (data.length === 1) {
    const d = data[0];
    return (
      <div className="bg-bg-card border border-border rounded-2xl p-4">
        <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-3">
          ผลเดือนแรก — กรอกย้อนหลังอีกอย่างน้อย 2 เดือน จะเห็นกราฟแนวโน้ม
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-secondary rounded-xl p-3">
            <div className="text-[11px] text-text-secondary">Net Profit (กำไรสุทธิ)</div>
            <div className={`num text-xl font-semibold mt-1 ${d.np != null && d.np < 0 ? 'text-status-bad' : ''}`}>
              {d.np != null ? `${d.np >= 0 ? '+' : ''}${Math.round(d.np).toLocaleString('en-US')}` : '—'}
              <span className="text-xs font-normal text-text-tertiary ml-1">บาท</span>
            </div>
          </div>
          <div className="bg-bg-secondary rounded-xl p-3">
            <div className="text-[11px] text-text-secondary">Cash Runway (เงินสดอยู่ได้กี่เดือน)</div>
            <div className={`num text-xl font-semibold mt-1 ${d.rw != null && d.rw < 3 ? 'text-status-bad' : ''}`}>
              {d.rw != null ? d.rw.toFixed(1) : '—'}
              <span className="text-xs font-normal text-text-tertiary ml-1">เดือน</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: d.month.slice(5),
    'Net Profit': d.np,
    'Cash Runway': d.rw,
  }));

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4 overflow-hidden">
      <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-3">
        แนวโน้ม {data.length} เดือน
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="npGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
            formatter={(value: any, name: any) => [name === 'Net Profit' ? `${money(value)} บาท` : `${value?.toFixed?.(1) ?? value} เดือน`, name] as any}
          />
          <Area type="monotone" dataKey="Net Profit" stroke="var(--text-primary)" strokeWidth={2} fill="url(#npGrad)" dot={{ r: 3 }} />
          <Area type="monotone" dataKey="Cash Runway" stroke="var(--accent)" strokeWidth={2} fill="url(#rwGrad)" dot={{ r: 3 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Expense Map Donut Chart ──────────────────────────────

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

const EXPENSE_COLORS: Record<string, string> = {
  invest: '#34C759',
  operate: '#007AFF',
  waste: '#FF3B30',
};

export function ExpenseDonutChart({ invest, operate, waste }: { invest: number; operate: number; waste: number }) {
  const total = invest + operate + waste;
  if (total === 0) return null;

  const data: ExpenseCategory[] = [
    { name: 'ลงทุน', value: invest, color: EXPENSE_COLORS.invest },
    { name: 'ดำเนินงาน', value: operate, color: EXPENSE_COLORS.operate },
    { name: 'สูญเปล่า', value: waste, color: EXPENSE_COLORS.waste },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-4">
      <div className="w-[140px] h-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
              formatter={(value: any) => [`${money(value)} บาท`, ''] as any}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">{d.name}</div>
              <div className="num text-sm font-semibold">{money(d.value)} <span className="text-text-tertiary font-normal">({((d.value / total) * 100).toFixed(0)}%)</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Five Buckets Visual Bar ──────────────────────────────

interface Bucket {
  name: string;
  pct: number;
  amount: number;
}

const BUCKET_COLORS = ['#34C759', '#007AFF', '#FF9500', '#8B5CF6', '#EC4899'];

export function FiveBucketsChart({ buckets, revenue }: { buckets: Bucket[]; revenue: number }) {
  if (!buckets.length || !revenue) return null;

  return (
    <div>
      {/* Stacked horizontal bar */}
      <div className="h-10 rounded-xl overflow-hidden flex" style={{ background: 'var(--border)' }}>
        {buckets.map((b, i) => (
          <div
            key={i}
            className="h-full flex items-center justify-center transition-all"
            style={{ width: `${b.pct * 100}%`, background: BUCKET_COLORS[i], minWidth: b.pct > 0 ? 2 : 0 }}
          >
            {b.pct >= 0.08 && <span className="text-white text-[10px] font-bold">{(b.pct * 100).toFixed(0)}%</span>}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
        {buckets.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BUCKET_COLORS[i] }} />
            <div className="min-w-0">
              <div className="text-[10px] text-text-secondary truncate">{b.name}</div>
              <div className="num text-xs font-semibold">{money(b.amount)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cashflow Waterfall (4 Layers) ────────────────────────

interface WaterfallStep {
  name: string;
  value: number;
  color: string;
}

export function CashflowWaterfall({ steps }: { steps: WaterfallStep[] }) {
  if (!steps.length) return null;

  const max = Math.max(...steps.map((s) => Math.abs(s.value)), 1);

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => {
        const pct = Math.min(Math.abs(step.value) / max * 100, 100);
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold">{step.name}</span>
              <span className="num font-semibold" style={{ color: step.value >= 0 ? 'var(--status-good)' : 'var(--status-bad)' }}>
                {step.value >= 0 ? '+' : ''}{money(step.value)}
              </span>
            </div>
            <div className="h-6 rounded-lg overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-lg transition-all"
                style={{ width: `${pct}%`, background: step.color, opacity: 0.8 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
