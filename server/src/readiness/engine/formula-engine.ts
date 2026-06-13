/**
 * InsideBank Formula Engine
 * Pure functions — no side effects, no DB calls.
 * All constants passed in via `cfg` object (read from config_constants table).
 */

export interface EngineConfig {
  DSCR_FAIL: number;
  DSCR_MIN: number;
  DSCR_STRONG: number;
  DE_MAX: number;
  DE_DANGER: number;
  EBITDA_MARGIN_GOOD: number;
  REAL_CASH_MIN_PCT: number;
  COLLECTION_RATE_MIN: number;
  REVENUE_MULTIPLE: number;
  REVERSE_MULT: number;
  REVERSE_LTV: number;
  WC_RATE: number;
  LTV_RATE: number;
  DEFAULT_LOAN_RATE: number;
  DEFAULT_LOAN_YEARS: number;
  WEIGHT_HEALTH_S05: number;
  WEIGHT_STABILITY_S05: number;
  WEIGHT_DSCR_PASS_S05: number;
  WEIGHT_PLAN_S05: number;
  W_AMOUNT: number;
  W_INTEREST: number;
  W_TENURE: number;
  W_COLLATERAL: number;
  W_COVENANTS: number;
  FRS_L_MINDSET: number;
  FRS_L_HEALTH: number;
  FRS_L_STABILITY: number;
  FRS_L_CAPACITY: number;
  FRS_L_BANK: number;
  FRS_B_MINDSET: number;
  FRS_B_HEALTH: number;
  FRS_B_STABILITY: number;
  FRS_B_CAPACITY: number;
  FRS_B_BANK: number;
  FRS_BAND_READY: number;
  FRS_BAND_ALMOST: number;
  HS_EBITDA_W: number;
  HS_DSCR_W: number;
  HS_DE_W: number;
  HS_GROWTH_W: number;
  CS_POSITIVE_W: number;
  CS_REAL_CASH_W: number;
  CS_TREND_W: number;
  DESIRED_LOAN_WARN_MULT: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Clamp a value between min and max */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * Inverse clamp score: 1.0 when v <= good, 0.0 when v >= danger, linear between.
 * Used for D/E ratio (lower is better).
 */
export function clampScoreInverse(v: number, good: number, danger: number): number {
  if (v <= good) return 1.0;
  if (v >= danger) return 0.0;
  return 1.0 - (v - good) / (danger - good);
}

/**
 * dscrQuality: piecewise linear curve
 * DSCR_FAIL → 0%, DSCR_MIN → 50%, DSCR_STRONG → 100%
 */
export function dscrQuality(dscr: number, cfg: Pick<EngineConfig, 'DSCR_FAIL' | 'DSCR_MIN' | 'DSCR_STRONG'>): number {
  const { DSCR_FAIL, DSCR_MIN, DSCR_STRONG } = cfg;
  if (dscr <= DSCR_FAIL) return 0;
  if (dscr <= DSCR_MIN) return ((dscr - DSCR_FAIL) / (DSCR_MIN - DSCR_FAIL)) * 0.5;
  if (dscr <= DSCR_STRONG) return 0.5 + ((dscr - DSCR_MIN) / (DSCR_STRONG - DSCR_MIN)) * 0.5;
  return 1.0;
}

// ─── Session 02: Financial Health ──────────────────────────────────────────

export interface S02Input {
  revenue: number;
  cogs: number;
  sgaExpense?: number;
  depreciation: number;
  interestExpense: number;
  tax: number;
  netProfit: number;
  totalAssets?: number;
  totalLiabilities: number;
  equity: number;
  cash?: number;
  accountsReceivable?: number;
  inventory?: number;
  accountsPayable?: number;
  annualDebtService: number;
  currentAssets?: number;
  currentLiabilities?: number;
}

export interface S02Derived {
  ebitda: number;
  ebit: number;
  ebitdaMargin: number | null;
  netMargin: number | null;
  deRatio: number | null;
  deRatioFlag: 'ok' | 'negative_equity' | 'high';
  dscr: number | null;
  dscrFlag: 'na' | 'ok' | 'low';
  workingCapital: number | null;
  currentRatio: number | null;
  currentRatioFlag: 'good' | 'ok' | 'risk';
  grossMargin: number | null;
  grossMarginFlag: 'good' | 'low';
}

export function calcS02Derived(input: S02Input): S02Derived {
  const { revenue, depreciation, interestExpense, tax, netProfit,
    totalLiabilities, equity, accountsReceivable, inventory, accountsPayable,
    annualDebtService } = input;

  const ebitda = netProfit + interestExpense + tax + depreciation;
  const ebit = ebitda - depreciation;
  const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : null;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : null;

  let deRatio: number | null = null;
  let deRatioFlag: 'ok' | 'negative_equity' | 'high' = 'ok';
  if (equity <= 0) {
    deRatioFlag = 'negative_equity';
  } else {
    deRatio = totalLiabilities / equity;
    deRatioFlag = deRatio >= 3 ? 'high' : 'ok';
  }

  let dscr: number | null = null;
  let dscrFlag: 'na' | 'ok' | 'low' = 'na';
  if (annualDebtService > 0) {
    dscr = ebitda / annualDebtService;
    dscrFlag = dscr >= 1.25 ? 'ok' : 'low';
  }

  const ar = accountsReceivable ?? 0;
  const inv = inventory ?? 0;
  const ap = accountsPayable ?? 0;
  const workingCapital = (ar + inv) - ap;

  // Current Ratio
  const { currentAssets, currentLiabilities, cogs } = input;
  let currentRatio: number | null = null;
  let currentRatioFlag: 'good' | 'ok' | 'risk' = 'good';
  if (currentAssets != null && currentLiabilities != null && currentLiabilities > 0) {
    currentRatio = currentAssets / currentLiabilities;
    currentRatioFlag = currentRatio >= 1.5 ? 'good' : currentRatio >= 1.0 ? 'ok' : 'risk';
  }

  // Gross Margin
  const grossMargin = revenue > 0 && cogs > 0 ? ((revenue - cogs) / revenue) * 100 : null;
  const grossMarginFlag: 'good' | 'low' = grossMargin !== null && grossMargin >= 30 ? 'good' : 'low';

  return { ebitda, ebit, ebitdaMargin, netMargin, deRatio, deRatioFlag, dscr, dscrFlag, workingCapital, currentRatio, currentRatioFlag, grossMargin, grossMarginFlag };
}

export interface S02HealthResult {
  healthScore: number;
  status: 'แข็งแรง' | 'พอใช้' | 'มีจุดเสี่ยง';
  redFlags: string[];
  passChecklist: Record<string, boolean>;
  sEBITDA: number;
  sDSCR: number;
  sDE: number;
  sGrowth: number;
}

export function calcHealthScore(
  derived: S02Derived,
  revenueGrowth: number | null,
  profitGrowth: number | null,
  prevInventory: number | null,
  prevRevenue: number | null,
  prevCash: number | null,
  prevNetProfit: number | null,
  cfg: EngineConfig,
  currentInventory?: number | null
): S02HealthResult {
  const { DSCR_MIN, DE_MAX, DE_DANGER, EBITDA_MARGIN_GOOD,
    HS_EBITDA_W, HS_DSCR_W, HS_DE_W, HS_GROWTH_W } = cfg;

  const sEBITDA = derived.ebitda > 0 ? HS_EBITDA_W : 0;

  const dscrVal = derived.dscr ?? 0;
  const sDSCR = dscrQuality(dscrVal, cfg) * HS_DSCR_W;

  let sDE = 0;
  if (derived.deRatioFlag !== 'negative_equity' && derived.deRatio !== null) {
    sDE = clampScoreInverse(derived.deRatio, DE_MAX, DE_DANGER) * HS_DE_W;
  }

  const sGrowth =
    (revenueGrowth !== null && revenueGrowth > 0 ? HS_GROWTH_W / 2 : 0) +
    (profitGrowth !== null && profitGrowth > 0 ? HS_GROWTH_W / 2 : 0);

  const healthScore = Math.round(sEBITDA + sDSCR + sDE + sGrowth);

  const status: 'แข็งแรง' | 'พอใช้' | 'มีจุดเสี่ยง' =
    healthScore >= 75 ? 'แข็งแรง' :
    healthScore >= 50 ? 'พอใช้' :
    'มีจุดเสี่ยง';

  const redFlags: string[] = [];
  if (derived.ebitda <= 0) redFlags.push('EBITDA ≤ 0 — ธุรกิจยังไม่สร้างกำไรจากเนื้องาน');
  if (derived.dscr !== null && derived.dscr < DSCR_MIN) redFlags.push('DSCR ต่ำกว่าเกณฑ์ธนาคาร (1.25x)');
  if (derived.deRatioFlag === 'negative_equity') redFlags.push('ส่วนของผู้ถือหุ้นติดลบ (ทุนติดลบ)');
  if (derived.deRatio !== null && derived.deRatio >= DE_MAX) redFlags.push('D/E สูงเกินเกณฑ์ (≥3x)');
  if (prevInventory !== null && prevInventory > 0 && currentInventory != null) {
    if (currentInventory > prevInventory * 1.25) {
      redFlags.push('สต็อกบวมเร็ว — เงินอาจจมในของที่ขายไม่ออก');
    }
  }
  if (derived.currentRatio !== null && derived.currentRatioFlag === 'risk') {
    redFlags.push('Current Ratio < 1.0 — หนี้สั้นมากกว่าสินทรัพย์สั้น เสี่ยงสภาพคล่อง');
  }

  const passChecklist = {
    ebitdaPositive: derived.ebitda > 0,
    dscrAboveMin: derived.dscr !== null && derived.dscr >= DSCR_MIN,
    deRatioOk: derived.deRatioFlag === 'ok' && derived.deRatio !== null && derived.deRatio < DE_MAX,
    financialsReady: true,
    noNpl: false, // manual check
  };

  return { healthScore, status, redFlags, passChecklist, sEBITDA, sDSCR, sDE, sGrowth };
}

// ─── Session 03: Cashflow 4 Layers ─────────────────────────────────────────

export interface S03MonthInput {
  salesRevenue: number;
  cashSales: number;
  collectedFromAr: number;
  otherIncome: number;
  cogsPaid: number;
  rawMaterial: number;
  rentUtilities: number;
  salaries: number;
  debtPayment: number;
  taxPaid: number;
  ownerWithdrawal: number;
  reserve: number;
}

export interface S03MonthDerived {
  cashIn: number;
  realCash: number;
  surplusCash: number;
  growthCash: number;
  realCashPct: number | null;
  collectionGap: number;
  collectionRate: number | null;
}

export function calcS03Month(input: S03MonthInput): S03MonthDerived {
  const cashIn = input.cashSales + input.collectedFromAr + input.otherIncome;
  const realCash = cashIn - input.cogsPaid - input.rawMaterial;
  const surplusCash = realCash - input.rentUtilities - input.salaries;
  const growthCash = surplusCash - input.debtPayment - input.taxPaid - input.ownerWithdrawal - input.reserve;
  const realCashPct = cashIn > 0 ? (realCash / cashIn) * 100 : null;
  const collectionGap = input.salesRevenue - cashIn;
  const collectionRate = input.salesRevenue > 0 ? (cashIn / input.salesRevenue) * 100 : null;

  return { cashIn, realCash, surplusCash, growthCash, realCashPct, collectionGap, collectionRate };
}

export interface S03SummaryResult {
  avgMonthlySales: number;
  avgMonthlyCashIn: number;
  avgRealCash: number;
  avgSurplus: number;
  avgGrowth: number;
  trend: 'ขึ้น' | 'ทรง' | 'ลง';
  tightestMonthIndex: number;
  stabilityScore: number;
  warnings: string[];
}

export function calcS03Summary(
  months: S03MonthInput[],
  derived: S03MonthDerived[],
  cfg: EngineConfig
): S03SummaryResult {
  const n = months.length;
  if (n === 0) throw new Error('No cashflow months provided');

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const avgMonthlySales = avg(months.map(m => m.salesRevenue));
  const avgMonthlyCashIn = avg(derived.map(d => d.cashIn));
  const avgRealCash = avg(derived.map(d => d.realCash));
  const avgSurplus = avg(derived.map(d => d.surplusCash));
  const avgGrowth = avg(derived.map(d => d.growthCash));

  // Trend: slope of growthCash
  const growthArr = derived.map(d => d.growthCash);
  let trend: 'ขึ้น' | 'ทรง' | 'ลง' = 'ทรง';
  if (n >= 2) {
    const slope = growthArr[n - 1] - growthArr[0];
    const threshold = Math.abs(avgGrowth) * 0.1;
    trend = slope > threshold ? 'ขึ้น' : slope < -threshold ? 'ลง' : 'ทรง';
  }

  const tightestMonthIndex = growthArr.indexOf(Math.min(...growthArr));

  // Stability Score
  const positiveMonths = derived.filter(d => d.growthCash >= 0).length;
  const sPositiveGrowth = (positiveMonths / n) * cfg.CS_POSITIVE_W;
  const realCashRatio = avgMonthlyCashIn > 0 ? avgRealCash / avgMonthlyCashIn : 0;
  const sRealCashRatio = clamp(realCashRatio / (cfg.REAL_CASH_MIN_PCT / 100), 0, 1) * cfg.CS_REAL_CASH_W;
  const sTrend = trend === 'ขึ้น' ? cfg.CS_TREND_W : trend === 'ทรง' ? cfg.CS_TREND_W / 2 : 0;
  const stabilityScore = Math.round(sPositiveGrowth + sRealCashRatio + sTrend);

  const warnings: string[] = [];
  const avgRealCashPct = avgMonthlyCashIn > 0 ? (avgRealCash / avgMonthlyCashIn) * 100 : null;
  if (avgRealCashPct !== null && avgRealCashPct < cfg.REAL_CASH_MIN_PCT) {
    warnings.push(`เงินจริงเหลือ ${avgRealCashPct.toFixed(1)}% — ต่ำกว่าเกณฑ์ ${cfg.REAL_CASH_MIN_PCT}%`);
  }
  if (avgSurplus < 0) warnings.push('ค่าที่/ค่าคนสูงเกินรายได้ — Surplus ติดลบ');
  if (avgGrowth < 0) warnings.push('ต้องหาเงินกู้มาโปะ — Growth Cash ติดลบ');

  const avgCollectionRate = derived
    .map(d => d.collectionRate)
    .filter((r): r is number => r !== null)
    .reduce((a, b, _, arr) => a + b / arr.length, 0);
  if (avgCollectionRate > 0 && avgCollectionRate < cfg.COLLECTION_RATE_MIN) {
    warnings.push(`เก็บเงินได้ ${avgCollectionRate.toFixed(1)}% — เงินจมในลูกหนี้`);
  }

  return { avgMonthlySales, avgMonthlyCashIn, avgRealCash, avgSurplus, avgGrowth, trend, tightestMonthIndex, stabilityScore, warnings };
}

// ─── Session 04: Loan Sizing ────────────────────────────────────────────────

export interface S04Input {
  annualRevenue: number;   // monthly revenue (field name kept for compat)
  annualEbitda: number;    // monthly EBITDA
  existingMonthlyDebtService: number; // monthly existing debt payment
  existingDebtBalance: number;
  collateralValue: number;
  assumedRate?: number;
  assumedYears?: number;
  desiredLoan?: number;
}

export interface S04Result {
  m1DebtCapacity: number | null;      // วิธี 1: Debt Capacity
  m2Reverse: number | null;           // วิธี 2: Reverse Calculation
  m3RevenueMultiple: number;          // วิธี 3: Revenue Multiple
  m4WorkingCapital: number;           // วิธี 4: Working Capital
  // kept for backward compat
  m1RevenueMultiple: number;
  m3WorkingCapital: number;
  m4AssetBased: number;
  loanConservative: number | null;
  loanPractical: number | null;
  loanStretch: number | null;
  recommendedAmount: number | null;
  riskyThreshold: number | null;
  dscrBefore: number | null;
  dscrAfter: number | null;
  newAnnualDebt: number;
  verdict: string;
  warnings: string[];
  capacityScore: number;
}

/** Monthly payment for a loan (PMT) */
export function monthlyPmt(P: number, annualRate: number, termMonths: number): number {
  if (P <= 0 || annualRate <= 0 || termMonths <= 0) return 0;
  const r = annualRate / 12;
  return P * r / (1 - Math.pow(1 + r, -termMonths));
}

/** PV of annuity: convert monthly payment → loan amount */
export function pvAnnuity(payment: number, annualRate: number, termMonths: number): number {
  if (payment <= 0 || annualRate <= 0 || termMonths <= 0) return 0;
  const r = annualRate / 12;
  return payment * (1 - Math.pow(1 + r, -termMonths)) / r;
}

/** Annuity: annual debt service for a new loan */
export function newAnnualDebt(P: number, annualRate: number, years: number): number {
  if (P <= 0 || annualRate <= 0 || years <= 0) return 0;
  return monthlyPmt(P, annualRate, years * 12) * 12;
}

/** Find loan stretch: max loan where dscr_after >= DSCR_MIN */
function findLoanStretch(
  annualEbitda: number,
  existingAnnualDebt: number,
  rate: number,
  years: number,
  dscrMin: number
): number | null {
  if (annualEbitda <= 0) return null;
  // Binary search: max loan where DSCR_after >= DSCR_MIN
  let lo = 0;
  let hi = annualEbitda * 20; // upper bound
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const nd = newAnnualDebt(mid, rate, years);
    const totalDebt = existingAnnualDebt + nd;
    const dscr = totalDebt > 0 ? annualEbitda / totalDebt : Infinity;
    if (dscr >= dscrMin) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo > 0 ? lo : null;
}

export function calcS04(input: S04Input, cfg: EngineConfig): S04Result {
  const {
    annualRevenue, annualEbitda, existingMonthlyDebtService,
    existingDebtBalance, desiredLoan
  } = input;
  const rate = input.assumedRate ?? cfg.DEFAULT_LOAN_RATE;
  const termMonths = (input.assumedYears ?? cfg.DEFAULT_LOAN_YEARS) * 12;
  const SAFETY_RATIO = 0.5; // config: ผ่อนแบบปลอดภัย 50% ของเงินเหลือ

  // All inputs are monthly
  const monthlyRevenue = annualRevenue;
  const monthlyEbitda = annualEbitda;
  const oldPayment = existingMonthlyDebtService;
  const annualEbitdaCalc = monthlyEbitda * 12;
  const existingAnnualDebt = oldPayment * 12;

  // ─── วิธี 1: Debt Capacity (DSCR-style → หาวงเงินสูงสุด) ───
  // maxNewPayment = (EBITDA/เดือน ÷ 1.25) − หนี้เดิม/เดือน
  let m1DebtCapacity: number | null = null;
  if (monthlyEbitda > 0) {
    const maxNewPayment = (monthlyEbitda / cfg.DSCR_MIN) - oldPayment;
    if (maxNewPayment > 0) {
      m1DebtCapacity = pvAnnuity(maxNewPayment, rate, termMonths);
    }
  }

  // ─── วิธี 2: Reverse Calculation (cashflow-based) ───
  // availableCash = EBITDA/เดือน − หนี้เดิม/เดือน
  // affordablePay = availableCash × SAFETY_RATIO
  let m2Reverse: number | null = null;
  if (monthlyEbitda > oldPayment) {
    const availableCash = monthlyEbitda - oldPayment;
    const affordablePay = availableCash * SAFETY_RATIO;
    m2Reverse = pvAnnuity(affordablePay, rate, termMonths);
  }

  // ─── วิธี 3: Revenue Multiple ───
  // ยอดขาย/เดือน × 3 − หนี้เดิม
  const m3RevenueMultiple = monthlyRevenue * cfg.REVENUE_MULTIPLE - existingDebtBalance;

  // ─── วิธี 4: Working Capital ───
  // ยอดขาย/เดือน × 12 × 20%
  const m4WorkingCapital = monthlyRevenue * 12 * cfg.WC_RATE;

  // ─── Practical / Conservative / Stretch ───
  const allMethods = [m1DebtCapacity, m2Reverse, m3RevenueMultiple, m4WorkingCapital]
    .filter((v): v is number => v !== null && v > 0);

  const loanConservative = allMethods.length > 0 ? Math.min(...allMethods) : null;
  const loanPractical = m1DebtCapacity !== null && m1DebtCapacity > 0
    ? m1DebtCapacity
    : allMethods.length > 0
      ? allMethods.sort((a, b) => a - b)[Math.floor(allMethods.length / 2)]
      : null;

  const loanStretch = findLoanStretch(annualEbitdaCalc, existingAnnualDebt, rate, termMonths / 12, cfg.DSCR_MIN);
  const recommendedAmount = loanPractical;

  // ─── DSCR before/after ───
  const dscrBefore = oldPayment > 0 ? monthlyEbitda / oldPayment : null;
  const loanForDscr = desiredLoan ?? loanPractical ?? 0;
  const newPay = monthlyPmt(loanForDscr, rate, termMonths);
  const dscrAfter = (oldPayment + newPay) > 0 ? monthlyEbitda / (oldPayment + newPay) : null;
  const nd = newPay * 12;

  const riskyThreshold = loanStretch;

  const verdict = dscrAfter !== null
    ? dscrAfter >= cfg.DSCR_MIN
      ? 'กู้เพิ่มแล้วยังจ่ายไหว ✓'
      : 'เกินกำลัง — ลดวงเงิน/ยืดเทอม ⚠'
    : 'ไม่มีภาระหนี้เดิม';

  const warnings: string[] = [];
  if (desiredLoan && recommendedAmount && desiredLoan > recommendedAmount * cfg.DESIRED_LOAN_WARN_MULT) {
    warnings.push(`วงเงินที่ต้องการ (${fmtMoney(desiredLoan)}) เกินกำลัง — แนะนำไม่เกิน ${fmtMoney(recommendedAmount * cfg.DESIRED_LOAN_WARN_MULT)}`);
  }
  if (monthlyEbitda <= 0) {
    warnings.push('EBITDA ติดลบ — วิธีที่ 1-2 ใช้ไม่ได้');
  }

  // Capacity score
  const sFit = loanPractical && loanForDscr <= loanPractical
    ? 40
    : loanPractical
      ? Math.max(0, 40 * (1 - (loanForDscr - loanPractical) / (loanPractical || 1)))
      : 20;
  let capacityScore = 0;
  if (dscrAfter !== null) {
    capacityScore = Math.round(dscrQuality(dscrAfter, cfg) * 60 + sFit);
  }

  return {
    m1DebtCapacity, m2Reverse, m3RevenueMultiple, m4WorkingCapital,
    // backward compat
    m1RevenueMultiple: m3RevenueMultiple, m3WorkingCapital: m4WorkingCapital,
    m4AssetBased: 0,
    loanConservative, loanPractical, loanStretch,
    recommendedAmount, riskyThreshold,
    dscrBefore, dscrAfter, newAnnualDebt: nd,
    verdict, warnings, capacityScore
  };
}

function fmtMoney(v: number): string {
  return new Intl.NumberFormat('th-TH').format(Math.round(v)) + ' บาท';
}

// ─── Session 05: Loan Readiness Score ──────────────────────────────────────

export function calcLoanReadinessScore(
  healthScore: number,
  stabilityScore: number,
  dscrAfter: number | null,
  planCompleteness: number,
  cfg: EngineConfig
): number {
  const dscrPassScore = dscrAfter !== null
    ? dscrAfter >= cfg.DSCR_MIN
      ? 100
      : Math.round(dscrQuality(dscrAfter, cfg) * 100)
    : 0;

  return Math.round(
    healthScore * cfg.WEIGHT_HEALTH_S05 +
    stabilityScore * cfg.WEIGHT_STABILITY_S05 +
    dscrPassScore * cfg.WEIGHT_DSCR_PASS_S05 +
    planCompleteness * cfg.WEIGHT_PLAN_S05
  );
}

export function calcPlanCompleteness(answeredCount: number, totalQuestions: number, docCount: number, totalDocs: number): number {
  const qPct = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
  const dPct = totalDocs > 0 ? docCount / totalDocs : 0;
  return Math.round(((qPct + dPct) / 2) * 100);
}

// ─── Session 06: Deal Scoring ───────────────────────────────────────────────

export interface DealInput {
  slot: string;
  amount: number;
  interestRate: number;
  tenureYears: number;
  monthlyInstallment: number;
  scoreCollateral: number;
  scoreCovenants: number;
}

export interface DealScoreResult {
  scoreAmount: number;
  scoreInterest: number;
  scoreTenure: number;
  scoreCollateral: number;
  scoreCovenants: number;
  dealScore: number;
}

export function calcDealScores(
  deals: DealInput[],
  requestedAmount: number,
  businessMode: 'expanding' | 'stable',
  cfg: EngineConfig
): DealScoreResult[] {
  if (deals.length === 0) return [];

  const amounts = deals.map(d => d.amount);
  const rates = deals.map(d => d.interestRate);
  const tenures = deals.map(d => d.tenureYears);

  const maxAmount = Math.max(...amounts);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const minTenure = Math.min(...tenures);
  const maxTenure = Math.max(...tenures);

  // Adjust weights for business mode
  let wTenure = cfg.W_TENURE;
  let wInterest = cfg.W_INTEREST;
  if (businessMode === 'expanding') {
    // Expanding: tenure more important, interest less
    wTenure = 0.25;
    wInterest = 0.10;
  } else {
    // Stable: interest more important
    wTenure = 0.10;
    wInterest = 0.25;
  }
  // Normalize so weights still sum to 1.0
  const totalW = cfg.W_AMOUNT + wInterest + wTenure + cfg.W_COLLATERAL + cfg.W_COVENANTS;

  return deals.map(deal => {
    // Amount: how well it meets the request (cap at 100 if >= requested)
    const scoreAmount = requestedAmount > 0
      ? Math.round(Math.min(deal.amount / requestedAmount, 1.0) * 100)
      : Math.round((deal.amount / maxAmount) * 100);

    // Interest: lower = better
    const scoreInterest = maxRate > minRate
      ? Math.round(((maxRate - deal.interestRate) / (maxRate - minRate)) * 100)
      : 100;

    // Tenure: longer = better for expanding, shorter for stable
    let scoreTenure: number;
    if (maxTenure > minTenure) {
      scoreTenure = businessMode === 'expanding'
        ? Math.round(((deal.tenureYears - minTenure) / (maxTenure - minTenure)) * 100)
        : Math.round(((maxTenure - deal.tenureYears) / (maxTenure - minTenure)) * 100);
    } else {
      scoreTenure = 100;
    }

    const dealScore = (
      scoreAmount * (cfg.W_AMOUNT / totalW) +
      scoreInterest * (wInterest / totalW) +
      scoreTenure * (wTenure / totalW) +
      deal.scoreCollateral * (cfg.W_COLLATERAL / totalW) +
      deal.scoreCovenants * (cfg.W_COVENANTS / totalW)
    );

    return {
      scoreAmount,
      scoreInterest,
      scoreTenure,
      scoreCollateral: deal.scoreCollateral,
      scoreCovenants: deal.scoreCovenants,
      dealScore: Math.round(dealScore * 100) / 100,
    };
  });
}

// ─── Readiness Score Engine (§6) ───────────────────────────────────────────

export type FrsProfile = 'learning' | 'bank';

export interface FrsInput {
  mindsetScore: number;
  healthScore: number;
  stabilityScore: number;
  capacityScore: number;
  bankReadinessScore: number;
  profile: FrsProfile;
}

export interface FrsResult {
  compositeFrs: number;
  frsBand: 'พร้อมยื่น' | 'เกือบพร้อม' | 'ยังไม่พร้อม';
  weights: Record<string, number>;
}

export function calcFrs(input: FrsInput, cfg: EngineConfig): FrsResult {
  const { profile, mindsetScore, healthScore, stabilityScore, capacityScore, bankReadinessScore } = input;

  const weights = profile === 'learning'
    ? {
        mindset: cfg.FRS_L_MINDSET,
        health: cfg.FRS_L_HEALTH,
        stability: cfg.FRS_L_STABILITY,
        capacity: cfg.FRS_L_CAPACITY,
        bank: cfg.FRS_L_BANK,
      }
    : {
        mindset: cfg.FRS_B_MINDSET,
        health: cfg.FRS_B_HEALTH,
        stability: cfg.FRS_B_STABILITY,
        capacity: cfg.FRS_B_CAPACITY,
        bank: cfg.FRS_B_BANK,
      };

  const compositeFrs = Math.round(
    mindsetScore * weights.mindset +
    healthScore * weights.health +
    stabilityScore * weights.stability +
    capacityScore * weights.capacity +
    bankReadinessScore * weights.bank
  );

  const frsBand: 'พร้อมยื่น' | 'เกือบพร้อม' | 'ยังไม่พร้อม' =
    compositeFrs >= cfg.FRS_BAND_READY ? 'พร้อมยื่น' :
    compositeFrs >= cfg.FRS_BAND_ALMOST ? 'เกือบพร้อม' :
    'ยังไม่พร้อม';

  return { compositeFrs, frsBand, weights };
}

// ─── Mindset Score (S01) ────────────────────────────────────────────────────

export function calcMindsetScore(
  operatorFlags: Record<string, boolean>,
  ownerFlags: Record<string, boolean>,
  leverageChoice: string,
  expansionGoal: string | null,
  loanPurpose: string | null
): {
  operatorScore: number;
  ownerScore: number;
  ownerMindsetScore: number;
  expansionClarity: number;
  loanPurposeClarity: number;
  verdict: string;
  readiness: string;
} {
  // Operator score: count operator behaviors (negative)
  const operatorCount = Object.values(operatorFlags).filter(Boolean).length;
  const operatorTotal = Object.keys(operatorFlags).length || 8;
  const operatorScore = Math.round((1 - operatorCount / operatorTotal) * 100);

  // Owner score: count owner mindset traits (positive)
  const ownerCount = Object.values(ownerFlags).filter(Boolean).length;
  const ownerTotal = Object.keys(ownerFlags).length || 8;
  const ownerScore = Math.round((ownerCount / ownerTotal) * 100);

  // Combined mindset score
  const ownerMindsetScore = Math.round((operatorScore * 0.4 + ownerScore * 0.6));

  // Expansion clarity (has goal text)
  const expansionClarity = expansionGoal && expansionGoal.trim().length > 10 ? 100 : expansionGoal ? 50 : 0;

  // Loan purpose clarity
  const loanPurposeClarity = loanPurpose && loanPurpose.trim().length > 10 ? 100 : loanPurpose ? 50 : 0;

  // Leverage choice verdict
  const leverageMap: Record<string, string> = {
    A: 'ไม่กู้ — ใช้เงินตัวเอง',
    B: 'กู้เพื่อขยาย — มีแผนชัดเจน',
    C: 'กู้เพราะจำเป็น — ต้องวางแผนก่อน',
    D: 'ยังไม่แน่ใจ — ต้องเรียนรู้เพิ่ม',
  };

  const verdict = leverageMap[leverageChoice] ?? 'ยังไม่ได้เลือก';

  const readiness =
    ownerMindsetScore >= 75 ? 'พร้อมเดินหน้า' :
    ownerMindsetScore >= 50 ? 'ต้องปรับ Mindset บางส่วน' :
    'ต้องพัฒนา Mindset ก่อนขอกู้';

  return { operatorScore, ownerScore, ownerMindsetScore, expansionClarity, loanPurposeClarity, verdict, readiness };
}
