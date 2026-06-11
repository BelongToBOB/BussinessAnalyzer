'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Activity, BarChart3, Layers, PiggyBank, Shield, TrendingUp, Landmark, FileText, Search, Tag, Map, Grid3X3, Stethoscope, Wallet, Eye, Rocket, ClipboardList, Calculator, ChevronRight, Lock, type LucideIcon } from 'lucide-react';

interface ToolItem { tag: string; label: string; desc: string; icon: LucideIcon; color: string }

const TOOLS_IB: ToolItem[] = [
  { tag: 'Step 1', label: 'ข้อมูลธุรกิจ', desc: 'ประเภท ยอดขาย พนักงาน อายุธุรกิจ', icon: ClipboardList, color: '#16A34A' },
  { tag: 'Step 2', label: 'สแกนงบการเงิน', desc: 'กำไรขาดทุน · งบดุล · ตารางหนี้', icon: Stethoscope, color: '#2563EB' },
  { tag: 'Step 3', label: 'กระแสเงินสด 4 ชั้น', desc: 'เงินเข้า → เงินจริง → เงินเหลือ → เงินโต', icon: Layers, color: '#7C3AED' },
  { tag: 'Step 4', label: 'มุมมองธนาคาร', desc: 'ธนาคารมองคุณยังไง — 4 มิติ', icon: Eye, color: '#EA580C' },
  { tag: 'Step 5', label: 'ออกแบบวงเงินกู้', desc: 'วัตถุประสงค์ · ทุน · หลักประกัน', icon: Calculator, color: '#0891B2' },
  { tag: 'Step 6', label: 'กู้ได้เท่าไหร่', desc: 'วงเงิน 3 ระดับ — ปลอดภัย/สูงสุด/อันตราย', icon: Rocket, color: '#DB2777' },
  { tag: 'Step 7', label: 'เตรียมยื่นกู้', desc: 'เอกสาร · คำถามธนาคาร · แผนปฏิบัติ', icon: FileText, color: '#DC2626' },
];

const TOOLS_IBF: ToolItem[] = [
  { tag: 'S1', label: 'เช็คเงินจริง', desc: 'ยอดขายสูงแต่เงินไม่เพิ่ม? เช็คได้ทันที', icon: Search, color: '#16A34A' },
  { tag: 'S2', label: 'อ่านงบกำไรขาดทุน', desc: 'ดู margin แต่ละชั้น รู้กำไรจริง', icon: BarChart3, color: '#2563EB' },
  { tag: 'S3', label: 'Cashflow 4 ชั้น', desc: 'ไล่เงินจริง 4 ชั้น หาเงินหาย', icon: Layers, color: '#7C3AED' },
  { tag: 'S4', label: 'ตั้งราคา + CM', desc: 'คำนวณราคาที่ได้กำไรจริง', icon: Tag, color: '#EA580C' },
  { tag: 'S5', label: 'Expense Map', desc: 'แผนที่ค่าใช้จ่าย อุดรอยรั่ว', icon: Map, color: '#DC2626' },
  { tag: 'S6', label: 'ระบบ 5 ช่อง', desc: 'แยกเงินให้ชัด ไม่ปนกัน', icon: Grid3X3, color: '#0891B2' },
  { tag: 'S7', label: 'แผนธุรกิจ 1 หน้า', desc: 'ตอบ 4 คำถามธนาคาร พร้อมยื่นกู้', icon: FileText, color: '#DB2777' },
  { tag: '10 ช่อง', label: 'Owner Dashboard', desc: 'กรอก 9 ตัวเลข เห็นสุขภาพธุรกิจครบ', icon: Wallet, color: '#475569' },
];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'ib' | 'ibf'>('ib');

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-white">
      {/* ====== NAVBAR — Navy full width ====== */}
      <header className="lp-navbar relative z-20 flex items-center justify-between px-5 md:px-12 py-3.5">
        <div className="flex items-center gap-2.5">
          <img src="/logo-64.png" alt="WW" width={28} height={28} className="rounded" />
          <span className="text-[15px] font-semibold text-white tracking-tight">WinWin Analyzer</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/login/email" className="text-sm text-white/60 hover:text-white no-underline transition-colors hidden md:block">
            เข้าด้วยอีเมล
          </a>
          <a href="/register" className="text-sm text-white font-medium no-underline transition-all px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15">
            สมัครสมาชิก
          </a>
        </div>
      </header>

      {/* ====== HERO — Navy bg, split layout, fill viewport ====== */}
      <section className="lp-hero-navy relative overflow-hidden min-h-[calc(100vh-52px)] flex items-center">
        <div className="max-w-6xl mx-auto px-5 md:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="anim-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/70 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                เครื่องมือวิเคราะห์การเงินธุรกิจ
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.15] mb-5 text-white">
                สแกนธุรกิจ
                <br />
                <span className="lp-text-gradient-light">เตรียมพร้อมกู้</span>
              </h1>

              <p className="text-white/50 text-base md:text-lg max-w-md mb-8 leading-relaxed">
                รู้สุขภาพการเงิน เช็คความพร้อมขยาย เตรียมตัวก่อนเข้าธนาคาร
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
                <button
                  onClick={() => signIn('google', { callbackUrl: '/select' })}
                  className="lp-btn-hero group flex-1"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  เข้าสู่ระบบด้วย Google
                </button>
              </div>

              {/* Stats inline */}
              <div className="flex gap-8 mt-10">
                {[
                  { v: '7', l: 'Steps ครบวงจร' },
                  { v: '5 นาที', l: 'ต่อ Step' },
                  { v: '100%', l: 'ปลอดภัย' },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="num text-xl font-bold text-white">{s.v}</div>
                    <div className="text-[11px] text-white/40">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mockup browser frame */}
            <div className="anim-fade-up hidden lg:block" style={{ animationDelay: '0.15s' }}>
              <div className="lp-mockup">
                <div className="lp-mockup-bar">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                  </div>
                  <div className="flex-1 mx-4 h-5 rounded bg-white/5 text-[9px] text-white/30 flex items-center justify-center">
                    tools.winwinwealth.co
                  </div>
                </div>
                <div className="lp-mockup-body">
                  {/* Mini dashboard preview */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20" />
                      <div>
                        <div className="h-2.5 w-24 bg-white/15 rounded" />
                        <div className="h-2 w-16 bg-white/8 rounded mt-1" />
                      </div>
                    </div>
                    {/* Score ring placeholder */}
                    <div className="flex justify-center py-3">
                      <div className="w-28 h-28 rounded-full border-[6px] border-emerald-400/30 flex items-center justify-center">
                        <div>
                          <div className="num text-2xl font-bold text-white text-center">72</div>
                          <div className="text-[8px] text-white/40 text-center">คะแนน</div>
                        </div>
                      </div>
                    </div>
                    {/* Metric bars */}
                    <div className="space-y-2 px-2">
                      {['DSCR', 'D/E', 'EBITDA'].map((m, i) => (
                        <div key={m} className="flex items-center gap-2">
                          <span className="text-[8px] text-white/30 w-10">{m}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/5">
                            <div className="h-full rounded-full" style={{ width: `${70 - i * 15}%`, background: i === 0 ? '#22C55E' : i === 1 ? '#EAB308' : '#EF4444' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== PRODUCT CARDS — White section, full-width cards ====== */}
      <section className="bg-white py-20 px-5 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 anim-fade-up">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              2 เครื่องมือ สำหรับ 2 เป้าหมาย
            </h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto">
              เลือกได้หลังเข้าสู่ระบบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 anim-fade-up">
            {/* IB Card */}
            <div className="lp-card-ib group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white text-xs font-bold">IB</div>
                <div>
                  <div className="text-white font-semibold">Inside Bank</div>
                  <div className="text-white/50 text-xs">Business MRI — 7 Steps</div>
                </div>
                <ChevronRight size={16} className="ml-auto text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                สแกนธุรกิจจากมุมมองธนาคาร ได้ MRI Report + Business Score + คำแนะนำเตรียมกู้
              </p>
              <div className="flex flex-wrap gap-2">
                {['Business Score', 'DSCR', 'Growth Capacity', 'Bank Simulation'].map((f) => (
                  <span key={f} className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/60">{f}</span>
                ))}
              </div>
            </div>

            {/* IBF Card */}
            <div className="lp-card-ibf group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white text-xs font-bold">IBF</div>
                <div>
                  <div className="text-white font-semibold">Inside Business Finance</div>
                  <div className="text-white/50 text-xs">Owner Dashboard — 10 ช่อง + 8 เครื่องมือ</div>
                </div>
                <ChevronRight size={16} className="ml-auto text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                เครื่องมือวิเคราะห์การเงินสำหรับเจ้าของ SME กรอก 9 ตัวเลข เห็น Dashboard ครบ
              </p>
              <div className="flex flex-wrap gap-2">
                {['Cashflow 4 Layers', 'Expense Map', 'ระบบ 5 ช่อง', 'แผนธุรกิจ'].map((f) => (
                  <span key={f} className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/60">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TOOLS — Tab switching IB / IBF ====== */}
      <section className="bg-gray-50 py-20 px-5 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 anim-fade-up">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-6">
              เครื่องมือทั้งหมด
            </h2>
            {/* Tab switcher */}
            <div className="inline-flex items-center bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
              <button
                onClick={() => setActiveTab('ib')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-none ${
                  activeTab === 'ib' ? 'bg-[#0F172A] text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Inside Bank (7 Steps)
              </button>
              <button
                onClick={() => setActiveTab('ibf')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-none ${
                  activeTab === 'ibf' ? 'bg-[#92400E] text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                IBF (8 เครื่องมือ)
              </button>
            </div>
          </div>

          {/* Tool grid — animate on tab change */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" key={activeTab}>
            {(activeTab === 'ib' ? TOOLS_IB : TOOLS_IBF).map((t, i) => (
              <div key={t.tag} className="lp-tool-card-light anim-fade-up group" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `color-mix(in srgb, ${t.color} 10%, transparent)` }}>
                    <t.icon size={18} style={{ color: t.color }} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: t.color, opacity: 0.8 }}>{t.tag}</span>
                </div>
                <div className="text-[14px] font-semibold text-gray-800 leading-tight mb-1.5">{t.label}</div>
                <div className="text-[11px] text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TRUST + FOOTER — Compact ====== */}
      <footer className="bg-white border-t border-gray-100 py-8 px-5 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Trust */}
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Lock size={12} />
              <span>ข้อมูลเข้ารหัส</span>
            </div>
            <span className="text-gray-200">·</span>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Shield size={12} />
              <span>ไม่แชร์กับบุคคลที่สาม</span>
            </div>
            <span className="text-gray-200">·</span>
            <span className="text-gray-300 text-xs">by WinWin Wealth Creation</span>
          </div>
          {/* Links */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo-32.png" alt="WW" width={16} height={16} className="rounded opacity-30" />
              <span className="text-xs text-gray-300">WinWin Analyzer</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-300">
              <a href="/terms" className="hover:text-gray-500 no-underline text-gray-300 transition-colors">ข้อกำหนด</a>
              <a href="/privacy" className="hover:text-gray-500 no-underline text-gray-300 transition-colors">ความเป็นส่วนตัว</a>
              <span>© 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
