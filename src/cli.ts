#!/usr/bin/env node
import { Command } from 'commander';
import { compareInputs } from './compare.js';
import { loadReport, explainReport } from './explain.js';
import { emit, formatReport } from './report.js';

const program = new Command();
program.name('policydiff').description('Explain risky JSON/YAML policy and config diffs.').version('0.1.0');

program.command('compare')
  .description('Compare JSON/YAML files or directories')
  .argument('<before>', 'before file or directory')
  .argument('<after>', 'after file or directory')
  .option('-f, --format <format>', 'text, markdown, or json', 'text')
  .option('-o, --output <path>', 'write report to a file')
  .action(async (before: string, after: string, options: { format: string; output?: string }) => {
    const format = parseFormat(options.format);
    const report = await compareInputs(before, after);
    await emit(formatReport(report, format), options.output);
    process.exitCode = report.summary.bySeverity.critical > 0 ? 2 : 0;
  });

program.command('explain')
  .description('Explain a policydiff JSON report')
  .argument('<report>', 'JSON report from compare --format json')
  .option('-f, --format <format>', 'text, markdown, or json', 'text')
  .option('-o, --output <path>', 'write explanation to a file')
  .action(async (reportPath: string, options: { format: string; output?: string }) => {
    const report = await loadReport(reportPath);
    await emit(explainReport(report, parseFormat(options.format)), options.output);
  });

function parseFormat(value: string): 'text' | 'markdown' | 'json' {
  if (value === 'text' || value === 'markdown' || value === 'json') return value;
  throw new Error(`Unsupported format ${value}; expected text, markdown, or json`);
}

program.parseAsync(process.argv).catch((error: unknown) => {
  if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
    console.error(`policydiff: file or directory not found: ${(error as NodeJS.ErrnoException).path ?? (error as Error).message}`);
  } else if (error instanceof Error) {
    console.error(`policydiff: ${error.message}`);
  } else {
    console.error(`policydiff: ${String(error)}`);
  }
  process.exit(1);
});
