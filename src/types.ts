export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type ChangeKind = 'added' | 'removed' | 'changed';

export interface DiffChange {
  path: string;
  kind: ChangeKind;
  before?: JsonValue;
  after?: JsonValue;
  severity: Severity;
  category: string;
  message: string;
  ruleId: string;
}

export interface ComparedFile {
  path: string;
  beforePath?: string;
  afterPath?: string;
  changes: DiffChange[];
}

export interface Summary {
  filesCompared: number;
  changes: number;
  bySeverity: Record<Severity, number>;
  highestSeverity: Severity;
}

export interface DiffReport {
  tool: 'policydiff';
  version: string;
  generatedAt: string;
  before: string;
  after: string;
  summary: Summary;
  files: ComparedFile[];
}

export interface CompareOptions { format?: 'text' | 'markdown' | 'json'; output?: string; }
export interface ExplainOptions { format?: 'text' | 'markdown' | 'json'; output?: string; }
