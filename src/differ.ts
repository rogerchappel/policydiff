import type { ChangeKind, DiffChange, JsonValue } from './types.js';
import { isRecord, stableStringify } from './normalize.js';

function equal(a: JsonValue, b: JsonValue): boolean { return stableStringify(a) === stableStringify(b); }
function childPath(base: string, key: string | number): string { return `${base}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`; }

function collectWhole(path: string, kind: ChangeKind, value: JsonValue | undefined): DiffChange[] {
  if (value !== undefined && isRecord(value)) {
    const keys = Object.keys(value).sort();
    if (keys.length > 0) return keys.flatMap((key) => collectWhole(childPath(path, key), kind, value[key]));
  }
  if (Array.isArray(value) && value.length > 0) {
    return value.flatMap((item, index) => collectWhole(childPath(path, index), kind, item));
  }
  return [{ path: path || '/', kind, before: kind === 'removed' ? value : undefined, after: kind === 'added' ? value : undefined, severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' }];
}

export function diffValues(before: JsonValue | undefined, after: JsonValue | undefined, path = ''): DiffChange[] {
  if (before === undefined && after !== undefined) return collectWhole(path, 'added', after);
  if (after === undefined && before !== undefined) return collectWhole(path, 'removed', before);
  if (before === undefined || after === undefined || equal(before, after)) return [];

  if (isRecord(before) && isRecord(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    return keys.flatMap((key) => diffValues(before[key], after[key], childPath(path, key)));
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const max = Math.max(before.length, after.length);
    const changes: DiffChange[] = [];
    for (let index = 0; index < max; index += 1) changes.push(...diffValues(before[index], after[index], childPath(path, index)));
    return changes;
  }
  return [{ path: path || '/', kind: 'changed', before, after, severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' }];
}
