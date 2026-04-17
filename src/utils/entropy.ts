/**
 * Computes the ratio of distinct values to total values.
 * Uses JSON.stringify for value comparison.
 * Returns 0 for empty arrays.
 */
export function uniqueRatio(values: unknown[]): number {
  if (values.length === 0) return 0;

  const seen = new Set<string>();
  for (const v of values) {
    seen.add(JSON.stringify(v));
  }

  return seen.size / values.length;
}
