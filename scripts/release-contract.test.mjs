import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const preparer = readFileSync(new URL('./prepare-release-artifact.mjs', import.meta.url), 'utf8');

test('release validates the tag before creating any release side effect', () => {
  const prepare = workflow.indexOf('id: package');
  const release = workflow.indexOf('gh release create');
  assert.ok(prepare >= 0 && release > prepare);
  assert.match(workflow, /node scripts\/prepare-release-artifact\.mjs/);
  assert.match(preparer, /tag !== expectedTag/);
});

test('release requires one exact npm pack artifact', () => {
  assert.match(preparer, /\['pack', '--json'\]/);
  assert.match(preparer, /artifacts\.length !== 1/);
  assert.match(preparer, /filename !== expectedFilename/);
});

test('release hands the validated artifact path to GitHub', () => {
  assert.match(workflow, /steps\.package\.outputs\.artifact/);
  assert.doesNotMatch(workflow, /\*\.tgz/);
});
