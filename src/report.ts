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

export function formatReport(report: DiffReport, format: 'text' | 'markdown' | 'json' | 'sarif' = 'text'): string {
  if (format === 'sarif') return formatSarif(report);
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

/** Serialize changes as SARIF 2.1.0 results for code-scanning consumers. */
export function formatSarif(report: DiffReport): string {
  const rules = new Map<string, { id: string; name: string }>();
  const results = report.files.flatMap((file) => file.changes.map((change) => {
    if (!rules.has(change.ruleId)) rules.set(change.ruleId, { id: change.ruleId, name: change.category });
    const level = change.severity === 'critical' || change.severity === 'high' ? 'error'
      : change.severity === 'medium' ? 'warning' : 'note';
    return {
      ruleId: change.ruleId,
      level,
      message: { text: change.message },
      locations: [{ physicalLocation: { artifactLocation: { uri: file.path }, region: { startLine: 1 } } }],
      partialFingerprints: { policydiffPath: change.path },
    };
  }));
  return `${JSON.stringify({
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: { driver: { name: 'policydiff', semanticVersion: report.version, rules: [...rules.values()] } },
      results,
    }],
  }, null, 2)}\n`;
}
