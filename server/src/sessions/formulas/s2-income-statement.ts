// S2a Income Statement formula engine
// 7 line items with % of revenue computed

export interface S2aInputs {
  revenue: number;
  cogs: number;
  sellingAdmin: number;
  depreciation: number;
  interest: number;
  tax: number;
}

export interface S2aLineItem {
  value: number;
  pctOfRevenue: number | null;
}

export interface S2aComputed {
  revenue: S2aLineItem;
  cogs: S2aLineItem;
  grossProfit: S2aLineItem;
  sellingAdmin: S2aLineItem;
  ebitda: S2aLineItem;
  depreciation: S2aLineItem;
  ebit: S2aLineItem;
  interest: S2aLineItem;
  preTaxProfit: S2aLineItem;
  tax: S2aLineItem;
  netProfit: S2aLineItem;
}

export interface S2aResult {
  computed: S2aComputed;
  verdict: 'green' | 'yellow' | 'red';
}

function lineItem(value: number, revenue: number): S2aLineItem {
  return {
    value,
    pctOfRevenue: revenue > 0 ? value / revenue : null,
  };
}

export function computeS2a(inputs: S2aInputs): S2aResult {
  const { revenue, cogs, sellingAdmin, depreciation, interest, tax } = inputs;

  const grossProfit = revenue - cogs;
  const ebitda = grossProfit - sellingAdmin;
  const ebit = ebitda - depreciation;
  const preTaxProfit = ebit - interest;
  const netProfit = preTaxProfit - tax;

  const computed: S2aComputed = {
    revenue: lineItem(revenue, revenue),
    cogs: lineItem(cogs, revenue),
    grossProfit: lineItem(grossProfit, revenue),
    sellingAdmin: lineItem(sellingAdmin, revenue),
    ebitda: lineItem(ebitda, revenue),
    depreciation: lineItem(depreciation, revenue),
    ebit: lineItem(ebit, revenue),
    interest: lineItem(interest, revenue),
    preTaxProfit: lineItem(preTaxProfit, revenue),
    tax: lineItem(tax, revenue),
    netProfit: lineItem(netProfit, revenue),
  };

  let verdict: 'green' | 'yellow' | 'red' = 'green';
  if (netProfit < 0) {
    verdict = 'red';
  } else if (revenue > 0 && netProfit / revenue < 0.05) {
    verdict = 'yellow';
  }

  return { computed, verdict };
}
