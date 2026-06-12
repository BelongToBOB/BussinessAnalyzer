'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, saveSession } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, Target, MessageSquare, FolderCheck, Rocket, Check, FileText, Download } from 'lucide-react';
import { IbStepProgress } from '@/components/ui/ib-step-progress';

const STORY_PROMPTS = [
  { q: 'ธุรกิจของคุณทำอะไร', hint: 'เช่น ขายอาหารสำเร็จรูป B2B ให้โรงแรม 50 แห่ง' },
  { q: 'กู้เงินไปทำอะไร', hint: 'เช่น ขยายโรงงานผลิตเพื่อรองรับ order ใหม่' },
  { q: 'จะคืนเงินยังไง', hint: 'เช่น กำไรจาก order ใหม่ 500K/เดือน ผ่อนได้ 200K' },
  { q: 'ความเสี่ยงคืออะไร', hint: 'เช่น ลูกค้าหลักยกเลิก — มีแผน B คือหาลูกค้า retail' },
  { q: 'ทำไมธนาคารควรให้กู้', hint: 'เช่น DSCR 1.5 มีหลักประกัน 120% ธุรกิจ 8 ปี' },
];

const BANK_PACK = [
  'สำเนาบัตรประชาชน', 'ทะเบียนบ้าน', 'หนังสือรับรองบริษัท', 'งบการเงิน 3 ปี',
  'Bank Statement 6 เดือน', 'สำเนาโฉนดหลักประกัน', 'แผนธุรกิจ', 'ใบเสนอราคา/สัญญา',
];

export default function IbStep7Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState(0); // 0-3 for 4 sections
  const [useOfFund, setUseOfFund] = useState('');
  const [loanStory, setLoanStory] = useState<string[]>(Array(5).fill(''));
  const [bankPack, setBankPack] = useState<boolean[]>(Array(BANK_PACK.length).fill(false));
  const [mondayPlan, setMondayPlan] = useState<string[]>(['', '', '']);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    getSession('ib-loan-action').then((res: any) => {
      const d = res?.data;
      if (!d) return;
      if (d.useOfFund) setUseOfFund(d.useOfFund);
      if (d.loanStory) setLoanStory(d.loanStory);
      if (d.bankPack) setBankPack(d.bankPack);
      if (d.mondayPlan) setMondayPlan(d.mondayPlan);
    }).catch(() => {});
  }, []);

  const storyFilled = loanStory.filter(s => s.length > 5).length;
  const packChecked = bankPack.filter(Boolean).length;
  const planFilled = mondayPlan.filter(s => s.length > 5).length;
  const fundFilled = useOfFund.length > 10;
  const sections = [fundFilled, storyFilled >= 3, packChecked >= 4, planFilled >= 2];
  const totalDone = sections.filter(Boolean).length;
  const pct = Math.round(totalDone / 4 * 100);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession('ib-loan-action', { useOfFund, loanStory, bankPack, mondayPlan });
      toast.success('บันทึกสำเร็จ');
      setSaved(true);
    } catch (e: any) { toast.error(e.message || 'บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  const TABS = [
    { label: 'วัตถุประสงค์', Icon: Target, color: '#3B82F6', done: fundFilled },
    { label: 'เรื่องเล่า', Icon: MessageSquare, color: '#A855F7', done: storyFilled >= 3 },
    { label: 'เอกสาร', Icon: FolderCheck, color: '#F59E0B', done: packChecked >= 4 },
    { label: 'แผนปฏิบัติ', Icon: Rocket, color: '#22C55E', done: planFilled >= 2 },
  ];

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary"><ChevronLeft size={20} strokeWidth={2} /></button>
          <span className="text-[15px] font-semibold">Step 7 · เตรียมยื่นกู้</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-4 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Step 7 of 7 — สุดท้าย</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">สร้างเอกสารเตรียมกู้</h1>
          <p className="text-sm text-text-secondary mt-1">กรอก 4 ส่วน → ได้เอกสารพร้อมยื่นธนาคาร</p>
        </div>

        {/* Step progress */}
        <IbStepProgress current={7} />

        {/* Document completion meter */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-5 anim-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, var(--accent) 10%, transparent)` }}>
              <FileText size={22} strokeWidth={1.5} color="var(--accent)" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">เอกสารเตรียมกู้</span>
                <span className="num text-sm font-bold" style={{ color: pct === 100 ? 'var(--status-good)' : 'var(--accent)' }}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--status-good)' : 'var(--accent)' }} />
              </div>
            </div>
          </div>
          {pct === 100 && (
            <div className="mt-3 text-xs text-status-good font-semibold">เอกสารครบ — พร้อมนัดธนาคาร</div>
          )}
        </div>

        {/* Section tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl cursor-pointer transition-all border text-center ${
                tab === i ? 'border-accent bg-accent-soft' : t.done ? 'border-status-good/30 bg-wash-good' : 'border-border bg-bg-card'
              }`}>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${t.done && tab !== i ? 'bg-status-good/15' : ''}`}>
                {t.done && tab !== i
                  ? <Check size={14} strokeWidth={2.5} color="var(--status-good)" />
                  : <t.Icon size={14} strokeWidth={1.5} color={tab === i ? 'var(--accent)' : t.color} />}
              </div>
              <span className={`text-[10px] font-semibold ${tab === i ? 'text-accent' : t.done ? 'text-status-good' : 'text-text-tertiary'}`}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="anim-fade-up">
          {/* Tab 0: Use of Fund */}
          {tab === 0 && (
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              <div className="text-sm font-semibold mb-1">กู้ทำอะไร — เขียนให้ธนาคารเข้าใจใน 3 บรรทัด</div>
              <div className="text-xs text-text-tertiary mb-3">กู้ทำอะไร / กี่บาท / เมื่อไหร่ / เงินกลับมายังไง</div>
              <textarea value={useOfFund} onChange={(e) => { setUseOfFund(e.target.value); setSaved(false); }}
                placeholder="เช่น กู้ 5 ล้านเพื่อขยายโรงงาน เปิดไลน์ผลิตใหม่ภายใน Q3 คาดว่ารายได้เพิ่ม 2M/เดือน" rows={4}
                className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text-primary outline-none focus:border-accent font-thai resize-none" />
              {fundFilled && (
                <div className="mt-3 p-3 rounded-xl bg-wash-good text-xs text-status-good font-medium">
                  ส่วนนี้ครบแล้ว — ธนาคารจะเห็นว่าคุณรู้ชัดว่าเอาเงินไปทำอะไร
                </div>
              )}
            </div>
          )}

          {/* Tab 1: Loan Story */}
          {tab === 1 && (
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              <div className="text-sm font-semibold mb-1">เรื่องเล่า 5 ข้อ — ตอบคำถามที่แบงก์จะถาม</div>
              <div className="text-xs text-text-tertiary mb-4">เขียนสั้นๆ 1-2 ประโยค แบงก์อ่านแล้วเข้าใจทันที</div>
              <div className="space-y-4">
                {STORY_PROMPTS.map((p, i) => {
                  const filled = loanStory[i].length > 5;
                  return (
                    <div key={i} className={`p-3 rounded-xl border transition-colors ${filled ? 'border-status-good/30 bg-wash-good/30' : 'border-border'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${filled ? 'bg-status-good text-white' : 'bg-bg-secondary text-text-tertiary'}`}>
                          {filled ? <Check size={12} strokeWidth={3} /> : i + 1}
                        </div>
                        <span className="text-xs font-semibold">{p.q}</span>
                      </div>
                      <textarea value={loanStory[i]} onChange={(e) => { setLoanStory(old => old.map((s, idx) => idx === i ? e.target.value : s)); setSaved(false); }}
                        placeholder={p.hint} rows={2}
                        className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent font-thai resize-none" />
                    </div>
                  );
                })}
              </div>
              {storyFilled >= 3 && (
                <div className="mt-3 p-3 rounded-xl bg-wash-good text-xs text-status-good font-medium">
                  เรื่องเล่าครบ {storyFilled}/5 ข้อ — เพียงพอสำหรับนำเสนอแบงก์
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Bank Pack */}
          {tab === 2 && (
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 pb-2">
                <div className="text-sm font-semibold mb-1">เช็คลิสต์เอกสาร — ติ๊กที่เตรียมแล้ว</div>
                <div className="text-xs text-text-tertiary">เตรียมครบยิ่งดี — แบงก์ประทับใจความพร้อม</div>
                <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${packChecked / BANK_PACK.length * 100}%`, background: packChecked === BANK_PACK.length ? 'var(--status-good)' : 'var(--accent)' }} />
                </div>
                <div className="text-[10px] text-text-tertiary mt-1 text-right">{packChecked}/{BANK_PACK.length} พร้อม</div>
              </div>
              {BANK_PACK.map((doc, i) => (
                <button key={i} onClick={() => { setBankPack(old => old.map((v, idx) => idx === i ? !v : v)); setSaved(false); }}
                  className={`flex items-center gap-3 w-full py-3 px-4 cursor-pointer bg-transparent border-none text-left transition-colors hover:bg-bg-secondary ${i > 0 ? 'border-t border-border' : ''}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${bankPack[i] ? 'bg-status-good scale-110' : 'border border-border-strong'}`}>
                    {bankPack[i] && <Check size={12} strokeWidth={3} color="#fff" />}
                  </div>
                  <span className={`text-sm transition-colors ${bankPack[i] ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>{doc}</span>
                </button>
              ))}
              {packChecked === BANK_PACK.length && (
                <div className="p-4 pt-2 border-t border-border">
                  <div className="p-3 rounded-xl bg-wash-good text-xs text-status-good font-medium">
                    เอกสารครบทุกรายการ
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Monday Plan */}
          {tab === 3 && (
            <div className="bg-bg-card border border-border rounded-2xl p-5">
              <div className="text-sm font-semibold mb-1">3 สิ่งที่ทำวันจันทร์นี้</div>
              <div className="text-xs text-text-tertiary mb-4">เขียนแล้วลงมือทำได้เลย — ยิ่งชัดยิ่งดี</div>
              <div className="space-y-3">
                {mondayPlan.map((p, i) => {
                  const filled = p.length > 5;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${filled ? 'border-status-good/30 bg-wash-good/30' : 'border-border'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${filled ? 'bg-status-good' : 'bg-bg-secondary'}`}>
                        {filled
                          ? <Check size={16} strokeWidth={2.5} color="#fff" />
                          : <span className="num text-sm font-bold text-text-tertiary">{i + 1}</span>}
                      </div>
                      <input value={p} onChange={(e) => { setMondayPlan(old => old.map((v, idx) => idx === i ? e.target.value : v)); setSaved(false); }}
                        placeholder={['เช่น นัดธนาคาร', 'เช่น เตรียมงบการเงิน', 'เช่น เขียนแผนธุรกิจ'][i]}
                        className="flex-1 h-10 rounded-xl border border-border px-3 text-sm bg-bg-card text-text-primary outline-none focus:border-accent font-thai" />
                    </div>
                  );
                })}
              </div>
              {planFilled >= 2 && (
                <div className="mt-3 p-3 rounded-xl bg-wash-good text-xs text-status-good font-medium">
                  แผนพร้อม — ลงมือทำวันจันทร์นี้เลย
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document Preview */}
        {totalDone >= 2 && (
          <button onClick={() => setShowPreview(!showPreview)}
            className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-bg-card cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary transition">
            <FileText size={16} strokeWidth={1.5} />
            {showPreview ? 'ซ่อนตัวอย่างเอกสาร' : 'ดูตัวอย่างเอกสารที่จะได้'}
          </button>
        )}

        {showPreview && (
          <div className="mt-3 bg-bg-card border border-border rounded-2xl p-5 anim-fade-up">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold tracking-widest uppercase text-text-tertiary">เอกสารเตรียมยื่นกู้</div>
              <div className="text-lg font-bold mt-1">Loan Proposal Summary</div>
              <div className="h-0.5 w-12 mx-auto mt-2" style={{ background: 'var(--accent)' }} />
            </div>
            {fundFilled && (
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>วัตถุประสงค์</div>
                <div className="text-sm text-text-primary mt-1">{useOfFund}</div>
              </div>
            )}
            {storyFilled > 0 && (
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>เรื่องเล่าธุรกิจ</div>
                {STORY_PROMPTS.map((p, i) => loanStory[i] && (
                  <div key={i} className="mt-2">
                    <div className="text-[10px] text-text-tertiary">{p.q}</div>
                    <div className="text-sm text-text-primary">{loanStory[i]}</div>
                  </div>
                ))}
              </div>
            )}
            {packChecked > 0 && (
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>เอกสารที่เตรียมแล้ว ({packChecked}/{BANK_PACK.length})</div>
                <div className="text-sm text-text-primary mt-1">
                  {BANK_PACK.filter((_, i) => bankPack[i]).join(' · ')}
                </div>
              </div>
            )}
            {planFilled > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>แผนปฏิบัติ</div>
                {mondayPlan.filter(p => p.length > 0).map((p, i) => (
                  <div key={i} className="text-sm text-text-primary mt-1">{i + 1}. {p}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save + Next */}
        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl font-semibold cursor-pointer border-none text-sm disabled:opacity-40 transition-all gradient-accent"
            style={{ height: 48 }}>
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึก'}
          </button>
          {saved && (
            <>
              <button onClick={() => router.push('/ib/bank-sim')}
                className="flex-1 rounded-xl gradient-accent text-white font-semibold cursor-pointer text-sm border-none"
                style={{ height: 48 }}>
                Bank Simulation →
              </button>
              <button onClick={() => router.push('/ib/report')}
                className="flex-1 rounded-xl border border-border bg-bg-card font-semibold cursor-pointer text-sm text-text-primary"
                style={{ height: 48 }}>
                ดู MRI Report
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
