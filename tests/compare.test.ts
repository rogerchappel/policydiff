import assert from 'node:assert/strict';
import test from 'node:test';
import { compareInputs } from '../src/compare.js';

test('compareInputs compares fixture directories and summarizes risk', async () => {
  const report = await compareInputs('fixtures/before', 'fixtures/after');
  assert.equal(report.tool, 'policydiff');
  assert.equal(report.summary.filesCompared, 3);
  assert.ok(report.summary.changes > 0);
  assert.ok(report.summary.bySeverity.high > 0);
  assert.ok(report.summary.bySeverity.critical > 0);
});

test('compareInputs classifies leaves in wholly added and removed policy files', async () => {
  const report = await compareInputs('tests/fixtures/whole-files/before', 'tests/fixtures/whole-files/after');
  const added = report.files.find((file) => file.path === 'added-workflow.yml');
  const removed = report.files.find((file) => file.path === 'removed-policy.json');

  assert.deepEqual(
    added?.changes.map(({ path, kind, severity, category, ruleId }) => ({ path, kind, severity, category, ruleId })),
    [
      {
        path: '/name',
        kind: 'added',
        severity: 'low',
        category: 'generic',
        ruleId: 'generic.change',
      },
      {
        path: '/permissions/contents',
        kind: 'added',
        severity: 'high',
        category: 'github-actions',
        ruleId: 'github.permission.write',
      },
    ],
  );
  assert.deepEqual(
    removed?.changes.map(({ path, kind, severity, category, ruleId }) => ({ path, kind, severity, category, ruleId })),
    [
      {
        path: '/permissions/contents',
        kind: 'removed',
        severity: 'medium',
        category: 'permission',
        ruleId: 'permission.removed',
      },
    ],
  );
  assert.equal(report.summary.highestSeverity, 'high');
});
