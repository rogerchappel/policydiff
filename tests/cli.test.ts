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
