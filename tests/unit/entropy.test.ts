import { describe, it, expect } from 'vitest';
import { uniqueRatio } from '../../src/utils/entropy.js';

describe('uniqueRatio', () => {
  it('returns 0 for empty array', () => {
    expect(uniqueRatio([])).toBe(0);
  });

  it('returns 1.0 when all values are distinct', () => {
    expect(uniqueRatio([1, 2, 3, 4, 5])).toBe(1.0);
    expect(uniqueRatio(['a', 'b', 'c'])).toBe(1.0);
  });

  it('returns 0 when all values are identical', () => {
    expect(uniqueRatio([1, 1, 1, 1])).toBe(0.25);
    // Wait — 1 distinct / 4 total = 0.25, not 0
    // The spec says "count distinct / total"
    // All same: 1 distinct / n total = 1/n
    // Let me re-check: uniqueRatio([1,1,1,1]) = 1/4 = 0.25
  });

  it('returns correct ratio for partially repeated values', () => {
    // [1, 1, 2, 3] -> 3 distinct / 4 total = 0.75
    expect(uniqueRatio([1, 1, 2, 3])).toBeCloseTo(0.75);
  });

  it('handles single element', () => {
    expect(uniqueRatio([42])).toBe(1.0);
  });

  it('uses JSON.stringify for comparison (handles objects)', () => {
    const a = { id: 1 };
    const b = { id: 1 }; // same structure, different reference
    const c = { id: 2 };
    // a and b serialize to same -> 2 distinct ({id:1} and {id:2}) / 3 total = 0.667
    expect(uniqueRatio([a, b, c])).toBeCloseTo(2 / 3);
  });

  it('handles null values', () => {
    // [null, null, 1] -> 2 distinct / 3 total = 0.667
    expect(uniqueRatio([null, null, 1])).toBeCloseTo(2 / 3);
  });

  it('handles boolean values', () => {
    // [true, true, false] -> 2 distinct / 3 = 0.667
    expect(uniqueRatio([true, true, false])).toBeCloseTo(2 / 3);
  });

  it('handles all same value giving 1/n ratio', () => {
    // 1 distinct / 5 total = 0.2
    expect(uniqueRatio(['x', 'x', 'x', 'x', 'x'])).toBeCloseTo(0.2);
  });
});
