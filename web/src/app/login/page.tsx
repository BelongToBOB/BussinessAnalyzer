'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';

const TOOLS = [
  { tag: 'S1', label: 'เช็คเงินจริง', desc: 'ยอดขายสูงแต่เงินไม่เพิ่ม? เช็คได้ทันที', icon: 'search', color: '#34C759' },
  { tag: 'S2', label: 'อ่านงบกำไรขาดทุน', desc: 'ดู margin แต่ละชั้น รู้ว่ากำไรจริงเท่าไหร่', icon: 'chart', color: '#007AFF' },
  { tag: 'S3', label: 'Cashflow 4 ชั้น', desc: 'ไล่เงินจริง 4 ชั้น หาว่าเงินหายตรงไหน', icon: 'layers', color: '#8B5CF6' },
  { tag: 'S4', label: 'ตั้งราคา + CM (กำไรส่วนเกิน)', desc: 'คำนวณราคาที่ได้กำไรจริง + จุดคุ้มทุน', icon: 'tag', color: '#FF9500' },
  { tag: 'S5', label: 'Expense Map', desc: 'แผนที่ค่าใช้จ่าย อุดรอยรั่วก่อนเร่งยอด', icon: 'map', color: '#FF3B30' },
  { tag: 'S6', label: 'ระบบ 5 ช่อง', desc: 'แยกเงินให้ชัด ไม่ปนกันอีกต่อไป', icon: 'grid', color: '#06B6D4' },
  { tag: 'S7', label: 'แผนธุรกิจ 1 หน้า', desc: 'ตอบ 4 คำถามธนาคาร พร้อมยื่นกู้', icon: 'file', color: '#EC4899' },
  { tag: '10 ช่อง', label: 'Owner Dashboard', desc: 'กรอก 9 ตัวเลข เห็นสุขภาพธุรกิจครบ 10 ช่อง', icon: 'dashboard', color: '#1D1D1F' },
];

function ToolIcon({ icon, color }: { icon: string; color: string }) {
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>;
    case 'chart': return <svg {...p}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>;
    case 'layers': return <svg {...p}><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/><path d="M12 2L2 7l10 5 10-5L12 2z"/></svg>;
    case 'tag': return <svg {...p}><path d="M12 2L2 7l10 5 10-5L12 2z"/><line x1="12" y1="17" x2="12" y2="22"/></svg>;
    case 'map': return <svg {...p}><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>;
    case 'grid': return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case 'file': return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>;
    case 'dashboard': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

export default function LoginPage() {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.15 }
    );

    const items = toolsRef.current?.querySelectorAll('.tool-card');
    items?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleLineLogin = () => {
    signIn('line', { callbackUrl: '/dashboard' });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const result = await signIn('dev-login', { email, redirect: false });
    setSending(false);
    if (result && !result.error) {
      window.location.href = '/dashboard';
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-wash-info text-accent inline-flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="6" width="20" height="16" rx="2"/>
              <path d="M4 8l10 7 10-7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2.5">เช็คอีเมลของคุณ</h1>
          <p className="text-text-secondary text-[15px] leading-relaxed">
            เราส่งลิงก์เข้าระบบไปที่<br/>
            <span className="text-text-primary font-semibold">{email}</span><br/>
            กดลิงก์ในอีเมลภายใน 15 นาที
          </p>
          <div className="flex gap-2 justify-center mt-6">
            <button onClick={() => setSent(false)} className="px-4 py-2.5 rounded-xl border border-border-strong text-sm font-semibold cursor-pointer bg-bg-card">เปลี่ยนอีเมล</button>
            <button onClick={() => handleEmailLogin({ preventDefault: () => {} } as any)} className="px-4 py-2.5 rounded-xl bg-text-primary text-bg-primary text-sm font-semibold cursor-pointer">ส่งใหม่</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* ====== HERO SECTION ====== */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img src="/bg-login.jpg" alt="" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          <div className="absolute inset-0" style={{ background: 'rgba(var(--bg-primary-rgb, 255,255,255), 0.92)' }} />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 md:px-12 py-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo-64.png" alt="WW" width={32} height={32} className="rounded" />
            <span className="text-base font-semibold tracking-tight">WinWin Analyzer</span>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center px-6 md:px-16 lg:px-24 pb-16">
          <div className="w-full max-w-lg">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              เห็นธุรกิจชัด<br />
              <span className="text-text-secondary">ใน 5 นาทีต่อเดือน</span>
            </h1>

            <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-7 max-w-sm animate-fade-up" style={{ animationDelay: '0.3s' }}>
              กรอก 9 ตัวเลข เห็น Dashboard 10 ช่อง รู้ทันทีว่าธุรกิจตัวเอง
              สุขภาพดี/แย่ตรงไหน
            </p>

            <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
              {!showEmail ? (
                <>
                  <button onClick={handleLineLogin}
                    className="w-full h-[52px] rounded-xl bg-[#06C755] text-white font-semibold text-base flex items-center justify-center gap-3 mb-3 cursor-pointer hover:brightness-95 transition">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    เข้าสู่ระบบด้วย LINE
                  </button>
                  <div className="text-center">
                    <button onClick={() => setShowEmail(true)} className="text-accent text-sm font-medium cursor-pointer bg-transparent border-none p-2">
                      ใช้อีเมลแทน →
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมลที่ใช้สมัครคอร์ส" required autoFocus
                    className="w-full h-[52px] rounded-xl border border-border-strong px-4 text-[15px] bg-bg-card text-text-primary outline-none focus:border-accent font-thai" />
                  <button type="submit" disabled={sending} className="w-full h-[52px] rounded-xl bg-text-primary text-bg-primary font-semibold text-base cursor-pointer disabled:opacity-50">
                    {sending ? 'กำลังส่ง...' : 'ส่งลิงก์เข้าระบบ'}
                  </button>
                  <button type="button" onClick={() => setShowEmail(false)} className="text-text-secondary text-sm font-medium cursor-pointer bg-transparent border-none p-2">
                    ← กลับไปใช้ LINE
                  </button>
                </form>
              )}
              <div className="text-xs text-text-tertiary mt-4 text-center">
                ไม่มีรหัสผ่าน · เข้าผ่าน LINE หรือลิงก์ทางอีเมล
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8 animate-bounce">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
            <path d="M7 10l5 5 5-5"/>
          </svg>
        </div>
      </section>

      {/* ====== TOOLS SECTION ====== */}
      <section className="bg-bg-secondary py-20 px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-wash-good text-status-good text-xs font-semibold mb-4">
              เครื่องมือ 8 ตัว ครบทุก Session
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
              ทุกเครื่องมือที่เจ้าของธุรกิจต้องมี
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto">
              จากคอร์ส Inside Bank · Inside Business Finance — เปลี่ยนจาก Excel เป็น Web App ที่ปกป้องสูตร เก็บ history และวินิจฉัยให้อัตโนมัติ
            </p>
          </div>

          <div ref={toolsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOOLS.map((t, i) => (
              <div
                key={t.tag + t.label}
                className="tool-card opacity-0 translate-y-6 bg-bg-card border border-border rounded-2xl p-5 transition-all duration-500 hover:shadow-[var(--shadow-pop)] hover:-translate-y-1"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `color-mix(in srgb, ${t.color} 10%, transparent)` }}>
                  <ToolIcon icon={t.icon} color={t.color} />
                </div>
                <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: t.color }}>{t.tag}</div>
                <div className="text-[15px] font-semibold text-text-primary leading-tight mb-1.5">{t.label}</div>
                <div className="text-xs text-text-secondary leading-relaxed">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== STATS SECTION ====== */}
      <section className="bg-bg-primary py-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '10', label: 'ช่อง Dashboard', suffix: '' },
            { value: '8', label: 'เครื่องมือวิเคราะห์', suffix: '' },
            { value: '5', label: 'นาที / เดือน', suffix: '' },
            { value: '100', label: 'ปกป้องสูตร', suffix: '%' },
          ].map((s) => (
            <div key={s.label}>
              <div className="num text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
                {s.value}<span className="text-accent">{s.suffix}</span>
              </div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== CTA SECTION ====== */}
      <section className="bg-bg-secondary py-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-lg mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">พร้อมเริ่มวิเคราะห์ธุรกิจ?</h3>
          <p className="text-text-secondary mb-6">เข้าระบบแล้วเริ่มใช้งานได้ทันที ไม่มีค่าใช้จ่าย</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="h-12 px-8 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-base hover:opacity-90 transition"
          >
            เข้าสู่ระบบ ↑
          </button>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-bg-primary border-t border-border py-6 px-6 md:px-16">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo-32.png" alt="WW" width={20} height={20} className="rounded" />
            <span className="text-xs text-text-tertiary">WinWin Analyzer · WinWin Wealth Creation</span>
          </div>
          <div className="text-xs text-text-tertiary">© 2024 สงวนลิขสิทธิ์</div>
        </div>
      </footer>

      {/* ====== CSS Animations ====== */}
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.6s ease-out both;
        }
        .tool-card.animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}
