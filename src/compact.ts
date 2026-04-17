import { applySafety } from './safety.js';
import {
  stripInfrastructure,
  unwrapNested,
  deduplicate,
  extractConstants,
  truncateArrays,
} from './transforms/index.js';
import type { CompactOptions } from './types.js';

export function compact(json: string, options?: CompactOptions): string {
  return applySafety(
    json,
    [stripInfrastructure, unwrapNested, deduplicate, extractConstants, truncateArrays],
    options ?? {},
  );
}
