import type { DiffChange, JsonValue, Severity } from './types.js';

type Classifier = (change: DiffChange) => Partial<DiffChange> | undefined;
const severityRank: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
export const severities = Object.keys(severityRank) as Severity[];
export function maxSeverity(a: Severity, b: Severity): Severity { return severityRank[a] >= severityRank[b] ? a : b; }

function text(value: JsonValue | undefined): string { return String(value ?? '').toLowerCase(); }
function pathHas(change: DiffChange, pattern: RegExp): boolean { return pattern.test(change.path.toLowerCase()); }
function becameTruthy(change: DiffChange): boolean { return change.kind === 'changed' && change.before === false && change.after === true; }
function becameFalsy(change: DiffChange): boolean { return change.kind === 'changed' && change.before === true && change.after === false; }
function widenedWord(before: JsonValue | undefined, after: JsonValue | undefined): boolean {
  const b = text(before); const a = text(after);
  if (a === '*' || a === 'all' || a === 'write' || a === 'admin') return a !== b;
  if (['read', 'none', 'restricted'].includes(b) && ['write', 'admin', 'all', '*'].includes(a)) return true;
  return false;
}

const classifiers: Classifier[] = [
  (c) => pathHas(c, /permissions|scopes|allow|allowed|tools|capabilities|roles/) && (c.kind === 'added' || widenedWord(c.before, c.after)) ? { severity: 'high', category: 'permission', ruleId: 'permission.widened', message: 'Permission, role, scope, or allowlist widened.' } : undefined,
  (c) => pathHas(c, /permissions|scopes|allow|allowed|tools|capabilities|roles/) && c.kind === 'removed' ? { severity: 'medium', category: 'permission', ruleId: 'permission.removed', message: 'Permission-related entry removed; confirm this is intentional.' } : undefined,
  (c) => pathHas(c, /required.*review|approv|protected|enforce|guard|deny|block|required/) && (c.kind === 'removed' || becameFalsy(c)) ? { severity: 'critical', category: 'guardrail', ruleId: 'guardrail.removed', message: 'Review, enforcement, or guardrail appears removed or disabled.' } : undefined,
  (c) => pathHas(c, /required.*review|approv|protected|enforce|guard/) && (c.kind === 'added' || becameTruthy(c)) ? { severity: 'low', category: 'guardrail', ruleId: 'guardrail.added', message: 'Guardrail appears added or enabled.' } : undefined,
  (c) => pathHas(c, /github|workflow|actions|contents|pull-requests/) && widenedWord(c.before, c.after) ? { severity: 'high', category: 'github-actions', ruleId: 'github.permission.write', message: 'GitHub Actions permission was widened.' } : undefined,
  (c) => pathHas(c, /scripts|preinstall|postinstall|prepare/) && c.kind !== 'removed' ? { severity: 'high', category: 'package-scripts', ruleId: 'script.execution.changed', message: 'Package lifecycle or executable script changed.' } : undefined,
  (c) => pathHas(c, /cors|origin|hosts/) && (text(c.after).includes('*') || c.kind === 'added') ? { severity: 'medium', category: 'network', ruleId: 'network.exposure.changed', message: 'Network exposure or CORS setting changed.' } : undefined,
  (c) => pathHas(c, /secret|token|password|private/) ? { severity: 'medium', category: 'secret-handling', ruleId: 'secret.path.changed', message: 'Secret-adjacent configuration changed; avoid committing sensitive values.' } : undefined,
];

export function classifyChange(change: DiffChange): DiffChange {
  let classified: DiffChange = { ...change, severity: 'low', category: 'generic', ruleId: 'generic.change', message: `${change.kind} value at ${change.path}` };
  for (const classifier of classifiers) {
    const hit = classifier(change);
    if (hit && severityRank[hit.severity ?? 'info'] >= severityRank[classified.severity]) classified = { ...classified, ...hit };
  }
  return classified;
}
