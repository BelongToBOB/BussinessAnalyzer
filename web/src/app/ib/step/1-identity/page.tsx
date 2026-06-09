'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { getSession, saveSession } from '@/lib/api';
import { toast } from 'sonner';
import { ShoppingCart, Factory, Users, Coffee, HardHat, Sprout, Cpu, MoreHorizontal, type LucideIcon , ChevronLeft } from 'lucide-react';

const BIZ_TYPES: { id: string; Icon: LucideIcon; color: string }[] = [
  { id: 'ค้าปลีก/ค้าส่ง', Icon: ShoppingCart, color: '#3B82F6' },
  { id: 'ผลิต/โรงงาน', Icon: Factory, color: '#8B5CF6' },
  { id: 'บริการ', Icon: Users, color: '#06B6D4' },
  { id: 'อาหาร/เครื่องดื่ม', Icon: Coffee, color: '#F97316' },
  { id: 'ก่อสร้าง/รับเหมา', Icon: HardHat, color: '#EAB308' },
  { id: 'เกษตร', Icon: Sprout, color: '#22C55E' },
  { id: 'เทคโนโลยี', Icon: Cpu, color: '#A855F7' },
  { id: 'อื่นๆ', Icon: MoreHorizontal, color: '#64748B' },
];

function getBizSize(sales: number): { label: string; color: string; desc: string } {
  if (sales >= 500_000_000) return { label: 'ธุรกิจขนาดใหญ่', color: '#A855F7', desc: '500 ล้านขึ้นไป' };
  if (sales >= 100_000_000) return { label: 'ธุรกิจขนาดกลาง-ใหญ่', color: '#3B82F6', desc: '100-500 ล้าน' };
  if (sales >= 20_000_000) return { label: 'ธุรกิจขนาดกลาง', color: '#06B6D4', desc: '20-100 ล้าน' };
  if (sales >= 5_000_000) return { label: 'ธุรกิจขนาดเล็ก-กลาง', color: '#22C55E', desc: '5-20 ล้าน' };
  if (sales > 0) return { label: 'ธุรกิจขนาดเล็ก', color: '#EAB308', desc: 'ต่ำกว่า 5 ล้าน' };
  return { label: '', color: '', desc: '' };
}

export default function IbStep1Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [bizType, setBizType] = useState('');
  const [salesPerYear, setSalesPerYear] = useState('');
  const [employees, setEmployees] = useState('');
  const [bizAgeYears, setBizAgeYears] = useState('');

  useEffect(() => {
    getSession('ib-identity').then((res: any) => {
      const d = res?.data;
      if (!d) return;
      if (d.bizType) setBizType(d.bizType);
      if (d.salesPerYear) setSalesPerYear(maskCurrency(String(d.salesPerYear)));
      if (d.employees) setEmployees(String(d.employees));
      if (d.bizAgeYears) setBizAgeYears(String(d.bizAgeYears));
    }).catch(() => {});
  }, []);

  const salesNum = unmaskCurrency(salesPerYear);
  const empNum = Number(employees) || 0;
  const ageNum = Number(bizAgeYears) || 0;
  const bizSize = getBizSize(salesNum);
  const selectedType = BIZ_TYPES.find(t => t.id === bizType);
  const filled = [bizType, salesPerYear, employees, bizAgeYears].filter(Boolean).length;

  const handleSave = async () => {
    if (!bizType || !salesPerYear) {
      toast.error('กรุณากรอกประเภทธุรกิจและยอดขาย');
      return;
    }
    setSaving(true);
    try {
      await saveSession('ib-identity', {
        bizType,
        salesPerYear: salesNum,
        employees: empNum,
        bizAgeYears: ageNum,
      });
      toast.success('บันทึกสำเร็จ');
      setTimeout(() => router.push('/ib/step/2-financial'), 800);
    } catch (e: any) {
      toast.error(e.message || 'บันทึกไม่สำเร็จ');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">Step 1 · ข้อมูลธุรกิจ</span>
          <div className="flex-1" />
          <span className="num text-xs text-text-tertiary">{filled}/4</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        {/* Hero */}
        <div className="mb-6 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Step 1 of 7</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">ธุรกิจคุณคืออะไร</h1>
          <p className="text-sm text-text-secondary mt-1">เริ่มจากบอกข้อมูลพื้นฐาน — ระบบจะตั้ง profile และเริ่มนับคะแนน</p>
        </div>

        {/* Step progress */}
        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: s === 1 ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        {/* Business Type — visual cards */}
        <div className="mb-6 anim-fade-up anim-d1">
          <label className="text-sm font-semibold mb-3 block">ประเภทธุรกิจ</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {BIZ_TYPES.map((t) => {
              const selected = bizType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setBizType(t.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all border ${
                    selected
                      ? 'border-2 shadow-lg scale-[1.02]'
                      : 'border-border bg-bg-card hover:border-border-strong hover:shadow-md'
                  }`}
                  style={selected ? { borderColor: t.color, background: `color-mix(in srgb, ${t.color} 8%, var(--bg-card))` } : {}}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${t.color} 12%, transparent)` }}>
                    <t.Icon size={20} strokeWidth={1.5} color={t.color} />
                  </div>
                  <span className={`text-xs font-medium text-center ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>{t.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sales + Size indicator */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4 anim-fade-up anim-d2">
          <label className="text-sm font-semibold mb-1.5 block">ยอดขายต่อปี (บาท)</label>
          <p className="text-xs text-text-tertiary mb-3">รวมยอดขายทั้งปี ดูจากงบกำไรขาดทุนหรือรายงานขาย</p>
          <NumberInput value={salesPerYear} onChange={setSalesPerYear} />

          {salesNum > 0 && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl anim-fade-up" style={{ background: `color-mix(in srgb, ${bizSize.color} 8%, transparent)` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${bizSize.color} 15%, transparent)` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: bizSize.color }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: bizSize.color }}>{bizSize.label}</div>
                <div className="text-[11px] text-text-tertiary">{bizSize.desc}</div>
              </div>
            </div>
          )}
        </div>

        {/* Employees + Age — side by side */}
        <div className="grid grid-cols-2 gap-3 mb-6 anim-fade-up anim-d3">
          <div className="bg-bg-card border border-border rounded-2xl p-4">
            <label className="text-sm font-semibold mb-1.5 block">พนักงาน</label>
            <input
              inputMode="numeric"
              value={employees}
              onChange={(e) => setEmployees(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="เช่น 15"
              className="w-full h-12 rounded-xl border border-border px-4 text-[15px] bg-bg-card text-text-primary outline-none focus:border-accent num"
            />
            {empNum > 0 && (
              <div className="mt-2 text-xs text-text-tertiary">
                {empNum <= 5 ? 'ทีมเล็ก' : empNum <= 25 ? 'ทีมขนาดกลาง' : empNum <= 100 ? 'ทีมใหญ่' : 'องค์กร'} ({empNum} คน)
              </div>
            )}
          </div>
          <div className="bg-bg-card border border-border rounded-2xl p-4">
            <label className="text-sm font-semibold mb-1.5 block">อายุธุรกิจ (ปี)</label>
            <input
              inputMode="decimal"
              value={bizAgeYears}
              onChange={(e) => setBizAgeYears(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="เช่น 3"
              className="w-full h-12 rounded-xl border border-border px-4 text-[15px] bg-bg-card text-text-primary outline-none focus:border-accent num"
            />
            {ageNum > 0 && (
              <div className="mt-2 text-xs text-text-tertiary">
                {ageNum < 2 ? 'เริ่มต้น — กำลังสร้างฐาน' : ageNum < 5 ? 'เติบโต — กำลังขยาย' : ageNum < 10 ? 'มั่นคง — มีประสบการณ์' : 'อาวุโส — ยืนยง'}
              </div>
            )}
          </div>
        </div>

        {/* Live Summary Card */}
        {filled >= 2 && (
          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-6 anim-scale-in">
            {selectedType && <div className="h-1" style={{ background: selectedType.color }} />}
            <div className="p-5">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-3">สรุป Profile ธุรกิจ</div>
              <div className="grid grid-cols-2 gap-3">
                {bizType && selectedType && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${selectedType.color} 12%, transparent)` }}>
                      <selectedType.Icon size={16} strokeWidth={1.5} color={selectedType.color} />
                    </div>
                    <div>
                      <div className="text-[10px] text-text-tertiary">ประเภท</div>
                      <div className="text-sm font-semibold">{bizType}</div>
                    </div>
                  </div>
                )}
                {salesNum > 0 && (
                  <div>
                    <div className="text-[10px] text-text-tertiary">ยอดขาย/ปี</div>
                    <div className="num text-sm font-semibold">{money(salesNum)}</div>
                  </div>
                )}
                {empNum > 0 && (
                  <div>
                    <div className="text-[10px] text-text-tertiary">พนักงาน</div>
                    <div className="num text-sm font-semibold">{empNum} คน</div>
                  </div>
                )}
                {ageNum > 0 && (
                  <div>
                    <div className="text-[10px] text-text-tertiary">อายุธุรกิจ</div>
                    <div className="num text-sm font-semibold">{ageNum} ปี</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !bizType || !salesPerYear}
          className="w-full h-13 rounded-xl font-semibold cursor-pointer border-none text-sm disabled:opacity-40 transition-all gradient-accent"
          style={{ height: 52 }}
        >
          {saving ? 'กำลังบันทึก...' : !bizType ? 'เลือกประเภทธุรกิจก่อน' : !salesPerYear ? 'กรอกยอดขายก่อน' : 'บันทึก · ไปสแกนงบ Step 2 →'}
        </button>
      </main>
    </div>
  );
}
