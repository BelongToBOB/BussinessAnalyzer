'use client';

interface BusinessScoreProps {
  score: number;
  stepsCompleted: number;
  totalSteps: number;
}

export function BusinessScoreBar({ score, stepsCompleted, totalSteps }: BusinessScoreProps) {
  const gradient = score >= 70 ? 'linear-gradient(135deg, var(--status-good), #22C55E)' : score >= 40 ? 'linear-gradient(135deg, var(--status-warn), #EAB308)' : score > 0 ? 'linear-gradient(135deg, var(--status-bad), #EF4444)' : 'transparent';
  const textColor = score >= 70 ? 'text-status-good' : score >= 40 ? 'text-status-warn' : score > 0 ? 'text-status-bad' : 'text-text-tertiary';

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden anim-fade-up">
      {/* Score header with gradient strip */}
      {score > 0 && <div className="h-1.5" style={{ background: gradient }} />}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-semibold tracking-wide uppercase text-text-secondary">
            Business Score
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < stepsCompleted ? 'bg-accent' : 'bg-border'}`} />
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className={`num text-5xl font-bold tracking-tight num-animate ${textColor}`}>
            {score}
          </div>
          <div className="text-lg text-text-tertiary mb-1.5 font-medium">/100</div>
        </div>
        <div className="mt-4 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.18)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(score, 2)}%`, background: gradient }}
          />
        </div>
        <div className="mt-3 text-xs text-text-secondary">
          {score === 0 ? 'เริ่มสแกนเพื่อเห็นคะแนน — ทำ Step แรกเลย' : score >= 70 ? 'ธุรกิจพร้อม — แบงก์อ่านได้ชัด' : score >= 40 ? 'กำลังปรับตัว — ทำต่อเพื่อเพิ่มคะแนน' : 'ต้องปรับฐาน — ดูคำแนะนำแต่ละ Step'}
        </div>
      </div>
    </div>
  );
}
