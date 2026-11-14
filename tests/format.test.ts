import assert from 'node:assert/strict';
import test from 'node:test';
import { formatReport } from '../src/report.js';
import type { DiffReport } from '../src/types.js';

const report: DiffReport = { tool: 'policydiff', version: '0.1.0', generatedAt: 'now', before: 'before', after: 'after', summary: { filesCompared: 1, changes: 0, highestSeverity: 'info', bySeverity: { info: 0, low: 0, medium: 0, high: 0, critical: 0 } }, files: [{ path: 'empty.json', changes: [] }] };

test('formatReport emits deterministic SARIF results and preserves existing formats', () => {
  const withChange: DiffReport = { ...report, files: [{ path: 'policy.json', changes: [{ path: '/permissions/write', kind: 'changed', before: false, after: true, severity: 'high', category: 'permission', message: 'permission widened', ruleId: 'permission.widened' }] }] };
  const sarif = JSON.parse(formatReport(withChange, 'sarif'));
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].tool.driver.name, 'policydiff');
  assert.deepEqual(sarif.runs[0].results, [{ ruleId: 'permission.widened', level: 'error', message: { text: 'permission widened' }, locations: [{ physicalLocation: { artifactLocation: { uri: 'policy.json' }, region: { startLine: 1 } } }], partialFingerprints: { policydiffPath: '/permissions/write' } }]);
  assert.match(formatReport(withChange, 'json'), /\"summary\"/);
  assert.match(formatReport(withChange, 'text'), /permission widened/);
  assert.match(formatReport(withChange, 'markdown'), /permission widened/);
});

test('formatReport renders markdown heading and no-change files', () => {
  const output = formatReport(report, 'markdown');
  assert.match(output, /^# policydiff report/);
  assert.match(output, /- No changes\./);
});

test('formatReport URI-escapes SARIF artifact paths', () => {
  const withChange: DiffReport = { ...report, files: [{ path: 'dir name/policy#1?.json', changes: [{ path: '/x', kind: 'changed', before: false, after: true, severity: 'low', category: 'permission', message: 'changed', ruleId: 'test' }] }] };
  const sarif = JSON.parse(formatReport(withChange, 'sarif'));
  assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, 'dir%20name/policy%231%3F.json');
});
