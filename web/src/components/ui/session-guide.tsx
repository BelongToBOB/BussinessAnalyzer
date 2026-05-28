'use client';

import { useState } from 'react';

const GUIDES: Record<string, { why: string; what: string; next: string }> = {
  's1-check-cash': {
    why: 'ยอดขายสูง \u2260 ธุรกิจดี \u2014 ถ้าขาย 500,000 แต่เงินในบัญชีเพิ่มแค่ 50,000 เงินหายไปไหน?',
    what: 'กรอก 4 ตัวเลข: ยอดขาย + เงินต้นเดือน + เงินสิ้นเดือน + ลูกหนี้ แล้วดูผลว่าเงินจริงห่างจากยอดขายแค่ไหน',
    next: 'ถ้าห่างมาก \u2192 ไปตรวจต่อที่ S3 Cashflow 4 Layers ว่าเงินไปจมตรงไหน',
  },
  's2-income-statement': {
    why: 'งบกำไรขาดทุนบอกว่ากำไรจริงเท่าไหร่ \u2014 แต่ต้องอ่านด้วยสายตาเจ้าของ ไม่ใช่สายตาบัญชี',
    what: 'กรอกตัวเลขจากงบ: รายได้ ต้นทุน ค่าใช้จ่าย ค่าเสื่อม ดอกเบี้ย ภาษี \u2014 ดู margin แต่ละชั้น',
    next: 'ดู Gross Margin ต่ำกว่า 30%? \u2192 ไปเช็คราคาที่ S4 ตั้งราคา',
  },
  's2-cashflow': {
    why: 'กำไรตามบัญชีกับเงินสดจริงไม่เหมือนกัน \u2014 งบ 2 ปีบอกว่าเงินไปจมตรงไหน',
    what: 'กรอกงบดุล 2 ปี (สินทรัพย์ + หนี้สิน) ระบบจะสร้างงบกระแสเงินสดให้อัตโนมัติ',
    next: 'ดูว่า CFO ติดลบไหม \u2192 ถ้าติดลบ เงินไปจมที่ลูกหนี้/สต็อก ไปอุดที่ S5',
  },
  's3-cashflow': {
    why: 'กำไร \u2260 เงินสด \u2014 ต้องไล่เงินจริงทีละชั้นว่าหายตรงไหน',
    what: 'กรอกเงินเข้า-ออกจริง 4 ชั้น: Cash In \u2192 Real Cash \u2192 Surplus \u2192 Growth Cash',
    next: 'Growth Cash ติดลบ? \u2192 ไปอุดรอยรั่วที่ S5 Expense Map ก่อนคิดขยาย',
  },
  's4-pricing': {
    why: 'ตั้งราคาผิด = ประมาณการกำไรผิดตั้งแต่ต้น \u2014 Markup 40% \u2260 Margin 40%',
    what: 'ใส่ต้นทุน + % ที่ต้องเผื่อ \u2192 ได้ราคาขายที่ถูกต้อง + เช็ค Markup vs Margin',
    next: 'รู้ราคาแล้ว \u2192 ไปดูว่าต้องขายกี่ชิ้นถึงคุ้มทุนที่ S4 CM',
  },
  's4-cm': {
    why: 'ขายเพิ่ม 1 บาท เหลือเงินจริงกี่บาท? ต้องรู้ก่อนรับงานใหม่หรือลดราคา',
    what: 'กรอกราคาขาย + ต้นทุนผันแปร 6 รายการ + Fixed Cost \u2192 ได้ CM และจุดคุ้มทุน',
    next: 'รู้จุดคุ้มทุนแล้ว \u2192 ไปดูว่ากำไรเปลี่ยนเป็นเงินสดจริงไหมที่ S4 Real Profit',
  },
  's4-real-profit': {
    why: 'กำไรในงบ \u2260 เงินสดในมือ \u2014 ต้องหักเงินที่ยังไม่เป็นเงินสด + หนี้ + เงินหมุน',
    what: 'กรอก 4 ขั้น: กำไร + ค่าเสื่อม \u2192 หักเงินจม \u2192 หักหนี้ \u2192 หักเงินหมุน = เงินสดจริง',
    next: 'ติดลบ? \u2192 เช็ค 3 จุด: ลูกหนี้เยอะ / สต็อกจม / หนี้หนัก แล้วไปอุดที่ S5',
  },
  'expense-map': {
    why: 'อุดรอยรั่วก่อนเร่งยอดขาย \u2014 การขายเพิ่มไม่ช่วยถ้าเงินยังรั่ว',
    what: 'จัดกลุ่มค่าใช้จ่ายเป็น 3 กลุ่ม (ลงทุน/ดำเนินงาน/สูญเปล่า) + เช็ค 10 จุดรั่ว',
    next: 'อุดรอยรั่วแล้ว \u2192 ไปวางระบบเงินที่ S6 ระบบ 5 ช่อง',
  },
  's6-five-buckets': {
    why: 'เงินก้อนเดียวใช้ทุกเรื่อง = ปัญหาใหญ่สุดของ SME \u2014 แยกเงินให้ชัด',
    what: 'กำหนด % จัดสรร 5 ช่อง (ต้นทุน/OPEX/ภาษี+หนี้/สำรอง/เจ้าของ) รวมให้ได้ 100%',
    next: 'วางระบบเงินแล้ว \u2192 ไปเตรียมแผนกู้เงินที่ S7 แผน 1 หน้า',
  },
  's7-business-plan': {
    why: 'ธนาคารไม่ได้ดูว่าคุณเก่งแค่ไหน \u2014 ดูว่าคุณเสี่ยงยังไง และจะคืนเงินได้ไหม',
    what: 'ตอบ 4 คำถาม: กู้ทำอะไร / คืนยังไง / เสี่ยงอะไร / คุมธุรกิจยังไง + เช็ค 4 ด่านความพร้อม',
    next: 'พร้อมครบ 4 ด่าน = ยื่นกู้ได้อย่างมั่นใจ',
  },
};

export function SessionGuide({ page }: { page: string }) {
  const [open, setOpen] = useState(true);
  const guide = GUIDES[page];
  if (!guide) return null;

  return (
    <div className="bg-wash-info border border-accent/20 rounded-2xl overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer bg-transparent border-none text-left"
      >
        <span className="text-lg">{'\u2753'}</span>
        <span className="flex-1 text-sm font-semibold text-text-primary">ทำไมต้องทำ? · เริ่มยังไง?</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="var(--text-tertiary)"
          strokeWidth="2"
          strokeLinecap="round"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <div className="text-[10px] font-bold text-accent uppercase tracking-wide mb-1">ทำไมต้องทำ</div>
            <div className="text-sm text-text-primary leading-relaxed">{guide.why}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-accent uppercase tracking-wide mb-1">ทำอะไร</div>
            <div className="text-sm text-text-primary leading-relaxed">{guide.what}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-status-good uppercase tracking-wide mb-1">ทำเสร็จแล้วไปไหนต่อ</div>
            <div className="text-sm text-text-primary leading-relaxed">{guide.next}</div>
          </div>
        </div>
      )}
    </div>
  );
}
