import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pairInputs } from '../src/walk.js';

test('pairInputs rejects unsupported standalone files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-walk-'));
  const before = join(directory, 'before.txt');
  const after = join(directory, 'after.txt');
  await Promise.all([writeFile(before, 'before\n'), writeFile(after, 'after\n')]);

  await assert.rejects(pairInputs(before, after), { message: `Unsupported policy file: ${before}; expected .json, .yaml, or .yml` });
});

for (const contents of ['unsupported', 'empty'] as const) {
  test(`pairInputs rejects ${contents}-only directories`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'policydiff-walk-'));
    const before = join(directory, 'before');
    const after = join(directory, 'after');
    await Promise.all([mkdir(before), mkdir(after)]);
    if (contents === 'unsupported') {
      await Promise.all([
        writeFile(join(before, 'readme.txt'), 'before\n'),
        writeFile(join(after, 'readme.txt'), 'after\n'),
      ]);
    }

    await assert.rejects(pairInputs(before, after), /No supported policy files found; expected JSON or YAML inputs/);
  });
}

test('pairInputs retains supported files while ignoring adjacent unsupported files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-walk-'));
  const before = join(directory, 'before');
  const after = join(directory, 'after');
  await Promise.all([mkdir(before), mkdir(after)]);
  await Promise.all([
    writeFile(join(before, 'policy.json'), '{}\n'),
    writeFile(join(after, 'policy.json'), '{}\n'),
    writeFile(join(before, 'readme.txt'), 'before\n'),
    writeFile(join(after, 'readme.txt'), 'after\n'),
  ]);

  assert.deepEqual(await pairInputs(before, after), [{
    relativePath: 'policy.json',
    beforePath: join(before, 'policy.json'),
    afterPath: join(after, 'policy.json'),
  }]);
});
