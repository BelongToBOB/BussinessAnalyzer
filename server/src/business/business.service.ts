import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from '../common/validation';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  /** Ensure user exists in DB — create if missing (defensive for JWT-only auth) */
  private async ensureUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      await this.prisma.user.create({
        data: { id: userId, name: 'User', email: null },
      });
    }
  }

  async get(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('No business found.');
    return business;
  }

  async create(userId: string, dto: CreateBusinessDto) {
    await this.ensureUser(userId);

    const existing = await this.prisma.business.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Business already exists. Use PATCH to update.');

    return this.prisma.business.create({
      data: { userId, name: dto.name, monthlyDebtService: dto.monthlyDebtService },
    });
  }

  async update(userId: string, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('No business found.');

    return this.prisma.business.update({
      where: { id: business.id },
      data: dto,
    });
  }

  async deleteAll(userId: string) {
    // Business has onDelete: Cascade → deletes MonthlyEntry, ExpenseItem, LeakCheck, SessionData
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (business) {
      await this.prisma.business.delete({ where: { id: business.id } });
    }

    // Delete activity logs
    await this.prisma.activityLog.deleteMany({ where: { userId } });

    // Delete user accounts + sessions
    await this.prisma.account.deleteMany({ where: { userId } });
    await this.prisma.session.deleteMany({ where: { userId } });

    // Delete user
    await this.prisma.user.deleteMany({ where: { id: userId } });

    return { deleted: true };
  }
}
