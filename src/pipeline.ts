import { applySafety } from './safety.js';
import type { CompactOptions, Transform } from './types.js';

export function pipeline(json: string, transforms: Transform[], options?: CompactOptions): string {
  return applySafety(json, transforms, options ?? {});
}
