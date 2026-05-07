import assert from 'node:assert/strict';
import test from 'node:test';
import { diffValues } from '../src/differ.js';

test('diffValues reports added removed and changed paths', () => {
  const changes = diffValues({ a: 1, b: true }, { a: 2, c: 'new' });
  assert.deepEqual(changes.map((c) => [c.path, c.kind]), [['/a', 'changed'], ['/b', 'removed'], ['/c', 'added']]);
});
