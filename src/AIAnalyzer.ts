import { readFile, stat } from 'fs/promises';
import { extname } from 'path';
import { AIAnalyzerBase } from './AIAnalyzerBase.js';
import type { CodeIssue, RefactorConfig, RegExpMatch } from './types.js';

export class AIAnalyzer {
  private config: RefactorConfig;
  private baseAnalyzer: AIAnalyzerBase;

  constructor(config: RefactorConfig) {
    this.config = config;
    this.baseAnalyzer = new AIAnalyzerBase(config);
  }

  /**
   * Analyze a single file and return issues
   */
  async analyzeFile(filePath: string): Promise<CodeIssue[]> {
    const content = await readFile(filePath, 'utf-8');
    const extension = extname(filePath).toLowerCase();
    
    // Skip non-JavaScript/TypeScript files
    if (!this.isJavaScriptFile(extension)) {
      return [];
    }

    const issues: CodeIssue[] = [];
    
    // Basic syntax and pattern analysis
    issues.push(...await this.analyzeSyntax(content, filePath));
    issues.push(...await this.analyzePatterns(content, filePath));
    issues.push(...await this.analyzeCodeStructure(content, filePath));
    issues.push(...await this.analyzeBestPractices(content, filePath));
    
    return issues;
  }

  /**
   * Analyze multiple files in parallel
   */
  async analyzeFiles(files: string[]): Promise<CodeIssue[]> {
    const allIssues: CodeIssue[] = [];
    
    const promises = files.map(async (file) => {
      const issues = await this.analyzeFile(file);
      allIssues.push(...issues);
    });
    
    await Promise.all(promises);
    return allIssues;
  }

  /**
   * Check if file is JavaScript/TypeScript
   */
  private isJavaScriptFile(extension: string): boolean {
    return ['.js', '.jsx', '.ts', '.tsx'].includes(extension);
  }

  /**
   * Analyze syntax issues
   */
  private async analyzeSyntax(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Check for TODOs and FIXMEs
    const todoMatches = content.matchAll(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG):\s*(.+)$/gm);
    for (const match of todoMatches) {
      issues.push({
        type: 'verification',
        severity: 'medium',
        category: 'todo',
        title: 'Unresolved TODO/FIXME',
        description: `Found ${match[1]}: ${match[2]}`,
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        column: (match.index! - content.lastIndexOf('\n', match.index!)),
        codeSnippet: match[0],
        fixable: false,
        suggestion: `Consider addressing ${match[1]}: ${match[2]}`,
        confidence: 0.8
      });
    }

    // Check for magic numbers
    const magicNumberMatches = content.matchAll(/\b(\d+)\b(?![^\s]*%)/g);
    for (const match of magicNumberMatches) {
      const line = content.substring(0, match.index).split('\n').length;
      const lineContent = content.split('\n')[line - 1];
      
      // Skip numbers in contexts that are likely OK
      if (this.isLikelyMagicNumber(lineContent, match.index!)) {
        continue;
      }
      
      issues.push({
        type: 'comprehension',
        severity: 'low',
        category: 'magic-number',
        title: 'Magic Number',
        description: 'Use named constants instead of magic numbers',
        file: filePath,
        line,
        column: (match.index! - content.lastIndexOf('\n', match.index!)),
        codeSnippet: match[0],
        fixable: true,
        suggestion: `Define a constant for ${match[0]}`,
        confidence: 0.9
      });
    }

    // Check for long functions
    const functionMatches = content.matchAll(/(?:function\s+\w+\s*|\w+\s*\([^)]*\)\s*{)\s*([^{}]*\n{1,50})/g);
    for (const match of functionMatches) {
      const lines = match[1].split('\n').length;
      if (lines > 20) {
        issues.push({
          type: 'architectural',
          severity: 'medium',
          category: 'long-function',
          title: 'Function is too long',
          description: `Function has ${lines} lines, consider breaking it down`,
          file: filePath,
          line: content.substring(0, match.index).split('\n').length,
          column: (match.index! - content.lastIndexOf('\n', match.index!)),
          codeSnippet: match[0].substring(0, 200) + '...',
          fixable: true,
          suggestion: 'Extract smaller functions from this large function',
          confidence: 0.85
        });
      }
    }

    return issues;
  }

  /**
   * Check if a number is likely a magic number
   */
  private isLikelyMagicNumber(line: string, index: number): boolean {
    const before = line.substring(0, index).trim();
    const after = line.substring(index + 1).trim();
    
    // Skip array indices
    if (before.endsWith('[') && after.startsWith(']')) {
      return true;
    }
    
    // Skip object properties
    if (before.endsWith('.') || before.endsWith('?.') || before.endsWith('?.')) {
      return true;
    }
    
    // Skip comparison operators
    if (/[<>]=?==?/.test(before) || /==?<?/.test(after)) {
      return true;
    }
    
    // Skip version numbers
    if (/(\d+\.)+\d+/.test(line)) {
      return true;
    }
    
    return false;
  }

  /**
   * Analyze code patterns
   */
  private async analyzePatterns(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Check for repeated code blocks
    const repeatedCode = await this.findRepeatedCode(content, filePath);
    issues.push(...repeatedCode);
    
    // Check for complex conditional logic
    const complexConditionals = await this.findComplexConditionals(content, filePath);
    issues.push(...complexConditionals);
    
    // Check for nested loops
    const nestedLoops = await this.findNestedLoops(content, filePath);
    issues.push(...nestedLoops);
    
    return issues;
  }

  /**
   * Find repeated code blocks
   */
  private async findRepeatedCode(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    const codeBlocks = new Map<string, number[]>();
    
    for (let i = 0; i < lines.length - 3; i++) {
      const block = lines.slice(i, i + 3).join('\n').trim();
      if (block.length > 50) { // Minimum block size
        if (codeBlocks.has(block)) {
          codeBlocks.get(block)!.push(i + 1);
        } else {
          codeBlocks.set(block, [i + 1]);
        }
      }
    }
    
    for (const [block, lineNumbers] of codeBlocks) {
      if (lineNumbers.length > 1) {
        issues.push({
          type: 'architectural',
          severity: 'medium',
          category: 'code-duplication',
          title: 'Code duplication detected',
          description: `Found ${lineNumbers.length} similar code blocks`,
          file: filePath,
          line: lineNumbers[0],
          column: 0,
          codeSnippet: block.split('\n')[0],
          fixable: true,
          suggestion: 'Extract repeated code into a function or utility',
          confidence: 0.9
        });
      }
    }
    
    return issues;
  }

  /**
   * Find complex conditional logic
   */
  private async findComplexConditionals(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Look for deeply nested conditionals (if statements with more than 2 levels)
    const conditionalMatches = content.matchAll(/\s+if\s*\([^)]+\)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g);
    
    for (const match of conditionalMatches) {
      const line = content.substring(0, match.index).split('\n').length;
      
      // Count nesting depth
      const nestingDepth = (match[0].match(/\{/g) || []).length;
      if (nestingDepth > 4) {
        issues.push({
          type: 'architectural',
          severity: 'medium',
          category: 'complex-conditional',
          title: 'Complex conditional logic',
          description: `Conditional has ${nestingDepth - 1} nesting levels`,
          file: filePath,
          line,
          column: (match.index! - content.lastIndexOf('\n', match.index!)),
          codeSnippet: match[0].substring(0, 100) + '...',
          fixable: true,
          suggestion: 'Use guard clauses or extract to separate functions',
          confidence: 0.8
        });
      }
    }
    
    return issues;
  }

  /**
   * Find nested loops
   */
  private async findNestedLoops(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Look for nested for/while loops
    const loopMatches = content.matchAll(/\s+(for|while)\s*\([^)]+\)\s*\{[^{}]*\}/g);
    const nestedLoops: number[] = [];
    let currentDepth = 0;
    
    for (const match of loopMatches) {
      const line = content.substring(0, match.index).split('\n').length;
      const isLoopStart = match[1].startsWith('f') || match[1].startsWith('w');
      
      if (isLoopStart) {
        currentDepth++;
        if (currentDepth > 2) {
          nestedLoops.push(line);
        }
      } else {
        currentDepth--;
      }
    }
    
    for (const line of nestedLoops) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        category: 'nested-loop',
        title: 'Nested loop detected',
        description: 'Deeply nested loops can impact performance',
        file: filePath,
        line,
        column: 0,
        codeSnippet: '',
        fixable: true,
        suggestion: 'Consider using built-in array methods or caching',
        confidence: 0.75
      });
    }
    
    return issues;
  }

  /**
   * Analyze code structure issues
   */
  private async analyzeCodeStructure(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Check for overly complex imports
    const importMatches = content.matchAll(/import\s+(.+?)\s+from\s+['"](.+?)['"]/g);
    for (const match of importMatches) {
      if (match[1].split(',').length > 5) {
        issues.push({
          type: 'architectural',
          severity: 'low',
          category: 'complex-import',
          title: 'Complex import statement',
          description: 'Import statement has too many named imports',
          file: filePath,
          line: content.substring(0, match.index).split('\n').length,
          column: (match.index! - content.lastIndexOf('\n', match.index!)),
          codeSnippet: match[0],
          fixable: true,
          suggestion: 'Split complex imports into multiple statements',
          confidence: 0.8
        });
      }
    }
    
    // Check for deeply nested objects
    const objectNesting = content.matchAll(/\{[^{}]*\{[^{}]*\{[^{}]*\}/g);
    for (const match of objectNesting) {
      issues.push({
        type: 'comprehension',
        severity: 'medium',
        category: 'deep-nesting',
        title: 'Deeply nested objects',
        description: 'Objects have more than 2 levels of nesting',
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        column: (match.index! - content.lastIndexOf('\n', match.index!)),
        codeSnippet: match[0].substring(0, 100) + '...',
        fixable: true,
        suggestion: 'Flatten nested objects or use data classes',
        confidence: 0.7
      });
    }
    
    return issues;
  }

  /**
   * Analyze best practices
   */
  private async analyzeBestPractices(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Check for console.log statements
    const consoleLogMatches = content.matchAll(/console\.(log|warn|error|debug)\([^)]*\)/g);
    for (const match of consoleLogMatches) {
      issues.push({
        type: 'verification',
        severity: 'low',
        category: 'debug-code',
        title: 'Debug code found',
        description: 'Console statements should be removed from production code',
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        column: (match.index! - content.lastIndexOf('\n', match.index!)),
        codeSnippet: match[0],
        fixable: true,
        suggestion: 'Remove console statements or replace with proper logging',
        confidence: 0.9
      });
    }
    
    // Check for unused variables
    const unusedVars = await this.findUnusedVariables(content, filePath);
    issues.push(...unusedVars);
    
    return issues;
  }

  /**
   * Find unused variables
   */
  private async findUnusedVariables(content: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Collect variable declarations and their positions
    const declarationRegex = /(?:let|const|var)\s+(\w+)/g;
    const declarations: Array<{ name: string; index: number }> = [];
    
    for (const match of content.matchAll(declarationRegex)) {
      declarations.push({ name: match[1], index: match.index! });
    }
    
    // For each declared variable, check if it's used anywhere else
    for (const decl of declarations) {
      const { name, index } = decl;
      
      // Look for the variable name AFTER the declaration position
      const usageAfterDecl = content.substring(index + name.length).matchAll(new RegExp(`\\b${name}\\b`, 'g'));
      
      if (usageAfterDecl) {
        const usages = Array.from(usageAfterDecl);
        if (usages.length === 0) {
          // Variable is unused
          const line = content.substring(0, index).split('\n').length + 1;
          const column = index - content.lastIndexOf('\n', index) - 1;
          
          issues.push({
            type: 'verification',
            severity: 'low',
            category: 'unused-variable',
            title: 'Unused variable',
            description: `Variable '${name}' is defined but never used`,
            file: filePath,
            line,
            column,
            codeSnippet: `let ${name}`,
            fixable: true,
            suggestion: `Remove unused variable '${name}'`,
            confidence: 0.8
          });
        }
      }
    }
    
    return issues;
  }
}