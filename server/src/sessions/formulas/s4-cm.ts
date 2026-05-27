// S4b Contribution Margin formula engine

export interface S4bInputs {
  price: number;
  // Variable costs (6 items)
  materialCost: number;
  laborCost: number;
  packagingCost: number;
  shippingCost: number;
  commissionCost: number;
  otherVariableCost: number;
  // Fixed & financing
  fixedCost: number;
  financingCost: number;
}

export interface S4bComputed {
  totalVC: number;
  cm: number;
  cmRatio: number | null;
  opBreakEven: number | null;
  cashBreakEven: number | null;
}

export interface S4bResult {
  computed: S4bComputed;
  verdict: 'green' | 'yellow' | 'red';
}

export function computeS4b(raw: any): S4bResult {
  // Accept both naming conventions
  const inputs: S4bInputs = {
    price: raw.price ?? 0,
    materialCost: raw.materialCost ?? raw.materials ?? 0,
    laborCost: raw.laborCost ?? raw.variableLabor ?? 0,
    packagingCost: raw.packagingCost ?? 0,
    shippingCost: raw.shippingCost ?? raw.shipping ?? 0,
    commissionCost: raw.commissionCost ?? raw.commission ?? 0,
    otherVariableCost: raw.otherVariableCost ?? raw.platformFee ?? 0,
    fixedCost: raw.fixedCost ?? 0,
    financingCost: raw.financingCost ?? 0,
  };
  const totalVC = inputs.materialCost + inputs.laborCost + inputs.packagingCost
    + inputs.shippingCost + inputs.commissionCost + inputs.otherVariableCost;

  const cm = inputs.price - totalVC;
  const cmRatio = inputs.price > 0 ? cm / inputs.price : null;

  // Break-even calculations
  let opBreakEven: number | null = null;
  let cashBreakEven: number | null = null;
  if (cm > 0) {
    opBreakEven = inputs.fixedCost / cm;
    cashBreakEven = (inputs.fixedCost + inputs.financingCost) / cm;
  }

  // Verdict
  let verdict: 'green' | 'yellow' | 'red' = 'green';
  if (cm <= 0) {
    verdict = 'red';
  } else if (cmRatio !== null && cmRatio < 0.2) {
    verdict = 'yellow';
  }

  return {
    computed: { totalVC, cm, cmRatio, opBreakEven, cashBreakEven },
    verdict,
  };
}
