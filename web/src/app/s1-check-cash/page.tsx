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

export default function S1CheckCashPage() {
  const router = useRouter();

  const [sales, setSales] = useState('');
  const [cashStart, setCashStart] = useState('');
  const [cashEnd, setCashEnd] = useState('');
  const [ar, setAr] = useState('');

  useEffect(() => {
    const m = new Date().toISOString().slice(0, 7);
    getSession('s1-check-cash', m).then((res: any) => {
      const d = res?.data;
      if (!d) return;
      if (d.grossSales) setSales(maskCurrency(String(d.grossSales)));
      if (d.cashStart) setCashStart(maskCurrency(String(d.cashStart)));
      if (d.cashEnd) setCashEnd(maskCurrency(String(d.cashEnd)));
      if (d.arBalance) setAr(maskCurrency(String(d.arBalance)));
    }).catch(() => {});
  }, []);

  const salesNum = unmaskCurrency(sales);
  const startNum = unmaskCurrency(cashStart);
  const endNum = unmaskCurrency(cashEnd);
  const arNum = unmaskCurrency(ar);

  const cashGain = endNum - startNum;
  const gap = salesNum - cashGain;
  const ratio = salesNum > 0 ? gap / salesNum : 0;

  const hasInput = salesNum > 0 && (startNum > 0 || endNum > 0);

  let verdictColor = 'bg-wash-good text-status-good';
  let verdictText = 'ปกติ — เงินสดสอดคล้องกับยอดขาย';
  let verdictIcon = '\u2705';
  if (hasInput && ratio > 0.5) {
    verdictColor = 'bg-wash-bad text-status-bad';
    verdictText = 'อันตราย — เงินหายไปมากกว่าครึ่งของยอดขาย ต้องตรวจสอบด่วน';
    verdictIcon = '\uD83D\uDD34';
  } else if (hasInput && ratio > 0.2) {
    verdictColor = 'bg-wash-warn text-status-warn';
    verdictText = 'ระวัง — ส่วนต่างค่อนข้างสูง ควรตรวจสอบ';
    verdictIcon = '\u26A0\uFE0F';
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S1 &middot; เช็คเงินจริง</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">เช็คเงินจริง</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">ยอดขายกับเงินสดที่เพิ่มขึ้นจริง ตรงกันไหม?</p>

        <SessionGuide page="s1-check-cash" />

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">ยอดขายรวมเดือนที่แล้ว</label>
            <NumberInput value={sales} onChange={setSales} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">เงินสด+เงินในบัญชี ณ ต้นเดือน</label>
            <NumberInput value={cashStart} onChange={setCashStart} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">เงินสด+เงินในบัญชี ณ สิ้นเดือน</label>
            <NumberInput value={cashEnd} onChange={setCashEnd} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ยอดขายที่ยังเก็บเงินไม่ได้ (ลูกหนี้คงค้าง) <span className="text-text-tertiary font-normal">— ไม่บังคับ</span></label>
            <NumberInput value={ar} onChange={setAr} />
          </div>
        </div>

        {/* Computed results */}
        {hasInput && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 mt-6 space-y-3">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">ผลคำนวณ</div>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="เงินที่เพิ่มขึ้นจริง" value={money(cashGain)} sub="สิ้นเดือน - ต้นเดือน" />
              <ResultCard label="ส่วนต่าง" value={money(gap)} sub="ยอดขาย - เงินเพิ่มจริง" color={ratio > 0.5 ? 'bad' : ratio > 0.2 ? 'warn' : 'good'} />
            </div>
            {arNum > 0 && (
              <div className="bg-wash-info rounded-xl p-3 text-sm">
                <span className="text-text-secondary">ลูกหนี้คงค้าง:</span>{' '}
                <span className="num font-semibold">{money(arNum)} บาท</span>
                <span className="text-text-secondary ml-2">
                  (คิดเป็น {salesNum > 0 ? ((arNum / salesNum) * 100).toFixed(1) : 0}% ของยอดขาย)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Verdict */}
        {hasInput && (
          <div className={`${verdictColor} rounded-2xl p-4 mt-4`}>
            <div className="text-base font-semibold">{verdictIcon} {verdictText}</div>
            <div className="text-sm mt-1 opacity-80">ส่วนต่าง/ยอดขาย = {(ratio * 100).toFixed(1)}%</div>
          </div>
        )}

        {/* Note */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 mt-6">
          <div className="text-sm text-text-secondary leading-relaxed">
            <strong className="text-text-primary">หมายเหตุ:</strong> เงินที่เพิ่มจริงย่อมต่ำกว่ายอดขายอยู่แล้ว เพราะเงินสดยังถูกใช้กับต้นทุน ค่าใช้จ่าย ชำระหนี้ ถอนใช้ส่วนตัว ฯลฯ — แต่ถ้าส่วนต่างสูงผิดปกติ (มากกว่า 50% ของยอดขาย) แสดงว่ามี &quot;รอยรั่ว&quot; ที่ต้องตรวจสอบ
          </div>
        </div>
        <div className="mt-6">
          <WinTip page="s1-check-cash" />
        <SessionSave sessionType="s1-check-cash" month={new Date().toISOString().slice(0,7)} getData={() => ({ grossSales: unmaskCurrency(sales), cashStart: unmaskCurrency(cashStart), cashEnd: unmaskCurrency(cashEnd), arBalance: unmaskCurrency(ar) })} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function ResultCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  const bg = color === 'good' ? 'bg-wash-good' : color === 'bad' ? 'bg-wash-bad' : color === 'warn' ? 'bg-wash-warn' : 'bg-bg-secondary';
  return (
    <div className={`${bg} rounded-xl p-3`}>
      <div className="text-[11px] text-text-secondary">{label}</div>
      <div className="num text-lg font-semibold mt-0.5">{value}</div>
      <div className="text-[10px] text-text-tertiary mt-0.5">{sub}</div>
    </div>
  );
}
