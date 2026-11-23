#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');
const unavailableRegistryInstall = 'npm install -g @rogerchappel/policydiff';
const requiredSourceCommands = [
  'git clone https://github.com/rogerchappel/policydiff.git',
  'npm ci',
  'npm run build',
  'npm link'
];

const errors = [];
const supportedNodeMajors = ['20', '22', '24'];
const ciWorkflow = readFileSync(fileURLToPath(new URL('../.github/workflows/ci.yml', import.meta.url)), 'utf8');
const matrixMatch = ciWorkflow.match(/node-version:\s*\[([^\]]+)\]/);
const ciNodeMajors = matrixMatch?.[1].match(/\d+/g) ?? [];
const readmeNodeMajors = readme.match(/Node\.js (\d+(?:, \d+)*(?:, or \d+)?)/)?.[1].match(/\d+/g) ?? [];

if (JSON.stringify(ciNodeMajors) !== JSON.stringify(supportedNodeMajors)) {
  errors.push(`CI Node.js matrix must be ${supportedNodeMajors.join(', ')}; found ${ciNodeMajors.join(', ') || 'none'}.`);
}
if (JSON.stringify(readmeNodeMajors) !== JSON.stringify(supportedNodeMajors)) {
  errors.push(`README must list the CI-tested Node.js majors: ${supportedNodeMajors.join(', ')}.`);
}

if (readme.includes(unavailableRegistryInstall)) {
  errors.push(`README advertises unavailable npm install: ${unavailableRegistryInstall}`);
}

for (const command of requiredSourceCommands) {
  if (!readme.includes(command)) {
    errors.push(`README source install is missing: ${command}`);
  }
}

if (!readme.includes('.tgz') || !readme.includes('GitHub Releases')) {
  errors.push('README must describe GitHub Release tarballs as the release distribution.');
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

console.log('Verified README source install and GitHub Release distribution instructions.');
