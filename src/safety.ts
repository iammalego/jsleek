import type { CompactOptions, Transform } from './types.js';

export function applySafety(
  input: string,
  transforms: Transform[],
  options: CompactOptions,
): string {
  // 1. JSON.parse — if fails, return input as-is
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return input;
  }

  // 2. Size guard — if input is too small, not worth transforming
  const minInputLength = options.minInputLength ?? 100;
  if (input.length <= minInputLength) {
    return input;
  }

  // 3. Apply transforms with error protection
  let result: unknown;
  try {
    result = parsed;
    for (const transform of transforms) {
      result = transform(result, options);
    }
  } catch {
    return input;
  }

  // 4. Serialize result
  const output = JSON.stringify(result);

  // 5. Regression guard — only return if we actually compressed
  if (output.length >= input.length) {
    return input;
  }

  return output;
}
