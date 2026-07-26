import assert from 'node:assert/strict';
import test from 'node:test';
import { diffValues } from '../src/differ.js';

test('diffValues reports added removed and changed paths', () => {
  const changes = diffValues({ a: 1, b: true }, { a: 2, c: 'new' });
  assert.deepEqual(changes.map((c) => [c.path, c.kind]), [['/a', 'changed'], ['/b', 'removed'], ['/c', 'added']]);
});

test('diffValues recursively reports leaves in wholly added and removed values', () => {
  assert.deepEqual(
    diffValues(undefined, { permissions: { contents: 'write' }, jobs: ['test'] }).map((change) => [change.path, change.kind]),
    [['/jobs/0', 'added'], ['/permissions/contents', 'added']],
  );
  assert.deepEqual(
    diffValues({ permissions: { contents: 'read' }, jobs: ['test'] }, undefined).map((change) => [change.path, change.kind]),
    [['/jobs/0', 'removed'], ['/permissions/contents', 'removed']],
  );
});

test('diffValues treats scalar permission arrays as unordered multisets', () => {
  assert.deepEqual(
    diffValues(
      { tools: { allow: ['read', 'write'] } },
      { tools: { allow: ['write', 'read'] } },
    ),
    [],
  );

  assert.deepEqual(
    diffValues(
      { roles: ['reader', 'reader', 'writer'] },
      { roles: ['writer', 'reader'] },
    ).map((change) => [change.path, change.kind, change.before, change.after]),
    [['/roles/1', 'removed', 'reader', undefined]],
  );
});

test('diffValues gives permission additions and removals deterministic paths', () => {
  const changes = diffValues(
    { tools: { allowed: ['write', 'read'] } },
    { tools: { allowed: ['admin', 'read'] } },
  );
  assert.deepEqual(
    changes.map((change) => [change.path, change.kind, change.before, change.after]),
    [
      ['/tools/allowed/1', 'removed', 'write', undefined],
      ['/tools/allowed/0', 'added', undefined, 'admin'],
    ],
  );
});

test('diffValues keeps order-sensitive and mixed arrays positional', () => {
  assert.deepEqual(
    diffValues({ steps: ['build', 'test'] }, { steps: ['test', 'build'] }).map((change) => change.path),
    ['/steps/0', '/steps/1'],
  );
  assert.deepEqual(
    diffValues({ allow: ['read', { name: 'write' }] }, { allow: [{ name: 'write' }, 'read'] }).map((change) => change.path),
    ['/allow/0', '/allow/1'],
  );
});
