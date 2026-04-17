import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compact } from '../../src/compact.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

function parseOutput(result: string): unknown {
  return JSON.parse(result);
}

describe('compact integration', () => {
  describe('kommo-leads.json (HAL+JSON)', () => {
    const input = loadFixture('kommo-leads.json');
    const output = compact(input);
    const parsed = parseOutput(output);

    it('produces smaller output than input', () => {
      expect(output.length).toBeLessThan(input.length);
    });

    it('produces valid JSON', () => {
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('strips _links infra fields', () => {
      expect(JSON.stringify(parsed)).not.toContain('"_links"');
    });

    it('strips request_id', () => {
      expect(JSON.stringify(parsed)).not.toContain('request_id');
    });

    it('strips etag', () => {
      expect(JSON.stringify(parsed)).not.toContain('"etag"');
    });

    it('strips __v', () => {
      expect(JSON.stringify(parsed)).not.toContain('"__v"');
    });

    it('preserves lead ids (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('1001');
      expect(str).toContain('1010');
    });

    it('preserves lead names (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('Lead Alpha');
      expect(str).toContain('Lead Kappa');
    });
  });

  describe('github-repos.json (GitHub API)', () => {
    const input = loadFixture('github-repos.json');
    const output = compact(input);
    const parsed = parseOutput(output);

    it('produces smaller output than input', () => {
      expect(output.length).toBeLessThan(input.length);
    });

    it('produces valid JSON', () => {
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('strips etag infra fields', () => {
      expect(JSON.stringify(parsed)).not.toContain('"etag"');
    });

    it('strips x-request-id infra fields', () => {
      expect(JSON.stringify(parsed)).not.toContain('x-request-id');
    });

    it('preserves repo names (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('awesome-lib');
      expect(str).toContain('cool-app');
    });

    it('preserves stargazers count (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('1234');
    });
  });

  describe('stripe-charges.json (Stripe API)', () => {
    const input = loadFixture('stripe-charges.json');
    const output = compact(input);
    const parsed = parseOutput(output);

    it('produces smaller output than input', () => {
      expect(output.length).toBeLessThan(input.length);
    });

    it('produces valid JSON', () => {
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('strips request_id infra fields', () => {
      expect(JSON.stringify(parsed)).not.toContain('request_id');
    });

    it('strips trace_id infra fields', () => {
      expect(JSON.stringify(parsed)).not.toContain('trace_id');
    });

    it('preserves charge amounts (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('2000');
      expect(str).toContain('9999');
    });

    it('preserves charge status (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('succeeded');
    });
  });

  describe('meta-campaigns.json (Meta Graph API)', () => {
    const input = loadFixture('meta-campaigns.json');
    const output = compact(input);
    const parsed = parseOutput(output);

    it('produces smaller output than input', () => {
      expect(output.length).toBeLessThan(input.length);
    });

    it('produces valid JSON', () => {
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('preserves campaign names (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('Summer Sale 2026');
      expect(str).toContain('Retargeting Campaign');
    });

    it('preserves campaign status (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('ACTIVE');
    });

    it('preserves budget data', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('5000');
    });
  });

  describe('jsonapi-articles.json (JSON:API)', () => {
    const input = loadFixture('jsonapi-articles.json');
    const output = compact(input);
    const parsed = parseOutput(output);

    it('produces smaller output than input', () => {
      expect(output.length).toBeLessThan(input.length);
    });

    it('produces valid JSON', () => {
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('preserves article titles (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('Introduction to JSON:API');
      expect(str).toContain('Advanced TypeScript Patterns');
    });
  });

  describe('graphql-users.json (GraphQL)', () => {
    const input = loadFixture('graphql-users.json');
    const output = compact(input);
    const parsed = parseOutput(output);

    it('produces smaller output than input', () => {
      expect(output.length).toBeLessThan(input.length);
    });

    it('produces valid JSON', () => {
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('strips __typename infra fields', () => {
      expect(JSON.stringify(parsed)).not.toContain('__typename');
    });

    it('preserves user names (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('Alice Anderson');
      expect(str).toContain('Bob Baker');
    });

    it('preserves email addresses (business data)', () => {
      const str = JSON.stringify(parsed);
      expect(str).toContain('alice@example.com');
    });
  });
});
