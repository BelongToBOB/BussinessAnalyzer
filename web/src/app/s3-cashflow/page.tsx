'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { getSession, saveSession } from '@/lib/api';
import { BottomNav } from '@/components/ui/bottom-nav';
import { WinTip } from '@/components/ui/win-tip';
import { SessionGuide } from '@/components/ui/session-guide';

interface DiagItem {
  label: string;
  checked: boolean;
  note: string;
}

const DIAG_DEFAULTS: DiagItem[] = [
  { label: 'รายรับเข้าจริงตรงกับยอดขายหรือไม่?', checked: false, note: '' },
  { label: 'ต้นทุนจ่ายจริงสอดคล้องกับ COGS หรือไม่?', checked: false, note: '' },
  { label: 'เงินเดือน+ค่าเช่าเกิน 30% ของรายรับหรือไม่?', checked: false, note: '' },
  { label: 'มีค่าใช้จ่ายที่ตัดได้ทันทีหรือไม่?', checked: false, note: '' },
  { label: 'ชำระหนี้เกินกำลังหรือไม่?', checked: false, note: '' },
  { label: 'เจ้าของถอนใช้ส่วนตัวเท่าไร?', checked: false, note: '' },
  { label: 'เหลือเงินพอเก็บสำรองหรือไม่?', checked: false, note: '' },
];

export default function S3CashflowPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Layer 1
  const [cashSales, setCashSales] = useState('');
  const [arCollected, setArCollected] = useState('');
  // Layer 2
  const [cogsPaid, setCogsPaid] = useState('');
  // Layer 3
  const [salary, setSalary] = useState('');
  const [rent, setRent] = useState('');
  const [marketing, setMarketing] = useState('');
  const [otherOpex, setOtherOpex] = useState('');
  // Layer 4
  const [debtPrincipal, setDebtPrincipal] = useState('');
  const [interest, setInterest] = useState('');
  const [tax, setTax] = useState('');
  const [capex, setCapex] = useState('');
  const [ownerDraw, setOwnerDraw] = useState('');

  const [diag, setDiag] = useState<DiagItem[]>(DIAG_DEFAULTS);

  // Load saved session
  useEffect(() => {
    async function load() {
      try {
        const data = await getSession('s3-cashflow') as any;
        if (data) {
          if (data.cashSales) setCashSales(maskCurrency(String(data.cashSales)));
          if (data.arCollected) setArCollected(maskCurrency(String(data.arCollected)));
          if (data.cogsPaid) setCogsPaid(maskCurrency(String(data.cogsPaid)));
          if (data.salary) setSalary(maskCurrency(String(data.salary)));
          if (data.rent) setRent(maskCurrency(String(data.rent)));
          if (data.marketing) setMarketing(maskCurrency(String(data.marketing)));
          if (data.otherOpex) setOtherOpex(maskCurrency(String(data.otherOpex)));
          if (data.debtPrincipal) setDebtPrincipal(maskCurrency(String(data.debtPrincipal)));
          if (data.interest) setInterest(maskCurrency(String(data.interest)));
          if (data.tax) setTax(maskCurrency(String(data.tax)));
          if (data.capex) setCapex(maskCurrency(String(data.capex)));
          if (data.ownerDraw) setOwnerDraw(maskCurrency(String(data.ownerDraw)));
          if (data.diag) setDiag(data.diag);
        }
      } catch { /* new session */ }
    }
    load();
  }, []);

  const u = unmaskCurrency;

  // Computed
  const cashIn = u(cashSales) + u(arCollected);
  const realCash = cashIn - u(cogsPaid);
  const totalOpex = u(salary) + u(rent) + u(marketing) + u(otherOpex);
  const surplus = realCash - totalOpex;
  const totalLayer4 = u(debtPrincipal) + u(interest) + u(tax) + u(capex) + u(ownerDraw);
  const growthCash = surplus - totalLayer4;

  const hasInput = cashIn > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession('s3-cashflow', {
        cashSales: u(cashSales), arCollected: u(arCollected),
        cogsPaid: u(cogsPaid),
        salary: u(salary), rent: u(rent), marketing: u(marketing), otherOpex: u(otherOpex),
        debtPrincipal: u(debtPrincipal), interest: u(interest), tax: u(tax), capex: u(capex), ownerDraw: u(ownerDraw),
        diag,
      });
    } catch { /* ignore */ }
    setSaving(false);
  };

  const toggleDiag = (i: number) => {
    setDiag((old) => old.map((d, idx) => idx === i ? { ...d, checked: !d.checked } : d));
  };
  const setDiagNote = (i: number, note: string) => {
    setDiag((old) => old.map((d, idx) => idx === i ? { ...d, note } : d));
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">S3 &middot; Cashflow 4 Layers</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Cashflow 4 ชั้น</h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">ดูว่าเงินสดไหลผ่านธุรกิจอย่างไร ชั้นต่อชั้น</p>

        <SessionGuide page="s3-cashflow" />

        {/* Layer 1: Cash In */}
        <LayerSection num={1} title="Cash In — เงินสดเข้า" color="bg-wash-good">
          <Field label="ยอดขายเงินสด" value={cashSales} onChange={setCashSales} />
          <Field label="เก็บเงินลูกหนี้ได้" value={arCollected} onChange={setArCollected} />
          {hasInput && <LayerTotal label="Cash In รวม" value={cashIn} color="good" />}
        </LayerSection>

        {/* Layer 2: Real Cash */}
        <LayerSection num={2} title="Real Cash — เงินสดหลังต้นทุน" color="bg-wash-info">
          <Field label="ต้นทุนจ่ายจริง (COGS paid)" value={cogsPaid} onChange={setCogsPaid} />
          {hasInput && <LayerTotal label="Real Cash" value={realCash} color={realCash >= 0 ? 'good' : 'bad'} />}
        </LayerSection>

        {/* Layer 3: Surplus */}
        <LayerSection num={3} title="Surplus — ส่วนเกินหลังค่าใช้จ่าย" color="bg-wash-warn">
          <Field label="เงินเดือน+สวัสดิการ" value={salary} onChange={setSalary} />
          <Field label="ค่าเช่า+สาธารณูปโภค" value={rent} onChange={setRent} />
          <Field label="การตลาด+โฆษณา" value={marketing} onChange={setMarketing} />
          <Field label="ค่าใช้จ่ายอื่น" value={otherOpex} onChange={setOtherOpex} />
          {hasInput && <LayerTotal label="Surplus" value={surplus} color={surplus >= 0 ? 'good' : 'bad'} />}
        </LayerSection>

        {/* Layer 4: Growth Cash */}
        <LayerSection num={4} title="Growth Cash — เงินเหลือเพื่อเติบโต" color="bg-wash-bad">
          <Field label="ชำระเงินต้น" value={debtPrincipal} onChange={setDebtPrincipal} />
          <Field label="ดอกเบี้ย" value={interest} onChange={setInterest} />
          <Field label="ภาษี" value={tax} onChange={setTax} />
          <Field label="ลงทุนเพิ่ม (CAPEX)" value={capex} onChange={setCapex} />
          <Field label="เจ้าของถอนใช้ส่วนตัว" value={ownerDraw} onChange={setOwnerDraw} />
          {hasInput && <LayerTotal label="Growth Cash" value={growthCash} color={growthCash >= 0 ? 'good' : 'bad'} />}
        </LayerSection>

        {/* Verdict */}
        {hasInput && (
          <div className={`rounded-2xl p-4 mt-4 ${growthCash >= 0 ? 'bg-wash-good' : 'bg-wash-bad'}`}>
            <div className="text-base font-semibold">
              {growthCash >= 0 ? '\u2705 ธุรกิจมี Growth Cash เป็นบวก' : '\uD83D\uDD34 Growth Cash ติดลบ — เงินไม่เหลือเพื่อเติบโต'}
            </div>
            <div className="num text-2xl font-bold mt-1">{money(growthCash)} บาท</div>
          </div>
        )}

        {/* Diagnosis checklist */}
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2 mt-8">รายการตรวจสอบ</div>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4">
          {diag.map((item, i) => (
            <div key={i} className={`px-4 py-3 border-b border-border last:border-b-0 ${item.checked ? 'bg-wash-warn/30' : ''}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleDiag(i)}
                  className="w-6 h-6 rounded-md border-none cursor-pointer p-0 shrink-0 flex items-center justify-center"
                  style={{
                    background: item.checked ? 'var(--status-warn)' : 'transparent',
                    border: item.checked ? 'none' : '1.5px solid var(--text-tertiary)',
                  }}
                >
                  {item.checked && <span className="text-white text-xs font-bold">{'\u2713'}</span>}
                </button>
                <span className="text-sm">{item.label}</span>
              </div>
              {item.checked && (
                <div className="mt-2 ml-9">
                  <input
                    value={item.note}
                    onChange={(e) => setDiagNote(i, e.target.value)}
                    placeholder="บันทึกเพิ่มเติม..."
                    className="h-8 w-full rounded-lg border border-border bg-bg-card px-2.5 text-sm outline-none focus:border-accent font-thai"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        <div className="mt-6">
          <WinTip page="s3-cashflow" />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <NumberInput value={value} onChange={onChange} />
    </div>
  );
}

function LayerSection({ num, title, color, children }: { num: number; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-xs font-bold shrink-0`}>{num}</div>
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="bg-bg-card border border-border rounded-2xl p-4">
        {children}
      </div>
    </div>
  );
}

function LayerTotal({ label, value, color }: { label: string; value: number; color: string }) {
  const tc = color === 'good' ? 'text-status-good' : 'text-status-bad';
  return (
    <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
      <span className="text-sm font-semibold">{label}</span>
      <span className={`num text-lg font-bold ${tc}`}>{money(value)}</span>
    </div>
  );
}
