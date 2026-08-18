import { readFile } from 'node:fs/promises';
import type { DiffReport } from './types.js';
import { formatReport } from './report.js';

const severities = ['info', 'low', 'medium', 'high', 'critical'] as const;
const changeKinds = ['added', 'removed', 'changed'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): void {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
}

function requireNonNegativeInteger(value: unknown, field: string): void {
  if (!Number.isInteger(value) || (value as number) < 0) throw new Error(`${field} must be a non-negative integer`);
}

function validateReport(value: unknown): asserts value is DiffReport {
  if (!isRecord(value) || value.tool !== 'policydiff') throw new Error('is not a policydiff JSON report');
  for (const field of ['version', 'generatedAt', 'before', 'after']) requireString(value[field], field);
  if (!isRecord(value.summary)) throw new Error('summary must be an object');
  requireNonNegativeInteger(value.summary.filesCompared, 'summary.filesCompared');
  requireNonNegativeInteger(value.summary.changes, 'summary.changes');
  if (!severities.includes(value.summary.highestSeverity as typeof severities[number])) throw new Error('summary.highestSeverity must be a valid severity');
  if (!isRecord(value.summary.bySeverity)) throw new Error('summary.bySeverity must be an object');
  for (const severity of severities) requireNonNegativeInteger(value.summary.bySeverity[severity], `summary.bySeverity.${severity}`);
  if (!Array.isArray(value.files)) throw new Error('files must be an array');
  value.files.forEach((file, fileIndex) => {
    const fileField = `files[${fileIndex}]`;
    if (!isRecord(file)) throw new Error(`${fileField} must be an object`);
    requireString(file.path, `${fileField}.path`);
    if (!Array.isArray(file.changes)) throw new Error(`${fileField}.changes must be an array`);
    file.changes.forEach((change, changeIndex) => {
      const changeField = `${fileField}.changes[${changeIndex}]`;
      if (!isRecord(change)) throw new Error(`${changeField} must be an object`);
      requireString(change.path, `${changeField}.path`);
      if (!changeKinds.includes(change.kind as typeof changeKinds[number])) throw new Error(`${changeField}.kind must be added, removed, or changed`);
      if (!severities.includes(change.severity as typeof severities[number])) throw new Error(`${changeField}.severity must be a valid severity`);
      for (const field of ['category', 'message', 'ruleId']) requireString(change[field], `${changeField}.${field}`);
    });
  });
}

export async function loadReport(path: string): Promise<DiffReport> {
  const value: unknown = JSON.parse(await readFile(path, 'utf8'));
  try {
    validateReport(value);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'is not a policydiff JSON report';
    throw new Error(detail === 'is not a policydiff JSON report' ? `${path} ${detail}` : `${path}: ${detail}`);
  }
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
