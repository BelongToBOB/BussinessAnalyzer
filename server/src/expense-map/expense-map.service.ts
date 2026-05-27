import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LEAK_CHECKPOINTS = [
  'ลด / แจกส่วนลดเกินจำเป็น',
  'ค่าแรง / จำนวนคน ไม่สัมพันธ์กับยอดขาย',
  'ค่าใช้จ่ายซ้ำซ้อน / Subscription ที่ไม่ได้ใช้',
  'ดอกเบี้ยสูง / ผ่อนหนี้หนักเกินกระแสเงินสด',
  'เจ้าของใช้เงินปนกับธุรกิจ — เงินก้อนเดียวใช้ทุกเรื่อง',
  'ลูกหนี้เยอะ / เก็บเงินช้า',
  'สต็อกจม / Dead Stock',
  'ของเสีย / ของหมดอายุ',
  'เงินสดย่อยรั่ว / เบิกจ่ายไม่มีใบเสร็จ',
  'ค่าปรับล่าช้า / ค่าธรรมเนียม-ดอกเบี้ยแฝงใน Statement',
];

@Injectable()
export class ExpenseMapService {
  constructor(private prisma: PrismaService) {}

  private async getBusiness(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('Business not found.');
    return business;
  }

  // ─── Expense Items (Part 1) ───────────────────────────

  async getItems(userId: string) {
    const business = await this.getBusiness(userId);
    const items = await this.prisma.expenseItem.findMany({
      where: { businessId: business.id },
      orderBy: { sortOrder: 'asc' },
    });

    // Compute summaries
    const total = items.reduce((s, i) => s + Number(i.amount), 0);
    const byCategory = {
      invest: items.filter((i) => i.category === 'ลงทุน').reduce((s, i) => s + Number(i.amount), 0),
      operate: items.filter((i) => i.category === 'ดำเนินงาน').reduce((s, i) => s + Number(i.amount), 0),
      waste: items.filter((i) => i.category === 'สูญเปล่า').reduce((s, i) => s + Number(i.amount), 0),
    };

    let verdict = '';
    if (items.length === 0) {
      verdict = 'กรอกค่าใช้จ่ายในตารางเพื่อดูผล';
    } else if (byCategory.waste > 0) {
      verdict = `🔴 พบเงินกลุ่มสูญเปล่า ${Math.round(byCategory.waste).toLocaleString()} บาท/เดือน — อุดได้ทันที = กำไรเพิ่มถึง ${Math.round(byCategory.waste * 12).toLocaleString()} บาท/ปี`;
    } else {
      verdict = '✅ ยังไม่พบรายการกลุ่มสูญเปล่า — ไปเช็ค 10 จุดรั่วต่อ';
    }

    return { items, total, byCategory, verdict };
  }

  async upsertItem(userId: string, data: { id?: string; name: string; category: string; amount: number; decision?: string; sortOrder?: number }) {
    const business = await this.getBusiness(userId);

    if (data.id) {
      return this.prisma.expenseItem.update({
        where: { id: data.id },
        data: { name: data.name, category: data.category, amount: data.amount, decision: data.decision, sortOrder: data.sortOrder },
      });
    }

    return this.prisma.expenseItem.create({
      data: {
        businessId: business.id,
        name: data.name,
        category: data.category,
        amount: data.amount,
        decision: data.decision,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async deleteItem(userId: string, itemId: string) {
    await this.getBusiness(userId);
    return this.prisma.expenseItem.delete({ where: { id: itemId } });
  }

  // ─── Leak Checks (Part 2) ────────────────────────────

  async getLeakChecks(userId: string) {
    const business = await this.getBusiness(userId);
    const checks = await this.prisma.leakCheck.findMany({
      where: { businessId: business.id },
      orderBy: { checkNumber: 'asc' },
    });

    // Merge with checkpoint labels
    const merged = LEAK_CHECKPOINTS.map((label, i) => {
      const check = checks.find((c) => c.checkNumber === i + 1);
      return {
        checkNumber: i + 1,
        label,
        found: check?.found ?? false,
        leakAmount: check ? Number(check.leakAmount ?? 0) : 0,
        fixPlan: check?.fixPlan ?? null,
      };
    });

    const foundCount = merged.filter((c) => c.found).length;
    const totalLeak = merged.reduce((s, c) => s + c.leakAmount, 0);

    let verdict = '';
    if (foundCount === 0 && checks.length === 0) {
      verdict = 'ทำเครื่องหมาย ✓ ในจุดที่ธุรกิจคุณมี';
    } else if (foundCount >= 4) {
      verdict = `🔴 พบจุดรั่ว ${foundCount} จุด — ต้องไล่อุดก่อนคิดเร่งยอดขาย`;
    } else if (foundCount >= 1) {
      verdict = `⚠️ พบจุดรั่ว ${foundCount} จุด — วางแผนแก้ทีละจุด`;
    } else {
      verdict = '✅ ยังไม่พบจุดรั่วชัดเจน — รักษาวินัยนี้ไว้';
    }

    return { checks: merged, foundCount, totalLeak, verdict };
  }

  async upsertLeakCheck(userId: string, data: { checkNumber: number; found: boolean; leakAmount?: number; fixPlan?: string }) {
    const business = await this.getBusiness(userId);

    return this.prisma.leakCheck.upsert({
      where: { businessId_checkNumber: { businessId: business.id, checkNumber: data.checkNumber } },
      create: {
        businessId: business.id,
        checkNumber: data.checkNumber,
        found: data.found,
        leakAmount: data.leakAmount,
        fixPlan: data.fixPlan,
      },
      update: {
        found: data.found,
        leakAmount: data.leakAmount,
        fixPlan: data.fixPlan,
      },
    });
  }
}
