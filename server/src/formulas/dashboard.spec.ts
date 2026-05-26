import { computeDashboard, Inputs, BusinessConfig } from './dashboard';

const fullInputs: Inputs = {
  grossSales: 500000,
  creditSales: 150000,
  cogs: 300000,
  otherExpenses: 135000,
  cashIn: 380000,
  arBalance: 220000,
  apBalance: 160000,
  cashOnHand: 280000,
  leakNote: 'ค่าขนส่งเกินงบ — 18,000 บาท',
};

const business: BusinessConfig = { monthlyDebtService: 45000 };

describe('computeDashboard', () => {
  it('computes all 10 boxes with full inputs', () => {
    const result = computeDashboard(fullInputs, business);
    expect(Object.keys(result.boxes)).toHaveLength(10);
    expect(result.verdict).toBeDefined();
  });

  it('box 1 — gross sales passthrough', () => {
    const { boxes } = computeDashboard(fullInputs, business);
    expect(boxes['1_grossSales'].value).toBe(500000);
  });

  it('box 2 — sales mix', () => {
    const { boxes } = computeDashboard(fullInputs, business);
    expect(boxes['2_salesMix'].cashPct).toBeCloseTo(0.7);
    expect(boxes['2_salesMix'].creditPct).toBeCloseTo(0.3);
    expect(boxes['2_salesMix'].color).toBe('green');
  });

  it('box 3 — gross margin', () => {
    const { boxes } = computeDashboard(fullInputs, business);
    expect(boxes['3_grossMargin'].value).toBeCloseTo(0.4);
    expect(boxes['3_grossMargin'].color).toBe('green');
  });

  it('box 4 — net profit', () => {
    const { boxes } = computeDashboard(fullInputs, business);
    expect(boxes['4_netProfit'].value).toBe(65000);
    expect(boxes['4_netProfit'].color).toBe('green');
  });

  it('box 5 — expense ratio', () => {
    const { boxes } = computeDashboard(fullInputs, business);
    expect(boxes['5_expenseRatio'].value).toBeCloseTo(0.27);
    expect(boxes['5_expenseRatio'].color).toBe('yellow');
  });

  it('box 7 — cash in with warning', () => {
    const { boxes } = computeDashboard(fullInputs, business);
    expect(boxes['7_cashIn'].value).toBe(380000);
    // 380k / 500k = 76% > 70%, no warning
    expect(boxes['7_cashIn'].warning).toBeNull();
  });

  it('box 7 — cash in triggers warning when ratio < 70%', () => {
    const input = { ...fullInputs, cashIn: 300000 }; // 60%
    const { boxes } = computeDashboard(input, business);
    expect(boxes['7_cashIn'].warning).toBeTruthy();
  });

  it('box 10 — runway', () => {
    const { boxes } = computeDashboard(fullInputs, business);
    // burn = 135000 + 45000 = 180000, cash = 280000 → 1.56
    const b10 = boxes['10_runway'];
    expect(b10.months).toBeCloseTo(1.556, 2);
    expect(b10.color).toBe('red');
  });

  it('box 10 — no burn = unlimited', () => {
    const input = { ...fullInputs, otherExpenses: 0 };
    const biz = { monthlyDebtService: 0 };
    const { boxes } = computeDashboard(input, biz);
    expect(boxes['10_runway'].months).toBeNull();
  });

  it('verdict — critical when runway < 3', () => {
    const { verdict } = computeDashboard(fullInputs, business);
    expect(verdict.level).toBe('critical');
    expect(verdict.messages.length).toBeGreaterThan(0);
  });

  it('verdict — ok when everything healthy', () => {
    const healthy: Inputs = {
      grossSales: 600000,
      creditSales: 60000,
      cogs: 300000,
      otherExpenses: 100000,
      cashIn: 550000,
      arBalance: 80000,
      apBalance: 120000,
      cashOnHand: 1000000,
      leakNote: null,
    };
    const { verdict } = computeDashboard(healthy, { monthlyDebtService: 30000 });
    expect(verdict.level).toBe('ok');
  });

  // Edge cases
  it('handles all null inputs without crashing', () => {
    const empty: Inputs = {
      grossSales: null, creditSales: null, cogs: null,
      otherExpenses: null, cashIn: null, arBalance: null,
      apBalance: null, cashOnHand: null, leakNote: null,
    };
    const result = computeDashboard(empty, { monthlyDebtService: 0 });
    expect(Object.keys(result.boxes)).toHaveLength(10);
  });

  it('grossSales = 0 — no division by zero', () => {
    const input = { ...fullInputs, grossSales: 0 };
    const result = computeDashboard(input, business);
    expect(result.boxes['2_salesMix'].value).toBeNull();
    expect(result.boxes['3_grossMargin'].value).toBeNull();
  });
});
