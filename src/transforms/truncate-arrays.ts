import type { CompactOptions, Transform } from '../types.js';

function sampleArray(
  arr: unknown[],
  maxItems: number,
  sampleMethod: 'first' | 'statistical',
): unknown[] {
  if (arr.length <= maxItems) return arr;

  // Small arrays or 'first' method: take first N
  if (arr.length <= 20 || sampleMethod === 'first') {
    return arr.slice(0, maxItems);
  }

  // Statistical: equidistant sampling, always include first and last
  if (maxItems === 1) return [arr[0]];
  if (maxItems === 2) return [arr[0], arr[arr.length - 1]];

  const result: unknown[] = [];
  // Include first
  result.push(arr[0]);
  // Fill middle slots equidistantly
  const middleCount = maxItems - 2;
  const step = (arr.length - 1) / (middleCount + 1);
  for (let i = 1; i <= middleCount; i++) {
    const idx = Math.round(step * i);
    result.push(arr[idx]);
  }
  // Include last
  result.push(arr[arr.length - 1]);

  return result;
}

function truncateInObject(
  obj: Record<string, unknown>,
  options: CompactOptions,
  maxItems: number,
  sampleMethod: 'first' | 'statistical',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let didTruncate = false;
  let total = 0;
  let kept = 0;

  // Special handling: if this is a _schema/_rows node, truncate _rows
  const hasSchema = '_schema' in obj && '_rows' in obj && Array.isArray(obj['_rows']);

  for (const [key, value] of Object.entries(obj)) {
    if (key === '_rows' && hasSchema) {
      const rows = value as unknown[];
      if (rows.length > maxItems) {
        total = rows.length;
        const sampled = sampleArray(rows, maxItems, sampleMethod);
        kept = sampled.length;
        result[key] = sampled;
        didTruncate = true;
      } else {
        result[key] = recurse(value, options, maxItems, sampleMethod);
      }
    } else if (Array.isArray(value) && key !== '_schema') {
      const arr = value as unknown[];
      if (arr.length > maxItems) {
        total = arr.length;
        const sampled = sampleArray(arr, maxItems, sampleMethod);
        kept = sampled.length;
        // Recurse into sampled items
        result[key] = sampled.map((item) => recurse(item, options, maxItems, sampleMethod));
        didTruncate = true;
      } else {
        result[key] = arr.map((item) => recurse(item, options, maxItems, sampleMethod));
      }
    } else {
      result[key] = recurse(value, options, maxItems, sampleMethod);
    }
  }

  if (didTruncate) {
    result._total = total;
    result._kept = kept;
    result._truncated = total - kept;
  }

  return result;
}

function recurse(
  node: unknown,
  options: CompactOptions,
  maxItems: number,
  sampleMethod: 'first' | 'statistical',
): unknown {
  if (node === null || typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    // Array at non-top-level: recurse into items
    return node.map((item) => recurse(item, options, maxItems, sampleMethod));
  }

  return truncateInObject(node as Record<string, unknown>, options, maxItems, sampleMethod);
}

export const truncateArrays: Transform = (node: unknown, options: CompactOptions): unknown => {
  const maxItems = options.maxItems ?? Infinity;
  const sampleMethod = options.sampleMethod ?? 'statistical';

  // If no truncation configured, just recurse without truncating
  if (!isFinite(maxItems)) {
    return node;
  }

  // Top-level array: wrap in container with metadata if truncated
  if (Array.isArray(node)) {
    const arr = node as unknown[];
    if (arr.length > maxItems) {
      const sampled = sampleArray(arr, maxItems, sampleMethod);
      const items = sampled.map((item) => recurse(item, options, maxItems, sampleMethod));
      return {
        items,
        _total: arr.length,
        _kept: items.length,
        _truncated: arr.length - items.length,
      };
    }
    // No truncation needed at top level, but recurse into items
    return arr.map((item) => recurse(item, options, maxItems, sampleMethod));
  }

  if (node === null || typeof node !== 'object') return node;

  return truncateInObject(node as Record<string, unknown>, options, maxItems, sampleMethod);
};
