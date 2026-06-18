import { readFile, writeFile, copyFile, access, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { 
  RefactoringSuggestion,
  CodeIssue,
  RefactorConfig,
  FileChange,
  RefactorOptions
} from './types.js';

const execAsync = promisify(exec);

export class AIFixer {
  private config: RefactorConfig;

  constructor(config: RefactorConfig) {
    this.config = config;
  }

  /**
   * Generate a refactoring suggestion for a specific issue
   */
  async generateSuggestion(issue: CodeIssue, projectPath: string): Promise<RefactoringSuggestion> {
    const id = this.generateId();
    const context = await this.getCodeContext(issue, projectPath);
    const beforeCode = context;
    
    let afterCode = beforeCode;
    let explanation = '';
    let suggestedChanges: FileChange[] = [];

    switch (issue.category) {
      case 'magic-number':
        ({ afterCode, explanation, suggestedChanges } = await this.fixMagicNumber(issue, context));
        break;
      case 'long-function':
        ({ afterCode, explanation, suggestedChanges } = await this.fixLongFunction(issue, context));
        break;
      case 'code-duplication':
        ({ afterCode, explanation, suggestedChanges } = await this.fixCodeDuplication(issue, context));
        break;
      case 'complex-conditional':
        ({ afterCode, explanation, suggestedChanges } = await this.fixComplexConditional(issue, context));
        break;
      case 'nested-loop':
        ({ afterCode, explanation, suggestedChanges } = await this.fixNestedLoop(issue, context));
        break;
      case 'debug-code':
        ({ afterCode, explanation, suggestedChanges } = await this.fixDebugCode(issue, context));
        break;
      case 'unused-variable':
        ({ afterCode, explanation, suggestedChanges } = await this.fixUnusedVariable(issue, context));
        break;
      case 'complex-import':
        ({ afterCode, explanation, suggestedChanges } = await this.fixComplexImport(issue, context));
        break;
      case 'null-check':
        ({ afterCode, explanation, suggestedChanges } = await this.fixNullCheck(issue, context));
        break;
      default:
        ({ afterCode, explanation, suggestedChanges } = await this.generateGenericFix(issue, context));
    }

    const estimatedSavings = this.calculateSavings(beforeCode, afterCode);

    return {
      id,
      issue,
      beforeCode,
      afterCode,
      explanation,
      changes: suggestedChanges,
      confidence: issue.confidence,
      estimatedSavings
    };
  }

  /**
   * Apply a refactoring suggestion to the actual file
   */
  async applySuggestion(suggestion: RefactoringSuggestion, options: RefactorOptions): Promise<void> {
    const { issue, changes } = suggestion;
    const filePath = issue.file;
    
    // Read the current file
    const currentContent = await readFile(filePath, 'utf-8');
    const lines = currentContent.split('\n');
    
    // Apply changes in reverse order (bottom to top to maintain line numbers)
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];
      await this.applyFileChange(change, lines, options);
    }
    
    // Write the modified content back
    const newContent = lines.join('\n');
    await writeFile(filePath, newContent);
  }

  /**
   * Generate a unique ID for a suggestion
   */
  private generateId(): string {
    return `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get code context around an issue
   */
  private async getCodeContext(issue: CodeIssue, projectPath: string): Promise<string> {
    try {
      const fullContent = await readFile(issue.file, 'utf-8');
      const lines = fullContent.split('\n');
      
      // Get a few lines before and after the issue
      const startLine = Math.max(0, issue.line - 3);
      const endLine = Math.min(lines.length, issue.line + 3);
      
      const contextLines = lines.slice(startLine, endLine);
      return contextLines.join('\n');
    } catch (error) {
      return `// Error reading file: ${(error as Error).message}\n`;
    }
  }

  /**
   * Fix magic numbers by replacing with named constants
   */
  private async fixMagicNumber(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const magicNumberMatch = context.match(/\b(\d+)\b/);
    if (!magicNumberMatch) {
      return this.generateGenericFix(issue, context);
    }
    
    const magicNumber = magicNumberMatch[0];
    const constantName = this.constantNameForNumber(magicNumber);
    const explanation = `Replace magic number ${magicNumber} with constant ${constantName}`;
    
    const afterCode = context.replace(new RegExp(`\\b${magicNumber}\\b`, 'g'), constantName);
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'insert',
      line: Math.max(1, issue.line - 2),
      content: `const ${constantName} = ${magicNumber}; // Magic number extracted`,
      description: 'Add named constant for magic number'
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Generate a constant name for a number
   */
  private constantNameForNumber(number: string): string {
    // Simple heuristic for generating constant names
    if (number === '1000') return 'DEFAULT_TIMEOUT';
    if (number === '100') return 'MAX_RETRIES';
    if (number === '5000') return 'CACHE_SIZE';
    if (number === '200') return 'MAX_CONNECTIONS';
    if (number === '30000') return 'DEFAULT_DELAY';
    
    // Generic fallback
    return `CONST_${number.toUpperCase()}`;
  }

  /**
   * Fix long functions by extracting smaller functions
   */
  private async fixLongFunction(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const functionNameMatch = context.match(/(?:function\s+(\w+)|(\w+)\s*\([^)]*\))/);
    const functionName = functionNameMatch ? (functionNameMatch[1] || functionNameMatch[2]) : 'extracted';
    
    const explanation = `Extract part of the long function into a smaller function "${functionName}Extracted"`;
    
    // Simple extraction - extract the first few lines
    const lines = context.split('\n');
    const extractedFunction = lines.slice(1, 4).join('\n');
    const afterCode = context.replace(extractedFunction, '');
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'insert',
      line: Math.max(1, issue.line - 1),
      content: `\nfunction ${functionName}Extracted() {\n${extractedFunction}\n}`,
      description: `Extract function ${functionName}Extracted from long function`
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Fix code duplication by extracting to a common function
   */
  private async fixCodeDuplication(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const explanation = 'Extract duplicated code into a common utility function';
    
    // Extract the duplicated code into a function
    const functionName = `extractedFunction${Date.now()}`;
    const functionCode = context.trim();
    
    const afterCode = context.replace(functionCode, `// Call ${functionName}() here`);
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'insert',
      line: 1,
      content: `function ${functionName}() {\n${functionCode}\n}\n`,
      description: `Extract duplicated code into ${functionName}()`
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Fix complex conditionals by using guard clauses
   */
  private async fixComplexConditional(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const explanation = 'Refactor complex conditional using guard clauses';
    
    // Simple guard clause transformation
    const conditionalMatch = context.match(/if\s*\(([^)]+)\)\s*\{([^}]*)\}/);
    if (!conditionalMatch) {
      return this.generateGenericFix(issue, context);
    }
    
    const condition = conditionalMatch[1];
    const body = conditionalMatch[2];
    
    const afterCode = `if (!${condition}) return;\n${body}`;
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'replace',
      line: issue.line,
      content: afterCode,
      description: 'Replace complex conditional with guard clause'
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Fix nested loops by using built-in methods
   */
  private async fixNestedLoop(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const explanation = 'Replace nested loop with built-in array methods';
    
    // Simple transformation: nested for loop to flatMap
    const nestedLoopMatch = context.match(/for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/);
    if (!nestedLoopMatch) {
      return this.generateGenericFix(issue, context);
    }
    
    const afterCode = context.replace(
      /for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/,
      'array.flatMap()'
    );
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'replace',
      line: issue.line,
      content: afterCode,
      description: 'Replace nested loop with flatMap'
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Remove debug code (console statements)
   */
  private async fixDebugCode(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const explanation = 'Remove console.debug statement';
    
    const afterCode = context.replace(/console\.(log|warn|error|debug)\([^)]*\);\s*\n?/g, '');
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'delete',
      line: issue.line,
      content: '',
      description: 'Remove console statement'
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Remove unused variables
   */
  private async fixUnusedVariable(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const explanation = 'Remove unused variable';
    
    // Find the variable declaration
    const varMatch = context.match(/(?:let|const|var)\s+(\w+)/);
    if (!varMatch) {
      return this.generateGenericFix(issue, context);
    }
    
    const varName = varMatch[1];
    const afterCode = context.replace(new RegExp(`\\b(let|const|var)\\s+${varName}\\s*[=;].*`, 'g'), '');
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'delete',
      line: issue.line,
      content: '',
      description: `Remove unused variable ${varName}`
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Fix complex imports by splitting them
   */
  private async fixComplexImport(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const explanation = 'Split complex import into multiple statements';
    
    // Simple split - assume first import is the main one
    const importMatch = context.match(/import\s+{([^}]+)}\s+from/);
    if (!importMatch) {
      return this.generateGenericFix(issue, context);
    }
    
    const imports = importMatch[1].split(',').map(i => i.trim());
    const firstImport = imports[0];
    
    const afterCode = context.replace(
      /import\s+{[^}]+}\s+from/,
      `import ${firstImport} from`
    );
    
    const additionalImports = imports.slice(1).map(imp => 
      `import ${imp} from '${context.match(/from\s+['"]([^'"]+)['"]/)?.[1] || 'module'}'`
    ).join('\n');
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'replace',
      line: issue.line,
      content: afterCode,
      description: 'Split complex import statement'
    }, {
      file: issue.file,
      operation: 'insert',
      line: issue.line + 1,
      content: additionalImports,
      description: 'Add remaining imports'
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Fix null checks by using optional chaining
   */
  private async fixNullCheck(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const explanation = 'Replace null check with optional chaining';
    
    const nullCheckMatch = context.match(/null\s*===?\s*(\w+)/);
    if (!nullCheckMatch) {
      return this.generateGenericFix(issue, context);
    }
    
    const variable = nullCheckMatch[1];
    const afterCode = context.replace(
      /null\s*===?\s*(\w+)/,
      `${variable}?.`
    );
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'replace',
      line: issue.line,
      content: afterCode,
      description: 'Replace null check with optional chaining'
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Generate a generic fix for unknown issue types
   */
  private async generateGenericFix(issue: CodeIssue, context: string): Promise<{
    afterCode: string;
    explanation: string;
    suggestedChanges: FileChange[];
  }> {
    const explanation = 'Generic refactoring suggestion';
    const afterCode = context.replace(issue.codeSnippet, '// TODO: Refactor this code');
    
    const suggestedChanges: FileChange[] = [{
      file: issue.file,
      operation: 'replace',
      line: issue.line,
      content: afterCode,
      description: 'Generic placeholder for refactoring'
    }];
    
    return { afterCode, explanation, suggestedChanges };
  }

  /**
   * Calculate estimated savings from a refactoring
   */
  private calculateSavings(beforeCode: string, afterCode: string): {
    lines: number;
    characters: number;
    percentage: number;
  } {
    const beforeLines = beforeCode.split('\n').length;
    const afterLines = afterCode.split('\n').length;
    const beforeChars = beforeCode.length;
    const afterChars = afterCode.length;
    
    const linesSaved = Math.max(0, beforeLines - afterLines);
    const charsSaved = Math.max(0, beforeChars - afterChars);
    const percentage = beforeLines > 0 ? Math.round((linesSaved / beforeLines) * 100) : 0;
    
    return {
      lines: linesSaved,
      characters: charsSaved,
      percentage
    };
  }

  /**
   * Apply a file change to the lines array
   */
  private async applyFileChange(change: FileChange, lines: string[], options: RefactorOptions): Promise<void> {
    const { file, operation, line, content, description } = change;
    
    switch (operation) {
      case 'insert':
        lines.splice(line - 1, 0, content);
        if (options.verbose) {
          console.log(`✓ Inserted in ${file}: ${description}`);
        }
        break;
        
      case 'delete':
        if (lines[line - 1]) {
          lines.splice(line - 1, 1);
          if (options.verbose) {
            console.log(`✓ Deleted from ${file}: ${description}`);
          }
        }
        break;
        
      case 'replace':
        if (lines[line - 1]) {
          lines.splice(line - 1, 1, content);
          if (options.verbose) {
            console.log(`✓ Replaced in ${file}: ${description}`);
          }
        }
        break;
    }
  }
}