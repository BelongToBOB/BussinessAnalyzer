'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { money, maskCurrency, unmaskCurrency } from '@/lib/format';
import { NumberInput } from '@/components/ui/number-input';
import { getSession, saveSession } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowDownToLine, Banknote, Wallet, Rocket, ChevronLeft } from 'lucide-react';
import { IbStepProgress } from '@/components/ui/ib-step-progress';

const LAYERS = [
  { Icon: ArrowDownToLine, color: '#3B82F6', label: 'เงินเข้าจริง', eng: 'Cash In' },
  { Icon: Banknote, color: '#22C55E', label: 'เงินสดจริง', eng: 'Real Cash' },
  { Icon: Wallet, color: '#F59E0B', label: 'เงินเหลือหลังจ่าย', eng: 'Surplus' },
  { Icon: Rocket, color: '#EF4444', label: 'เงินเหลือสำหรับเติบโต', eng: 'Growth Cash' },
];

export default function IbStep3Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [salesTotal, setSalesTotal] = useState('');
  const [creditSales, setCreditSales] = useState('');
  const [collectOldAR, setCollectOldAR] = useState('');
  const [cogsPaid, setCogsPaid] = useState('');
  const [opex, setOpex] = useState('');
  const [interestM, setInterestM] = useState('');
  const [principalM, setPrincipalM] = useState('');
  const [taxM, setTaxM] = useState('');

  useEffect(() => {
    getSession('ib-cash-dna').then((res: any) => {
      const d = res?.data;
      if (!d) return;
      if (d.salesTotal) { setSalesTotal(maskCurrency(String(d.salesTotal))); }
      if (d.creditSales) setCreditSales(maskCurrency(String(d.creditSales)));
      if (d.collectOldAR) setCollectOldAR(maskCurrency(String(d.collectOldAR)));
      if (d.cogsPaid) setCogsPaid(maskCurrency(String(d.cogsPaid)));
      if (d.opex) setOpex(maskCurrency(String(d.opex)));
      if (d.interestM) setInterestM(maskCurrency(String(d.interestM)));
      if (d.principalM) setPrincipalM(maskCurrency(String(d.principalM)));
      if (d.taxM) setTaxM(maskCurrency(String(d.taxM)));
    }).catch(() => {});
  }, []);

  const u = unmaskCurrency;
  const ci = u(salesTotal) - u(creditSales) + u(collectOldAR);
  const rc = ci - u(cogsPaid);
  const sp = rc - u(opex);
  const gc = sp - u(interestM) - u(principalM) - u(taxM);

  const layerValues = [ci, rc, sp, gc];
  const maxVal = Math.max(ci, 1);

  // Verdict
  let verdict = 'ยังไม่มีข้อมูล';
  let verdictColor = 'var(--text-tertiary)';
  let verdictBg = 'bg-bg-card border border-border';
  if (u(salesTotal) > 0) {
    if (gc > 0) { verdict = 'มีเงินเหลือสำหรับเติบโต'; verdictColor = 'var(--status-good)'; verdictBg = 'bg-wash-good'; }
    else if (gc >= 0) { verdict = 'เท่าทุน — ยังไม่มีเงินเหลือโต'; verdictColor = 'var(--status-warn)'; verdictBg = 'bg-wash-warn'; }
    else { verdict = 'เงินไม่พอ — ต้องอุดรอยรั่วก่อน'; verdictColor = 'var(--status-bad)'; verdictBg = 'bg-wash-bad'; }
  }

  // Where money leaks
  const leaks: string[] = [];
  if (ci > 0 && u(creditSales) / u(salesTotal) > 0.3) leaks.push(`ขายเชื่อสูง ${(u(creditSales) / u(salesTotal) * 100).toFixed(0)}% — เงินยังไม่เข้า`);
  if (ci > 0 && u(cogsPaid) / ci > 0.7) leaks.push(`ต้นทุนกิน ${(u(cogsPaid) / ci * 100).toFixed(0)}% ของเงินเข้า`);
  if (rc > 0 && u(opex) / rc > 0.8) leaks.push(`ค่าใช้จ่ายดำเนินงานสูง — กินเงินสดเกือบหมด`);
  if (sp > 0 && (u(interestM) + u(principalM)) / sp > 0.5) leaks.push('ภาระหนี้กินเงินเหลือมากกว่าครึ่ง');

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSession('ib-cash-dna', {
        salesTotal: u(salesTotal), creditSales: u(creditSales), collectOldAR: u(collectOldAR),
        cogsPaid: u(cogsPaid), opex: u(opex),
        interestM: u(interestM), principalM: u(principalM), taxM: u(taxM),
      });
      toast.success('บันทึกสำเร็จ');
      setSaved(true);
    } catch (e: any) { toast.error(e.message || 'บันทึกไม่สำเร็จ'); }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <button onClick={() => router.push('/ib')} className="p-2 cursor-pointer bg-transparent border-none text-text-primary">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <span className="text-[15px] font-semibold">Step 3 · กระแสเงินสด</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-5 pb-24">
        <div className="mb-4 anim-fade-up">
          <div className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--accent)' }}>Step 3 of 7</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">กระแสเงินสด 4 ชั้น</h1>
          <p className="text-sm text-text-secondary mt-1">ไล่เงินจริงทีละชั้น — เงินเข้า → จริง → เหลือ → โต</p>
        </div>

        <IbStepProgress current={3} />

        {/* ═══════════════ LIVE RESULTS (below input) ═══════════════ */}

        {/* ═══════════════ INPUT + LIVE RESULTS ═══════════════ */}
        {(() => {
          const l1Done = u(salesTotal) > 0;
          const l2Done = u(cogsPaid) > 0;
          const l3Done = u(opex) > 0;
          const l4Done = u(interestM) > 0 || u(principalM) > 0 || u(taxM) > 0;
          const layersDone = [l1Done, l2Done, l3Done, l4Done];
          return (
          <div className="anim-fade-up">
            {/* Layer 1 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${l1Done ? 'bg-status-good/15' : ''}`} style={!l1Done ? { background: `color-mix(in srgb, ${LAYERS[0].color} 12%, transparent)` } : {}}>
                  {l1Done ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--status-good)" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7l3 3 5-6"/></svg> : <ArrowDownToLine size={14} strokeWidth={1.5} color={LAYERS[0].color} />}
                </div>
                <span className="text-sm font-semibold">ชั้น 1 — เงินเข้าจริง</span>
                {l1Done && <span className="num text-xs font-bold ml-auto" style={{ color: LAYERS[0].color }}>{money(ci)}</span>}
              </div>
              <div className="bg-bg-card rounded-2xl p-5 space-y-4 transition-colors border" style={{ borderColor: l1Done ? LAYERS[0].color : 'var(--border)' }}>
                <div><label className="text-sm font-medium mb-1.5 block">ยอดขายรวมเดือนนี้</label><NumberInput value={salesTotal} onChange={setSalesTotal} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">ขายเชื่อ (เก็บเดือนหน้า)</label><NumberInput value={creditSales} onChange={setCreditSales} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">เก็บหนี้เก่าได้</label><NumberInput value={collectOldAR} onChange={setCollectOldAR} /></div>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${l2Done ? 'bg-status-good/15' : ''}`} style={!l2Done ? { background: `color-mix(in srgb, ${LAYERS[1].color} 12%, transparent)` } : {}}>
                  {l2Done ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--status-good)" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7l3 3 5-6"/></svg> : <Banknote size={14} strokeWidth={1.5} color={LAYERS[1].color} />}
                </div>
                <span className="text-sm font-semibold">ชั้น 2 — เงินสดจริง</span>
                {l2Done && <span className="num text-xs font-bold ml-auto" style={{ color: LAYERS[1].color }}>{money(rc)}</span>}
              </div>
              <div className="bg-bg-card rounded-2xl p-5 transition-colors border" style={{ borderColor: l2Done ? LAYERS[1].color : 'var(--border)' }}>
                <label className="text-sm font-medium mb-1.5 block">ต้นทุนที่จ่ายจริงเดือนนี้</label>
                <NumberInput value={cogsPaid} onChange={setCogsPaid} />
              </div>
            </div>

            {/* Layer 3 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${l3Done ? 'bg-status-good/15' : ''}`} style={!l3Done ? { background: `color-mix(in srgb, ${LAYERS[2].color} 12%, transparent)` } : {}}>
                  {l3Done ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--status-good)" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7l3 3 5-6"/></svg> : <Wallet size={14} strokeWidth={1.5} color={LAYERS[2].color} />}
                </div>
                <span className="text-sm font-semibold">ชั้น 3 — เงินเหลือหลังจ่าย</span>
                {l3Done && <span className="num text-xs font-bold ml-auto" style={{ color: sp >= 0 ? LAYERS[2].color : 'var(--status-bad)' }}>{money(sp)}</span>}
              </div>
              <div className="bg-bg-card rounded-2xl p-5 transition-colors border" style={{ borderColor: l3Done ? LAYERS[2].color : 'var(--border)' }}>
                <label className="text-sm font-medium mb-1.5 block">ค่าใช้จ่ายดำเนินงาน (OPEX)</label>
                <NumberInput value={opex} onChange={setOpex} />
              </div>
            </div>

            {/* Layer 4 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${l4Done ? 'bg-status-good/15' : ''}`} style={!l4Done ? { background: `color-mix(in srgb, ${LAYERS[3].color} 12%, transparent)` } : {}}>
                  {l4Done ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--status-good)" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7l3 3 5-6"/></svg> : <Rocket size={14} strokeWidth={1.5} color={LAYERS[3].color} />}
                </div>
                <span className="text-sm font-semibold">ชั้น 4 — เงินเหลือสำหรับเติบโต</span>
                {l4Done && <span className="num text-xs font-bold ml-auto" style={{ color: gc >= 0 ? LAYERS[3].color : 'var(--status-bad)' }}>{money(gc)}</span>}
              </div>
              <div className="bg-bg-card rounded-2xl p-5 space-y-4 transition-colors border" style={{ borderColor: l4Done ? LAYERS[3].color : 'var(--border)' }}>
                <div><label className="text-sm font-medium mb-1.5 block">ดอกเบี้ยจ่าย/เดือน</label><NumberInput value={interestM} onChange={setInterestM} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">เงินต้นผ่อนหนี้/เดือน</label><NumberInput value={principalM} onChange={setPrincipalM} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">ภาษี/เดือน</label><NumberInput value={taxM} onChange={setTaxM} /></div>
              </div>
            </div>

            {/* Mini progress */}
            {l1Done && (
              <div className="mb-4 flex items-center gap-2 px-1">
                {layersDone.map((done, i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300" style={{ background: done ? LAYERS[i].color : 'var(--border)' }} />
                ))}
                <span className="text-[10px] text-text-tertiary num">{layersDone.filter(Boolean).length}/4</span>
              </div>
            )}

            {/* ── Live results ── */}
            {u(salesTotal) > 0 && (
              <div className="mb-6">
                {/* Verdict */}
                <div className={`rounded-2xl p-5 mb-3 ${verdictBg}`}>
                  <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-1">ผลสแกน</div>
                  <div className="text-lg font-bold" style={{ color: verdictColor }}>{verdict}</div>
                  <div className="num text-2xl font-bold mt-1" style={{ color: verdictColor }}>
                    {gc >= 0 ? '+' : ''}{money(gc)} <span className="text-xs font-normal text-text-tertiary">บาท/เดือน</span>
                  </div>
                </div>

                {/* 4-layer waterfall bars */}
                <div className="bg-bg-card border border-border rounded-2xl p-4">
                  <div className="space-y-2.5">
                    {LAYERS.map((layer, i) => {
                      const val = layerValues[i];
                      const pct = Math.max(0, Math.min(100, val / maxVal * 100));
                      const isNeg = val < 0;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5">
                              <layer.Icon size={12} strokeWidth={1.5} color={layer.color} />
                              <span className="text-[11px] text-text-secondary">{layer.label}</span>
                            </div>
                            <span className="num text-xs font-bold" style={{ color: isNeg ? 'var(--status-bad)' : layer.color }}>
                              {val >= 0 ? '+' : ''}{money(val)}
                            </span>
                          </div>
                          <div className="h-3 rounded-md overflow-hidden" style={{ background: 'var(--border)' }}>
                            <div className="h-full rounded-md transition-all duration-700" style={{ width: `${isNeg ? 3 : pct}%`, background: isNeg ? 'var(--status-bad)' : layer.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leaks */}
                {leaks.length > 0 && (
                  <div className="bg-bg-card border border-border rounded-2xl p-4 mt-3">
                    <div className="text-[11px] font-semibold tracking-wide uppercase text-text-tertiary mb-2">จุดที่เงินรั่ว</div>
                    {leaks.slice(0, 2).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-t border-border first:border-t-0">
                        <div className="w-4 h-4 rounded bg-wash-bad flex items-center justify-center shrink-0 mt-0.5">
                          <span className="num text-[9px] font-bold text-status-bad">{i + 1}</span>
                        </div>
                        <span className="text-xs text-text-primary">{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save + Next */}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving || u(salesTotal) === 0}
                className="flex-1 rounded-xl font-semibold cursor-pointer border-none text-sm disabled:opacity-40 transition-all gradient-accent"
                style={{ height: 48 }}>
                {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึก'}
              </button>
              {saved && (
                <button onClick={() => router.push('/ib/step/4-bank-view')}
                  className="flex-1 rounded-xl border border-border bg-bg-card font-semibold cursor-pointer text-sm text-text-primary"
                  style={{ height: 48 }}>
                  ไป Step 4 →
                </button>
              )}
            </div>
          </div>
        );})()}
      </main>
    </div>
  );
}
