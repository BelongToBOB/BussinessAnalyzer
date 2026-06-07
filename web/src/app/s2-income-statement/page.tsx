'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { getSession } from '@/lib/api';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';
import { SessionSave } from '@/components/ui/session-save';
import { SessionGuide } from '@/components/ui/session-guide';

export default function S2IncomeStatementPage() {
  const router = useRouter();

  const [revenue, setRevenue] = useState('');
  const [cogs, setCogs] = useState('');
  const [sellingAdmin, setSellingAdmin] = useState('');
  const [depreciation, setDepreciation] = useState('');
  const [interest, setInterest] = useState('');
  const [tax, setTax] = useState('');

  useEffect(() => {
    getSession('s2-income-statement').then((res: any) => {
      const d = res?.data;
      if (!d) return;
      if (d.revenue) setRevenue(maskCurrency(String(d.revenue)));
      if (d.cogs) setCogs(maskCurrency(String(d.cogs)));
      if (d.sellingAdmin) setSellingAdmin(maskCurrency(String(d.sellingAdmin)));
      if (d.depreciation) setDepreciation(maskCurrency(String(d.depreciation)));
      if (d.interest) setInterest(maskCurrency(String(d.interest)));
      if (d.tax) setTax(maskCurrency(String(d.tax)));
    }).catch(() => {});
  }, []);

  const rev = unmaskCurrency(revenue);
  const cogsNum = unmaskCurrency(cogs);
  const sellingAdminNum = unmaskCurrency(sellingAdmin);
  const depNum = unmaskCurrency(depreciation);
  const intNum = unmaskCurrency(interest);
  const taxNum = unmaskCurrency(tax);

  const grossProfit = rev - cogsNum;
  const ebitda = grossProfit - sellingAdminNum;
  const ebit = ebitda - depNum;
  const pretax = ebit - intNum;
  const netProfit = pretax - taxNum;

  const pctOf = (n: number) => rev > 0 ? ((n / rev) * 100).toFixed(1) + '%' : '—';

  const hasInput = rev > 0;

  const healthChecks = [
    { q: 'Gross Margin สูงกว่า 30% หรือไม่?', check: rev > 0 && (grossProfit / rev) > 0.3 },
    { q: 'EBITDA Margin เป็นบวกและสูงกว่า 10% หรือไม่?', check: rev > 0 && (ebitda / rev) > 0.1 },
    { q: 'Net Profit Margin เป็นบวก (กำไรสุทธิ > 0)?', check: netProfit > 0 },
  ];

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S2 &middot; อ่านงบ</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">งบกำไรขาดทุน</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">กรอกตัวเลขจากงบการเงิน เพื่อวิเคราะห์สุขภาพธุรกิจ</p>

        <SessionGuide page="s2-income-statement" />

        <div className="space-y-4">
          {[
            { label: 'รายได้ (Revenue)', value: revenue, set: setRevenue },
            { label: 'ต้นทุนขาย (COGS)', value: cogs, set: setCogs },
            { label: 'ค่าใช้จ่ายขาย+บริหาร (Selling & Admin)', value: sellingAdmin, set: setSellingAdmin },
            { label: 'ค่าเสื่อมราคา (Depreciation)', value: depreciation, set: setDepreciation },
            { label: 'ดอกเบี้ย (Interest)', value: interest, set: setInterest },
            { label: 'ภาษี (Tax)', value: tax, set: setTax },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
              <NumberInput value={f.value} onChange={f.set} />
            </div>
          ))}
        </div>

        {/* Computed P&L Waterfall */}
        {hasInput && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mt-6">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">ผลวิเคราะห์</div>
            <div className="space-y-2">
              <WaterfallRow label="รายได้ (Revenue)" value={rev} pct="100%" />
              <WaterfallRow label="- ต้นทุนขาย" value={-cogsNum} pct="" muted />
              <WaterfallRow label="= กำไรขั้นต้น (Gross Profit)" value={grossProfit} pct={pctOf(grossProfit)} bold color={grossProfit >= 0 ? 'good' : 'bad'} />
              <WaterfallRow label="- ค่าใช้จ่ายขาย+บริหาร" value={-sellingAdminNum} pct="" muted />
              <WaterfallRow label="= EBITDA" value={ebitda} pct={pctOf(ebitda)} bold color={ebitda >= 0 ? 'good' : 'bad'} />
              <WaterfallRow label="- ค่าเสื่อมราคา" value={-depNum} pct="" muted />
              <WaterfallRow label="= EBIT" value={ebit} pct={pctOf(ebit)} bold />
              <WaterfallRow label="- ดอกเบี้ย" value={-intNum} pct="" muted />
              <WaterfallRow label="= กำไรก่อนภาษี (Pre-tax)" value={pretax} pct={pctOf(pretax)} bold />
              <WaterfallRow label="- ภาษี" value={-taxNum} pct="" muted />
              <WaterfallRow label="= กำไรสุทธิ (Net Profit)" value={netProfit} pct={pctOf(netProfit)} bold color={netProfit >= 0 ? 'good' : 'bad'} />
            </div>
          </div>
        )}

        {/* Health Checks */}
        {hasInput && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mt-4">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Health Check</div>
            <div className="space-y-2">
              {healthChecks.map((hc, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${hc.check ? 'bg-status-good text-white' : 'bg-status-bad text-white'}`}>
                    {hc.check ? '\u2713' : '\u2717'}
                  </span>
                  <span>{hc.q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3 คำถามเช็คสุขภาพธุรกิจ */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 mt-4">
          <div className="text-sm font-semibold mb-3">3 คำถามเช็คสุขภาพธุรกิจ (จากคอร์ส)</div>
          <div className="space-y-3">
            {[
              'Fixed cost ต่อเดือนเท่าไร และต้นทุนคิดเป็นกี่ % ของยอดขาย?',
              'ทรัพย์สิน หรือ หนี้สิน — อะไรมากกว่ากัน?',
              'กำไร/ขาดทุน 1 ปีย้อนหลัง มากขึ้นหรือลดลง?',
            ].map((q, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <span className="text-sm leading-relaxed pt-1">{q}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <WinTip page="s2-income-statement" />
        <SessionSave sessionType="s2-income-statement" getData={() => ({ revenue: unmaskCurrency(revenue), cogs: unmaskCurrency(cogs), sellingAdmin: unmaskCurrency(sellingAdmin), depreciation: unmaskCurrency(depreciation), interest: unmaskCurrency(interest), tax: unmaskCurrency(tax) })} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function WaterfallRow({ label, value, pct, bold, muted, color }: { label: string; value: number; pct: string; bold?: boolean; muted?: boolean; color?: string }) {
  const textColor = color === 'good' ? 'text-status-good' : color === 'bad' ? 'text-status-bad' : '';
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? 'border-t border-border' : ''} ${muted ? 'opacity-60' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <div className="flex items-center gap-3">
        <span className={`num text-sm ${bold ? 'font-semibold' : ''} ${textColor}`}>{money(value)}</span>
        {pct && <span className="text-xs text-text-secondary w-12 text-right">{pct}</span>}
      </div>
    </div>
  );
}
