import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import type { RefactorConfig, PatternMatch } from './types.js';

export class FileProcessor {
  private config: RefactorConfig;

  constructor(config: RefactorConfig) {
    this.config = config;
  }

  /**
   * Find all files to analyze based on config patterns
   */
  async findFiles(rootPath: string): Promise<string[]> {
    const files: string[] = [];
    const processedDirs = new Set<string>();
    
    const patterns = this.config.patterns || ['**/*.{js,ts,jsx,tsx}'];
    const ignorePatterns = this.config.ignore || [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/.git/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/coverage/**',
      '**/logs/**'
    ];

    for (const pattern of patterns) {
      const foundFiles = await this.findFilesByPattern(rootPath, pattern, ignorePatterns);
      files.push(...foundFiles);
    }

    // Remove duplicates
    const uniqueFiles = Array.from(new Set(files));
    
    // Apply file limit
    if (this.config.maxFiles && uniqueFiles.length > this.config.maxFiles) {
      uniqueFiles.splice(this.config.maxFiles);
    }

    return uniqueFiles;
  }

  /**
   * Find files matching a specific pattern
   */
  private async findFilesByPattern(rootPath: string, pattern: string, ignorePatterns: string[]): Promise<string[]> {
    const files: string[] = [];
    
    if (pattern.includes('**') || pattern.includes('*')) {
      // Handle glob-like patterns
      await this.walkDirectory(rootPath, pattern, ignorePatterns, files);
    } else {
      // Handle specific file extensions
      const files = await this.findFilesByExtension(rootPath, pattern, ignorePatterns);
    }

    return files;
  }

  /**
   * Walk directory and collect files matching pattern
   */
  private async walkDirectory(
    dir: string,
    pattern: string,
    ignorePatterns: string[],
    files: string[],
    currentDepth = 0
  ): Promise<void> {
    if (currentDepth >= (this.config.depth || 10)) {
      return;
    }

    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(process.cwd(), fullPath);
        
        // Check if path should be ignored
        if (this.shouldIgnorePath(relativePath, ignorePatterns)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.walkDirectory(fullPath, pattern, ignorePatterns, files, currentDepth + 1);
        } else if (entry.isFile() && this.matchesPattern(fullPath, pattern)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      console.warn(`Could not read directory ${dir}: ${(error as Error).message}`);
    }
  }

  /**
   * Find files by specific extension
   */
  private async findFilesByExtension(
    rootPath: string,
    extension: string,
    ignorePatterns: string[]
  ): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(rootPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(rootPath, entry.name);
        const relativePath = relative(process.cwd(), fullPath);
        
        if (this.shouldIgnorePath(relativePath, ignorePatterns)) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.findFilesByExtension(fullPath, extension, ignorePatterns);
          files.push(...subFiles);
        } else if (entry.isFile() && extname(fullPath) === extension) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      console.warn(`Could not read directory ${rootPath}: ${(error as Error).message}`);
    }

    return files;
  }

  /**
   * Check if a path should be ignored based on ignore patterns
   */
  private shouldIgnorePath(path: string, ignorePatterns: string[]): boolean {
    for (const pattern of ignorePatterns) {
      if (this.matchesPattern(path, pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a path matches a pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Handle simple patterns
    if (!pattern.includes('*') && !pattern.includes('?') && !pattern.includes('[') && !pattern.includes('{')) {
      return path === pattern || path.endsWith(pattern);
    }

    // Convert glob to regex
    const regexPattern = this.globToRegex(pattern);
    const regex = new RegExp(regexPattern);
    return regex.test(path);
  }

  /**
   * Convert glob pattern to regex
   */
  private globToRegex(glob: string): string {
    let regex = glob;
    
    // Replace glob special characters FIRST (before escaping)
    regex = regex.replace(/\*\*/g, '__DOUBLE_STAR__'); // Mark **
    regex = regex.replace(/\*/g, '__STAR__'); // Mark *
    regex = regex.replace(/\?/g, '__QUESTION__'); // Mark ?
    regex = regex.replace(/\{([^}]+)\}/g, '__ALT_START__$1__ALT_END__'); // Mark {,}
    
    // Escape special regex characters EXCEPT for glob markers (the markers contain no regex specials)
    regex = regex.replace(/[-\/\\^$.+()|[\]{}]/g, '\\$&');
    
    // Convert brace expansion {a,b,c} to (a|b|c)
    regex = regex.replace(/__ALT_START__(.*?)__ALT_END__/g, (match, content) => {
      const alternatives = content.split(',').map(a => a.trim()).join('|');
      return `(?:${alternatives})`;
    });
    
    // Restore glob markers as regex
    regex = regex.replace(/__DOUBLE_STAR__/g, '.*');
    regex = regex.replace(/__STAR__/g, '[^/]*');
    regex = regex.replace(/__QUESTION__/g, '[^/]');
    
    // Ensure it matches the entire path
    return `^${regex}$`;
  }

  /**
   * Read file content with error handling
   */
  async readFileContent(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Could not read file ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string) {
    try {
      const stats = await stat(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      throw new Error(`Could not get stats for ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze file for patterns
   */
  async analyzePatterns(filePath: string): Promise<PatternMatch[]> {
    const content = await this.readFileContent(filePath);
    const patterns: PatternMatch[] = [];
    
    // Common patterns to look for
    const patternDefinitions = [
      { regex: /import\s+{[^}]+}\s+from/g, type: 'code' },
      { regex: /require\([^)]+\)/g, type: 'code' },
      { regex: /console\.[\w]+\([^)]*\)/g, type: 'code' },
      { regex: /TODO\s*:\s*/gm, type: 'comment' },
      { regex: /FIXME\s*:\s*/gm, type: 'comment' },
      { regex: /\bfunction\s+\w+\s*\(/g, type: 'code' },
      { regex: /\b(class|interface|type)\s+\w+/g, type: 'code' },
      { regex: /\b(let|const|var)\s+\w+/g, type: 'code' },
      { regex: /\/\*[\s\S]*?\*\//g, type: 'comment' },
      { regex: /\/\/.*$/gm, type: 'comment' },
      { regex: /['"`][^'"`]*['"`]/g, type: 'string' },
    ];

    for (const patternDef of patternDefinitions) {
      let match: RegExpExecArray | null;
      
      while ((match = patternDef.regex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        const column = match.index! - content.lastIndexOf('\n', match.index!);
        
        patterns.push({
          file: filePath,
          matches: [{
            pattern: patternDef.regex.source,
            match: match[0],
            line,
            column,
            context: this.getContext(content, match.index!, 50)
          }],
          type: patternDef.type
        });
      }
    }

    return patterns;
  }

  /**
   * Get context around a position
   */
  private getContext(content: string, index: number, radius: number): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(content.length, index + radius);
    return content.substring(start, end);
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<{
    path: string;
    relativePath: string;
    extension: string;
    size: number;
    lines: number;
    hasTests: boolean;
    hasTypeScript: boolean;
    complexity: number;
  }> {
    const stats = await this.getFileStats(filePath);
    const content = await this.readFileContent(filePath);
    const extension = extname(filePath);
    
    const lines = content.split('\n').length;
    const hasTests = filePath.includes('.test.') || filePath.includes('.spec.');
    const hasTypeScript = ['.ts', '.tsx'].includes(extension);
    
    // Simple complexity estimation
    const complexity = this.estimateComplexity(content);
    
    return {
      path: filePath,
      relativePath: relative(process.cwd(), filePath),
      extension,
      size: stats.size,
      lines,
      hasTests,
      hasTypeScript,
      complexity
    };
  }

  /**
   * Estimate code complexity
   */
  private estimateComplexity(content: string): number {
    let complexity = 1;
    
    // Count control structures
    const controlStructures = content.match(/\b(if|for|while|switch|case|try|catch)\b/g);
    if (controlStructures) {
      complexity += controlStructures.length;
    }
    
    // Count functions and classes
    const functions = content.match(/\b(function\s+\w+|\w+\s*\([^)]*\)\s*{|class\s+\w+)/g);
    if (functions) {
      complexity += functions.length;
    }
    
    // Count nesting levels (simplified)
    const nestingMatches = content.match(/{/g);
    const maxNesting = nestingMatches ? nestingMatches.length / 10 : 0;
    complexity += maxNesting;
    
    return Math.round(complexity);
  }

  /**
   * Batch process multiple files
   */
  async batchProcess(filePaths: string[]): Promise<{
    files: any[];
    errors: string[];
    processed: number;
    skipped: number;
  }> {
    const files: any[] = [];
    const errors: string[] = [];
    let processed = 0;
    let skipped = 0;

    for (const filePath of filePaths) {
      try {
        const fileInfo = await this.getFileInfo(filePath);
        const patterns = await this.analyzePatterns(filePath);
        
        files.push({
          ...fileInfo,
          patterns,
          timestamp: new Date().toISOString()
        });
        
        processed++;
      } catch (error) {
        errors.push(`Error processing ${filePath}: ${(error as Error).message}`);
        skipped++;
      }
    }

    return { files, errors, processed, skipped };
  }

  /**
   * Create backup of files
   */
  async createBackup(filePaths: string[], backupDir: string): Promise<string[]> {
    const backupFiles: string[] = [];
    
    try {
      // Create backup directory if it doesn't exist
      const { mkdir } = await import('fs/promises');
      await mkdir(backupDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    for (const filePath of filePaths) {
      try {
        const relativePath = relative(process.cwd(), filePath);
        const backupPath = join(backupDir, relativePath);
        const backupDirPath = dirname(backupPath);
        
        // Create backup directory
        await mkdir(backupDirPath, { recursive: true });
        
        // Copy file
        const { copyFile } = await import('fs/promises');
        await copyFile(filePath, backupPath);
        
        backupFiles.push(backupPath);
      } catch (error) {
        console.warn(`Could not backup ${filePath}: ${(error as Error).message}`);
      }
    }

    return backupFiles;
  }
}