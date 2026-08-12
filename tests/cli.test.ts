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

test('compare CLI accepts repeated mapping aliases', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-cli-aliases-'));
  const before = join(directory, 'before.yml');
  const after = join(directory, 'after.yml');
  await writeFile(before, 'defaults: &defaults\n  contents: read\nfirst: *defaults\nsecond: *defaults\n');
  await writeFile(after, 'defaults: &defaults\n  contents: write\nfirst: *defaults\nsecond: *defaults\n');

  const result = spawnSync(process.execPath, ['dist/src/cli.js', 'compare', before, after, '--format', 'json'], { encoding: 'utf8' });
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.deepEqual(report.files[0].changes.map(({ path }: { path: string }) => path), [
    '/defaults/contents',
    '/first/contents',
    '/second/contents',
  ]);
});

test('compare CLI accepts repeated sequence aliases', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-cli-aliases-'));
  const before = join(directory, 'before.yml');
  const after = join(directory, 'after.yml');
  await writeFile(before, 'roles: &roles\n  - reader\nprimary: *roles\nbackup: *roles\n');
  await writeFile(after, 'roles: &roles\n  - reader\n  - auditor\nprimary: *roles\nbackup: *roles\n');

  const result = spawnSync(process.execPath, ['dist/src/cli.js', 'compare', before, after, '--format', 'json'], { encoding: 'utf8' });
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.deepEqual(report.files[0].changes.map(({ path }: { path: string }) => path), ['/backup/1', '/primary/1', '/roles/0']);
});

test('compare CLI reports cyclic aliases as a file-specific error', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-cli-aliases-'));
  const before = join(directory, 'before.yml');
  const after = join(directory, 'after.yml');
  await writeFile(before, 'loop: &loop\n  - *loop\n');
  await writeFile(after, 'loop: []\n');

  const result = spawnSync(process.execPath, ['dist/src/cli.js', 'compare', before, after], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.equal(result.stderr, `policydiff: ${before}: circular value at $.loop[0]\n`);
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

test('compare CLI reports changes between unquoted YAML dates', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-cli-dates-'));
  const before = join(directory, 'before.yml');
  const after = join(directory, 'after.yml');
  await writeFile(before, 'expires: 2026-08-06\n');
  await writeFile(after, 'expires: 2026-08-07\n');

  const result = spawnSync(process.execPath, ['dist/src/cli.js', 'compare', before, after, '--format', 'json'], { encoding: 'utf8' });
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, 0);
  assert.deepEqual(report.files[0].changes, [
    {
      path: '/expires',
      kind: 'changed',
      before: '2026-08-06',
      after: '2026-08-07',
      severity: 'low',
      category: 'generic',
      ruleId: 'generic.change',
      message: 'changed value at /expires',
    },
  ]);
  assert.equal(report.summary.changes, 1);
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
