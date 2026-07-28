#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

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

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'policydiff-package-smoke-'));

try {
  const output = execFileSync('npm', ['pack', '--json', '--pack-destination', temporaryDirectory], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });

  const [pack] = JSON.parse(output);
  const packedFiles = new Set(pack.files.map((file) => file.path));
  const missingPackedPaths = requiredPaths.filter((path) => !packedFiles.has(path));

  if (missingPackedPaths.length > 0) {
    console.error('Missing files from npm package:');
    for (const path of missingPackedPaths) {
      console.error(`- ${path}`);
    }
    process.exitCode = 1;
  } else {
    const installPrefix = join(temporaryDirectory, 'install');
    const tarball = join(temporaryDirectory, pack.filename);
    execFileSync('npm', ['install', '--ignore-scripts', '--prefix', installPrefix, tarball], {
      stdio: 'inherit'
    });

    const binary = join(installPrefix, 'node_modules', '.bin', 'policydiff');
    const version = execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim();
    if (version !== packageJson.version) {
      throw new Error(`Packed binary reported version ${version}; expected ${packageJson.version}.`);
    }

    const help = execFileSync(binary, ['--help'], { encoding: 'utf8' });
    if (!help.includes('compare') || !help.includes('explain')) {
      throw new Error('Packed binary help is missing the expected commands.');
    }

    console.log(
      `Verified ${requiredPaths.length} release files and policydiff ${version} in ${pack.filename}.`
    );
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
