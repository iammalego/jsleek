import { describe, it, expect } from 'vitest';

describe('index exports', () => {
  it('exports compact function', async () => {
    const mod = await import('../../src/index.js');
    expect(typeof mod.compact).toBe('function');
  });

  it('exports pipeline function', async () => {
    const mod = await import('../../src/index.js');
    expect(typeof mod.pipeline).toBe('function');
  });

  it('exports all 5 transforms', async () => {
    const mod = await import('../../src/index.js');
    expect(typeof mod.stripInfrastructure).toBe('function');
    expect(typeof mod.unwrapNested).toBe('function');
    expect(typeof mod.deduplicate).toBe('function');
    expect(typeof mod.extractConstants).toBe('function');
    expect(typeof mod.truncateArrays).toBe('function');
  });

  it('compact and pipeline are callable', async () => {
    const { compact, pipeline } = await import('../../src/index.js');
    expect(() => compact('not json')).not.toThrow();
    expect(() => pipeline('not json', [])).not.toThrow();
  });
});
