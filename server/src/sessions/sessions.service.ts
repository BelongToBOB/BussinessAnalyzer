import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionType } from '@prisma/client';
import { parseMonth } from '../common/validation';

import { computeS1 } from './formulas/s1-check-cash';
import { computeS2a } from './formulas/s2-income-statement';
import { computeS2b } from './formulas/s2-cashflow-2yr';
import { computeS3 } from './formulas/s3-cashflow-4layers';
import { computeS4a } from './formulas/s4-pricing';
import { computeS4b } from './formulas/s4-cm';
import { computeS4c } from './formulas/s4-real-profit';
import { computeS6 } from './formulas/s6-five-buckets';
import { computeS7 } from './formulas/s7-business-plan';

// Map URL slugs to enum values
const TYPE_MAP: Record<string, SessionType> = {
  's1': SessionType.S1_CHECK_CASH,
  's2a': SessionType.S2A_INCOME_STATEMENT,
  's2b': SessionType.S2B_CASHFLOW_2YR,
  's3': SessionType.S3_CASHFLOW_4LAYERS,
  's4a': SessionType.S4A_PRICING,
  's4b': SessionType.S4B_CM,
  's4c': SessionType.S4C_REAL_PROFIT,
  's6': SessionType.S6_FIVE_BUCKETS,
  's7': SessionType.S7_BUSINESS_PLAN,
};

// Sessions that require a month
const MONTHLY_SESSIONS = new Set<SessionType>([
  SessionType.S1_CHECK_CASH,
  SessionType.S3_CASHFLOW_4LAYERS,
]);

function resolveType(slug: string): SessionType {
  const t = TYPE_MAP[slug.toLowerCase()];
  if (!t) throw new BadRequestException(`Unknown session type: ${slug}. Valid: ${Object.keys(TYPE_MAP).join(', ')}`);
  return t;
}

function computeSession(sessionType: SessionType, data: any): { computed: any; verdict: string } {
  switch (sessionType) {
    case SessionType.S1_CHECK_CASH: {
      const r = computeS1(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    case SessionType.S2A_INCOME_STATEMENT: {
      const r = computeS2a(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    case SessionType.S2B_CASHFLOW_2YR: {
      const r = computeS2b(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    case SessionType.S3_CASHFLOW_4LAYERS: {
      const r = computeS3(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    case SessionType.S4A_PRICING: {
      const r = computeS4a(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    case SessionType.S4B_CM: {
      const r = computeS4b(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    case SessionType.S4C_REAL_PROFIT: {
      const r = computeS4c(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    case SessionType.S6_FIVE_BUCKETS: {
      const r = computeS6(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    case SessionType.S7_BUSINESS_PLAN: {
      const r = computeS7(data);
      return { computed: r.computed, verdict: r.verdict };
    }
    default:
      throw new BadRequestException(`No formula for session type: ${sessionType}`);
  }
}

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  private async getBusiness(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('Business not found. Complete onboarding first.');
    return business;
  }

  // Removed findSessionWhere — use inline queries instead (nullable month in compound unique is tricky)

  async get(userId: string, typeSlug: string, yyyyMm?: string) {
    const business = await this.getBusiness(userId);
    const sessionType = resolveType(typeSlug);
    const month = yyyyMm ? parseMonth(yyyyMm) : null;

    let record;
    if (month) {
      record = await this.prisma.sessionData.findUnique({
        where: {
          businessId_sessionType_month: {
            businessId: business.id,
            sessionType,
            month,
          },
        },
      });
    } else {
      record = await this.prisma.sessionData.findFirst({
        where: {
          businessId: business.id,
          sessionType,
          month: null,
        },
      });
    }

    if (!record) throw new NotFoundException(`No ${typeSlug} data found${yyyyMm ? ` for ${yyyyMm}` : ''}`);

    return {
      sessionType: typeSlug,
      month: yyyyMm ?? null,
      data: record.data,
      computed: record.computed,
      verdict: record.verdict,
      updatedAt: record.updatedAt,
    };
  }

  async upsert(userId: string, typeSlug: string, body: any, yyyyMm?: string) {
    const business = await this.getBusiness(userId);
    const sessionType = resolveType(typeSlug);
    const month = yyyyMm ? parseMonth(yyyyMm) : null;

    // Validate monthly requirement
    if (MONTHLY_SESSIONS.has(sessionType) && !month) {
      throw new BadRequestException(`Session ${typeSlug} requires a month parameter`);
    }

    // Compute server-side
    const { computed, verdict } = computeSession(sessionType, body);

    let record;
    if (month) {
      record = await this.prisma.sessionData.upsert({
        where: {
          businessId_sessionType_month: {
            businessId: business.id,
            sessionType,
            month,
          },
        },
        create: {
          businessId: business.id,
          sessionType,
          month,
          data: body,
          computed,
          verdict,
        },
        update: {
          data: body,
          computed,
          verdict,
        },
      });
    } else {
      // Non-monthly: find existing or create
      const existing = await this.prisma.sessionData.findFirst({
        where: { businessId: business.id, sessionType, month: null },
      });
      if (existing) {
        record = await this.prisma.sessionData.update({
          where: { id: existing.id },
          data: { data: body, computed, verdict },
        });
      } else {
        record = await this.prisma.sessionData.create({
          data: {
            businessId: business.id,
            sessionType,
            month: null,
            data: body,
            computed,
            verdict,
          },
        });
      }
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: `session_${typeSlug}_upserted`,
        meta: { month: yyyyMm ?? null },
      },
    });

    return {
      sessionType: typeSlug,
      month: yyyyMm ?? null,
      data: record.data,
      computed: record.computed,
      verdict: record.verdict,
      updatedAt: record.updatedAt,
    };
  }

  async list(userId: string, typeSlug: string) {
    const business = await this.getBusiness(userId);
    const sessionType = resolveType(typeSlug);

    const records = await this.prisma.sessionData.findMany({
      where: { businessId: business.id, sessionType },
      orderBy: { month: 'desc' },
    });

    return records.map((r: any) => ({
      sessionType: typeSlug,
      month: r.month ? `${r.month.getFullYear()}-${String(r.month.getMonth() + 1).padStart(2, '0')}` : null,
      data: r.data,
      computed: r.computed,
      verdict: r.verdict,
      updatedAt: r.updatedAt,
    }));
  }
}
