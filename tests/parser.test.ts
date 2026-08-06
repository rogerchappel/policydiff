import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parsePolicyFile } from '../src/parser.js';

test('parsePolicyFile loads YAML fixtures', async () => {
  const value = await parsePolicyFile('fixtures/before/github-workflow.yml');
  assert.equal(typeof value, 'object');
  assert.match(JSON.stringify(value), /permissions/);
});

test('parsePolicyFile preserves unquoted YAML timestamps as strings', async () => {
  const path = await temporaryPolicy('timestamps.yml', 'expires: 2026-08-06\ncreated: 2026-08-06T12:35:00Z\n');

  assert.deepEqual(await parsePolicyFile(path), {
    created: '2026-08-06T12:35:00Z',
    expires: '2026-08-06',
  });
});

async function temporaryPolicy(name: string, contents: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'policydiff-parser-'));
  const path = join(directory, name);
  await writeFile(path, contents);
  return path;
}

test('parsePolicyFile rejects duplicate top-level YAML keys', async () => {
  const path = await temporaryPolicy('duplicate.yml', 'permissions: read\npermissions: write\n');

  await assert.rejects(parsePolicyFile(path), (error: Error) => {
    assert.match(error.message, new RegExp(`^${path}:`));
    assert.match(error.message, /duplicated mapping key/i);
    return true;
  });
});

test('parsePolicyFile rejects duplicate nested YAML keys', async () => {
  const path = await temporaryPolicy('nested.yaml', 'permissions:\n  contents: read\n  contents: write\n');

  await assert.rejects(parsePolicyFile(path), (error: Error) => {
    assert.match(error.message, new RegExp(`^${path}:`));
    assert.match(error.message, /duplicated mapping key/i);
    return true;
  });
});

test('parsePolicyFile preserves JSON duplicate-key behavior', async () => {
  const path = await temporaryPolicy('duplicate.json', '{"permissions":"read","permissions":"write"}');

  assert.deepEqual(await parsePolicyFile(path), { permissions: 'write' });
});
