export function calcBusinessScore(stepData: Record<string, any>): { score: number; completed: number } {
  const fin = stepData['ib-financial']?.computed;
  const cash = stepData['ib-cash-dna']?.computed;
  const capital = stepData['ib-capital']?.computed;
  const loan = stepData['ib-loan-action']?.computed;

  const finScore = fin?.score || 0;
  const cashScore = cash?.score || 0;
  const capitalScore = capital?.score || 0;
  const loanScore = loan?.score || 0;

  const completed = Object.keys(stepData).filter(k => stepData[k]?.data).length;
  const readiness = completed / 7;
  const raw = 0.40 * finScore + 0.30 * cashScore + 0.15 * capitalScore + 0.15 * loanScore;
  const score = Math.round(raw * readiness);

  return { score, completed };
}
