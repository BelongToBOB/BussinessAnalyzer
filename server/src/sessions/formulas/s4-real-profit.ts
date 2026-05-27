// S4c Real Profit formula engine
// 4 steps: netProfit + depreciation - working capital changes - obligations - reinvestment

export interface S4cInputs {
  // Step 1: Accounting profit
  netProfit: number;
  depreciation: number;
  // Step 2: Working capital changes
  deltaAR: number;          // increase in AR (money stuck)
  deltaInventory: number;   // increase in inventory
  deltaAP: number;          // increase in AP (money saved)
  deltaTax: number;         // increase in tax payable
  // Step 3: Obligations
  debtPrincipal: number;
  ownerDraw: number;
  // Step 4: Reinvestment
  reinvestment: number;
}

export interface S4cComputed {
  step1: number;  // netProfit + depreciation
  step2: number;  // working capital adjustment
  step3: number;  // after obligations
  realProfit: number; // final
}

export interface S4cResult {
  computed: S4cComputed;
  verdict: 'green' | 'yellow' | 'red';
}

export function computeS4c(inputs: S4cInputs): S4cResult {
  // Step 1: Cash from accounting
  const step1 = inputs.netProfit + inputs.depreciation;

  // Step 2: Working capital adjustment (money stuck vs money freed)
  const wcAdjustment = inputs.deltaAR + inputs.deltaInventory - inputs.deltaAP - inputs.deltaTax;
  const step2 = step1 - wcAdjustment;

  // Step 3: After obligations
  const step3 = step2 - inputs.debtPrincipal - inputs.ownerDraw;

  // Step 4: After reinvestment
  const realProfit = step3 - inputs.reinvestment;

  // Verdict
  let verdict: 'green' | 'yellow' | 'red' = 'green';
  if (realProfit < 0) {
    verdict = 'red';
  } else if (realProfit === 0 || (step1 > 0 && realProfit / step1 < 0.1)) {
    verdict = 'yellow';
  }

  return {
    computed: { step1, step2, step3, realProfit },
    verdict,
  };
}
