'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { getSession } from '@/lib/api';
import { NumberInput } from '@/components/ui/number-input';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';
import { SessionSave } from '@/components/ui/session-save';
import { SessionGuide } from '@/components/ui/session-guide';

/* ────────────────────────────────────────────
   Field definitions matching Excel template
   ──────────────────────────────────────────── */

const ASSET_FIELDS = [
  { key: 'cash', label: 'เงินสดและเงินฝากธนาคาร', desc: 'เงินสด + เงินฝากทุกบัญชี' },
  { key: 'ar', label: 'ลูกหนี้การค้า', desc: 'ลูกค้าซื้อแล้วยังไม่จ่าย' },
  { key: 'inventory', label: 'สินค้าคงเหลือ (สต็อก)', desc: 'มูลค่าสินค้า/วัตถุดิบที่ยังขายไม่ออก' },
  { key: 'otherCurrentAssets', label: 'สินทรัพย์หมุนเวียนอื่นๆ (ถ้ามี)', desc: 'เช่น เงินจ่ายล่วงหน้า ภาษีซื้อ — ไม่มีเว้นว่าง' },
  { key: 'fixedAssets', label: 'ที่ดิน อาคาร อุปกรณ์ (สุทธิ)', desc: 'อาคาร เครื่องจักร รถ อุปกรณ์ — ยอดหลังหักค่าเสื่อม' },
] as const;

const LIABILITY_FIELDS = [
  { key: 'ap', label: 'เจ้าหนี้การค้า', desc: 'เราซื้อของแล้วยังไม่จ่ายซัพพลายเออร์' },
  { key: 'otherLiabilities', label: 'หนี้สินอื่นๆ (ถ้ามี)', desc: 'รวม: ภาษีเงินได้ค้างจ่าย + หนี้สินหมุนเวียนอื่น' },
  { key: 'loans', label: 'เงินกู้ยืม (ระยะสั้น + ระยะยาว)', desc: 'รวม: เงินเบิกเกินบัญชี + เงินกู้ระยะสั้น + ระยะยาว' },
  { key: 'equity', label: 'ส่วนของเจ้าของ (ทุน + กำไรสะสม)', desc: 'ทุนจดทะเบียน + กำไรสะสม' },
] as const;

/* Additional fields needed for ratios (Part 4) */
const RATIO_INPUT_FIELDS = [
  { key: 'revenue', label: 'รายได้จากการขาย (Revenue)' },
  { key: 'cogs', label: 'ต้นทุนขาย (COGS)' },
  { key: 'interestExpense', label: 'ดอกเบี้ยจ่าย (Interest Expense)' },
  { key: 'taxExpense', label: 'ภาษีเงินได้ (Tax)' },
  { key: 'principalRepayment', label: 'เงินต้นเงินกู้ที่ชำระคืน (Principal Repayment)' },
  { key: 'currentLiabilities', label: 'หนี้สินหมุนเวียนรวม (Total Current Liabilities)' },
] as const;

type YearData = Record<string, string>;

function u(v: string) { return unmaskCurrency(v); }

export default function S2CashflowPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  const [prev, setPrev] = useState<YearData>({});
  const [curr, setCurr] = useState<YearData>({});
  const [netProfit, setNetProfit] = useState('');
  const [depAmort, setDepAmort] = useState('');

  /* Additional ratio inputs: prev/curr */
  const [ratioPrev, setRatioPrev] = useState<YearData>({});
  const [ratioCurr, setRatioCurr] = useState<YearData>({});

  /* P&L for previous year (needed for 2-year ratios) */
  const [netProfitPrev, setNetProfitPrev] = useState('');
  const [depAmortPrev, setDepAmortPrev] = useState('');

  /* CFI asset sale fields */
  const [assetSaleNBV, setAssetSaleNBV] = useState('');
  const [assetSaleCash, setAssetSaleCash] = useState('');

  useEffect(() => {
    const maskObj = (obj: Record<string, any>): YearData => {
      const out: YearData = {};
      for (const [k, v] of Object.entries(obj)) out[k] = v ? maskCurrency(String(v)) : '';
      return out;
    };
    getSession('s2-cashflow').then((res: any) => {
      const d = res?.data;
      if (!d) return;
      if (d.prev) setPrev(maskObj(d.prev));
      if (d.curr) setCurr(maskObj(d.curr));
      if (d.netProfit) setNetProfit(maskCurrency(String(d.netProfit)));
      if (d.depAmort) setDepAmort(maskCurrency(String(d.depAmort)));
      if (d.netProfitPrev) setNetProfitPrev(maskCurrency(String(d.netProfitPrev)));
      if (d.depAmortPrev) setDepAmortPrev(maskCurrency(String(d.depAmortPrev)));
      if (d.ratioPrev) setRatioPrev(maskObj(d.ratioPrev));
      if (d.ratioCurr) setRatioCurr(maskObj(d.ratioCurr));
      if (d.assetSaleNBV) setAssetSaleNBV(maskCurrency(String(d.assetSaleNBV)));
      if (d.assetSaleCash) setAssetSaleCash(maskCurrency(String(d.assetSaleCash)));
    }).catch(() => {});
  }, []);

  const setField = (year: 'prev' | 'curr', key: string, val: string) => {
    const setter = year === 'prev' ? setPrev : setCurr;
    setter((old) => ({ ...old, [key]: maskCurrency(val) }));
  };

  const setRatioField = (year: 'prev' | 'curr', key: string, val: string) => {
    const setter = year === 'prev' ? setRatioPrev : setRatioCurr;
    setter((old) => ({ ...old, [key]: maskCurrency(val) }));
  };

  const g = (year: YearData, key: string) => u(year[key] || '');
  const d = (key: string) => g(curr, key) - g(prev, key);

  /* ── CFO ── */
  const np = u(netProfit);
  const dep = u(depAmort);
  const deltaAR = d('ar');
  const deltaInv = d('inventory');
  const deltaOtherCA = d('otherCurrentAssets');
  const deltaAP = d('ap');
  const deltaOtherLiab = d('otherLiabilities');
  const cfo = np + dep - deltaAR - deltaInv - deltaOtherCA + deltaAP + deltaOtherLiab;

  /* ── CFI (with optional asset sale) ── */
  const deltaFixed = d('fixedAssets');
  const saleNBV = u(assetSaleNBV);
  const saleCash = u(assetSaleCash);
  const cfi = -(deltaFixed + dep + saleNBV) + saleCash;

  /* ── CFF (Excel formula: deltaLoans + (deltaEquity - netProfit)) ── */
  const deltaLoans = d('loans');
  const deltaEquity = d('equity');
  const cff = deltaLoans + (deltaEquity - np);

  const netCashChange = cfo + cfi + cff;
  const actualCashChange = d('cash');
  const balanceCheck = Math.abs(netCashChange - actualCashChange) < 1;
  const balanceDiff = netCashChange - actualCashChange;

  /* ── Balance sheet totals ── */
  const totalAssetsPrev = ASSET_FIELDS.reduce((s, f) => s + g(prev, f.key), 0);
  const totalAssetsCurr = ASSET_FIELDS.reduce((s, f) => s + g(curr, f.key), 0);
  const totalLiabEquityPrev = LIABILITY_FIELDS.reduce((s, f) => s + g(prev, f.key), 0);
  const totalLiabEquityCurr = LIABILITY_FIELDS.reduce((s, f) => s + g(curr, f.key), 0);
  const bsCheckPrev = Math.abs(totalAssetsPrev - totalLiabEquityPrev) < 1;
  const bsCheckCurr = Math.abs(totalAssetsCurr - totalLiabEquityCurr) < 1;
  const bsCheck = bsCheckPrev && bsCheckCurr;
  const bsDiffPrev = totalAssetsPrev - totalLiabEquityPrev;
  const bsDiffCurr = totalAssetsCurr - totalLiabEquityCurr;

  /* ── Ratios (both years) ── */
  const npPrev = u(netProfitPrev);
  const depPrev = u(depAmortPrev);

  function computeRatios(yearBS: YearData, yearRatio: YearData, yearNP: number, yearDep: number) {
    const currentAssets = g(yearBS, 'cash') + g(yearBS, 'ar') + g(yearBS, 'inventory') + g(yearBS, 'otherCurrentAssets');
    const curLiab = g(yearRatio, 'currentLiabilities');
    const totalDebt = g(yearBS, 'loans') + g(yearBS, 'ap') + g(yearBS, 'otherLiabilities');
    const equity = g(yearBS, 'equity');
    const revenue = g(yearRatio, 'revenue');
    const cogs = g(yearRatio, 'cogs');
    const interest = g(yearRatio, 'interestExpense');
    const tax = g(yearRatio, 'taxExpense');
    const principal = g(yearRatio, 'principalRepayment');

    const currentRatio = curLiab > 0 ? currentAssets / curLiab : null;
    const de = equity > 0 ? totalDebt / equity : null;
    const ebitda = yearNP + yearDep + interest + tax;
    const dscr = (interest + principal) > 0 ? ebitda / (interest + principal) : null;
    const arDOH = revenue > 0 ? (g(yearBS, 'ar') / revenue) * 365 : null;
    const invDOH = cogs > 0 ? (g(yearBS, 'inventory') / cogs) * 365 : null;
    const apDOH = cogs > 0 ? (g(yearBS, 'ap') / cogs) * 365 : null;
    const ccc = (arDOH != null && invDOH != null && apDOH != null) ? arDOH + invDOH - apDOH : null;

    return { currentRatio, de, dscr, arDOH, invDOH, apDOH, ccc };
  }

  const ratiosCurr = computeRatios(curr, ratioCurr, np, dep);
  const ratiosPrev = computeRatios(prev, ratioPrev, npPrev, depPrev);

  const hasInput = totalAssetsCurr > 0 || totalAssetsPrev > 0;

  const tabs = [
    'ส่วนที่ 1: กรอกงบ',
    'ส่วนที่ 2: งบกระแสเงินสด',
    'ส่วนที่ 3: ตรวจสอบ',
    'ส่วนที่ 4: อัตราส่วน',
  ];

  /* ── Owner summary text ── */
  const cfoDrainOrGenerate = cfo < 0
    ? `แต่การดำเนินงานจริงดูดเงินออก ${money(Math.abs(cfo))} บาท เพราะเงินไปจมที่ลูกหนี้/สต็อก`
    : `และการดำเนินงานสร้างเงินสดได้จริง ${money(cfo)} บาท`;
  const ownerSummary = `ปีนี้กำไรสุทธิ ${money(np)} บาท — ${cfoDrainOrGenerate}   ทั้งปีเงินสดเปลี่ยน ${money(netCashChange)} บาท`;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S2 &middot; งบเงินสด 2 ปี</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">งบกระแสเงินสด (2 ปี)</h1>
        <p className="text-sm text-text-secondary mt-1 mb-4">กรอกงบดุล 2 ปี เพื่อวิเคราะห์กระแสเงินสด</p>

        <SessionGuide page="s2-cashflow" />

        {/* Tab selector */}
        <div className="flex gap-1 bg-bg-card border border-border rounded-xl p-1 mb-6">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-semibold cursor-pointer border-none transition-colors ${tab === i ? 'bg-text-primary text-bg-primary' : 'bg-transparent text-text-secondary'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ═══════════════ Tab 1: Input ═══════════════ */}
        {tab === 0 && (
          <div className="space-y-6">
            {/* P&L inputs */}
            <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">งบกำไรขาดทุน</div>

              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <div className="text-xs text-text-secondary text-center font-semibold">ปีก่อน</div>
                <div className="text-xs text-text-secondary text-center font-semibold">ปีนี้</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">กำไรสุทธิ (Net Profit)</label>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput value={netProfitPrev} onChange={setNetProfitPrev} />
                  <NumberInput value={netProfit} onChange={setNetProfit} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ค่าเสื่อมราคา+ค่าตัดจำหน่าย</label>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput value={depAmortPrev} onChange={setDepAmortPrev} />
                  <NumberInput value={depAmort} onChange={setDepAmort} />
                </div>
              </div>
            </div>

            {/* Assets */}
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1">สินทรัพย์</div>
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-3">
                <div className="text-xs text-text-secondary" />
                <div className="text-xs text-text-secondary text-center font-semibold">ปีก่อน</div>
                <div className="text-xs text-text-secondary text-center font-semibold">ปีนี้</div>
              </div>
              {ASSET_FIELDS.map((f) => (
                <div key={f.key} className="mb-3">
                  <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
                    <label className="text-sm">{f.label}</label>
                    <input inputMode="numeric" value={prev[f.key] || ''} onChange={(e) => setField('prev', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                    <input inputMode="numeric" value={curr[f.key] || ''} onChange={(e) => setField('curr', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                  </div>
                  <div className="text-[11px] text-text-tertiary mt-0.5 pl-1">{f.desc}</div>
                </div>
              ))}
              {/* Total assets row */}
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center border-t border-border pt-2 mt-2">
                <span className="text-sm font-semibold">= รวมสินทรัพย์</span>
                <span className="text-sm font-semibold text-right num pr-2.5">{money(totalAssetsPrev)}</span>
                <span className="text-sm font-semibold text-right num pr-2.5">{money(totalAssetsCurr)}</span>
              </div>
            </div>

            {/* Liabilities + Equity */}
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1">หนี้สิน + ส่วนของเจ้าของ</div>
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-3">
                <div className="text-xs text-text-secondary" />
                <div className="text-xs text-text-secondary text-center font-semibold">ปีก่อน</div>
                <div className="text-xs text-text-secondary text-center font-semibold">ปีนี้</div>
              </div>
              {LIABILITY_FIELDS.map((f) => (
                <div key={f.key} className="mb-3">
                  <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
                    <label className="text-sm">{f.label}</label>
                    <input inputMode="numeric" value={prev[f.key] || ''} onChange={(e) => setField('prev', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                    <input inputMode="numeric" value={curr[f.key] || ''} onChange={(e) => setField('curr', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                  </div>
                  <div className="text-[11px] text-text-tertiary mt-0.5 pl-1">{f.desc}</div>
                </div>
              ))}
              {/* Total liabilities + equity row */}
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center border-t border-border pt-2 mt-2">
                <span className="text-sm font-semibold">= รวมหนี้สิน + ส่วนของเจ้าของ</span>
                <span className="text-sm font-semibold text-right num pr-2.5">{money(totalLiabEquityPrev)}</span>
                <span className="text-sm font-semibold text-right num pr-2.5">{money(totalLiabEquityCurr)}</span>
              </div>
            </div>

            {/* CFI asset sale optional */}
            <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">การขาย/ตัดจำหน่ายสินทรัพย์ (ถ้ามี)</div>
              <div>
                <label className="text-sm font-medium mb-1 block">มูลค่าตามบัญชี NBV</label>
                <NumberInput value={assetSaleNBV} onChange={setAssetSaleNBV} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">เงินสดที่ได้รับ</label>
                <NumberInput value={assetSaleCash} onChange={setAssetSaleCash} />
              </div>
            </div>

            <button onClick={() => setTab(1)} className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm">
              ดูงบกระแสเงินสด &rarr;
            </button>
          </div>
        )}

        {/* ═══════════════ Tab 2: Cash Flow Statement ═══════════════ */}
        {tab === 1 && (
          <div className="space-y-4">
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">กระแสเงินสดจากการดำเนินงาน (CFO)</div>
              <CfRow label="กำไรสุทธิ" value={np} desc="จุดเริ่มต้น — กำไรตามบัญชี" />
              <CfRow label="+ ค่าเสื่อมราคา" value={dep} desc="ลงบัญชีแต่ไม่ได้จ่ายเงินจริง จึงบวกกลับ" />
              <CfRow label="- เพิ่มขึ้นในลูกหนี้การค้า" value={-deltaAR} desc="เพิ่ม = ขายได้แต่เงินยังไม่เข้า (ติดลบ)" />
              <CfRow label="- เพิ่มขึ้นในสต็อก" value={-deltaInv} desc="เพิ่ม = เงินไปจมในของ (ติดลบ)" />
              <CfRow label="- เพิ่มขึ้นในสินทรัพย์หมุนเวียนอื่น" value={-deltaOtherCA} desc="เพิ่ม = เงินไปจมในรายการอื่น (ติดลบ)" />
              <CfRow label="+ เพิ่มขึ้นในเจ้าหนี้การค้า" value={deltaAP} desc="เพิ่ม = ยืดเวลาจ่ายซัพพลายเออร์ได้ (บวก)" />
              <CfRow label="+ เพิ่มขึ้นในหนี้สินอื่น" value={deltaOtherLiab} desc="เพิ่ม = ยังไม่ต้องจ่าย จึงเป็นบวก" />
              <CfRow label="= CFO" value={cfo} bold color={cfo >= 0 ? 'good' : 'bad'} />
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">กระแสเงินสดจากการลงทุน (CFI)</div>
              <CfRow label="ซื้อสินทรัพย์ถาวร (Gross Capex)" value={-(deltaFixed + dep + saleNBV)} desc="เงินที่จ่ายซื้อสินทรัพย์ใหม่" />
              {(saleNBV > 0 || saleCash > 0) && (
                <CfRow label="+ เงินสดจากการขายสินทรัพย์" value={saleCash} desc="เงินที่ได้รับจริงจากการขาย/ตัดจำหน่าย" />
              )}
              <CfRow label="= CFI" value={cfi} bold color={cfi >= 0 ? 'good' : 'bad'} />
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">กระแสเงินสดจากการจัดหาเงิน (CFF)</div>
              <CfRow label="เปลี่ยนแปลงเงินกู้" value={deltaLoans} desc="กู้เพิ่ม = บวก / ชำระคืน = ลบ" />
              <CfRow label="เปลี่ยนแปลงส่วนของเจ้าของ (หักกำไร)" value={deltaEquity - np} desc="เฉพาะเงินเจ้าของใส่เพิ่ม/ถอนออก (หักกำไรสุทธิออก)" />
              <CfRow label="= CFF" value={cff} bold />
            </div>

            <div className={`rounded-2xl p-4 ${balanceCheck ? 'bg-wash-good' : 'bg-wash-warn'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">เงินสดเปลี่ยนแปลงสุทธิ (CFO+CFI+CFF)</span>
                <span className="num font-bold text-lg">{money(netCashChange)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-text-secondary">เงินสดเปลี่ยนแปลงจริง (จากงบดุล)</span>
                <span className="num font-semibold">{money(actualCashChange)}</span>
              </div>
            </div>

            <button onClick={() => setTab(2)} className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm">
              ดูผลตรวจสอบ &rarr;
            </button>
          </div>
        )}

        {/* ═══════════════ Tab 3: Balance Check + Summary ═══════════════ */}
        {tab === 2 && (
          <div className="space-y-4">
            {/* Balance sheet check */}
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">ตรวจสอบงบดุล</div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">ปีก่อน: รวมสินทรัพย์</span>
                  <span className="num">{money(totalAssetsPrev)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">ปีก่อน: รวมหนี้สิน + ส่วนของเจ้าของ</span>
                  <span className="num">{money(totalLiabEquityPrev)}</span>
                </div>
                <div className={`text-xs ${bsCheckPrev ? 'text-status-good' : 'text-status-bad'}`}>
                  {bsCheckPrev ? 'ยอดตรงกัน' : `ผลต่าง ${money(bsDiffPrev)} บาท`}
                </div>
              </div>

              <div className="border-t border-border my-3" />

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">ปีนี้: รวมสินทรัพย์</span>
                  <span className="num">{money(totalAssetsCurr)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">ปีนี้: รวมหนี้สิน + ส่วนของเจ้าของ</span>
                  <span className="num">{money(totalLiabEquityCurr)}</span>
                </div>
                <div className={`text-xs ${bsCheckCurr ? 'text-status-good' : 'text-status-bad'}`}>
                  {bsCheckCurr ? 'ยอดตรงกัน' : `ผลต่าง ${money(bsDiffCurr)} บาท`}
                </div>
              </div>

              <div className="border-t border-border my-3" />

              <div className={`flex items-center gap-2 text-sm font-semibold ${bsCheck ? 'text-status-good' : 'text-status-bad'}`}>
                <span>{bsCheck ? 'งบดุลทั้ง 2 ปี ยอดตรงกัน' : 'งบดุลยอดไม่ตรง — กรุณาตรวจสอบตัวเลข'}</span>
              </div>
            </div>

            {/* Cash flow balance check */}
            <div className={`rounded-2xl p-4 ${balanceCheck ? 'bg-wash-good' : 'bg-wash-warn'}`}>
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">ตรวจสอบกระแสเงินสด</div>
              <div className="flex justify-between items-center text-sm">
                <span>CFO + CFI + CFF</span>
                <span className="num font-semibold">{money(netCashChange)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span>เงินสดเปลี่ยนจริง</span>
                <span className="num font-semibold">{money(actualCashChange)}</span>
              </div>
              <div className="text-xs mt-2">
                {balanceCheck
                  ? 'ยอดตรงกัน'
                  : `ยอดไม่ตรง — ผลต่าง ${money(balanceDiff)} บาท อาจมีรายการที่ยังไม่ได้กรอก`}
              </div>
            </div>

            {/* Summary check items */}
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">สรุป</div>
              <div className="space-y-2 text-sm">
                <CheckItem ok={cfo > 0} text="CFO เป็นบวก — ธุรกิจสร้างเงินสดจากการดำเนินงานได้" />
                <CheckItem ok={cfi <= 0} text="CFI เป็นลบ — มีการลงทุนในสินทรัพย์ (ปกติ)" />
                <CheckItem ok={bsCheck} text="งบดุลทั้ง 2 ปี ยอดตรงกัน" />
                <CheckItem ok={balanceCheck} text="กระแสเงินสดยอดตรงกัน" />
              </div>
            </div>

            {/* Owner summary text */}
            {hasInput && (
              <div className="bg-bg-card border border-border rounded-2xl p-4">
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">สรุปแบบเจ้าของ</div>
                <p className="text-sm leading-relaxed">{ownerSummary}</p>
              </div>
            )}

            <button onClick={() => setTab(3)} className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm">
              ดูอัตราส่วนทางการเงิน &rarr;
            </button>
          </div>
        )}

        {/* ═══════════════ Tab 4: Financial Ratios ═══════════════ */}
        {tab === 3 && (
          <div className="space-y-4">
            {/* Additional inputs for ratios */}
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">ข้อมูลเพิ่มเติมสำหรับอัตราส่วน</div>
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-3">
                <div className="text-xs text-text-secondary" />
                <div className="text-xs text-text-secondary text-center font-semibold">ปีก่อน</div>
                <div className="text-xs text-text-secondary text-center font-semibold">ปีนี้</div>
              </div>
              {RATIO_INPUT_FIELDS.map((f) => (
                <div key={f.key} className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center mb-2">
                  <label className="text-sm">{f.label}</label>
                  <input inputMode="numeric" value={ratioPrev[f.key] || ''} onChange={(e) => setRatioField('prev', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                  <input inputMode="numeric" value={ratioCurr[f.key] || ''} onChange={(e) => setRatioField('curr', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                </div>
              ))}
            </div>

            {/* Ratio results */}
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">อัตราส่วนทางการเงิน (7 รายการ)</div>

              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-sm">
                <div className="text-xs text-text-secondary font-semibold" />
                <div className="text-xs text-text-secondary font-semibold text-right">ปีก่อน</div>
                <div className="text-xs text-text-secondary font-semibold text-right">ปีนี้</div>

                <RatioRow label="Current Ratio (สภาพคล่อง)" prev={ratiosPrev.currentRatio} curr={ratiosCurr.currentRatio} fmt="ratio" goodFn={(v) => v >= 1.5} />
                <RatioRow label="D/E Ratio (หนี้ต่อทุน)" prev={ratiosPrev.de} curr={ratiosCurr.de} fmt="ratio" goodFn={(v) => v <= 2} />
                <RatioRow label="DSCR (ความสามารถชำระหนี้)" prev={ratiosPrev.dscr} curr={ratiosCurr.dscr} fmt="ratio" goodFn={(v) => v >= 1.2} />
                <RatioRow label="AR DOH (ลูกหนี้เป็นวัน)" prev={ratiosPrev.arDOH} curr={ratiosCurr.arDOH} fmt="days" goodFn={(v) => v <= 90} />
                <RatioRow label="INV DOH (สต็อกเป็นวัน)" prev={ratiosPrev.invDOH} curr={ratiosCurr.invDOH} fmt="days" goodFn={(v) => v <= 90} />
                <RatioRow label="AP DOH (เจ้าหนี้เป็นวัน)" prev={ratiosPrev.apDOH} curr={ratiosCurr.apDOH} fmt="days" goodFn={(v) => v >= 30} />
                <RatioRow label="CCC (Cash Conversion Cycle)" prev={ratiosPrev.ccc} curr={ratiosCurr.ccc} fmt="days" goodFn={(v) => v <= 90} />
              </div>
            </div>

            <button onClick={() => setTab(0)} className="w-full h-12 rounded-xl bg-transparent border border-border text-text-primary font-semibold cursor-pointer text-sm">
              &larr; กลับไปแก้ไข
            </button>
          </div>
        )}

        <div className="mt-6">
          <WinTip page="s2-cashflow" />
          <SessionSave sessionType="s2-cashflow" getData={() => {
            const unmaskObj = (obj: YearData) => {
              const out: Record<string, number> = {};
              for (const [k, v] of Object.entries(obj)) out[k] = unmaskCurrency(v);
              return out;
            };
            return {
              prev: unmaskObj(prev), curr: unmaskObj(curr),
              netProfit: unmaskCurrency(netProfit), depAmort: unmaskCurrency(depAmort),
              netProfitPrev: unmaskCurrency(netProfitPrev), depAmortPrev: unmaskCurrency(depAmortPrev),
              ratioPrev: unmaskObj(ratioPrev), ratioCurr: unmaskObj(ratioCurr),
              assetSaleNBV: unmaskCurrency(assetSaleNBV), assetSaleCash: unmaskCurrency(assetSaleCash),
            };
          }} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function CfRow({ label, value, bold, color, desc }: { label: string; value: number; bold?: boolean; color?: string; desc?: string }) {
  const tc = color === 'good' ? 'text-status-good' : color === 'bad' ? 'text-status-bad' : '';
  return (
    <div className={`py-1.5 ${bold ? 'border-t border-border' : ''}`}>
      <div className={`flex justify-between ${bold ? 'font-semibold' : ''}`}>
        <span className="text-sm">{label}</span>
        <span className={`num text-sm ${tc}`}>{money(value)}</span>
      </div>
      {desc && <div className="text-[11px] text-text-tertiary mt-0.5">{desc}</div>}
    </div>
  );
}

function RatioRow({ label, prev, curr, fmt, goodFn }: {
  label: string;
  prev: number | null;
  curr: number | null;
  fmt: 'ratio' | 'days';
  goodFn: (v: number) => boolean;
}) {
  const format = (v: number | null) => {
    if (v == null) return '-';
    return fmt === 'ratio' ? v.toFixed(2) : `${Math.round(v)} วัน`;
  };
  const colorClass = (v: number | null) => {
    if (v == null) return 'text-text-secondary';
    return goodFn(v) ? 'text-status-good' : 'text-status-bad';
  };
  return (
    <>
      <span className="text-sm">{label}</span>
      <span className={`num text-sm text-right font-medium ${colorClass(prev)}`}>{format(prev)}</span>
      <span className={`num text-sm text-right font-medium ${colorClass(curr)}`}>{format(curr)}</span>
    </>
  );
}

function CheckItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${ok ? 'bg-status-good text-white' : 'bg-status-bad text-white'}`}>
        {ok ? '\u2713' : '\u2717'}
      </span>
      <span>{text}</span>
    </div>
  );
}
