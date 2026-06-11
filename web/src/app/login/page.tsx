'use client';

import { useState, useRef, useEffect } from 'react';
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

// Theme colors
const IB_COLOR = { accent: '#60A5FA', bg: 'rgba(96, 165, 250, 0.1)', bgHover: 'rgba(96, 165, 250, 0.15)', text: 'text-blue-400', tagText: 'text-blue-400/60' };
const IBF_COLOR = { accent: '#CA8A04', bg: 'rgba(202, 138, 4, 0.1)', bgHover: 'rgba(202, 138, 4, 0.15)', text: 'text-amber-500', tagText: 'text-amber-500/60' };

interface ToolItem { tag: string; label: string; desc: string; icon: LucideIcon; color: string }

const TOOLS_IB: ToolItem[] = [
  { tag: 'Step 1', label: 'ข้อมูลธุรกิจ', desc: 'ประเภท ยอดขาย พนักงาน อายุธุรกิจ', icon: ClipboardList, color: '#34C759' },
  { tag: 'Step 2', label: 'สแกนงบการเงิน', desc: 'กำไรขาดทุน · งบดุล · ตารางหนี้ → DSCR, D/E', icon: Stethoscope, color: '#007AFF' },
  { tag: 'Step 3', label: 'กระแสเงินสด 4 ชั้น', desc: 'เงินเข้า → เงินจริง → เงินเหลือ → เงินโต', icon: Layers, color: '#8B5CF6' },
  { tag: 'Step 4', label: 'มุมมองธนาคาร', desc: 'ธนาคารมองคุณยังไง — ประเมิน 4 มิติ', icon: Eye, color: '#FF9500' },
  { tag: 'Step 5', label: 'ออกแบบวงเงินกู้', desc: 'วัตถุประสงค์ · ทุนตัวเอง · หลักประกัน · LTV', icon: Calculator, color: '#06B6D4' },
  { tag: 'Step 6', label: 'กู้ได้เท่าไหร่', desc: 'วงเงิน 3 ระดับ — ปลอดภัย / สูงสุด / อันตราย', icon: Rocket, color: '#EC4899' },
  { tag: 'Step 7', label: 'เตรียมยื่นกู้', desc: 'เอกสาร · คำถามธนาคาร · แผนปฏิบัติ', icon: FileText, color: '#FF3B30' },
];

const TOOLS_IBF: ToolItem[] = [
  { tag: 'S1', label: 'เช็คเงินจริง', desc: 'ยอดขายสูงแต่เงินไม่เพิ่ม? เช็คได้ทันที', icon: Search, color: '#34C759' },
  { tag: 'S2', label: 'อ่านงบกำไรขาดทุน', desc: 'ดู margin แต่ละชั้น รู้ว่ากำไรจริงเท่าไหร่', icon: BarChart3, color: '#007AFF' },
  { tag: 'S3', label: 'Cashflow 4 ชั้น', desc: 'ไล่เงินจริง 4 ชั้น หาว่าเงินหายตรงไหน', icon: Layers, color: '#8B5CF6' },
  { tag: 'S4', label: 'ตั้งราคา + CM', desc: 'คำนวณราคาที่ได้กำไรจริง + จุดคุ้มทุน', icon: Tag, color: '#FF9500' },
  { tag: 'S5', label: 'Expense Map', desc: 'แผนที่ค่าใช้จ่าย อุดรอยรั่วก่อนเร่งยอด', icon: Map, color: '#FF3B30' },
  { tag: 'S6', label: 'ระบบ 5 ช่อง', desc: 'แยกเงินให้ชัด ไม่ปนกันอีกต่อไป', icon: Grid3X3, color: '#06B6D4' },
  { tag: 'S7', label: 'แผนธุรกิจ 1 หน้า', desc: 'ตอบ 4 คำถามธนาคาร พร้อมยื่นกู้', icon: FileText, color: '#EC4899' },
  { tag: '10 ช่อง', label: 'Owner Dashboard', desc: 'กรอก 9 ตัวเลข เห็นสุขภาพธุรกิจครบ 10 ช่อง', icon: Wallet, color: '#1D1D1F' },
];

const FLOATING_TAGS = ['DSCR', 'D/E', 'LTV', 'EBITDA', 'Cash Flow', 'MRI'];

export default function LoginPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  // Track mouse for 3D card tilt
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050510]">
      {/* ====== HERO — Full viewport, animated gradient ====== */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex flex-col overflow-hidden"
      >
        {/* Animated mesh gradient background */}
        <div className="lp-gradient-bg" />

        {/* Floating metric tags — contained within hero */}
        <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
          {FLOATING_TAGS.map((tag, i) => (
            <div
              key={tag}
              className="lp-floating-tag"
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

        {/* Grid overlay */}
        <div className="absolute inset-0 z-[1] opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-5 md:px-12 py-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo-64.png" alt="WW" width={32} height={32} className="rounded" />
            <span className="text-[15px] font-semibold text-white/90 tracking-tight">WinWin Analyzer</span>
          </div>
          <a href="/register" className="text-sm text-white/50 hover:text-white/80 no-underline transition-colors">
            สมัครสมาชิก
          </a>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-20">
          {/* Badge */}
          <div className="lp-badge mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            จากคอร์ส Inside Bank · Inside Business Finance
          </div>

          {/* Headline with gradient text */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-5">
            <span className="text-white">สแกนธุรกิจ</span>
            <br />
            <span className="lp-text-gradient">เตรียมพร้อมกู้</span>
          </h1>

          <p className="text-white/50 text-base md:text-lg max-w-md mb-10 leading-relaxed">
            รู้สุขภาพการเงิน เช็คความพร้อมขยาย
            เตรียมตัวก่อนเข้าธนาคาร
          </p>

          {/* Login buttons */}
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => signIn('google', { callbackUrl: '/select' })}
              className="lp-btn-google group"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>เข้าสู่ระบบด้วย Google</span>
              <div className="lp-shimmer" />
            </button>
            <a href="/login/email" className="text-white/40 text-sm hover:text-white/70 no-underline transition-colors">
              เข้าด้วยอีเมล / รหัสผ่าน
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="lp-scroll-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M7 10l5 5 5-5"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ====== PRODUCT CARDS — 3D tilt ====== */}
      <section className="relative bg-[#050510] py-20 px-5 md:px-12">
        {/* Wave divider */}
        <div className="absolute top-0 left-0 right-0 h-24 -translate-y-full overflow-hidden">
          <svg viewBox="0 0 1440 100" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,60 C360,100 720,20 1440,60 L1440,100 L0,100 Z" fill="#050510" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 anim-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
              เลือกเครื่องมือที่เหมาะกับคุณ
            </h2>
            <p className="text-white/40 text-base md:text-lg max-w-lg mx-auto">
              2 Template สำหรับ 2 คอร์ส — เลือกได้หลังเข้าสู่ระบบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* IB Card — Navy */}
            <div
              className="lp-product-card anim-fade-up group"
              style={{
                transform: `perspective(800px) rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 3}deg)`,
              }}
            >
              <div className="lp-card-glow lp-glow-navy" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-blue-400 text-xs font-bold" style={{ background: IB_COLOR.bg }}>
                    IB
                  </div>
                  <div>
                    <div className="text-white font-semibold text-[15px]">Inside Bank</div>
                    <div className="text-white/40 text-xs">Business MRI — 7 Steps</div>
                  </div>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  สแกนธุรกิจจากมุมมองธนาคาร ได้รายงาน MRI + Business Score + คำแนะนำเตรียมกู้
                </p>
                <div className="space-y-2">
                  {FEATURES_IB.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-white/60 text-xs group-hover:text-white/80 transition-colors" style={{ transitionDelay: `${i * 50}ms` }}>
                      <f.icon size={14} className="text-blue-400/70" />
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* IBF Card — Gold */}
            <div
              className="lp-product-card anim-fade-up group"
              style={{
                transform: `perspective(800px) rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 3}deg)`,
                animationDelay: '0.1s',
              }}
            >
              <div className="lp-card-glow lp-glow-gold" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-amber-500 text-xs font-bold" style={{ background: IBF_COLOR.bg }}>
                    IBF
                  </div>
                  <div>
                    <div className="text-white font-semibold text-[15px]">Inside Business Finance</div>
                    <div className="text-white/40 text-xs">Owner Dashboard — 10 ช่อง</div>
                  </div>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  เครื่องมือวิเคราะห์การเงินสำหรับเจ้าของ SME กรอก 9 ตัวเลข เห็น Dashboard ครบ + 8 เครื่องมือ
                </p>
                <div className="space-y-2">
                  {FEATURES_IBF.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-white/60 text-xs group-hover:text-white/80 transition-colors" style={{ transitionDelay: `${i * 50}ms` }}>
                      <f.icon size={14} className="text-amber-500/70" />
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TOOLS BY TEMPLATE ====== */}
      <section className="bg-[#070714] py-20 px-5 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* IB Tools — Navy */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8 anim-fade-up">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-400 text-sm font-bold" style={{ background: IB_COLOR.bg }}>
                IB
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">Inside Bank — Business MRI</h3>
                <p className="text-white/35 text-sm">สแกนธุรกิจ 7 Steps จากมุมมองธนาคาร</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOOLS_IB.map((t, i) => (
                <ToolCard key={t.tag} tool={t} delay={i * 60} />
              ))}
            </div>
          </div>

          {/* IBF Tools — Gold */}
          <div>
            <div className="flex items-center gap-3 mb-8 anim-fade-up">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-500 text-sm font-bold" style={{ background: IBF_COLOR.bg }}>
                IBF
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">Inside Business Finance</h3>
                <p className="text-white/35 text-sm">เครื่องมือ 8 ตัว ครบทุก Session สำหรับเจ้าของ SME</p>
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

      {/* ====== STATS — Count up on scroll ====== */}
      <section className="bg-[#050510] py-16 px-5 md:px-12">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6">
          {[
            { value: 7, label: 'Steps ครบวงจร', suffix: '' },
            { value: 5, label: 'นาที ต่อ Step', suffix: '' },
            { value: 100, label: 'ข้อมูลเป็นความลับ', suffix: '%' },
          ].map((s, i) => (
            <CountUpStat key={s.label} value={s.value} suffix={s.suffix} label={s.label} delay={i * 150} />
          ))}
        </div>
      </section>

      {/* ====== TRUST STRIP ====== */}
      <section className="bg-[#050510] pb-20 px-5 md:px-12">
        <div className="max-w-2xl mx-auto anim-fade-up">
          <div className="lp-trust-strip">
            <Shield size={16} className="text-emerald-400" />
            <span className="text-white/50 text-sm">ข้อมูลเข้ารหัส ปลอดภัย ไม่แชร์กับบุคคลที่สาม</span>
            <span className="text-white/20">·</span>
            <span className="text-white/30 text-sm">by WinWin Wealth Creation</span>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-[#030308] border-t border-white/5 py-6 px-5 md:px-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo-32.png" alt="WW" width={18} height={18} className="rounded opacity-50" />
            <span className="text-xs text-white/25">WinWin Analyzer</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <a href="/terms" className="hover:text-white/50 no-underline text-white/25 transition-colors">ข้อกำหนด</a>
            <a href="/privacy" className="hover:text-white/50 no-underline text-white/25 transition-colors">ความเป็นส่วนตัว</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>

      {/* CSS moved to globals.css — no style jsx needed */}
    </div>
  );
}

/* ── Tool card with individual color ── */
function ToolCard({ tool: t, delay }: { tool: ToolItem; delay: number }) {
  return (
    <div
      className="lp-tool-card anim-fade-up group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${t.color} 12%, transparent)` }}>
          <t.icon size={16} style={{ color: t.color }} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: t.color, opacity: 0.6 }}>{t.tag}</span>
      </div>
      <div className="text-[14px] font-semibold text-white/90 leading-tight mb-1.5">{t.label}</div>
      <div className="text-[11px] text-white/35 leading-relaxed group-hover:text-white/55 transition-colors">{t.desc}</div>
    </div>
  );
}

/* ── Count-up stat component — animates on mount, no IntersectionObserver ── */
function CountUpStat({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1200;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
    }, delay + 500); // extra 500ms so user scrolls into view first
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="text-center anim-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="num text-3xl md:text-4xl font-bold text-white tracking-tight">
        {count}<span className="text-emerald-400">{suffix}</span>
      </div>
      <div className="text-xs text-white/35 mt-1.5">{label}</div>
    </div>
  );
}
