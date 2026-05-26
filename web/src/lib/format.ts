/** Format number as Thai baht (no decimals) */
export function money(n: number | null | undefined): string {
  if (n == null) return '—';
  return Math.round(n).toLocaleString('en-US');
}

/** Format as percent with 1 decimal */
export function pct(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '—';
  return (n * 100).toFixed(decimals) + '%';
}

/** Format number with fixed decimals */
export function num(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—';
  return n.toFixed(decimals);
}

/** Apply currency mask to input string: 1234567 → 1,234,567 */
export function maskCurrency(value: string): string {
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) return '';
  return Number(cleaned).toLocaleString('en-US');
}

/** Parse masked currency back to number */
export function unmaskCurrency(value: string): number {
  return Number(value.replace(/[,\s]/g, '')) || 0;
}
