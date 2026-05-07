import { readFile } from 'node:fs/promises';
import type { DiffReport } from './types.js';
import { formatReport } from './report.js';

export async function loadReport(path: string): Promise<DiffReport> {
  const value = JSON.parse(await readFile(path, 'utf8')) as DiffReport;
  if (value.tool !== 'policydiff' || !value.summary || !Array.isArray(value.files)) throw new Error(`${path} is not a policydiff JSON report`);
  return value;
}

export function explainReport(report: DiffReport, format: 'text' | 'markdown' | 'json' = 'text'): string {
  if (format === 'json') return `${JSON.stringify(report, null, 2)}\n`;
  const base = formatReport(report, format);
  const needsReview = report.files.flatMap((file) => file.changes.map((change) => ({ file: file.path, change }))).filter(({ change }) => ['medium', 'high', 'critical'].includes(change.severity));
  const heading = format === 'markdown' ? '## Reviewer notes' : 'Reviewer notes';
  const lines = ['', heading];
  if (needsReview.length === 0) lines.push(format === 'markdown' ? '- No medium-or-higher risk changes detected.' : 'No medium-or-higher risk changes detected.');
  for (const item of needsReview) lines.push(`${format === 'markdown' ? '-' : '•'} ${item.file} ${item.change.path}: ${item.change.message}`);
  return `${base}${lines.join('\n')}\n`;
}
