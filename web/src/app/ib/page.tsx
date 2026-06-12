'use client';

import { useRouter } from 'next/navigation';
import { useAssessment, getCompletedSessions } from '@/lib/use-assessment';
import { ScoreRing } from '@/components/ui/score-ring';
import { RdSessionProgress } from '@/components/ui/rd-session-progress';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileText, MessageSquare, BarChart3, AlertTriangle, Brain, Heart, Waves, Building2, ClipboardList } from 'lucide-react';

const PILLAR_META: { key: string; label: string; Icon: any }[] = [
  { key: 'mindset', label: 'Mindset', Icon: Brain },
  { key: 'health', label: 'สุขภาพการเงิน', Icon: Heart },
  { key: 'cashflow', label: 'Cash Flow', Icon: Waves },
  { key: 'capacity', label: 'ความสามารถกู้', Icon: Building2 },
  { key: 'bankReadiness', label: 'Bank Readiness', Icon: ClipboardList },
];

const SESSIONS = [
  { num: 1, key: 's1', label: 'Mindset Assessment', href: '/ib/session/1-mindset' },
  { num: 2, key: 's2', label: 'สแกนสุขภาพการเงิน', href: '/ib/session/2-financial' },
  { num: 3, key: 's3', label: 'กระแสเงินสด 4 ชั้น', href: '/ib/session/3-cashflow' },
  { num: 4, key: 's4', label: 'ออกแบบวงเงินกู้', href: '/ib/session/4-loan' },
  { num: 5, key: 's5', label: 'เตรียมแผนยื่นแบงก์', href: '/ib/session/5-plan' },
  { num: 6, key: 's6', label: 'เปรียบเทียบ Deal', href: '/ib/session/6-deal' },
];

export default function IbDashboardPage() {
  const router = useRouter();
  const { assessment, loading } = useAssessment();

  if (loading) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const flags = getCompletedSessions(assessment);
  const completedCount = SESSIONS.filter(s => flags[s.key]).length;
  const scores = assessment?.readinessScores;
  const frs = scores?.compositeFrs ?? 0;
  const frsBand = scores?.frsBand ?? 'ยังไม่พร้อม';
  const nextSession = SESSIONS.find(s => !flags[s.key]);

  const pillarScores = scores ? [
    { key: 'mindset', score: scores.mindsetScore ?? 0 },
    { key: 'health', score: scores.healthScore ?? 0 },
    { key: 'cashflow', score: scores.stabilityScore ?? 0 },
    { key: 'capacity', score: scores.capacityScore ?? 0 },
    { key: 'bankReadiness', score: scores.bankReadinessScore ?? 0 },
  ] : [];

  const radarData = pillarScores.map(p => ({
    subject: PILLAR_META.find(m => m.key === p.key)?.label ?? p.key,
    score: p.score,
    fullMark: 100,
  }));

  const barColor = (s: number) => s >= 75 ? '#22C55E' : s >= 50 ? '#EAB308' : '#EF4444';
  const bandColor = frsBand === 'พร้อมยื่น' ? 'var(--status-good)' : frsBand === 'เกือบพร้อม' ? 'var(--status-warn)' : 'var(--status-bad)';

  const redFlags: string[] = [];
  if (assessment?.s2Health?.redFlags) redFlags.push(...(assessment.s2Health.redFlags as string[]).slice(0, 3));

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-32.png" alt="WW" width={24} height={24} className="rounded" />
            <span className="text-[15px] font-semibold">Business MRI</span>
          </div>
          <span className="text-xs text-text-tertiary">{assessment?.assessment?.title}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Business MRI</h1>
            <p className="text-sm text-text-secondary">ตรวจสุขภาพการเงินและออกแบบวงเงินสินเชื่อ</p>
          </div>
        </div>

        {/* Session Progress */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">ความคืบหน้า</span>
            {nextSession && (
              <button onClick={() => router.push(nextSession.href)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white border-none cursor-pointer">
                ดำเนินการต่อ →
              </button>
            )}
          </div>
          <RdSessionProgress current={nextSession?.num ?? 6} completedFlags={flags} />
        </div>

        {/* FRS Score + Radar + Pillars — 3 column layout */}
        {scores && completedCount > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* FRS Gauge */}
            <div className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center">
              <div className="text-sm font-bold mb-4">Business MRI Score</div>
              <ScoreRing score={frs} size={160} label="" sublabel={frsBand} />
              <div className="text-xs text-text-tertiary mt-3">
                Profile: {scores.frsProfile === 'bank' ? 'Bank View' : 'Learning View'}
              </div>
              <div className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ color: bandColor, background: `color-mix(in srgb, ${bandColor} 12%, transparent)` }}>
                {frsBand}
              </div>
            </div>

            {/* Radar + Pillar bars */}
            <div className="lg:col-span-2 bg-bg-card border border-border rounded-2xl p-5">
              <div className="text-sm font-semibold mb-3">5 Pillar Breakdown</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Radar Chart */}
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Radar dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} />
                  </RadarChart>
                </ResponsiveContainer>

                {/* Bar breakdown */}
                <div className="space-y-3">
                  {pillarScores.map((p) => {
                    const meta = PILLAR_META.find(m => m.key === p.key)!;
                    return (
                      <div key={p.key} className="flex items-center gap-2">
                        <meta.Icon size={14} className="text-text-tertiary shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-text-secondary">{meta.label}</span>
                            <span className="num font-bold">{p.score}</span>
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.score}%`, backgroundColor: barColor(p.score) }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <div className="bg-wash-bad border border-status-bad/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={16} className="text-status-bad shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-status-bad mb-1">Red Flags ที่ต้องแก้ไข:</div>
              {redFlags.map((f, i) => (
                <div key={i} className="text-xs text-status-bad">• {f}</div>
              ))}
            </div>
          </div>
        )}

        {/* No data prompt */}
        {completedCount === 0 && (
          <div className="bg-bg-card border border-border rounded-2xl p-8 text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-accent" />
            </div>
            <div className="text-lg font-bold mb-2">เริ่มต้นประเมินธุรกิจ</div>
            <p className="text-sm text-text-secondary mb-4">ตรวจสุขภาพการเงิน ออกแบบวงเงิน และเตรียมพร้อมยื่นกู้ธนาคาร</p>
            <button onClick={() => router.push('/ib/session/1-mindset')}
              className="px-6 h-11 rounded-xl font-semibold text-sm cursor-pointer border-none gradient-accent">
              เริ่มประเมินเลย
            </button>
          </div>
        )}

        {/* Quick Actions */}
        {completedCount >= 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { Icon: TrendingUp, label: 'ดำเนินการต่อ', href: nextSession?.href ?? '/ib/session/1-mindset' },
              { Icon: FileText, label: 'FRS Report', href: '/ib/report' },
              { Icon: BarChart3, label: 'สรุปความพร้อม', href: '/ib/summary' },
              { Icon: MessageSquare, label: 'Bank Simulation', href: '/ib/bank-sim' },
            ].map((item) => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-bg-card cursor-pointer hover:bg-bg-secondary transition-colors">
                <item.Icon size={24} className="text-accent" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Reports grid */}
        {completedCount >= 2 && (
          <div className="grid grid-cols-2 gap-3">
            <a href="/ib/business-plan" className="bg-bg-card border border-border rounded-xl p-4 no-underline hover:bg-bg-secondary transition-colors">
              <div className="text-xs font-semibold text-text-primary">Business Plan</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">สรุปแผนธุรกิจ</div>
            </a>
            <a href="/ib/deal-comparison" className="bg-bg-card border border-border rounded-xl p-4 no-underline hover:bg-bg-secondary transition-colors">
              <div className="text-xs font-semibold text-text-primary">Deal Comparison</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">เปรียบเทียบดีล</div>
            </a>
          </div>
        )}

        {/* Sessions list */}
        <div className="mt-6 bg-bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-semibold">Sessions ({completedCount}/6)</div>
          </div>
          {SESSIONS.map((session) => {
            const done = flags[session.key];
            return (
              <a key={session.key} href={session.href}
                className="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-bg-secondary transition-colors border-b border-border last:border-b-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-status-good' : 'border-[1.5px] border-border-strong'}`}>
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7l3 3 5-6"/></svg>
                  ) : (
                    <span className="num text-[9px] font-bold text-text-tertiary">{session.num}</span>
                  )}
                </div>
                <span className={`flex-1 text-[13px] font-medium ${done ? 'text-text-secondary' : 'text-text-primary'}`}>{session.label}</span>
                {done ? (
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-md text-status-good bg-wash-good">เสร็จ</span>
                ) : (
                  <span className="text-[11px] text-text-tertiary">ยังไม่ได้ทำ</span>
                )}
              </a>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
