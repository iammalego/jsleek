export { compact } from './compact.js';
export { pipeline } from './pipeline.js';
export {
  stripInfrastructure,
  unwrapNested,
  deduplicate,
  extractConstants,
  truncateArrays,
} from './transforms/index.js';
export type { CompactOptions, Transform } from './types.js';
