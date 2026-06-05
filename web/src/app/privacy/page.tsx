'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <a href="/login" className="p-2 text-text-primary no-underline">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </a>
          <span className="text-[15px] font-semibold">นโยบายความเป็นส่วนตัว</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 pb-20">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-sm text-text-secondary mb-8">ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) · มีผลตั้งแต่ มิถุนายน 2569</p>

        <div className="space-y-8 text-sm text-text-primary leading-relaxed">

          <section>
            <h2 className="text-base font-semibold mb-2">1. ข้อมูลที่เราเก็บ</h2>
            <div className="bg-bg-secondary rounded-xl p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-secondary">
                    <th className="pb-2 font-semibold">ประเภทข้อมูล</th>
                    <th className="pb-2 font-semibold">ตัวอย่าง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="py-2">ข้อมูลบัญชี</td><td className="py-2">ชื่อ, อีเมล, LINE ID, รูปโปรไฟล์</td></tr>
                  <tr><td className="py-2">ข้อมูลธุรกิจ</td><td className="py-2">ชื่อธุรกิจ, ภาระผ่อนหนี้ต่อเดือน</td></tr>
                  <tr><td className="py-2">ข้อมูลการเงินรายเดือน</td><td className="py-2">ยอดขาย, ต้นทุน, ค่าใช้จ่าย, เงินสด, ลูกหนี้, เจ้าหนี้</td></tr>
                  <tr><td className="py-2">ข้อมูลเครื่องมือวิเคราะห์</td><td className="py-2">ผลการวิเคราะห์ S1-S7, Expense Map, แผนธุรกิจ</td></tr>
                  <tr><td className="py-2">ข้อมูลการใช้งาน</td><td className="py-2">วันเวลาเข้าใช้, เครื่องมือที่ใช้, การบันทึกข้อมูล</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">2. เก็บข้อมูลทำไม</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>ให้บริการ</strong> — คำนวณ Dashboard, เครื่องมือวิเคราะห์, กราฟ, ผลสรุป</li>
              <li><strong>เก็บประวัติ</strong> — แสดงแนวโน้มข้อมูลย้อนหลัง เปรียบเทียบเดือนต่อเดือน</li>
              <li><strong>ให้คำแนะนำ</strong> — ระบบวินิจฉัยอัตโนมัติ (verdict) จากตัวเลขที่กรอก</li>
              <li><strong>ปรับปรุงบริการ</strong> — วิเคราะห์รูปแบบการใช้งานเพื่อพัฒนาระบบ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">3. ใครเห็นข้อมูลของคุณ</h2>
            <div className="bg-wash-info rounded-xl p-4">
              <ul className="space-y-2">
                <li><strong>ตัวคุณเอง</strong> — เห็นข้อมูลทั้งหมดของตัวเองผ่าน Dashboard</li>
                <li><strong>ทีมที่ปรึกษา WinWin</strong> — อาจเห็นข้อมูลเพื่อให้คำแนะนำ (เฉพาะกรณีที่คุณยินยอม)</li>
                <li><strong>ไม่เปิดเผยต่อบุคคลภายนอก</strong> — ไม่ขายข้อมูล ไม่แชร์กับบริษัทอื่น</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">4. เก็บข้อมูลนานแค่ไหน</h2>
            <p>เก็บข้อมูลตลอดระยะเวลาที่ใช้บริการ หากผู้ใช้ลบบัญชี ข้อมูลทั้งหมดจะถูกลบภายใน 30 วัน และไม่สามารถกู้คืนได้</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">5. สิทธิ์ของคุณ (ตาม PDPA)</h2>
            <p className="mb-3">ในฐานะเจ้าของข้อมูล คุณมีสิทธิ์:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { icon: '👁', title: 'ขอเข้าถึง', desc: 'ดูข้อมูลทั้งหมดของคุณผ่าน Dashboard' },
                { icon: '✏️', title: 'ขอแก้ไข', desc: 'แก้ไขข้อมูลธุรกิจและรายเดือนได้ตลอด' },
                { icon: '🗑', title: 'ขอลบ', desc: 'ลบข้อมูลทั้งหมดได้ที่ Settings' },
                { icon: '📤', title: 'ขอโอนย้าย', desc: 'ดาวน์โหลดข้อมูลเป็น PDF หรือ CSV' },
                { icon: '🚫', title: 'ถอนความยินยอม', desc: 'เพิกถอนได้ตลอดเวลา โดยลบบัญชี' },
                { icon: '📣', title: 'ร้องเรียน', desc: 'ร้องเรียนต่อสำนักงาน PDPC ได้' },
              ].map((item) => (
                <div key={item.title} className="bg-bg-secondary rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{item.icon}</span>
                    <span className="font-semibold text-sm">{item.title}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">6. ความปลอดภัยของข้อมูล</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>ข้อมูลเก็บในฐานข้อมูลที่แยกจากระบบอื่น (isolated database)</li>
              <li>การเชื่อมต่อเข้ารหัสด้วย HTTPS/TLS ตลอดเวลา</li>
              <li>สูตรคำนวณอยู่บนเซิร์ฟเวอร์เท่านั้น ไม่ส่งออกไปยังเบราว์เซอร์</li>
              <li>เข้าสู่ระบบผ่าน LINE หรือลิงก์อีเมล ไม่เก็บรหัสผ่าน</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">7. คุกกี้</h2>
            <p>ระบบใช้คุกกี้เฉพาะที่จำเป็นสำหรับการเข้าสู่ระบบ (session cookie) และจำธีมที่เลือก (localStorage) ไม่มีคุกกี้โฆษณาหรือติดตามพฤติกรรม</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">8. ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล</h2>
            <div className="bg-bg-secondary rounded-xl p-4">
              <p><strong>WinWin Wealth Creation</strong></p>
              <p className="text-text-secondary mt-1">สอบถามเรื่องข้อมูลส่วนบุคคลได้ที่ช่องทางบนเว็บไซต์ winwinwealth.co</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
