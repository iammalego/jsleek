/**
 * Returns true if value looks like a URL (https?://) or a lowercase-only path (/foo/bar).
 */
export function isUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.startsWith('https://') || value.startsWith('http://')) return true;
  // Path: starts with / and is all lowercase (no uppercase letters)
  if (value.startsWith('/') && value === value.toLowerCase()) return true;
  return false;
}

/**
 * Returns true if value is a plain object where every leaf value is a URL.
 * Handles HAL-style {href: "..."} nested objects as single-leaf URL containers.
 */
export function isObjectOfOnlyUrls(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 0) return false;

  for (const key of keys) {
    const v = obj[key];
    if (isUrl(v)) {
      continue;
    }
    // HAL-style: {href: "..."} or {href: "...", templated: bool}
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const nested = v as Record<string, unknown>;
      const nestedKeys = Object.keys(nested);
      // Must have at least one href-like key that is a URL
      const urlKeys = nestedKeys.filter((k) => isUrl(nested[k]));
      if (urlKeys.length > 0) {
        continue;
      }
    }
    return false;
  }

  return true;
}
