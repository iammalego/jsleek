import { describe, it, expect } from 'vitest';
import { isUrl, isObjectOfOnlyUrls } from '../../src/utils/url-detector.js';

describe('isUrl', () => {
  it('matches https URLs', () => {
    expect(isUrl('https://example.com/path')).toBe(true);
    expect(isUrl('https://api.github.com/repos/foo/bar')).toBe(true);
  });

  it('matches http URLs', () => {
    expect(isUrl('http://example.com')).toBe(true);
  });

  it('matches lowercase paths starting with /', () => {
    expect(isUrl('/api/v1/users')).toBe(true);
    expect(isUrl('/repos/foo/bar')).toBe(true);
  });

  it('does not match uppercase path-only strings', () => {
    expect(isUrl('/UPPERCASE')).toBe(false);
    expect(isUrl('/Mixed-Case')).toBe(false);
  });

  it('does not match plain strings', () => {
    expect(isUrl('hello world')).toBe(false);
    expect(isUrl('just-a-string')).toBe(false);
    expect(isUrl('')).toBe(false);
  });

  it('does not match numbers', () => {
    expect(isUrl(42)).toBe(false);
    expect(isUrl(null)).toBe(false);
  });

  it('does not match objects', () => {
    expect(isUrl({})).toBe(false);
  });
});

describe('isObjectOfOnlyUrls', () => {
  it('returns true for flat object of URL strings', () => {
    expect(isObjectOfOnlyUrls({ self: 'https://example.com', next: 'https://example.com/2' })).toBe(
      true,
    );
  });

  it('returns true for HAL-style {self: {href: "..."}}', () => {
    expect(isObjectOfOnlyUrls({ self: { href: 'https://example.com' } })).toBe(true);
  });

  it('returns true for mixed HAL and path URLs', () => {
    expect(
      isObjectOfOnlyUrls({
        self: { href: 'https://example.com' },
        items: '/api/items',
      }),
    ).toBe(true);
  });

  it('returns false for object with non-URL values', () => {
    expect(isObjectOfOnlyUrls({ self: 'https://example.com', name: 'John' })).toBe(false);
  });

  it('returns false for non-objects', () => {
    expect(isObjectOfOnlyUrls('https://example.com')).toBe(false);
    expect(isObjectOfOnlyUrls(42)).toBe(false);
    expect(isObjectOfOnlyUrls(null)).toBe(false);
    expect(isObjectOfOnlyUrls([])).toBe(false);
  });

  it('returns false for empty objects', () => {
    expect(isObjectOfOnlyUrls({})).toBe(false);
  });
});
