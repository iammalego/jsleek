<p align="center">
  <strong>English</strong> · <a href="./docs/README.es.md">Español</a>
</p>

<h1 align="center">jsleek</h1>
<p align="center"><em>— sleek JSON encoding for LLM pipelines —</em></p>
<p align="center"><sub><b>S</b>chema-<b>L</b>inked <b>E</b>fficient <b>E</b>ncoding <b>K</b>it</sub></p>

<p align="center">
  <a href="https://www.npmjs.com/package/jsleek"><img src="https://img.shields.io/badge/version-0.1.0-blue" alt="npm version"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/jsleek" alt="node version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/jsleek" alt="license"></a>
  <a href="https://github.com/iammalego/jsleek/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/iammalego/jsleek/ci.yml?label=CI" alt="CI"></a>
  <a href="https://bundlephobia.com/package/jsleek"><img src="https://img.shields.io/bundlephobia/minzip/jsleek?label=size" alt="bundle size"></a>
</p>

> Same information, fewer tokens. `jsleek` compresses any JSON payload by up to 73% before it reaches your LLM — measured on live public APIs. Lossless by default, zero dependencies, never throws.

`jsleek` takes a JSON string and returns a smaller JSON string that carries the same information. It works on any JSON — API responses, database dumps, log payloads, MCP tool output, anything. It is lossless by default, has zero runtime dependencies, and **never throws**.

```ts
import { compact } from 'jsleek';

const compressed = compact(anyJsonString);
// → same semantic content, fewer tokens
```

## Features

- **Lossless by default** — no data loss unless you opt into `entropyThreshold > 0` or `maxItems`.
- **Schema deduplication** — uniform arrays of objects collapse into a compact `_schema` + `_rows` columnar shape.
- **Constant hoisting** — columns where every row shares the same value are lifted into `_const`.
- **Infrastructure stripping** — drops fields that carry no semantic value: `etag`, `request_id`, `__typename`, `_links`, `__v`, and URL-shaped metadata.
- **Nested unwrapping** — collapses single-key wrappers like `{ data: { users: [...] } }` down to the payload.
- **Safe by construction** — returns the original input on any failure or when the output is not smaller.
- **Zero dependencies** — ~2 kB minzipped, ESM + CJS dual build, TypeScript types included.
- **Composable** — use `compact()` as a one-liner or compose individual transforms with `pipeline()`.

## Installation

```bash
npm install jsleek
```

## Basic usage

```ts
import { compact } from 'jsleek';

const raw = await fetch('/api/users').then((r) => r.text());
const compressed = compact(raw);

// pass `compressed` to any LLM, file, network, whatever
```

Input and output are both JSON **strings**. `compact()` never throws — on invalid JSON, a transform error, or when the output would not be smaller than the input, it returns the original string unchanged.

## A bigger example — schema reduction

Here is a typical API response: a paginated list of six users wrapped in a `data` envelope, with pagination links, request metadata, and per-item infrastructure fields (`_id`, `etag`, `__v`).

**Before (1,584 bytes)**

```json
{
  "data": {
    "users": [
      {
        "id": 101,
        "name": "Alice Johnson",
        "email": "alice@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-01T10:00:00Z",
        "updatedAt": "2024-04-15T14:22:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d1",
        "etag": "W/\"ab001\"",
        "__v": 0
      },
      {
        "id": 102,
        "name": "Bob Smith",
        "email": "bob@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-02T11:30:00Z",
        "updatedAt": "2024-04-10T09:15:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d2",
        "etag": "W/\"ab002\"",
        "__v": 0
      },
      {
        "id": 103,
        "name": "Carol Chen",
        "email": "carol@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-03T09:45:00Z",
        "updatedAt": "2024-04-12T16:40:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d3",
        "etag": "W/\"ab003\"",
        "__v": 0
      },
      {
        "id": 104,
        "name": "David Park",
        "email": "david@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-04T13:20:00Z",
        "updatedAt": "2024-04-14T12:05:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d4",
        "etag": "W/\"ab004\"",
        "__v": 0
      },
      {
        "id": 105,
        "name": "Eva Martinez",
        "email": "eva@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-05T15:10:00Z",
        "updatedAt": "2024-04-13T10:30:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d5",
        "etag": "W/\"ab005\"",
        "__v": 0
      },
      {
        "id": 106,
        "name": "Frank Weber",
        "email": "frank@acme.com",
        "role": "member",
        "plan": "pro",
        "active": true,
        "createdAt": "2024-03-06T08:55:00Z",
        "updatedAt": "2024-04-11T13:45:00Z",
        "_id": "65f3a1b2c4d5e6f7a8b9c0d6",
        "etag": "W/\"ab006\"",
        "__v": 0
      }
    ]
  },
  "meta": { "request_id": "req-xyz-123", "trace_id": "trace-abc-456", "server_time": 1712345678 },
  "_links": { "self": { "href": "/api/v2/users?page=1" }, "next": { "href": "/api/v2/users?page=2" } }
}
```

**After `compact(raw)` (865 bytes, −45.4%, fully lossless)**

```json
{
  "data": {
    "_const": { "active": true, "plan": "pro", "role": "member" },
    "_schema": ["_id", "createdAt", "email", "id", "name", "updatedAt"],
    "_rows": [
      ["65f3a1b2c4d5e6f7a8b9c0d1", "2024-03-01T10:00:00Z", "alice@acme.com", 101, "Alice Johnson",   "2024-04-15T14:22:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d2", "2024-03-02T11:30:00Z", "bob@acme.com",   102, "Bob Smith",       "2024-04-10T09:15:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d3", "2024-03-03T09:45:00Z", "carol@acme.com", 103, "Carol Chen",      "2024-04-12T16:40:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d4", "2024-03-04T13:20:00Z", "david@acme.com", 104, "David Park",      "2024-04-14T12:05:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d5", "2024-03-05T15:10:00Z", "eva@acme.com",   105, "Eva Martinez",    "2024-04-13T10:30:00Z"],
      ["65f3a1b2c4d5e6f7a8b9c0d6", "2024-03-06T08:55:00Z", "frank@acme.com", 106, "Frank Weber",     "2024-04-11T13:45:00Z"]
    ],
    "_note": "Each _rows entry maps positionally to _schema"
  },
  "meta": 1712345678
}
```

What the pipeline did, in order:

1. **Stripped** `_links`, `etag`, `__v`, `request_id`, `trace_id` — they carry no information the model needs.
2. **Unwrapped** `meta: { server_time: ... }` down to the scalar value once its siblings were stripped.
3. **Deduplicated** the six user objects into `_schema` + `_rows` — the field names are written once, not six times.
4. **Hoisted** `active`, `plan`, and `role` into `_const` because every row had the same value.
5. **Truncated** nothing — `maxItems` defaults to `Infinity`.

The LLM still sees every user, every field, every value. It just reads it in a denser form.

## Where it shines

`jsleek` works on any JSON, but it pays off most when a JSON payload is about to be serialized into an LLM prompt:

- **MCP servers** — wrap the JSON returned by tool handlers so the model sees signal instead of boilerplate.
- **AI agents with tool calling** — compress tool results before they enter the conversation.
- **RAG pipelines** that fetch from REST APIs before feeding the model.
- **Prompt pre-processing** for any LLM integration over CRM, ticketing, analytics, e-commerce, or logging systems.

The more rows, the more shared structure, the more boilerplate — the bigger the win.

## MCP integration pattern

```ts
import { compact } from 'jsleek';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const listUsersTool: Tool = {
  name: 'list_users',
  description: 'List users from the directory',
  handler: async () => {
    const res = await fetch('https://api.example.com/v2/users');
    const body = await res.text();
    return { content: [{ type: 'text', text: compact(body) }] };
  },
};
```

That's the whole integration. Same pattern for every tool that returns structured data.

## How it works

`compact()` runs a fixed five-step pipeline inside a safety wrapper. The steps execute in order; each one is an exported function you can import and use on its own.

1. **`stripInfrastructure`** — removes fields that carry no semantic payload: `etag`, `request_id`, `__typename`, `_links`, `__v`, cursor objects, and URL-shaped metadata. Allowlist-driven.
2. **`unwrapNested`** — collapses single-key wrapper objects and arrays. `{ data: { users: [...] } }` becomes `[...]`.
3. **`deduplicate`** — converts arrays of uniform objects into `{ _schema, _rows }` columnar form.
4. **`extractConstants`** — hoists columns where every row shares the same value into `_const`. Lossless when `entropyThreshold: 0` (default); lossy otherwise.
5. **`truncateArrays`** — caps array length and adds `_total`/`_kept`/`_truncated` metadata. No-op when `maxItems: Infinity` (default).

After the pipeline runs, the safety wrapper compares input and output lengths. If the output is not smaller, or any step threw, the original string is returned unchanged.

## Benchmarks

Measured against live public APIs — each response was fetched with `curl`, minified, then passed through the default lossless `compact()` call. Table is sorted from best to worst compression.

| API                            | Items | Input   | Output  | Reduction  |
| ------------------------------ | ----- | ------- | ------- | ---------- |
| GitHub `/search/users`         |   100 |  96 kB  |  26 kB  | **−73.4%** |
| CoinGecko `/coins/markets`     |   250 | 195 kB  |  74 kB  | **−62.1%** |
| USGS Earthquakes (GeoJSON)     |   608 | 431 kB  | 304 kB  | **−29.5%** |
| RestCountries `/all`           |   250 | 105 kB  |  77 kB  | **−27.4%** |
| RandomUser `/?results=500`     |   500 | 539 kB  | 395 kB  | **−26.7%** |
| TV Maze `/shows`               |   240 | 373 kB  | 276 kB  | **−26.0%** |
| JSONPlaceholder `/photos`      | 5,000 | 891 kB  | 672 kB  | **−24.7%** |
| JSONPlaceholder `/comments`    |   500 | 140 kB  | 122 kB  | **−12.8%** |

**Aggregate: 2.7 MB → 1.9 MB across 7,448 records from 8 different APIs (−30% average, fully lossless).**

The biggest wins come from uniform arrays with many shared fields. GitHub's user objects carry 13+ URL-shaped fields per record that jsleek's URL heuristic strips aggressively, driving the 73.4% result. CoinGecko's 250 uniform coin rows with 25 shared keys each are a textbook dedup case. The smaller wins (photos, comments) reflect free-text-heavy payloads where key dedup is the only available lever. Lossy mode (`entropyThreshold > 0`) adds 1–6 percentage points in most cases; the safety wrapper automatically falls back to the lossless output when the lossy pipeline would produce a larger string.

## Lossless by default

| Option             | Default    | Effect on data loss                              |
| ------------------ | ---------- | ------------------------------------------------ |
| `maxItems`         | `Infinity` | Arrays are never truncated.                      |
| `entropyThreshold` | `0`        | Only identical-value columns are extracted.      |

Setting `entropyThreshold > 0` is an **opt-in lossy mode** — columns whose unique-value ratio falls under the threshold are collapsed to a single representative value. Useful when you're willing to trade some fidelity for size.

## Custom pipeline

`pipeline()` runs the transforms you pass, in the order you pass them:

```ts
import { pipeline, stripInfrastructure, deduplicate } from 'jsleek';

const result = pipeline(json, [stripInfrastructure, deduplicate], {
  deduplicateMinItems: 3,
  omitNotes: true,
});
```

Order matters: `deduplicate` must run before `extractConstants`, and `truncateArrays` should run last so its metadata reflects the final shape.

You can also write your own transform:

```ts
import { pipeline, stripInfrastructure, deduplicate } from 'jsleek';
import type { Transform } from 'jsleek';

const dropSecrets: Transform = (node) => {
  // strip any field whose name looks like a secret
  return node;
};

const result = pipeline(json, [stripInfrastructure, dropSecrets, deduplicate]);
```

## Options reference

| Option                 | Type                          | Default         | Description                                          |
| ---------------------- | ----------------------------- | --------------- | ---------------------------------------------------- |
| `minInputLength`       | `number`                      | `100`           | Skip compression for short inputs.                   |
| `keepFields`           | `string[]`                    | `[]`            | Force-keep these fields (overrides all stripping).   |
| `dropFields`           | `string[]`                    | `[]`            | Force-strip these fields.                            |
| `maxItems`             | `number`                      | `Infinity`      | Max array items to keep (lossless by default).       |
| `sampleMethod`         | `'first' \| 'statistical'`    | `'statistical'` | How to sample when truncating.                       |
| `entropyThreshold`     | `number`                      | `0`             | Extract constants when uniqueRatio ≤ this value.     |
| `deduplicateMinItems`  | `number`                      | `5`             | Min array size to attempt deduplication.             |
| `deduplicateMinRatio`  | `number`                      | `0.70`          | Min fraction of items sharing the same key set.      |
| `omitNotes`            | `boolean`                     | `false`         | Suppress `_note` fields in output.                   |
| `maxUnwrapDepth`       | `number`                      | `20`            | Max depth for unwrapping single-key wrappers.        |

## Output shapes

These examples use realistic sizes so compression is visible. For inputs below `minInputLength` (default 100 bytes) or below `deduplicateMinItems` (default 5), the safety wrapper returns the input unchanged — `jsleek` never makes a payload larger.

### Deduplicated arrays — `_schema` / `_rows`

A uniform array of objects collapses to a columnar form: field names appear once, values stream as rows.

**Input** (612 bytes)

```json
[
  { "id": 1, "name": "Alice", "email": "alice@acme.com", "joinedAt": "2024-01-10" },
  { "id": 2, "name": "Bob",   "email": "bob@acme.com",   "joinedAt": "2024-01-11" },
  { "id": 3, "name": "Carol", "email": "carol@acme.com", "joinedAt": "2024-01-12" },
  { "id": 4, "name": "David", "email": "david@acme.com", "joinedAt": "2024-01-13" },
  { "id": 5, "name": "Eva",   "email": "eva@acme.com",   "joinedAt": "2024-01-14" },
  { "id": 6, "name": "Frank", "email": "frank@acme.com", "joinedAt": "2024-01-15" }
]
```

**Output** (354 bytes, −42.2%)

```json
{
  "_schema": ["email", "id", "joinedAt", "name"],
  "_rows": [
    ["alice@acme.com", 1, "2024-01-10", "Alice"],
    ["bob@acme.com",   2, "2024-01-11", "Bob"],
    ["carol@acme.com", 3, "2024-01-12", "Carol"],
    ["david@acme.com", 4, "2024-01-13", "David"],
    ["eva@acme.com",   5, "2024-01-14", "Eva"],
    ["frank@acme.com", 6, "2024-01-15", "Frank"]
  ],
  "_note": "Each _rows entry maps positionally to _schema"
}
```

### Extracted constants — `_const`

Columns where every row holds the same value are hoisted out of `_rows`.

**Input** (564 bytes)

```json
[
  { "id": 1, "name": "Alice", "email": "alice@acme.com", "role": "member" },
  { "id": 2, "name": "Bob",   "email": "bob@acme.com",   "role": "member" },
  { "id": 3, "name": "Carol", "email": "carol@acme.com", "role": "member" },
  { "id": 4, "name": "David", "email": "david@acme.com", "role": "member" },
  { "id": 5, "name": "Eva",   "email": "eva@acme.com",   "role": "member" },
  { "id": 6, "name": "Frank", "email": "frank@acme.com", "role": "member" }
]
```

**Output** (292 bytes, −48.2%)

```json
{
  "_const": { "role": "member" },
  "_schema": ["email", "id", "name"],
  "_rows": [
    ["alice@acme.com", 1, "Alice"],
    ["bob@acme.com",   2, "Bob"],
    ["carol@acme.com", 3, "Carol"],
    ["david@acme.com", 4, "David"],
    ["eva@acme.com",   5, "Eva"],
    ["frank@acme.com", 6, "Frank"]
  ]
}
```

### Truncation metadata — `_total` / `_kept` / `_truncated`

When `maxItems` is set (default is `Infinity`), truncated arrays get sibling metadata so the LLM knows what was dropped:

```json
{
  "items": [/* the kept N items */],
  "_total": 1000,
  "_kept": 10,
  "_truncated": 990
}
```

## FAQ

**Does the LLM actually understand the `_schema`/`_rows` format?**
Yes. Modern LLMs (Claude, GPT-4/5, Gemini) read it natively with no accuracy loss on downstream tasks. Pairing the output with a one-line hint in the prompt — *"arrays may appear as `{_schema, _rows}` with positional mapping"* — makes it airtight.

**Is `compact()` safe to drop into production code?**
Yes. It never throws and returns the original string on any failure. No `try/catch` required.

**Does it modify my input?**
No. `jsleek` parses the input, transforms an in-memory copy, and serializes a new string. The original is untouched.

**Can I use it outside of LLM workflows?**
Yes. It's a generic JSON compressor. LLM prompts are the highest-value use case because tokens have a dollar cost, but it works equally well for logs, storage, network transfer, or anywhere JSON size matters.

## Contributing

Bug reports and feature requests are welcome — please use the [issue templates](https://github.com/iammalego/jsleek/issues/new/choose). For code contributions, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
