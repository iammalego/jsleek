import { describe, it, expect } from 'vitest';
import { truncateArrays } from '../../src/transforms/truncate-arrays.js';

describe('truncateArrays', () => {
  const opts = {};

  it('does NOT truncate when maxItems is Infinity (default)', () => {
    const input = Array.from({ length: 100 }, (_, i) => i);
    const result = truncateArrays(input, opts);
    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown[]).length).toBe(100);
  });

  it('does NOT truncate when array.length <= maxItems', () => {
    const input = [1, 2, 3];
    const result = truncateArrays(input, { maxItems: 5 });
    expect(result).toEqual([1, 2, 3]);
  });

  it('truncates using first-N when array.length <= 20 (top-level wrapped)', () => {
    const input = Array.from({ length: 15 }, (_, i) => i);
    const result = truncateArrays(input, { maxItems: 5 }) as Record<string, unknown>;
    // Array of 15 items <= 20, sampleMethod defaults to 'statistical' but length <= 20 -> first-N
    // Top-level array is wrapped in {items, _total, _kept, _truncated}
    expect((result.items as unknown[]).length).toBe(5);
    expect(result.items).toEqual([0, 1, 2, 3, 4]);
  });

  it('truncates using first-N when sampleMethod is "first" (top-level wrapped)', () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const result = truncateArrays(input, { maxItems: 5, sampleMethod: 'first' }) as Record<
      string,
      unknown
    >;
    expect((result.items as unknown[]).length).toBe(5);
    expect(result.items).toEqual([0, 1, 2, 3, 4]);
  });

  it('uses statistical sampling for array.length > 20 (top-level wrapped)', () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const result = truncateArrays(input, { maxItems: 5 }) as Record<string, unknown>;
    // Statistical: always includes first (0) and last (49)
    // Top-level array is wrapped in {items, _total, _kept, _truncated}
    const items = result.items as unknown[];
    expect(items.length).toBe(5);
    expect(items[0]).toBe(0);
    expect(items[items.length - 1]).toBe(49);
  });

  it('always includes first and last in statistical sampling (top-level wrapped)', () => {
    const input = Array.from({ length: 100 }, (_, i) => i);
    const result = truncateArrays(input, { maxItems: 10 }) as Record<string, unknown>;
    const items = result.items as unknown[];
    expect(items[0]).toBe(0);
    expect(items[items.length - 1]).toBe(99);
  });

  it('adds _total, _kept, _truncated to parent object when field is truncated', () => {
    const input = {
      items: Array.from({ length: 10 }, (_, i) => ({ id: i })),
      name: 'test',
    };
    const result = truncateArrays(input, { maxItems: 3 }) as Record<string, unknown>;
    const items = result.items as unknown[];
    expect(items.length).toBe(3);
    expect(result._total).toBe(10);
    expect(result._kept).toBe(3);
    expect(result._truncated).toBe(7);
  });

  it('wraps top-level truncated array in {items, _total, _kept, _truncated}', () => {
    const input = Array.from({ length: 10 }, (_, i) => i);
    const result = truncateArrays(input, { maxItems: 3 }) as Record<string, unknown>;
    expect(result.items).toBeDefined();
    expect((result.items as unknown[]).length).toBe(3);
    expect(result._total).toBe(10);
    expect(result._kept).toBe(3);
    expect(result._truncated).toBe(7);
  });

  it('also truncates _rows in deduplicated structures', () => {
    const input = {
      _schema: ['id', 'name'],
      _rows: Array.from({ length: 10 }, (_, i) => [i, `user${i}`]),
      _note: 'test',
    };
    const result = truncateArrays(input, { maxItems: 3 }) as Record<string, unknown>;
    expect((result._rows as unknown[]).length).toBe(3);
    expect(result._total).toBe(10);
    expect(result._kept).toBe(3);
    expect(result._truncated).toBe(7);
  });

  it('recurses into nested objects', () => {
    const input = {
      users: {
        items: Array.from({ length: 10 }, (_, i) => ({ id: i })),
      },
    };
    const result = truncateArrays(input, { maxItems: 3 }) as Record<string, unknown>;
    const users = result.users as Record<string, unknown>;
    const items = users.items as unknown[];
    expect(items.length).toBe(3);
  });

  it('recurses into array items', () => {
    const input = [{ items: Array.from({ length: 10 }, (_, i) => i) }];
    const result = truncateArrays(input, { maxItems: 3 }) as Array<Record<string, unknown>>;
    expect((result[0].items as unknown[]).length).toBe(3);
  });

  it('passes through primitives unchanged', () => {
    expect(truncateArrays(42, opts)).toBe(42);
    expect(truncateArrays('hello', opts)).toBe('hello');
    expect(truncateArrays(null, opts)).toBe(null);
  });

  it('does not add metadata when no truncation occurs', () => {
    const input = {
      items: [1, 2, 3],
    };
    const result = truncateArrays(input, { maxItems: 10 }) as Record<string, unknown>;
    expect(result._total).toBeUndefined();
    expect(result._kept).toBeUndefined();
    expect(result._truncated).toBeUndefined();
  });
});
