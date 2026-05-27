'use client';

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart,
} from 'recharts';
import { money } from '@/lib/format';

// ─── Dashboard Mini Trend (last 6 months) ─────────────────

interface TrendPoint {
  month: string;
  np: number | null;
  rw: number | null;
  gm: number | null;
}

export function DashboardTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    month: d.month.slice(5), // "05" from "2026-05"
    'Net Profit': d.np,
    'Cash Runway': d.rw,
  }));

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4">
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
