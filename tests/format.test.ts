import assert from 'node:assert/strict';
import test from 'node:test';
import { formatReport } from '../src/report.js';
import type { DiffReport } from '../src/types.js';

const report: DiffReport = { tool: 'policydiff', version: '0.1.0', generatedAt: 'now', before: 'before', after: 'after', summary: { filesCompared: 1, changes: 0, highestSeverity: 'info', bySeverity: { info: 0, low: 0, medium: 0, high: 0, critical: 0 } }, files: [{ path: 'empty.json', changes: [] }] };

test('formatReport renders markdown heading and no-change files', () => {
  const output = formatReport(report, 'markdown');
  assert.match(output, /^# policydiff report/);
  assert.match(output, /- No changes\./);
});
