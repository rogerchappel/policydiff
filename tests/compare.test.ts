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
