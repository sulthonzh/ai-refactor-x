interface RefactorConfig {
    patterns?: string[];
    ignore?: string[];
    depth?: number;
    maxFiles?: number;
    outputFormat?: 'json' | 'markdown' | 'console';
    aiProvider?: 'openai' | 'anthropic' | 'local';
    apiKey?: string;
    model?: string;
}
interface CodeIssue {
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
interface RefactoringSuggestion {
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
interface FileChange {
    file: string;
    operation: 'replace' | 'insert' | 'delete';
    line: number;
    content: string;
    description: string;
}
interface AnalysisResult {
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
interface RefactorOptions {
    fix: boolean;
    interactive: boolean;
    backup: boolean;
    dryRun: boolean;
    output: string;
    verbose: boolean;
    yes: boolean;
}

declare class AIRefactor {
    private config;
    private analyzer;
    private fixer;
    private fileProcessor;
    private formatter;
    constructor(config?: RefactorConfig);
    /**
     * Analyze code in directory and return issues
     */
    analyze(path: string, config?: RefactorConfig): Promise<AnalysisResult>;
    /**
     * Apply refactoring fixes
     */
    refactor(path: string, options?: Partial<RefactorOptions>): Promise<AnalysisResult>;
    /**
     * Fix specific issues
     */
    fix(path: string, issues?: CodeIssue[]): Promise<AnalysisResult>;
    /**
     * Generate refactoring suggestions
     */
    suggest(path: string, issues?: CodeIssue[]): Promise<RefactoringSuggestion[]>;
    /**
     * Calculate summary statistics
     */
    private calculateSummary;
    /**
     * Create backup of directory
     */
    private createBackup;
    /**
     * Apply fixes to files
     */
    private applyFixes;
    /**
     * Generate report
     */
    generateReport(result: AnalysisResult, outputPath?: string): Promise<void>;
    /**
     * Format analysis result for console output
     */
    formatConsole(result: AnalysisResult): string;
    /**
     * Format result for Markdown output
     */
    formatMarkdown(result: AnalysisResult): string;
    /**
     * Format suggestions for output
     */
    formatSuggestions(suggestions: RefactoringSuggestion[]): string;
    /**
     * Format refactor result
     */
    formatRefactor(result: AnalysisResult): string;
    /**
     * Format fix result
     */
    formatFix(result: AnalysisResult): string;
    /**
     * Format info result
     */
    formatInfo(result: AnalysisResult): string;
    /**
     * Format verbose info
     */
    formatVerboseInfo(result: AnalysisResult): string;
}

declare const createRefactor: (config?: RefactorConfig) => AIRefactor;
declare const aiRefactor: AIRefactor;
declare const analyze: (path: string, config?: RefactorConfig) => Promise<AnalysisResult>;
declare const refactor: (path: string, options?: RefactorOptions) => Promise<AnalysisResult>;
declare const fix: (path: string, issues?: CodeIssue[]) => Promise<AnalysisResult>;
declare const suggest: (path: string, issues?: CodeIssue[]) => Promise<RefactoringSuggestion[]>;

export { AIRefactor, aiRefactor, analyze, createRefactor, fix, refactor, suggest };
