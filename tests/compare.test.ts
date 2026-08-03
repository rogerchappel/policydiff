import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

for (const [beforeName, afterName] of [
  ['policy.json', 'policy.json'],
  ['policy.before.json', 'policy.after.yml'],
] as const) {
  test(`compareInputs pairs standalone files named ${beforeName} and ${afterName}`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'policydiff-compare-'));
    const beforeDirectory = join(directory, 'before');
    const afterDirectory = join(directory, 'after');
    await Promise.all([mkdir(beforeDirectory), mkdir(afterDirectory)]);
    const before = join(beforeDirectory, beforeName);
    const after = join(afterDirectory, afterName);
    await writeFile(before, '{"permissions":{"contents":"read"}}\n');
    await writeFile(after, afterName.endsWith('.json')
      ? '{"permissions":{"contents":"write"}}\n'
      : 'permissions:\n  contents: write\n');

    const report = await compareInputs(before, after);

    assert.equal(report.summary.filesCompared, 1);
    assert.equal(report.files.length, 1);
    assert.equal(report.files[0]?.path, afterName);
    assert.deepEqual(
      report.files[0]?.changes.map(({ path, kind, before: oldValue, after: newValue }) => ({ path, kind, before: oldValue, after: newValue })),
      [{ path: '/permissions/contents', kind: 'changed', before: 'read', after: 'write' }],
    );
  });
}
