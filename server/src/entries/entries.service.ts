import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeDashboard, toInputs } from '../formulas/dashboard';
import { UpsertEntryDto, parseMonth } from '../common/validation';

@Injectable()
export class EntriesService {
  constructor(private prisma: PrismaService) {}

  private async getBusiness(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('Business not found. Complete onboarding first.');
    return business;
  }

  async list(userId: string, months = 12) {
    const business = await this.getBusiness(userId);
    return this.prisma.monthlyEntry.findMany({
      where: { businessId: business.id },
      orderBy: { month: 'desc' },
      take: months,
    });
  }

  async getWithDashboard(userId: string, yyyyMm: string) {
    const business = await this.getBusiness(userId);
    const month = parseMonth(yyyyMm);
    const bizConfig = { monthlyDebtService: Number(business.monthlyDebtService ?? 0) };

    const entry = await this.prisma.monthlyEntry.findUnique({
      where: { businessId_month: { businessId: business.id, month } },
    });

    if (!entry) throw new NotFoundException(`No entry for ${yyyyMm}`);

    const inputs = toInputs(entry);
    const dashboard = computeDashboard(inputs, bizConfig);

    // Previous month for delta comparison
    const prevMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1));
    const prevEntry = await this.prisma.monthlyEntry.findUnique({
      where: { businessId_month: { businessId: business.id, month: prevMonth } },
    });

    let prevDashboard = null;
    if (prevEntry) {
      const prevInputs = toInputs(prevEntry);
      prevDashboard = computeDashboard(prevInputs, bizConfig);
    }

    return { month: yyyyMm, inputs, ...dashboard, prevMonth: prevDashboard };
  }

  async upsert(userId: string, yyyyMm: string, dto: UpsertEntryDto) {
    const business = await this.getBusiness(userId);
    const month = parseMonth(yyyyMm);

    const entry = await this.prisma.monthlyEntry.upsert({
      where: { businessId_month: { businessId: business.id, month } },
      create: {
        businessId: business.id,
        month,
        ...dto,
      },
      update: dto,
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'entry_upserted',
        meta: { month: yyyyMm },
      },
    });

    return entry;
  }

  async delete(userId: string, yyyyMm: string) {
    const business = await this.getBusiness(userId);
    const month = parseMonth(yyyyMm);

    const entry = await this.prisma.monthlyEntry.findUnique({
      where: { businessId_month: { businessId: business.id, month } },
    });
    if (!entry) throw new NotFoundException(`No entry for ${yyyyMm}`);

    await this.prisma.monthlyEntry.delete({ where: { id: entry.id } });
    return { deleted: true };
  }

  async trends(userId: string, months = 12) {
    const business = await this.getBusiness(userId);
    const entries = await this.prisma.monthlyEntry.findMany({
      where: { businessId: business.id },
      orderBy: { month: 'asc' },
      take: months,
    });

    return entries.map((entry) => {
      const inputs = toInputs(entry);
      const dashboard = computeDashboard(inputs, {
        monthlyDebtService: Number(business.monthlyDebtService ?? 0),
      });
      const yyyyMm = `${entry.month.getFullYear()}-${String(entry.month.getMonth() + 1).padStart(2, '0')}`;
      return { month: yyyyMm, ...dashboard };
    });
  }
}
