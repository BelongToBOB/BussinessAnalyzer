'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  {
    text: 'ยินดีต้อนรับสู่ Inside Bank — สแกนธุรกิจพร้อมกู้จากมุมมองธนาคาร ทำทีละ Step เห็นคะแนนไต่ขึ้น',
    target: null,
  },
  {
    text: 'Business Score คะแนน 0-100 บอกว่าธุรกิจคุณพร้อมกู้แค่ไหน — ยิ่งทำหลาย Step คะแนนยิ่งแม่น',
    target: '[data-tour="ib-score"]',
  },
  {
    text: 'เริ่มจาก Step 1-3 กรอกข้อมูลงบ + เงินสด ระบบคำนวณให้ทันที ไม่ต้องรู้สูตร',
    target: '[data-tour="ib-steps"]',
  },
  {
    text: 'ตรงนี้สรุปว่าจุดไหนต้องแก้ เรียงลำดับความสำคัญให้แล้ว',
    target: '[data-tour="ib-moves"]',
  },
  {
    text: 'ทำครบแล้วดู MRI Report — เห็นผลว่าธนาคารจะอนุมัติหรือไม่ พร้อมคำแนะนำ',
    target: '[data-tour="ib-report"]',
  },
];

export function IbWelcomeTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('ib_tour_done') === 'true') return;
    setVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimIn(true));
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    const selector = STEPS[step].target;
    if (!selector) { setSpotlightRect(null); return; }
    const el = document.querySelector(selector);
    if (el) setSpotlightRect(el.getBoundingClientRect());
    else setSpotlightRect(null);
  }, [step, visible]);

  useEffect(() => {
    if (!visible) return;
    const update = () => {
      const selector = STEPS[step].target;
      if (!selector) return;
      const el = document.querySelector(selector);
      if (el) setSpotlightRect(el.getBoundingClientRect());
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [step, visible]);

  const dismiss = () => {
    setAnimIn(false);
    setTimeout(() => { setVisible(false); localStorage.setItem('ib_tour_done', 'true'); }, 300);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  if (!visible) return null;
  const isLast = step === STEPS.length - 1;
  const pad = 8;

  return (
    <div className="fixed inset-0 z-[9999]" style={{ transition: 'opacity 300ms', opacity: animIn ? 1 : 0 }}>
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="ib-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect x={spotlightRect.left - pad} y={spotlightRect.top - pad}
                width={spotlightRect.width + pad * 2} height={spotlightRect.height + pad * 2}
                rx="16" fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#ib-tour-mask)" />
      </svg>

      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      <div className="absolute left-0 right-0 bottom-0 px-4 pb-6 pt-2"
        style={{ transform: animIn ? 'translateY(0)' : 'translateY(40px)', transition: 'transform 400ms cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="max-w-md mx-auto rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 -4px 40px rgba(0,0,0,0.25)' }}>
          <p className="text-[15px] font-medium leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
            {STEPS[step].text}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full transition-colors duration-200"
                  style={{ background: i === step ? 'var(--accent)' : 'var(--border-strong)' }} />
              ))}
            </div>
            <div className="flex gap-2">
              {step === 0 && (
                <button onClick={dismiss} className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer bg-transparent border border-border-strong" style={{ color: 'var(--text-secondary)' }}>
                  ข้าม
                </button>
              )}
              <button onClick={next}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border-none"
                style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                {isLast ? 'เข้าใจแล้ว เริ่มสแกน →' : 'ต่อไป →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
