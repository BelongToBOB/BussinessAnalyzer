'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-10 bg-bg-primary/85 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
          <a href="/login" className="p-2 text-text-primary no-underline">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 6l-5 5 5 5"/></svg>
          </a>
          <span className="text-[15px] font-semibold">ข้อกำหนดการใช้งาน</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 pb-20">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">ข้อกำหนดการใช้งาน</h1>
        <p className="text-sm text-text-secondary mb-8">WinWin Analyzer · มีผลตั้งแต่ มิถุนายน 2569</p>

        <div className="space-y-8 text-sm text-text-primary leading-relaxed">

          <section>
            <h2 className="text-base font-semibold mb-2">1. WinWin Analyzer คืออะไร</h2>
            <p>WinWin Analyzer เป็นเครื่องมือวิเคราะห์สุขภาพการเงินธุรกิจสำหรับเจ้าของ SME พัฒนาโดย WinWin Wealth Creation ใช้งานผ่านเว็บเบราว์เซอร์ ไม่ต้องติดตั้งแอปพลิเคชัน</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">2. ผู้ใช้งาน</h2>
            <p>ผู้ใช้ต้องลงทะเบียนผ่าน LINE Login หรืออีเมล และยอมรับข้อกำหนดนี้ก่อนเริ่มใช้งาน ผู้ใช้ต้องเป็นเจ้าของธุรกิจหรือผู้มีอำนาจจัดการข้อมูลการเงินของธุรกิจนั้น</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">3. สิ่งที่ห้ามทำ</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>ห้ามคัดลอก ดัดแปลง หรือเผยแพร่สูตรคำนวณที่อยู่ในระบบ</li>
              <li>ห้ามใช้ระบบเพื่อวัตถุประสงค์เชิงพาณิชย์อื่นนอกจากวิเคราะห์ธุรกิจของตนเอง</li>
              <li>ห้ามพยายามเข้าถึงข้อมูลของผู้ใช้คนอื่น</li>
              <li>ห้ามใช้ระบบในทางที่ผิดกฎหมาย</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">4. สิทธิ์ในข้อมูล</h2>
            <p>ข้อมูลที่ผู้ใช้กรอกเป็นทรัพย์สินของผู้ใช้ ผู้ใช้สามารถขอลบข้อมูลทั้งหมดได้ตลอดเวลาผ่านหน้า Settings สูตรคำนวณและตรรกะการวิเคราะห์เป็นทรัพย์สินทางปัญญาของ WinWin Wealth Creation</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">5. การยกเลิกและลบข้อมูล</h2>
            <p>ผู้ใช้สามารถยกเลิกการใช้งานและลบข้อมูลทั้งหมดได้ที่หน้า Settings &gt; ลบข้อมูลทั้งหมด เมื่อลบแล้วจะไม่สามารถกู้คืนได้ ระบบจะลบข้อมูลทั้งหมดของผู้ใช้รวมถึงธุรกิจ รายการเดือน และข้อมูลเครื่องมือทุกตัว</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">6. ข้อจำกัดความรับผิด</h2>
            <div className="bg-wash-warn rounded-xl p-4">
              <p className="font-semibold mb-1">WinWin Analyzer ไม่ใช่คำแนะนำทางการเงินอย่างเป็นทางการ</p>
              <p>ผลการวิเคราะห์เป็นเครื่องมือช่วยตัดสินใจเบื้องต้นเท่านั้น ไม่ใช่คำแนะนำจากที่ปรึกษาทางการเงิน นักบัญชี หรือผู้เชี่ยวชาญที่ได้รับอนุญาต ผู้ใช้ควรปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจทางการเงินที่สำคัญ</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">7. การเปลี่ยนแปลงข้อกำหนด</h2>
            <p>WinWin Wealth Creation อาจปรับปรุงข้อกำหนดเป็นครั้งคราว หากมีการเปลี่ยนแปลงที่สำคัญ จะแจ้งให้ผู้ใช้ทราบผ่านระบบ</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">8. ติดต่อ</h2>
            <p>หากมีคำถามเกี่ยวกับข้อกำหนดนี้ ติดต่อได้ที่ WinWin Wealth Creation ผ่านช่องทางที่ระบุบนเว็บไซต์ winwinwealth.co</p>
          </section>

        </div>
      </main>
    </div>
  );
}
