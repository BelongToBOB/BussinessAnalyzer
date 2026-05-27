// S7 One-Page Business Plan formula engine

export interface S7Inputs {
  // Business info (text fields)
  businessName: string;
  businessType: string;
  yearsInBusiness: number;
  annualRevenue: number;

  // Section 1: Purpose
  loanPurpose: string;
  loanAmount: number;
  expectedOutcome: string;

  // Section 2: Repayment
  cashFlow: number;
  monthlyPayment: number;
  repaymentSource: string;

  // Section 3: Risk
  mainRisk: string;
  mitigationPlan: string;

  // Section 4: Control
  controlMeasure: string;
  reviewFrequency: string;

  // Readiness checklist
  hasFinancialStatements: boolean;
  hasCollateral: boolean;
  hasBusinessPlan: boolean;
  hasCashFlowProjection: boolean;
}

export interface S7Computed {
  repaymentRatio: number | null; // cashFlow / monthlyPayment
  readinessScore: number;        // 0-4
  readinessChecklist: Array<{ item: string; ready: boolean }>;
}

export interface S7Result {
  computed: S7Computed;
  verdict: 'green' | 'yellow' | 'red';
}

export function computeS7(inputs: S7Inputs): S7Result {
  // Repayment ratio
  let repaymentRatio: number | null = null;
  if (inputs.monthlyPayment > 0) {
    repaymentRatio = inputs.cashFlow / inputs.monthlyPayment;
  }

  // Readiness checklist
  const readinessChecklist = [
    { item: 'Financial statements available', ready: inputs.hasFinancialStatements },
    { item: 'Collateral available', ready: inputs.hasCollateral },
    { item: 'Business plan prepared', ready: inputs.hasBusinessPlan },
    { item: 'Cash flow projection available', ready: inputs.hasCashFlowProjection },
  ];

  const readinessScore = readinessChecklist.filter(c => c.ready).length;

  // Verdict
  let verdict: 'green' | 'yellow' | 'red' = 'green';
  if (readinessScore <= 1 || (repaymentRatio !== null && repaymentRatio < 1)) {
    verdict = 'red';
  } else if (readinessScore <= 2 || (repaymentRatio !== null && repaymentRatio < 1.5)) {
    verdict = 'yellow';
  }

  return {
    computed: { repaymentRatio, readinessScore, readinessChecklist },
    verdict,
  };
}
