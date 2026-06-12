export function calcBusinessScore(stepData: Record<string, any>): { score: number; completed: number } {
  const fin = stepData['ib-financial']?.computed;
  const cash = stepData['ib-cash-dna']?.computed;
  const capital = stepData['ib-capital']?.computed;

  // Only score from financial data — Step 7 (checklist) doesn't affect business health score
  const finScore = fin?.score || 0;
  const cashScore = cash?.score || 0;
  const capitalScore = capital?.score || 0;

  const completed = Object.keys(stepData).filter(k => stepData[k]?.data).length;

  // Weighted average of steps that measure business health (no readiness penalty)
  const weights = [
    { score: finScore, weight: 0.45, hasData: !!fin },
    { score: cashScore, weight: 0.35, hasData: !!cash },
    { score: capitalScore, weight: 0.20, hasData: !!capital },
  ];

  const active = weights.filter(w => w.hasData);
  if (active.length === 0) return { score: 0, completed };

  // Redistribute weights proportionally among completed steps
  const totalWeight = active.reduce((s, w) => s + w.weight, 0);
  const raw = active.reduce((s, w) => s + w.score * (w.weight / totalWeight), 0);

  return { score: Math.round(raw), completed };
}
