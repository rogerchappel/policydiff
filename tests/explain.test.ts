import assert from 'node:assert/strict';
import test from 'node:test';
import { explainReport } from '../src/explain.js';
import type { DiffReport } from '../src/types.js';

test('explainReport includes reviewer notes', () => {
  const report: DiffReport = { tool: 'policydiff', version: '0.1.0', generatedAt: 'now', before: 'a', after: 'b', summary: { filesCompared: 1, changes: 1, highestSeverity: 'high', bySeverity: { info: 0, low: 0, medium: 0, high: 1, critical: 0 } }, files: [{ path: 'policy.json', changes: [{ path: '/tools/allow/1', kind: 'added', after: 'exec', severity: 'high', category: 'permission', message: 'Permission widened.', ruleId: 'permission.widened' }] }] };
  assert.match(explainReport(report, 'markdown'), /Reviewer notes/);
  assert.match(explainReport(report, 'markdown'), /policy\.json/);
});
