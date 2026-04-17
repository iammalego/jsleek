import { describe, it, expect } from 'vitest';
import { pipeline } from '../../src/pipeline.js';
import { stripInfrastructure, deduplicate } from '../../src/transforms/index.js';
import type { Transform } from '../../src/types.js';

describe('pipeline', () => {
  it('returns original for non-JSON input', () => {
    expect(pipeline('not json', [])).toBe('not json');
  });

  it('applies transforms in order', () => {
    const order: number[] = [];
    const t1: Transform = (node) => {
      order.push(1);
      return node;
    };
    const t2: Transform = (node) => {
      order.push(2);
      return node;
    };
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    pipeline(input, [t1, t2]);
    expect(order).toEqual([1, 2]);
  });

  it('allows custom transform pipeline', () => {
    const payload = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `user${i}`,
      etag: `W/"${i}"`,
      __typename: 'User',
    }));
    const input = JSON.stringify(payload);
    const result = pipeline(input, [stripInfrastructure, deduplicate]);
    const parsed = JSON.parse(result);
    expect(parsed._schema).toBeDefined();
    expect(JSON.stringify(parsed)).not.toContain('etag');
    expect(JSON.stringify(parsed)).not.toContain('__typename');
  });

  it('passes options to transforms', () => {
    const capturedOpts: unknown[] = [];
    const capturer: Transform = (node, opts) => {
      capturedOpts.push(opts);
      return node;
    };
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    pipeline(input, [capturer], { maxItems: 10, omitNotes: true });
    expect(capturedOpts[0]).toEqual({ maxItems: 10, omitNotes: true });
  });

  it('returns original if result is not smaller (regression guard)', () => {
    const growingTransform: Transform = (node) => {
      return { original: node, extra: 'x'.repeat(10000) };
    };
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    const result = pipeline(input, [growingTransform]);
    expect(result).toBe(input);
  });

  it('handles empty transforms array', () => {
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    const result = pipeline(input, []);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
