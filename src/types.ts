export interface RefactorConfig {
  patterns?: string[];
  ignore?: string[];
  depth?: number;
  maxFiles?: number;
  outputFormat?: 'json' | 'markdown' | 'console';
  aiProvider?: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
}

export interface CodeIssue {
  type: 'comprehension' | 'architectural' | 'verification';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  file: string;
  line: number;
  column: number;
  codeSnippet: string;
  suggestion?: string;
  fixable: boolean;
  estimatedTime?: string;
  confidence: number;
}

export interface RefactoringSuggestion {
  id: string;
  issue: CodeIssue;
  beforeCode: string;
  afterCode: string;
  explanation: string;
  changes: FileChange[];
  confidence: number;
  estimatedSavings: {
    lines: number;
    characters: number;
    percentage: number;
  };
}

export interface FileChange {
  file: string;
  operation: 'replace' | 'insert' | 'delete';
  line: number;
  content: string;
  description: string;
}

export interface AnalysisResult {
  files: string[];
  totalFiles: number;
  issues: CodeIssue[];
  suggestions: RefactoringSuggestion[];
  summary: {
    totalIssues: number;
    fixableIssues: number;
    criticalIssues: number;
    estimatedSavings: {
      lines: number;
      characters: number;
      percentage: number;
    };
    estimatedTime: string;
  };
  warnings: string[];
  errors: string[];
}

export interface RefactorOptions {
  fix: boolean;
  interactive: boolean;
  backup: boolean;
  dryRun: boolean;
  output: string;
  verbose: boolean;
  yes: boolean;
}

export interface AIClient {
  analyzeCode(code: string, context?: string): Promise<CodeIssue[]>;
  generateFix(issue: CodeIssue, context: string): Promise<RefactoringSuggestion>;
  estimateSavings(suggestions: RefactoringSuggestion[]): Promise<{
    lines: number;
    characters: number;
    percentage: number;
  }>;
}

export interface PatternMatch {
  file: string;
  matches: RegExpMatch[];
  type: 'code' | 'comment' | 'string';
}

export interface RegExpMatch {
  pattern: string;
  match: string;
  line: number;
  column: number;
  context: string;
}