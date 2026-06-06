import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://analyzer_user:devpassword123@localhost:5432/winwin_analyzer',
});
const prisma = new PrismaClient({ adapter });

const SAMPLE_MONTHS = [
  {
    month: new Date('2026-05-01'), grossSales: 500000, creditSales: 150000,
    cogs: 300000, otherExpenses: 135000, cashIn: 380000,
    arBalance: 220000, apBalance: 160000, cashOnHand: 280000,
    leakNote: 'ค่าขนส่งเกินงบ — 18,000 บาท',
  },
  {
    month: new Date('2026-04-01'), grossSales: 480000, creditSales: 120000,
    cogs: 280000, otherExpenses: 130000, cashIn: 400000,
    arBalance: 180000, apBalance: 150000, cashOnHand: 320000,
    leakNote: 'ค่าโฆษณา Facebook เกินงบ 12,000',
  },
  {
    month: new Date('2026-03-01'), grossSales: 620000, creditSales: 60000,
    cogs: 310000, otherExpenses: 100000, cashIn: 590000,
    arBalance: 80000, apBalance: 120000, cashOnHand: 450000,
    leakNote: null,
  },
  {
    month: new Date('2026-02-01'), grossSales: 380000, creditSales: 250000,
    cogs: 290000, otherExpenses: 145000, cashIn: 190000,
    arBalance: 310000, apBalance: 240000, cashOnHand: 120000,
    leakNote: 'คืนสินค้า 24,000 · ค่าโฆษณาไม่คุ้ม 35,000',
  },
  {
    month: new Date('2026-01-01'), grossSales: 550000, creditSales: 100000,
    cogs: 290000, otherExpenses: 120000, cashIn: 480000,
    arBalance: 150000, apBalance: 130000, cashOnHand: 400000,
    leakNote: null,
  },
  {
    month: new Date('2025-12-01'), grossSales: 520000, creditSales: 130000,
    cogs: 300000, otherExpenses: 110000, cashIn: 450000,
    arBalance: 170000, apBalance: 140000, cashOnHand: 380000,
    leakNote: 'จ่ายโบนัสพนักงาน 30,000',
  },
];

async function main() {
  console.log('🌱 Seeding InsideBank Tools dev database...\n');

  // Upsert dev user
  const user = await prisma.user.upsert({
    where: { id: 'dev-user' },
    update: {},
    create: {
      id: 'dev-user',
      email: 'dev@test.com',
      name: 'Dev User',
    },
  });
  console.log(`✓ User: ${user.name} (${user.email})`);

  // Upsert dev account link
  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: 'credentials', providerAccountId: 'dev@test.com' } },
    update: {},
    create: {
      userId: user.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: 'dev@test.com',
    },
  });
  console.log('✓ Account linked');

  // Upsert business
  const business = await prisma.business.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: 'บริษัท วินวิน จำกัด',
      monthlyDebtService: 45000,
    },
  });
  console.log(`✓ Business: ${business.name} (debt: 45,000/mo)`);

  // Upsert monthly entries
  for (const entry of SAMPLE_MONTHS) {
    await prisma.monthlyEntry.upsert({
      where: { businessId_month: { businessId: business.id, month: entry.month } },
      update: entry,
      create: { businessId: business.id, ...entry },
    });
    const m = entry.month.toISOString().slice(0, 7);
    console.log(`✓ Entry: ${m} — sales ${(entry.grossSales / 1000).toFixed(0)}k`);
  }

  // Activity log
  await prisma.activityLog.create({
    data: { userId: user.id, action: 'seed', meta: { months: SAMPLE_MONTHS.length } },
  });

  console.log(`\n🎉 Seed complete! ${SAMPLE_MONTHS.length} months of data ready.`);
  console.log('   Login with any email at http://localhost:3001/login');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
