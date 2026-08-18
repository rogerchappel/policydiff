import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { explainReport, loadReport } from '../src/explain.js';
import type { DiffReport } from '../src/types.js';

test('explainReport includes reviewer notes', () => {
  const report: DiffReport = { tool: 'policydiff', version: '0.1.0', generatedAt: 'now', before: 'a', after: 'b', summary: { filesCompared: 1, changes: 1, highestSeverity: 'high', bySeverity: { info: 0, low: 0, medium: 0, high: 1, critical: 0 } }, files: [{ path: 'policy.json', changes: [{ path: '/tools/allow/1', kind: 'added', after: 'exec', severity: 'high', category: 'permission', message: 'Permission widened.', ruleId: 'permission.widened' }] }] };
  assert.match(explainReport(report, 'markdown'), /Reviewer notes/);
  assert.match(explainReport(report, 'markdown'), /policy\.json/);
});

const validReport: DiffReport = { tool: 'policydiff', version: '0.1.0', generatedAt: 'now', before: 'a', after: 'b', summary: { filesCompared: 1, changes: 1, highestSeverity: 'low', bySeverity: { info: 0, low: 1, medium: 0, high: 0, critical: 0 } }, files: [{ path: 'policy.json', changes: [{ path: '/enabled', kind: 'changed', before: false, after: true, severity: 'low', category: 'generic', message: 'changed value', ruleId: 'generic.change' }] }] };

test('loadReport accepts compare-shaped reports in every explain format', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-explain-'));
  const path = join(directory, 'report.json');
  await writeFile(path, JSON.stringify(validReport));
  const report = await loadReport(path);
  for (const format of ['text', 'markdown', 'json'] as const) assert.doesNotThrow(() => explainReport(report, format));
});

test('loadReport rejects malformed nested report fields with precise errors', async () => {
  const cases: Array<[string, unknown, RegExp]> = [
    ['summary', { ...validReport, summary: [] }, /summary must be an object/],
    ['file', { ...validReport, files: [null] }, /files\[0\] must be an object/],
    ['changes', { ...validReport, files: [{ path: 'x', changes: null }] }, /files\[0\]\.changes must be an array/],
    ['change kind', { ...validReport, files: [{ path: 'x', changes: [{ ...validReport.files[0].changes[0], kind: 'updated' }] }] }, /kind must be added, removed, or changed/],
    ['change severity', { ...validReport, files: [{ path: 'x', changes: [{ ...validReport.files[0].changes[0], severity: 'urgent' }] }] }, /severity must be a valid severity/],
    ['change message', { ...validReport, files: [{ path: 'x', changes: [{ ...validReport.files[0].changes[0], message: 42 }] }] }, /message must be a string/],
  ];
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-invalid-'));
  for (const [name, report, expected] of cases) {
    const path = join(directory, `${name.replaceAll(' ', '-')}.json`);
    await writeFile(path, JSON.stringify(report));
    await assert.rejects(loadReport(path), expected);
  }
});
