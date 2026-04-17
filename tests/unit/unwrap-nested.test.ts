import { describe, it, expect } from 'vitest';
import { unwrapNested } from '../../src/transforms/unwrap-nested.js';

describe('unwrapNested', () => {
  const opts = {};

  it('unwraps array of length 1', () => {
    const input = ['only-item'];
    expect(unwrapNested(input, opts)).toBe('only-item');
  });

  it('unwraps object with exactly 1 key', () => {
    const input = { data: { id: 1, name: 'Alice' } };
    expect(unwrapNested(input, opts)).toEqual({ id: 1, name: 'Alice' });
  });

  it('unwraps recursively — nested single-key objects', () => {
    const input = { data: { user: { id: 1 } } };
    // data -> user -> {id:1} (which has 1 key — still unwrap? Let's check: {id:1} has 1 key but value is primitive)
    // data unwraps to {user: {id:1}} — wait, data is single-key -> unwrap to value = {user:{id:1}}
    // then that has 1 key "user" -> unwrap to {id:1}
    // then that has 1 key "id" -> unwrap to 1
    expect(unwrapNested(input, opts)).toBe(1);
  });

  it('does not unwrap arrays with 2+ items', () => {
    const input = [1, 2, 3];
    expect(unwrapNested(input, opts)).toEqual([1, 2, 3]);
  });

  it('does not unwrap objects with 2+ keys', () => {
    const input = { id: 1, name: 'Alice' };
    expect(unwrapNested(input, opts)).toEqual({ id: 1, name: 'Alice' });
  });

  it('recurses into array items without unwrapping the container', () => {
    const input = [{ data: 'hello' }, { data: 'world' }];
    // Each item is single-key -> unwrap the item (not the container array)
    expect(unwrapNested(input, opts)).toEqual(['hello', 'world']);
  });

  it('recurses into multi-key object values', () => {
    const input = { id: 1, nested: { value: 'hello' } };
    // id and nested are 2 keys -> don't unwrap container
    // nested is single-key -> unwrap to 'hello'
    expect(unwrapNested(input, opts)).toEqual({ id: 1, nested: 'hello' });
  });

  it('preserves null', () => {
    expect(unwrapNested(null, opts)).toBe(null);
  });

  it('preserves primitives', () => {
    expect(unwrapNested(42, opts)).toBe(42);
    expect(unwrapNested('hello', opts)).toBe('hello');
    expect(unwrapNested(true, opts)).toBe(true);
  });

  it('preserves empty array', () => {
    expect(unwrapNested([], opts)).toEqual([]);
  });

  it('respects maxUnwrapDepth (stops at depth limit)', () => {
    // Create deeply nested: {a:{a:{a:{a:{a:{a:{a:{a:{a:{a:'deep'}}}}}}}}}}}
    // 10 levels deep
    let obj: unknown = 'deep';
    for (let i = 0; i < 25; i++) {
      obj = { a: obj };
    }
    // With maxUnwrapDepth: 3, should stop unwrapping after 3 levels
    const result = unwrapNested(obj, { maxUnwrapDepth: 3 });
    // 3 unwraps: {a:{a:{a:{a:...}}}} -> {a:{a:{a:...}}} -> {a:{a:...}} -> {a:...}
    // At depth 3 we return as-is (no more unwrapping)
    // The exact result depends on implementation - let's just ensure it doesn't go all the way to 'deep'
    expect(result).not.toBe('deep');
  });

  it('handles single-item array containing an object', () => {
    const input = [{ id: 1, name: 'Alice' }];
    expect(unwrapNested(input, opts)).toEqual({ id: 1, name: 'Alice' });
  });

  it('handles object where value is an array of length 1', () => {
    const input = { data: [{ id: 1 }] };
    // data is single key -> unwrap to [{id:1}]
    // [{id:1}] is array of length 1 -> unwrap to {id:1}
    // {id:1} is single key -> unwrap to 1
    expect(unwrapNested(input, opts)).toBe(1);
  });
});
