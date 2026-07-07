#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const requiredPaths = [
  'dist/src/cli.js',
  'dist/src/index.js',
  'demo/agent-policy-review.sh',
  'docs/tutorials/agent-policy-review.md',
  'examples/pr-comment-template.md',
  'fixtures/before/agent-policy.json',
  'fixtures/after/agent-policy.json',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md'
];

const missingLocalPaths = requiredPaths.filter((path) => !existsSync(path));
if (missingLocalPaths.length > 0) {
  console.error('Missing release files before pack:');
  for (const path of missingLocalPaths) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit']
});

const [pack] = JSON.parse(output);
const packedFiles = new Set(pack.files.map((file) => file.path));
const missingPackedPaths = requiredPaths.filter((path) => !packedFiles.has(path));

if (missingPackedPaths.length > 0) {
  console.error('Missing files from npm pack dry-run:');
  for (const path of missingPackedPaths) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

console.log(`Verified ${requiredPaths.length} required release files in ${pack.filename}.`);
