import { writeFile } from 'node:fs/promises';
import type { ComparedFile, DiffReport, Severity } from './types.js';
import { maxSeverity, severities } from './rules.js';
import { toDisplay } from './normalize.js';

export function summarize(files: ComparedFile[]): DiffReport['summary'] {
  const bySeverity = Object.fromEntries(severities.map((s) => [s, 0])) as Record<Severity, number>;
  let highestSeverity: Severity = 'info';
  let changes = 0;
  for (const file of files) for (const change of file.changes) { changes += 1; bySeverity[change.severity] += 1; highestSeverity = maxSeverity(highestSeverity, change.severity); }
  return { filesCompared: files.length, changes, bySeverity, highestSeverity };
}

export function formatReport(report: DiffReport, format: 'text' | 'markdown' | 'json' = 'text'): string {
  if (format === 'json') return `${JSON.stringify(report, null, 2)}\n`;
  const md = format === 'markdown';
  const lines: string[] = [];
  lines.push(md ? `# policydiff report` : `policydiff report`);
  lines.push(`Before: ${report.before}`);
  lines.push(`After: ${report.after}`);
  lines.push(`Summary: ${report.summary.changes} change(s), highest severity ${report.summary.highestSeverity}`);
  lines.push(`Severities: ${Object.entries(report.summary.bySeverity).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  for (const file of report.files) {
    lines.push('', md ? `## ${file.path}` : `File: ${file.path}`);
    if (file.changes.length === 0) { lines.push(md ? '- No changes.' : '  No changes.'); continue; }
    for (const c of file.changes) {
      const bullet = md ? '-' : '•';
      lines.push(`${bullet} [${c.severity}] ${c.path} ${c.kind}: ${c.message} (${c.ruleId})`);
      if (c.kind === 'changed') lines.push(`  ${md ? '  ' : ''}before=${toDisplay(c.before)} after=${toDisplay(c.after)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export async function emit(content: string, output?: string): Promise<void> {
  if (output) await writeFile(output, content, 'utf8');
  else process.stdout.write(content);
}
