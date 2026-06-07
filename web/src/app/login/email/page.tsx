'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function EmailLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => { if (s?.user?.id) window.location.href = '/dashboard'; })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', { email, password, redirect: false });
      setLoading(false);
      if (result && !result.error) {
        window.location.href = '/dashboard';
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <img src="/logo-64.png" alt="WW" width={32} height={32} className="rounded" />
          <span className="text-base font-semibold tracking-tight">WinWin Analyzer</span>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">เข้าสู่ระบบ</h1>
          <p className="text-sm text-text-secondary mb-6">ใช้อีเมลและรหัสผ่าน</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full h-12 rounded-xl border border-border px-4 text-[15px] bg-bg-card text-text-primary outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                required
                className="w-full h-12 rounded-xl border border-border px-4 text-[15px] bg-bg-card text-text-primary outline-none focus:border-accent"
              />
            </div>

            {error && (
              <div className="text-sm text-status-bad bg-wash-bad rounded-xl px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold text-base cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-bg-card px-3 text-text-tertiary">หรือ</span></div>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full h-12 rounded-xl bg-bg-card border border-border-strong text-text-primary font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer hover:bg-bg-secondary transition"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            เข้าสู่ระบบด้วย Google
          </button>
        </div>

        <p className="text-center text-sm text-text-secondary mt-5">
          ยังไม่มีบัญชี? <a href="/register" className="text-accent font-medium no-underline">สมัครสมาชิก</a>
        </p>
        <p className="text-center text-sm mt-2">
          <a href="/login" className="text-text-tertiary no-underline">← กลับหน้าหลัก</a>
        </p>
      </div>
    </div>
  );
}
