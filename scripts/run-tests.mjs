import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = fileURLToPath(new URL('../dist/tests/', import.meta.url));

async function collectTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTests(path);
    return entry.isFile() && entry.name.endsWith('.test.js') ? [path] : [];
  }));
  return files.flat().sort();
}

const tests = await collectTests(testDirectory);
if (tests.length === 0) {
  console.error(`No compiled tests found in ${testDirectory}`);
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
