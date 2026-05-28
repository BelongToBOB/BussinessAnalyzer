'use client';

import { useState } from 'react';
import { saveSession } from '@/lib/api';
import { toast } from 'sonner';

interface SessionSaveProps {
  sessionType: string;
  getData: () => Record<string, any>;
  month?: string;
  label?: string;
}

export function SessionSave({ sessionType, getData, month, label = 'บันทึกผลการวิเคราะห์' }: SessionSaveProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession(sessionType, getData(), month);
      toast.success('บันทึกสำเร็จ');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด');
      console.error(err);
    }
    setSaving(false);
  };

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
