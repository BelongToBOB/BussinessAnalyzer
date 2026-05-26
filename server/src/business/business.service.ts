import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from '../common/validation';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('No business found.');
    return business;
  }

  async create(userId: string, dto: CreateBusinessDto) {
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
}
