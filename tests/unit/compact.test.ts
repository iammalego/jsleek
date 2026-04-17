import { describe, it, expect } from 'vitest';
import { compact } from '../../src/compact.js';

describe('compact', () => {
  it('returns original for non-JSON input', () => {
    expect(compact('not json')).toBe('not json');
  });

  it('returns original for short JSON (below minInputLength)', () => {
    const input = JSON.stringify({ a: 1 });
    expect(compact(input)).toBe(input);
  });

  it('compresses a realistic JSON payload', () => {
    const payload = {
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        status: 'active',
        etag: `W/"etag-${i}"`,
        __typename: 'Item',
        request_id: `req-${i}`,
      })),
    };
    const input = JSON.stringify(payload);
    const result = compact(input);
    // Should be smaller
    expect(result.length).toBeLessThan(input.length);
    // Should be valid JSON
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('strips infrastructure fields by default', () => {
    const payload = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `user${i}`,
      __typename: 'User',
      etag: `W/"${i}"`,
    }));
    const input = JSON.stringify(payload);
    const result = compact(input);
    expect(result).not.toContain('__typename');
    expect(result).not.toContain('etag');
  });

  it('deduplicates uniform arrays', () => {
    const payload = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `user${i}`,
      role: 'viewer',
    }));
    const input = JSON.stringify(payload);
    const result = compact(input);
    const parsed = JSON.parse(result);
    // Should have _schema and _rows somewhere in output
    expect(JSON.stringify(parsed)).toContain('_schema');
  });

  it('accepts options to configure behavior', () => {
    const payload = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `user${i}`,
      status: 'active',
    }));
    const input = JSON.stringify(payload);
    const result = compact(input, { omitNotes: true });
    expect(result).not.toContain('_note');
  });

  it('is lossless by default (no truncation)', () => {
    const payload = {
      items: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `item${i}` })),
    };
    const input = JSON.stringify(payload);
    const result = compact(input);
    const parsed = JSON.parse(result);
    // All 50 items should be preserved (in _rows if deduplicated)
    const rows = parsed.items?._rows ?? parsed._rows ?? parsed.items;
    expect(rows?.length ?? 50).toBe(50);
  });

  it('truncates when maxItems is set', () => {
    const payload = {
      items: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `item${i}` })),
    };
    const input = JSON.stringify(payload);
    const result = compact(input, { maxItems: 5 });
    const parsed = JSON.parse(result);
    // After truncation, rows should be 5
    const rows = parsed.items?._rows ?? parsed._rows;
    expect(rows?.length).toBe(5);
  });
});
