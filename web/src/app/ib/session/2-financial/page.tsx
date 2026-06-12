'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment, getCompletedSessions } from '@/lib/use-assessment';
import { rdSaveS2 } from '@/lib/api';
import { NumberInput } from '@/components/ui/number-input';
import { RdSessionProgress } from '@/components/ui/rd-session-progress';
import { ScoreRing } from '@/components/ui/score-ring';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ChevronLeft, Download, RotateCcw, CheckCircle2, Circle } from 'lucide-react';

// ─── WinWin 2566 Sample Preset ─────────────────────────────
const WINWIN_PRESET = {
  label: 'ตัวอย่าง: บริษัท วินวิน จำกัด (งบปี 2566)',
  prevYear: 2565, thisYear: 2566,
  prev: {
    revenue: 107939454, cogs: 95837977, depreciation: 1810000,
    interestExpense: 1231008, tax: 0, netProfit: 2626988,
    totalAssets: 83602443, totalLiabilities: 49197692, equity: 34404751,
    annualDebtService: 1223740,
  },
  curr: {
    revenue: 205250748, cogs: 185457426, depreciation: 2100000,
    interestExpense: 1361601, tax: 0, netProfit: 5572744,
    totalAssets: 135080444, totalLiabilities: 95102949, equity: 39977495,
    annualDebtService: 1954208,
  },
};

// ─── Data model ─────────────────────────────────────────────
interface FinRow {
  revenue: string; cogs: string; depreciation: string;
  interestExpense: string; tax: string; netProfit: string;
  totalAssets: string; totalLiabilities: string; equity: string;
  annualDebtService: string;
}

function emptyRow(): FinRow {
  return {
    revenue: '', cogs: '', depreciation: '', interestExpense: '', tax: '',
    netProfit: '', totalAssets: '', totalLiabilities: '', equity: '', annualDebtService: '',
  };
}

const TABLE_ROWS: { key: keyof FinRow | '_grossProfit' | '_ebitda'; label: string; auto?: boolean; indent?: boolean; highlight?: boolean }[] = [
  { key: 'revenue', label: 'รายได้รวม (Revenue)' },
  { key: 'cogs', label: 'ต้นทุนสินค้า (COGS)' },
  { key: '_grossProfit', label: 'กำไรขั้นต้น (Gross Profit)', auto: true },
  { key: 'netProfit', label: 'กำไรสุทธิ (Net Profit)' },
  { key: 'depreciation', label: '+ ค่าเสื่อมราคา (Depreciation)', indent: true },
  { key: 'interestExpense', label: '+ ดอกเบี้ย (Interest Expense)', indent: true },
  { key: 'tax', label: '+ ภาษีเงินได้ (Tax)', indent: true },
  { key: '_ebitda', label: 'EBITDA', auto: true, highlight: true },
  { key: 'totalAssets', label: 'สินทรัพย์รวม (Total Assets)' },
  { key: 'totalLiabilities', label: 'หนี้สินรวม (Total Liabilities)' },
  { key: 'equity', label: 'ส่วนของผู้ถือหุ้น (Equity)' },
  { key: 'annualDebtService', label: 'ภาระหนี้ต่อปี (ต้น+ดอก)' },
];

export default function Session2FinancialPage() {
  const router = useRouter();
  const { assessmentId, assessment, loading, refresh } = useAssessment();
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);

  const currentBE = new Date().getFullYear() + 543;
  const [prevYear, setPrevYear] = useState(currentBE - 2);
  const [thisYear, setThisYear] = useState(currentBE - 1);
  const [prev, setPrev] = useState<FinRow>(emptyRow());
  const [curr, setCurr] = useState<FinRow>(emptyRow());
  const [chk2y, setChk2y] = useState(false);
  const [chkNpl, setChkNpl] = useState(false);

  const u = unmaskCurrency;
  const m = maskCurrency;

  // Load saved data
  useEffect(() => {
    if (!assessment?.s2Financials?.length) return;
    const rows = [...assessment.s2Financials].sort((a: any, b: any) => a.fiscalYear - b.fiscalYear);
    const prevRow = rows.find((r: any) => !r.isLatest) ?? rows[0];
    const currRow = rows.find((r: any) => r.isLatest) ?? rows[rows.length - 1];

    const mapRow = (r: any): FinRow => {
      const fm = (v: any) => v != null && Number(v) !== 0 ? m(String(Math.round(Number(v)))) : '';
      return {
        revenue: fm(r.revenue), cogs: fm(r.cogs), depreciation: fm(r.depreciation),
        interestExpense: fm(r.interestExpense), tax: fm(r.tax), netProfit: fm(r.netProfit),
        totalAssets: fm(r.totalAssets), totalLiabilities: fm(r.totalLiabilities),
        equity: fm(r.equity), annualDebtService: fm(r.annualDebtService),
      };
    };

    if (prevRow !== currRow) {
      setPrevYear(prevRow.fiscalYear);
      setPrev(mapRow(prevRow));
    }
    setThisYear(currRow.fiscalYear);
    setCurr(mapRow(currRow));
    if (assessment.s2Health) setResult(assessment.s2Health);
  }, [assessment?.s2Financials, assessment?.s2Health]);

  const flags = getCompletedSessions(assessment);

  // Auto-computed values
  const grossProfit = (row: FinRow) => u(row.revenue) - u(row.cogs);
  const ebitda = (row: FinRow) => u(row.netProfit) + u(row.depreciation) + u(row.interestExpense) + u(row.tax);
  const getVal = (row: FinRow, key: string): number => {
    if (key === '_grossProfit') return grossProfit(row);
    if (key === '_ebitda') return ebitda(row);
    return u((row as any)[key] ?? '');
  };

  const changePct = (p: number, c: number): number | null => {
    if (p === 0) return null;
    return ((c - p) / Math.abs(p)) * 100;
  };

  // Key ratios (real-time from current year)
  const currEbitda = ebitda(curr);
  const currRev = u(curr.revenue);
  const currLiab = u(curr.totalLiabilities);
  const currEquity = u(curr.equity);
  const currDebt = u(curr.annualDebtService);
  const currCogs = u(curr.cogs);
  const ebitdaMargin = currRev > 0 ? (currEbitda / currRev) * 100 : null;
  const grossMargin = currRev > 0 && currCogs > 0 ? ((currRev - currCogs) / currRev) * 100 : null;
  const deRatio = currEquity > 0 ? currLiab / currEquity : currEquity < 0 ? -Infinity : null;
  const dscr = currDebt > 0 ? currEbitda / currDebt : null;

  // Checklist
  const chkEbitda = currEbitda > 0;
  const chkDscr = dscr !== null && dscr > 1.25;
  const chkDE = deRatio !== null && deRatio !== -Infinity && deRatio < 3;
  const passCount = [chkEbitda, chkDscr, chkDE, chk2y, chkNpl].filter(Boolean).length;
  const readinessLabel = passCount === 5 ? 'พร้อมยื่น' : passCount >= 3 ? 'เกือบพร้อม' : 'ต้องปรับก่อน';

  // Load WinWin preset
  const loadExample = () => {
    const fm = (v: number) => v ? m(String(v)) : '';
    setPrevYear(WINWIN_PRESET.prevYear);
    setThisYear(WINWIN_PRESET.thisYear);
    setPrev(Object.fromEntries(Object.entries(WINWIN_PRESET.prev).map(([k, v]) => [k, fm(v)])) as any);
    setCurr(Object.fromEntries(Object.entries(WINWIN_PRESET.curr).map(([k, v]) => [k, fm(v)])) as any);
    toast.success('โหลดตัวอย่าง WinWin 2566 แล้ว');
  };

  const clearAll = () => {
    setPrev(emptyRow()); setCurr(emptyRow());
    setChk2y(false); setChkNpl(false); setResult(null);
    toast.info('ล้างข้อมูลแล้ว');
  };

  const handleSave = async (andNavigate = false) => {
    if (!assessmentId) return;
    if (!u(curr.revenue)) { toast.error('กรุณากรอก Revenue ปีนี้'); return; }
    setSaving(true);
    try {
      const buildPayload = (row: FinRow, year: number, isLatest: boolean) => ({
        fiscalYear: year, revenue: u(row.revenue), cogs: u(row.cogs),
        sgaExpense: 0, depreciation: u(row.depreciation), interestExpense: u(row.interestExpense),
        tax: u(row.tax), netProfit: u(row.netProfit),
        totalAssets: u(row.totalAssets), totalLiabilities: u(row.totalLiabilities),
        equity: u(row.equity) || (u(row.totalAssets) - u(row.totalLiabilities)),
        cash: 0, accountsReceivable: 0, inventory: 0, accountsPayable: 0,
        annualDebtService: u(row.annualDebtService),
      });
      const years = [buildPayload(prev, prevYear, false), buildPayload(curr, thisYear, true)]
        .filter(y => y.revenue > 0); // only include years with data
      const res: any = await rdSaveS2(assessmentId, { years });
      setResult(res.health);
      toast.success('บันทึกข้อมูลการเงินแล้ว');
      await refresh();
      if (andNavigate) setTimeout(() => router.push('/ib/session/3-cashflow'), 600);
    } catch (e: any) {
      toast.error(e.message || 'บันทึกไม่สำเร็จ');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">Session 2 · สุขภาพการเงิน</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-4 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Session 2 of 6</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Business Health Check</h1>
          <p className="text-sm text-text-secondary mt-1">กรอกงบการเงิน 2 ปีเปรียบเทียบ — ระบบคำนวณ Key Ratios ให้</p>
        </div>

        <RdSessionProgress current={2} completedFlags={flags} />

        {/* Assignment bar + buttons */}
        <div className="bg-accent/8 border border-accent/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-text-secondary">กรอกตัวเลขจริงของธุรกิจคุณ</span>
          <div className="flex gap-2">
            <button onClick={loadExample} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-accent/30 bg-transparent cursor-pointer text-accent hover:bg-accent/10">
              <Download size={12} /> โหลดตัวอย่าง WinWin
            </button>
            <button onClick={clearAll} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border bg-transparent cursor-pointer text-text-tertiary hover:bg-bg-secondary">
              <RotateCcw size={12} /> ล้าง
            </button>
          </div>
        </div>

        {/* PART A: 2-year comparison table */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4 anim-fade-up">
          <div className="bg-text-primary text-bg-primary px-4 py-2.5 text-xs font-semibold">
            PART A | งบการเงิน — กรอกตัวเลขจริงของธุรกิจคุณ
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-tertiary w-[35%]">รายการ</th>
                  <th className="text-center px-2 py-2.5 text-xs font-semibold w-[22%]">
                    <div className="flex items-center justify-center gap-1">
                      <span>ปีที่แล้ว</span>
                      <input type="number" value={prevYear} onChange={(e) => setPrevYear(Number(e.target.value))}
                        className="w-14 text-center border border-border rounded px-1 py-0.5 text-[11px] bg-bg-card text-text-primary outline-none" />
                    </div>
                  </th>
                  <th className="text-center px-2 py-2.5 text-xs font-semibold w-[22%]">
                    <div className="flex items-center justify-center gap-1">
                      <span>ปีนี้</span>
                      <input type="number" value={thisYear} onChange={(e) => setThisYear(Number(e.target.value))}
                        className="w-14 text-center border border-border rounded px-1 py-0.5 text-[11px] bg-bg-card text-text-primary outline-none" />
                    </div>
                  </th>
                  <th className="text-center px-2 py-2.5 text-xs font-semibold w-[21%] bg-status-good/5 text-status-good">เปลี่ยนแปลง %</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(({ key, label, auto, indent, highlight }) => {
                  const prevVal = getVal(prev, key);
                  const currVal = getVal(curr, key);
                  const pct = changePct(prevVal, currVal);
                  const isInput = !auto;
                  const realKey = key.startsWith('_') ? null : key;

                  return (
                    <tr key={key} className={`border-b border-border last:border-b-0 ${highlight ? 'bg-accent/8' : auto ? 'bg-bg-secondary/50' : indent ? 'bg-accent/3' : ''}`}>
                      <td className={`px-4 py-1.5 text-xs ${indent ? 'pl-8 text-text-tertiary' : 'font-medium'}`}>
                        {label}
                        {auto && <span className="ml-1 text-[10px] text-text-tertiary">(auto)</span>}
                      </td>
                      <td className="px-2 py-1.5">
                        {isInput && realKey ? (
                          <NumberInput value={(prev as any)[realKey]} onChange={(v) => setPrev(p => ({ ...p, [realKey]: m(v) }))} compact suffix="฿" />
                        ) : (
                          <div className={`text-right text-xs px-2 py-1.5 rounded ${highlight ? 'font-bold' : 'text-text-secondary'}`}>
                            {u(prev.revenue) > 0 ? money(prevVal) : '—'}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        {isInput && realKey ? (
                          <NumberInput value={(curr as any)[realKey]} onChange={(v) => setCurr(p => ({ ...p, [realKey]: m(v) }))} compact suffix="฿" />
                        ) : (
                          <div className={`text-right text-xs px-2 py-1.5 rounded ${highlight ? 'bg-accent/15 text-accent font-bold' : 'text-text-secondary'}`}>
                            {u(curr.revenue) > 0 ? money(currVal) : '—'}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center text-xs bg-status-good/3">
                        {pct !== null ? (
                          <span className={`font-medium ${pct >= 0 ? 'text-status-good' : 'text-status-bad'}`}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                          </span>
                        ) : <span className="text-text-tertiary">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PART B: Key Ratios */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4 anim-fade-up anim-d1">
          <div className="bg-text-primary text-bg-primary px-4 py-2.5 text-xs font-semibold">
            PART B | Key Ratios ของธุรกิจคุณ
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'EBITDA Margin', formula: '= EBITDA ÷ Revenue × 100', value: ebitdaMargin, fmt: (v: number) => v.toFixed(1) + '%', good: ebitdaMargin !== null && ebitdaMargin >= 15, threshold: '> 15%', color: 'border-status-good bg-wash-good', textColor: 'text-status-good' },
              { label: 'Gross Margin', formula: '= (Revenue−COGS) ÷ Revenue × 100', value: grossMargin, fmt: (v: number) => v.toFixed(1) + '%', good: grossMargin !== null && grossMargin >= 30, threshold: '> 30%', color: 'border-status-good bg-wash-good', textColor: 'text-status-good' },
              { label: 'D/E Ratio', formula: '= หนี้สินรวม ÷ ส่วนผู้ถือหุ้น', value: deRatio === -Infinity ? null : deRatio, fmt: (v: number) => v.toFixed(2) + 'x', good: deRatio !== null && deRatio !== -Infinity && deRatio < 3, threshold: '< 3x', color: 'border-accent bg-wash-info', textColor: 'text-accent', special: deRatio === -Infinity ? 'ทุนติดลบ' : undefined },
              { label: 'DSCR', formula: '= EBITDA ÷ ภาระหนี้ต่อปี', value: dscr, fmt: (v: number) => v.toFixed(2) + 'x', good: dscr !== null && dscr > 1.25, threshold: '> 1.25x', color: 'border-accent bg-wash-info', textColor: 'text-accent', special: currDebt === 0 ? 'ไม่มีหนี้' : undefined },
            ].map((r) => (
              <div key={r.label} className={`border-l-4 rounded-r-xl p-4 ${r.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`text-xs font-bold ${r.textColor}`}>{r.label}</div>
                    <div className="text-[10px] text-text-tertiary mt-0.5">{r.formula}</div>
                  </div>
                  <div className="text-right">
                    {r.special ? (
                      <span className="text-text-tertiary text-xs">{r.special}</span>
                    ) : (
                      <span className={`num text-xl font-bold ${r.good ? 'text-status-good' : 'text-status-bad'}`}>
                        {r.value !== null ? r.fmt(r.value) : '——'}
                      </span>
                    )}
                    <div className="text-[10px] text-text-tertiary">เกณฑ์ดี: {r.threshold}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PART C: Checklist */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4 anim-fade-up anim-d2">
          <div className="bg-status-good text-white px-4 py-2.5 text-xs font-semibold">
            PART C | ธุรกิจคุณพร้อมขอกู้แค่ไหน?
          </div>
          <div className="p-4 space-y-2">
            {[
              { checked: chkEbitda, auto: true, label: 'EBITDA > 0 (มีกำไรจริง)' },
              { checked: chkDscr, auto: true, label: 'DSCR > 1.25x (รายได้พอจ่ายหนี้)' },
              { checked: chkDE, auto: true, label: 'D/E < 3x (หนี้ไม่หนักเกินไป)' },
            ].map((c, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${c.checked ? 'border-status-good/30 bg-wash-good' : 'border-border'}`}>
                {c.checked ? <CheckCircle2 size={18} className="text-status-good shrink-0" /> : <Circle size={18} className="text-text-tertiary shrink-0" />}
                <span className={`text-sm ${c.checked ? 'font-medium' : 'text-text-tertiary'}`}>{c.label}</span>
                {c.auto && <span className="ml-auto text-[10px] text-text-tertiary">อัตโนมัติ</span>}
              </div>
            ))}

            {/* Manual checkboxes */}
            {[
              { checked: chk2y, toggle: () => setChk2y(v => !v), label: 'งบการเงิน 2 ปีล่าสุดพร้อม' },
              { checked: chkNpl, toggle: () => setChkNpl(v => !v), label: 'ไม่มีประวัติค้างชำระ NPL' },
            ].map((c, i) => (
              <button key={i} type="button" onClick={c.toggle}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-left transition-colors ${c.checked ? 'border-accent/30 bg-accent/5' : 'border-border bg-transparent hover:bg-bg-secondary'}`}>
                {c.checked ? <CheckCircle2 size={18} className="text-accent shrink-0" /> : <Circle size={18} className="text-text-tertiary shrink-0" />}
                <span className={`text-sm ${c.checked ? 'font-medium' : 'text-text-tertiary'}`}>{c.label}</span>
              </button>
            ))}

            <div className={`mt-3 p-3 rounded-xl border text-center text-sm font-semibold ${
              passCount === 5 ? 'border-status-good/30 bg-wash-good text-status-good' :
              passCount >= 3 ? 'border-status-warn/30 bg-wash-warn text-status-warn' :
              'border-status-bad/30 bg-wash-bad text-status-bad'
            }`}>
              ผ่าน {passCount}/5 ข้อ — {readinessLabel}
            </div>
          </div>
        </div>

        {/* Reflection + Notes */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4 anim-fade-up">
          <div className="bg-text-primary/90 text-bg-primary px-4 py-2.5 text-xs font-semibold">
            Reflection
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-text-secondary">จากตัวเลขที่กรอก — ธุรกิจของคุณแข็งแรงหรือเสี่ยง? และต้องปรับอะไรก่อนไปขอกู้?</p>
            <textarea placeholder="เขียนความคิดของคุณที่นี่..."
              rows={3} className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
            <p className="text-xs font-medium text-text-tertiary">บันทึก / Notes</p>
            <textarea placeholder="จดบันทึกเพิ่มเติม..."
              rows={3} className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent resize-y" />
          </div>
        </div>

        {/* Health Score result */}
        {result && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mb-4 anim-scale-in">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-accent">Financial Health Score</div>
                <div className="text-xs text-text-secondary mt-1">{result.status}</div>
              </div>
              <ScoreRing score={result.healthScore ?? 0} size={90} label="" />
            </div>
            {result.redFlags?.length > 0 && (
              <div className="mt-2 p-3 rounded-xl bg-wash-bad space-y-1">
                <div className="text-xs font-semibold text-status-bad">Red Flags:</div>
                {result.redFlags.map((f: string, i: number) => (
                  <div key={i} className="text-xs text-status-bad">• {f}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <button onClick={() => router.push('/ib/session/1-mindset')}
            className="px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors">
            ← ย้อนกลับ
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-border bg-transparent text-sm font-medium cursor-pointer hover:bg-bg-secondary transition-colors disabled:opacity-40">
              {saving ? 'กำลังคำนวณ...' : 'บันทึก'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border-none disabled:opacity-40 transition-all gradient-accent">
              ถัดไป: Cash Flow →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
