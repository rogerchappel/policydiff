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

test('matches permission rules on complete decoded path segments', () => {
  for (const path of ['/roles', '/tools/allow']) {
    const change = classifyChange({ path, kind: 'added', after: 'write', severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' });
    assert.equal(change.ruleId, 'permission.widened', path);
  }

  const githubPermission = classifyChange({ path: '/permissions/contents', kind: 'added', after: 'write', severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' });
  assert.equal(githubPermission.ruleId, 'github.permission.write');
});

test('does not classify permission-like key substrings as permissions', () => {
  for (const path of ['/rolesDescription', '/disallowedReason', '/toolset', '/capabilitiesSummary', '/roles~1description']) {
    const change = classifyChange({ path, kind: 'added', after: 'write', severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' });
    assert.equal(change.ruleId, 'generic.change', path);
    assert.equal(change.severity, 'low', path);
  }
});

test('matches intentional path segments and documented compound keys', () => {
  const cases = [
    { path: '/requireApproval', kind: 'removed' as const, before: true, ruleId: 'guardrail.removed' },
    { path: '/githubWorkflow', kind: 'changed' as const, before: 'read', after: 'write', ruleId: 'github.permission.write' },
    { path: '/scripts/build', kind: 'changed' as const, before: 'old', after: 'new', ruleId: 'script.execution.changed' },
    { path: '/clientSecret', kind: 'changed' as const, before: 'old', after: 'new', ruleId: 'secret.path.changed' },
  ];

  for (const { ruleId, ...change } of cases) {
    assert.equal(classifyChange({ ...change, severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' }).ruleId, ruleId, change.path);
  }
});

test('does not classify unrelated path segment substrings', () => {
  for (const path of ['/notrequired', '/privateer', '/workflowsDescription', '/transcripts', '/origination', '/blockchain']) {
    const change = classifyChange({ path, kind: 'added', after: 'write', severity: 'info', category: 'generic', message: '', ruleId: 'generic.change' });
    assert.equal(change.ruleId, 'generic.change', path);
    assert.equal(change.severity, 'low', path);
  }
});
