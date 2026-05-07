import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePolicyFile } from '../src/parser.js';

test('parsePolicyFile loads YAML fixtures', async () => {
  const value = await parsePolicyFile('fixtures/before/github-workflow.yml');
  assert.equal(typeof value, 'object');
  assert.match(JSON.stringify(value), /permissions/);
});
