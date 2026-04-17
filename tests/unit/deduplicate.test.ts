import { describe, it, expect } from 'vitest';
import { deduplicate } from '../../src/transforms/deduplicate.js';

describe('deduplicate', () => {
  const opts = {};

  function makeItems(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `user${i + 1}`,
      active: true,
    }));
  }

  it('converts uniform arrays to _schema/_rows format', () => {
    const items = makeItems(5);
    const result = deduplicate(items, opts) as {
      _schema: string[];
      _rows: unknown[][];
      _note: string;
    };
    expect(result._schema).toEqual(['active', 'id', 'name']);
    expect(result._rows).toHaveLength(5);
    expect(result._rows[0]).toEqual([true, 1, 'user1']);
    expect(result._rows[4]).toEqual([true, 5, 'user5']);
    expect(result._note).toContain('_schema');
  });

  it('omits _note when omitNotes is true', () => {
    const items = makeItems(5);
    const result = deduplicate(items, { omitNotes: true }) as {
      _schema: string[];
      _rows: unknown[][];
      _note?: string;
    };
    expect(result._schema).toBeDefined();
    expect(result._note).toBeUndefined();
  });

  it('fills missing keys with null in rows', () => {
    const items = [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob' }, // missing role
      { id: 3, name: 'Charlie', role: 'user' },
      { id: 4, name: 'Dave', role: 'user' },
      { id: 5, name: 'Eve', role: 'user' },
    ];
    // 4/5 have 'role' (80%) -> modal is {id,name,role}? No, {id,name} has 5/5=100%
    // Actually {id,name,role} has 4/5=80% coverage > 70%, but {id,name} has 5/5=100%
    // The modal key set is the most FREQUENT exact key set
    // Items 1,3,4,5: {id,name,role} = 4 occurrences
    // Item 2: {id,name} = 1 occurrence
    // Modal is {id,name,role} with 4/5=80% coverage
    const result = deduplicate(items, opts) as {
      _schema: string[];
      _rows: unknown[][];
    };
    expect(result._schema).toEqual(['id', 'name', 'role']);
    // item 2 missing role -> null
    expect(result._rows[1]).toEqual([2, 'Bob', null]);
  });

  it('does not deduplicate arrays below deduplicateMinItems', () => {
    const items = makeItems(4);
    const result = deduplicate(items, { deduplicateMinItems: 5 }) as unknown[];
    // Should return as-is (array, not _schema/_rows)
    expect(Array.isArray(result)).toBe(true);
  });

  it('does not deduplicate when coverage below deduplicateMinRatio', () => {
    // Half have {id}, half have {name} -> no shared modal
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { name: 'a' }, { name: 'b' }, { name: 'c' }];
    const result = deduplicate(items, opts);
    expect(Array.isArray(result)).toBe(true);
  });

  it('recurses into nested objects', () => {
    const container = {
      users: makeItems(5),
      meta: { total: 5 },
    };
    const result = deduplicate(container, opts) as Record<string, unknown>;
    const users = result.users as { _schema: string[]; _rows: unknown[][] };
    expect(users._schema).toBeDefined();
    expect(result.meta).toEqual({ total: 5 });
  });

  it('recurses into nested arrays', () => {
    const nested = {
      groups: [
        { id: 1, members: makeItems(5) },
        { id: 2, members: makeItems(5) },
      ],
    };
    const result = deduplicate(nested, opts) as {
      groups: Array<{ id: number; members: { _schema: string[] } }>;
    };
    expect(result.groups[0].members._schema).toBeDefined();
    expect(result.groups[1].members._schema).toBeDefined();
  });

  it('passes through primitives unchanged', () => {
    expect(deduplicate(42, opts)).toBe(42);
    expect(deduplicate('hello', opts)).toBe('hello');
    expect(deduplicate(null, opts)).toBe(null);
  });

  it('uses default deduplicateMinItems of 5', () => {
    // 4 items shouldn't deduplicate with default
    const items = makeItems(4);
    const result = deduplicate(items, {});
    expect(Array.isArray(result)).toBe(true);
    // 5 items should
    const items5 = makeItems(5);
    const result5 = deduplicate(items5, {}) as { _schema: string[] };
    expect(result5._schema).toBeDefined();
  });
});
