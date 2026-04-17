export interface CompactOptions {
  minInputLength?: number; // default 100
  keepFields?: string[]; // default []
  dropFields?: string[]; // default []
  maxItems?: number; // default Infinity (lossless)
  sampleMethod?: 'first' | 'statistical'; // default 'statistical'
  entropyThreshold?: number; // default 0 (lossless — exact matches only)
  deduplicateMinItems?: number; // default 5
  deduplicateMinRatio?: number; // default 0.70
  omitNotes?: boolean; // default false
  maxUnwrapDepth?: number; // default 20
}

export type Transform = (node: unknown, options: CompactOptions) => unknown;
