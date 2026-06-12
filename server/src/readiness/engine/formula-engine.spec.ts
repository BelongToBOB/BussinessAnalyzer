import { describe, expect, it } from 'vitest';
import {
  calcS02Derived,
  calcHealthScore,
  calcS03Month,
  calcS03Summary,
  calcS04,
  calcLoanReadinessScore,
  calcFrs,
  calcMindsetScore,
  calcPlanCompleteness,
  type EngineConfig,
} from './formula-engine';

// Default test config (mirrors DEFAULTS)
const cfg: EngineConfig = {
  DSCR_FAIL: 1.0,
  DSCR_MIN: 1.25,
  DSCR_STRONG: 2.0,
  DE_MAX: 3.0,
  DE_DANGER: 5.0,
  EBITDA_MARGIN_GOOD: 15.0,
  REAL_CASH_MIN_PCT: 30.0,
  COLLECTION_RATE_MIN: 80.0,
  REVENUE_MULTIPLE: 3.0,
  REVERSE_MULT: 5.0,
  REVERSE_LTV: 0.8,
  WC_RATE: 0.20,
  LTV_RATE: 0.75,
  DEFAULT_LOAN_RATE: 0.07,
  DEFAULT_LOAN_YEARS: 7,
  WEIGHT_HEALTH_S05: 0.35,
  WEIGHT_STABILITY_S05: 0.20,
  WEIGHT_DSCR_PASS_S05: 0.20,
  WEIGHT_PLAN_S05: 0.25,
  W_AMOUNT: 0.20,
  W_INTEREST: 0.20,
  W_TENURE: 0.15,
  W_COLLATERAL: 0.25,
  W_COVENANTS: 0.20,
  FRS_L_MINDSET: 0.20,
  FRS_L_HEALTH: 0.25,
  FRS_L_STABILITY: 0.20,
  FRS_L_CAPACITY: 0.20,
  FRS_L_BANK: 0.15,
  FRS_B_MINDSET: 0.10,
  FRS_B_HEALTH: 0.35,
  FRS_B_STABILITY: 0.25,
  FRS_B_CAPACITY: 0.20,
  FRS_B_BANK: 0.10,
  FRS_BAND_READY: 75.0,
  FRS_BAND_ALMOST: 50.0,
  HS_EBITDA_W: 25.0,
  HS_DSCR_W: 30.0,
  HS_DE_W: 25.0,
  HS_GROWTH_W: 20.0,
  CS_POSITIVE_W: 40.0,
  CS_REAL_CASH_W: 30.0,
  CS_TREND_W: 30.0,
  DESIRED_LOAN_WARN_MULT: 1.2,
};

describe('calcS02Derived', () => {
  it('computes EBITDA, DSCR, D/E correctly', () => {
    const result = calcS02Derived({
      revenue: 10_000_000,
      cogs: 6_000_000,
      depreciation: 200_000,
      interestExpense: 500_000,
      tax: 500_000,
      netProfit: 2_000_000,
      totalLiabilities: 5_000_000,
      equity: 10_000_000,
      annualDebtService: 1_500_000,
    });
    expect(result.ebitda).toBeCloseTo(3_200_000, -3);
    expect(result.dscr).toBeCloseTo(2.13, 1);
    expect(result.deRatio).toBeCloseTo(0.5, 1);
  });
});

describe('calcS04 - Loan Sizing', () => {
  it('computes 4 loan methods and recommended amount', () => {
    const result = calcS04({
      annualRevenue: 12_000_000,
      annualEbitda: 4_200_000,
      existingMonthlyDebtService: 50_000,
      existingDebtBalance: 2_000_000,
      collateralValue: 10_000_000,
      desiredLoan: 5_000_000,
    }, cfg);
    expect(result.m1RevenueMultiple).toBeCloseTo(34_000_000, -3);
    expect(result.m2Reverse).toBeCloseTo(16_800_000, -3);
    expect(result.m3WorkingCapital).toBeCloseTo(2_400_000, -3);
    expect(result.m4AssetBased).toBeCloseTo(5_500_000, -3);
    expect(result.recommendedAmount).toBeCloseTo(16_800_000, -3);
  });

  it('computes DSCR before and after', () => {
    const result = calcS04({
      annualRevenue: 12_000_000,
      annualEbitda: 4_200_000,
      existingMonthlyDebtService: 100_000,
      existingDebtBalance: 3_000_000,
      collateralValue: 10_000_000,
      desiredLoan: 5_000_000,
    }, cfg);
    expect(result.dscrBefore).toBeCloseTo(3.5, 1);
    expect(result.dscrAfter).toBeLessThan(result.dscrBefore!);
  });

  it('returns verdict string', () => {
    const result = calcS04({
      annualRevenue: 12_000_000,
      annualEbitda: 4_200_000,
      existingMonthlyDebtService: 50_000,
      existingDebtBalance: 1_000_000,
      collateralValue: 10_000_000,
      desiredLoan: 3_000_000,
    }, cfg);
    expect(result.verdict).toBeTruthy();
  });
});

describe('calcLoanReadinessScore', () => {
  it('returns high score for good inputs', () => {
    const score = calcLoanReadinessScore(80, 75, 2.0, 90, cfg);
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it('returns low score for poor DSCR', () => {
    const score = calcLoanReadinessScore(50, 50, 0.8, 40, cfg);
    expect(score).toBeLessThan(55);
  });

  it('handles null DSCR', () => {
    const score = calcLoanReadinessScore(70, 70, null, 80, cfg);
    expect(score).toBeGreaterThan(0);
  });
});

describe('calcFrs - Learning View', () => {
  it('computes composite FRS with learning weights', () => {
    const result = calcFrs({
      profile: 'learning',
      mindsetScore: 80,
      healthScore: 70,
      stabilityScore: 60,
      capacityScore: 75,
      bankReadinessScore: 65,
    }, cfg);
    expect(result.compositeFrs).toBeCloseTo(70, 0);
  });

  it('returns พร้อมยื่น for score >= 75', () => {
    const result = calcFrs({
      profile: 'learning',
      mindsetScore: 90,
      healthScore: 85,
      stabilityScore: 80,
      capacityScore: 85,
      bankReadinessScore: 80,
    }, cfg);
    expect(result.compositeFrs).toBeGreaterThanOrEqual(75);
    expect(result.frsBand).toBe('พร้อมยื่น');
  });
});

describe('calcFrs - Bank View', () => {
  it('weighs health higher than learning view', () => {
    const inputs = {
      mindsetScore: 50,
      healthScore: 90,
      stabilityScore: 85,
      capacityScore: 90,
      bankReadinessScore: 50,
    };
    const resultBank = calcFrs({ ...inputs, profile: 'bank' }, cfg);
    const resultLearning = calcFrs({ ...inputs, profile: 'learning' }, cfg);
    expect(resultBank.compositeFrs).toBeGreaterThan(resultLearning.compositeFrs);
  });
});

describe('calcMindsetScore', () => {
  it('returns higher ownerScore for all-true owner flags', () => {
    const allTrue = { f1: true, f2: true, f3: true, f4: true, f5: true };
    const allFalse = { f1: false, f2: false, f3: false, f4: false, f5: false };
    const highOwner = calcMindsetScore(allFalse, allTrue, 'B', 'expand to new market', 'working capital for inventory');
    const lowOwner = calcMindsetScore(allTrue, allFalse, 'D', null, null);
    expect(highOwner.ownerScore).toBeGreaterThan(lowOwner.ownerScore);
    expect(highOwner.operatorScore).toBeGreaterThan(lowOwner.operatorScore);
  });

  it('returns correct ownerMindsetScore as weighted combo', () => {
    const allTrue = { f1: true, f2: true, f3: true, f4: true };
    const allFalse = { f1: false, f2: false, f3: false, f4: false };
    const result = calcMindsetScore(allFalse, allTrue, 'B', 'expand to new market with clear plan', 'working capital for inventory expansion');
    expect(result.ownerMindsetScore).toBe(100);
    expect(result.readiness).toBe('พร้อมเดินหน้า');
  });
});

describe('calcPlanCompleteness', () => {
  it('returns 100 when all answered and all docs', () => {
    expect(calcPlanCompleteness(13, 13, 5, 5)).toBe(100);
  });
  it('returns 0 when nothing answered', () => {
    expect(calcPlanCompleteness(0, 13, 0, 5)).toBe(0);
  });
  it('returns 25 when half answered, no docs', () => {
    expect(calcPlanCompleteness(6, 12, 0, 4)).toBe(25);
  });
});
