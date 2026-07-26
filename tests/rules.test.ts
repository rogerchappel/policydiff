import assert from 'node:assert/strict';
import test from 'node:test';
import { diffValues } from '../src/differ.js';
import { classifyChange } from '../src/rules.js';

test('classifies widened permissions as high severity', () => {
  const change = classifyChange({ path: '/permissions/contents', kind: 'changed', before: 'read', after: 'write', severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' });
  assert.equal(change.severity, 'high');
  assert.equal(change.ruleId, 'github.permission.write');
});

test('classifies disabled approvals as critical guardrail removal', () => {
  const change = classifyChange({ path: '/requireApproval', kind: 'changed', before: true, after: false, severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' });
  assert.equal(change.severity, 'critical');
});

test('classifies semantic allowlist additions and removals by risk', () => {
  const changes = diffValues(
    { tools: { allow: ['read', 'write'] } },
    { tools: { allow: ['admin', 'read'] } },
  ).map(classifyChange);

  assert.deepEqual(
    changes.map(({ kind, severity, ruleId }) => ({ kind, severity, ruleId })),
    [
      { kind: 'removed', severity: 'medium', ruleId: 'permission.removed' },
      { kind: 'added', severity: 'high', ruleId: 'permission.widened' },
    ],
  );
});
