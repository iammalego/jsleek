import { describe, it, expect } from 'vitest';
import { stripInfrastructure } from '../../src/transforms/strip-infrastructure.js';

describe('stripInfrastructure', () => {
  const opts = {};

  it('strips allowlisted infra fields', () => {
    const input = {
      id: 1,
      name: 'Alice',
      etag: 'W/"abc123"',
      request_id: 'req-123',
      __v: 0,
      __typename: 'User',
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    expect(result).not.toHaveProperty('etag');
    expect(result).not.toHaveProperty('request_id');
    expect(result).not.toHaveProperty('__v');
    expect(result).not.toHaveProperty('__typename');
    expect(result).toHaveProperty('id', 1);
    expect(result).toHaveProperty('name', 'Alice');
  });

  it('strips underscore-prefixed fields with sufficient weight', () => {
    const input = {
      name: 'Bob',
      // _links: H1(1) + H2(url object=2) = 3 -> strips
      _links: { self: 'https://example.com' },
      // _embedded: H1(1), value is {items:[]} — not url-object, not url string, not long string -> weight 1
      // weight 1 < 2, so _embedded is NOT stripped by heuristics alone
      _embedded: { items: [] },
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    expect(result).not.toHaveProperty('_links');
    // _embedded only has weight 1 (underscore prefix), not stripped
    expect(result).toHaveProperty('_embedded');
    expect(result).toHaveProperty('name', 'Bob');
  });

  it('strips _embedded via dropFields', () => {
    const input = {
      name: 'Bob',
      _embedded: { items: [] },
    };
    const result = stripInfrastructure(input, { dropFields: ['_embedded'] }) as Record<
      string,
      unknown
    >;
    expect(result).not.toHaveProperty('_embedded');
    expect(result).toHaveProperty('name', 'Bob');
  });

  it('strips fields that are objects of only URLs (H2 heuristic, weight 2)', () => {
    const input = {
      name: 'Service',
      links: { self: 'https://example.com', next: 'https://example.com/2' },
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    expect(result).not.toHaveProperty('links');
    expect(result).toHaveProperty('name', 'Service');
  });

  it('strips string URL values (H3 heuristic, weight 1) combined with long string (H4)', () => {
    const input = {
      name: 'Repo',
      // This is a URL string: H3=1, but needs total >= 2
      // If we add underscore prefix: H1=1 + H3=1 = 2 -> strips
      _url: 'https://example.com/some/long/path/here',
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    // _url: H1(1) + H3(1) = 2 -> strip
    expect(result).not.toHaveProperty('_url');
  });

  it('does NOT strip URL-valued field without additional weight', () => {
    const input = {
      // url: H3=1 -> total 1, not >= 2 -> keep
      url: 'https://example.com',
      name: 'test',
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    // url only has weight 1 (H3), needs >= 2 to strip
    expect(result).toHaveProperty('url', 'https://example.com');
  });

  it('strips long opaque strings combined with another heuristic (H4 weight 1)', () => {
    const input = {
      id: 1,
      // _token: H1(1) + H4(1) = 2 -> strips
      _token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    expect(result).not.toHaveProperty('_token');
  });

  it('keepFields overrides stripping', () => {
    const input = {
      name: 'Alice',
      __typename: 'User',
      etag: 'W/"abc"',
    };
    const result = stripInfrastructure(input, { keepFields: ['__typename'] }) as Record<
      string,
      unknown
    >;
    expect(result).toHaveProperty('__typename', 'User');
    expect(result).not.toHaveProperty('etag');
  });

  it('dropFields always strips', () => {
    const input = {
      name: 'Alice',
      customField: 'value',
    };
    const result = stripInfrastructure(input, { dropFields: ['customField'] }) as Record<
      string,
      unknown
    >;
    expect(result).not.toHaveProperty('customField');
    expect(result).toHaveProperty('name', 'Alice');
  });

  it('keepFields wins over dropFields', () => {
    const input = {
      name: 'Alice',
      field: 'value',
    };
    const result = stripInfrastructure(input, {
      keepFields: ['field'],
      dropFields: ['field'],
    }) as Record<string, unknown>;
    expect(result).toHaveProperty('field', 'value');
  });

  it('recurses into nested objects', () => {
    const input = {
      user: {
        name: 'Alice',
        etag: 'W/"abc"',
        __typename: 'User',
      },
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    const user = result.user as Record<string, unknown>;
    expect(user).toHaveProperty('name', 'Alice');
    expect(user).not.toHaveProperty('etag');
    expect(user).not.toHaveProperty('__typename');
  });

  it('recurses into array items', () => {
    const input = {
      items: [
        { name: 'Alice', etag: 'W/"a"', __v: 1 },
        { name: 'Bob', etag: 'W/"b"', __v: 2 },
      ],
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    const items = result.items as Array<Record<string, unknown>>;
    expect(items[0]).toHaveProperty('name', 'Alice');
    expect(items[0]).not.toHaveProperty('etag');
    expect(items[0]).not.toHaveProperty('__v');
  });

  it('passes through primitive values', () => {
    expect(stripInfrastructure(42, opts)).toBe(42);
    expect(stripInfrastructure('hello', opts)).toBe('hello');
    expect(stripInfrastructure(null, opts)).toBe(null);
    expect(stripInfrastructure(true, opts)).toBe(true);
  });

  it('strips x-request-id and x-correlation-id from allowlist', () => {
    const input = {
      name: 'Alice',
      'x-request-id': 'abc123',
      'x-correlation-id': 'xyz789',
    };
    const result = stripInfrastructure(input, opts) as Record<string, unknown>;
    expect(result).not.toHaveProperty('x-request-id');
    expect(result).not.toHaveProperty('x-correlation-id');
    expect(result).toHaveProperty('name', 'Alice');
  });
});
