import type { ChangeKind, DiffChange, JsonValue } from './types.js';
import { isRecord, stableStringify } from './normalize.js';

function equal(a: JsonValue, b: JsonValue): boolean { return stableStringify(a) === stableStringify(b); }
function childPath(base: string, key: string | number): string { return `${base}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`; }
function isScalar(value: JsonValue): boolean { return value === null || typeof value !== 'object'; }
function isPermissionArrayPath(path: string): boolean {
  return path.split('/').some((segment) => /^(permissions|scopes|allow|allowed|tools|capabilities|roles)$/i.test(segment));
}

function diffScalarMultiset(before: JsonValue[], after: JsonValue[], path: string): DiffChange[] {
  const sortedBefore = [...before].sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
  const sortedAfter = [...after].sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
  const remainingAfter = new Map<string, number>();
  for (const value of sortedAfter) {
    const key = stableStringify(value);
    remainingAfter.set(key, (remainingAfter.get(key) ?? 0) + 1);
  }

  const removed: DiffChange[] = [];
  sortedBefore.forEach((value, index) => {
    const key = stableStringify(value);
    const remaining = remainingAfter.get(key) ?? 0;
    if (remaining > 0) remainingAfter.set(key, remaining - 1);
    else removed.push(...diffValues(value, undefined, childPath(path, index)));
  });

  const remainingBefore = new Map<string, number>();
  for (const value of sortedBefore) {
    const key = stableStringify(value);
    remainingBefore.set(key, (remainingBefore.get(key) ?? 0) + 1);
  }
  const added: DiffChange[] = [];
  sortedAfter.forEach((value, index) => {
    const key = stableStringify(value);
    const remaining = remainingBefore.get(key) ?? 0;
    if (remaining > 0) remainingBefore.set(key, remaining - 1);
    else added.push(...diffValues(undefined, value, childPath(path, index)));
  });
  return [...removed, ...added];
}

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
    if (isPermissionArrayPath(path) && before.every(isScalar) && after.every(isScalar)) {
      return diffScalarMultiset(before, after, path);
    }
    const max = Math.max(before.length, after.length);
    const changes: DiffChange[] = [];
    for (let index = 0; index < max; index += 1) changes.push(...diffValues(before[index], after[index], childPath(path, index)));
    return changes;
  }
  return [{ path: path || '/', kind: 'changed', before, after, severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' }];
}
