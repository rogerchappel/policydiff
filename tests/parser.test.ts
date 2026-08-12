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

test('parsePolicyFile expands repeated YAML mapping aliases into independent normalized values', async () => {
  const path = await temporaryPolicy(
    'mapping-aliases.yml',
    'defaults: &defaults\n  retries: 3\n  permissions:\n    contents: read\nfirst: *defaults\nsecond: *defaults\n',
  );

  const value = await parsePolicyFile(path);
  assert.deepEqual(value, {
    defaults: { permissions: { contents: 'read' }, retries: 3 },
    first: { permissions: { contents: 'read' }, retries: 3 },
    second: { permissions: { contents: 'read' }, retries: 3 },
  });
  assert.notEqual((value as Record<string, unknown>).defaults, (value as Record<string, unknown>).first);
  assert.notEqual((value as Record<string, unknown>).first, (value as Record<string, unknown>).second);
});

test('parsePolicyFile expands repeated YAML sequence aliases', async () => {
  const path = await temporaryPolicy('sequence-aliases.yml', 'roles: &roles\n  - reader\n  - auditor\nprimary: *roles\nbackup: *roles\n');

  assert.deepEqual(await parsePolicyFile(path), {
    backup: ['reader', 'auditor'],
    primary: ['reader', 'auditor'],
    roles: ['reader', 'auditor'],
  });
});

test('parsePolicyFile rejects cyclic YAML aliases', async () => {
  const path = await temporaryPolicy('cyclic-alias.yml', 'loop: &loop\n  - *loop\n');

  await assert.rejects(parsePolicyFile(path), (error: Error) => {
    assert.equal(error.message, `${path}: circular value at $.loop[0]`);
    return true;
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
