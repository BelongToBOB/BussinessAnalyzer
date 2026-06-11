'use client';

import { useEffect, useState } from 'react';
import { logout } from '@/lib/logout';
import { getBusiness, updateBusiness } from '@/lib/api';

const TEMPLATES = [
  {
    id: 'ibf',
    name: 'Inside Business Finance',
    desc: 'เครื่องมือวิเคราะห์การเงินสำหรับเจ้าของ SME — กรอก 9 ตัวเลข เห็น Dashboard 10 ช่อง + เครื่องมือ 8 ตัว',
    icon: 'IBF',
    color: '#CA8A04',
    btnBg: 'linear-gradient(135deg, #78350F, #92400E)',
    borderAccent: 'rgba(202, 138, 4, 0.25)',
    features: ['Owner Dashboard 10 ช่อง', 'Cashflow 4 Layers', 'Expense Map', 'แผนธุรกิจ 1 หน้า'],
    ready: true,
  },
  {
    id: 'ib',
    name: 'Inside Bank — Business MRI',
    desc: 'สแกนธุรกิจจากมุมมองธนาคาร — 8 Steps ได้รายงาน MRI + Business Score + คำแนะนำเตรียมกู้',
    icon: 'IB',
    color: '#3B82F6',
    btnBg: 'linear-gradient(135deg, #1E3A5F, #1E40AF)',
    borderAccent: 'rgba(59, 130, 246, 0.25)',
    features: ['Business Score 0-100', 'Financial MRI + DSCR', 'Growth Capacity', 'Bank Simulation'],
    ready: true,
  },
];

export default function SelectTemplatePage() {
  const [hasBusiness, setHasBusiness] = useState(false);
  const [bizTemplate, setBizTemplate] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getBusiness()
      .then((biz: any) => { setHasBusiness(true); setBizTemplate(biz.template || 'ibf'); setChecking(false); })
      .catch(() => { setChecking(false); });
  }, []);

  if (checking) {
    return <div data-theme-gate="" className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังตรวจสอบ...</div>;
  }

  return (
    <div data-theme-gate="" className="min-h-screen bg-bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[720px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <img src="/logo-64.png" alt="WW" width={32} height={32} className="rounded" />
            <span className="text-base font-semibold tracking-tight">WinWin Analyzer</span>
          </div>
          <button
            onClick={() => logout()}
            className="text-sm text-text-tertiary cursor-pointer bg-transparent border-none hover:text-text-secondary"
          >
            ออกจากระบบ
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">เลือกเครื่องมือที่ต้องการใช้</h1>
        <p className="text-sm text-text-secondary mb-8">เลือกเครื่องมือตามคอร์สที่เรียน</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={async () => {
                if (!t.ready) return;
                if (hasBusiness) {
                  if (bizTemplate !== t.id) {
                    await updateBusiness({ template: t.id }).catch(() => {});
                  }
                  try { localStorage.setItem('_template', t.id); } catch {}
                  window.location.href = t.id === 'ib' ? '/ib' : '/dashboard';
                } else {
                  window.location.href = `/onboarding?template=${t.id}`;
                }
              }}
              disabled={!t.ready}
              className={`text-left bg-bg-card rounded-2xl p-6 transition-all cursor-pointer anim-fade-up ${
                t.ready
                  ? 'card-hover'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              style={{
                animationDelay: `${0.1 + TEMPLATES.indexOf(t) * 0.1}s`,
                border: `1px solid ${t.borderAccent}`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold tracking-wide"
                  style={{ background: `color-mix(in srgb, ${t.color} 12%, transparent)`, color: t.color }}>
                  {t.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-text-primary">{t.name}</div>
                  {!t.ready && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-wash-warn text-status-warn">
                      เร็วๆ นี้
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed mb-4">{t.desc}</p>

              <div className="space-y-1.5">
                {t.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span style={{ color: t.color }}>●</span>
                    {f}
                  </div>
                ))}
              </div>

              {t.ready && (
                <div className="mt-5 w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center text-white"
                  style={{ background: t.btnBg }}>
                  {hasBusiness && bizTemplate === t.id ? '← เข้าใช้งานต่อ' : hasBusiness ? 'เข้าใช้งาน →' : 'เริ่มใช้งาน →'}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
