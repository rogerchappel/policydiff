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
  assert.match(preparer, /process\.argv\[2\] \?\? process\.env\.GITHUB_REF_NAME/);
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

test('release grants exactly the permissions required to publish a GitHub release', () => {
  const permissionsBlock = workflow.match(/^permissions:\r?\n((?:  [^\r\n]+\r?\n)+)/m);
  assert.ok(permissionsBlock, 'release workflow must declare top-level permissions');

  const permissions = Object.fromEntries(
    permissionsBlock[1]
      .trimEnd()
      .split('\n')
      .map((line) => {
        const entry = line.match(/^  ([a-z-]+): (read|write|none)$/);
        assert.ok(entry, `invalid permission declaration: ${line}`);
        return [entry[1], entry[2]];
      }),
  );

  assert.deepEqual(permissions, {
    contents: 'write',
    'id-token': 'write',
  });
});

test('release installs npm 11.5.1 before dependency installation and publishing', () => {
  const installNpm = workflow.indexOf('npm install --global npm@11.5.1');
  const installDependencies = workflow.indexOf('run: npm ci');
  const release = workflow.indexOf('gh release create');

  assert.ok(installNpm >= 0, 'release must pin a trusted-publishing-compatible npm version');
  assert.ok(installDependencies > installNpm, 'npm must be upgraded before npm ci');
  assert.ok(release > installNpm, 'npm must be upgraded before publication');
});
