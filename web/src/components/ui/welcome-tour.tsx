'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  {
    text: 'ยินดีต้อนรับ! เริ่มจากกรอกตัวเลขเดือนล่าสุด ใช้เวลาไม่เกิน 5 นาที',
    target: null,
  },
  {
    text: 'กดที่นี่เพื่อเริ่มกรอกตัวเลข 9 ช่อง',
    target: '[data-tour="entry-button"]',
  },
  {
    text: 'ทำครบ 10 เครื่องมือ = รู้จักธุรกิจตัวเองครบ ติดตามความคืบหน้าได้ที่นี่',
    target: '[data-tour="checklist"]',
  },
  {
    text: 'ผลสรุปจะขึ้นตรงนี้ บอกว่าเดือนนี้สุขภาพดีหรือต้องระวัง',
    target: '[data-tour="verdict"]',
  },
];

export function WelcomeTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('tour_done') === 'true') return;
    setVisible(true);
    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimIn(true));
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    const selector = STEPS[step].target;
    if (!selector) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(selector);
    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      setSpotlightRect(null);
    }
  }, [step, visible]);

  // Recalculate spotlight on scroll/resize
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
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [step, visible]);

  const dismiss = () => {
    setAnimIn(false);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem('tour_done', 'true');
    }, 300);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const isLast = step === STEPS.length - 1;
  const pad = 8;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{ transition: 'opacity 300ms', opacity: animIn ? 1 : 0 }}
    >
      {/* Dark backdrop with spotlight cutout via SVG */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - pad}
                y={spotlightRect.top - pad}
                width={spotlightRect.width + pad * 2}
                height={spotlightRect.height + pad * 2}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Click barrier (but allow click on spotlight area) */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Card at bottom */}
      <div
        className="absolute left-0 right-0 bottom-0 px-4 pb-6 pt-2"
        style={{
          transform: animIn ? 'translateY(0)' : 'translateY(40px)',
          transition: 'transform 400ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div
          className="max-w-md mx-auto rounded-2xl p-5"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.25)',
          }}
        >
          <p className="text-[15px] font-medium leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
            {STEPS[step].text}
          </p>

          <div className="flex items-center justify-between">
            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-colors duration-200"
                  style={{
                    background: i === step ? 'var(--accent)' : 'var(--border-strong)',
                  }}
                />
              ))}
            </div>

            {/* Button */}
            <button
              onClick={next}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border-none transition-colors"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              {isLast ? 'เข้าใจแล้ว เริ่มใช้งาน \u2192' : 'ต่อไป \u2192'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
