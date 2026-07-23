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
