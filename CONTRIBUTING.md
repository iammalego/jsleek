# Contributing to jsleek

Thanks for your interest in making jsleek better. This document explains how to get set up, run tests, and submit changes.

## Welcome

jsleek is a small, focused TypeScript library for algorithmically compressing JSON API responses before sending them to LLMs. Contributions of all sizes are welcome — bug reports, documentation fixes, new transforms, and real-world payload fixtures.

## Getting Started

The project uses npm and requires Node.js 20 or newer.

```bash
git clone https://github.com/iammalego/jsleek.git
cd jsleek
npm install
```

## Development Setup

- **Node.js:** 20.x or 22.x (LTS versions). The CI matrix runs both.
- **Package manager:** npm (a `package-lock.json` is committed).
- **Editor:** any TypeScript-aware editor works. VS Code with the ESLint extension will pick up the flat config automatically.

## Running Tests

```bash
npm test                 # run the full suite once
npm run test:watch       # re-run on file changes
npm run test:coverage    # produce a coverage report
```

All tests must pass before a PR can be merged. New behavior must come with new tests.

## Code Style

ESLint and Prettier are (or will soon be) configured in this repository. Once the tooling lands, run:

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint .
npm run format:check     # prettier --check .
```

> **Note:** ESLint + Prettier land in the tooling/CI change that immediately follows this docs PR. If you're reading this before that change merges, skip the lint/format commands — `npm test` and `npx tsc --noEmit` are sufficient.

## Submitting Changes

1. Fork the repo or create a branch directly if you have write access.
2. Make your changes on a descriptive branch (e.g. `fix/dedupe-edge-case`, `feat/new-transform`).
3. Commit using Conventional Commits (see below).
4. Open a pull request against `main`. The PR template will populate the body — fill in each section.
5. CI must be green before merge.

## Commit Format

This repository uses [Conventional Commits](https://www.conventionalcommits.org/). A commit subject looks like:

```
<type>(<optional scope>): <description>
```

**Allowed types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`.

**Examples:**

```
feat(pipeline): add truncateArrays transform
fix(dedupe): handle mixed-schema arrays gracefully
docs: clarify lossless-by-default guarantee
chore(deps): bump vitest to 4.0.0
```

### Commit rules

- **No AI attribution.** Do not include `Co-Authored-By: Claude ...` or similar AI-tool trailers. Human authorship only.
- **No `--no-verify`.** Do not bypass commit or push hooks.
- **One logical change per commit.** Split unrelated work into separate commits; keep diffs reviewable.

## Alert syntax caveat

The README uses GitHub-flavoured alerts (`[!NOTE]`, `[!WARNING]`, `[!TIP]`, `[!IMPORTANT]`). These render as styled callouts on GitHub but fall back to plain blockquotes on the npm registry page. Contributors are welcome to use these in the README; please make sure the content still reads correctly as a plain blockquote.
