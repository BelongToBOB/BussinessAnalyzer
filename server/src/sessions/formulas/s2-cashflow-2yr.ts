// S2b Balance Sheet + Cash Flow from 2 years
// Complex: 2-year balance sheet, derived cash flow statement, financial ratios

export interface BalanceSheetYear {
  // Assets
  cash: number;
  accountsReceivable: number;
  inventory: number;
  otherCurrentAssets: number;
  fixedAssets: number;
  accumulatedDepreciation: number;
  otherNonCurrentAssets: number;
  // Liabilities
  accountsPayable: number;
  shortTermDebt: number;
  otherCurrentLiabilities: number;
  longTermDebt: number;
  otherNonCurrentLiabilities: number;
  // Equity
  paidUpCapital: number;
  retainedEarnings: number;
}

export interface IncomeDataYear {
  revenue: number;
  netProfit: number;
  depreciation: number;
  interest: number;
  tax: number;
}

export interface S2bInputs {
  year1: BalanceSheetYear;
  year2: BalanceSheetYear;
  income1: IncomeDataYear;
  income2: IncomeDataYear;
}

export interface CashFlowStatement {
  // CFO — Operating
  netProfit: number;
  depreciation: number;
  deltaAR: number;
  deltaInventory: number;
  deltaAP: number;
  deltaOtherCurrent: number;
  cfo: number;
  // CFI — Investing
  deltaFixedAssets: number;
  deltaOtherNonCurrent: number;
  cfi: number;
  // CFF — Financing
  deltaShortTermDebt: number;
  deltaLongTermDebt: number;
  deltaEquity: number;
  cff: number;
  // Net
  netCashChange: number;
}

export interface FinancialRatios {
  currentRatio: number | null;
  quickRatio: number | null;
  debtToEquity: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  roa: number | null;
  roe: number | null;
}

export interface S2bComputed {
  totalAssets1: number;
  totalAssets2: number;
  totalLiabilities1: number;
  totalLiabilities2: number;
  totalEquity1: number;
  totalEquity2: number;
  cashFlow: CashFlowStatement;
  ratios: FinancialRatios;
}

export interface S2bResult {
  computed: S2bComputed;
  verdict: 'green' | 'yellow' | 'red';
}

function totalAssets(bs: BalanceSheetYear): number {
  return bs.cash + bs.accountsReceivable + bs.inventory + bs.otherCurrentAssets
    + bs.fixedAssets - bs.accumulatedDepreciation + bs.otherNonCurrentAssets;
}

function totalCurrentAssets(bs: BalanceSheetYear): number {
  return bs.cash + bs.accountsReceivable + bs.inventory + bs.otherCurrentAssets;
}

function totalLiabilities(bs: BalanceSheetYear): number {
  return bs.accountsPayable + bs.shortTermDebt + bs.otherCurrentLiabilities
    + bs.longTermDebt + bs.otherNonCurrentLiabilities;
}

function totalCurrentLiabilities(bs: BalanceSheetYear): number {
  return bs.accountsPayable + bs.shortTermDebt + bs.otherCurrentLiabilities;
}

function totalEquity(bs: BalanceSheetYear): number {
  return bs.paidUpCapital + bs.retainedEarnings;
}

function safeDivide(a: number, b: number): number | null {
  return b !== 0 ? a / b : null;
}

export function computeS2b(inputs: S2bInputs): S2bResult {
  const { year1, year2, income2 } = inputs;

  // Delta = year2 - year1 (change during period)
  const deltaAR = year2.accountsReceivable - year1.accountsReceivable;
  const deltaInventory = year2.inventory - year1.inventory;
  const deltaAP = year2.accountsPayable - year1.accountsPayable;
  const deltaOtherCurrent = (year2.otherCurrentAssets - year1.otherCurrentAssets)
    - (year2.otherCurrentLiabilities - year1.otherCurrentLiabilities);

  // CFO
  const cfo = income2.netProfit + income2.depreciation - deltaAR - deltaInventory + deltaAP - deltaOtherCurrent;

  // CFI
  const deltaFixedAssets = (year2.fixedAssets - year2.accumulatedDepreciation)
    - (year1.fixedAssets - year1.accumulatedDepreciation) + income2.depreciation;
  const deltaOtherNonCurrent = year2.otherNonCurrentAssets - year1.otherNonCurrentAssets;
  const cfi = -(deltaFixedAssets + deltaOtherNonCurrent);

  // CFF
  const deltaShortTermDebt = year2.shortTermDebt - year1.shortTermDebt;
  const deltaLongTermDebt = year2.longTermDebt - year1.longTermDebt;
  const deltaEquityVal = totalEquity(year2) - totalEquity(year1) - income2.netProfit;
  const cff = deltaShortTermDebt + deltaLongTermDebt + deltaEquityVal;

  const netCashChange = cfo + cfi + cff;

  const cashFlow: CashFlowStatement = {
    netProfit: income2.netProfit,
    depreciation: income2.depreciation,
    deltaAR,
    deltaInventory,
    deltaAP,
    deltaOtherCurrent,
    cfo,
    deltaFixedAssets,
    deltaOtherNonCurrent,
    cfi,
    deltaShortTermDebt,
    deltaLongTermDebt,
    deltaEquity: deltaEquityVal,
    cff,
    netCashChange,
  };

  // Ratios (year 2)
  const ta2 = totalAssets(year2);
  const tl2 = totalLiabilities(year2);
  const te2 = totalEquity(year2);
  const tca2 = totalCurrentAssets(year2);
  const tcl2 = totalCurrentLiabilities(year2);

  const ratios: FinancialRatios = {
    currentRatio: safeDivide(tca2, tcl2),
    quickRatio: safeDivide(tca2 - year2.inventory, tcl2),
    debtToEquity: safeDivide(tl2, te2),
    grossMargin: null, // would need COGS from income statement
    netMargin: safeDivide(income2.netProfit, income2.revenue),
    roa: safeDivide(income2.netProfit, ta2),
    roe: safeDivide(income2.netProfit, te2),
  };

  const computed: S2bComputed = {
    totalAssets1: totalAssets(year1),
    totalAssets2: ta2,
    totalLiabilities1: totalLiabilities(year1),
    totalLiabilities2: tl2,
    totalEquity1: totalEquity(year1),
    totalEquity2: te2,
    cashFlow,
    ratios,
  };

  // Verdict based on CFO
  let verdict: 'green' | 'yellow' | 'red' = 'green';
  if (cfo < 0) {
    verdict = 'red';
  } else if (netCashChange < 0) {
    verdict = 'yellow';
  }

  return { computed, verdict };
}
