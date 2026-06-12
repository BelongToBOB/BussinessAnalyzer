'use client';

import { useState, useEffect } from 'react';
import { useAssessment } from '@/lib/use-assessment';
import { rdWinBankAnalyze, rdWinBankLatest } from '@/lib/api';
import { toast } from 'sonner';
import {
  Bot, Loader2, AlertTriangle, CheckCircle2, TrendingUp,
  Building2, FileText, ChevronRight, Eye, Star, ShieldAlert,
  Lightbulb, Target, Clock,
} from 'lucide-react';

interface WinBankAnalysis {
  businessSummary: {
    headline: string;
    overallVerdict: 'STRONG' | 'READY' | 'DEVELOPING' | 'NEEDS_WORK';
    verdictThai: string;
    keyStrengths: string[];
    keyWeaknesses: string[];
    frsScore: number;
    frsBand: string;
    financialSnapshot: { ebitda: string; dscr: string; deRatio: string; recommendedLoan: string };
  };
  actionItems: {
    critical: Array<{ title: string; detail: string; timeline: string; impact: string }>;
    important: Array<{ title: string; detail: string; timeline: string; impact: string }>;
    documents: string[];
    financialFixes: string[];
  };
  bankPerspective: {
    firstImpression: string;
    whatBankLikes: string[];
    whatBankWorries: string[];
    approvalOdds: 'HIGH' | 'MEDIUM' | 'LOW';
    approvalOddsThai: string;
    rmAdvice: string;
    negotiationTips: string[];
    redFlags: string[];
  };
}

const verdictConfig = {
  STRONG: { label: 'แข็งแกร่ง พร้อมกู้', color: 'bg-status-good', Icon: Star },
  READY: { label: 'พร้อมกู้', color: 'bg-accent', Icon: CheckCircle2 },
  DEVELOPING: { label: 'กำลังพัฒนา', color: 'bg-status-warn', Icon: TrendingUp },
  NEEDS_WORK: { label: 'ต้องปรับปรุง', color: 'bg-status-bad', Icon: AlertTriangle },
};

const oddsConfig = {
  HIGH: { label: 'โอกาสสูง', cls: 'text-status-good bg-wash-good border-status-good/20' },
  MEDIUM: { label: 'โอกาสปานกลาง', cls: 'text-status-warn bg-wash-warn border-status-warn/20' },
  LOW: { label: 'โอกาสต่ำ', cls: 'text-status-bad bg-wash-bad border-status-bad/20' },
};

export default function WinBankPage() {
  const { assessmentId, loading } = useAssessment();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analysis, setAnalysis] = useState<WinBankAnalysis | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'bank'>('summary');
  const [loadingCached, setLoadingCached] = useState(true);

  // Load cached analysis on mount
  useEffect(() => {
    if (!assessmentId) return;
    rdWinBankLatest(assessmentId).then((res) => {
      if (res?.analysis?.businessSummary) {
        setAnalysis(res.analysis);
        setGeneratedAt(res.generatedAt);
      }
    }).catch(() => {}).finally(() => setLoadingCached(false));
  }, [assessmentId]);

  const ANALYZE_STEPS = [
    { label: 'กำลังอ่านข้อมูลธุรกิจ...', Icon: FileText },
    { label: 'วิเคราะห์สุขภาพการเงิน...', Icon: TrendingUp },
    { label: 'ประเมินกระแสเงินสดและความสามารถกู้...', Icon: Building2 },
    { label: 'จำลองมุมมอง RM ธนาคาร...', Icon: Eye },
    { label: 'สร้างรายงานและคำแนะนำ...', Icon: Target },
  ];

  const handleAnalyze = async () => {
    if (!assessmentId) return;
    setAnalyzing(true);
    setAnalyzeStep(0);

    // Animate steps while waiting
    const stepInterval = setInterval(() => {
      setAnalyzeStep(prev => prev < ANALYZE_STEPS.length - 1 ? prev + 1 : prev);
    }, 7000);

    try {
      const result = await rdWinBankAnalyze(assessmentId);
      clearInterval(stepInterval);
      if (result?.error) {
        toast.error(result.message || 'วิเคราะห์ไม่สำเร็จ');
      } else if (result?.businessSummary) {
        setAnalysis(result);
        setGeneratedAt(new Date().toISOString());
        setActiveTab('summary');
        toast.success('WinBank วิเคราะห์เสร็จแล้ว!');
      } else {
        toast.error('AI ตอบกลับไม่สมบูรณ์ ลองใหม่อีกครั้ง');
      }
    } catch (e: any) {
      clearInterval(stepInterval);
      toast.error(e.message || 'วิเคราะห์ไม่สำเร็จ');
    }
    setAnalyzing(false);
  };


  if (loading || loadingCached) return <div className="min-h-screen bg-bg-secondary flex items-center justify-center text-text-secondary">กำลังโหลด...</div>;

  const tabs = [
    { id: 'summary', label: 'สรุปธุรกิจ', Icon: Building2 },
    { id: 'actions', label: 'ต้องเตรียม', Icon: Target },
    { id: 'bank', label: 'มุมธนาคาร', Icon: Eye },
  ] as const;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">RM Virtual WinBank</h1>
            <p className="text-xs text-text-secondary">วิเคราะห์ความพร้อม + แนะนำการเตรียมตัว จากมุมมอง RM ธนาคาร</p>
          </div>
        </div>

        {/* Analyze button */}
        {!analysis && (
          <div className="bg-bg-card border border-border rounded-2xl p-8 text-center mb-6">
            {analyzing ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Bot size={24} className="text-accent animate-pulse" />
                </div>
                <p className="font-semibold">WinBank กำลังวิเคราะห์...</p>

                {/* Step progress */}
                <div className="max-w-sm mx-auto space-y-2">
                  {ANALYZE_STEPS.map((step, i) => {
                    const done = i < analyzeStep;
                    const active = i === analyzeStep;
                    return (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500 ${active ? 'bg-accent/10' : done ? 'opacity-50' : 'opacity-20'}`}>
                        {done ? (
                          <CheckCircle2 size={16} className="text-status-good shrink-0" />
                        ) : active ? (
                          <Loader2 size={16} className="text-accent animate-spin shrink-0" />
                        ) : (
                          <step.Icon size={16} className="text-text-tertiary shrink-0" />
                        )}
                        <span className={`text-xs ${active ? 'text-accent font-medium' : 'text-text-secondary'}`}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="max-w-sm mx-auto">
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all duration-1000"
                      style={{ width: `${((analyzeStep + 1) / ANALYZE_STEPS.length) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-text-tertiary text-center mt-1">
                    ใช้เวลาประมาณ 30-45 วินาที
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Bot size={32} className="text-accent" />
                </div>
                <h3 className="font-semibold">WinBank พร้อมวิเคราะห์ธุรกิจของคุณ</h3>
                <p className="text-sm text-text-secondary max-w-md mx-auto">กดปุ่มด้านล่างเพื่อรับการวิเคราะห์เชิงลึกจากมุมมอง RM ธนาคาร</p>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  {[{ Icon: Building2, label: 'สรุปธุรกิจ' }, { Icon: Target, label: 'ข้อที่ต้องเตรียม' }, { Icon: Eye, label: 'มุมมองธนาคาร' }].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-xl bg-bg-secondary">
                      <item.Icon size={20} className="mx-auto mb-1 text-text-tertiary" />
                      <p className="text-[10px] text-text-tertiary">{item.label}</p>
                    </div>
                  ))}
                </div>
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="px-6 h-11 rounded-xl font-semibold text-sm cursor-pointer border-none gradient-accent flex items-center gap-2 mx-auto">
                  <Bot size={16} /> วิเคราะห์กับ WinBank
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analysis Result */}
        {analysis && (
          <div className="space-y-4">
            {/* Verdict Banner */}
            {(() => {
              const v = verdictConfig[analysis.businessSummary.overallVerdict] ?? verdictConfig.NEEDS_WORK;
              return (
                <div className={`rounded-2xl p-4 text-white flex items-center gap-3 ${v.color}`}>
                  <v.Icon size={24} className="shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold text-lg">{v.label}</div>
                    <div className="text-sm opacity-90">{analysis.businessSummary.headline}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{analysis.businessSummary.frsScore}</div>
                    <div className="text-[10px] opacity-80">MRI Score</div>
                  </div>
                </div>
              );
            })()}

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-bg-card border border-border rounded-xl">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer border-none ${
                    activeTab === tab.id ? 'bg-bg-secondary shadow-sm text-text-primary' : 'bg-transparent text-text-tertiary hover:text-text-secondary'
                  }`}>
                  <tab.Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab: Summary */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary italic border-l-2 border-accent/40 pl-3">{analysis.businessSummary.verdictThai}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'EBITDA', value: analysis.businessSummary.financialSnapshot.ebitda },
                    { label: 'DSCR', value: analysis.businessSummary.financialSnapshot.dscr },
                    { label: 'D/E Ratio', value: analysis.businessSummary.financialSnapshot.deRatio },
                    { label: 'วงเงินแนะนำ', value: analysis.businessSummary.financialSnapshot.recommendedLoan },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-xl bg-bg-card border border-border">
                      <div className="text-[10px] text-text-tertiary mb-1">{item.label}</div>
                      <div className="text-xs font-bold">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-card border border-status-good/20 rounded-2xl p-4">
                    <div className="text-xs font-bold text-status-good flex items-center gap-1.5 mb-3"><CheckCircle2 size={14} /> จุดแข็ง</div>
                    {analysis.businessSummary.keyStrengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs mb-1.5"><ChevronRight size={12} className="text-status-good mt-0.5 shrink-0" />{s}</div>
                    ))}
                  </div>
                  <div className="bg-bg-card border border-status-bad/20 rounded-2xl p-4">
                    <div className="text-xs font-bold text-status-bad flex items-center gap-1.5 mb-3"><AlertTriangle size={14} /> จุดอ่อน</div>
                    {analysis.businessSummary.keyWeaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs mb-1.5"><ChevronRight size={12} className="text-status-bad mt-0.5 shrink-0" />{w}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Actions */}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                {analysis.actionItems.critical.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-status-bad flex items-center gap-1.5 mb-3"><AlertTriangle size={14} /> เร่งด่วน — ต้องทำก่อน</div>
                    {analysis.actionItems.critical.map((item, i) => (
                      <div key={i} className="bg-wash-bad border border-status-bad/10 rounded-xl p-4 mb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-status-bad/10 text-status-bad flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                          <div>
                            <div className="text-sm font-semibold">{item.title}</div>
                            <div className="text-xs text-text-secondary mt-0.5">{item.detail}</div>
                            <div className="flex gap-3 text-[10px] mt-2 text-text-tertiary">
                              <span className="flex items-center gap-1"><Clock size={10} /> {item.timeline}</span>
                              <span>ผลกระทบ: {item.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {analysis.actionItems.important.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-status-warn flex items-center gap-1.5 mb-3"><Target size={14} /> สำคัญ — ควรทำ</div>
                    {analysis.actionItems.important.map((item, i) => (
                      <div key={i} className="bg-wash-warn border border-status-warn/10 rounded-xl p-4 mb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-status-warn/10 text-status-warn flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                          <div>
                            <div className="text-sm font-semibold">{item.title}</div>
                            <div className="text-xs text-text-secondary mt-0.5">{item.detail}</div>
                            <div className="text-[10px] mt-2 text-text-tertiary flex items-center gap-1"><Clock size={10} /> {item.timeline}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {analysis.actionItems.documents.length > 0 && (
                  <div className="bg-bg-card border border-border rounded-2xl p-4">
                    <div className="text-xs font-bold flex items-center gap-1.5 mb-3"><FileText size={14} className="text-accent" /> เอกสารที่ต้องเตรียม</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {analysis.actionItems.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-bg-secondary"><CheckCircle2 size={12} className="text-text-tertiary shrink-0" /> {doc}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Bank */}
            {activeTab === 'bank' && (
              <div className="space-y-4">
                {(() => {
                  const odds = oddsConfig[analysis.bankPerspective.approvalOdds] ?? oddsConfig.LOW;
                  return (
                    <div className={`rounded-xl border p-4 ${odds.cls}`}>
                      <div className="flex items-center gap-3">
                        <ShieldAlert size={18} className="shrink-0" />
                        <div>
                          <div className="font-bold text-sm">โอกาสผ่านการอนุมัติ: {odds.label}</div>
                          <div className="text-xs mt-0.5">{analysis.bankPerspective.approvalOddsThai}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
                  <div className="text-xs font-bold text-accent flex items-center gap-1.5 mb-2"><Eye size={14} /> RM คิดอะไรเมื่อเห็นไฟล์นี้</div>
                  <p className="text-sm italic text-text-secondary">"{analysis.bankPerspective.firstImpression}"</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-card border border-status-good/20 rounded-2xl p-4">
                    <div className="text-xs font-bold text-status-good mb-3">ธนาคารชอบ</div>
                    {analysis.bankPerspective.whatBankLikes.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs mb-1.5"><CheckCircle2 size={12} className="text-status-good mt-0.5 shrink-0" /> {item}</div>
                    ))}
                  </div>
                  <div className="bg-bg-card border border-status-bad/20 rounded-2xl p-4">
                    <div className="text-xs font-bold text-status-bad mb-3">ธนาคารกังวล</div>
                    {analysis.bankPerspective.whatBankWorries.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs mb-1.5"><AlertTriangle size={12} className="text-status-bad mt-0.5 shrink-0" /> {item}</div>
                    ))}
                  </div>
                </div>
                <div className="bg-bg-card border border-accent/20 rounded-2xl p-4">
                  <div className="text-xs font-bold flex items-center gap-1.5 mb-2"><Lightbulb size={14} className="text-accent" /> คำแนะนำจาก RM</div>
                  <p className="text-sm leading-relaxed text-text-secondary">{analysis.bankPerspective.rmAdvice}</p>
                </div>
                {analysis.bankPerspective.negotiationTips.length > 0 && (
                  <div className="bg-bg-card border border-border rounded-2xl p-4">
                    <div className="text-xs font-bold mb-3">เทคนิคต่อรองกับธนาคาร</div>
                    {analysis.bankPerspective.negotiationTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* Timestamp + Actions */}
            <div className="text-center space-y-2">
              {generatedAt && (
                <div className="text-[10px] text-text-tertiary">
                  วิเคราะห์เมื่อ {new Date(generatedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              )}
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => window.print()}
                  className="text-xs text-text-tertiary hover:text-accent cursor-pointer bg-transparent border-none underline">
                  บันทึก PDF
                </button>
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="text-xs text-text-tertiary hover:text-accent cursor-pointer bg-transparent border-none underline">
                  {analyzing ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ใหม่ (ใช้ AI token)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
