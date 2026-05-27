// S3 Cashflow 4 Layers formula engine

export interface S3Inputs {
  // Layer 1
  cashSales: number;
  arCollected: number;
  // Layer 2
  cogsPaid: number;
  // Layer 3
  salary: number;
  rent: number;
  marketing: number;
  otherOpex: number;
  // Layer 4
  debtPrincipal: number;
  interest: number;
  tax: number;
  capex: number;
  ownerDraw: number;
}

export interface S3Diagnosis {
  checkpoint: number;
  label: string;
  passed: boolean;
  note: string;
}

export interface S3Computed {
  cashIn: number;
  realCash: number;
  surplus: number;
  growthCash: number;
  layer1Total: number;
  layer2Total: number;
  layer3Total: number;
  layer4Total: number;
  diagnosis: S3Diagnosis[];
}

export interface S3Result {
  computed: S3Computed;
  verdict: 'green' | 'yellow' | 'red';
}

export function computeS3(inputs: S3Inputs): S3Result {
  // Layer 1: Cash In
  const cashIn = inputs.cashSales + inputs.arCollected;

  // Layer 2: Real Cash
  const realCash = cashIn - inputs.cogsPaid;

  // Layer 3: Surplus
  const opex = inputs.salary + inputs.rent + inputs.marketing + inputs.otherOpex;
  const surplus = realCash - opex;

  // Layer 4: Growth Cash
  const obligations = inputs.debtPrincipal + inputs.interest + inputs.tax + inputs.capex + inputs.ownerDraw;
  const growthCash = surplus - obligations;

  // Verdict
  let verdict: 'green' | 'yellow' | 'red' = 'green';
  if (growthCash < 0) {
    verdict = 'red';
  } else if (growthCash === 0) {
    verdict = 'yellow';
  }

  // 7-point diagnosis
  const diagnosis: S3Diagnosis[] = [
    {
      checkpoint: 1,
      label: 'Cash In > COGS',
      passed: cashIn > inputs.cogsPaid,
      note: cashIn > inputs.cogsPaid ? 'Cash in covers cost of goods' : 'Cash in does not cover COGS — collect faster',
    },
    {
      checkpoint: 2,
      label: 'Real Cash > OPEX',
      passed: realCash > opex,
      note: realCash > opex ? 'Real cash covers operating expenses' : 'Operating expenses exceed real cash',
    },
    {
      checkpoint: 3,
      label: 'Surplus > 0',
      passed: surplus > 0,
      note: surplus > 0 ? 'Business generates operating surplus' : 'No operating surplus — cut expenses',
    },
    {
      checkpoint: 4,
      label: 'Surplus > Debt Service',
      passed: surplus > (inputs.debtPrincipal + inputs.interest),
      note: surplus > (inputs.debtPrincipal + inputs.interest) ? 'Can cover debt payments' : 'Surplus cannot cover debt — restructure',
    },
    {
      checkpoint: 5,
      label: 'Growth Cash > 0',
      passed: growthCash > 0,
      note: growthCash > 0 ? 'Business has growth capital' : 'No growth capital left',
    },
    {
      checkpoint: 6,
      label: 'Owner Draw < 50% of Surplus',
      passed: surplus > 0 ? inputs.ownerDraw < surplus * 0.5 : false,
      note: surplus > 0 && inputs.ownerDraw < surplus * 0.5 ? 'Owner draw is sustainable' : 'Owner draw may be too high',
    },
    {
      checkpoint: 7,
      label: 'COGS < 70% of Cash In',
      passed: cashIn > 0 ? inputs.cogsPaid / cashIn < 0.7 : false,
      note: cashIn > 0 && inputs.cogsPaid / cashIn < 0.7 ? 'Healthy COGS ratio' : 'COGS ratio too high — review pricing',
    },
  ];

  return {
    computed: {
      cashIn,
      realCash,
      surplus,
      growthCash,
      layer1Total: cashIn,
      layer2Total: realCash,
      layer3Total: surplus,
      layer4Total: growthCash,
      diagnosis,
    },
    verdict,
  };
}
