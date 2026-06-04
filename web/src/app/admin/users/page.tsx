'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface UserItem {
  userId: string;
  businessId: string;
  businessName: string;
  verdictLevel: string;
  netProfit: number | null;
  runway: number | null;
  grossMarginPct: number | null;
  opexPct: number | null;
  lastActiveDate: string | null;
  toolsCompleted: number;
  alerts: { level: string; message: string }[];
}

function money(n: number | null | undefined): string {
  if (n == null) return '-';
  return Math.round(n).toLocaleString('en-US');
}

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  critical: { color: 'var(--status-bad)', label: 'วิกฤต' },
  warning: { color: 'var(--status-warn)', label: 'ระวัง' },
  ok: { color: 'var(--status-good)', label: 'ดี' },
  inactive: { color: 'var(--status-empty)', label: 'ไม่ใช้งาน' },
};

const FILTER_TABS = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'critical', label: '\uD83D\uDD34 วิกฤต' },
  { key: 'warn', label: '\uD83D\uDFE1 ระวัง' },
  { key: 'good', label: '\uD83D\uDFE2 ดี' },
  { key: 'inactive', label: '\uD83D\uDCF5 ไม่ใช้งาน' },
];

const SORT_OPTIONS = [
  { key: 'runway', label: 'Cash Runway (น้อย\u2192มาก)' },
  { key: 'netprofit', label: 'Net Profit' },
  { key: 'lastactive', label: 'กรอกล่าสุด' },
  { key: '', label: 'สถานะ' },
];

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return 'ไม่เคย';
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (d === 0) return 'วันนี้';
  return `${d} วัน`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (sort) params.set('sort', sort);

    fetch(`${API_URL}/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter, sort]);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.businessName.toLowerCase().includes(q));
  }, [users, search]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">ผู้ใช้ทั้งหมด</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อธุรกิจ..."
          className="w-full max-w-md px-4 py-2.5 bg-bg-card border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
              statusFilter === tab.key
                ? 'bg-text-primary text-bg-primary border-transparent'
                : 'bg-bg-card border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-text-secondary">เรียง:</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-sm text-text-secondary py-10 text-center">กำลังโหลด...</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-sm text-text-secondary py-10 text-center">ไม่พบผู้ใช้</div>
      )}

      {/* User list */}
      {!loading && filtered.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {filtered.map((u, i) => {
            const dot = STATUS_DOT[u.verdictLevel] ?? STATUS_DOT.inactive;
            return (
              <Link
                key={u.userId}
                href={`/admin/users/${u.userId}`}
                className={`flex items-center gap-3 px-4 py-3 no-underline hover:bg-bg-secondary transition-colors ${
                  i < filtered.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* Status dot */}
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: dot.color }} />

                {/* Business name & status */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">{u.businessName}</div>
                  <div className="text-[11px] text-text-tertiary">
                    {dot.label} | กรอกล่าสุด {daysAgo(u.lastActiveDate)}
                  </div>
                </div>

                {/* Key metrics */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-text-tertiary">NP</div>
                    <div className={`num text-xs font-semibold ${u.netProfit != null && u.netProfit < 0 ? 'text-status-bad' : 'text-text-primary'}`}>
                      {u.netProfit != null ? money(u.netProfit) : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-tertiary">Runway</div>
                    <div className={`num text-xs font-semibold ${u.runway != null && u.runway < 3 ? 'text-status-bad' : 'text-text-primary'}`}>
                      {u.runway != null ? `${u.runway.toFixed(1)} เดือน` : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-tertiary">GM</div>
                    <div className="num text-xs font-semibold text-text-primary">
                      {u.grossMarginPct != null ? `${(u.grossMarginPct * 100).toFixed(0)}%` : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-tertiary">เครื่องมือ</div>
                    <div className="num text-xs font-semibold text-text-primary">{u.toolsCompleted}/10</div>
                  </div>
                </div>

                {/* Arrow */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
