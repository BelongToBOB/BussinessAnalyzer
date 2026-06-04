'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface OverviewData {
  totalUsers: number;
  activeThisMonth: number;
  inactiveOver2Months: number;
  criticalCount: number;
  healthDistribution: { good: number; warn: number; critical: number; inactive: number };
  mostUsedTools: { tool: string; count: number }[];
}

interface AlertUser {
  userId: string;
  businessId: string;
  businessName: string;
  verdictLevel: string;
  alerts: { level: string; message: string }[];
  netProfit: number | null;
  runway: number | null;
  lastActiveDate: string | null;
}

function money(n: number | null | undefined): string {
  if (n == null) return '-';
  return Math.round(n).toLocaleString('en-US');
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
      <div className="text-xs text-text-secondary font-medium">{label}</div>
      <div className={`num text-3xl font-bold ${accent ?? 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

function HealthBar({ good, warn, critical, inactive }: { good: number; warn: number; critical: number; inactive: number }) {
  const total = good + warn + critical + inactive;
  if (total === 0) return null;
  const segments = [
    { count: good, color: 'var(--status-good)', label: 'ดี' },
    { count: warn, color: 'var(--status-warn)', label: 'ระวัง' },
    { count: critical, color: 'var(--status-bad)', label: 'วิกฤต' },
    { count: inactive, color: 'var(--status-empty)', label: 'ไม่ใช้งาน' },
  ];

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4">
      <div className="text-xs text-text-secondary font-medium mb-3">สุขภาพธุรกิจรวม</div>
      <div className="h-6 rounded-full overflow-hidden flex">
        {segments.map((s, i) => (
          <div
            key={i}
            className="h-full flex items-center justify-center transition-all"
            style={{ width: `${(s.count / total) * 100}%`, background: s.color, minWidth: s.count > 0 ? 4 : 0 }}
          >
            {s.count > 0 && (s.count / total) >= 0.1 && (
              <span className="text-white text-[10px] font-bold">{s.count}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 flex-wrap">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] text-text-secondary">{s.label} {s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [alerts, setAlerts] = useState<AlertUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/admin/overview`).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/alerts`).then((r) => r.json()),
    ]).then(([ov, al]) => {
      setOverview(ov);
      setAlerts(al);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const copyOverviewSummary = async () => {
    if (!overview) return;
    const hd = overview.healthDistribution;
    const criticalAlerts = alerts.filter((a) => a.alerts.some((al) => al.level === 'critical'));
    const lines = [
      '\uD83D\uDCCA สรุปภาพรวม WinWin Analyzer',
      `วันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      '',
      `ผู้ใช้ทั้งหมด: ${overview.totalUsers} ราย`,
      `ใช้งานเดือนนี้: ${overview.activeThisMonth} ราย`,
      `ไม่ใช้งาน >2 เดือน: ${overview.inactiveOver2Months} ราย`,
      '',
      `สุขภาพ: \uD83D\uDFE2 ${hd.good} | \uD83D\uDFE1 ${hd.warn} | \uD83D\uDD34 ${hd.critical} | \uD83D\uDCF5 ${hd.inactive}`,
    ];
    if (criticalAlerts.length > 0) {
      lines.push('');
      lines.push('\uD83D\uDD34 ต้องดูด่วน:');
      for (const u of criticalAlerts.slice(0, 5)) {
        const reasons = u.alerts.filter((a) => a.level === 'critical').map((a) => a.message).join(', ');
        lines.push(`\u2022 ${u.businessName}: ${reasons}`);
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success('คัดลอกแล้ว');
    } catch {
      toast.error('คัดลอกไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary text-sm">กำลังโหลด...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary text-sm">ไม่สามารถโหลดข้อมูลได้</div>
      </div>
    );
  }

  const hd = overview.healthDistribution;
  const topAlerts = alerts.filter((a) => a.alerts.some((al) => al.level === 'critical')).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ภาพรวมระบบ</h1>
        <button
          onClick={copyOverviewSummary}
          className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold cursor-pointer border-none"
        >
          คัดลอกสรุปภาพรวม
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="ผู้ใช้ทั้งหมด" value={overview.totalUsers} />
        <StatCard label="ใช้งานเดือนนี้" value={overview.activeThisMonth} accent="text-accent" />
        <StatCard label="วิกฤต" value={overview.criticalCount} accent="text-status-bad" />
        <StatCard label="ไม่ใช้งาน >2 เดือน" value={overview.inactiveOver2Months} accent="text-text-tertiary" />
      </div>

      {/* Health bar */}
      <div className="mb-5">
        <HealthBar good={hd.good} warn={hd.warn} critical={hd.critical} inactive={hd.inactive} />
      </div>

      {/* Critical alerts */}
      {topAlerts.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="text-sm font-semibold mb-3 text-status-bad">
            {'\uD83D\uDD34'} ต้องดูด่วน ({topAlerts.length})
          </div>
          <div className="flex flex-col gap-2">
            {topAlerts.map((u) => (
              <Link
                key={u.userId}
                href={`/admin/users/${u.userId}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-wash-bad no-underline hover:opacity-80 transition-opacity"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary">{u.businessName}</div>
                  <div className="text-[11px] text-text-secondary truncate">
                    {u.alerts.filter((a) => a.level === 'critical').map((a) => a.message).join(' | ')}
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  {u.netProfit != null && (
                    <span className={`num text-xs font-semibold ${u.netProfit < 0 ? 'text-status-bad' : 'text-status-good'}`}>
                      NP {money(u.netProfit)}
                    </span>
                  )}
                  {u.runway != null && (
                    <span className={`num text-[11px] ${u.runway < 3 ? 'text-status-bad' : 'text-text-secondary'}`}>
                      RW {u.runway.toFixed(1)} เดือน
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Most used tools */}
      {overview.mostUsedTools.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <div className="text-xs text-text-secondary font-medium mb-3">เครื่องมือที่ใช้บ่อย</div>
          <div className="flex flex-col gap-1.5">
            {overview.mostUsedTools.slice(0, 5).map((t) => (
              <div key={t.tool} className="flex items-center justify-between text-sm">
                <span className="text-text-primary">{t.tool}</span>
                <span className="num text-text-secondary font-semibold">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
