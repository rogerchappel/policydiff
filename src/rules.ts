import type { DiffChange, JsonValue, Severity } from './types.js';

type Classifier = (change: DiffChange) => Partial<DiffChange> | undefined;
const severityRank: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
export const severities = Object.keys(severityRank) as Severity[];
export function maxSeverity(a: Severity, b: Severity): Severity { return severityRank[a] >= severityRank[b] ? a : b; }

function text(value: JsonValue | undefined): string { return String(value ?? '').toLowerCase(); }
function decodedPathSegments(path: string): string[] {
  return path.split('/').slice(1).map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~').toLowerCase());
}
function pathHasSegment(change: DiffChange, names: readonly string[]): boolean {
  return decodedPathSegments(change.path).some((segment) => names.includes(segment));
}
function pathHasMatchingSegment(change: DiffChange, names: readonly string[], patterns: readonly RegExp[] = []): boolean {
  return decodedPathSegments(change.path).some((segment) => names.includes(segment) || patterns.some((pattern) => pattern.test(segment)));
}
function isGithubActionsPermission(change: DiffChange): boolean {
  const segments = decodedPathSegments(change.path);
  return segments.some((segment, index) =>
    (segment === 'contents' || segment === 'pull-requests') && segments[index - 1] === 'permissions');
}
function becameTruthy(change: DiffChange): boolean { return change.kind === 'changed' && change.before === false && change.after === true; }
function becameFalsy(change: DiffChange): boolean { return change.kind === 'changed' && change.before === true && change.after === false; }
function addedFalsy(change: DiffChange): boolean { return change.kind === 'added' && change.after === false; }
function widenedWord(before: JsonValue | undefined, after: JsonValue | undefined): boolean {
  const b = text(before); const a = text(after);
  if (a === '*' || a === 'all' || a === 'write' || a === 'admin') return a !== b;
  if (['read', 'none', 'restricted'].includes(b) && ['write', 'admin', 'all', '*'].includes(a)) return true;
  return false;
}

const classifiers: Classifier[] = [
  (c) => pathHasSegment(c, ['permissions', 'scopes', 'allow', 'allowed', 'tools', 'capabilities', 'roles']) && (c.kind === 'added' || widenedWord(c.before, c.after)) ? { severity: 'high', category: 'permission', ruleId: 'permission.widened', message: 'Permission, role, scope, or allowlist widened.' } : undefined,
  (c) => pathHasSegment(c, ['permissions', 'scopes', 'allow', 'allowed', 'tools', 'capabilities', 'roles']) && c.kind === 'removed' ? { severity: 'medium', category: 'permission', ruleId: 'permission.removed', message: 'Permission-related entry removed; confirm this is intentional.' } : undefined,
  (c) => pathHasMatchingSegment(c, ['approval', 'approvals', 'protected', 'protection', 'enforce', 'enforcement', 'guard', 'guardrail', 'guardrails', 'deny', 'denied', 'block', 'blocked', 'required'], [/^(?:require|required)[_-]?(?:approval|approvals|review|reviews)$/, /^branch[_-]?(?:protected|protection)$/]) && (c.kind === 'removed' || becameFalsy(c) || addedFalsy(c)) ? { severity: 'critical', category: 'guardrail', ruleId: 'guardrail.removed', message: 'Review, enforcement, or guardrail appears removed or disabled.' } : undefined,
  (c) => pathHasMatchingSegment(c, ['approval', 'approvals', 'protected', 'protection', 'enforce', 'enforcement', 'guard', 'guardrail', 'guardrails'], [/^(?:require|required)[_-]?(?:approval|approvals|review|reviews)$/, /^branch[_-]?(?:protected|protection)$/]) && ((c.kind === 'added' && c.after !== false) || becameTruthy(c)) ? { severity: 'low', category: 'guardrail', ruleId: 'guardrail.added', message: 'Guardrail appears added or enabled.' } : undefined,
  (c) => isGithubActionsPermission(c) && widenedWord(c.before, c.after) ? { severity: 'high', category: 'github-actions', ruleId: 'github.permission.write', message: 'GitHub Actions permission was widened.' } : undefined,
  (c) => pathHasSegment(c, ['script', 'scripts', 'preinstall', 'postinstall', 'prepare']) && c.kind !== 'removed' ? { severity: 'high', category: 'package-scripts', ruleId: 'script.execution.changed', message: 'Package lifecycle or executable script changed.' } : undefined,
  (c) => pathHasSegment(c, ['cors', 'origin', 'origins', 'host', 'hosts']) && (text(c.after).includes('*') || c.kind === 'added') ? { severity: 'medium', category: 'network', ruleId: 'network.exposure.changed', message: 'Network exposure or CORS setting changed.' } : undefined,
  (c) => pathHasMatchingSegment(c, ['secret', 'secrets', 'token', 'tokens', 'password', 'passwords', 'private'], [/^(?:api|access|auth|client|refresh)[_-]?(?:secret|token)$/, /^private[_-]?key$/, /^(?:secret|token|password)[_-]?(?:key|value|name)$/]) ? { severity: 'medium', category: 'secret-handling', ruleId: 'secret.path.changed', message: 'Secret-adjacent configuration changed; avoid committing sensitive values.' } : undefined,
];

export function classifyChange(change: DiffChange): DiffChange {
  let classified: DiffChange = { ...change, severity: 'low', category: 'generic', ruleId: 'generic.change', message: `${change.kind} value at ${change.path}` };
  for (const classifier of classifiers) {
    const hit = classifier(change);
    if (hit && severityRank[hit.severity ?? 'info'] >= severityRank[classified.severity]) classified = { ...classified, ...hit };
  }
  return classified;
}
