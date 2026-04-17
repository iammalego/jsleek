import type { CompactOptions, Transform } from '../types.js';
import { getSharedKeys } from '../utils/schema-detector.js';

function deduplicateArray(arr: unknown[], options: CompactOptions): unknown {
  const minItems = options.deduplicateMinItems ?? 5;
  const minRatio = options.deduplicateMinRatio ?? 0.7;

  const sharedKeys = getSharedKeys(arr, minItems, minRatio);

  if (sharedKeys === null) {
    // Can't deduplicate — recurse into children
    return arr.map((item) => recurse(item, options));
  }

  // Build rows, mapping each item's values positionally to sharedKeys
  const rows = arr.map((item) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      // Shouldn't happen if getSharedKeys passed, but be safe
      return sharedKeys.map(() => null);
    }
    const obj = item as Record<string, unknown>;
    return sharedKeys.map((key) => (key in obj ? recurse(obj[key], options) : null));
  });

  const result: Record<string, unknown> = {
    _schema: sharedKeys,
    _rows: rows,
  };

  if (!options.omitNotes) {
    result._note = 'Each _rows entry maps positionally to _schema';
  }

  return result;
}

function recurse(node: unknown, options: CompactOptions): unknown {
  if (node === null || typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    return deduplicateArray(node, options);
  }

  // Plain object — recurse into values
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    result[key] = recurse(value, options);
  }
  return result;
}

export const deduplicate: Transform = (node: unknown, options: CompactOptions): unknown => {
  return recurse(node, options);
};
