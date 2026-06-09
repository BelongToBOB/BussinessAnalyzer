/**
 * InsideBank Business MRI — Calculation Engine (TypeScript)
 * Adapted from mri_calc.js (CEO reference engine v2.2)
 * Only Step 1-3 + Score for MVP
 */

const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

// ─── Interfaces ──────────────────────────────────────────

export interface IdentityInput {
  bizType: string;
  salesPerYear: number;
  employees: number;
  bizAgeYears: number;
}

export interface FinancialInput {
  revenue: number;
  otherIncome?: number;
  cogs: number;
  sga: number;
  interest: number;
  tax: number;
  depreciation?: number;
  amortization?: number;
  otherExpense?: number;
  netProfitOverride?: number;
}

export interface BalanceSheet {
  cash: number;
  ar: number;
  inventory: number;
  ap: number;
  shortLoan: number;
  currentPortionLT: number;
  longLoan: number;
  otherLiab?: number;
  equity: number;
}

export interface DebtItem {
  name: string;
  limit: number;
  annualPayment: number;
}

export interface CashDnaInput {
  salesTotal: number;
  creditSales: number;
  collectOldAR: number;
  cogsPaid: number;
  opex: number;
  interestM: number;
  principalM: number;
  taxM: number;
}

// ─── STEP 2: Financial MRI ───────────────────────────────

export function netProfit(f: FinancialInput): number {
  if (f.netProfitOverride != null) return f.netProfitOverride;
  return f.revenue + (f.otherIncome || 0) - f.cogs - f.sga - f.interest - f.tax - (f.otherExpense || 0);
}

export function ebitda(f: FinancialInput): number {
  return netProfit(f) + f.interest + f.tax + (f.depreciation || 0) + (f.amortization || 0);
}

export function totalRevenue(f: FinancialInput): number {
  return f.revenue + (f.otherIncome || 0);
}

export function ebitdaMargin(f: FinancialInput): number | null {
  const r = totalRevenue(f);
  return r > 0 ? ebitda(f) / r : null;
}

export function totalLiabilities(b: BalanceSheet): number {
  return b.ap + b.shortLoan + b.currentPortionLT + b.longLoan + (b.otherLiab || 0);
}

export function deRatio(b: BalanceSheet): number | null {
  return b.equity > 0 ? totalLiabilities(b) / b.equity : null;
}

export function currentRatio(b: BalanceSheet): number | null {
  const d = b.ap + b.shortLoan + b.currentPortionLT;
  return d > 0 ? (b.cash + b.ar + b.inventory) / d : null;
}

export function quickRatio(b: BalanceSheet): number | null {
  const d = b.ap + b.shortLoan + b.currentPortionLT;
  return d > 0 ? (b.cash + b.ar) / d : null;
}

export function annualDebtService(debtSchedule: DebtItem[]): number {
  return (debtSchedule || []).reduce((s, d) => s + d.annualPayment, 0);
}

export function dscr(f: FinancialInput, debtSchedule: DebtItem[]): number | null {
  const s = annualDebtService(debtSchedule);
  return s > 0 ? ebitda(f) / s : null;
}

export function cashCycleAuto(f: FinancialInput, b: BalanceSheet) {
  const dso = f.revenue > 0 ? b.ar / f.revenue * 365 : null;
  const dio = f.cogs > 0 ? b.inventory / f.cogs * 365 : null;
  const dpo = f.cogs > 0 ? b.ap / f.cogs * 365 : null;
  const ccc = (dso != null && dio != null && dpo != null) ? dso + dio - dpo : null;
  return { dso: dso != null ? round(dso, 1) : null, dio: dio != null ? round(dio, 1) : null, dpo: dpo != null ? round(dpo, 1) : null, ccc: ccc != null ? round(ccc, 1) : null };
}

// Verdict for Step 2
export function financialVerdict(f: FinancialInput, b: BalanceSheet, debtSchedule: DebtItem[]) {
  const d = dscr(f, debtSchedule);
  const de = deRatio(b);
  const margin = ebitdaMargin(f);

  const verdicts: { metric: string; value: number | null; color: string; label: string }[] = [];

  // DSCR
  if (d != null) {
    verdicts.push({ metric: 'DSCR', value: round(d), color: d >= 1.5 ? 'green' : d >= 1.25 ? 'yellow' : 'red', label: d >= 1.5 ? 'แข็งแรง' : d >= 1.25 ? 'พอใช้' : 'ต่ำกว่าเกณฑ์' });
  }
  // D/E
  if (de != null) {
    verdicts.push({ metric: 'D/E', value: round(de), color: de <= 2 ? 'green' : de <= 3 ? 'yellow' : 'red', label: de <= 2 ? 'ดี' : de <= 3 ? 'ระวัง' : 'สูงเกินไป' });
  }
  // EBITDA Margin
  if (margin != null) {
    const pct = round(margin * 100, 1);
    verdicts.push({ metric: 'EBITDA Margin', value: pct, color: pct >= 15 ? 'green' : pct >= 8 ? 'yellow' : 'red', label: pct >= 15 ? 'ดี' : pct >= 8 ? 'พอใช้' : 'บาง' });
  }

  const worst = verdicts.find(v => v.color === 'red') || verdicts.find(v => v.color === 'yellow');
  const overall = worst?.color || 'green';

  return { verdicts, overall };
}

// ─── STEP 3: Cash DNA ────────────────────────────────────

export function cashIn(c: CashDnaInput): number {
  return c.salesTotal - c.creditSales + c.collectOldAR;
}

export function realCash(c: CashDnaInput): number {
  return cashIn(c) - c.cogsPaid;
}

export function surplus(c: CashDnaInput): number {
  return realCash(c) - c.opex;
}

export function growthCash(c: CashDnaInput): number {
  return surplus(c) - c.interestM - c.principalM - c.taxM;
}

export function cashDnaVerdict(c: CashDnaInput) {
  const ci = cashIn(c);
  const rc = realCash(c);
  const sp = surplus(c);
  const gc = growthCash(c);

  const layers = [
    { name: 'เงินเข้า (Cash In)', value: ci, color: ci > 0 ? 'green' : 'red' },
    { name: 'เงินจริง (Real Cash)', value: rc, color: rc > 0 ? 'green' : 'red' },
    { name: 'เงินเหลือ (Surplus)', value: sp, color: sp > 0 ? 'green' : sp >= 0 ? 'yellow' : 'red' },
    { name: 'เงินโต (Growth Cash)', value: gc, color: gc > 0 ? 'green' : gc >= 0 ? 'yellow' : 'red' },
  ];

  const overall = gc > 0 ? 'green' : gc >= 0 ? 'yellow' : 'red';
  return { layers, overall };
}

// ─── Business Score (MVP: Step 1-3) ──────────────────────

export interface ScoreBlocks {
  financial: number;   // 0-100 from Step 2
  cashDNA: number;     // 0-100 from Step 3
  stepsCompleted: number; // how many of 3 steps done
  totalSteps: number;     // 3 for MVP
}

export function businessScore(blocks: ScoreBlocks): number {
  // MVP weights: Financial 60% + Cash DNA 40% (no Capital/Loan yet)
  const raw = 0.60 * blocks.financial + 0.40 * blocks.cashDNA;
  const readiness = blocks.stepsCompleted / blocks.totalSteps;
  return round(raw * readiness);
}

// Score from Financial MRI verdicts (0-100)
export function financialScore(f: FinancialInput, b: BalanceSheet, debtSchedule: DebtItem[]): number {
  let score = 0;
  const d = dscr(f, debtSchedule);
  const de = deRatio(b);
  const margin = ebitdaMargin(f);
  const cr = currentRatio(b);
  const qr = quickRatio(b);

  // DSCR (30 pts)
  if (d != null) score += d >= 1.5 ? 30 : d >= 1.25 ? 20 : d >= 1.0 ? 10 : 0;
  // D/E (20 pts)
  if (de != null) score += de <= 2 ? 20 : de <= 3 ? 12 : 5;
  // EBITDA Margin (20 pts)
  if (margin != null) score += margin >= 0.15 ? 20 : margin >= 0.08 ? 12 : 5;
  // Current Ratio (15 pts)
  if (cr != null) score += cr >= 1.5 ? 15 : cr >= 1.0 ? 10 : 5;
  // Quick Ratio (15 pts)
  if (qr != null) score += qr >= 1.0 ? 15 : qr >= 0.5 ? 10 : 5;

  return score;
}

// Score from Cash DNA (0-100)
export function cashDnaScore(c: CashDnaInput): number {
  let score = 0;
  const ci = cashIn(c);
  const rc = realCash(c);
  const sp = surplus(c);
  const gc = growthCash(c);

  // Cash In positive (20 pts)
  score += ci > 0 ? 20 : 0;
  // Real Cash margin (25 pts)
  if (ci > 0) {
    const margin = rc / ci;
    score += margin >= 0.3 ? 25 : margin >= 0.15 ? 18 : margin > 0 ? 10 : 0;
  }
  // Surplus positive (25 pts)
  score += sp > 0 ? 25 : sp >= 0 ? 12 : 0;
  // Growth Cash positive (30 pts)
  score += gc > 0 ? 30 : gc >= 0 ? 15 : 0;

  return score;
}

// ─── Compute functions for backend ───────────────────────

export function computeIbIdentity(data: any) {
  return {
    computed: { bizType: data.bizType, salesPerYear: data.salesPerYear, employees: data.employees, bizAgeYears: data.bizAgeYears },
    verdict: 'green',
  };
}

export function computeIbFinancial(data: any) {
  const f: FinancialInput = {
    revenue: data.revenue || 0, otherIncome: data.otherIncome || 0,
    cogs: data.cogs || 0, sga: data.sga || 0,
    interest: data.interest || 0, tax: data.tax || 0,
    depreciation: data.depreciation || 0, amortization: data.amortization || 0,
    otherExpense: data.otherExpense || 0,
  };
  const b: BalanceSheet = {
    cash: data.cash || 0, ar: data.ar || 0, inventory: data.inventory || 0,
    ap: data.ap || 0, shortLoan: data.shortLoan || 0,
    currentPortionLT: data.currentPortionLT || 0, longLoan: data.longLoan || 0,
    otherLiab: data.otherLiab || 0, equity: data.equity || 0,
  };
  const ds: DebtItem[] = (data.debtSchedule || []).map((d: any) => ({
    name: d.name || '', limit: d.limit || 0, annualPayment: d.annualPayment || 0,
  }));

  const np = netProfit(f);
  const eb = ebitda(f);
  const margin = ebitdaMargin(f);
  const de = deRatio(b);
  const cr = currentRatio(b);
  const qr = quickRatio(b);
  const dscrVal = dscr(f, ds);
  const cycle = cashCycleAuto(f, b);
  const verd = financialVerdict(f, b, ds);
  const score = financialScore(f, b, ds);

  return {
    computed: {
      netProfit: round(np), ebitda: round(eb),
      ebitdaMargin: margin != null ? round(margin * 100, 1) : null,
      totalLiabilities: round(totalLiabilities(b)),
      de: de != null ? round(de) : null,
      currentRatio: cr != null ? round(cr) : null,
      quickRatio: qr != null ? round(qr) : null,
      annualDebtService: round(annualDebtService(ds)),
      dscr: dscrVal != null ? round(dscrVal) : null,
      cashCycle: cycle,
      verdicts: verd.verdicts,
      score,
    },
    verdict: verd.overall,
  };
}

// ─── STEP 4: Bank View Score (0-100) ─────────────────────

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }

export function bankViewScore(ctx: {
  ebitdaMargin: number | null; dscrVal: number | null; deVal: number | null;
  growthPositive: boolean; cycleDays: number;
  revenueStability: number; salesGrowth: number;
  useOfFundClear: boolean; structureCorrect: boolean;
}) {
  const revenue = clamp((ctx.revenueStability) * 10, 0, 10)
    + clamp((ctx.salesGrowth) * 8, 0, 8)
    + clamp(((ctx.ebitdaMargin || 0) / 15) * 7, 0, 7);
  const cashflow = (ctx.growthPositive ? 15 : 5)
    + clamp((1 - ctx.cycleDays / 90) * 10, 0, 10);
  const debt = clamp(((ctx.dscrVal || 0) / 1.5) * 15, 0, 15)
    + clamp((1 - ((ctx.deVal || 0) / 3)) * 10, 0, 10);
  const purpose = (ctx.useOfFundClear ? 15 : 5) + (ctx.structureCorrect ? 10 : 3);
  const total = clamp(revenue + cashflow + debt + purpose, 0, 100);
  return { revenue: round(revenue), cashflow: round(cashflow), debt: round(debt), purpose: round(purpose), total: round(total) };
}

// ─── STEP 5: Capital Design ──────────────────────────────

export interface CapitalDesignInput {
  purpose: 'working' | 'expansion' | 'asset' | 'refinance';
  projectValue: number;
  ownCapital: number;
  collateralValue: number;
}

export function capitalDesignAnalysis(d: CapitalDesignInput) {
  const loanNeeded = Math.max(0, d.projectValue - d.ownCapital);
  const ltv = d.collateralValue > 0 ? loanNeeded / d.collateralValue : null;
  const ownPct = d.projectValue > 0 ? d.ownCapital / d.projectValue * 100 : 0;
  const ltvOk = ltv != null && ltv <= 0.8;
  const structureOk = ownPct >= 20 && ltvOk;

  return {
    loanNeeded: round(loanNeeded),
    ltv: ltv != null ? round(ltv * 100, 1) : null,
    ownPct: round(ownPct, 1),
    ltvOk,
    structureOk,
    warnings: [
      ...(ownPct < 20 ? ['ทุนตัวเองต่ำกว่า 20% — ธนาคารอาจไม่พิจารณา'] : []),
      ...(ltv != null && ltv > 0.8 ? [`LTV ${round(ltv * 100, 1)}% สูงกว่า 80% — ต้องเพิ่มหลักประกัน`] : []),
      ...(ltv == null ? ['ไม่มีหลักประกัน — ธนาคารส่วนใหญ่ต้องการ'] : []),
    ],
  };
}

// ─── STEP 6: Growth Capacity ─────────────────────────────

export function loanFromAnnualPayment(paymentPerYear: number, rAnnual: number, years: number): number {
  if (rAnnual === 0) return paymentPerYear * years;
  return paymentPerYear * (1 - Math.pow(1 + rAnnual, -years)) / rAnnual;
}

export function debtCapacity(ebVal: number, existingDS: number, assume: { rate: number; years: number }) {
  if (ebVal <= 0) return { safe: null, max: null, danger: null };
  const level = (targetDSCR: number) => {
    const maxService = ebVal / targetDSCR;
    const newServiceYr = Math.max(0, maxService - existingDS);
    const loan = loanFromAnnualPayment(newServiceYr, assume.rate, assume.years);
    return { targetDSCR, maxServicePerYear: round(maxService), newServicePerYear: round(newServiceYr), loanAmount: round(loan) };
  };
  return { safe: level(1.5), max: level(1.25), danger: level(1.0) };
}

// ─── STEP 7: Loan Action Pack ────────────────────────────

export function loanActionScore(d: {
  useOfFund: string; loanStory: string[]; bankPack: boolean[]; mondayPlan: string[];
}) {
  let score = 0;
  if (d.useOfFund && d.useOfFund.length > 20) score += 25;
  const storyFilled = (d.loanStory || []).filter(s => s && s.length > 5).length;
  score += Math.min(25, storyFilled * 5);
  const packChecked = (d.bankPack || []).filter(Boolean).length;
  score += Math.min(25, packChecked * 3);
  const planFilled = (d.mondayPlan || []).filter(s => s && s.length > 5).length;
  score += Math.min(25, planFilled * 8);
  return clamp(score, 0, 100);
}

// ─── Bank Readiness Verdict ──────────────────────────────

export function bankReadinessVerdict(m: {
  dscr: number | null; de: number | null; growthPositive: boolean;
  salesPerYear: number; wantLoan: number; useOfFundComplete: boolean;
}) {
  if ((m.dscr != null && m.dscr < 1.0) || (!m.growthPositive && m.de != null && m.de > 3))
    return { group: 'High Risk', color: 'red', action: 'ยังไม่ควรกู้เพิ่ม ต้องปรับฐานก่อน' };
  if (m.dscr != null && m.dscr >= 1.5 && m.de != null && m.de <= 2.5 && m.salesPerYear > 30e6 && m.wantLoan >= 10e6 && m.useOfFundComplete)
    return { group: 'Expansion-Ready', color: 'green', action: 'Hot Lead — พร้อมจัดโครงสร้างวงเงิน' };
  if ((m.dscr != null && m.dscr < 1.25) || !m.growthPositive || (m.de != null && m.de > 2.5))
    return { group: 'Need Cleanup', color: 'yellow', action: 'ต้องจัดบ้านก่อน — เคลียร์งบ/หนี้/กระแสเงินสด' };
  return { group: 'Ready to Structure', color: 'green', action: 'ตัวเลขพร้อม — จัดแพ็กเกจกู้ได้' };
}

// ─── 3 Moves + Bank Simulation ───────────────────────────

export function threeMoves(m: { dscr: number | null; de: number | null; growthCash: number; cycleDays: number }) {
  const moves: { metric: string; text: string }[] = [];
  if (m.dscr != null && m.dscr < 1.5) moves.push({ metric: 'DSCR', text: `ยกระดับ DSCR จาก ${round(m.dscr)} ไป ≥1.5 — ลดค่างวด/รีไฟแนนซ์ หรือเพิ่ม EBITDA` });
  if (m.growthCash < 0) moves.push({ metric: 'Growth Cash', text: `อุดรอยรั่ว: Growth Cash ติดลบ (${round(m.growthCash)}) — ลด OPEX หรือยก margin > 30%` });
  if (m.de != null && m.de > 2.5) moves.push({ metric: 'D/E', text: `ลดหนี้สั้น/เพิ่มทุน ให้ D/E < 2.5 (ตอนนี้ ${round(m.de)})` });
  if (m.cycleDays > 45) moves.push({ metric: 'Cash Cycle', text: `ลดวันเก็บหนี้/สต็อก จาก ${m.cycleDays} วัน เพื่อปลดเงินสำรองที่จม` });
  return moves.slice(0, 3);
}

export function bankOfficerComment(m: { dscr: number | null; growthCash: number; de: number | null; quickRatio: number | null; cycleDays: number }) {
  const parts: string[] = [];
  if (m.dscr == null) parts.push('ยังไม่มีภาระหนี้ให้ประเมิน DSCR');
  else if (m.dscr >= 1.5) parts.push(`ธุรกิจมี DSCR ${round(m.dscr)} อยู่ในระดับแข็งแรง`);
  else if (m.dscr >= 1.25) parts.push(`ธุรกิจมี DSCR ${round(m.dscr)} อยู่ในระดับใช้ได้`);
  else parts.push(`ธุรกิจมี DSCR ${round(m.dscr)} ต่ำกว่าเกณฑ์`);
  if (m.growthCash < 0) parts.push('แต่ Growth Cash ติดลบ จึงยังไม่แนะนำให้เพิ่มภาระหนี้');
  if (m.quickRatio != null && m.quickRatio < 1) parts.push(`สภาพคล่องเร็ว (Quick Ratio ${round(m.quickRatio)}) ยังต่ำ`);
  if (m.cycleDays > 35) parts.push(`ควรปรับ Cash Cycle จาก ${m.cycleDays} วัน เหลือไม่เกิน 35 วัน`);
  if (m.de != null && m.de > 2.5) parts.push(`และลด D/E (${round(m.de)}) ให้ต่ำกว่า 2.5`);

  let stance: string;
  if (m.dscr != null && m.dscr >= 1.5 && m.growthCash >= 0 && (m.de == null || m.de <= 2.5))
    stance = 'อนุมัติได้ (พร้อมจัดโครงสร้างวงเงิน)';
  else if (m.dscr != null && m.dscr >= 1.25 && m.growthCash >= 0)
    stance = 'อนุมัติแบบมีเงื่อนไข';
  else stance = 'ยังไม่อนุมัติเพิ่ม — ปรับฐานก่อน';

  return { stance, comment: parts.join(' ') };
}

// ─── Compute functions for Step 4-7 ─────────────────────

export function computeIbBankView(data: any) {
  const score = bankViewScore({
    ebitdaMargin: data.ebitdaMargin || 0, dscrVal: data.dscr || 0, deVal: data.de || 0,
    growthPositive: data.growthCash >= 0, cycleDays: data.cycleDays || 0,
    revenueStability: data.revenueStability ?? 0.5, salesGrowth: data.salesGrowth ?? 0.5,
    useOfFundClear: data.useOfFundClear ?? false, structureCorrect: data.structureCorrect ?? false,
  });
  return {
    computed: { ...score },
    verdict: score.total >= 75 ? 'green' : score.total >= 50 ? 'yellow' : 'red',
  };
}

export function computeIbCapitalDesign(data: any) {
  const result = capitalDesignAnalysis({
    purpose: data.purpose || 'working',
    projectValue: data.projectValue || 0,
    ownCapital: data.ownCapital || 0,
    collateralValue: data.collateralValue || 0,
  });
  const score = (result.structureOk ? 60 : 20) + (result.ltvOk ? 20 : 0) + (result.ownPct >= 30 ? 20 : result.ownPct >= 20 ? 10 : 0);
  return {
    computed: { ...result, score: clamp(score, 0, 100) },
    verdict: result.structureOk ? 'green' : result.warnings.length > 1 ? 'red' : 'yellow',
  };
}

export function computeIbGrowth(data: any) {
  const eb = data.ebitda || 0;
  const existingDS = data.annualDebtService || 0;
  const assume = { rate: data.rate || 0.07, years: data.years || 7 };
  const cap = debtCapacity(eb, existingDS, assume);
  return {
    computed: { ...cap, ebitda: eb, existingDebtService: existingDS, assumptions: assume },
    verdict: cap.safe ? 'green' : 'red',
  };
}

export function computeIbLoanAction(data: any) {
  const score = loanActionScore({
    useOfFund: data.useOfFund || '',
    loanStory: data.loanStory || [],
    bankPack: data.bankPack || [],
    mondayPlan: data.mondayPlan || [],
  });
  return {
    computed: { score, useOfFund: data.useOfFund, loanStory: data.loanStory, bankPack: data.bankPack, mondayPlan: data.mondayPlan },
    verdict: score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red',
  };
}

export function computeIbCashDna(data: any) {
  const c: CashDnaInput = {
    salesTotal: data.salesTotal || 0, creditSales: data.creditSales || 0,
    collectOldAR: data.collectOldAR || 0, cogsPaid: data.cogsPaid || 0,
    opex: data.opex || 0, interestM: data.interestM || 0,
    principalM: data.principalM || 0, taxM: data.taxM || 0,
  };

  const ci = cashIn(c);
  const rc = realCash(c);
  const sp = surplus(c);
  const gc = growthCash(c);
  const verd = cashDnaVerdict(c);
  const score = cashDnaScore(c);

  return {
    computed: {
      cashIn: round(ci), realCash: round(rc), surplus: round(sp), growthCash: round(gc),
      realCashMargin: ci > 0 ? round(rc / ci * 100, 1) : null,
      layers: verd.layers,
      score,
    },
    verdict: verd.overall,
  };
}
