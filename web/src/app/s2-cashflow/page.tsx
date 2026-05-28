'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';
import { SessionSave } from '@/components/ui/session-save';

const ASSET_FIELDS = [
  { key: 'cash', label: 'เงินสด+เงินฝาก' },
  { key: 'ar', label: 'ลูกหนี้การค้า (AR)' },
  { key: 'inventory', label: 'สินค้าคงเหลือ' },
  { key: 'otherCurrentAssets', label: 'สินทรัพย์หมุนเวียนอื่น' },
  { key: 'fixedAssets', label: 'สินทรัพย์ถาวร (สุทธิ)' },
] as const;

const LIABILITY_FIELDS = [
  { key: 'ap', label: 'เจ้าหนี้การค้า (AP)' },
  { key: 'otherLiabilities', label: 'หนี้สินหมุนเวียนอื่น' },
  { key: 'loans', label: 'เงินกู้ยืม' },
  { key: 'equity', label: 'ส่วนของเจ้าของ' },
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

  const setField = (year: 'prev' | 'curr', key: string, val: string) => {
    const setter = year === 'prev' ? setPrev : setCurr;
    setter((old) => ({ ...old, [key]: maskCurrency(val) }));
  };

  const g = (year: YearData, key: string) => u(year[key] || '');

  // Deltas (curr - prev)
  const d = (key: string) => g(curr, key) - g(prev, key);

  // CFO
  const np = u(netProfit);
  const dep = u(depAmort);
  const deltaAR = d('ar');
  const deltaInv = d('inventory');
  const deltaOtherCA = d('otherCurrentAssets');
  const deltaAP = d('ap');
  const deltaOtherLiab = d('otherLiabilities');

  const cfo = np + dep - deltaAR - deltaInv - deltaOtherCA + deltaAP + deltaOtherLiab;

  // CFI
  const deltaFixed = d('fixedAssets');
  const cfi = -(deltaFixed + dep); // gross capex approx

  // CFF
  const deltaLoans = d('loans');
  const deltaEquity = d('equity');
  const cff = deltaLoans + deltaEquity;

  const netCashChange = cfo + cfi + cff;
  const actualCashChange = d('cash');
  const balanceCheck = Math.abs(netCashChange - actualCashChange) < 1;

  // Ratios
  const totalAssetsCurr = ASSET_FIELDS.reduce((s, f) => s + g(curr, f.key), 0);
  const totalAssetsPrev = ASSET_FIELDS.reduce((s, f) => s + g(prev, f.key), 0);
  const currentAssetsCurr = g(curr, 'cash') + g(curr, 'ar') + g(curr, 'inventory') + g(curr, 'otherCurrentAssets');
  const currentLiabCurr = g(curr, 'ap') + g(curr, 'otherLiabilities');
  const currentRatio = currentLiabCurr > 0 ? currentAssetsCurr / currentLiabCurr : 0;
  const debtToEquity = g(curr, 'equity') > 0 ? (g(curr, 'loans') + currentLiabCurr) / g(curr, 'equity') : 0;

  const hasInput = totalAssetsCurr > 0 || totalAssetsPrev > 0;

  const tabs = ['ส่วนที่ 1: กรอกงบ', 'ส่วนที่ 2: งบกระแสเงินสด', 'ส่วนที่ 3: ตรวจสอบ'];

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

        {/* Tab selector */}
        <div className="flex gap-1 bg-bg-card border border-border rounded-xl p-1 mb-6">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors ${tab === i ? 'bg-text-primary text-bg-primary' : 'bg-transparent text-text-secondary'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab 1: Input */}
        {tab === 0 && (
          <div className="space-y-6">
            {/* Extra inputs for CFO calc */}
            <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">งบกำไรขาดทุน (ปีนี้)</div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">กำไรสุทธิ (Net Profit)</label>
                <NumberInput value={netProfit} onChange={setNetProfit} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">ค่าเสื่อมราคา+ค่าตัดจำหน่าย</label>
                <NumberInput value={depAmort} onChange={setDepAmort} />
              </div>
            </div>

            {/* Balance Sheet */}
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1">สินทรัพย์</div>
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-3">
                <div className="text-xs text-text-secondary" />
                <div className="text-xs text-text-secondary text-center font-semibold">ปีก่อน</div>
                <div className="text-xs text-text-secondary text-center font-semibold">ปีนี้</div>
              </div>
              {ASSET_FIELDS.map((f) => (
                <div key={f.key} className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center mb-2">
                  <label className="text-sm">{f.label}</label>
                  <input inputMode="numeric" value={prev[f.key] || ''} onChange={(e) => setField('prev', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                  <input inputMode="numeric" value={curr[f.key] || ''} onChange={(e) => setField('curr', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                </div>
              ))}
            </div>

            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1">หนี้สิน + ส่วนของเจ้าของ</div>
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-3">
                <div className="text-xs text-text-secondary" />
                <div className="text-xs text-text-secondary text-center font-semibold">ปีก่อน</div>
                <div className="text-xs text-text-secondary text-center font-semibold">ปีนี้</div>
              </div>
              {LIABILITY_FIELDS.map((f) => (
                <div key={f.key} className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center mb-2">
                  <label className="text-sm">{f.label}</label>
                  <input inputMode="numeric" value={prev[f.key] || ''} onChange={(e) => setField('prev', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                  <input inputMode="numeric" value={curr[f.key] || ''} onChange={(e) => setField('curr', f.key, e.target.value)} placeholder="0" className="h-10 rounded-lg border border-border bg-bg-card px-2.5 text-sm text-right num outline-none focus:border-accent" />
                </div>
              ))}
            </div>

            <button onClick={() => setTab(1)} className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm">
              ดูงบกระแสเงินสด &rarr;
            </button>
          </div>
        )}

        {/* Tab 2: Cash Flow Statement */}
        {tab === 1 && (
          <div className="space-y-4">
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">กระแสเงินสดจากการดำเนินงาน (CFO)</div>
              <CfRow label="กำไรสุทธิ" value={np} />
              <CfRow label="+ ค่าเสื่อมราคา" value={dep} />
              <CfRow label="- เพิ่มขึ้นใน AR" value={-deltaAR} />
              <CfRow label="- เพิ่มขึ้นในสินค้าคงเหลือ" value={-deltaInv} />
              <CfRow label="- เพิ่มขึ้นในสินทรัพย์หมุนเวียนอื่น" value={-deltaOtherCA} />
              <CfRow label="+ เพิ่มขึ้นใน AP" value={deltaAP} />
              <CfRow label="+ เพิ่มขึ้นในหนี้สินหมุนเวียนอื่น" value={deltaOtherLiab} />
              <CfRow label="= CFO" value={cfo} bold color={cfo >= 0 ? 'good' : 'bad'} />
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">กระแสเงินสดจากการลงทุน (CFI)</div>
              <CfRow label="ซื้อ/ขายสินทรัพย์ถาวร" value={cfi} />
              <CfRow label="= CFI" value={cfi} bold color={cfi >= 0 ? 'good' : 'bad'} />
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">กระแสเงินสดจากการจัดหาเงิน (CFF)</div>
              <CfRow label="เปลี่ยนแปลงเงินกู้" value={deltaLoans} />
              <CfRow label="เปลี่ยนแปลงส่วนของเจ้าของ" value={deltaEquity} />
              <CfRow label="= CFF" value={cff} bold />
            </div>

            <div className={`rounded-2xl p-4 ${balanceCheck ? 'bg-wash-good' : 'bg-wash-warn'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">เงินสดเปลี่ยนแปลงสุทธิ (CFO+CFI+CFF)</span>
                <span className="num font-bold text-lg">{money(netCashChange)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-text-secondary">เงินสดเปลี่ยนแปลงจริง</span>
                <span className="num font-semibold">{money(actualCashChange)}</span>
              </div>
              <div className="text-xs mt-2 text-text-secondary">
                {balanceCheck ? '\u2705 ยอดตรงกัน' : '\u26A0\uFE0F ยอดไม่ตรง — อาจมีรายการที่ยังไม่ได้กรอก'}
              </div>
            </div>

            <button onClick={() => setTab(2)} className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm">
              ดูผลตรวจสอบ &rarr;
            </button>
          </div>
        )}

        {/* Tab 3: Analysis */}
        {tab === 2 && (
          <div className="space-y-4">
            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">อัตราส่วนทางการเงิน</div>
              <div className="grid grid-cols-2 gap-3">
                <RatioCard label="Current Ratio" value={currentRatio.toFixed(2)} good={currentRatio >= 1.5} />
                <RatioCard label="D/E Ratio" value={debtToEquity.toFixed(2)} good={debtToEquity <= 2} />
                <RatioCard label="CFO" value={money(cfo)} good={cfo > 0} />
                <RatioCard label="เงินสดเปลี่ยนแปลง" value={money(netCashChange)} good={netCashChange >= 0} />
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">สรุป</div>
              <div className="space-y-2 text-sm">
                <CheckItem ok={cfo > 0} text="CFO เป็นบวก — ธุรกิจสร้างเงินสดจากการดำเนินงานได้" />
                <CheckItem ok={cfi <= 0} text="CFI เป็นลบ — มีการลงทุนในสินทรัพย์ (ปกติ)" />
                <CheckItem ok={currentRatio >= 1.5} text="Current Ratio >= 1.5 — สภาพคล่องดี" />
                <CheckItem ok={debtToEquity <= 2} text="D/E Ratio <= 2 — ระดับหนี้อยู่ในเกณฑ์" />
              </div>
            </div>

            <button onClick={() => setTab(0)} className="w-full h-12 rounded-xl bg-transparent border border-border text-text-primary font-semibold cursor-pointer text-sm">
              &larr; กลับไปแก้ไข
            </button>
          </div>
        )}
        <div className="mt-6">
          <WinTip page="s2-cashflow" />
        <SessionSave sessionType="s2-cashflow" getData={() => ({ prev, curr, netProfit: unmaskCurrency(netProfit), depAmort: unmaskCurrency(depAmort) })} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function CfRow({ label, value, bold, color }: { label: string; value: number; bold?: boolean; color?: string }) {
  const tc = color === 'good' ? 'text-status-good' : color === 'bad' ? 'text-status-bad' : '';
  return (
    <div className={`flex justify-between py-1.5 ${bold ? 'border-t border-border font-semibold' : ''}`}>
      <span className="text-sm">{label}</span>
      <span className={`num text-sm ${tc}`}>{money(value)}</span>
    </div>
  );
}

function RatioCard({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={`${good ? 'bg-wash-good' : 'bg-wash-warn'} rounded-xl p-3`}>
      <div className="text-[11px] text-text-secondary">{label}</div>
      <div className="num text-lg font-semibold mt-0.5">{value}</div>
    </div>
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
