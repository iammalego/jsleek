/**
 * Given an array, finds the most common (modal) key set among object items.
 * Returns sorted keys if coverage >= minRatio and item count >= minItems, else null.
 */
export function getSharedKeys(arr: unknown[], minItems: number, minRatio: number): string[] | null {
  if (arr.length < minItems) return null;

  // Filter to plain objects only (not null, not array)
  const objectItems = arr.filter(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === 'object' && !Array.isArray(item),
  );

  if (objectItems.length === 0) return null;

  // Build a frequency map: serialized key-set -> {count, keys}
  const keySetFreq = new Map<string, { count: number; keys: string[] }>();

  for (const item of objectItems) {
    const keys = Object.keys(item).sort();
    const serialized = JSON.stringify(keys);
    const existing = keySetFreq.get(serialized);
    if (existing) {
      existing.count++;
    } else {
      keySetFreq.set(serialized, { count: 1, keys });
    }
  }

  // Find the most frequent key set (modal)
  let bestCount = 0;
  let bestKeys: string[] = [];

  for (const { count, keys } of keySetFreq.values()) {
    if (count > bestCount) {
      bestCount = count;
      bestKeys = keys;
    }
  }

  // Check coverage against total array length (not just object items)
  const coverage = bestCount / arr.length;

  if (coverage < minRatio) return null;

  return bestKeys;
}
