'use client';

import { useState } from 'react';
import { saveSession } from '@/lib/api';
import { toast } from 'sonner';

const SESSION_ORDER = [
  { slug: 's1-check-cash', label: 'S1 เช็คเงินจริง', href: '/s1-check-cash' },
  { slug: 's2-income-statement', label: 'S2 อ่านงบ', href: '/s2-income-statement' },
  { slug: 's2-cashflow', label: 'S2 งบเงินสด 2 ปี', href: '/s2-cashflow' },
  { slug: 's3-cashflow', label: 'S3 Cashflow 4 Layers', href: '/s3-cashflow' },
  { slug: 's4-pricing', label: 'S4 ตั้งราคา', href: '/s4-pricing' },
  { slug: 's4-cm', label: 'S4 CM + จุดคุ้มทุน', href: '/s4-cm' },
  { slug: 's4-real-profit', label: 'S4 Real Profit', href: '/s4-real-profit' },
  { slug: 'expense-map', label: 'S5 Expense Map', href: '/expense-map' },
  { slug: 's6-five-buckets', label: 'S6 ระบบ 5 ช่อง', href: '/s6-five-buckets' },
  { slug: 's7-business-plan', label: 'S7 แผน 1 หน้า', href: '/s7-business-plan' },
];

interface SessionSaveProps {
  sessionType: string;
  getData: () => Record<string, any>;
  month?: string;
  label?: string;
}

export function SessionSave({ sessionType, getData, month, label = 'บันทึกผลการวิเคราะห์' }: SessionSaveProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Find next session
  const currentIdx = SESSION_ORDER.findIndex(s => s.slug === sessionType);
  const nextSession = currentIdx >= 0 && currentIdx < SESSION_ORDER.length - 1 ? SESSION_ORDER[currentIdx + 1] : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession(sessionType, getData(), month);
      toast.success('บันทึกสำเร็จ');
      setSaved(true);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด');
      console.error(err);
    }
    setSaving(false);
  };

  if (saved) {
    return (
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2 justify-center py-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--status-good)" strokeWidth="2.5" strokeLinecap="round"><path d="M4 10l4 4 8-8"/></svg>
          <span className="text-sm font-semibold text-status-good">บันทึกแล้ว</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 h-11 rounded-xl border border-border bg-bg-card text-sm font-semibold cursor-pointer"
          >
            ← กลับ Dashboard
          </button>
          {nextSession && (
            <button
              onClick={() => window.location.href = nextSession.href}
              className="flex-1 h-11 rounded-xl bg-accent text-white text-sm font-semibold cursor-pointer border-none"
            >
              {nextSession.label} →
            </button>
          )}
        </div>

        <button onClick={() => setSaved(false)} className="w-full text-xs text-text-tertiary cursor-pointer bg-transparent border-none py-1">
          แก้ไขแล้วบันทึกใหม่
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="w-full h-12 rounded-xl bg-text-primary text-bg-primary font-semibold cursor-pointer border-none text-sm mt-6 disabled:opacity-50 transition-opacity"
    >
      {saving ? 'กำลังบันทึก...' : label}
    </button>
  );
}
