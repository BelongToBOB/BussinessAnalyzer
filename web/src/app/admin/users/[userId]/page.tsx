'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { DashboardTrendChart } from '@/components/ui/charts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

function money(n: number | null | undefined): string {
  if (n == null) return '-';
  return Math.round(n).toLocaleString('en-US');
}

interface UserDetail {
  userId: string;
  businessId: string;
  businessName: string;
  userName: string | null;
  email: string | null;
  template: string;
  createdAt: string;
  monthlyDebtService: number;
  verdictLevel: string;
  keyMetrics: {
    sales: number | null;
    grossMarginPct: number | null;
    netProfit: number | null;
    opexPct: number | null;
    runway: number | null;
  };
  alerts: { level: string; message: string }[];
  trends: { month: string; np: number | null; rw: number | null; gm: number | null }[];
  monthlyDashboards: any[];
  sessions: { sessionType: string; month: string | null; verdict: string | null; updatedAt: string }[];
  completedSessionTypes: string[];
  expenseSummary: { total: number; byCategory: { invest: number; operate: number; waste: number }; itemCount: number };
  lastActiveDate: string | null;
  ibMetrics?: {
    dscr: number | null;
    de: number | null;
    ebitdaMargin: number | null;
    financialScore: number | null;
    growthCash: number | null;
    cashDnaScore: number | null;
  };
}

const STATUS_MAP: Record<string, { emoji: string; label: string; bgClass: string; textClass: string }> = {
  critical: { emoji: '\uD83D\uDD34', label: 'วิกฤต', bgClass: 'bg-wash-bad', textClass: 'text-status-bad' },
  warning: { emoji: '\uD83D\uDFE1', label: 'ระวัง', bgClass: 'bg-wash-warn', textClass: 'text-status-warn' },
  ok: { emoji: '\uD83D\uDFE2', label: 'ดี', bgClass: 'bg-wash-good', textClass: 'text-status-good' },
  inactive: { emoji: '\uD83D\uDCF5', label: 'ไม่ใช้งาน', bgClass: 'bg-wash-empty', textClass: 'text-text-tertiary' },
};

const SESSION_LABELS: Record<string, string> = {
  S1_CHECK_CASH: 'S1 เช็คเงินจริง',
  S2A_INCOME_STATEMENT: 'S2 อ่านงบ',
  S2B_CASHFLOW_2YR: 'S2 งบเงินสด 2 ปี',
  S3_CASHFLOW_4LAYERS: 'S3 Cashflow 4 Layers',
  S4A_PRICING: 'S4 ตั้งราคา',
  S4B_CM: 'S4 CM + จุดคุ้มทุน',
  S4C_REAL_PROFIT: 'S4 Real Profit',
  EXPENSE_MAP: 'S5 Expense Map',
  S6_FIVE_BUCKETS: 'S6 ระบบ 5 ช่อง',
  S7_BUSINESS_PLAN: 'S7 แผน 1 หน้า',
};

const ALL_TOOLS_IBF = [
  'S1_CHECK_CASH', 'S2A_INCOME_STATEMENT', 'S2B_CASHFLOW_2YR',
  'S3_CASHFLOW_4LAYERS', 'S4A_PRICING', 'S4B_CM', 'S4C_REAL_PROFIT',
  'EXPENSE_MAP', 'S6_FIVE_BUCKETS', 'S7_BUSINESS_PLAN',
];

const IB_SESSION_LABELS: Record<string, string> = {
  'ib-identity': 'Step 1 ข้อมูลธุรกิจ',
  'ib-financial': 'Step 2 สแกนงบการเงิน',
  'ib-cash-dna': 'Step 3 กระแสเงินสด 4 ชั้น',
  'ib-bank-view': 'Step 4 มุมมองธนาคาร',
  'ib-capital': 'Step 5 ออกแบบวงเงินกู้',
  'ib-growth': 'Step 6 กู้ได้เท่าไหร่',
  'ib-loan-action': 'Step 7 เตรียมยื่นกู้',
};

const ALL_TOOLS_IB = Object.keys(IB_SESSION_LABELS);

function MetricBox({ label, value, unit, status }: { label: string; value: string; unit?: string; status: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const bgMap = { good: 'bg-wash-good', warn: 'bg-wash-warn', bad: 'bg-wash-bad', neutral: 'bg-bg-card border border-border' };
  return (
    <div className={`${bgMap[status]} rounded-2xl p-4 flex flex-col gap-1`}>
      <div className="text-[11px] text-text-secondary font-medium">{label}</div>
      <div className="num text-xl font-bold text-text-primary">
        {value}
        {unit && <span className="text-xs font-medium text-text-secondary ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const copySummary = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/summary`);
      const { text } = await res.json();
      await navigator.clipboard.writeText(text);
      toast.success('คัดลอกแล้ว');
    } catch {
      toast.error('คัดลอกไม่สำเร็จ');
    }
  };

  if (loading) {
    return <div className="text-sm text-text-secondary py-20 text-center">กำลังโหลด...</div>;
  }

  if (!detail) {
    return <div className="text-sm text-text-secondary py-20 text-center">ไม่พบข้อมูลผู้ใช้</div>;
  }

  const st = STATUS_MAP[detail.verdictLevel] ?? STATUS_MAP.inactive;
  const km = detail.keyMetrics;

  // Determine metric statuses
  const npStatus = km.netProfit == null ? 'neutral' as const : km.netProfit < 0 ? 'bad' as const : 'good' as const;
  const rwStatus = km.runway == null ? 'neutral' as const : km.runway < 3 ? 'bad' as const : km.runway < 6 ? 'warn' as const : 'good' as const;
  const gmStatus = km.grossMarginPct == null ? 'neutral' as const : km.grossMarginPct < 0.1 ? 'bad' as const : km.grossMarginPct < 0.3 ? 'warn' as const : 'good' as const;
  const opexStatus = km.opexPct == null ? 'neutral' as const : km.opexPct > 0.35 ? 'bad' as const : km.opexPct > 0.2 ? 'warn' as const : 'good' as const;

  const completedSet = new Set(detail.completedSessionTypes);

  function daysAgoText(dateStr: string | null): string {
    if (!dateStr) return 'ยังไม่เคยกรอก';
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (d === 0) return 'วันนี้';
    return `${d} วันที่แล้ว`;
  }

  return (
    <div>
      {/* Back link */}
      <Link href="/admin/users" className="text-xs text-accent no-underline font-medium mb-4 inline-block">
        &larr; กลับรายชื่อผู้ใช้
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{detail.businessName}</h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              detail.template === 'ib' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-600'
            }`}>{detail.template === 'ib' ? 'Inside Bank' : 'IBF'}</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {detail.userName && <span>{detail.userName} | </span>}
            {detail.email && <span>{detail.email} | </span>}
            สร้างเมื่อ {new Date(detail.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
            {' | '}กรอกล่าสุด {daysAgoText(detail.lastActiveDate)}
            {detail.monthlyDebtService > 0 && <span> | ภาระหนี้ {money(detail.monthlyDebtService)} บ./ด.</span>}
          </div>
          <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold ${st.bgClass} ${st.textClass}`}>
            {st.emoji} {st.label}
          </div>
        </div>
        <button
          onClick={copySummary}
          className="px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold cursor-pointer border-none shrink-0"
        >
          คัดลอกสรุป
        </button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <MetricBox label="ยอดขาย" value={km.sales != null ? money(km.sales) : '-'} unit="บาท" status="neutral" />
        <MetricBox label="Gross Margin" value={km.grossMarginPct != null ? `${(km.grossMarginPct * 100).toFixed(0)}` : '-'} unit="%" status={gmStatus} />
        <MetricBox label="Net Profit" value={km.netProfit != null ? money(km.netProfit) : '-'} unit="บาท" status={npStatus} />
        <MetricBox label="OPEX %" value={km.opexPct != null ? `${(km.opexPct * 100).toFixed(0)}` : '-'} unit="%" status={opexStatus} />
        <MetricBox label="Cash Runway" value={km.runway != null ? km.runway.toFixed(1) : '-'} unit="เดือน" status={rwStatus} />
      </div>

      {/* Trend chart */}
      {detail.trends.length > 0 && (
        <div className="mb-6">
          <DashboardTrendChart data={detail.trends} />
        </div>
      )}

      {/* Alerts */}
      {detail.alerts.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="text-sm font-semibold mb-3">สัญญาณเตือน</div>
          <div className="flex flex-col gap-2">
            {detail.alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 text-sm ${a.level === 'critical' ? 'text-status-bad' : 'text-status-warn'}`}>
                <span>{a.level === 'critical' ? '\uD83D\uDD34' : '\uD83D\uDFE1'}</span>
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IB Metrics — only for IB users */}
      {detail.template === 'ib' && detail.ibMetrics && (
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="text-sm font-semibold mb-3">Inside Bank — MRI Metrics</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Business Score', value: detail.ibMetrics.financialScore, fmt: (v: number) => `${v}/100` },
              { label: 'DSCR', value: detail.ibMetrics.dscr, fmt: (v: number) => v.toFixed(2) },
              { label: 'D/E Ratio', value: detail.ibMetrics.de, fmt: (v: number) => v.toFixed(2) },
              { label: 'EBITDA Margin', value: detail.ibMetrics.ebitdaMargin, fmt: (v: number) => `${(v * 100).toFixed(0)}%` },
              { label: 'Growth Cash', value: detail.ibMetrics.growthCash, fmt: (v: number) => money(v) },
              { label: 'Cash DNA Score', value: detail.ibMetrics.cashDnaScore, fmt: (v: number) => `${v}/100` },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-xl bg-bg-secondary">
                <div className="text-[10px] text-text-tertiary mb-1">{m.label}</div>
                <div className="num text-base font-bold text-text-primary">
                  {m.value != null ? m.fmt(m.value) : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tools / Steps checklist — adaptive per template */}
      <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
        <div className="text-sm font-semibold mb-3">
          {detail.template === 'ib' ? `IB Steps (${completedSet.size}/${ALL_TOOLS_IB.length})` : `เครื่องมือที่ทำ (${completedSet.size}/${ALL_TOOLS_IBF.length})`}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {(detail.template === 'ib' ? ALL_TOOLS_IB : ALL_TOOLS_IBF).map((tool) => {
            const done = completedSet.has(tool);
            const label = detail.template === 'ib' ? (IB_SESSION_LABELS[tool] ?? tool) : (SESSION_LABELS[tool] ?? tool);
            return (
              <div key={tool} className="flex items-center gap-2 text-sm py-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-status-good' : 'border border-border-strong'}`}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M3 7l3 3 5-6" />
                    </svg>
                  )}
                </div>
                <span className={done ? 'text-text-primary' : 'text-text-tertiary'}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session details — each session with date + verdict */}
      {detail.sessions.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="text-sm font-semibold mb-3">Session Data ({detail.sessions.length} sessions)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-text-secondary font-medium">Session</th>
                  <th className="text-left py-2 px-2 text-text-secondary font-medium">เดือน</th>
                  <th className="text-left py-2 px-2 text-text-secondary font-medium">Verdict</th>
                  <th className="text-right py-2 pl-2 text-text-secondary font-medium">อัพเดท</th>
                </tr>
              </thead>
              <tbody>
                {detail.sessions.map((s, i) => {
                  const label = SESSION_LABELS[s.sessionType] ?? IB_SESSION_LABELS[s.sessionType] ?? s.sessionType;
                  const verdictColor = s.verdict === 'green' ? 'text-status-good' : s.verdict === 'yellow' ? 'text-status-warn' : s.verdict === 'red' ? 'text-status-bad' : 'text-text-tertiary';
                  return (
                    <tr key={i} className="border-b border-border last:border-b-0">
                      <td className="py-2 pr-3 text-text-primary font-medium">{label}</td>
                      <td className="py-2 px-2 text-text-secondary">{s.month ?? '-'}</td>
                      <td className={`py-2 px-2 font-semibold ${verdictColor}`}>{s.verdict ?? '-'}</td>
                      <td className="py-2 pl-2 text-right text-text-secondary">{new Date(s.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense summary */}
      {detail.expenseSummary.itemCount > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="text-sm font-semibold mb-3">Expense Map สรุป</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-text-tertiary">ลงทุน</div>
              <div className="num text-sm font-semibold text-status-good">{money(detail.expenseSummary.byCategory.invest)}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-tertiary">ดำเนินงาน</div>
              <div className="num text-sm font-semibold text-accent">{money(detail.expenseSummary.byCategory.operate)}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-tertiary">สูญเปล่า</div>
              <div className="num text-sm font-semibold text-status-bad">{money(detail.expenseSummary.byCategory.waste)}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            รวม {money(detail.expenseSummary.total)} บาท/เดือน ({detail.expenseSummary.itemCount} รายการ)
          </div>
        </div>
      )}

      {/* Monthly dashboards detail */}
      {detail.monthlyDashboards.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-semibold mb-3">ข้อมูลรายเดือน ({detail.monthlyDashboards.length} เดือน)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-text-secondary font-medium">เดือน</th>
                  <th className="text-right py-2 px-2 text-text-secondary font-medium">ยอดขาย</th>
                  <th className="text-right py-2 px-2 text-text-secondary font-medium">GM%</th>
                  <th className="text-right py-2 px-2 text-text-secondary font-medium">NP</th>
                  <th className="text-right py-2 px-2 text-text-secondary font-medium">OPEX%</th>
                  <th className="text-right py-2 px-2 text-text-secondary font-medium">Runway</th>
                  <th className="text-right py-2 pl-2 text-text-secondary font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {detail.monthlyDashboards.map((md: any) => {
                  const b = md.boxes;
                  const sales = b['1_grossSales']?.value;
                  const gm = b['3_grossMargin']?.value;
                  const np = b['4_netProfit']?.value;
                  const opex = b['5_expenseRatio']?.value;
                  const rw = b['10_runway']?.months;
                  const vLevel = md.verdict?.level;
                  const vSt = STATUS_MAP[vLevel] ?? STATUS_MAP.inactive;

                  return (
                    <tr key={md.month} className="border-b border-border last:border-b-0">
                      <td className="py-2 pr-3 font-medium text-text-primary">{md.month}</td>
                      <td className="py-2 px-2 text-right num">{typeof sales === 'number' ? money(sales) : '-'}</td>
                      <td className="py-2 px-2 text-right num">{typeof gm === 'number' ? `${(gm * 100).toFixed(0)}%` : '-'}</td>
                      <td className={`py-2 px-2 text-right num ${typeof np === 'number' && np < 0 ? 'text-status-bad' : ''}`}>
                        {typeof np === 'number' ? money(np) : '-'}
                      </td>
                      <td className={`py-2 px-2 text-right num ${typeof opex === 'number' && opex > 0.35 ? 'text-status-bad' : ''}`}>
                        {typeof opex === 'number' ? `${(opex * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td className={`py-2 px-2 text-right num ${rw != null && rw < 3 ? 'text-status-bad' : ''}`}>
                        {rw != null ? `${rw.toFixed(1)}` : '-'}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <span className={`${vSt.textClass} font-semibold`}>{vSt.emoji}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
