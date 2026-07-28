#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')
);
const expectedRepository = 'https://github.com/rogerchappel/policydiff';
const result = spawnSync(
  'npm',
  ['view', packageJson.name, 'name', 'repository', '--json'],
  { encoding: 'utf8' }
);

if (result.status !== 0) {
  const errorOutput = `${result.stdout}\n${result.stderr}`;
  if (/\bE404\b|404 Not Found/.test(errorOutput)) {
    console.log(`Verified ${packageJson.name} is currently unclaimed on npm.`);
    process.exit(0);
  }

  process.stderr.write(errorOutput);
  console.error(`Unable to verify npm identity for ${packageJson.name}.`);
  process.exit(result.status ?? 1);
}

const registryPackage = JSON.parse(result.stdout);
const repository =
  typeof registryPackage.repository === 'string'
    ? registryPackage.repository
    : registryPackage.repository?.url;
const normalizedRepository = repository
  ?.replace(/^git\+/, '')
  .replace(/\.git$/, '')
  .replace(/\/$/, '');

if (
  registryPackage.name !== packageJson.name ||
  normalizedRepository !== expectedRepository
) {
  console.error(`npm identity collision for ${packageJson.name}.`);
  console.error(`Expected repository: ${expectedRepository}`);
  console.error(`Registry repository: ${repository ?? '(missing)'}`);
  process.exit(1);
}

console.log(`Verified ${packageJson.name} belongs to ${expectedRepository}.`);
