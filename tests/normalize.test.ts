import assert from 'node:assert/strict';
import test from 'node:test';
import { normalize, stableStringify } from '../src/normalize.js';

test('stableStringify sorts object keys deeply', () => {
  assert.equal(stableStringify({ z: 1, a: { b: 2, a: 1 } }), '{\n  "a": {\n    "a": 1,\n    "b": 2\n  },\n  "z": 1\n}');
});

test('normalize preserves __proto__ as an own JSON data property', () => {
  const input = JSON.parse('{"z":1,"__proto__":{"polluted":true},"a":2}');
  const result = normalize(input) as Record<string, unknown>;

  assert.equal(Object.hasOwn(result, '__proto__'), true);
  assert.deepEqual(result['__proto__'], { polluted: true });
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(stableStringify(input), '{\n  "__proto__": {\n    "polluted": true\n  },\n  "a": 2,\n  "z": 1\n}');
  assert.deepEqual(JSON.parse(stableStringify(input)), input);
});
