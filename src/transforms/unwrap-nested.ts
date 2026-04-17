import type { CompactOptions, Transform } from '../types.js';

function unwrap(node: unknown, maxDepth: number, depth: number): unknown {
  if (depth >= maxDepth) return node;
  if (node === null || typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    if (node.length === 1) {
      // Unwrap the single element, then recurse
      return unwrap(node[0], maxDepth, depth + 1);
    }
    // 2+ items: recurse into each item but don't unwrap the container
    return node.map((item) => unwrap(item, maxDepth, depth + 1));
  }

  // Plain object
  const keys = Object.keys(node as Record<string, unknown>);
  if (keys.length === 1) {
    const value = (node as Record<string, unknown>)[keys[0]];
    // Unwrap this single-key object
    return unwrap(value, maxDepth, depth + 1);
  }

  // 2+ keys: recurse into values but don't unwrap the container
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    result[k] = unwrap(v, maxDepth, depth + 1);
  }
  return result;
}

export const unwrapNested: Transform = (node: unknown, options: CompactOptions): unknown => {
  const maxDepth = options.maxUnwrapDepth ?? 20;
  return unwrap(node, maxDepth, 0);
};
