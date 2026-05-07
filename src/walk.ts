import { readdir, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { isSupportedPolicyFile } from './parser.js';

export interface FilePair { relativePath: string; beforePath?: string; afterPath?: string; }

async function listFiles(root: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const rootStat = await stat(root);
  if (rootStat.isFile()) {
    files.set(basename(root), root);
    return files;
  }
  async function walk(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && isSupportedPolicyFile(full)) files.set(relative(root, full), full);
    }
  }
  await walk(root);
  return files;
}

export async function pairInputs(before: string, after: string): Promise<FilePair[]> {
  const [left, right] = await Promise.all([listFiles(before), listFiles(after)]);
  const keys = [...new Set([...left.keys(), ...right.keys()])].sort();
  return keys.map((relativePath) => ({ relativePath, beforePath: left.get(relativePath), afterPath: right.get(relativePath) }));
}
