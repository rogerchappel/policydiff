import type { JsonValue } from './types.js';

export function normalize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map((item) => normalize(item));
  if (value && typeof value === 'object') {
    const out: Record<string, JsonValue> = {};
    for (const key of Object.keys(value).sort()) out[key] = normalize(value[key]);
    return out;
  }
  return value;
}

export function stableStringify(value: JsonValue): string {
  return JSON.stringify(normalize(value), null, 2);
}

export function toDisplay(value: JsonValue | undefined): string {
  if (value === undefined) return '∅';
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null || typeof value !== 'object') return String(value);
  return stableStringify(value).replace(/\n/g, ' ');
}

export function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
