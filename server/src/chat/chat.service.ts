import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `คุณคือ RM AI — ผู้ช่วยอ่านตัวเลขธุรกิจจากมุมมองธนาคาร
หลักการ: "เปิดแผล ไม่รักษาแผล" — ชี้ปัญหาได้ บอกวิธีแก้เชิงกลยุทธ์ไม่ได้

ตอบได้ 7 เรื่อง: อ่านตัวเลขให้, ชี้จุดอ่อน, เตรียมเอกสาร, คำถามจากธนาคาร, ลำดับความสำคัญ, วิธีใช้เครื่องมือ (Step 1-7), อธิบายศัพท์
นอก 7 เรื่อง → "เรื่องนี้ต้องปรึกษาผู้เชี่ยวชาญ สอบถามเพิ่มเติม LINE: @win_win"

ห้ามเด็ดขาด: แผนการเงินละเอียด / แนะนำธนาคารเฉพาะ / บอกตัวเลขวงเงิน (redirect ไป Step 6) / รับประกันอนุมัติ / วิเคราะห์ว่าจะอนุมัติหรือปฏิเสธ / step-by-step plan / สูตรคำนวณ

รูปแบบ: ไทยเท่านั้น, 2-3 ประโยค ไม่เกิน 60 คำ, ห้าม emoji, markdown ใช้ได้เฉพาะ **bold** กับขึ้นบรรทัดใหม่ (ห้าม # - code block), ห้าม "น่าจะ/อาจจะ/คงจะ", ศัพท์อังกฤษต้องมีไทยกำกับ เช่น "ความสามารถชำระหนี้ (DSCR)"
ห้ามใส่ LINE ทุกข้อความ — ใส่ได้เฉพาะนอก scope เท่านั้น

น้ำเสียง: รุ่นพี่ธนาคาร 10 ปี คุยกับน้อง SME — ตรง อ้างอิงตัวเลขจริง ไม่ทางการ ไม่ขายของ
คะแนนต่ำ → frame ว่า "ธนาคารมองคุณวันนี้ แก้ได้" ไม่ใช่คำตัดสิน
ถ้าถามผลอนุมัติ → "เป็นการประเมินเบื้องต้น ธนาคารพิจารณาปัจจัยอื่นร่วมด้วย"

เกณฑ์ตัดสิน:
DSCR: ดี>=1.5 | พอใช้ 1.25-1.5 | ต่ำ<1.25
D/E: ดี<=2 | สูง 2-3 | สูงเกิน>3
EBITDA Margin: ดี>=15% | บาง 8-15% | ต่ำ<8%
Current Ratio: ดี>=1.5 | พอใช้ 1.0-1.5 | ต่ำ<1.0
Quick Ratio: ดี>=1.0 | พอใช้ 0.5-1.0 | ต่ำ<0.5
Growth Cash: บวก=ดี | ลบ=รั่ว
LTV: ดี<=70% | พอได้ 70-80% | สูง>80%
ทุนตัวเอง: ดี>=30% | พอได้ 20-30% | ต่ำ<20%
(DSCR ในระบบเป็น Learning Mode ใช้ EBITDA/ภาระหนี้ ธนาคารจริงใช้ CFADS ที่ซับซ้อนกว่า)

วินิจฉัยจุดอ่อน (เลือกรุนแรงสุด):
1. Gross Margin <25% → กำไรขั้นต้นบาง
2. Cash Cycle >45 วัน → เงินจมเก็บหนี้ช้า/สต็อกค้าง
3. DSCR <1.25 หรือ D/E >2.5 → ภาระหนี้ตึง
4. ค่าใช้จ่ายดำเนินงาน/รายได้ >20% → ค่าใช้จ่ายสูง

4 กลุ่มความพร้อม:
Ready to Structure — ตัวเลขพร้อม จัดแพ็กเกจให้ถูก
Expansion-Ready — พร้อมขยาย วางโครงสร้างวงเงิน
Need Cleanup — เคลียร์งบ/หนี้/กระแสเงินสดก่อน
High Risk — ปรับฐานก่อน ยังไม่ควรกู้เพิ่ม

Step Guide (ตอบเมื่อ user ถามวิธีใช้):
S1 ข้อมูลธุรกิจ: ประเภท ยอดขาย/ปี พนักงาน อายุ — ดูจากทะเบียนพาณิชย์/งบการเงิน
S2 สแกนงบ: กำไรขาดทุน(รายได้ ต้นทุน ค่าใช้จ่าย) + งบดุล(เงินสด ลูกหนี้ สินค้า เจ้าหนี้ เงินกู้ ทุน) + ตารางหนี้
S3 กระแสเงินสด 4 ชั้น: เงินเข้า→เงินจริง→เงินเหลือ→เงินโต (ดูจาก Bank Statement)
S4 มุมมองธนาคาร: 4 คำถามประเมินตัวเอง ระบบรวมกับตัวเลข S2-S3
S5 ออกแบบวงเงิน: วัตถุประสงค์ มูลค่าโครงการ ทุนตัวเอง หลักประกัน
S6 กู้ได้เท่าไหร่: ปรับดอกเบี้ย/ระยะเวลา ระบบคำนวณ 3 ระดับ
S7 เตรียมยื่นกู้: วัตถุประสงค์ 5 คำถามธนาคาร เช็คลิสต์เอกสาร

ตัวอย่างที่ดี:
Q: "ธุรกิจพร้อมกู้มั้ย" → "ความสามารถชำระหนี้ (DSCR) 1.41 พอไหวแต่ยังไม่ถึงเกณฑ์ที่ธนาคารชอบ และเงินเหลือเติบโต (Growth Cash) ติดลบ ต้องจัดการจุดนี้ก่อนยื่น"
Q: "กู้ได้เท่าไหร่" → "ลองดูผลใน Step 6 ครับ ระบบคำนวณ 3 ระดับจากตัวเลขจริงของคุณ เป็นการประมาณเบื้องต้น ธนาคารพิจารณาปัจจัยอื่นร่วมด้วย"
Q: "แผนการเงินให้หน่อย" → "เรื่องแผนการเงินต้องดูรายละเอียดเฉพาะธุรกิจครับ สอบถามเพิ่มเติม LINE: @win_win"`;

@Injectable()
export class ChatService {
  private anthropic: Anthropic | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async chatStream(userId: string, message: string, history: { role: string; content: string }[] = [], res: any) {
    if (!this.anthropic) {
      res.json({ reply: 'ระบบ AI ยังไม่พร้อมใช้งาน — กรุณาตั้งค่า API key', error: true });
      return;
    }

    const userMsgCount = history.filter(h => h.role === 'user').length;
    if (userMsgCount >= 15) {
      res.json({ reply: 'ถึงจำนวนข้อความสูงสุดแล้ว (15 ข้อความ) — สอบถามเพิ่มเติม LINE: @win_win', error: false, limitReached: true });
      return;
    }

    const context = await this.buildContext(userId);
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const h of history.slice(-10)) {
      messages.push({ role: h.role as 'user' | 'assistant', content: h.content });
    }
    messages.push({ role: 'user', content: message });

    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = this.anthropic.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT + (context ? `\n\nข้อมูลธุรกิจของ user:\n${context}` : ''),
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e: any) {
      console.error('Claude stream error:', e.message);
      res.json({ reply: 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่', error: true });
    }
  }

  async chat(userId: string, message: string, history: { role: string; content: string }[] = []) {
    if (!this.anthropic) {
      return { reply: 'ระบบ AI ยังไม่พร้อมใช้งาน — กรุณาตั้งค่า API key', error: true };
    }

    // Guardrail: max 15 messages per session
    const userMsgCount = history.filter(h => h.role === 'user').length;
    if (userMsgCount >= 15) {
      return { reply: 'ถึงจำนวนข้อความสูงสุดแล้ว (15 ข้อความ) — สำหรับคำแนะนำเชิงลึก นัด consult คุณวินได้ที่ LINE: @win_win', error: false, limitReached: true };
    }

    // Load user context
    const context = await this.buildContext(userId);

    // Build messages
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

    // Add history (last 10 messages)
    for (const h of history.slice(-10)) {
      messages.push({ role: h.role as 'user' | 'assistant', content: h.content });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT + (context ? `\n\nข้อมูลธุรกิจของ user:\n${context}` : ''),
        messages,
      });

      const reply = response.content[0].type === 'text' ? response.content[0].text : 'ไม่สามารถตอบได้';
      return { reply, error: false };
    } catch (e: any) {
      console.error('Claude API error:', e.message);
      return { reply: 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่', error: true };
    }
  }

  private async buildContext(userId: string): Promise<string> {
    try {
      const business = await this.prisma.business.findUnique({
        where: { userId },
        include: { sessionData: true },
      });

      if (!business) return '';

      const lines: string[] = [];
      lines.push(`ชื่อธุรกิจ: ${business.name}`);
      lines.push(`Template: ${(business as any).template || 'ibf'}`);

      for (const sd of business.sessionData) {
        const computed = sd.computed as any;
        const data = sd.data as any;

        switch (sd.sessionType) {
          case 'IB_IDENTITY':
            if (computed?.bizType) lines.push(`ประเภทธุรกิจ: ${computed.bizType}`);
            if (computed?.salesPerYear) lines.push(`ยอดขาย/ปี: ${computed.salesPerYear}`);
            if (computed?.employees) lines.push(`พนักงาน: ${computed.employees} คน`);
            if (computed?.bizAgeYears) lines.push(`อายุธุรกิจ: ${computed.bizAgeYears} ปี`);
            break;
          case 'IB_FINANCIAL_MRI':
            // Raw inputs
            if (data?.revenue) lines.push(`รายได้: ${data.revenue}`);
            if (data?.cogs) lines.push(`ต้นทุนขาย: ${data.cogs}`);
            if (data?.sga) lines.push(`ค่าใช้จ่ายบริหาร: ${data.sga}`);
            if (data?.interest) lines.push(`ดอกเบี้ย: ${data.interest}`);
            if (data?.equity) lines.push(`ส่วนของเจ้าของ: ${data.equity}`);
            if (data?.debtSchedule?.length) lines.push(`จำนวนก้อนหนี้: ${data.debtSchedule.length}`);
            // Computed
            if (computed?.netProfit) lines.push(`กำไรสุทธิ: ${computed.netProfit}`);
            if (computed?.ebitda) lines.push(`EBITDA: ${computed.ebitda}`);
            if (computed?.ebitdaMargin) lines.push(`EBITDA Margin: ${computed.ebitdaMargin}%`);
            if (computed?.dscr) lines.push(`DSCR: ${computed.dscr}`);
            if (computed?.de) lines.push(`D/E: ${computed.de}`);
            if (computed?.currentRatio) lines.push(`Current Ratio: ${computed.currentRatio}`);
            if (computed?.quickRatio) lines.push(`Quick Ratio: ${computed.quickRatio}`);
            if (computed?.annualDebtService) lines.push(`ภาระหนี้/ปี: ${computed.annualDebtService}`);
            break;
          case 'IB_CASH_DNA':
            if (data?.salesTotal) lines.push(`ยอดขาย/เดือน: ${data.salesTotal}`);
            if (data?.creditSales) lines.push(`ขายเชื่อ/เดือน: ${data.creditSales}`);
            if (data?.cogsPaid) lines.push(`ต้นทุนจ่ายจริง/เดือน: ${data.cogsPaid}`);
            if (data?.opex) lines.push(`ค่าใช้จ่ายดำเนินงาน/เดือน: ${data.opex}`);
            if (computed?.cashIn) lines.push(`เงินเข้าจริง/เดือน: ${computed.cashIn}`);
            if (computed?.realCash) lines.push(`เงินสดจริง/เดือน: ${computed.realCash}`);
            if (computed?.surplus) lines.push(`เงินเหลือ/เดือน: ${computed.surplus}`);
            if (computed?.growthCash != null) lines.push(`เงินเหลือเติบโต/เดือน: ${computed.growthCash}`);
            break;
          case 'IB_CAPITAL_DESIGN':
            if (data?.purpose) lines.push(`วัตถุประสงค์กู้: ${data.purpose}`);
            if (data?.projectValue) lines.push(`มูลค่าโครงการ: ${data.projectValue}`);
            if (data?.ownCapital) lines.push(`ทุนตัวเอง: ${data.ownCapital}`);
            if (computed?.loanNeeded) lines.push(`ต้องกู้: ${computed.loanNeeded}`);
            if (computed?.ltv) lines.push(`LTV: ${computed.ltv}%`);
            break;
          case 'IB_GROWTH_CAPACITY':
            if (computed?.safe) lines.push(`วงเงินปลอดภัย: ${computed.safe.loanAmount}`);
            if (computed?.max) lines.push(`วงเงินสูงสุด: ${computed.max.loanAmount}`);
            break;
        }
      }

      return lines.join('\n');
    } catch {
      return '';
    }
  }
}
