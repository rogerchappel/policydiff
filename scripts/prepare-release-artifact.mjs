#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tag = process.env.GITHUB_REF_NAME ?? process.argv[2];
const expectedTag = `v${packageJson.version}`;

if (tag !== expectedTag) {
  console.error(`Release tag mismatch: expected ${expectedTag}, received ${tag ?? '(missing)'}.`);
  process.exit(1);
}

const packed = spawnSync('npm', ['pack', '--json'], { encoding: 'utf8' });
if (packed.status !== 0) {
  process.stderr.write(packed.stderr || packed.stdout);
  process.exit(packed.status ?? 1);
}

let artifacts;
try {
  artifacts = JSON.parse(packed.stdout);
} catch {
  console.error('npm pack did not return valid JSON.');
  process.exit(1);
}

const scope = packageJson.name.startsWith('@') ? packageJson.name.slice(1).replace('/', '-') : packageJson.name;
const expectedFilename = `${scope}-${packageJson.version}.tgz`;
if (artifacts.length !== 1 || artifacts[0]?.filename !== expectedFilename) {
  console.error(`Expected exactly one npm artifact named ${expectedFilename}.`);
  console.error(`Received: ${artifacts.map((item) => item?.filename).join(', ') || '(none)'}`);
  process.exit(1);
}

const artifact = resolve(expectedFilename);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `artifact=${artifact}\n`);
console.log(artifact);
