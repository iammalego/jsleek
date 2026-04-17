import { describe, it, expect } from 'vitest';
import { getSharedKeys } from '../../src/utils/schema-detector.js';

describe('getSharedKeys', () => {
  const minItems = 2;
  const minRatio = 0.7;

  it('returns sorted keys when all items have the same keys', () => {
    const arr = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
      { id: 3, name: 'Charlie', age: 35 },
    ];
    const result = getSharedKeys(arr, minItems, minRatio);
    expect(result).toEqual(['age', 'id', 'name']);
  });

  it('returns keys when coverage meets minRatio', () => {
    // 7 out of 10 items have {id, name} = 70% coverage; exactly meets minRatio
    const arr2 = [
      ...Array(7)
        .fill(null)
        .map((_, i) => ({ id: i, name: `user${i}` })),
      { different: true },
      { other: 'value' },
      { another: 'thing' },
    ];
    const result = getSharedKeys(arr2, minItems, minRatio);
    expect(result).toEqual(['id', 'name']);
  });

  it('returns null when coverage is below minRatio', () => {
    // Only 5 out of 10 items share keys
    const arr = [
      ...Array(5)
        .fill(null)
        .map((_, i) => ({ id: i })),
      ...Array(5)
        .fill(null)
        .map((_, i) => ({ name: `user${i}` })),
    ];
    const result = getSharedKeys(arr, minItems, minRatio);
    expect(result).toBeNull();
  });

  it('returns null when array has fewer items than minItems', () => {
    const arr = [{ id: 1, name: 'Alice' }];
    const result = getSharedKeys(arr, 2, minRatio);
    expect(result).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(getSharedKeys([], minItems, minRatio)).toBeNull();
  });

  it('returns null if items are not objects', () => {
    const arr = [1, 2, 3, 4];
    expect(getSharedKeys(arr, minItems, minRatio)).toBeNull();
  });

  it('returns null if most items are primitives mixed with objects', () => {
    const arr = ['string', 42, { id: 1 }, null];
    expect(getSharedKeys(arr, minItems, minRatio)).toBeNull();
  });

  it('returns keys sorted alphabetically', () => {
    const arr = [
      { z: 1, a: 2, m: 3 },
      { z: 4, a: 5, m: 6 },
      { z: 7, a: 8, m: 9 },
    ];
    const result = getSharedKeys(arr, minItems, minRatio);
    expect(result).toEqual(['a', 'm', 'z']);
  });

  it('handles array items with null values correctly', () => {
    const arr = [
      { id: 1, name: null },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];
    const result = getSharedKeys(arr, minItems, minRatio);
    expect(result).toEqual(['id', 'name']);
  });
});
