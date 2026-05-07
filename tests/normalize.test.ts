import assert from 'node:assert/strict';
import test from 'node:test';
import { stableStringify } from '../src/normalize.js';

test('stableStringify sorts object keys deeply', () => {
  assert.equal(stableStringify({ z: 1, a: { b: 2, a: 1 } }), '{\n  "a": {\n    "a": 1,\n    "b": 2\n  },\n  "z": 1\n}');
});
