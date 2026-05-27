// S1 Check Cash formula engine
// Inputs: grossSales, cashStart, cashEnd, arBalance (optional)
// Computed: cashChange, gap
// Verdict: gap/grossSales ratio

export interface S1Inputs {
  grossSales: number;
  cashStart: number;
  cashEnd: number;
  arBalance?: number | null;
}

export interface S1Computed {
  cashChange: number;
  gap: number;
  gapRatio: number | null;
}

export type Verdict = 'green' | 'yellow' | 'red';

export interface S1Result {
  computed: S1Computed;
  verdict: Verdict;
}

export function computeS1(inputs: S1Inputs): S1Result {
  const cashChange = inputs.cashEnd - inputs.cashStart;
  const gap = inputs.grossSales - cashChange;

  let gapRatio: number | null = null;
  let verdict: Verdict = 'green';

  if (inputs.grossSales > 0) {
    gapRatio = gap / inputs.grossSales;
    if (gapRatio > 0.5) {
      verdict = 'red';
    } else if (gapRatio > 0.2) {
      verdict = 'yellow';
    } else {
      verdict = 'green';
    }
  }

  return {
    computed: { cashChange, gap, gapRatio },
    verdict,
  };
}
