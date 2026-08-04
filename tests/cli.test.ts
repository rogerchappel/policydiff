import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('compare reports duplicate YAML keys as a file-specific CLI error', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-cli-'));
  const before = join(directory, 'before.yml');
  const after = join(directory, 'after.yml');
  await writeFile(before, 'permissions:\n  contents: read\n  contents: write\n');
  await writeFile(after, 'permissions:\n  contents: read\n');

  const result = spawnSync(process.execPath, ['dist/src/cli.js', 'compare', before, after], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, new RegExp(`^policydiff: ${before}:`));
  assert.match(result.stderr, /duplicated mapping key/i);
});

test('compare CLI treats differently named standalone files as one before/after pair', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-cli-'));
  const before = join(directory, 'policy.before.json');
  const after = join(directory, 'policy.after.json');
  await writeFile(before, '{"permissions":{"contents":"read"}}\n');
  await writeFile(after, '{"permissions":{"contents":"write"}}\n');

  const result = spawnSync(process.execPath, ['dist/src/cli.js', 'compare', before, after, '--format', 'json'], { encoding: 'utf8' });
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.equal(report.summary.filesCompared, 1);
  assert.equal(report.files.length, 1);
  assert.equal(report.files[0].path, 'policy.after.json');
  assert.deepEqual(
    report.files[0].changes.map(({ path, kind, before: oldValue, after: newValue }: { path: string; kind: string; before: unknown; after: unknown }) => ({ path, kind, before: oldValue, after: newValue })),
    [{ path: '/permissions/contents', kind: 'changed', before: 'read', after: 'write' }],
  );
});

test('compare CLI distinguishes classifier names from substring collisions', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-cli-'));
  const before = join(directory, 'before.json');
  const after = join(directory, 'after.json');
  await writeFile(before, JSON.stringify({ notrequired: true, privateer: 'old', requireApproval: true, accessToken: 'old' }));
  await writeFile(after, JSON.stringify({ notrequired: false, privateer: 'new', requireApproval: false, accessToken: 'new' }));

  const result = spawnSync(process.execPath, ['dist/src/cli.js', 'compare', before, after, '--format', 'json'], { encoding: 'utf8' });
  const report = JSON.parse(result.stdout);
  const rules = Object.fromEntries(report.files[0].changes.map(({ path, ruleId }: { path: string; ruleId: string }) => [path, ruleId]));

  assert.equal(result.status, 2);
  assert.deepEqual(rules, {
    '/accessToken': 'secret.path.changed',
    '/notrequired': 'generic.change',
    '/privateer': 'generic.change',
    '/requireApproval': 'guardrail.removed',
  });
});
