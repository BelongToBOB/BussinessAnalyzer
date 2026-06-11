'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { Activity, BarChart3, Layers, PiggyBank, Shield, TrendingUp, Landmark, FileText, Search, Tag, Map, Grid3X3, Stethoscope, Wallet, Eye, Rocket, ClipboardList, Calculator, type LucideIcon } from 'lucide-react';

const FEATURES_IB = [
  { icon: Activity, label: 'Business Score 0-100' },
  { icon: BarChart3, label: 'Financial MRI + DSCR' },
  { icon: TrendingUp, label: 'Growth Capacity' },
  { icon: Landmark, label: 'Bank Simulation' },
];

const FEATURES_IBF = [
  { icon: Layers, label: 'Cashflow 4 Layers' },
  { icon: PiggyBank, label: 'Owner Dashboard 10 ช่อง' },
  { icon: Shield, label: 'Expense Map' },
  { icon: FileText, label: 'แผนธุรกิจ 1 หน้า' },
];

const IB_COLOR = { accent: '#1E40AF', bg: 'rgba(30, 64, 175, 0.08)', text: 'text-blue-700' };
const IBF_COLOR = { accent: '#92400E', bg: 'rgba(146, 64, 14, 0.08)', text: 'text-amber-700' };

interface ToolItem { tag: string; label: string; desc: string; icon: LucideIcon; color: string }

const TOOLS_IB: ToolItem[] = [
  { tag: 'Step 1', label: 'ข้อมูลธุรกิจ', desc: 'ประเภท ยอดขาย พนักงาน อายุธุรกิจ', icon: ClipboardList, color: '#16A34A' },
  { tag: 'Step 2', label: 'สแกนงบการเงิน', desc: 'กำไรขาดทุน · งบดุล · ตารางหนี้ → DSCR, D/E', icon: Stethoscope, color: '#2563EB' },
  { tag: 'Step 3', label: 'กระแสเงินสด 4 ชั้น', desc: 'เงินเข้า → เงินจริง → เงินเหลือ → เงินโต', icon: Layers, color: '#7C3AED' },
  { tag: 'Step 4', label: 'มุมมองธนาคาร', desc: 'ธนาคารมองคุณยังไง — ประเมิน 4 มิติ', icon: Eye, color: '#EA580C' },
  { tag: 'Step 5', label: 'ออกแบบวงเงินกู้', desc: 'วัตถุประสงค์ · ทุนตัวเอง · หลักประกัน · LTV', icon: Calculator, color: '#0891B2' },
  { tag: 'Step 6', label: 'กู้ได้เท่าไหร่', desc: 'วงเงิน 3 ระดับ — ปลอดภัย / สูงสุด / อันตราย', icon: Rocket, color: '#DB2777' },
  { tag: 'Step 7', label: 'เตรียมยื่นกู้', desc: 'เอกสาร · คำถามธนาคาร · แผนปฏิบัติ', icon: FileText, color: '#DC2626' },
];

const TOOLS_IBF: ToolItem[] = [
  { tag: 'S1', label: 'เช็คเงินจริง', desc: 'ยอดขายสูงแต่เงินไม่เพิ่ม? เช็คได้ทันที', icon: Search, color: '#16A34A' },
  { tag: 'S2', label: 'อ่านงบกำไรขาดทุน', desc: 'ดู margin แต่ละชั้น รู้ว่ากำไรจริงเท่าไหร่', icon: BarChart3, color: '#2563EB' },
  { tag: 'S3', label: 'Cashflow 4 ชั้น', desc: 'ไล่เงินจริง 4 ชั้น หาว่าเงินหายตรงไหน', icon: Layers, color: '#7C3AED' },
  { tag: 'S4', label: 'ตั้งราคา + CM', desc: 'คำนวณราคาที่ได้กำไรจริง + จุดคุ้มทุน', icon: Tag, color: '#EA580C' },
  { tag: 'S5', label: 'Expense Map', desc: 'แผนที่ค่าใช้จ่าย อุดรอยรั่วก่อนเร่งยอด', icon: Map, color: '#DC2626' },
  { tag: 'S6', label: 'ระบบ 5 ช่อง', desc: 'แยกเงินให้ชัด ไม่ปนกันอีกต่อไป', icon: Grid3X3, color: '#0891B2' },
  { tag: 'S7', label: 'แผนธุรกิจ 1 หน้า', desc: 'ตอบ 4 คำถามธนาคาร พร้อมยื่นกู้', icon: FileText, color: '#DB2777' },
  { tag: '10 ช่อง', label: 'Owner Dashboard', desc: 'กรอก 9 ตัวเลข เห็นสุขภาพธุรกิจครบ 10 ช่อง', icon: Wallet, color: '#475569' },
];

const FLOATING_TAGS = ['DSCR', 'D/E', 'LTV', 'EBITDA', 'Cash Flow', 'MRI'];

export default function LoginPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-white">
      {/* ====== HERO ====== */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex flex-col overflow-hidden"
      >
        {/* Light mesh gradient */}
        <div className="lp-gradient-bg-light" />

        {/* Floating tags */}
        <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
          {FLOATING_TAGS.map((tag, i) => (
            <div
              key={tag}
              className="lp-floating-tag-light"
              style={{
                left: `${15 + (i % 3) * 28}%`,
                top: `${20 + Math.floor(i / 3) * 30}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${5 + i * 0.8}s`,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-5 md:px-12 py-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo-64.png" alt="WW" width={32} height={32} className="rounded" />
            <span className="text-[15px] font-semibold text-gray-900 tracking-tight">WinWin Analyzer</span>
          </div>
          <a href="/register" className="text-sm text-gray-500 hover:text-gray-700 no-underline transition-colors">
            สมัครสมาชิก
          </a>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-20">
          <div className="lp-badge-light mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            จากคอร์ส Inside Bank · Inside Business Finance
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-5">
            <span className="text-gray-900">สแกนธุรกิจ</span>
            <br />
            <span className="lp-text-gradient">เตรียมพร้อมกู้</span>
          </h1>

          <p className="text-gray-500 text-base md:text-lg max-w-md mb-10 leading-relaxed">
            รู้สุขภาพการเงิน เช็คความพร้อมขยาย
            เตรียมตัวก่อนเข้าธนาคาร
          </p>

          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => signIn('google', { callbackUrl: '/select' })}
              className="lp-btn-google-light group"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>เข้าสู่ระบบด้วย Google</span>
              <div className="lp-shimmer-light" />
            </button>
            <a href="/login/email" className="text-gray-500 text-sm hover:text-gray-600 no-underline transition-colors">
              เข้าด้วยอีเมล / รหัสผ่าน
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="lp-scroll-indicator-light">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M7 10l5 5 5-5"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ====== PRODUCT CARDS ====== */}
      <section className="relative bg-gray-50 py-20 px-5 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 anim-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              เลือกเครื่องมือที่เหมาะกับคุณ
            </h2>
            <p className="text-gray-500 text-base md:text-lg max-w-lg mx-auto">
              2 Template สำหรับ 2 คอร์ส — เลือกได้หลังเข้าสู่ระบบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* IB Card */}
            <div
              className="lp-product-card-light anim-fade-up group"
              style={{ transform: `perspective(800px) rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 3}deg)` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-blue-700 text-xs font-bold" style={{ background: IB_COLOR.bg }}>
                  IB
                </div>
                <div>
                  <div className="text-gray-900 font-semibold text-[15px]">Inside Bank</div>
                  <div className="text-gray-500 text-xs">Business MRI — 7 Steps</div>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                สแกนธุรกิจจากมุมมองธนาคาร ได้รายงาน MRI + Business Score + คำแนะนำเตรียมกู้
              </p>
              <div className="space-y-2">
                {FEATURES_IB.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-gray-500 text-xs group-hover:text-gray-700 transition-colors" style={{ transitionDelay: `${i * 50}ms` }}>
                    <f.icon size={14} className="text-blue-600/60" />
                    {f.label}
                  </div>
                ))}
              </div>
            </div>

            {/* IBF Card */}
            <div
              className="lp-product-card-light anim-fade-up group"
              style={{ transform: `perspective(800px) rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 3}deg)`, animationDelay: '0.1s' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-amber-700 text-xs font-bold" style={{ background: IBF_COLOR.bg }}>
                  IBF
                </div>
                <div>
                  <div className="text-gray-900 font-semibold text-[15px]">Inside Business Finance</div>
                  <div className="text-gray-500 text-xs">Owner Dashboard — 10 ช่อง</div>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                เครื่องมือวิเคราะห์การเงินสำหรับเจ้าของ SME กรอก 9 ตัวเลข เห็น Dashboard ครบ + 8 เครื่องมือ
              </p>
              <div className="space-y-2">
                {FEATURES_IBF.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-gray-500 text-xs group-hover:text-gray-700 transition-colors" style={{ transitionDelay: `${i * 50}ms` }}>
                    <f.icon size={14} className="text-amber-600/60" />
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TOOLS BY TEMPLATE ====== */}
      <section className="bg-gray-50 py-20 px-5 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* IB Tools */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8 anim-fade-up">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-700 text-sm font-bold" style={{ background: IB_COLOR.bg }}>
                IB
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Inside Bank — Business MRI</h3>
                <p className="text-gray-500 text-sm">สแกนธุรกิจ 7 Steps จากมุมมองธนาคาร</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOOLS_IB.map((t, i) => (
                <ToolCard key={t.tag} tool={t} delay={i * 60} />
              ))}
            </div>
          </div>

          {/* IBF Tools */}
          <div>
            <div className="flex items-center gap-3 mb-8 anim-fade-up">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-700 text-sm font-bold" style={{ background: IBF_COLOR.bg }}>
                IBF
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Inside Business Finance</h3>
                <p className="text-gray-500 text-sm">เครื่องมือ 8 ตัว ครบทุก Session สำหรับเจ้าของ SME</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOOLS_IBF.map((t, i) => (
                <ToolCard key={t.tag} tool={t} delay={i * 60} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="bg-white py-16 px-5 md:px-12">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6">
          {[
            { value: 7, label: 'Steps ครบวงจร', suffix: '' },
            { value: 5, label: 'นาที ต่อ Step', suffix: '' },
            { value: 100, label: 'ข้อมูลเป็นความลับ', suffix: '%' },
          ].map((s, i) => (
            <div key={s.label} className="text-center anim-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="num text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                {s.value}<span className="text-emerald-600">{s.suffix}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== TRUST STRIP ====== */}
      <section className="bg-white pb-20 px-5 md:px-12">
        <div className="max-w-2xl mx-auto anim-fade-up">
          <div className="flex items-center justify-center gap-2.5 flex-wrap px-5 py-3.5 rounded-2xl bg-white border border-gray-100">
            <Shield size={16} className="text-emerald-500" />
            <span className="text-gray-500 text-sm">ข้อมูลเข้ารหัส ปลอดภัย ไม่แชร์กับบุคคลที่สาม</span>
            <span className="text-gray-200">·</span>
            <span className="text-gray-300 text-sm">by WinWin Wealth Creation</span>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-white border-t border-gray-100 py-6 px-5 md:px-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo-32.png" alt="WW" width={18} height={18} className="rounded opacity-40" />
            <span className="text-xs text-gray-300">WinWin Analyzer</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-300">
            <a href="/terms" className="hover:text-gray-500 no-underline text-gray-300 transition-colors">ข้อกำหนด</a>
            <a href="/privacy" className="hover:text-gray-500 no-underline text-gray-300 transition-colors">ความเป็นส่วนตัว</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Tool card ── */
function ToolCard({ tool: t, delay }: { tool: ToolItem; delay: number }) {
  return (
    <div className="lp-tool-card-light anim-fade-up group" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${t.color} 10%, transparent)` }}>
          <t.icon size={16} style={{ color: t.color }} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: t.color, opacity: 0.7 }}>{t.tag}</span>
      </div>
      <div className="text-[14px] font-semibold text-gray-800 leading-tight mb-1.5">{t.label}</div>
      <div className="text-[11px] text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors">{t.desc}</div>
    </div>
  );
}
