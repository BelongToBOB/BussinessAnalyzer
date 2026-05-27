// S4a Pricing Calculator formula engine

export interface S4aPricingInputs {
  costPerUnit: number;
  opexPct: number;    // as decimal, e.g. 0.15
  profitPct: number;  // as decimal, e.g. 0.20
}

export interface S4aMarkupInputs {
  costPerUnit2: number;
  sellingPrice: number;
}

export interface S4aInputs {
  pricing: S4aPricingInputs;
  markup?: S4aMarkupInputs | null;
}

export interface S4aComputed {
  totalPct: number;
  price: number | null;          // null if totalPct >= 1
  // Markup checker
  markupPct: number | null;
  marginPct: number | null;
}

export interface S4aResult {
  computed: S4aComputed;
  verdict: 'green' | 'yellow' | 'red';
}

export function computeS4a(inputs: S4aInputs): S4aResult {
  const { costPerUnit, opexPct, profitPct } = inputs.pricing;
  const totalPct = opexPct + profitPct;

  // Price = cost / (1 - totalPct)
  let price: number | null = null;
  if (totalPct < 1) {
    price = costPerUnit / (1 - totalPct);
  }

  // Markup checker
  let markupPct: number | null = null;
  let marginPct: number | null = null;
  if (inputs.markup) {
    const { costPerUnit2, sellingPrice } = inputs.markup;
    if (costPerUnit2 > 0) {
      markupPct = (sellingPrice - costPerUnit2) / costPerUnit2;
    }
    if (sellingPrice > 0) {
      marginPct = (sellingPrice - costPerUnit2) / sellingPrice;
    }
  }

  // Verdict: based on whether total pct is sustainable
  let verdict: 'green' | 'yellow' | 'red' = 'green';
  if (totalPct >= 1) {
    verdict = 'red';
  } else if (totalPct >= 0.7) {
    verdict = 'yellow';
  }

  return {
    computed: { totalPct, price, markupPct, marginPct },
    verdict,
  };
}
