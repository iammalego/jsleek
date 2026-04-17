import type { CompactOptions, Transform } from '../types.js';
import { isUrl, isObjectOfOnlyUrls } from '../utils/url-detector.js';

const ALLOWLIST = new Set([
  'etag',
  'request_id',
  'correlation_id',
  'trace_id',
  'span_id',
  '__v',
  '__typename',
  'x-request-id',
  'x-correlation-id',
]);

function shouldStrip(
  key: string,
  value: unknown,
  keepFields: Set<string>,
  dropFields: Set<string>,
): boolean {
  // keepFields wins over everything
  if (keepFields.has(key)) return false;

  // dropFields always strips
  if (dropFields.has(key)) return true;

  // allowlist strips
  if (ALLOWLIST.has(key)) return true;

  // Compute heuristic weight
  let weight = 0;

  // H1: underscore prefix
  if (key.startsWith('_')) weight += 1;

  // H2: value is an object of only URLs
  if (isObjectOfOnlyUrls(value)) weight += 2;

  // H3: value is a URL string
  if (typeof value === 'string' && isUrl(value)) weight += 1;

  // H4: value is a long opaque string (> 40 chars)
  if (typeof value === 'string' && value.length > 40) weight += 1;

  return weight >= 2;
}

function stripObject(
  obj: Record<string, unknown>,
  keepFields: Set<string>,
  dropFields: Set<string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (shouldStrip(key, value, keepFields, dropFields)) {
      continue;
    }
    result[key] = recurse(value, keepFields, dropFields);
  }
  return result;
}

function recurse(value: unknown, keepFields: Set<string>, dropFields: Set<string>): unknown {
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => recurse(item, keepFields, dropFields));
  }

  return stripObject(value as Record<string, unknown>, keepFields, dropFields);
}

export const stripInfrastructure: Transform = (node: unknown, options: CompactOptions): unknown => {
  const keepFields = new Set(options.keepFields ?? []);
  const dropFields = new Set(options.dropFields ?? []);
  return recurse(node, keepFields, dropFields);
};
