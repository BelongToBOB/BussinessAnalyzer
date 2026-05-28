'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { NumberInput } from '@/components/ui/number-input';
import { maskCurrency, unmaskCurrency, money } from '@/lib/format';
import { getBusiness, getEntry, upsertEntry } from '@/lib/api';
import { toast } from 'sonner';

const FIELDS = [
  { id: 'grossSales',    label: 'ยอดขายรวมเดือนนี้',           helper: 'รวมทั้งขายสดและขายเชื่อ' },
  { id: 'creditSales',   label: 'ในนั้น เป็นการขายเชื่อ',     helper: 'ขายแล้วยังไม่ได้รับเงิน' },
  { id: 'cogs',          label: 'ต้นทุนสินค้าที่ขายไปเดือนนี้', helper: 'COGS — เฉพาะของที่ขายออก' },
  { id: 'otherExpenses', label: 'ค่าใช้จ่ายอื่นๆ ทั้งหมด',     helper: 'เงินเดือน เช่า การตลาด น้ำไฟ ดอกเบี้ย ภาษี' },
  { id: 'cashIn',        label: 'เงินเข้าบัญชีจริงเดือนนี้',   helper: 'เช็คจาก bank statement' },
  { id: 'arBalance',     label: 'ลูกหนี้ค้างเก็บ ณ สิ้นเดือน', helper: 'รวมยอดที่ลูกค้ายังไม่จ่าย' },
  { id: 'apBalance',     label: 'เจ้าหนี้ค้างจ่าย ณ สิ้นเดือน', helper: 'รวมยอดที่ยังไม่ได้จ่าย Supplier' },
  { id: 'cashOnHand',    label: 'เงินสดในมือ ณ สิ้นเดือน',     helper: 'รวมเงินในบัญชีทุกธนาคาร' },
] as const;

type FieldId = (typeof FIELDS)[number]['id'];

const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatMonthThai(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${THAI_MONTHS[m]} ${y + 543}`;
}

export default function EntryPage({ params }: { params: Promise<{ yyyyMm: string }> }) {
  const { yyyyMm } = use(params);
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [leakNote, setLeakNote] = useState('');
  const [debtService, setDebtService] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing data
  useEffect(() => {
    async function load() {
      try {
        const biz = await getBusiness() as any;
        if (biz.monthlyDebtService) {
          setDebtService(money(Number(biz.monthlyDebtService)));
        }
      } catch { /* no business */ }

      try {
        const data = await getEntry(yyyyMm);
        const inputs = (data as any).inputs || {};
        const newVals: Record<string, string> = {};
        for (const f of FIELDS) {
          if (inputs[f.id] != null) {
            newVals[f.id] = money(inputs[f.id]);
          }
        }
        setVals(newVals);
        if (inputs.leakNote) setLeakNote(inputs.leakNote);
      } catch { /* new entry */ }
      setLoading(false);
    }
    load();
  }, [yyyyMm]);

  const set = (id: string) => (value: string) => {
    setVals((prev) => ({ ...prev, [id]: value }));
  };

  // Validation
  const errors: Record<string, string> = {};
  if (vals.creditSales && vals.grossSales) {
    if (unmaskCurrency(vals.creditSales) > unmaskCurrency(vals.grossSales)) {
      errors.creditSales = 'ขายเชื่อต้องไม่เกินยอดขายรวม';
    }
  }

  const filled = FIELDS.filter((f) => vals[f.id]).length;
  const total = FIELDS.length;
  const pctDone = Math.round((filled / total) * 100);

  // Live preview
  const n = (id: string) => (vals[id] ? unmaskCurrency(vals[id]) : null);
  const sales = n('grossSales');
  const cogs = n('cogs');
  const opex = n('otherExpenses');
  const cashIn = n('cashIn');
  const cashOnHand = n('cashOnHand');
  const debtNum = debtService ? unmaskCurrency(debtService) : 0;

  const gm = sales && sales > 0 && cogs != null ? ((sales - cogs) / sales * 100) : null;
  const np = sales != null && cogs != null && opex != null ? sales - cogs - opex : null;
  const runway = cashOnHand != null && (opex != null || debtNum > 0) ? cashOnHand / ((opex ?? 0) + debtNum) : null;
  const cashRatio = sales && sales > 0 && cashIn != null ? (cashIn / sales * 100) : null;

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) return;
    setSaving(true);

    const body: Record<string, unknown> = {};
    for (const f of FIELDS) {
      body[f.id] = vals[f.id] ? unmaskCurrency(vals[f.id]) : null;
    }
    body.leakNote = leakNote || null;

    try {
      await upsertEntry(yyyyMm, body);
      setSaved(true);
      toast.success('บันทึกสำเร็จ');
      setTimeout(() => { window.location.href = `/dashboard?month=${yyyyMm}`; }, 1000);
    } catch {
      toast.error('เกิดข้อผิดพลาด');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-text-secondary">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.href = '/dashboard'} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
            </button>
            <span className="text-[15px] font-semibold">กรอกข้อมูล</span>
          </div>
          <span className="num text-[13px] text-text-secondary">{filled}/{total} กรอกแล้ว</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 pb-24">
        {/* Title */}
        <div className="flex items-baseline justify-between mb-1.5 gap-3">
          <div>
            <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">
              {formatMonthThai(yyyyMm)}
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">กรอกข้อมูลเดือนใหม่</h1>
            <p className="text-sm text-text-secondary mt-1">9 ตัวเลข + 1 ข้อความ · ใช้เวลาประมาณ 5 นาที</p>
          </div>
          <div className="num text-2xl font-semibold">{filled}/{total}</div>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full bg-border overflow-hidden mt-2 mb-6">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${pctDone}%`,
              background: pctDone === 100 ? 'var(--status-good)' : 'var(--text-primary)',
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Form */}
          <div className="bg-bg-card border border-border rounded-2xl px-5 py-1">
            {FIELDS.map((f, i) => (
              <div key={f.id} className="py-4 border-t border-border first:border-t-0">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="num text-xs text-text-tertiary font-semibold">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-semibold text-text-primary flex-1">{f.label}</span>
                </div>
                <p className="text-xs text-text-secondary mb-2">{f.helper}</p>
                <NumberInput
                  value={vals[f.id] || ''}
                  onChange={set(f.id)}
                  error={errors[f.id] || null}
                />
              </div>
            ))}

            {/* Debt service (read-only) */}
            <div className="py-4 border-t border-border">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="num text-xs text-text-tertiary font-semibold">09</span>
                <span className="text-sm font-semibold text-text-primary flex-1">ภาระผ่อนหนี้ต่อเดือน</span>
              </div>
              <p className="text-xs text-text-secondary mb-2">ดึงจาก Settings · แก้ที่นี่ไม่ได้</p>
              <NumberInput value={debtService || '0'} onChange={() => {}} readOnly />
            </div>

            {/* Leak note */}
            <div className="py-4 border-t border-border">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="num text-xs text-text-tertiary font-semibold">10</span>
                <span className="text-sm font-semibold text-text-primary flex-1">จุดที่เงินรั่ว / ผิดปกติเดือนนี้</span>
              </div>
              <p className="text-xs text-text-secondary mb-2">เขียนสั้นๆ — เดือนหน้ากลับมาดูจะเห็น pattern</p>
              <textarea
                value={leakNote}
                onChange={(e) => setLeakNote(e.target.value)}
                placeholder="ค่าขนส่งเกินงบ · คืนสินค้าเยอะ · ค่าโฆษณาไม่คุ้ม ..."
                maxLength={500}
                className="w-full min-h-[92px] rounded-xl border border-border bg-bg-card p-3.5 text-[15px] text-text-primary resize-y outline-none focus:border-accent font-thai leading-relaxed"
              />
            </div>

            {/* Mobile live preview */}
            <div className="lg:hidden py-4 border-t border-border">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary mb-2">คำนวณสด</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-bg-secondary rounded-xl p-2.5">
                  <div className="text-[10px] text-text-secondary">Gross Margin</div>
                  <div className="num text-sm font-semibold mt-0.5">{gm != null ? gm.toFixed(0) + '%' : '—'}</div>
                </div>
                <div className="bg-bg-secondary rounded-xl p-2.5">
                  <div className="text-[10px] text-text-secondary">Net Profit</div>
                  <div className="num text-sm font-semibold mt-0.5">{np != null && sales ? (np >= 0 ? '+' : '−') + money(Math.abs(np)) : '—'}</div>
                </div>
                <div className="bg-bg-secondary rounded-xl p-2.5">
                  <div className="text-[10px] text-text-secondary">Cash In ÷ Sales</div>
                  <div className="num text-sm font-semibold mt-0.5">{cashRatio != null ? cashRatio.toFixed(0) + '%' : '—'}</div>
                </div>
                <div className="bg-bg-secondary rounded-xl p-2.5">
                  <div className="text-[10px] text-text-secondary">Cash Runway</div>
                  <div className="num text-sm font-semibold mt-0.5">{runway != null && isFinite(runway) ? runway.toFixed(1) + ' เดือน' : '—'}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-5 flex flex-col gap-2.5">
              <button
                onClick={handleSave}
                disabled={Object.keys(errors).length > 0 || saving}
                className="w-full h-[52px] rounded-xl bg-text-primary text-bg-primary font-semibold text-base cursor-pointer disabled:opacity-40"
              >
                {saving ? 'กำลังบันทึก...' : saved ? '✓ บันทึกแล้ว' : 'บันทึก · ดู Dashboard'}
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-accent text-sm font-medium cursor-pointer bg-transparent border-none p-3"
              >
                ยกเลิก
              </button>
            </div>
          </div>

          {/* Live preview (desktop) */}
          <aside className="hidden lg:block sticky top-20">
            <div className="bg-bg-card border border-border rounded-2xl p-[18px]">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">ดูตัวอย่าง · คำนวณสด</div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <PreviewStat label="Gross Margin" value={gm != null ? gm.toFixed(0) + '%' : '—'} />
                <PreviewStat label="Net Profit" value={np != null && sales ? (np >= 0 ? '+' : '−') + money(Math.abs(np)) : '—'} />
                <PreviewStat label="Cash In ÷ Sales" value={cashRatio != null ? cashRatio.toFixed(0) + '%' : '—'} />
                <PreviewStat label="Cash Runway" value={runway != null && isFinite(runway) ? runway.toFixed(1) + ' เดือน' : '—'} />
              </div>
              <p className="mt-3 text-[11px] text-text-tertiary">อัปเดตทุกครั้งที่กรอก · บันทึกแล้วจะเห็นครบ 10 ช่อง</p>
            </div>

            <div className="mt-4 bg-wash-info rounded-[14px] p-4 text-xs text-text-primary leading-relaxed">
              <div className="font-bold mb-1.5">เคล็ดลับ</div>
              ตัวเลขทั้งหมดเอามาจากไฟล์เดียวที่คุณทำอยู่แล้ว — bank statement กับ statement การขาย
            </div>
          </aside>
        </div>
      </main>

    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 bg-bg-secondary rounded-[10px]">
      <div className="text-[11px] text-text-secondary">{label}</div>
      <div className="num text-base font-semibold mt-0.5 tracking-tight">{value}</div>
    </div>
  );
}
