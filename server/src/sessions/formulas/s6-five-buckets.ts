// S6 Five Bucket System formula engine

export interface S6Inputs {
  monthlyRevenue: number;
  bucket1Pct: number; // as decimal, e.g. 0.40
  bucket2Pct: number;
  bucket3Pct: number;
  bucket4Pct: number;
  bucket5Pct: number;
}

export interface S6Computed {
  bucket1Amount: number;
  bucket2Amount: number;
  bucket3Amount: number;
  bucket4Amount: number;
  bucket5Amount: number;
  totalPct: number;
  isBalanced: boolean;
}

export interface S6Result {
  computed: S6Computed;
  verdict: 'green' | 'yellow' | 'red';
}

export function computeS6(raw: any): S6Result {
  const inputs = raw as S6Inputs;
  const monthlyRevenue = inputs.monthlyRevenue || 0;

  // Support both { bucket1Pct, bucket2Pct, ... } and { buckets: [{ pct }, ...] }
  let bucket1Pct: number, bucket2Pct: number, bucket3Pct: number, bucket4Pct: number, bucket5Pct: number;
  if (Array.isArray(raw.buckets)) {
    const b = raw.buckets;
    bucket1Pct = b[0]?.pct ?? 0;
    bucket2Pct = b[1]?.pct ?? 0;
    bucket3Pct = b[2]?.pct ?? 0;
    bucket4Pct = b[3]?.pct ?? 0;
    bucket5Pct = b[4]?.pct ?? 0;
  } else {
    ({ bucket1Pct = 0, bucket2Pct = 0, bucket3Pct = 0, bucket4Pct = 0, bucket5Pct = 0 } = inputs);
  }

  const totalPct = bucket1Pct + bucket2Pct + bucket3Pct + bucket4Pct + bucket5Pct;
  // Allow tiny floating-point tolerance
  const isBalanced = Math.abs(totalPct - 1) < 0.001;

  const computed: S6Computed = {
    bucket1Amount: monthlyRevenue * bucket1Pct,
    bucket2Amount: monthlyRevenue * bucket2Pct,
    bucket3Amount: monthlyRevenue * bucket3Pct,
    bucket4Amount: monthlyRevenue * bucket4Pct,
    bucket5Amount: monthlyRevenue * bucket5Pct,
    totalPct,
    isBalanced,
  };

  const verdict: 'green' | 'yellow' | 'red' = isBalanced ? 'green' : 'red';

  return { computed, verdict };
}
