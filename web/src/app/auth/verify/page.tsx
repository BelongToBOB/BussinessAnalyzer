export default function VerifyPage() {
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
          เราส่งลิงก์เข้าระบบให้แล้ว<br/>
          กดลิงก์ในอีเมลภายใน 15 นาทีเพื่อเข้าใช้งาน
        </p>
      </div>
    </div>
  );
}
