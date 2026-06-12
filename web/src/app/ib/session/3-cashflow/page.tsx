'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment, getCompletedSessions } from '@/lib/use-assessment';
import { rdSaveS3 } from '@/lib/api';
import { NumberInput } from '@/components/ui/number-input';
import { RdSessionProgress } from '@/components/ui/rd-session-progress';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ChevronLeft, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Download, AlertTriangle } from 'lucide-react';

const MONTH_LABELS: Record<string, string> = {
  '01': 'ม.ค.', '02': 'ก.พ.', '03': 'มี.ค.', '04': 'เม.ย.',
  '05': 'พ.ค.', '06': 'มิ.ย.', '07': 'ก.ค.', '08': 'ส.ค.',
  '09': 'ก.ย.', '10': 'ต.ค.', '11': 'พ.ย.', '12': 'ธ.ค.',
};
function monthLabel(m: string): string {
  if (!m || !m.includes('-')) return m || '—';
  const [year, mon] = m.trim().split('-');
  return `${MONTH_LABELS[mon] ?? mon} ${Number(year) + 543}`;
}
function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

interface MonthData {
  month: string;
  salesRevenue: string; cashSales: string; collectedFromAr: string; otherIncome: string;
  cogsPaid: string; rentUtilities: string; salaries: string;
  capex: string; interest: string; debtPrincipal: string; taxPaid: string; ownerWithdrawal: string;
}

function emptyMonth(m: string): MonthData {
  return {
    month: m, salesRevenue: '', cashSales: '', collectedFromAr: '', otherIncome: '',
    cogsPaid: '', rentUtilities: '', salaries: '',
    capex: '', interest: '', debtPrincipal: '', taxPaid: '', ownerWithdrawal: '',
  };
}

// WinWin 2566: Revenue=205.25M/yr, COGS=185.46M (GM 9.6%), EBITDA=11.03M
// Monthly ≈ Revenue/12, Cash In ~98% (60% cash + 38% AR), COGS Paid ~90.4%
const WINWIN_EXAMPLE = [
  { salesRevenue: '13,000,000', cashSales: '7,800,000', collectedFromAr: '6,498,000', otherIncome: '0', cogsPaid: '11,752,000', rentUtilities: '80,000', salaries: '900,000', capex: '500,000', interest: '113,467', debtPrincipal: '119,919', taxPaid: '142,586', ownerWithdrawal: '200,000' },
  { salesRevenue: '14,500,000', cashSales: '8,700,000', collectedFromAr: '4,940,000', otherIncome: '0', cogsPaid: '13,108,000', rentUtilities: '80,000', salaries: '900,000', capex: '300,000', interest: '113,467', debtPrincipal: '119,919', taxPaid: '142,586', ownerWithdrawal: '200,000' },
  { salesRevenue: '16,000,000', cashSales: '9,600,000', collectedFromAr: '5,510,000', otherIncome: '0', cogsPaid: '14,464,000', rentUtilities: '80,000', salaries: '900,000', capex: '200,000', interest: '113,467', debtPrincipal: '119,919', taxPaid: '142,586', ownerWithdrawal: '200,000' },
];

export default function Session3CashflowPage() {
  const router = useRouter();
  const { assessmentId, assessment, loading, refresh } = useAssessment();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeMonth, setActiveMonth] = useState(0);

  const defaultMonths = getLastNMonths(3);
  const [months, setMonths] = useState<MonthData[]>(defaultMonths.map(emptyMonth));

  const u = unmaskCurrency;

  useEffect(() => {
    if (assessment?.s3Cashflows?.length) {
      const ALL_KEYS = ['salesRevenue','cashSales','collectedFromAr','otherIncome','cogsPaid','rentUtilities','salaries','capex','interest','debtPrincipal','taxPaid','ownerWithdrawal'];
      const loaded = assessment.s3Cashflows.map((row: any) => {
        const m = emptyMonth(String(row.month).trim());
        for (const k of ALL_KEYS) {
          const val = Number(row[k]);
          if (row[k] != null && val !== 0) (m as any)[k] = maskCurrency(String(Math.round(val)));
        }
        return m;
      });
      if (loaded.length > 0) { setMonths(loaded); setActiveMonth(0); }
    }
    if (assessment?.s3Summary) setResult(assessment.s3Summary);
  }, [assessment?.s3Cashflows, assessment?.s3Summary]);

  const flags = getCompletedSessions(assessment);

  const updateField = (key: string, val: string) => {
    setMonths(prev => prev.map((m, i) => i === activeMonth ? { ...m, [key]: maskCurrency(val) } : m));
  };

  // Cashflow 4 tiers
  const calcCf = (m: MonthData) => {
    const cashIn = u(m.cashSales) + u(m.collectedFromAr) + u(m.otherIncome);
    const realCash = cashIn - u(m.cogsPaid);
    const surplus = realCash - u(m.rentUtilities) - u(m.salaries);
    const growth = surplus - u(m.capex) - u(m.interest) - u(m.debtPrincipal) - u(m.taxPaid) - u(m.ownerWithdrawal);
    const salesRev = u(m.salesRevenue);
    const collectionRate = salesRev > 0 ? cashIn / salesRev : null;
    return { cashIn, realCash, surplus, growth, collectionRate };
  };

  const cf = calcCf(months[activeMonth]);
  const allCf = months.map(calcCf);
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const hasData = months.some(m => u(m.salesRevenue) > 0 || u(m.cashSales) > 0);

  const loadExample = () => {
    const base = getLastNMonths(3);
    setMonths(base.map((m, i) => ({ month: m, ...WINWIN_EXAMPLE[i] } as MonthData)));
    toast.success('โหลดตัวอย่าง WinWin แล้ว');
  };

  const handleSave = async (andNavigate = false) => {
    if (!assessmentId) return;
    const filled = months.filter(m => u(m.salesRevenue) > 0 || u(m.cashSales) > 0);
    if (filled.length < 1) { toast.error('กรุณากรอกอย่างน้อย 1 เดือน'); return; }
    setSaving(true);
    try {
      const payload = filled.map(m => ({
        month: m.month,
        salesRevenue: u(m.salesRevenue), cashSales: u(m.cashSales),
        collectedFromAr: u(m.collectedFromAr), otherIncome: u(m.otherIncome),
        cogsPaid: u(m.cogsPaid), rawMaterial: 0,
        rentUtilities: u(m.rentUtilities), salaries: u(m.salaries),
        debtPayment: 0, taxPaid: u(m.taxPaid),
        ownerWithdrawal: u(m.ownerWithdrawal), reserve: 0,
      }));
      const res: any = await rdSaveS3(assessmentId, { months: payload });
      setResult(res.summary);
      toast.success('บันทึก Cash Flow แล้ว');
      await refresh();
      if (andNavigate) setTimeout(() => router.push('/ib/session/4-loan'), 600);
    } catch (e: any) { toast.error(e.message || 'บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const InputRow = ({ label, fieldKey, note }: { label: string; fieldKey: string; note?: string }) => (
    <div>
      <label className="text-xs font-medium text-text-secondary">
        {label}{note && <span className="ml-1 text-text-tertiary text-[10px]">({note})</span>}
      </label>
      <NumberInput value={(months[activeMonth] as any)?.[fieldKey] ?? ''} onChange={(v) => updateField(fieldKey, v)} compact suffix="฿" />
    </div>
  );

  const SubtotalRow = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
    <div className={`flex justify-between items-center py-2 px-3 rounded-lg mt-2 ${highlight ? 'bg-text-primary/5 border border-text-primary/10' : 'bg-bg-secondary/50'}`}>
      <span className={`text-xs font-semibold ${highlight ? 'text-text-primary' : ''}`}>{label}</span>
      <span className={`num text-sm font-bold ${value < 0 ? 'text-status-bad' : highlight ? 'text-text-primary' : 'text-status-good'}`}>{money(value)}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">Session 3 · Cash Flow 4 ชั้น</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 anim-fade-up">
          <div>
            <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 3 of 6</div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Cash Flow 4 ชั้น</h1>
            <p className="text-sm text-text-secondary mt-1">งบเงินสดฉบับเจ้าของ — เห็นเงินจริงทุกชั้น</p>
          </div>
          <button onClick={loadExample} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-accent/30 bg-transparent cursor-pointer text-accent hover:bg-accent/10">
            <Download size={12} /> โหลดตัวอย่าง WinWin
          </button>
        </div>

        <RdSessionProgress current={3} completedFlags={flags} />

        {/* Month tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {months.map((m, idx) => {
            const filled = u(m.salesRevenue) > 0 || u(m.cashSales) > 0;
            return (
              <button key={m.month} onClick={() => setActiveMonth(idx)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                  activeMonth === idx ? 'bg-accent text-white border-accent'
                    : filled ? 'bg-status-good/10 border-status-good/30 text-text-primary'
                    : 'bg-bg-card border-border text-text-tertiary hover:bg-bg-secondary'
                }`}>
                {monthLabel(m.month)}{filled && <span className="ml-1">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Input column: 4 Tiers ── */}
          <div className="space-y-3">
            {/* Context */}
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-[10px] font-semibold text-text-tertiary uppercase mb-2">Context — ยอดขายรวม</div>
              <InputRow label="ยอดขายรวม (Sales Revenue)" fieldKey="salesRevenue" note="รวมเครดิต" />
            </div>

            {/* Tier 1: Cash In */}
            <div className="bg-bg-card border border-accent/20 rounded-2xl p-4" style={{ background: 'color-mix(in srgb, #3B82F6 3%, var(--bg-card))' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#3B82F6] text-white text-[10px] font-bold flex items-center justify-center">1</div>
                <span className="text-xs font-semibold">CASH IN — เงินเข้าจริง</span>
              </div>
              <div className="space-y-2">
                <InputRow label="ยอดขายสด (Cash Sales)" fieldKey="cashSales" />
                <InputRow label="เก็บจากลูกหนี้ (Collected from AR)" fieldKey="collectedFromAr" />
                <InputRow label="รายได้อื่น (Other Income)" fieldKey="otherIncome" />
              </div>
              <SubtotalRow label="= Cash In" value={cf.cashIn} highlight />
              {cf.collectionRate !== null && (
                <div className={`mt-2 px-3 py-1.5 rounded-lg text-[11px] font-medium ${cf.collectionRate < 0.8 ? 'bg-wash-bad text-status-bad' : 'bg-wash-good text-status-good'}`}>
                  Collection Rate: {(cf.collectionRate * 100).toFixed(1)}%
                  {cf.collectionRate < 0.8 && ' — เก็บเงินไม่ทัน'}
                </div>
              )}
            </div>

            {/* Tier 2: Real Cash */}
            <div className="bg-bg-card border border-[#6366F1]/20 rounded-2xl p-4" style={{ background: 'color-mix(in srgb, #6366F1 3%, var(--bg-card))' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#6366F1] text-white text-[10px] font-bold flex items-center justify-center">2</div>
                <span className="text-xs font-semibold">REAL CASH = Cash In − ต้นทุน</span>
              </div>
              <InputRow label="ต้นทุนสินค้าจ่ายจริง (COGS Paid)" fieldKey="cogsPaid" />
              <SubtotalRow label="= Real Cash" value={cf.realCash} highlight />
            </div>

            {/* Tier 3: Surplus */}
            <div className="bg-bg-card border border-[#8B5CF6]/20 rounded-2xl p-4" style={{ background: 'color-mix(in srgb, #8B5CF6 3%, var(--bg-card))' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold flex items-center justify-center">3</div>
                <span className="text-xs font-semibold">SURPLUS = Real Cash − OPEX</span>
              </div>
              <div className="space-y-2">
                <InputRow label="ค่าเช่า + สาธารณูปโภค" fieldKey="rentUtilities" />
                <InputRow label="เงินเดือนพนักงาน" fieldKey="salaries" />
              </div>
              <SubtotalRow label="= Surplus Cash" value={cf.surplus} highlight />
            </div>

            {/* Tier 4: Growth */}
            <div className="bg-bg-card border border-accent/20 rounded-2xl p-4" style={{ background: 'color-mix(in srgb, var(--accent) 3%, var(--bg-card))' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">4</div>
                <span className="text-xs font-semibold">GROWTH = Surplus − CapEx − หนี้ − ภาษี − เจ้าของ</span>
              </div>
              <div className="space-y-2">
                <InputRow label="เงินลงทุน/ซื้อสินทรัพย์ (CapEx)" fieldKey="capex" />
                <InputRow label="ดอกเบี้ย (Interest)" fieldKey="interest" />
                <InputRow label="เงินต้น/ผ่อนหนี้ (Debt Principal)" fieldKey="debtPrincipal" />
                <InputRow label="ภาษี (Tax Paid)" fieldKey="taxPaid" />
                <InputRow label="เจ้าของถอนเงิน (Owner Withdrawal)" fieldKey="ownerWithdrawal" />
              </div>
              <div className={`flex justify-between items-center py-2.5 px-3 rounded-lg mt-3 border-2 ${cf.growth < 0 ? 'bg-wash-bad border-status-bad/40' : 'bg-text-primary/5 border-text-primary/20'}`}>
                <div>
                  <div className={`text-xs font-bold ${cf.growth < 0 ? 'text-status-bad' : 'text-text-primary'}`}>= Growth Cash (เงินเหลือสำรอง/ขยาย)</div>
                  {cf.growth < 0 && <div className="text-[10px] text-status-bad mt-0.5">ติดลบ — ต้องหาเงินมาโปะ</div>}
                </div>
                <span className={`num text-lg font-bold ${cf.growth < 0 ? 'text-status-bad' : 'text-text-primary'}`}>{money(cf.growth)}</span>
              </div>
            </div>
          </div>

          {/* ── Summary column ── */}
          <div className="space-y-4">
            {/* 3-month summary table */}
            {hasData && (
              <div className="bg-bg-card border border-border rounded-2xl p-4 anim-fade-up">
                <div className="text-xs font-semibold text-text-primary mb-3">สรุป 3 เดือน — น้ำตก 4 ชั้น</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 pr-2 font-semibold text-text-tertiary w-28">รายการ</th>
                        {months.map(m => <th key={m.month} className="text-right py-1.5 px-1 font-semibold text-text-tertiary">{monthLabel(m.month)}</th>)}
                        <th className="text-right py-1.5 pl-1 font-semibold text-accent">เฉลี่ย</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-dashed border-border">
                        <td className="py-1 pr-2 text-text-tertiary italic">ยอดขายรวม</td>
                        {months.map(m => <td key={m.month} className="text-right py-1 px-1 num text-text-tertiary">{money(u(m.salesRevenue))}</td>)}
                        <td className="text-right py-1 pl-1 num text-text-tertiary">{money(avg(months.map(m => u(m.salesRevenue))))}</td>
                      </tr>
                      {[
                        { label: '① Cash In', vals: allCf.map(c => c.cashIn), color: 'text-[#3B82F6]' },
                        { label: '② Real Cash', vals: allCf.map(c => c.realCash), color: 'text-[#6366F1]' },
                        { label: '③ Surplus', vals: allCf.map(c => c.surplus), color: 'text-[#8B5CF6]' },
                        { label: '④ Growth', vals: allCf.map(c => c.growth), color: 'font-bold' },
                      ].map(row => (
                        <tr key={row.label} className="border-b border-border">
                          <td className={`py-1 pr-2 font-semibold ${row.color}`}>{row.label}</td>
                          {row.vals.map((v, i) => (
                            <td key={i} className={`text-right py-1 px-1 num ${v < 0 ? 'text-status-bad font-semibold' : row.color}`}>{money(v)}</td>
                          ))}
                          <td className={`text-right py-1 pl-1 num font-bold text-accent ${avg(row.vals) < 0 ? 'text-status-bad' : ''}`}>{money(avg(row.vals))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {allCf.some(c => c.collectionRate !== null && c.collectionRate < 0.8) && (
                  <div className="mt-3 p-2 rounded-lg bg-wash-bad text-[11px] text-status-bad flex items-start gap-1.5">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />บางเดือน Collection Rate ต่ำกว่า 80%
                  </div>
                )}
                {avg(allCf.map(c => c.growth)) < 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-wash-bad text-[11px] text-status-bad flex items-start gap-1.5">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />Growth Cash เฉลี่ยติดลบ — ต้องหาเงินมาโปะทุกเดือน
                  </div>
                )}
              </div>
            )}

            {/* Stability Score result */}
            {result && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 anim-scale-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-accent">Cashflow Stability Score</div>
                  <div className="flex items-center gap-1.5">
                    {result.trend === 'ขึ้น' ? <><TrendingUp size={14} className="text-status-good" /><span className="text-xs text-status-good">เติบโต</span></>
                      : result.trend === 'ลง' ? <><TrendingDown size={14} className="text-status-bad" /><span className="text-xs text-status-bad">ลดลง</span></>
                      : <><Minus size={14} className="text-status-warn" /><span className="text-xs text-status-warn">ทรงตัว</span></>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-bg-primary rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-text-tertiary">Avg Growth Cash</div>
                    <div className={`num text-sm font-bold ${Number(result.avgGrowth) >= 0 ? 'text-status-good' : 'text-status-bad'}`}>{money(Number(result.avgGrowth))}</div>
                  </div>
                  <div className="bg-bg-primary rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-text-tertiary">Stability Score</div>
                    <div className="num text-sm font-bold text-accent">{result.stabilityScore}/100</div>
                  </div>
                </div>
                {result.warnings?.length > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-wash-bad space-y-1">
                    {result.warnings.map((w: string, i: number) => (
                      <div key={i} className="text-[11px] text-status-bad">• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
          <button onClick={() => router.push('/ib/session/2-financial')}
            className="px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors">
            ← ย้อนกลับ
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors disabled:opacity-40">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border-none disabled:opacity-40 transition-all gradient-accent">
              ถัดไป: วงเงิน →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
