import type { AnalysisResult, RefactorConfig } from './types.js';

export class OutputFormatter {
  private config: RefactorConfig;

  constructor(config: RefactorConfig) {
    this.config = config;
  }

  /**
   * Format analysis result based on configured output format
   */
  formatReport(result: AnalysisResult): string {
    switch (this.config.outputFormat) {
      case 'json':
        return this.formatJSON(result);
      case 'markdown':
        return this.formatMarkdown(result);
      case 'console':
      default:
        return this.formatConsole(result);
    }
  }

  /**
   * Format analysis result as JSON
   */
  private formatJSON(result: AnalysisResult): string {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        totalFiles: result.totalFiles,
        totalIssues: result.summary.totalIssues,
        fixableIssues: result.summary.fixableIssues,
        criticalIssues: result.summary.criticalIssues,
        estimatedSavings: result.summary.estimatedSavings,
        estimatedTime: result.summary.estimatedTime
      },
      issues: result.issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        file: issue.file,
        line: issue.line,
        category: issue.category,
        severity: issue.severity,
        confidence: issue.confidence,
        fixable: issue.fixable,
        code: issue.codeSnippet,
        description: issue.description,
        suggestion: issue.suggestion
      })),
      suggestions: result.suggestions.map(suggestion => ({
        id: suggestion.id,
        issueId: suggestion.issue.id,
        title: suggestion.issue.title,
        file: suggestion.issue.file,
        line: suggestion.issue.line,
        beforeCode: suggestion.beforeCode,
        afterCode: suggestion.afterCode,
        explanation: suggestion.explanation,
        changes: suggestion.changes,
        confidence: suggestion.confidence,
        estimatedSavings: suggestion.estimatedSavings
      })),
      warnings: result.warnings,
      errors: result.errors
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Format analysis result as Markdown
   */
  private formatMarkdown(result: AnalysisResult): string {
    let markdown = `# AI Refactor Report\n\n`;
    markdown += `Generated: ${new Date().toISOString()}\n`;
    markdown += `Files analyzed: ${result.totalFiles}\n\n`;
    
    // Summary
    markdown += `## Summary\n\n`;
    markdown += `- Total Issues: ${result.summary.totalIssues}\n`;
    markdown += `- Fixable Issues: ${result.summary.fixableIssues}\n`;
    markdown += `- Critical Issues: ${result.summary.criticalIssues}\n`;
    markdown += `- Potential Savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)\n`;
    markdown += `- Estimated Time: ${result.summary.estimatedTime}\n\n`;
    
    // Issues by category
    const issuesByCategory = result.issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    markdown += `## Issues by Category\n\n`;
    Object.entries(issuesByCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        markdown += `- ${category}: ${count}\n`;
      });
    markdown += '\n';
    
    // Detailed issues
    if (result.issues.length > 0) {
      markdown += `## Detailed Issues\n\n`;
      
      for (const issue of result.issues.slice(0, 10)) {
        markdown += `### ${issue.title}\n\n`;
        markdown += `- **File:** ${issue.file}:${issue.line}\n`;
        markdown += `- **Category:** ${issue.category}\n`;
        markdown += `- **Severity:** ${issue.severity}\n`;
        markdown += `- **Confidence:** ${Math.round(issue.confidence * 100)}%\n`;
        markdown += `- **Fixable:** ${issue.fixable ? 'Yes' : 'No'}\n\n`;
        
        if (issue.description) {
          markdown += `**Description:** ${issue.description}\n\n`;
        }
        
        if (issue.codeSnippet) {
          markdown += `\`\`\`\n${issue.codeSnippet}\n\`\`\`\n\n`;
        }
        
        if (issue.suggestion) {
          markdown += `**Suggestion:** ${issue.suggestion}\n\n`;
        }
        
        if (issue.fixable) {
          markdown += `🔧 **Fixable:** Yes\n\n`;
        } else {
          markdown += `⚠️ **Requires manual review**\n\n`;
        }
        
        markdown += `---\n\n`;
      }
      
      if (result.issues.length > 10) {
        markdown += `... and ${result.issues.length - 10} more issues\n\n`;
      }
    }
    
    // Suggestions
    if (result.suggestions.length > 0) {
      markdown += `## Refactoring Suggestions\n\n`;
      
      for (const suggestion of result.suggestions.slice(0, 5)) {
        markdown += `### ${suggestion.issue.title}\n\n`;
        markdown += `- **File:** ${suggestion.issue.file}:${suggestion.issue.line}\n`;
        markdown += `- **Category:** ${suggestion.issue.category}\n`;
        markdown += `- **Savings:** ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)\n`;
        markdown += `- **Confidence:** ${Math.round(suggestion.confidence * 100)}%\n\n`;
        
        if (suggestion.explanation) {
          markdown += `**Explanation:** ${suggestion.explanation}\n\n`;
        }
        
        if (suggestion.beforeCode && suggestion.afterCode) {
          markdown += `**Before:**\n\`\`\`\n${suggestion.beforeCode}\n\`\`\`\n\n`;
          markdown += `**After:**\n\`\`\`\n${suggestion.afterCode}\n\`\`\`\n\n`;
        }
        
        markdown += `---\n\n`;
      }
      
      if (result.suggestions.length > 5) {
        markdown += `... and ${result.suggestions.length - 5} more suggestions\n\n`;
      }
    }
    
    // Footer
    if (result.warnings.length > 0) {
      markdown += `## Warnings\n\n`;
      result.warnings.forEach(warning => {
        markdown += `- ${warning}\n`;
      });
      markdown += '\n';
    }
    
    if (result.errors.length > 0) {
      markdown += `## Errors\n\n`;
      result.errors.forEach(error => {
        markdown += `- ${error}\n`;
      });
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Format analysis result for console output
   */
  private formatConsole(result: AnalysisResult): string {
    let output = '';
    
    // Header
    output += '🔍 AI Refactor Analysis Report\n';
    output += '='.repeat(30) + '\n';
    output += `📁 Files analyzed: ${result.totalFiles}\n`;
    output += `🔍 Issues found: ${result.summary.totalIssues}\n`;
    output += `🔧 Fixable issues: ${result.summary.fixableIssues}\n`;
    output += `🚀 Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)\n`;
    output += `⏱️  Estimated time: ${result.summary.estimatedTime}\n\n`;
    
    // Issues summary by category
    if (result.issues.length > 0) {
      const issuesByCategory = result.issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      output += '📊 Issues by Category:\n';
      Object.entries(issuesByCategory)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          output += `  • ${category}: ${count}\n`;
        });
      output += '\n';
    }
    
    // Top issues
    if (result.issues.length > 0) {
      output += '⚠️ Top Issues:\n';
      output += '-'.repeat(12) + '\n';
      
      for (const issue of result.issues.slice(0, 5)) {
        output += `  ${issue.severity.toUpperCase()} - ${issue.title}\n`;
        output += `    ${issue.file}:${issue.line} (${issue.category})\n`;
        if (issue.description) {
          output += `    ${issue.description}\n`;
        }
        output += '\n';
      }
      
      if (result.issues.length > 5) {
        output += `  ... and ${result.issues.length - 5} more issues\n\n`;
      }
    }
    
    // Top suggestions
    if (result.suggestions.length > 0) {
      output += '💡 Refactoring Suggestions:\n';
      output += '-'.repeat(24) + '\n';
      
      for (const suggestion of result.suggestions.slice(0, 3)) {
        output += `  ${suggestion.issue.title}\n`;
        output += `    ${suggestion.issue.file}:${suggestion.issue.line}\n`;
        output += `    ${suggestion.explanation}\n`;
        output += `    Savings: ${suggestion.estimatedSavings.lines} lines\n`;
        output += '    Apply: ai-refactor-x refactor --fix\n';
        output += '    Preview: ai-refactor-x suggest\n\n';
      }
      
      if (result.suggestions.length > 3) {
        output += `  ... and ${result.suggestions.length - 3} more suggestions\n\n`;
      }
    }
    
    // Recommendations
    output += '🎯 Recommendations:\n';
    output += '  ai-refactor-x refactor --fix\n';
    output += '  ai-refactor-x fix\n\n';
    
    if (result.suggestions.length > 0) {
      output += 'To preview fixes, use:\n';
      output += '  ai-refactor-x suggest\n\n';
    }
    
    output += 'For more help: ai-refactor-x --help\n';
    
    return output;
  }
}