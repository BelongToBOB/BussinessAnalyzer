import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigLoaderService } from './engine/config-loader.service';
import {
  calcMindsetScore,
  calcS02Derived, calcHealthScore,
  calcS03Month, calcS03Summary,
  calcS04, calcLoanReadinessScore, calcPlanCompleteness,
  calcDealScores, calcFrs, newAnnualDebt,
  type S02Input, type S03MonthInput, type DealInput, type EngineConfig,
} from './engine/formula-engine';

/** Convert Prisma Decimal to number */
const n = (v: any): number => v != null ? Number(v) : 0;
const nNull = (v: any): number | null => v != null ? Number(v) : null;

@Injectable()
export class ReadinessService {
  constructor(
    private prisma: PrismaService,
    private configLoader: ConfigLoaderService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────

  private async verifyOwnership(userId: string, assessmentId: string) {
    const assessment = await this.prisma.rdAssessment.findUnique({
      where: { id: assessmentId },
      include: { business: true },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.business.userId !== userId) throw new ForbiddenException('Unauthorized');
    return assessment;
  }

  private async markSessionCompleted(assessmentId: string, sessionNum: number) {
    const assessment = await this.prisma.rdAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return;

    const flags: Record<string, boolean> = (assessment.completedFlags as any) ?? {};
    flags[`s${sessionNum}`] = true;

    const nextSession = Math.max(assessment.currentSession ?? 1, sessionNum + 1);
    const status = flags.s6 ? 'completed' : 'in_progress';

    await this.prisma.rdAssessment.update({
      where: { id: assessmentId },
      data: {
        completedFlags: flags,
        currentSession: Math.min(nextSession, 6),
        status: status as any,
      },
    });
  }

  private async recomputeFrs(assessmentId: string, cfg: EngineConfig, profileOverride?: 'learning' | 'bank') {
    const [s1, s2h, s3sum, s4, s5, existing] = await Promise.all([
      this.prisma.rdS1Mindset.findUnique({ where: { assessmentId } }),
      this.prisma.rdS2Health.findUnique({ where: { assessmentId } }),
      this.prisma.rdS3Summary.findUnique({ where: { assessmentId } }),
      this.prisma.rdS4Loan.findUnique({ where: { assessmentId } }),
      this.prisma.rdS5Plan.findUnique({ where: { assessmentId } }),
      this.prisma.rdReadinessScore.findUnique({ where: { assessmentId } }),
    ]);

    const profile = profileOverride ?? (existing?.frsProfile === 'bank' ? 'bank' : 'learning');

    const frsResult = calcFrs({
      mindsetScore: s1?.ownerMindsetScore ?? 0,
      healthScore: s2h?.healthScore ?? 0,
      stabilityScore: s3sum?.stabilityScore ?? 0,
      capacityScore: s4?.capacityScore ?? 0,
      bankReadinessScore: s5?.loanReadinessScore ?? 0,
      profile,
    }, cfg);

    await this.prisma.rdReadinessScore.upsert({
      where: { assessmentId },
      create: {
        assessmentId,
        mindsetScore: s1?.ownerMindsetScore ?? 0,
        healthScore: s2h?.healthScore ?? 0,
        stabilityScore: s3sum?.stabilityScore ?? 0,
        capacityScore: s4?.capacityScore ?? 0,
        bankReadinessScore: s5?.loanReadinessScore ?? 0,
        frsProfile: profile as any,
        compositeFrs: frsResult.compositeFrs,
        frsBand: frsResult.frsBand,
      },
      update: {
        mindsetScore: s1?.ownerMindsetScore ?? 0,
        healthScore: s2h?.healthScore ?? 0,
        stabilityScore: s3sum?.stabilityScore ?? 0,
        capacityScore: s4?.capacityScore ?? 0,
        bankReadinessScore: s5?.loanReadinessScore ?? 0,
        frsProfile: profile as any,
        compositeFrs: frsResult.compositeFrs,
        frsBand: frsResult.frsBand,
        computedAt: new Date(),
      },
    });

    return frsResult;
  }

  // ─── Assessment CRUD ───────────────────────────────────────

  async createAssessment(userId: string, dto: any) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('Business not found. Create one first.');

    const assessment = await this.prisma.rdAssessment.create({
      data: {
        businessId: business.id,
        title: dto.title ?? `การประเมิน ${new Date().toLocaleDateString('th-TH')}`,
        status: 'draft',
        currentSession: 1,
        completedFlags: {},
      },
    });

    return assessment;
  }

  async listAssessments(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) return [];
    return this.prisma.rdAssessment.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssessment(userId: string, assessmentId: string) {
    const assessment = await this.verifyOwnership(userId, assessmentId);

    const [s1, s2Rows, s2h, s3Rows, s3sum, s4, s5, s5q, s6d, s6e, s6kpi, scores] = await Promise.all([
      this.prisma.rdS1Mindset.findUnique({ where: { assessmentId } }),
      this.prisma.rdS2Financial.findMany({ where: { assessmentId }, orderBy: { fiscalYear: 'asc' } }),
      this.prisma.rdS2Health.findUnique({ where: { assessmentId } }),
      this.prisma.rdS3Cashflow.findMany({ where: { assessmentId }, orderBy: { month: 'asc' } }),
      this.prisma.rdS3Summary.findUnique({ where: { assessmentId } }),
      this.prisma.rdS4Loan.findUnique({ where: { assessmentId } }),
      this.prisma.rdS5Plan.findUnique({ where: { assessmentId } }),
      this.prisma.rdS5BankQuestion.findMany({ where: { assessmentId }, orderBy: { qNo: 'asc' } }),
      this.prisma.rdS6Deal.findMany({ where: { assessmentId } }),
      this.prisma.rdS6Execution.findUnique({ where: { assessmentId } }),
      this.prisma.rdS6KpiTracker.findMany({ where: { assessmentId }, orderBy: { month: 'asc' } }),
      this.prisma.rdReadinessScore.findUnique({ where: { assessmentId } }),
    ]);

    return {
      assessment,
      s1, s2Financials: s2Rows, s2Health: s2h,
      s3Cashflows: s3Rows, s3Summary: s3sum,
      s4, s5, s5Questions: s5q,
      s6Deals: s6d, s6Execution: s6e, s6KpiTrackers: s6kpi,
      readinessScores: scores,
    };
  }

  // ─── S1: Mindset ───────────────────────────────────────────

  async saveS1(userId: string, assessmentId: string, dto: any) {
    await this.verifyOwnership(userId, assessmentId);

    const operatorFlags = dto.operatorFlags ?? {};
    const ownerFlags = dto.ownerFlags ?? {};
    const scores = calcMindsetScore(
      operatorFlags, ownerFlags,
      dto.leverageChoice ?? '',
      dto.expansionGoal ?? null,
      dto.loanPurpose ?? null,
    );

    await this.prisma.rdS1Mindset.upsert({
      where: { assessmentId },
      create: {
        assessmentId,
        operatorFlags, ownerFlags,
        annualRevenueEst: dto.annualRevenueEst,
        topFinancialPain: dto.topFinancialPain,
        expansionGoal: dto.expansionGoal,
        loanPurpose: dto.loanPurpose,
        financeLiteracy: dto.financeLiteracy,
        hasBorrowedBefore: dto.hasBorrowedBefore,
        biggestWorry: dto.biggestWorry,
        leverageChoice: dto.leverageChoice,
        leverageReason: dto.leverageReason,
        reflection: dto.reflection,
        ...scores,
      },
      update: {
        operatorFlags, ownerFlags,
        annualRevenueEst: dto.annualRevenueEst,
        topFinancialPain: dto.topFinancialPain,
        expansionGoal: dto.expansionGoal,
        loanPurpose: dto.loanPurpose,
        financeLiteracy: dto.financeLiteracy,
        hasBorrowedBefore: dto.hasBorrowedBefore,
        biggestWorry: dto.biggestWorry,
        leverageChoice: dto.leverageChoice,
        leverageReason: dto.leverageReason,
        reflection: dto.reflection,
        ...scores,
      },
    });

    if (dto.leverageChoice) {
      await this.markSessionCompleted(assessmentId, 1);
    }

    const cfg = await this.configLoader.loadConfig();
    await this.recomputeFrs(assessmentId, cfg);

    return { success: true, scores };
  }

  // ─── S2: Financial Health ──────────────────────────────────

  async saveS2(userId: string, assessmentId: string, dto: { years: any[] }) {
    await this.verifyOwnership(userId, assessmentId);
    const cfg = await this.configLoader.loadConfig();

    const sortedYears = [...dto.years].sort((a: any, b: any) => a.fiscalYear - b.fiscalYear);
    const derivedRows = sortedYears.map((y: any) => ({
      year: y,
      derived: calcS02Derived(y as S02Input),
    }));

    // Delete old rows and insert fresh
    await this.prisma.rdS2Financial.deleteMany({ where: { assessmentId } });

    for (let i = 0; i < sortedYears.length; i++) {
      const y = sortedYears[i];
      const d = derivedRows[i].derived;
      await this.prisma.rdS2Financial.create({
        data: {
          assessmentId,
          fiscalYear: y.fiscalYear,
          isLatest: i === sortedYears.length - 1,
          revenue: y.revenue, cogs: y.cogs, sgaExpense: y.sgaExpense,
          depreciation: y.depreciation, interestExpense: y.interestExpense,
          tax: y.tax, netProfit: y.netProfit,
          totalAssets: y.totalAssets, totalLiabilities: y.totalLiabilities,
          equity: y.equity, cash: y.cash,
          accountsReceivable: y.accountsReceivable,
          inventory: y.inventory, accountsPayable: y.accountsPayable,
          annualDebtService: y.annualDebtService,
          ebitda: d.ebitda, ebit: d.ebit,
          ebitdaMargin: d.ebitdaMargin, netMargin: d.netMargin,
          deRatio: d.deRatio, dscr: d.dscr,
          workingCapital: d.workingCapital,
        },
      });
    }

    // Health score
    const latest = derivedRows[derivedRows.length - 1];
    const prevY = sortedYears.length > 1 ? sortedYears[sortedYears.length - 2] : null;
    const latestY = sortedYears[sortedYears.length - 1];

    const revenueGrowth = prevY && prevY.revenue > 0
      ? ((latestY.revenue - prevY.revenue) / prevY.revenue) * 100 : null;
    const profitGrowth = prevY && prevY.netProfit !== 0
      ? ((latestY.netProfit - prevY.netProfit) / Math.abs(prevY.netProfit)) * 100 : null;

    const health = calcHealthScore(
      latest.derived, revenueGrowth, profitGrowth,
      prevY?.inventory ?? null, prevY?.revenue ?? null,
      prevY?.cash ?? null, prevY?.netProfit ?? null, cfg,
    );

    await this.prisma.rdS2Health.upsert({
      where: { assessmentId },
      create: { assessmentId, revenueGrowth, profitGrowth, healthScore: health.healthScore, status: health.status, redFlags: health.redFlags, passChecklist: health.passChecklist },
      update: { revenueGrowth, profitGrowth, healthScore: health.healthScore, status: health.status, redFlags: health.redFlags, passChecklist: health.passChecklist },
    });

    await this.markSessionCompleted(assessmentId, 2);
    await this.recomputeFrs(assessmentId, cfg);

    return { success: true, health, derivedRows: derivedRows.map(r => r.derived) };
  }

  // ─── S3: Cashflow ──────────────────────────────────────────

  async saveS3(userId: string, assessmentId: string, dto: { months: any[] }) {
    await this.verifyOwnership(userId, assessmentId);
    const cfg = await this.configLoader.loadConfig();

    const derivedMonths = dto.months.map((m: any) => calcS03Month(m as S03MonthInput));

    await this.prisma.rdS3Cashflow.deleteMany({ where: { assessmentId } });

    for (let i = 0; i < dto.months.length; i++) {
      const m = dto.months[i];
      const d = derivedMonths[i];
      await this.prisma.rdS3Cashflow.create({
        data: {
          assessmentId, month: m.month,
          salesRevenue: m.salesRevenue, cashSales: m.cashSales,
          collectedFromAr: m.collectedFromAr, otherIncome: m.otherIncome,
          cogsPaid: m.cogsPaid, rawMaterial: m.rawMaterial,
          rentUtilities: m.rentUtilities, salaries: m.salaries,
          debtPayment: m.debtPayment, taxPaid: m.taxPaid,
          ownerWithdrawal: m.ownerWithdrawal, reserve: m.reserve,
          cashIn: d.cashIn, realCash: d.realCash,
          surplusCash: d.surplusCash, growthCash: d.growthCash,
          realCashPct: d.realCashPct, collectionGap: d.collectionGap,
          collectionRate: d.collectionRate,
        },
      });
    }

    const summary = calcS03Summary(dto.months as S03MonthInput[], derivedMonths, cfg);
    const monthKeys = dto.months.map((m: any) => m.month);
    const tightestMonth = monthKeys[summary.tightestMonthIndex] ?? monthKeys[0];

    await this.prisma.rdS3Summary.upsert({
      where: { assessmentId },
      create: { assessmentId, avgMonthlySales: summary.avgMonthlySales, avgMonthlyCashIn: summary.avgMonthlyCashIn, avgRealCash: summary.avgRealCash, avgSurplus: summary.avgSurplus, avgGrowth: summary.avgGrowth, trend: summary.trend, tightestMonth, stabilityScore: summary.stabilityScore, warnings: summary.warnings },
      update: { avgMonthlySales: summary.avgMonthlySales, avgMonthlyCashIn: summary.avgMonthlyCashIn, avgRealCash: summary.avgRealCash, avgSurplus: summary.avgSurplus, avgGrowth: summary.avgGrowth, trend: summary.trend, tightestMonth, stabilityScore: summary.stabilityScore, warnings: summary.warnings },
    });

    await this.markSessionCompleted(assessmentId, 3);
    await this.recomputeFrs(assessmentId, cfg);

    return { success: true, summary, derivedMonths };
  }

  // ─── S4: Loan Sizing ───────────────────────────────────────

  async saveS4(userId: string, assessmentId: string, dto: any) {
    await this.verifyOwnership(userId, assessmentId);
    const cfg = await this.configLoader.loadConfig();

    const result = calcS04({
      annualRevenue: dto.annualRevenue,
      annualEbitda: dto.annualEbitda,
      existingMonthlyDebtService: dto.existingMonthlyDebtService,
      existingDebtBalance: dto.existingDebtBalance,
      collateralValue: dto.collateralValue,
      assumedRate: dto.assumedRate,
      assumedYears: dto.assumedYears,
      desiredLoan: dto.desiredLoan,
    }, cfg);

    await this.prisma.rdS4Loan.upsert({
      where: { assessmentId },
      create: {
        assessmentId,
        annualRevenue: dto.annualRevenue, annualEbitda: dto.annualEbitda,
        avgMonthlySales: dto.avgMonthlySales, avgMonthlyCashIn: dto.avgMonthlyCashIn,
        existingMonthlyDebtService: dto.existingMonthlyDebtService,
        existingDebtBalance: dto.existingDebtBalance,
        collateralValue: dto.collateralValue,
        totalInvestment: dto.totalInvestment, ownEquity: dto.ownEquity,
        desiredLoan: dto.desiredLoan,
        assumedRate: dto.assumedRate ?? cfg.DEFAULT_LOAN_RATE,
        assumedYears: dto.assumedYears ?? Math.round(cfg.DEFAULT_LOAN_YEARS),
        m1RevenueMultiple: result.m1RevenueMultiple,
        m2Reverse: result.m2Reverse, m3WorkingCapital: result.m3WorkingCapital,
        m4AssetBased: result.m4AssetBased,
        loanConservative: result.loanConservative, loanPractical: result.loanPractical,
        loanStretch: result.loanStretch, recommendedAmount: result.recommendedAmount,
        riskyThreshold: result.riskyThreshold,
        dscrBefore: result.dscrBefore, dscrAfter: result.dscrAfter,
        capacityScore: result.capacityScore, verdict: result.verdict,
      },
      update: {
        annualRevenue: dto.annualRevenue, annualEbitda: dto.annualEbitda,
        avgMonthlySales: dto.avgMonthlySales, avgMonthlyCashIn: dto.avgMonthlyCashIn,
        existingMonthlyDebtService: dto.existingMonthlyDebtService,
        existingDebtBalance: dto.existingDebtBalance,
        collateralValue: dto.collateralValue,
        totalInvestment: dto.totalInvestment, ownEquity: dto.ownEquity,
        desiredLoan: dto.desiredLoan,
        assumedRate: dto.assumedRate ?? cfg.DEFAULT_LOAN_RATE,
        assumedYears: dto.assumedYears ?? Math.round(cfg.DEFAULT_LOAN_YEARS),
        m1RevenueMultiple: result.m1RevenueMultiple,
        m2Reverse: result.m2Reverse, m3WorkingCapital: result.m3WorkingCapital,
        m4AssetBased: result.m4AssetBased,
        loanConservative: result.loanConservative, loanPractical: result.loanPractical,
        loanStretch: result.loanStretch, recommendedAmount: result.recommendedAmount,
        riskyThreshold: result.riskyThreshold,
        dscrBefore: result.dscrBefore, dscrAfter: result.dscrAfter,
        capacityScore: result.capacityScore, verdict: result.verdict,
      },
    });

    await this.markSessionCompleted(assessmentId, 4);
    await this.recomputeFrs(assessmentId, cfg);

    return { success: true, result };
  }

  // ─── S5: Bank Plan ─────────────────────────────────────────

  async saveS5(userId: string, assessmentId: string, dto: any) {
    await this.verifyOwnership(userId, assessmentId);
    const cfg = await this.configLoader.loadConfig();

    // Save questions
    if (dto.questions) {
      for (const q of dto.questions) {
        await this.prisma.rdS5BankQuestion.upsert({
          where: { assessmentId_qNo: { assessmentId, qNo: q.qNo } },
          create: { assessmentId, qNo: q.qNo, answered: q.answered, answer: q.answer },
          update: { answered: q.answered, answer: q.answer },
        });
      }
    }

    const allQuestions = await this.prisma.rdS5BankQuestion.findMany({ where: { assessmentId } });
    const answeredCount = allQuestions.filter(q => q.answered).length;
    const docs: Record<string, boolean> = dto.documents ?? {};
    const docCount = Object.values(docs).filter(Boolean).length;
    const planComp = calcPlanCompleteness(answeredCount, 13, docCount, 5);

    // Get scores from other sessions
    const s2h = await this.prisma.rdS2Health.findUnique({ where: { assessmentId } });
    const s3sum = await this.prisma.rdS3Summary.findUnique({ where: { assessmentId } });
    const s4 = await this.prisma.rdS4Loan.findUnique({ where: { assessmentId } });

    const loanReadinessScore = calcLoanReadinessScore(
      s2h?.healthScore ?? 0,
      s3sum?.stabilityScore ?? 0,
      nNull(s4?.dscrAfter),
      planComp, cfg,
    );

    await this.prisma.rdS5Plan.upsert({
      where: { assessmentId },
      create: {
        assessmentId,
        foundedYear: dto.foundedYear, requestedAmount: dto.requestedAmount,
        shareStructure: dto.shareStructure, mainProduct: dto.mainProduct,
        targetCustomers: dto.targetCustomers, salesChannels: dto.salesChannels,
        differentiator: dto.differentiator, salesForecast: dto.salesForecast,
        loanPurposeDetail: dto.loanPurposeDetail, repaymentSource: dto.repaymentSource,
        collateralDetail: dto.collateralDetail, riskFactors: dto.riskFactors,
        riskMitigation: dto.riskMitigation, documents: docs,
        loanReadinessScore, planCompleteness: planComp,
      },
      update: {
        foundedYear: dto.foundedYear, requestedAmount: dto.requestedAmount,
        shareStructure: dto.shareStructure, mainProduct: dto.mainProduct,
        targetCustomers: dto.targetCustomers, salesChannels: dto.salesChannels,
        differentiator: dto.differentiator, salesForecast: dto.salesForecast,
        loanPurposeDetail: dto.loanPurposeDetail, repaymentSource: dto.repaymentSource,
        collateralDetail: dto.collateralDetail, riskFactors: dto.riskFactors,
        riskMitigation: dto.riskMitigation, documents: docs,
        loanReadinessScore, planCompleteness: planComp,
      },
    });

    if (answeredCount >= 8) {
      await this.markSessionCompleted(assessmentId, 5);
    }
    await this.recomputeFrs(assessmentId, cfg);

    return { success: true, loanReadinessScore, planCompleteness: planComp };
  }

  // ─── S6: Deal & Execution ──────────────────────────────────

  async saveS6(userId: string, assessmentId: string, dto: any) {
    await this.verifyOwnership(userId, assessmentId);
    const cfg = await this.configLoader.loadConfig();

    // Save execution plan
    if (dto.businessMode) {
      await this.prisma.rdS6Execution.upsert({
        where: { assessmentId },
        create: { assessmentId, businessMode: dto.businessMode, month1Plan: dto.month1Plan, month2Plan: dto.month2Plan, month3Plan: dto.month3Plan },
        update: { businessMode: dto.businessMode, month1Plan: dto.month1Plan, month2Plan: dto.month2Plan, month3Plan: dto.month3Plan },
      });
    }

    let dealResults: any[] = [];

    if (dto.deals?.length > 0) {
      const s4 = await this.prisma.rdS4Loan.findUnique({ where: { assessmentId } });
      const s3sum = await this.prisma.rdS3Summary.findUnique({ where: { assessmentId } });
      const requestedAmount = nNull(s4?.recommendedAmount) ?? 0;
      const annualEbitda = nNull(s4?.annualEbitda) ?? 0;
      const existingMonthlyDebt = nNull(s4?.existingMonthlyDebtService) ?? 0;
      const avgGrowth = nNull(s3sum?.avgGrowth) ?? 0;
      const businessMode = dto.businessMode ?? 'expanding';

      const dealInputs: DealInput[] = dto.deals.map((d: any) => ({
        slot: d.slot, amount: d.amount, interestRate: d.interestRate,
        tenureYears: d.tenureYears, monthlyInstallment: d.monthlyInstallment ?? 0,
        scoreCollateral: d.scoreCollateral ?? 50, scoreCovenants: d.scoreCovenants ?? 50,
      }));

      const scores = calcDealScores(dealInputs, requestedAmount, businessMode, cfg);
      const bestScore = Math.max(...scores.map(s => s.dealScore));

      // Delete old deals
      await this.prisma.rdS6Deal.deleteMany({ where: { assessmentId } });

      for (let i = 0; i < dto.deals.length; i++) {
        const deal = dto.deals[i];
        const score = scores[i];
        const monthlyInstallment = deal.monthlyInstallment ?? newAnnualDebt(deal.amount, deal.interestRate / 100, deal.tenureYears) / 12;
        const dscrAfterDeal = annualEbitda > 0
          ? annualEbitda / (existingMonthlyDebt * 12 + monthlyInstallment * 12)
          : null;
        const cashLeftAfterDebt = avgGrowth - monthlyInstallment;
        const isBest = score.dealScore === bestScore && (dscrAfterDeal === null || dscrAfterDeal >= cfg.DSCR_MIN);

        await this.prisma.rdS6Deal.create({
          data: {
            assessmentId, slot: deal.slot, bankName: deal.bankName,
            amount: deal.amount, interestRate: deal.interestRate,
            tenureYears: deal.tenureYears, monthlyInstallment,
            collateralRequired: deal.collateralRequired,
            feeAmount: deal.feeAmount, feeNote: deal.feeNote,
            covenants: deal.covenants,
            scoreAmount: score.scoreAmount, scoreInterest: score.scoreInterest,
            scoreTenure: score.scoreTenure, scoreCollateral: score.scoreCollateral,
            scoreCovenants: score.scoreCovenants, dealScore: score.dealScore,
            dscrAfterDeal, cashLeftAfterDebt, isBest,
          },
        });

        dealResults.push({ ...score, dscrAfterDeal, cashLeftAfterDebt, isBest, slot: deal.slot });
      }

      if (dto.deals.length >= 2) {
        await this.markSessionCompleted(assessmentId, 6);
      }
    }

    await this.recomputeFrs(assessmentId, cfg);

    return { success: true, dealResults };
  }

  // ─── KPI Tracker ───────────────────────────────────────────

  async saveKpi(userId: string, assessmentId: string, dto: any) {
    await this.verifyOwnership(userId, assessmentId);

    await this.prisma.rdS6KpiTracker.upsert({
      where: { assessmentId_month: { assessmentId, month: dto.month } },
      create: { assessmentId, month: dto.month, revenueGrowth: dto.revenueGrowth, cashflow: dto.cashflow, paidOnTime: dto.paidOnTime, note: dto.note },
      update: { revenueGrowth: dto.revenueGrowth, cashflow: dto.cashflow, paidOnTime: dto.paidOnTime, note: dto.note },
    });

    return { success: true };
  }

  // ─── FRS Profile Switch ────────────────────────────────────

  async switchFrsProfile(userId: string, assessmentId: string, profile: 'learning' | 'bank') {
    await this.verifyOwnership(userId, assessmentId);
    const cfg = await this.configLoader.loadConfig();
    await this.recomputeFrs(assessmentId, cfg, profile);
    return { success: true };
  }

  // ─── Config ────────────────────────────────────────────────

  async getConfig() {
    return this.prisma.rdConfigConstant.findMany({ orderBy: { key: 'asc' } });
  }

  async updateConfig(userId: string, key: string, value: number) {
    await this.prisma.rdConfigConstant.upsert({
      where: { key },
      create: { key, value, updatedBy: userId },
      update: { value, updatedBy: userId },
    });
    this.configLoader.invalidateCache();
    return { success: true };
  }
}
