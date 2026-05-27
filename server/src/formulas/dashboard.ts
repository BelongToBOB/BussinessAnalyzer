// Dashboard formula engine — SERVER-SIDE ONLY
// These formulas are WinWin IP. Never expose the logic to the client.
// Only computed values are returned via API.

export interface Inputs {
  grossSales: number | null;
  creditSales: number | null;
  cogs: number | null;
  otherExpenses: number | null;
  cashIn: number | null;
  arBalance: number | null;
  apBalance: number | null;
  cashOnHand: number | null;
  leakNote: string | null;
}

export interface BusinessConfig {
  monthlyDebtService: number;
}

export type StatusColor = 'green' | 'yellow' | 'red' | null;
export type VerdictLevel = 'ok' | 'warning' | 'critical';

export interface Box {
  value?: number | string | null;
  label: string;
  format: 'currency' | 'percent' | 'text' | 'number' | 'mix';
  color?: StatusColor;
  note?: string | null;
  warning?: string | null;
  education?: { formula: string; advice: string } | null;
  // Box 2 specific
  cashPct?: number | null;
  creditPct?: number | null;
  display?: string | null;
  // Box 10 specific
  months?: number | null;
  monthlyBurn?: number;
  cash?: number;
  debtService?: number;
}

export interface Verdict {
  level: VerdictLevel;
  messages: string[];
}

export interface DashboardResult {
  boxes: Record<string, Box>;
  verdict: Verdict;
}

const EMPTY: Box = { value: null, label: '', format: 'currency', display: '—' };

function money(n: number): string {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n);
}

function pct(n: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(n);
}

// Box 1 — Gross Sales
function box1(input: Inputs): Box {
  return {
    value: input.grossSales,
    label: 'ยอดขายรวม',
    format: 'currency',
    color: null,
    note: 'เดือนนี้ขายได้กี่บาท — ตัวตั้งต้น แต่ยังไม่ใช่เงินในมือ',
    education: {
      formula: 'ผลรวม invoice / receipt เดือนนี้',
      advice: 'ดูแนวโน้ม 3 เดือนล่าสุดที่ History — ยอดขายขยับขึ้นหรือลง',
    },
  };
}

// Box 2 — Sales Mix (cash vs credit)
function box2(input: Inputs): Box {
  if (!input.grossSales || input.grossSales <= 0) return { ...EMPTY, label: 'ขายสด / ขายเชื่อ', format: 'mix' };

  const credit = input.creditSales ?? 0;
  const cash = input.grossSales - credit;
  const cashPct = cash / input.grossSales;
  const creditPct = credit / input.grossSales;

  return {
    cashPct,
    creditPct,
    label: 'ขายสด / ขายเชื่อ',
    format: 'mix',
    display: `ได้เงินแล้ว ${pct(cashPct)} · ยังเป็นลูกหนี้ ${pct(creditPct)}`,
    color: creditPct > 0.5 ? 'red' : creditPct > 0.3 ? 'yellow' : 'green',
    education: {
      formula: '(ยอดขายเชื่อ ÷ ยอดขายรวม) × 100',
      advice: 'ขายเชื่อยิ่งมาก เงินยิ่งเข้าช้า — ต้องเร่งเก็บหรือลดเครดิตเทอม',
    },
  };
}

// Box 3 — Gross Margin %
function box3(input: Inputs): Box {
  if (!input.grossSales || input.grossSales <= 0) return { ...EMPTY, label: 'Gross Margin', format: 'percent' };
  if (input.cogs == null) return { ...EMPTY, label: 'Gross Margin', format: 'percent' };

  const gm = (input.grossSales - input.cogs) / input.grossSales;
  return {
    value: gm,
    format: 'percent',
    label: 'Gross Margin (กำไรขั้นต้น %)',
    color: gm >= 0.3 ? 'green' : gm >= 0.1 ? 'yellow' : 'red',
    education: {
      formula: '(ยอดขาย − ต้นทุนสินค้า) ÷ ยอดขาย × 100',
      advice: 'ขายแล้วเหลือกำไรขั้นต้นกี่ % — ดูเทรนด์ ถ้าลดลงเรื่อยๆ = อันตราย ต่ำกว่า 30% ปรับราคาหรือลดต้นทุน',
    },
  };
}

// Box 4 — Net Profit
function box4(input: Inputs): Box {
  if (input.grossSales == null || input.cogs == null || input.otherExpenses == null)
    return { ...EMPTY, label: 'Net Profit', format: 'currency' };

  const np = input.grossSales - input.cogs - input.otherExpenses;
  return {
    value: np,
    format: 'currency',
    label: 'Net Profit (กำไรบัญชี)',
    color: np > 0 ? 'green' : np === 0 ? 'yellow' : 'red',
    note: 'ยังไม่ใช่เงินสด — เช็คช่อง 7 ต่อ',
    education: {
      formula: 'ยอดขาย − ต้นทุน − ค่าใช้จ่ายอื่น',
      advice: 'หักค่าใช้จ่ายแล้ว เหลือกำไรบัญชีเท่าไหร่ — ยังไม่ใช่เงินสด ดู Cash In ประกอบ',
    },
  };
}

// Box 5 — Expense Ratio
function box5(input: Inputs): Box {
  if (!input.grossSales || input.grossSales <= 0) return { ...EMPTY, label: 'ค่าใช้จ่ายกินยอดขาย', format: 'percent' };
  if (input.otherExpenses == null) return { ...EMPTY, label: 'ค่าใช้จ่ายกินยอดขาย', format: 'percent' };

  const ratio = input.otherExpenses / input.grossSales;
  return {
    value: ratio,
    format: 'percent',
    label: 'ค่าใช้จ่ายกินยอดขาย %',
    color: ratio < 0.2 ? 'green' : ratio < 0.35 ? 'yellow' : 'red',
    education: {
      formula: '(OPEX ÷ ยอดขาย) × 100',
      advice: 'ค่าใช้จ่ายประจำกินยอดขายกี่ % — ยิ่งสูงยิ่งกินกำไร เกิน 35% รื้อ Expense Map ไล่หาตัวบวม',
    },
  };
}

// Box 6 — Leak Note
function box6(input: Inputs): Box {
  return {
    value: input.leakNote ?? '',
    format: 'text',
    label: 'จุดรั่วเดือนนี้',
    note: 'เดือนนี้เงินรั่วจากจุดไหนมากสุด — ไล่อุดที่ Expense Map',
    education: {
      formula: 'บันทึกของเจ้าของ (textarea)',
      advice: 'เขียนทุกเดือนแม้ไม่มี รวมกัน 6 เดือนเห็น pattern',
    },
  };
}

// Box 7 — Cash In
function box7(input: Inputs): Box {
  if (input.cashIn == null) return { ...EMPTY, label: 'Cash In', format: 'currency' };

  let warning: string | null = null;
  if (input.grossSales && input.grossSales > 0) {
    const ratio = input.cashIn / input.grossSales;
    if (ratio < 0.7) {
      warning = `เงินเข้าจริง ${pct(ratio)} ของยอดขาย — เงินไปจมที่ลูกหนี้/สต็อก`;
    }
  }

  return {
    value: input.cashIn,
    format: 'currency',
    label: 'Cash In (เงินเข้าจริง)',
    warning,
    education: {
      formula: 'ผลรวมเงินเข้าบัญชีเดือนนี้ (จาก Statement)',
      advice: 'เก็บเงินสดได้จริงกี่บาท — ถ้าต่ำกว่ายอดขายมาก เงินไปจมที่ลูกหนี้ ลด Credit Term',
    },
  };
}

// Box 8 — AR Balance
function box8(input: Inputs): Box {
  return {
    value: input.arBalance, format: 'currency', label: 'ลูกหนี้ค้างเก็บ',
    education: {
      formula: 'ยอด AR ณ สิ้นเดือน',
      advice: 'เงินที่รอเข้ากระเป๋า — ขายได้แต่ยังไม่ได้เงิน บวมขึ้นต่อเนื่อง = ทบทวนเครดิตเทอม',
    },
  };
}

// Box 9 — AP Balance
function box9(input: Inputs): Box {
  return {
    value: input.apBalance, format: 'currency', label: 'เจ้าหนี้ค้างจ่าย',
    education: {
      formula: 'ยอด AP ณ สิ้นเดือน',
      advice: 'เดือนนี้ต้องจ่ายซัพพลายเออร์กี่บาท — เครดิตช่วยหมุน แต่ต้องจ่ายไหว',
    },
  };
}

// Box 10 — Runway
// NOTE: monthlyBurn does NOT include COGS — this is "operating runway"
// (how long cash lasts if sales stop today). Confirm with Win if COGS should be included.
function box10(input: Inputs, business: BusinessConfig): Box {
  const debtService = business.monthlyDebtService ?? 0;
  const otherExp = input.otherExpenses ?? 0;
  const cash = input.cashOnHand ?? 0;
  const monthlyBurn = otherExp + debtService;

  if (monthlyBurn <= 0) {
    return {
      months: null,
      label: 'Runway',
      format: 'number',
      display: 'ไม่มีค่าใช้จ่ายประจำ — ใช้ได้ไม่จำกัด',
    };
  }

  const runwayMonths = cash / monthlyBurn;
  return {
    months: runwayMonths,
    monthlyBurn,
    cash,
    debtService,
    label: 'Runway',
    format: 'number',
    display: `ผ่อนหนี้ ${money(debtService)} บาท/เดือน · เงินสด ${money(cash)} บาท · Runway ${runwayMonths.toFixed(1)} เดือน`,
    color: runwayMonths >= 6 ? 'green' : runwayMonths >= 3 ? 'yellow' : 'red',
    education: {
      formula: 'เงินสด ÷ (OPEX + ผ่อนหนี้ ต่อเดือน)',
      advice: 'ถ้าเดือนหน้าเงียบ อยู่ได้กี่เดือน — ต่ำกว่า 3 เดือน = วิกฤต ระดมเงินหรือลดค่าใช้จ่ายด่วน',
    },
  };
}

// Verdict — overall dashboard summary
function computeVerdict(boxes: Record<string, Box>): Verdict {
  const messages: string[] = [];
  let level: VerdictLevel = 'ok';

  // Runway low
  const b10 = boxes['10_runway'];
  if (b10?.months != null && b10.months < 3) {
    messages.push(`Runway ${b10.months.toFixed(1)} เดือน — ต่ำกว่า 3 เดือน ระวังกระแสเงินสด`);
    level = 'critical';
  }

  // Net Profit negative
  const b4 = boxes['4_netProfit'];
  if (b4?.value != null && typeof b4.value === 'number' && b4.value < 0) {
    messages.push(`ขาดทุน ${money(-b4.value)} บาท — เช็ค Gross Margin และค่าใช้จ่ายประจำ`);
    if (level !== 'critical') level = 'critical';
  }

  // Cash In warning
  const b7 = boxes['7_cashIn'];
  if (b7?.warning) {
    messages.push(b7.warning);
    if (level === 'ok') level = 'warning';
  }

  // Expense ratio high
  const b5 = boxes['5_expenseRatio'];
  if (b5?.value != null && typeof b5.value === 'number' && b5.value > 0.35) {
    messages.push(`ค่าใช้จ่ายประจำกินยอดขาย ${pct(b5.value)} — สูงเกินไป ไล่อุดที่ Expense Map`);
    if (level === 'ok') level = 'warning';
  }

  if (messages.length === 0) {
    messages.push('เดือนนี้ดูสุขภาพดี — รักษาวินัยนี้ไว้');
  }

  return { level, messages };
}

/** Convert Prisma Decimal fields to number inputs */
export function toInputs(entry: {
  grossSales: any;
  creditSales: any;
  cogs: any;
  otherExpenses: any;
  cashIn: any;
  arBalance: any;
  apBalance: any;
  cashOnHand: any;
  leakNote: string | null;
}): Inputs {
  const n = (d: any) => (d != null ? Number(d) : null);
  return {
    grossSales: n(entry.grossSales),
    creditSales: n(entry.creditSales),
    cogs: n(entry.cogs),
    otherExpenses: n(entry.otherExpenses),
    cashIn: n(entry.cashIn),
    arBalance: n(entry.arBalance),
    apBalance: n(entry.apBalance),
    cashOnHand: n(entry.cashOnHand),
    leakNote: entry.leakNote,
  };
}

/** Main computation — takes raw inputs + business config, returns full dashboard */
export function computeDashboard(input: Inputs, business: BusinessConfig): DashboardResult {
  const boxes: Record<string, Box> = {
    '1_grossSales': box1(input),
    '2_salesMix': box2(input),
    '3_grossMargin': box3(input),
    '4_netProfit': box4(input),
    '5_expenseRatio': box5(input),
    '6_leakNote': box6(input),
    '7_cashIn': box7(input),
    '8_arBalance': box8(input),
    '9_apBalance': box9(input),
    '10_runway': box10(input, business),
  };

  const verdict = computeVerdict(boxes);

  return { boxes, verdict };
}
