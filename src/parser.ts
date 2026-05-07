import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import yaml from 'js-yaml';
import type { JsonValue } from './types.js';
import { normalize } from './normalize.js';

export function isSupportedPolicyFile(path: string): boolean {
  return ['.json', '.yaml', '.yml'].includes(extname(path).toLowerCase());
}

function assertJsonValue(value: unknown, file: string): asserts value is JsonValue {
  const seen = new Set<unknown>();
  const visit = (item: unknown, where: string): void => {
    if (item === null || ['string', 'number', 'boolean'].includes(typeof item)) return;
    if (Array.isArray(item)) return item.forEach((child, index) => visit(child, `${where}[${index}]`));
    if (typeof item === 'object') {
      if (seen.has(item)) throw new Error(`${file}: circular value at ${where}`);
      seen.add(item);
      for (const [key, child] of Object.entries(item as Record<string, unknown>)) visit(child, `${where}.${key}`);
      return;
    }
    throw new Error(`${file}: unsupported ${typeof item} at ${where}`);
  };
  visit(value, '$');
}

export async function parsePolicyFile(path: string): Promise<JsonValue> {
  const raw = await readFile(path, 'utf8');
  const ext = extname(path).toLowerCase();
  const parsed = ext === '.json' ? JSON.parse(raw) : yaml.load(raw, { json: true });
  const value = parsed === undefined ? null : parsed;
  assertJsonValue(value, path);
  return normalize(value);
}
