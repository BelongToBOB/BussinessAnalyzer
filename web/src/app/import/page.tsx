'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseCSV, ImportedEntry } from '@/lib/csv-import';
import { upsertEntry } from '@/lib/api';
import { money } from '@/lib/format';
import { toast } from 'sonner';

const THAI_MONTHS = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function fmtMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${THAI_MONTHS[m]} ${y + 543}`;
}

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<ImportedEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [parsed, setParsed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const handleFile = async (file: File) => {
    const result = await parseCSV(file);
    setEntries(result.entries);
    setErrors(result.errors);
    setParsed(true);
    setImportResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        const data: Record<string, unknown> = {};
        if (entry.grossSales != null) data.grossSales = entry.grossSales;
        if (entry.creditSales != null) data.creditSales = entry.creditSales;
        if (entry.cogs != null) data.cogs = entry.cogs;
        if (entry.otherExpenses != null) data.otherExpenses = entry.otherExpenses;
        if (entry.cashIn != null) data.cashIn = entry.cashIn;
        if (entry.arBalance != null) data.arBalance = entry.arBalance;
        if (entry.apBalance != null) data.apBalance = entry.apBalance;
        if (entry.cashOnHand != null) data.cashOnHand = entry.cashOnHand;
        if (entry.leakNote != null) data.leakNote = entry.leakNote;

        await upsertEntry(entry.month, data);
        success++;
      } catch {
        failed++;
      }
    }

    setImportResult({ success, failed });
    setImporting(false);
    if (success > 0) {
      toast.success(`นำเข้าสำเร็จ ${success} เดือน`);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => window.location.href = '/dashboard'} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </button>
          <span className="text-[15px] font-semibold">Import ข้อมูลจากไฟล์</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">นำเข้าข้อมูลจาก CSV / Excel</h1>
        <p className="text-sm text-text-secondary mb-6">
          Export จาก Excel เป็น CSV แล้วอัปโหลดที่นี่ — ระบบจะ map column อัตโนมัติ
        </p>

        {/* Upload area */}
        {!parsed && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-accent hover:bg-wash-info transition-colors"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-4">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div className="text-base font-semibold mb-1">ลากไฟล์มาวางที่นี่</div>
              <div className="text-sm text-text-secondary">หรือคลิกเพื่อเลือกไฟล์ CSV</div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.tsv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {/* Template info */}
            <div className="mt-6 bg-bg-card border border-border rounded-2xl p-4">
              <div className="text-sm font-semibold mb-2">Column ที่รองรับ</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs text-text-secondary">
                <span>เดือน / month</span>
                <span>ยอดขายรวม / grossSales</span>
                <span>ขายเชื่อ / creditSales</span>
                <span>ต้นทุน / cogs</span>
                <span>ค่าใช้จ่าย / otherExpenses</span>
                <span>เงินเข้า / cashIn</span>
                <span>ลูกหนี้ / arBalance</span>
                <span>เจ้าหนี้ / apBalance</span>
                <span>เงินสด / cashOnHand</span>
                <span>จุดรั่ว / leakNote</span>
              </div>
              <div className="text-[11px] text-text-tertiary mt-2">
                ใช้ชื่อ Thai หรือ English ก็ได้ · format เดือน: 2026-05, 05/2026, พฤษภาคม 2569
              </div>
            </div>
          </>
        )}

        {/* Preview */}
        {parsed && !importResult && (
          <>
            {errors.length > 0 && (
              <div className="bg-wash-warn rounded-xl p-3 mb-4">
                <div className="text-sm font-semibold text-status-warn mb-1">พบปัญหา {errors.length} รายการ</div>
                {errors.map((e, i) => <div key={i} className="text-xs text-text-secondary">{e}</div>)}
              </div>
            )}

            {entries.length > 0 && (
              <>
                <div className="text-sm font-semibold mb-2">ตรวจสอบข้อมูล {entries.length} เดือน</div>
                <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-bg-secondary">
                          <th className="px-3 py-2 text-left font-semibold text-text-secondary">เดือน</th>
                          <th className="px-3 py-2 text-right font-semibold text-text-secondary">ยอดขาย</th>
                          <th className="px-3 py-2 text-right font-semibold text-text-secondary">ต้นทุน</th>
                          <th className="px-3 py-2 text-right font-semibold text-text-secondary">ค่าใช้จ่าย</th>
                          <th className="px-3 py-2 text-right font-semibold text-text-secondary">เงินสด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((e, i) => (
                          <tr key={i} className="border-b border-border last:border-b-0">
                            <td className="px-3 py-2 font-semibold">{fmtMonth(e.month)}</td>
                            <td className="px-3 py-2 text-right num">{e.grossSales != null ? money(e.grossSales) : '-'}</td>
                            <td className="px-3 py-2 text-right num">{e.cogs != null ? money(e.cogs) : '-'}</td>
                            <td className="px-3 py-2 text-right num">{e.otherExpenses != null ? money(e.otherExpenses) : '-'}</td>
                            <td className="px-3 py-2 text-right num">{e.cashOnHand != null ? money(e.cashOnHand) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setParsed(false); setEntries([]); setErrors([]); }}
                    className="flex-1 h-11 rounded-xl border border-border bg-bg-card text-sm font-semibold cursor-pointer">
                    เลือกไฟล์ใหม่
                  </button>
                  <button onClick={handleImport} disabled={importing}
                    className="flex-1 h-11 rounded-xl bg-text-primary text-bg-primary text-sm font-semibold cursor-pointer border-none disabled:opacity-50">
                    {importing ? 'กำลังนำเข้า...' : `นำเข้า ${entries.length} เดือน`}
                  </button>
                </div>
              </>
            )}

            {entries.length === 0 && errors.length > 0 && (
              <button onClick={() => { setParsed(false); setErrors([]); }}
                className="w-full h-11 rounded-xl border border-border bg-bg-card text-sm font-semibold cursor-pointer mt-4">
                ลองใหม่
              </button>
            )}
          </>
        )}

        {/* Result */}
        {importResult && (
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full inline-flex items-center justify-center mb-4 ${importResult.failed === 0 ? 'bg-wash-good' : 'bg-wash-warn'}`}>
              {importResult.failed === 0 ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--status-good)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
              ) : (
                <span className="text-2xl">⚠️</span>
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">
              นำเข้าสำเร็จ {importResult.success} เดือน
              {importResult.failed > 0 && ` (ผิดพลาด ${importResult.failed})`}
            </h2>
            <p className="text-sm text-text-secondary mb-6">ข้อมูลถูกเพิ่มเข้า Dashboard แล้ว</p>
            <button onClick={() => window.location.href = '/dashboard'}
              className="h-11 px-8 rounded-xl bg-text-primary text-bg-primary text-sm font-semibold cursor-pointer border-none">
              ไปที่ Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
