import assert from 'node:assert/strict';
import test from 'node:test';
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
