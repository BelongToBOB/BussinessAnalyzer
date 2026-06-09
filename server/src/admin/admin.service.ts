import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { computeDashboard, toInputs } from '../formulas/dashboard.js';
import type { DashboardResult, VerdictLevel } from '../formulas/dashboard.js';

export interface Alert {
  level: 'critical' | 'warn';
  message: string;
}

export interface UserRow {
  userId: string;
  businessId: string;
  businessName: string;
  template: string;
  email: string | null;
  createdAt: Date;
  verdictLevel: VerdictLevel | 'inactive';
  netProfit: number | null;
  runway: number | null;
  grossMarginPct: number | null;
  opexPct: number | null;
  lastActiveDate: Date | null;
  toolsCompleted: number;
  alerts: Alert[];
  // IB-specific
  ibScore: number | null;
  ibDscr: number | null;
  ibGrowthCash: number | null;
}

function moneyThai(n: number): string {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n);
}

function calculateAlerts(
  dashboards: { month: string; dashboard: DashboardResult }[],
  lastEntryDate: Date | null,
): Alert[] {
  const alerts: Alert[] = [];
  if (dashboards.length === 0) return alerts;

  const latest = dashboards[dashboards.length - 1].dashboard;

  // Runway checks
  const runway = latest.boxes['10_runway']?.months;
  if (runway != null) {
    if (runway < 1) {
      alerts.push({ level: 'critical', message: `Cash Runway ${runway.toFixed(1)} เดือน (< 1 เดือน)` });
    } else if (runway < 3) {
      alerts.push({ level: 'warn', message: `Cash Runway ${runway.toFixed(1)} เดือน (< 3 เดือน)` });
    }
  }

  // Net profit checks
  const npValues = dashboards.map((d) => {
    const v = d.dashboard.boxes['4_netProfit']?.value;
    return typeof v === 'number' ? v : null;
  });

  // Last 2 months both negative NP
  if (npValues.length >= 2) {
    const last2 = npValues.slice(-2);
    if (last2[0] != null && last2[0] < 0 && last2[1] != null && last2[1] < 0) {
      alerts.push({ level: 'critical', message: 'ขาดทุน 2 เดือนติด' });
    }
  }

  // NP declining 3 months straight
  if (npValues.length >= 3) {
    const last3 = npValues.slice(-3);
    if (
      last3[0] != null && last3[1] != null && last3[2] != null &&
      last3[1] < last3[0] && last3[2] < last3[1]
    ) {
      alerts.push({ level: 'warn', message: 'กำไรลดลง 3 เดือนติด' });
    }
  }

  // Cash In < 50% of sales
  const latestCashIn = latest.boxes['7_cashIn']?.value;
  const latestSales = latest.boxes['1_grossSales']?.value;
  if (
    typeof latestCashIn === 'number' && typeof latestSales === 'number' &&
    latestSales > 0 && latestCashIn / latestSales < 0.5
  ) {
    alerts.push({
      level: 'critical',
      message: `Cash In เพียง ${((latestCashIn / latestSales) * 100).toFixed(0)}% ของยอดขาย`,
    });
  }

  // OPEX > 35%
  const opex = latest.boxes['5_expenseRatio']?.value;
  if (typeof opex === 'number' && opex > 0.35) {
    alerts.push({
      level: 'warn',
      message: `OPEX ${(opex * 100).toFixed(0)}% ของยอดขาย (> 35%)`,
    });
  }

  // Inactive > 2 months
  if (lastEntryDate) {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    if (lastEntryDate < twoMonthsAgo) {
      const diffMs = Date.now() - lastEntryDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      alerts.push({ level: 'warn', message: `ไม่ใช้งาน ${diffDays} วัน` });
    }
  } else {
    alerts.push({ level: 'warn', message: 'ไม่เคยกรอกข้อมูล' });
  }

  return alerts;
}

function overallVerdict(alerts: Alert[], lastEntryDate: Date | null): VerdictLevel | 'inactive' {
  // Check inactive first
  if (lastEntryDate) {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    if (lastEntryDate < twoMonthsAgo) return 'inactive';
  } else {
    return 'inactive';
  }

  if (alerts.some((a) => a.level === 'critical')) return 'critical';
  if (alerts.some((a) => a.level === 'warn')) return 'warning';
  return 'ok';
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const businesses = await this.prisma.business.findMany({
      include: {
        user: true,
        monthlyEntries: { orderBy: { month: 'desc' } },
        sessionData: true,
      },
    });

    const now = new Date();
    const thisMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    let activeThisMonth = 0;
    let inactiveCount = 0;
    let criticalCount = 0;
    let warnCount = 0;
    let goodCount = 0;

    // Tool usage counts
    const toolCounts: Record<string, number> = {};

    for (const biz of businesses) {
      const entries = biz.monthlyEntries;
      const lastEntry = entries.length > 0 ? entries[0] : null;

      // Active this month: has entry updated or created this month
      if (lastEntry && lastEntry.updatedAt >= thisMonthStart) {
        activeThisMonth++;
      }

      // Inactive check
      const lastEntryDate = lastEntry?.updatedAt ?? null;
      if (!lastEntryDate || lastEntryDate < twoMonthsAgo) {
        inactiveCount++;
      }

      // Compute dashboards for last 6 months
      const recentEntries = entries.slice(0, 6).reverse();
      const dashboards = recentEntries.map((e) => {
        const inputs = toInputs(e);
        const dashboard = computeDashboard(inputs, {
          monthlyDebtService: Number(biz.monthlyDebtService ?? 0),
        });
        return { month: e.month.toISOString(), dashboard };
      });

      const alerts = calculateAlerts(dashboards, lastEntryDate);
      const verdict = overallVerdict(alerts, lastEntryDate);

      if (verdict === 'critical') criticalCount++;
      else if (verdict === 'warning') warnCount++;
      else if (verdict === 'ok') goodCount++;

      // Count tool completions
      for (const sd of biz.sessionData) {
        toolCounts[sd.sessionType] = (toolCounts[sd.sessionType] || 0) + 1;
      }
    }

    // Sort tools by usage
    const mostUsedTools = Object.entries(toolCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tool, count]) => ({ tool, count }));

    const ibfCount = businesses.filter(b => (b as any).template !== 'ib').length;
    const ibCount = businesses.filter(b => (b as any).template === 'ib').length;

    return {
      totalUsers: businesses.length,
      ibfUsers: ibfCount,
      ibUsers: ibCount,
      activeThisMonth,
      inactiveOver2Months: inactiveCount,
      criticalCount,
      healthDistribution: {
        good: goodCount,
        warn: warnCount,
        critical: criticalCount,
        inactive: inactiveCount,
      },
      mostUsedTools,
    };
  }

  async getUserList(filter?: { status?: string; search?: string; sort?: string }) {
    const businesses = await this.prisma.business.findMany({
      include: {
        user: true,
        monthlyEntries: { orderBy: { month: 'desc' } },
        sessionData: true,
        expenseItems: true,
      },
    });

    const rows: UserRow[] = [];

    for (const biz of businesses) {
      const entries = biz.monthlyEntries;
      const lastEntry = entries.length > 0 ? entries[0] : null;
      const lastEntryDate = lastEntry?.updatedAt ?? null;

      // Compute dashboards for last 6 months
      const recentEntries = entries.slice(0, 6).reverse();
      const dashboards = recentEntries.map((e) => {
        const inputs = toInputs(e);
        const dashboard = computeDashboard(inputs, {
          monthlyDebtService: Number(biz.monthlyDebtService ?? 0),
        });
        return { month: e.month.toISOString(), dashboard };
      });

      const alerts = calculateAlerts(dashboards, lastEntryDate);
      const verdict = overallVerdict(alerts, lastEntryDate);

      // Latest dashboard values
      const latestDash = dashboards.length > 0 ? dashboards[dashboards.length - 1].dashboard : null;

      const np = latestDash?.boxes['4_netProfit']?.value;
      const runway = latestDash?.boxes['10_runway']?.months ?? null;
      const gm = latestDash?.boxes['3_grossMargin']?.value;
      const opex = latestDash?.boxes['5_expenseRatio']?.value;

      // Count distinct session types completed
      const sessionTypes = new Set(biz.sessionData.map((s) => s.sessionType));
      // Add expense map if has items
      const toolsCompleted = sessionTypes.size + (biz.expenseItems.length > 0 ? 1 : 0);

      // IB-specific data
      let ibScore: number | null = null;
      let ibDscr: number | null = null;
      let ibGrowthCash: number | null = null;
      const ibFinancial = biz.sessionData.find((s: any) => s.sessionType === 'IB_FINANCIAL_MRI');
      const ibCash = biz.sessionData.find((s: any) => s.sessionType === 'IB_CASH_DNA');
      if (ibFinancial?.computed) {
        const c = ibFinancial.computed as any;
        ibDscr = c.dscr ?? null;
        ibScore = c.score ?? null;
      }
      if (ibCash?.computed) {
        ibGrowthCash = (ibCash.computed as any).growthCash ?? null;
      }

      rows.push({
        userId: biz.userId,
        businessId: biz.id,
        businessName: biz.name,
        template: (biz as any).template || 'ibf',
        email: biz.user?.email ?? null,
        createdAt: biz.createdAt,
        verdictLevel: verdict,
        netProfit: typeof np === 'number' ? np : null,
        runway,
        grossMarginPct: typeof gm === 'number' ? gm : null,
        opexPct: typeof opex === 'number' ? opex : null,
        lastActiveDate: lastEntryDate,
        toolsCompleted,
        alerts,
        ibScore,
        ibDscr,
        ibGrowthCash,
      });
    }

    // Filter
    let filtered = rows;
    if (filter?.status) {
      const statusMap: Record<string, (VerdictLevel | 'inactive')[]> = {
        critical: ['critical'],
        warn: ['warning'],
        good: ['ok'],
        inactive: ['inactive'],
      };
      const allowed = statusMap[filter.status];
      if (allowed) {
        filtered = filtered.filter((r) => allowed.includes(r.verdictLevel));
      }
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter((r) => r.businessName.toLowerCase().includes(q));
    }

    // Sort
    switch (filter?.sort) {
      case 'runway':
        filtered.sort((a, b) => (a.runway ?? -1) - (b.runway ?? -1));
        break;
      case 'netprofit':
        filtered.sort((a, b) => (a.netProfit ?? -Infinity) - (b.netProfit ?? -Infinity));
        break;
      case 'lastactive':
        filtered.sort((a, b) => {
          const at = a.lastActiveDate?.getTime() ?? 0;
          const bt = b.lastActiveDate?.getTime() ?? 0;
          return at - bt; // oldest first
        });
        break;
      default:
        // Default: critical first, then warn, then good, then inactive
        const order: Record<string, number> = { critical: 0, warning: 1, ok: 2, inactive: 3 };
        filtered.sort((a, b) => (order[a.verdictLevel] ?? 9) - (order[b.verdictLevel] ?? 9));
    }

    return filtered;
  }

  async getUserDetail(userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { userId },
      include: {
        user: true,
        monthlyEntries: { orderBy: { month: 'desc' }, take: 6 },
        sessionData: { orderBy: { updatedAt: 'desc' } },
        expenseItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!business) {
      // Try finding by business ID directly
      const bizById = await this.prisma.business.findUnique({
        where: { id: userId },
        include: {
          user: true,
          monthlyEntries: { orderBy: { month: 'desc' }, take: 6 },
          sessionData: { orderBy: { updatedAt: 'desc' } },
          expenseItems: { orderBy: { sortOrder: 'asc' } },
        },
      });
      if (!bizById) {
        throw new Error('Business not found');
      }
      return this.buildUserDetail(bizById);
    }

    return this.buildUserDetail(business);
  }

  private buildUserDetail(business: any) {
    const bizConfig = { monthlyDebtService: Number(business.monthlyDebtService ?? 0) };

    // Compute dashboard for each month
    const entries = business.monthlyEntries as any[];
    const monthlyDashboards = entries.reverse().map((e: any) => {
      const inputs = toInputs(e);
      const dashboard = computeDashboard(inputs, bizConfig);
      const yyyyMm = `${e.month.getFullYear()}-${String(e.month.getMonth() + 1).padStart(2, '0')}`;
      return { month: yyyyMm, dashboard, updatedAt: e.updatedAt };
    });

    const lastEntryDate = entries.length > 0 ? entries[entries.length - 1]?.updatedAt : null;
    const alerts = calculateAlerts(
      monthlyDashboards.map((d) => ({ month: d.month, dashboard: d.dashboard })),
      lastEntryDate,
    );
    const verdict = overallVerdict(alerts, lastEntryDate);

    // Latest dashboard
    const latestDash = monthlyDashboards.length > 0
      ? monthlyDashboards[monthlyDashboards.length - 1].dashboard
      : null;

    // Session completions
    const sessions = (business.sessionData as any[]).map((s: any) => ({
      sessionType: s.sessionType,
      month: s.month
        ? `${s.month.getFullYear()}-${String(s.month.getMonth() + 1).padStart(2, '0')}`
        : null,
      verdict: s.verdict,
      updatedAt: s.updatedAt,
    }));

    // Expense map summary
    const expenseItems = business.expenseItems as any[];
    const expenseTotal = expenseItems.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const expenseByCategory = {
      invest: expenseItems.filter((i: any) => i.category === 'ลงทุน').reduce((s: number, i: any) => s + Number(i.amount), 0),
      operate: expenseItems.filter((i: any) => i.category === 'ดำเนินงาน').reduce((s: number, i: any) => s + Number(i.amount), 0),
      waste: expenseItems.filter((i: any) => i.category === 'สูญเปล่า').reduce((s: number, i: any) => s + Number(i.amount), 0),
    };

    // Trend data for chart
    const trends = monthlyDashboards.map((d) => ({
      month: d.month,
      np: typeof d.dashboard.boxes['4_netProfit']?.value === 'number'
        ? d.dashboard.boxes['4_netProfit'].value
        : null,
      rw: d.dashboard.boxes['10_runway']?.months ?? null,
      gm: typeof d.dashboard.boxes['3_grossMargin']?.value === 'number'
        ? (d.dashboard.boxes['3_grossMargin'].value as number) * 100
        : null,
    }));

    // Latest key metrics
    const np = latestDash?.boxes['4_netProfit']?.value;
    const sales = latestDash?.boxes['1_grossSales']?.value;
    const gm = latestDash?.boxes['3_grossMargin']?.value;
    const opex = latestDash?.boxes['5_expenseRatio']?.value;
    const runway = latestDash?.boxes['10_runway']?.months ?? null;

    // Completed session types
    const completedTypes = new Set((business.sessionData as any[]).map((s: any) => s.sessionType));
    if (expenseItems.length > 0) completedTypes.add('EXPENSE_MAP');

    // IB metrics
    const ibFinancial = (business.sessionData as any[]).find((s: any) => s.sessionType === 'IB_FINANCIAL_MRI');
    const ibCash = (business.sessionData as any[]).find((s: any) => s.sessionType === 'IB_CASH_DNA');
    const ibMetrics = {
      dscr: (ibFinancial?.computed as any)?.dscr ?? null,
      de: (ibFinancial?.computed as any)?.de ?? null,
      ebitdaMargin: (ibFinancial?.computed as any)?.ebitdaMargin ?? null,
      financialScore: (ibFinancial?.computed as any)?.score ?? null,
      growthCash: (ibCash?.computed as any)?.growthCash ?? null,
      cashDnaScore: (ibCash?.computed as any)?.score ?? null,
    };

    return {
      userId: business.userId,
      businessId: business.id,
      businessName: business.name,
      template: business.template || 'ibf',
      email: business.user?.email ?? null,
      userName: business.user?.name ?? business.user?.lineDisplayName ?? null,
      createdAt: business.createdAt,
      monthlyDebtService: bizConfig.monthlyDebtService,
      verdictLevel: verdict,
      keyMetrics: {
        sales: typeof sales === 'number' ? sales : null,
        grossMarginPct: typeof gm === 'number' ? gm : null,
        netProfit: typeof np === 'number' ? np : null,
        opexPct: typeof opex === 'number' ? opex : null,
        runway,
      },
      alerts,
      trends,
      monthlyDashboards: monthlyDashboards.map((d) => ({
        month: d.month,
        boxes: d.dashboard.boxes,
        verdict: d.dashboard.verdict,
        updatedAt: d.updatedAt,
      })),
      sessions,
      completedSessionTypes: Array.from(completedTypes),
      expenseSummary: {
        total: expenseTotal,
        byCategory: expenseByCategory,
        itemCount: expenseItems.length,
      },
      lastActiveDate: lastEntryDate,
      ibMetrics,
    };
  }

  async generateSummary(userId: string): Promise<string> {
    const detail = await this.getUserDetail(userId);

    const statusEmoji: Record<string, string> = {
      critical: '\uD83D\uDD34 วิกฤต',
      warning: '\uD83D\uDFE1 ระวัง',
      ok: '\uD83D\uDFE2 ดี',
      inactive: '\uD83D\uDCF5 ไม่ใช้งาน',
    };

    const lines: string[] = [];
    lines.push(`\uD83D\uDCCA ${detail.businessName}`);
    lines.push(`สถานะ: ${statusEmoji[detail.verdictLevel] ?? detail.verdictLevel}`);
    lines.push('');

    const km = detail.keyMetrics;
    if (km.sales != null) lines.push(`ยอดขาย: ${moneyThai(km.sales)} บาท`);
    if (km.grossMarginPct != null) lines.push(`Gross Margin: ${(km.grossMarginPct * 100).toFixed(0)}%`);
    if (km.netProfit != null) {
      const npLabel = km.netProfit >= 0 ? 'กำไร' : 'ขาดทุน';
      lines.push(`${npLabel}: ${moneyThai(Math.abs(km.netProfit))} บาท${km.netProfit < 0 ? ' (ขาดทุน)' : ''}`);
    }
    if (km.opexPct != null) lines.push(`OPEX: ${(km.opexPct * 100).toFixed(0)}% ของยอดขาย`);
    if (km.runway != null) lines.push(`Cash Runway: ${km.runway.toFixed(1)} เดือน`);

    if (detail.alerts.length > 0) {
      lines.push('');
      lines.push('\u26A0\uFE0F สัญญาณเตือน:');
      for (const a of detail.alerts) {
        lines.push(`\u2022 ${a.message}`);
      }
    }

    lines.push('');
    const totalTools = 10;
    const completedCount = detail.completedSessionTypes.length;
    lines.push(`เครื่องมือที่ทำ: ${completedCount}/${totalTools}`);

    if (detail.lastActiveDate) {
      const diffMs = Date.now() - new Date(detail.lastActiveDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      lines.push(`กรอกล่าสุด: ${diffDays === 0 ? 'วันนี้' : `${diffDays} วันที่แล้ว`}`);
    } else {
      lines.push('กรอกล่าสุด: ยังไม่เคยกรอก');
    }

    return lines.join('\n');
  }

  async getAlerts() {
    const users = await this.getUserList({ sort: 'runway' });

    const alertUsers = users
      .filter((u) => u.alerts.length > 0)
      .sort((a, b) => {
        // Critical first
        const aMax = a.alerts.some((al) => al.level === 'critical') ? 0 : 1;
        const bMax = b.alerts.some((al) => al.level === 'critical') ? 0 : 1;
        if (aMax !== bMax) return aMax - bMax;
        // Then by number of alerts
        return b.alerts.length - a.alerts.length;
      });

    return alertUsers.map((u) => ({
      userId: u.userId,
      businessId: u.businessId,
      businessName: u.businessName,
      verdictLevel: u.verdictLevel,
      alerts: u.alerts,
      netProfit: u.netProfit,
      runway: u.runway,
      lastActiveDate: u.lastActiveDate,
    }));
  }
}
