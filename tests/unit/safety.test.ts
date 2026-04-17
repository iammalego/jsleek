import { describe, it, expect } from 'vitest';
import { applySafety } from '../../src/safety.js';
import type { Transform } from '../../src/types.js';

const identity: Transform = (node) => node;

const throwingTransform: Transform = () => {
  throw new Error('transform error');
};

const growingTransform: Transform = (node) => {
  // Returns a larger structure to trigger regression guard
  return { original: node, extra: 'x'.repeat(10000) };
};

describe('applySafety', () => {
  it('passes through non-JSON input unchanged', () => {
    const input = 'not json at all';
    expect(applySafety(input, [identity], {})).toBe(input);
  });

  it('passes through HTML unchanged', () => {
    const input = '<html><body>hello</body></html>';
    expect(applySafety(input, [identity], {})).toBe(input);
  });

  it('returns original when input.length <= minInputLength (default 100)', () => {
    const input = JSON.stringify({ a: 1 });
    expect(input.length).toBeLessThanOrEqual(100);
    expect(applySafety(input, [identity], {})).toBe(input);
  });

  it('processes input longer than default minInputLength', () => {
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    const result = applySafety(input, [identity], {});
    // identity transform -> same data, but JSON.stringify may differ in whitespace
    expect(JSON.parse(result)).toEqual(JSON.parse(input));
  });

  it('respects custom minInputLength', () => {
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    // With minInputLength larger than input, should return original
    const result = applySafety(input, [identity], { minInputLength: 99999 });
    expect(result).toBe(input);
  });

  it('catches transform errors and returns original', () => {
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    const result = applySafety(input, [throwingTransform], {});
    expect(result).toBe(input);
  });

  it('applies regression guard — returns original when output >= input', () => {
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    const result = applySafety(input, [growingTransform], {});
    expect(result).toBe(input);
  });

  it('handles empty transforms array (identity pipeline)', () => {
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    // Empty transforms: parse then stringify — may be same or different length
    // Either way it should be valid JSON
    const result = applySafety(input, [], {});
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('applies transforms in order', () => {
    const calls: number[] = [];
    const t1: Transform = (node) => {
      calls.push(1);
      return node;
    };
    const t2: Transform = (node) => {
      calls.push(2);
      return node;
    };
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    applySafety(input, [t1, t2], {});
    expect(calls).toEqual([1, 2]);
  });

  it('passes options to transforms', () => {
    const capturedOptions: unknown[] = [];
    const capturingTransform: Transform = (node, opts) => {
      capturedOptions.push(opts);
      return node;
    };
    const input = JSON.stringify({ key: 'x'.repeat(200) });
    const options = { maxItems: 5, omitNotes: true };
    applySafety(input, [capturingTransform], options);
    expect(capturedOptions[0]).toEqual(options);
  });
});
