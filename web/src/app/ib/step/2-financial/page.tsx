'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { getSession, saveSession } from '@/lib/api';
import { toast } from 'sonner';
import { TrendingUp, PlusCircle, Package, Users, Clock, Percent, FileText, ChevronLeft, ChevronDown, type LucideIcon } from 'lucide-react';

const PL_FIELDS: { key: string; label: string; Icon: LucideIcon; color: string; optional?: boolean }[] = [
  { key: 'revenue', label: 'รายได้จากการขาย', Icon: TrendingUp, color: '#22C55E' },
  { key: 'otherIncome', label: 'รายได้อื่น', Icon: PlusCircle, color: '#22C55E', optional: true },
  { key: 'cogs', label: 'ต้นทุนสินค้าที่ขาย (COGS)', Icon: Package, color: '#EF4444' },
  { key: 'sga', label: 'ค่าใช้จ่ายขายและบริหาร', Icon: Users, color: '#F97316' },
  { key: 'depreciation', label: 'ค่าเสื่อมราคา', Icon: Clock, color: '#94A3B8', optional: true },
  { key: 'interest', label: 'ดอกเบี้ยจ่าย', Icon: Percent, color: '#EAB308' },
  { key: 'tax', label: 'ภาษีเงินได้', Icon: FileText, color: '#A855F7' },
];

const BS_FIELDS = [
  { key: 'cash', label: 'เงินสด + เงินฝาก', group: 'asset', color: '#22C55E' },
  { key: 'ar', label: 'ลูกหนี้การค้า', group: 'asset', color: '#3B82F6' },
  { key: 'inventory', label: 'สินค้าคงเหลือ', group: 'asset', color: '#06B6D4' },
  { key: 'ap', label: 'เจ้าหนี้การค้า', group: 'liability', color: '#F97316' },
  { key: 'shortLoan', label: 'เงินกู้ระยะสั้น', group: 'liability', color: '#EF4444' },
  { key: 'currentPortionLT', label: 'หนี้ถึงกำหนดใน 1 ปี', group: 'liability', color: '#EF4444' },
  { key: 'longLoan', label: 'เงินกู้ระยะยาว', group: 'liability', color: '#DC2626' },
  { key: 'equity', label: 'ส่วนของเจ้าของ', group: 'equity', color: '#A855F7' },
];

interface DebtRow { name: string; limit: string; annualPayment: string; }

export default function IbStep2Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'pl' | 'bs' | 'debt'>('pl');
  const [showMore, setShowMore] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [debts, setDebts] = useState<DebtRow[]>([{ name: '', limit: '', annualPayment: '' }]);

  useEffect(() => {
    getSession('ib-financial').then((res: any) => {
      const d = res?.data;
      if (!d) return;
      const v: Record<string, string> = {};
      [...PL_FIELDS, ...BS_FIELDS].forEach(f => { if (d[f.key] != null) v[f.key] = maskCurrency(String(d[f.key])); });
      setVals(v);
      if (d.debtSchedule?.length) setDebts(d.debtSchedule.map((r: any) => ({ name: r.name || '', limit: r.limit ? maskCurrency(String(r.limit)) : '', annualPayment: r.annualPayment ? maskCurrency(String(r.annualPayment)) : '' })));
      // If already has data, show result
      // data loaded
    }).catch(() => {});
  }, []);

  const set = (key: string, val: string) => setVals(prev => ({ ...prev, [key]: maskCurrency(val) }));
  const u = (key: string) => unmaskCurrency(vals[key] || '');

  // Computed
  const rev = u('revenue') + u('otherIncome');
  const np = rev - u('cogs') - u('sga') - u('interest') - u('tax');
  const eb = np + u('interest') + u('tax') + u('depreciation');
  const margin = rev > 0 ? (eb / rev * 100) : null;
  const totalAssets = u('cash') + u('ar') + u('inventory');
  const totalLiab = u('ap') + u('shortLoan') + u('currentPortionLT') + u('longLoan');
  const eq = u('equity');
  const de = eq > 0 ? totalLiab / eq : null;
  const ds = debts.reduce((s, d) => s + unmaskCurrency(d.annualPayment), 0);
  const dscrVal = ds > 0 ? eb / ds : null;
  const clD = u('ap') + u('shortLoan') + u('currentPortionLT');
  const cr = clD > 0 ? totalAssets / clD : null;
  const qr = clD > 0 ? (u('cash') + u('ar')) / clD : null;

  // Verdict
  const statusOf = (v: number | null, good: number, warn: number, invert = false) => {
    if (v == null) return 'none';
    if (invert) return v <= good ? 'good' : v <= warn ? 'warn' : 'bad';
    return v >= good ? 'good' : v >= warn ? 'warn' : 'bad';
  };
  const dscrStatus = statusOf(dscrVal, 1.5, 1.25);
  const marginStatus = statusOf(margin, 15, 8);
  const deStatus = statusOf(de, 2, 3, true);

  let overallVerdict = 'ยังไม่มีข้อมูล';
  let verdictColor = 'var(--text-tertiary)';
  let verdictBg = 'bg-bg-card border border-border';
  if (rev > 0) {
    const bad = [dscrStatus, marginStatus, deStatus].filter(s => s === 'bad').length;
    const warn = [dscrStatus, marginStatus, deStatus].filter(s => s === 'warn').length;
    if (bad >= 2) { overallVerdict = 'ต้องปรับฐานก่อน'; verdictColor = 'var(--status-bad)'; verdictBg = 'bg-wash-bad'; }
    else if (bad >= 1) { overallVerdict = 'มีจุดเสี่ยง — ต้องแก้ไข'; verdictColor = 'var(--status-bad)'; verdictBg = 'bg-wash-bad'; }
    else if (warn >= 2) { overallVerdict = 'พอใช้ — ยังมีจุดที่ต้องปรับ'; verdictColor = 'var(--status-warn)'; verdictBg = 'bg-wash-warn'; }
    else if (warn >= 1) { overallVerdict = 'ค่อนข้างดี — ปรับอีกนิด'; verdictColor = 'var(--status-warn)'; verdictBg = 'bg-wash-warn'; }
    else { overallVerdict = 'สุขภาพงบดี — พร้อมเสนอแบงก์'; verdictColor = 'var(--status-good)'; verdictBg = 'bg-wash-good'; }
  }

  // Actions to fix
  const fixes: string[] = [];
  if (dscrStatus === 'bad') fixes.push('ความสามารถชำระหนี้ต่ำ — ลดค่างวดหรือเพิ่มกำไร');
  else if (dscrStatus === 'warn') fixes.push('ชำระหนี้ได้แต่ยังไม่แข็งแรง — เพิ่ม EBITDA');
  if (deStatus === 'bad') fixes.push('หนี้สูงเกินทุน — ลดหนี้หรือเพิ่มทุน');
  else if (deStatus === 'warn') fixes.push('สัดส่วนหนี้ค่อนข้างสูง');
  if (marginStatus === 'bad') fixes.push('กำไรบาง — ปรับราคาหรือลดต้นทุน');

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, any> = {};
      [...PL_FIELDS, ...BS_FIELDS].forEach(f => { data[f.key] = u(f.key); });
      data.debtSchedule = debts.filter(d => d.name || unmaskCurrency(d.annualPayment) > 0).map(d => ({ name: d.name, limit: unmaskCurrency(d.limit), annualPayment: unmaskCurrency(d.annualPayment) }));
      await saveSession('ib-financial', data);
      toast.success('บันทึกสำเร็จ');
      setSaved(true);
    } catch (e: any) { toast.error(e.message || 'บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  const addDebtRow = () => setDebts(old => [...old, { name: '', limit: '', annualPayment: '' }]);
  const removeDebtRow = (i: number) => setDebts(old => old.filter((_, idx) => idx !== i));
  const setDebt = (i: number, key: keyof DebtRow, val: string) => setDebts(old => old.map((d, idx) => idx === i ? { ...d, [key]: key === 'name' ? val : maskCurrency(val) } : d));

  const plFilled = PL_FIELDS.filter(f => !f.optional && vals[f.key]).length;
  const bsFilled = BS_FIELDS.filter(f => vals[f.key]).length;
  const TABS = [
    { id: 'pl' as const, label: 'กำไรขาดทุน', count: `${plFilled}/5` },
    { id: 'bs' as const, label: 'งบดุล', count: `${bsFilled}/8` },
    { id: 'debt' as const, label: 'ตารางหนี้', count: `${debts.filter(d => d.name).length}` },
  ];

  const metricColor = (s: string) => s === 'good' ? 'var(--status-good)' : s === 'warn' ? 'var(--status-warn)' : s === 'bad' ? 'var(--status-bad)' : 'var(--text-tertiary)';

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">Step 2 · สแกนงบการเงิน</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-4 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Step 2 of 7</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">สแกนงบการเงิน</h1>
          <p className="text-sm text-text-secondary mt-1">กรอก 3 ส่วน แล้วดูผลสแกนด้านล่าง</p>
        </div>

        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: s <= 2 ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        {/* ═══════════════ INPUT ═══════════════ */}

        {/* Tab navigation */}
        <div className="flex gap-1 mb-4 anim-fade-up anim-d1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all border ${
                tab === t.id ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'
              }`}>
              {t.label} <span className="num text-[10px] opacity-60 ml-1">{t.count}</span>
            </button>
          ))}
        </div>

        {/* P&L Tab */}
        {tab === 'pl' && (
          <div className="space-y-3 anim-fade-up">
            {PL_FIELDS.map(f => (
              <div key={f.key} className="bg-bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: `color-mix(in srgb, ${f.color} 10%, transparent)` }}>
                  <f.Icon size={16} strokeWidth={1.5} color={f.color} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">
                    {f.label}
                    {f.optional && <span className="text-text-tertiary font-normal text-xs"> — ไม่บังคับ</span>}
                  </label>
                  <NumberInput value={vals[f.key] || ''} onChange={v => { set(f.key, v); setSaved(false); }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Balance Sheet Tab */}
        {tab === 'bs' && (
          <div className="anim-fade-up">
            {['asset', 'liability', 'equity'].map(group => {
              const fields = BS_FIELDS.filter(f => f.group === group);
              const groupLabel = group === 'asset' ? 'สินทรัพย์' : group === 'liability' ? 'หนี้สิน' : 'ส่วนของเจ้าของ';
              const groupTotal = fields.reduce((s, f) => s + u(f.key), 0);
              return (
                <div key={group} className="mb-4">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: fields[0]?.color }}>{groupLabel}</span>
                    {groupTotal > 0 && <span className="num text-xs font-semibold text-text-secondary">{money(groupTotal)}</span>}
                  </div>
                  <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
                    {fields.map(f => (
                      <div key={f.key} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">{f.label}</label>
                          <NumberInput value={vals[f.key] || ''} onChange={v => { set(f.key, v); setSaved(false); }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Debt Tab */}
        {tab === 'debt' && (
          <div className="anim-fade-up">
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              {debts.map((d, i) => (
                <div key={i} className={`${i > 0 ? 'mt-4 pt-4 border-t border-border' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-wash-bad">
                        <span className="num text-[10px] font-bold text-status-bad">{i + 1}</span>
                      </div>
                      <span className="text-xs text-text-secondary font-semibold">หนี้ก้อนที่ {i + 1}</span>
                    </div>
                    {debts.length > 1 && <button onClick={() => removeDebtRow(i)} className="text-xs text-status-bad cursor-pointer bg-transparent border-none">ลบ</button>}
                  </div>
                  <input value={d.name} onChange={e => setDebt(i, 'name', e.target.value)} placeholder="ชื่อหนี้"
                    className="w-full h-11 rounded-xl border border-border px-4 text-sm bg-bg-card text-text-primary outline-none focus:border-accent font-thai mb-3" />
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-text-secondary mb-1 block">วงเงิน</label><NumberInput value={d.limit} onChange={v => setDebt(i, 'limit', v)} /></div>
                    <div><label className="text-xs text-text-secondary mb-1 block">ผ่อน/ปี</label><NumberInput value={d.annualPayment} onChange={v => setDebt(i, 'annualPayment', v)} /></div>
                  </div>
                </div>
              ))}
              <button onClick={addDebtRow} className="mt-4 w-full h-10 rounded-xl border border-dashed border-border text-sm font-medium cursor-pointer bg-transparent hover:bg-bg-secondary transition" style={{ color: 'var(--accent)' }}>+ เพิ่มหนี้อีกก้อน</button>
              {ds > 0 && <div className="mt-4 pt-3 border-t border-border flex justify-between"><span className="text-sm text-text-secondary">ภาระหนี้รวม/ปี</span><span className="num text-sm font-bold text-status-bad">{money(ds)}</span></div>}
            </div>
          </div>
        )}

        {/* ═══════════════ LIVE RESULTS ═══════════════ */}
        {rev > 0 && (
          <div className="mt-6 anim-fade-up">
            {/* 1. Big Verdict */}
            <div className={`rounded-2xl p-6 mb-4 ${verdictBg}`}>
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-2">ผลสแกนงบ</div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: verdictColor }}>{overallVerdict}</div>
            </div>

            {/* 2. P&L Flow — one visual */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-4">เงินไหลจากรายได้สู่กำไร</div>
              {[
                { label: 'รายได้', value: rev, pct: 100, color: '#22C55E' },
                { label: 'ต้นทุนสินค้า', value: u('cogs'), pct: rev > 0 ? u('cogs') / rev * 100 : 0, color: '#EF4444' },
                { label: 'ค่าใช้จ่ายบริหาร', value: u('sga'), pct: rev > 0 ? u('sga') / rev * 100 : 0, color: '#F97316' },
                { label: 'ดอกเบี้ย+ภาษี', value: u('interest') + u('tax'), pct: rev > 0 ? (u('interest') + u('tax')) / rev * 100 : 0, color: '#EAB308' },
              ].map((row, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-text-secondary">{i > 0 ? '−' : ''} {row.label}</span>
                    <span className="num text-xs font-semibold" style={{ color: row.color }}>{money(row.value)} <span className="text-text-tertiary font-normal">({row.pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-3 rounded-md overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-md transition-all duration-700" style={{ width: `${row.pct}%`, background: row.color, opacity: i === 0 ? 1 : 0.65 }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-bold">กำไรสุทธิ</span>
                <span className="num text-lg font-bold" style={{ color: np >= 0 ? '#22C55E' : '#EF4444' }}>
                  {np >= 0 ? '+' : ''}{money(np)}
                  <span className="text-xs font-normal text-text-tertiary ml-1">{rev > 0 ? `(${(np / rev * 100).toFixed(0)}%)` : ''}</span>
                </span>
              </div>
            </div>

            {/* 3. Three key metrics */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'ชำระหนี้ (DSCR)', value: dscrVal != null ? dscrVal.toFixed(2) : '—', sub: dscrVal != null ? (dscrVal >= 1.5 ? 'แข็งแรง' : dscrVal >= 1.25 ? 'พอไหว' : 'ต่ำ') : 'ไม่มีหนี้', status: dscrStatus },
                { label: 'อัตรากำไร', value: margin != null ? margin.toFixed(0) + '%' : '—', sub: margin != null ? (margin >= 15 ? 'ดี' : margin >= 8 ? 'บาง' : 'ต่ำมาก') : '', status: marginStatus },
                { label: 'หนี้ต่อทุน (D/E)', value: de != null ? de.toFixed(1) + 'x' : '—', sub: de != null ? (de <= 2 ? 'ดี' : de <= 3 ? 'สูง' : 'สูงมาก') : '', status: deStatus },
              ].map((m, i) => (
                <div key={i} className="bg-bg-card border border-border rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-text-tertiary mb-2">{m.label}</div>
                  <div className="num text-2xl font-bold" style={{ color: metricColor(m.status) }}>{m.value}</div>
                  <div className="text-[11px] mt-1" style={{ color: metricColor(m.status) }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* 4. What to fix */}
            {fixes.length > 0 && (
              <div className="bg-bg-card border border-border rounded-2xl p-4 mb-4">
                <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-3">จุดที่ต้องปรับ</div>
                {fixes.slice(0, 2).map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2 border-t border-border first:border-t-0">
                    <div className="w-5 h-5 rounded-md bg-wash-bad flex items-center justify-center shrink-0 mt-0.5">
                      <span className="num text-[10px] font-bold text-status-bad">{i + 1}</span>
                    </div>
                    <span className="text-sm text-text-primary">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Show more (expand) */}
            <button onClick={() => setShowMore(!showMore)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer bg-transparent border-none text-text-tertiary hover:text-text-secondary">
              {showMore ? 'ซ่อนรายละเอียด' : 'ดูตัวชี้วัดเพิ่มเติม'}
              <ChevronDown size={14} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>

            {showMore && (
              <div className="grid grid-cols-2 gap-2 mt-2 mb-4 anim-fade-up">
                {[
                  { label: 'สภาพคล่อง (CR)', value: cr != null ? cr.toFixed(2) : '—', status: statusOf(cr, 1.5, 1.0) },
                  { label: 'คล่องเร็ว (QR)', value: qr != null ? qr.toFixed(2) : '—', status: statusOf(qr, 1.0, 0.5) },
                  { label: 'สินทรัพย์หมุนเวียน', value: money(totalAssets), status: 'none' },
                  { label: 'หนี้สินรวม', value: money(totalLiab), status: totalLiab > totalAssets ? 'bad' : 'none' },
                  { label: 'กำไรก่อนหัก (EBITDA)', value: money(eb), status: eb > 0 ? 'good' : 'bad' },
                  { label: 'ภาระหนี้/ปี', value: ds > 0 ? money(ds) : 'ไม่มี', status: 'none' },
                ].map((m, i) => (
                  <div key={i} className="bg-bg-card border border-border rounded-xl p-3">
                    <div className="text-[10px] text-text-tertiary">{m.label}</div>
                    <div className="num text-sm font-bold mt-0.5" style={{ color: metricColor(m.status) }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Save + Next */}
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} disabled={saving || u('revenue') === 0}
                className="flex-1 rounded-xl font-semibold cursor-pointer border-none text-sm disabled:opacity-40 transition-all gradient-accent"
                style={{ height: 48 }}>
                {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึก'}
              </button>
              {saved && (
                <button onClick={() => router.push('/ib/step/3-cash-dna')}
                  className="flex-1 rounded-xl border border-border bg-bg-card font-semibold cursor-pointer text-sm text-text-primary"
                  style={{ height: 48 }}>
                  ไป Step 3 →
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
