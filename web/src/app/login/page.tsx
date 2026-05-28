'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { InteractiveBG } from '@/components/ui/interactive-bg';
import { AuroraBG } from '@/components/ui/aurora-bg';

export default function LoginPage() {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLineLogin = () => {
    signIn('line', { callbackUrl: '/dashboard' });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    // Dev mode: use credentials provider (instant login, no email sent)
    // Production: will switch to LINE Login as primary
    const result = await signIn('dev-login', { email, redirect: false });
    console.log('[login] signIn result:', JSON.stringify(result));
    setSending(false);
    if (result && !result.error) {
      window.location.href = '/dashboard';
    } else {
      console.error('[login] signIn failed:', result?.error);
      setSent(true); // fallback UI
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
            <button onClick={() => setSent(false)} className="px-4 py-2.5 rounded-xl border border-border-strong text-sm font-semibold cursor-pointer bg-bg-card">
              เปลี่ยนอีเมล
            </button>
            <button onClick={() => handleEmailLogin({ preventDefault: () => {} } as any)} className="px-4 py-2.5 rounded-xl bg-text-primary text-bg-primary text-sm font-semibold cursor-pointer">
              ส่งใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-bg-primary" />
        <AuroraBG />
        <InteractiveBG />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-12 py-5">
        <div className="flex items-center gap-2.5">
          <img src="/logo-64.png" alt="WW" width={32} height={32} className="rounded" />
          <span className="text-base font-semibold tracking-tight">WinWin Analyzer</span>
        </div>
      </header>

      {/* Split layout: content left, visual right */}
      <main className="relative z-10 flex-1 flex items-center px-6 md:px-16 lg:px-24 pb-16">
        <div className="w-full max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-wash-info text-accent text-xs font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            สำหรับศิษย์เก่า Inside Bank · IBF
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] mb-5">
            เห็นธุรกิจชัด<br />
            <span className="text-text-secondary">ใน 5 นาทีต่อเดือน</span>
          </h1>

          <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-7 max-w-sm">
            กรอก 9 ตัวเลข เห็น Dashboard 10 ช่อง รู้ทันทีว่าธุรกิจตัวเอง
            สุขภาพดี/แย่ตรงไหน
          </p>

          {!showEmail ? (
            <>
              {/* LINE Login — primary */}
              <button
                onClick={handleLineLogin}
                className="w-full h-[52px] rounded-xl bg-[#06C755] text-white font-semibold text-base flex items-center justify-center gap-3 mb-3 cursor-pointer hover:brightness-95 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                เข้าสู่ระบบด้วย LINE
              </button>

              {/* Email fallback */}
              <div className="text-center">
                <button
                  onClick={() => setShowEmail(true)}
                  className="text-accent text-sm font-medium cursor-pointer bg-transparent border-none p-2"
                >
                  ใช้อีเมลแทน →
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="อีเมลที่ใช้สมัครคอร์ส"
                required
                autoFocus
                className="w-full h-[52px] rounded-xl border border-border-strong px-4 text-[15px] bg-bg-card text-text-primary outline-none focus:border-accent font-thai"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full h-[52px] rounded-xl bg-text-primary text-bg-primary font-semibold text-base cursor-pointer disabled:opacity-50"
              >
                {sending ? 'กำลังส่ง...' : 'ส่งลิงก์เข้าระบบ'}
              </button>
              <button
                type="button"
                onClick={() => setShowEmail(false)}
                className="text-text-secondary text-sm font-medium cursor-pointer bg-transparent border-none p-2"
              >
                ← กลับไปใช้ LINE
              </button>
            </form>
          )}

          <div className="text-xs text-text-tertiary mt-4 text-center">
            ไม่มีรหัสผ่าน · เข้าผ่าน LINE หรือลิงก์ทางอีเมล
          </div>
        </div>
      </main>
    </div>
  );
}
