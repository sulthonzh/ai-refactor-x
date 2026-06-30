import type { RefactorConfig, RegExpMatch } from './types.js';

export class AIAnalyzerBase {
  protected config: RefactorConfig;

  constructor(config: RefactorConfig) {
    this.config = config;
  }

  /**
   * Initialize patterns for code analysis
   */
  protected getPatterns() {
    return {
      // Common anti-patterns
      antiPatterns: [
        { regex: /console\.(log|warn|error|debug)\([^)]*\)/g, category: 'debug-code', severity: 'low' },
        { regex: /\bTODO\s*:\s*.+/g, category: 'todo', severity: 'medium' },
        { regex: /\bFIXME\s*:\s*.+/g, category: 'todo', severity: 'high' },
        { regex: /\bHACK\s*:\s*.+/g, category: 'hack', severity: 'medium' },
        { regex: /\b(let|const|var)\s+(\w+)\s*=/g, category: 'variable', severity: 'low' },
      ],
      
      // Function complexity patterns
      functionPatterns: [
        { regex: /function\s+\w+\s*{[^}]{100,}/g, category: 'long-function', severity: 'medium' },
        { regex: /\w+\s*\([^)]*\)\s*{[^}]{100,}/g, category: 'long-function', severity: 'medium' },
        { regex: /if\s*\([^)]+\)\s*{[^}]*\s*if\s*\([^)]+\)/g, category: 'nested-if', severity: 'medium' },
        { regex: /for\s*\([^)]+\)\s*{[^}]*\s*for\s*\([^)]+\)/g, category: 'nested-loop', severity: 'medium' },
      ],
      
      // Import patterns
      importPatterns: [
        { regex: /import\s+{[^}]+}\s+from/g, category: 'complex-import', severity: 'low' },
        { regex: /require\([^)]+\)/g, category: 'require-statement', severity: 'low' },
        { regex: /from\s+['"][^'"]+['"][^;]*$/gm, category: 'import-statement', severity: 'low' },
      ],
      
      // Code quality patterns
      qualityPatterns: [
        { regex: /\b(null|undefined)\s*===?\s*\w+/g, category: 'null-check', severity: 'low' },
        { regex: /\b(\d+)\s*===?\s*\d+/g, category: 'magic-number', severity: 'low' },
        { regex: /\w+\s*=\s*\w+\s*\+\s*1/g, category: 'increment', severity: 'low' },
        { regex: /\.map\(\s*\w+\s*=>\s*\w+\s*\)/g, category: 'simple-map', severity: 'low' },
      ],
      
      // Performance patterns
      performancePatterns: [
        { regex: /\.forEach\(\s*\w+\s*=>\s*\w+\s*\)/g, category: 'forEach-loop', severity: 'low' },
        { regex: /for\s*\([^)]+\)\s*{[^}]*\.push\([^)]*\)}/g, category: 'push-in-loop', severity: 'medium' },
        { regex: /document\.getElementById|document\.querySelector/g, category: 'dom-access', severity: 'low' },
      ],
      
      // Security patterns
      securityPatterns: [
        { regex: /eval\([^)]*\)/g, category: 'eval-statement', severity: 'high' },
        { regex: /innerHTML\s*=/g, category: 'innerHTML', severity: 'high' },
        { regex: /document\.write/g, category: 'document-write', severity: 'high' },
        { regex: /\.exec\([^)]*\)/g, category: 'regex-exec', severity: 'low' },
      ],
      
      // Code duplication patterns
      duplicationPatterns: [
        { regex: /function\s+\w+\s*\([^)]*\)\s*{[^{}]*\n\s*[^{}]*\n\s*[^{}]*\n[^{}]*}/g, category: 'repeated-function', severity: 'medium' },
        { regex: /\{[^{}]*\n[^{}]*\n[^{}]*\n[^{}]*}/g, category: 'repeated-block', severity: 'medium' },
        { regex: /console\.(log|warn|error)\([^)]*\)/g, category: 'repeated-console', severity: 'low' },
      ],
    };
  }

  /**
   * Analyze code patterns for a specific category
   */
  protected analyzePattern(content: string, pattern: { regex: RegExp; category: string; severity: string }): {
    matches: RegExpMatch[];
    count: number;
  } {
    const matches: RegExpMatch[] = [];
    let match: RegExpExecArray | null;
    
    while ((match = pattern.regex.exec(content)) !== null) {
      matches.push({
        pattern: pattern.regex.source,
        match: match[0],
        line: content.substring(0, match.index).split('\n').length,
        column: match.index! - content.lastIndexOf('\n', match.index!),
        context: this.getContext(content, match.index!, 50)
      });
    }
    
    return {
      matches,
      count: matches.length
    };
  }

  /**
   * Get context around a match
   */
  protected getContext(content: string, index: number, radius: number): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(content.length, index + radius);
    return content.substring(start, end);
  }

  /**
   * Calculate pattern confidence based on frequency and context
   */
  protected calculateConfidence(count: number, context: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for higher counts
    if (count > 3) confidence += 0.2;
    if (count > 5) confidence += 0.2;
    
    // Adjust based on context
    if (context.includes('function') || context.includes('class')) confidence += 0.1;
    if (context.includes('test') || context.includes('spec')) confidence -= 0.2;
    
    return Math.min(1.0, Math.max(0.1, confidence));
  }

  /**
   * Get severity level based on count and type
   */
  protected getSeverity(count: number, category: string): 'low' | 'medium' | 'high' | 'critical' {
    if (category === 'debug-code' && count > 10) return 'critical';
    if (category === 'eval-statement' || category === 'innerHTML') return 'critical';
    if (category === 'long-function' && count > 5) return 'high';
    if (category === 'nested-loop' && count > 3) return 'high';
    if (count > 5) return 'high';
    if (count > 2) return 'medium';
    return 'low';
  }

  /**
   * Get issue suggestion based on category
   */
  protected getSuggestion(category: string): string {
    const suggestions: Record<string, string> = {
      'debug-code': 'Remove console statements or replace with proper logging',
      'todo': 'Address the TODO/FIXME item',
      'hack': 'Refactor the hack into proper code',
      'long-function': 'Extract smaller functions from this large function',
      'nested-if': 'Use guard clauses or extract to separate functions',
      'nested-loop': 'Consider using built-in array methods or caching',
      'complex-import': 'Split complex imports into multiple statements',
      'require-statement': 'Use ES6 imports instead of require',
      'null-check': 'Use optional chaining or nullish coalescing',
      'magic-number': 'Define a constant for this magic number',
      'increment': 'Use ++ operator for increment',
      'forEach-loop': 'Consider using .map() or .filter() instead',
      'push-in-loop': 'Pre-allocate array or use .map() instead',
      'dom-access': 'Cache DOM queries or use event delegation',
      'eval-statement': 'Avoid eval() for security reasons',
      'innerHTML': 'Use textContent or createElement instead',
      'document-write': 'Use DOM manipulation methods instead',
      'regex-exec': 'Use test() for boolean checks',
      'repeated-function': 'Extract repeated code into a utility function',
      'repeated-block': 'Extract repeated code into a helper function',
      'repeated-console': 'Replace with appropriate logging levels',
      'unused-variable': 'Remove unused variable or comment it out'
    };
    
    return suggestions[category] || 'Consider refactoring this code';
  }

  /**
   * Get issue category title
   */
  protected getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      'debug-code': 'Debug Code Found',
      'todo': 'Unresolved TODO/FIXME',
      'hack': 'Code Hack Detected',
      'long-function': 'Function Too Long',
      'nested-if': 'Deeply Nested Conditionals',
      'nested-loop': 'Nested Loops',
      'complex-import': 'Complex Import Statement',
      'require-statement': 'Legacy Require Statement',
      'null-check': 'Null/Undefined Check',
      'magic-number': 'Magic Number',
      'increment': 'Manual Increment',
      'forEach-loop': 'forEach Usage',
      'push-in-loop': 'Array Push in Loop',
      'dom-access': 'DOM Access',
      'eval-statement': 'eval() Usage',
      'innerHTML': 'innerHTML Assignment',
      'document-write': 'document.write() Usage',
      'regex-exec': 'Regular Expression Execution',
      'repeated-function': 'Repeated Function Code',
      'repeated-block': 'Repeated Code Block',
      'repeated-console': 'Repeated Console Statements',
      'unused-variable': 'Unused Variable'
    };
    
    return titles[category] || 'Code Quality Issue';
  }
}