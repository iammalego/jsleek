import type { CompactOptions, Transform } from '../types.js';
import { uniqueRatio } from '../utils/entropy.js';

function getMostFrequent(values: unknown[]): unknown {
  const freq = new Map<string, { count: number; value: unknown }>();
  for (const v of values) {
    const key = JSON.stringify(v);
    const existing = freq.get(key);
    if (existing) {
      existing.count++;
    } else {
      freq.set(key, { count: 1, value: v });
    }
  }
  let best: { count: number; value: unknown } = { count: 0, value: undefined };
  for (const entry of freq.values()) {
    if (entry.count > best.count) best = entry;
  }
  return best.value;
}

function processSchemaRows(
  schema: string[],
  rows: unknown[][],
  options: CompactOptions,
  original: Record<string, unknown>,
): Record<string, unknown> {
  const minItems = options.deduplicateMinItems ?? 5;
  const threshold = options.entropyThreshold ?? 0;

  if (rows.length < minItems) {
    // Not enough rows to extract constants
    return original;
  }

  // For each field in schema, compute uniqueRatio of that column
  const constants: Record<string, unknown> = {};
  const keepIndices: number[] = [];

  for (let i = 0; i < schema.length; i++) {
    const column = rows.map((row) => row[i]);
    const ratio = uniqueRatio(column);

    // With threshold=0 (lossless): extract if ratio <= 1/rows.length (all same)
    // With custom threshold: extract if ratio <= max(threshold, 1/rows.length) when threshold=0
    // General rule: extract if ratio <= threshold OR if all values are identical
    const allSame = ratio <= 1 / rows.length + Number.EPSILON;

    if (allSame || ratio <= threshold) {
      const key = schema[i];
      constants[key] = getMostFrequent(column);
    } else {
      keepIndices.push(i);
    }
  }

  if (Object.keys(constants).length === 0) {
    return original;
  }

  // Build new schema and rows without extracted columns
  const newSchema = keepIndices.map((i) => schema[i]);
  const newRows = rows.map((row) => keepIndices.map((i) => row[i]));

  const result: Record<string, unknown> = {};
  // Copy everything from original except _schema, _rows, _note
  for (const [k, v] of Object.entries(original)) {
    if (k !== '_schema' && k !== '_rows' && k !== '_note' && k !== '_const') {
      result[k] = v;
    }
  }

  result._const = constants;
  result._schema = newSchema;
  result._rows = newRows;

  if (!options.omitNotes && '_note' in original) {
    result._note = original['_note'];
  }

  return result;
}

function recurse(node: unknown, options: CompactOptions): unknown {
  if (node === null || typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    return node.map((item) => recurse(item, options));
  }

  const obj = node as Record<string, unknown>;

  // Check if this is a _schema/_rows node
  if (
    '_schema' in obj &&
    '_rows' in obj &&
    Array.isArray(obj['_schema']) &&
    Array.isArray(obj['_rows'])
  ) {
    const schema = obj['_schema'] as string[];
    const rows = obj['_rows'] as unknown[][];
    return processSchemaRows(schema, rows, options, obj);
  }

  // Otherwise recurse into children looking for _schema/_rows
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = recurse(value, options);
  }
  return result;
}

export const extractConstants: Transform = (node: unknown, options: CompactOptions): unknown => {
  return recurse(node, options);
};
