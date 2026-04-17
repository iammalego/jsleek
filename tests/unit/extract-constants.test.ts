import { describe, it, expect } from 'vitest';
import { extractConstants } from '../../src/transforms/extract-constants.js';

describe('extractConstants', () => {
  const opts = {};

  function makeDeduplicated(fields: Record<string, unknown[]>, withNote = true) {
    const schema = Object.keys(fields).sort();
    const rowCount = Math.max(...Object.values(fields).map((v) => v.length));
    const rows = Array.from({ length: rowCount }, (_, i) =>
      schema.map((k) => fields[k][i] ?? null),
    );
    const result: Record<string, unknown> = { _schema: schema, _rows: rows };
    if (withNote) result._note = 'Each _rows entry maps positionally to _schema';
    return result;
  }

  it('extracts constant fields (uniqueRatio=0 with threshold=0) to _const', () => {
    // status is always 'active' -> ratio = 1/5 = 0.2 -> NOT constant with threshold=0
    // Wait: uniqueRatio = distinct/total. If all same: 1 distinct / 5 = 0.2
    // threshold=0 means extract if ratio <= 0, but 0.2 > 0
    // Actually the spec says entropyThreshold=0 means extract 100%-identical fields
    // So ratio must be <= 0... but 1 distinct / n gives 1/n, never 0 unless array is empty
    // Let me re-read: "If ratio <= entropyThreshold (default 0): extract to _const"
    // This means with default 0: only when uniqueRatio <= 0 -> impossible for non-empty
    // Wait: with entropyThreshold=0, it's lossless (doesn't extract anything)
    // But with entropyThreshold slightly above 0, it extracts constants
    // Hmm, let me reconsider: uniqueRatio([true,true,true,true,true]) = 1/5 = 0.2
    // With threshold=0: 0.2 > 0 -> NOT extracted
    // With threshold=0.2: 0.2 <= 0.2 -> extracted
    // But the spec says "extracts 100%-identical fields (lossless)"
    // This means: when ALL values in a column are the same, extract it
    // uniqueRatio of all-same = 1/n (for n items). With threshold=0, 1/n > 0 -> not extracted
    //
    // Wait... maybe "lossless" here means: we use threshold=0 to mean
    // "only extract when uniqueRatio = 0" but that's impossible...
    // OR: the uniqueRatio formula for "all same" returns 0?
    // Let me re-read entropy spec: "count distinct / total. Empty -> 0."
    // No, it clearly returns distinct/total.
    //
    // I think the spec's "entropyThreshold=0 means lossless (exact matches only)"
    // means: use a threshold slightly above 0 (like 1/n) to detect "all same".
    // OR: the implementation checks uniqueRatio in a way that "all same" = 0.
    //
    // Actually looking again: "If ratio <= entropyThreshold (default 0)"
    // If all values are same: uniqueRatio = 1/n = 0.2 for n=5
    // That's > 0, so nothing gets extracted at default.
    // The spec says this is "lossless" because you'd need threshold >= 0.2 to extract.
    //
    // BUT the spec also says "extractConstants only extracts 100%-identical fields (lossless)"
    // That's contradictory... UNLESS uniqueRatio for "all same" returns 0.
    // Let me check: distinct=1, total=5 -> 1/5=0.2 -> NOT 0
    //
    // Resolution: I think there's an off-by-one in the spec. The "lossless" means
    // that with threshold=0, the function checks if a column has exactly 1 unique value.
    // Implementation: use threshold in a special way: if uniqueRatio == 1/n then extract?
    // No, that's lossy for all-same columns.
    //
    // Most logical interpretation: threshold=0 -> extract if all values identical (ratio == 1/nRows)
    // OR: threshold=1.0/rows.length as the detection condition for "all same"
    //
    // I'll implement it as: extract if uniqueRatio <= max(entropyThreshold, 1/rows.length)
    // when entropyThreshold=0, that means: extract when ratio <= 1/rows.length = "all same"
    // This matches "lossless" because extracting all-same columns preserves all info.

    const dedup = makeDeduplicated({
      id: [1, 2, 3, 4, 5],
      status: ['active', 'active', 'active', 'active', 'active'], // all same
      name: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'],
    });

    const result = extractConstants(dedup, opts) as Record<string, unknown>;
    expect(result._const).toEqual({ status: 'active' });
    expect(result._schema as string[]).not.toContain('status');
    // id and name should remain in _schema (different values)
    expect(result._schema as string[]).toContain('id');
    expect(result._schema as string[]).toContain('name');
  });

  it('does not extract when _rows < deduplicateMinItems (default 5)', () => {
    const dedup = makeDeduplicated({
      id: [1, 2, 3, 4],
      status: ['active', 'active', 'active', 'active'],
    });

    const result = extractConstants(dedup, opts) as Record<string, unknown>;
    // 4 rows < 5 minItems -> no extraction
    expect(result._const).toBeUndefined();
    expect(result._schema).toEqual(['id', 'status']);
  });

  it('extracts multiple constant fields', () => {
    const dedup = makeDeduplicated({
      id: [1, 2, 3, 4, 5],
      type: ['user', 'user', 'user', 'user', 'user'],
      status: ['active', 'active', 'active', 'active', 'active'],
      name: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'],
    });

    const result = extractConstants(dedup, opts) as Record<string, unknown>;
    expect(result._const).toEqual({ status: 'active', type: 'user' });
    expect(result._schema as string[]).not.toContain('type');
    expect(result._schema as string[]).not.toContain('status');
  });

  it('does not extract non-constant fields with threshold=0', () => {
    const dedup = makeDeduplicated({
      id: [1, 2, 3, 4, 5],
      status: ['active', 'active', 'inactive', 'active', 'active'], // not all same
    });

    const result = extractConstants(dedup, opts) as Record<string, unknown>;
    expect(result._const).toBeUndefined();
    expect(result._schema as string[]).toContain('status');
  });

  it('respects custom entropyThreshold', () => {
    // With threshold=0.4: extract if uniqueRatio <= 0.4
    // status has 2 distinct out of 5 = 0.4 -> 0.4 <= 0.4 -> extract
    const dedup = makeDeduplicated({
      id: [1, 2, 3, 4, 5],
      status: ['active', 'active', 'active', 'inactive', 'active'], // 2 distinct / 5 = 0.4
    });

    const result = extractConstants(dedup, { entropyThreshold: 0.4 }) as Record<string, unknown>;
    expect(result._const).toBeDefined();
    expect(result._const).toHaveProperty('status');
  });

  it('recurses into nested structures to find _schema/_rows', () => {
    const container = {
      users: makeDeduplicated({
        id: [1, 2, 3, 4, 5],
        type: ['user', 'user', 'user', 'user', 'user'],
        name: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'],
      }),
      meta: { total: 5 },
    };

    const result = extractConstants(container, opts) as Record<string, unknown>;
    const users = result.users as Record<string, unknown>;
    expect(users._const).toEqual({ type: 'user' });
  });

  it('uses most frequent value as constant value', () => {
    // With threshold=0.4, status has 4 'active' and 1 'inactive' -> most frequent is 'active'
    const dedup = makeDeduplicated({
      id: [1, 2, 3, 4, 5],
      status: ['active', 'inactive', 'active', 'active', 'active'],
    });

    const result = extractConstants(dedup, { entropyThreshold: 0.4 }) as Record<string, unknown>;
    const constVal = (result._const as Record<string, unknown>)?.status;
    expect(constVal).toBe('active');
  });

  it('passes through non-schema nodes unchanged', () => {
    const input = { name: 'Alice', age: 30 };
    const result = extractConstants(input, opts);
    expect(result).toEqual(input);
  });

  it('passes through primitives unchanged', () => {
    expect(extractConstants(42, opts)).toBe(42);
    expect(extractConstants('hello', opts)).toBe('hello');
    expect(extractConstants(null, opts)).toBe(null);
  });
});
