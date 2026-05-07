import { parsePolicyFile } from './parser.js';
import { pairInputs } from './walk.js';
import { diffValues } from './differ.js';
import { classifyChange } from './rules.js';
import { summarize } from './report.js';
import type { ComparedFile, DiffReport, JsonValue } from './types.js';

export async function compareInputs(before: string, after: string): Promise<DiffReport> {
  const pairs = await pairInputs(before, after);
  const files: ComparedFile[] = [];
  for (const pair of pairs) {
    const beforeValue: JsonValue | undefined = pair.beforePath ? await parsePolicyFile(pair.beforePath) : undefined;
    const afterValue: JsonValue | undefined = pair.afterPath ? await parsePolicyFile(pair.afterPath) : undefined;
    const changes = diffValues(beforeValue, afterValue).map(classifyChange);
    files.push({ path: pair.relativePath, beforePath: pair.beforePath, afterPath: pair.afterPath, changes });
  }
  return { tool: 'policydiff', version: '0.1.0', generatedAt: new Date().toISOString(), before, after, files, summary: summarize(files) };
}
