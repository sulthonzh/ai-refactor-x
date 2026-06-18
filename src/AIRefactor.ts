import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AIAnalyzer } from './AIAnalyzer.js';
import { AIFixer } from './AIFixer.js';
import { FileProcessor } from './FileProcessor.js';
import { OutputFormatter } from './OutputFormatter.js';
import type {
  RefactorConfig,
  AnalysisResult,
  RefactorOptions,
  CodeIssue,
  RefactoringSuggestion
} from './types.js';

const execAsync = promisify(exec);

export class AIRefactor {
  private config: RefactorConfig;
  private analyzer: AIAnalyzer;
  private fixer: AIFixer;
  private fileProcessor: FileProcessor;
  private formatter: OutputFormatter;

  constructor(config: RefactorConfig = {}) {
    this.config = {
      patterns: ['**/*.{js,ts,jsx,tsx}'],
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
      depth: 10,
      maxFiles: 1000,
      outputFormat: 'console',
      aiProvider: 'openai',
      model: 'gpt-4',
      ...config
    };

    this.analyzer = new AIAnalyzer(this.config);
    this.fixer = new AIFixer(this.config);
    this.fileProcessor = new FileProcessor(this.config);
    this.formatter = new OutputFormatter(this.config);
  }

  /**
   * Analyze code in directory and return issues
   */
  async analyze(path: string, config?: RefactorConfig): Promise<AnalysisResult> {
    const finalConfig = { ...this.config, ...config };
    
    // Check if path exists
    try {
      await stat(path);
    } catch {
      throw new Error(`Analysis failed: Path '${path}' does not exist`);
    }
    
    // Find all relevant files
    const files = await this.fileProcessor.findFiles(path);
    
    // Process each file
    const issues: CodeIssue[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    
    for (const file of files) {
      try {
        const fileIssues = await this.analyzer.analyzeFile(file);
        issues.push(...fileIssues);
      } catch (error) {
        const message = `Error analyzing ${file}: ${(error as Error).message}`;
        errors.push(message);
        warnings.push(`Skipped ${file} due to error`);
      }
    }

    // Generate suggestions for fixable issues
    const suggestions: RefactoringSuggestion[] = [];
    const fixableIssues = issues.filter(issue => issue.fixable);
    
    for (const issue of fixableIssues) {
      try {
        const suggestion = await this.fixer.generateSuggestion(issue, path);
        suggestions.push(suggestion);
      } catch (error) {
        warnings.push(`Could not generate fix for ${issue.title}: ${(error as Error).message}`);
      }
    }

    // Calculate summary
    const summary = this.calculateSummary(issues, suggestions);

    return {
      files,
      totalFiles: files.length,
      issues,
      suggestions,
      summary,
      warnings,
      errors
    };
  }

  /**
   * Apply refactoring fixes
   */
  async refactor(path: string, options: Partial<RefactorOptions> = {}): Promise<AnalysisResult> {
    const finalOptions: RefactorOptions = {
      fix: false,
      interactive: true,
      backup: true,
      dryRun: false,
      output: '',
      verbose: false,
      yes: false,
      ...options
    };

    // First analyze the code
    const result = await this.analyze(path);
    
    if (finalOptions.dryRun) {
      return result;
    }

    // Create backup if requested
    if (finalOptions.backup) {
      await this.createBackup(path);
    }

    // Apply fixes
    if (finalOptions.fix) {
      await this.applyFixes(result.suggestions, finalOptions);
    }

    return result;
  }

  /**
   * Fix specific issues
   */
  async fix(path: string, issues?: CodeIssue[]): Promise<AnalysisResult> {
    if (!issues) {
      const analysis = await this.analyze(path);
      issues = analysis.issues.filter(issue => issue.fixable);
    }

    const result: AnalysisResult = {
      files: [],
      totalFiles: 0,
      issues,
      suggestions: [],
      summary: this.calculateSummary(issues, []),
      warnings: [],
      errors: []
    };

    // Apply fixes
    await this.applyFixes(result.suggestions, { fix: true, backup: true, dryRun: false, verbose: true, interactive: false, output: '', yes: true });

    return result;
  }

  /**
   * Generate refactoring suggestions
   */
  async suggest(path: string, issues?: CodeIssue[]): Promise<RefactoringSuggestion[]> {
    if (!issues) {
      const analysis = await this.analyze(path);
      issues = analysis.issues.filter(issue => issue.fixable);
    }

    const suggestions: RefactoringSuggestion[] = [];
    
    for (const issue of issues) {
      try {
        const suggestion = await this.fixer.generateSuggestion(issue, path);
        suggestions.push(suggestion);
      } catch (error) {
        console.warn(`Could not generate suggestion for ${issue.title}: ${(error as Error).message}`);
      }
    }

    return suggestions;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(issues: CodeIssue[], suggestions: RefactoringSuggestion[]) {
    const totalIssues = issues.length;
    const fixableIssues = issues.filter(issue => issue.fixable).length;
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    
    const totalLinesChanged = suggestions.reduce((sum, suggestion) => sum + suggestion.estimatedSavings.lines, 0);
    const totalCharactersChanged = suggestions.reduce((sum, suggestion) => sum + suggestion.estimatedSavings.characters, 0);
    
    // Estimate time based on complexity
    const estimatedMinutes = Math.ceil((totalIssues * 2) + (suggestions.length * 5));
    const estimatedTime = `${estimatedMinutes} minute${estimatedMinutes !== 1 ? 's' : ''}`;

    return {
      totalIssues,
      fixableIssues,
      criticalIssues,
      estimatedSavings: {
        lines: totalLinesChanged,
        characters: totalCharactersChanged,
        percentage: totalIssues > 0 ? Math.round((fixableIssues / totalIssues) * 100) : 0
      },
      estimatedTime
    };
  }

  /**
   * Create backup of directory
   */
  private async createBackup(path: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${path}.backup.${timestamp}`;
    
    try {
      await execAsync(`cp -r "${path}" "${backupPath}"`);
      console.log(`Backup created: ${backupPath}`);
    } catch (error) {
      console.warn(`Could not create backup: ${(error as Error).message}`);
    }
  }

  /**
   * Apply fixes to files
   */
  private async applyFixes(suggestions: RefactoringSuggestion[], options: RefactorOptions): Promise<void> {
    for (const suggestion of suggestions) {
      try {
        await this.fixer.applySuggestion(suggestion, options);
        
        if (options.verbose) {
          console.log(`✓ Applied fix for: ${suggestion.issue.title}`);
          console.log(`  ${suggestion.explanation}`);
          console.log(`  Saved ~${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)`);
        }
      } catch (error) {
        console.error(`✗ Failed to apply fix for ${suggestion.issue.title}: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Generate report
   */
  async generateReport(result: AnalysisResult, outputPath?: string): Promise<void> {
    const report = this.formatter.formatReport(result);
    
    if (outputPath) {
      await writeFile(outputPath, report);
      console.log(`Report saved to: ${outputPath}`);
    } else {
      console.log(report);
    }
  }

  /**
   * Format analysis result for console output
   */
  formatConsole(result: AnalysisResult): string {
    let output = '🤖 AI Refactor Analysis Report\n';
    output += '==================================================\n\n';
    
    // Summary
    output += '📊 Summary\n';
    output += '--------------------\n';
    output += `Files analyzed: ${result.totalFiles}\n`;
    output += `Total issues: ${result.summary.totalIssues}\n`;
    output += `Fixable issues: ${result.summary.fixableIssues}\n`;
    output += `Critical issues: ${result.summary.criticalIssues}\n`;
    output += `Estimated time: ${result.summary.estimatedTime}\n`;
    output += `Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)\n\n`;
    
    // Issues by severity
    output += '🔍 Issues by Severity\n';
    const severityCount = { critical: 0, high: 0, medium: 0, low: 0 };
    result.issues.forEach(issue => {
      severityCount[issue.severity]++;
    });
    
    const severityEmojis = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    Object.entries(severityCount).forEach(([severity, count]) => {
      if (count > 0) {
        output += `${severityEmojis[severity as keyof typeof severityEmojis]} ${severity.toUpperCase()}: ${count} issues\n`;
      }
    });
    
    return output;
  }

  /**
   * Format result for Markdown output
   */
  formatMarkdown(result: AnalysisResult): string {
    let output = '# AI Refactor Analysis Report\n\n';
    output += `**Generated:** ${new Date().toISOString()}\n`;
    output += `**Files Analyzed:** ${result.totalFiles}\n\n`;
    
    // Summary
    output += '## Summary\n\n';
    output += '| Metric | Value |\n';
    output += '|--------|-------|\n';
    output += `| Total Issues | ${result.summary.totalIssues} |\n`;
    output += `| Fixable Issues | ${result.summary.fixableIssues} |\n`;
    output += `| Critical Issues | ${result.summary.criticalIssues} |\n`;
    output += `| Estimated Savings | ${result.summary.estimatedSavings.lines} lines |\n`;
    output += `| Estimated Time | ${result.summary.estimatedTime} |\n`;
    output += `| Savings Percentage | ${result.summary.estimatedSavings.percentage}% |\n\n`;
    
    // Issues found
    output += '## Issues Found\n\n';
    output += '| Severity | Category | File | Line | Description |\n';
    output += '|----------|----------|------|------|-------------|\n';
    
    result.issues.slice(0, 10).forEach(issue => {
      const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[issue.severity];
      output += `| ${severityEmoji} | ${issue.category} | ${issue.file} | ${issue.line} | ${issue.title} |\n`;
    });
    
    if (result.issues.length > 10) {
      output += `| ... | ... | ... | ... | ... (${result.issues.length - 10} more) |\n`;
    }
    
    return output;
  }

  /**
   * Format suggestions for output
   */
  formatSuggestions(suggestions: RefactoringSuggestion[]): string {
    let output = '🔧 Refactoring Suggestions\n';
    output += '==================================================\n\n';
    
    output += `Found ${suggestions.length} suggestions:\n\n`;
    
    suggestions.forEach((suggestion, index) => {
      output += `${index + 1}. ${suggestion.issue.title}\n`;
      output += `   File: ${suggestion.issue.file}:${suggestion.issue.line}\n`;
      output += `   Severity: ${suggestion.issue.severity}\n`;
      output += `   Confidence: ${Math.round(suggestion.confidence * 100)}%\n`;
      output += `   Estimated savings: ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)\n`;
      output += `   ${suggestion.explanation}\n\n`;
    });
    
    return output;
  }

  /**
   * Format refactor result
   */
  formatRefactor(result: AnalysisResult): string {
    let output = '🔧 Refactoring Complete\n';
    output += '==================================================\n\n';
    
    output += '📊 Results\n';
    output += '--------------------\n';
    output += `Files processed: ${result.totalFiles}\n`;
    output += `Total issues: ${result.summary.totalIssues}\n`;
    output += `Fixed issues: ${result.summary.fixableIssues}\n`;
    output += `Critical issues resolved: ${result.summary.criticalIssues}\n`;
    output += `Lines saved: ${result.summary.estimatedSavings.lines} (${result.summary.estimatedSavings.percentage}%)\n`;
    output += `Time saved: ${result.summary.estimatedTime}\n\n`;
    
    if (result.warnings.length > 0) {
      output += '⚠️ Warnings\n';
      result.warnings.forEach(warning => {
        output += `- ${warning}\n`;
      });
      output += '\n';
    }
    
    if (result.errors.length > 0) {
      output += '❌ Errors\n';
      result.errors.forEach(error => {
        output += `- ${error}\n`;
      });
    }
    
    return output;
  }

  /**
   * Format fix result
   */
  formatFix(result: AnalysisResult): string {
    return this.formatRefactor(result);
  }

  /**
   * Format info result
   */
  formatInfo(result: AnalysisResult): string {
    let output = '📊 Codebase Information\n';
    output += '==================================================\n\n';
    
    output += '📁 Overview\n';
    output += '--------------------\n';
    output += `Total files: ${result.totalFiles}\n`;
    output += `Issues found: ${result.summary.totalIssues}\n`;
    output += `Fixable issues: ${result.summary.fixableIssues}\n`;
    output += `Critical issues: ${result.summary.criticalIssues}\n\n`;
    
    output += '📈 By Category\n';
    output += '--------------------\n';
    
    const categories: { [key: string]: number } = {};
    result.issues.forEach(issue => {
      categories[issue.category] = (categories[issue.category] || 0) + 1;
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      output += `${category}: ${count}\n`;
    });
    
    return output;
  }

  /**
   * Format verbose info
   */
  formatVerboseInfo(result: AnalysisResult): string {
    let output = this.formatInfo(result);
    output += '\n🔍 Detailed Issues\n';
    output += '--------------------\n';
    
    result.issues.forEach(issue => {
      output += `\n📄 ${issue.file}:${issue.line}\n`;
      output += `   ${issue.title}\n`;
      output += `   Severity: ${issue.severity}\n`;
      output += `   Category: ${issue.category}\n`;
      output += `   ${issue.description}\n`;
      if (issue.suggestion) {
        output += `   Suggestion: ${issue.suggestion}\n`;
      }
      output += `   Code: ${issue.codeSnippet}\n`;
    });
    
    return output;
  }
}