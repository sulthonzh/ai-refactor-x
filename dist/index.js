// src/AIRefactor.ts
import { writeFile as writeFile2, stat as stat3 } from "fs/promises";
import { exec as exec2 } from "child_process";
import { promisify as promisify2 } from "util";

// src/AIAnalyzer.ts
import { readFile } from "fs/promises";
import { extname } from "path";

// src/AIAnalyzerBase.ts
var AIAnalyzerBase = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Initialize patterns for code analysis
   */
  getPatterns() {
    return {
      // Common anti-patterns
      antiPatterns: [
        { regex: /console\.(log|warn|error|debug)\([^)]*\)/g, category: "debug-code", severity: "low" },
        { regex: /\bTODO\s*:\s*.+/g, category: "todo", severity: "medium" },
        { regex: /\bFIXME\s*:\s*.+/g, category: "todo", severity: "high" },
        { regex: /\bHACK\s*:\s*.+/g, category: "hack", severity: "medium" },
        { regex: /\b(let|const|var)\s+(\w+)\s*=/g, category: "variable", severity: "low" }
      ],
      // Function complexity patterns
      functionPatterns: [
        { regex: /function\s+\w+\s*{[^}]{100,}/g, category: "long-function", severity: "medium" },
        { regex: /\w+\s*\([^)]*\)\s*{[^}]{100,}/g, category: "long-function", severity: "medium" },
        { regex: /if\s*\([^)]+\)\s*{[^}]*\s*if\s*\([^)]+\)/g, category: "nested-if", severity: "medium" },
        { regex: /for\s*\([^)]+\)\s*{[^}]*\s*for\s*\([^)]+\)/g, category: "nested-loop", severity: "medium" }
      ],
      // Import patterns
      importPatterns: [
        { regex: /import\s+{[^}]+}\s+from/g, category: "complex-import", severity: "low" },
        { regex: /require\([^)]+\)/g, category: "require-statement", severity: "low" },
        { regex: /from\s+['"][^'"]+['"][^;]*$/gm, category: "import-statement", severity: "low" }
      ],
      // Code quality patterns
      qualityPatterns: [
        { regex: /\b(null|undefined)\s*===?\s*\w+/g, category: "null-check", severity: "low" },
        { regex: /\b(\d+)\s*===?\s*\d+/g, category: "magic-number", severity: "low" },
        { regex: /\w+\s*=\s*\w+\s*\+\s*1/g, category: "increment", severity: "low" },
        { regex: /\.map\(\s*\w+\s*=>\s*\w+\s*\)/g, category: "simple-map", severity: "low" }
      ],
      // Performance patterns
      performancePatterns: [
        { regex: /\.forEach\(\s*\w+\s*=>\s*\w+\s*\)/g, category: "forEach-loop", severity: "low" },
        { regex: /for\s*\([^)]+\)\s*{[^}]*\.push\([^)]*\)}/g, category: "push-in-loop", severity: "medium" },
        { regex: /document\.getElementById|document\.querySelector/g, category: "dom-access", severity: "low" }
      ],
      // Security patterns
      securityPatterns: [
        { regex: /eval\([^)]*\)/g, category: "eval-statement", severity: "high" },
        { regex: /innerHTML\s*=/g, category: "innerHTML", severity: "high" },
        { regex: /document\.write/g, category: "document-write", severity: "high" },
        { regex: /\.exec\([^)]*\)/g, category: "regex-exec", severity: "low" }
      ],
      // Code duplication patterns
      duplicationPatterns: [
        { regex: /function\s+\w+\s*\([^)]*\)\s*{[^{}]*\n\s*[^{}]*\n\s*[^{}]*\n[^{}]*}/g, category: "repeated-function", severity: "medium" },
        { regex: /\{[^{}]*\n[^{}]*\n[^{}]*\n[^{}]*}/g, category: "repeated-block", severity: "medium" },
        { regex: /console\.(log|warn|error)\([^)]*\)/g, category: "repeated-console", severity: "low" }
      ]
    };
  }
  /**
   * Analyze code patterns for a specific category
   */
  analyzePattern(content, pattern) {
    const matches = [];
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      matches.push({
        pattern: pattern.regex.source,
        match: match[0],
        line: content.substring(0, match.index).split("\n").length,
        column: match.index - content.lastIndexOf("\n", match.index),
        context: this.getContext(content, match.index, 50)
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
  getContext(content, index, radius) {
    const start = Math.max(0, index - radius);
    const end = Math.min(content.length, index + radius);
    return content.substring(start, end);
  }
  /**
   * Calculate pattern confidence based on frequency and context
   */
  calculateConfidence(count, context) {
    let confidence = 0.5;
    if (count > 3) confidence += 0.2;
    if (count > 5) confidence += 0.2;
    if (context.includes("function") || context.includes("class")) confidence += 0.1;
    if (context.includes("test") || context.includes("spec")) confidence -= 0.2;
    return Math.min(1, Math.max(0.1, confidence));
  }
  /**
   * Get severity level based on count and type
   */
  getSeverity(count, category) {
    if (category === "debug-code" && count > 10) return "critical";
    if (category === "eval-statement" || category === "innerHTML") return "critical";
    if (category === "long-function" && count > 5) return "high";
    if (category === "nested-loop" && count > 3) return "high";
    if (count > 5) return "high";
    if (count > 2) return "medium";
    return "low";
  }
  /**
   * Get issue suggestion based on category
   */
  getSuggestion(category) {
    const suggestions = {
      "debug-code": "Remove console statements or replace with proper logging",
      "todo": "Address the TODO/FIXME item",
      "hack": "Refactor the hack into proper code",
      "long-function": "Extract smaller functions from this large function",
      "nested-if": "Use guard clauses or extract to separate functions",
      "nested-loop": "Consider using built-in array methods or caching",
      "complex-import": "Split complex imports into multiple statements",
      "require-statement": "Use ES6 imports instead of require",
      "null-check": "Use optional chaining or nullish coalescing",
      "magic-number": "Define a constant for this magic number",
      "increment": "Use ++ operator for increment",
      "forEach-loop": "Consider using .map() or .filter() instead",
      "push-in-loop": "Pre-allocate array or use .map() instead",
      "dom-access": "Cache DOM queries or use event delegation",
      "eval-statement": "Avoid eval() for security reasons",
      "innerHTML": "Use textContent or createElement instead",
      "document-write": "Use DOM manipulation methods instead",
      "regex-exec": "Use test() for boolean checks",
      "repeated-function": "Extract repeated code into a utility function",
      "repeated-block": "Extract repeated code into a helper function",
      "repeated-console": "Replace with appropriate logging levels",
      "unused-variable": "Remove unused variable or comment it out"
    };
    return suggestions[category] || "Consider refactoring this code";
  }
  /**
   * Get issue category title
   */
  getCategoryTitle(category) {
    const titles = {
      "debug-code": "Debug Code Found",
      "todo": "Unresolved TODO/FIXME",
      "hack": "Code Hack Detected",
      "long-function": "Function Too Long",
      "nested-if": "Deeply Nested Conditionals",
      "nested-loop": "Nested Loops",
      "complex-import": "Complex Import Statement",
      "require-statement": "Legacy Require Statement",
      "null-check": "Null/Undefined Check",
      "magic-number": "Magic Number",
      "increment": "Manual Increment",
      "forEach-loop": "forEach Usage",
      "push-in-loop": "Array Push in Loop",
      "dom-access": "DOM Access",
      "eval-statement": "eval() Usage",
      "innerHTML": "innerHTML Assignment",
      "document-write": "document.write() Usage",
      "regex-exec": "Regular Expression Execution",
      "repeated-function": "Repeated Function Code",
      "repeated-block": "Repeated Code Block",
      "repeated-console": "Repeated Console Statements",
      "unused-variable": "Unused Variable"
    };
    return titles[category] || "Code Quality Issue";
  }
};

// src/AIAnalyzer.ts
var AIAnalyzer = class {
  config;
  baseAnalyzer;
  constructor(config) {
    this.config = config;
    this.baseAnalyzer = new AIAnalyzerBase(config);
  }
  /**
   * Analyze a single file and return issues
   */
  async analyzeFile(filePath) {
    const content = await readFile(filePath, "utf-8");
    const extension = extname(filePath).toLowerCase();
    if (!this.isJavaScriptFile(extension)) {
      return [];
    }
    const issues = [];
    issues.push(...await this.analyzeSyntax(content, filePath));
    issues.push(...await this.analyzePatterns(content, filePath));
    issues.push(...await this.analyzeCodeStructure(content, filePath));
    issues.push(...await this.analyzeBestPractices(content, filePath));
    return issues;
  }
  /**
   * Analyze multiple files in parallel
   */
  async analyzeFiles(files) {
    const allIssues = [];
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
  isJavaScriptFile(extension) {
    return [".js", ".jsx", ".ts", ".tsx"].includes(extension);
  }
  /**
   * Analyze syntax issues
   */
  async analyzeSyntax(content, filePath) {
    const issues = [];
    const todoMatches = content.matchAll(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG):\s*(.+)$/gm);
    for (const match of todoMatches) {
      issues.push({
        type: "verification",
        severity: "medium",
        category: "todo",
        title: "Unresolved TODO/FIXME",
        description: `Found ${match[1]}: ${match[2]}`,
        file: filePath,
        line: content.substring(0, match.index).split("\n").length,
        column: match.index - content.lastIndexOf("\n", match.index),
        codeSnippet: match[0],
        fixable: false,
        suggestion: `Consider addressing ${match[1]}: ${match[2]}`,
        confidence: 0.8
      });
    }
    const magicNumberMatches = content.matchAll(/\b(\d+)\b(?![^\s]*%)/g);
    for (const match of magicNumberMatches) {
      const line = content.substring(0, match.index).split("\n").length;
      const lineContent = content.split("\n")[line - 1];
      if (this.isLikelyMagicNumber(lineContent, match.index)) {
        continue;
      }
      issues.push({
        type: "comprehension",
        severity: "low",
        category: "magic-number",
        title: "Magic Number",
        description: "Use named constants instead of magic numbers",
        file: filePath,
        line,
        column: match.index - content.lastIndexOf("\n", match.index),
        codeSnippet: match[0],
        fixable: true,
        suggestion: `Define a constant for ${match[0]}`,
        confidence: 0.9
      });
    }
    const functionMatches = content.matchAll(/(?:function\s+\w+\s*|\w+\s*\([^)]*\)\s*{)\s*([^{}]*\n{1,50})/g);
    for (const match of functionMatches) {
      const lines = match[1].split("\n").length;
      if (lines > 20) {
        issues.push({
          type: "architectural",
          severity: "medium",
          category: "long-function",
          title: "Function is too long",
          description: `Function has ${lines} lines, consider breaking it down`,
          file: filePath,
          line: content.substring(0, match.index).split("\n").length,
          column: match.index - content.lastIndexOf("\n", match.index),
          codeSnippet: match[0].substring(0, 200) + "...",
          fixable: true,
          suggestion: "Extract smaller functions from this large function",
          confidence: 0.85
        });
      }
    }
    return issues;
  }
  /**
   * Check if a number is likely a magic number
   */
  isLikelyMagicNumber(line, index) {
    const before = line.substring(0, index).trim();
    const after = line.substring(index + 1).trim();
    if (before.endsWith("[") && after.startsWith("]")) {
      return true;
    }
    if (before.endsWith(".") || before.endsWith("?.") || before.endsWith("?.")) {
      return true;
    }
    if (/[<>]=?==?/.test(before) || /==?<?/.test(after)) {
      return true;
    }
    if (/(\d+\.)+\d+/.test(line)) {
      return true;
    }
    return false;
  }
  /**
   * Analyze code patterns
   */
  async analyzePatterns(content, filePath) {
    const issues = [];
    const repeatedCode = await this.findRepeatedCode(content, filePath);
    issues.push(...repeatedCode);
    const complexConditionals = await this.findComplexConditionals(content, filePath);
    issues.push(...complexConditionals);
    const nestedLoops = await this.findNestedLoops(content, filePath);
    issues.push(...nestedLoops);
    return issues;
  }
  /**
   * Find repeated code blocks
   */
  async findRepeatedCode(content, filePath) {
    const issues = [];
    const lines = content.split("\n");
    const codeBlocks = /* @__PURE__ */ new Map();
    for (let i = 0; i < lines.length - 3; i++) {
      const block = lines.slice(i, i + 3).join("\n").trim();
      if (block.length > 50) {
        if (codeBlocks.has(block)) {
          codeBlocks.get(block).push(i + 1);
        } else {
          codeBlocks.set(block, [i + 1]);
        }
      }
    }
    for (const [block, lineNumbers] of codeBlocks) {
      if (lineNumbers.length > 1) {
        issues.push({
          type: "architectural",
          severity: "medium",
          category: "code-duplication",
          title: "Code duplication detected",
          description: `Found ${lineNumbers.length} similar code blocks`,
          file: filePath,
          line: lineNumbers[0],
          column: 0,
          codeSnippet: block.split("\n")[0],
          fixable: true,
          suggestion: "Extract repeated code into a function or utility",
          confidence: 0.9
        });
      }
    }
    return issues;
  }
  /**
   * Find complex conditional logic
   */
  async findComplexConditionals(content, filePath) {
    const issues = [];
    const conditionalMatches = content.matchAll(/\s+if\s*\([^)]+\)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g);
    for (const match of conditionalMatches) {
      const line = content.substring(0, match.index).split("\n").length;
      const nestingDepth = (match[0].match(/\{/g) || []).length;
      if (nestingDepth > 4) {
        issues.push({
          type: "architectural",
          severity: "medium",
          category: "complex-conditional",
          title: "Complex conditional logic",
          description: `Conditional has ${nestingDepth - 1} nesting levels`,
          file: filePath,
          line,
          column: match.index - content.lastIndexOf("\n", match.index),
          codeSnippet: match[0].substring(0, 100) + "...",
          fixable: true,
          suggestion: "Use guard clauses or extract to separate functions",
          confidence: 0.8
        });
      }
    }
    return issues;
  }
  /**
   * Find nested loops
   */
  async findNestedLoops(content, filePath) {
    const issues = [];
    const loopMatches = content.matchAll(/\s+(for|while)\s*\([^)]+\)\s*\{[^{}]*\}/g);
    const nestedLoops = [];
    let currentDepth = 0;
    for (const match of loopMatches) {
      const line = content.substring(0, match.index).split("\n").length;
      const isLoopStart = match[1].startsWith("f") || match[1].startsWith("w");
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
        type: "performance",
        severity: "medium",
        category: "nested-loop",
        title: "Nested loop detected",
        description: "Deeply nested loops can impact performance",
        file: filePath,
        line,
        column: 0,
        codeSnippet: "",
        fixable: true,
        suggestion: "Consider using built-in array methods or caching",
        confidence: 0.75
      });
    }
    return issues;
  }
  /**
   * Analyze code structure issues
   */
  async analyzeCodeStructure(content, filePath) {
    const issues = [];
    const importMatches = content.matchAll(/import\s+(.+?)\s+from\s+['"](.+?)['"]/g);
    for (const match of importMatches) {
      if (match[1].split(",").length > 5) {
        issues.push({
          type: "architectural",
          severity: "low",
          category: "complex-import",
          title: "Complex import statement",
          description: "Import statement has too many named imports",
          file: filePath,
          line: content.substring(0, match.index).split("\n").length,
          column: match.index - content.lastIndexOf("\n", match.index),
          codeSnippet: match[0],
          fixable: true,
          suggestion: "Split complex imports into multiple statements",
          confidence: 0.8
        });
      }
    }
    const objectNesting = content.matchAll(/\{[^{}]*\{[^{}]*\{[^{}]*\}/g);
    for (const match of objectNesting) {
      issues.push({
        type: "comprehension",
        severity: "medium",
        category: "deep-nesting",
        title: "Deeply nested objects",
        description: "Objects have more than 2 levels of nesting",
        file: filePath,
        line: content.substring(0, match.index).split("\n").length,
        column: match.index - content.lastIndexOf("\n", match.index),
        codeSnippet: match[0].substring(0, 100) + "...",
        fixable: true,
        suggestion: "Flatten nested objects or use data classes",
        confidence: 0.7
      });
    }
    return issues;
  }
  /**
   * Analyze best practices
   */
  async analyzeBestPractices(content, filePath) {
    const issues = [];
    const consoleLogMatches = content.matchAll(/console\.(log|warn|error|debug)\([^)]*\)/g);
    for (const match of consoleLogMatches) {
      issues.push({
        type: "verification",
        severity: "low",
        category: "debug-code",
        title: "Debug code found",
        description: "Console statements should be removed from production code",
        file: filePath,
        line: content.substring(0, match.index).split("\n").length,
        column: match.index - content.lastIndexOf("\n", match.index),
        codeSnippet: match[0],
        fixable: true,
        suggestion: "Remove console statements or replace with proper logging",
        confidence: 0.9
      });
    }
    const unusedVars = await this.findUnusedVariables(content, filePath);
    issues.push(...unusedVars);
    return issues;
  }
  /**
   * Find unused variables
   */
  async findUnusedVariables(content, filePath) {
    const issues = [];
    const declarationRegex = /(?:let|const|var)\s+(\w+)/g;
    const declarations = [];
    for (const match of content.matchAll(declarationRegex)) {
      declarations.push({ name: match[1], index: match.index });
    }
    for (const decl of declarations) {
      const { name, index } = decl;
      const usageAfterDecl = content.substring(index + name.length).matchAll(new RegExp(`\\b${name}\\b`, "g"));
      if (usageAfterDecl) {
        const usages = Array.from(usageAfterDecl);
        if (usages.length === 0) {
          const line = content.substring(0, index).split("\n").length + 1;
          const column = index - content.lastIndexOf("\n", index) - 1;
          issues.push({
            type: "verification",
            severity: "low",
            category: "unused-variable",
            title: "Unused variable",
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
};

// src/AIFixer.ts
import { readFile as readFile2, writeFile } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
var AIFixer = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Generate a refactoring suggestion for a specific issue
   */
  async generateSuggestion(issue, projectPath) {
    const id = this.generateId();
    const context = await this.getCodeContext(issue, projectPath);
    const beforeCode = context;
    let afterCode = beforeCode;
    let explanation = "";
    let suggestedChanges = [];
    switch (issue.category) {
      case "magic-number":
        ({ afterCode, explanation, suggestedChanges } = await this.fixMagicNumber(issue, context));
        break;
      case "long-function":
        ({ afterCode, explanation, suggestedChanges } = await this.fixLongFunction(issue, context));
        break;
      case "code-duplication":
        ({ afterCode, explanation, suggestedChanges } = await this.fixCodeDuplication(issue, context));
        break;
      case "complex-conditional":
        ({ afterCode, explanation, suggestedChanges } = await this.fixComplexConditional(issue, context));
        break;
      case "nested-loop":
        ({ afterCode, explanation, suggestedChanges } = await this.fixNestedLoop(issue, context));
        break;
      case "debug-code":
        ({ afterCode, explanation, suggestedChanges } = await this.fixDebugCode(issue, context));
        break;
      case "unused-variable":
        ({ afterCode, explanation, suggestedChanges } = await this.fixUnusedVariable(issue, context));
        break;
      case "complex-import":
        ({ afterCode, explanation, suggestedChanges } = await this.fixComplexImport(issue, context));
        break;
      case "null-check":
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
  async applySuggestion(suggestion, options) {
    const { issue, changes } = suggestion;
    const filePath = issue.file;
    const currentContent = await readFile2(filePath, "utf-8");
    const lines = currentContent.split("\n");
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];
      await this.applyFileChange(change, lines, options);
    }
    const newContent = lines.join("\n");
    await writeFile(filePath, newContent);
  }
  /**
   * Generate a unique ID for a suggestion
   */
  generateId() {
    return `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Get code context around an issue
   */
  async getCodeContext(issue, projectPath) {
    try {
      const fullContent = await readFile2(issue.file, "utf-8");
      const lines = fullContent.split("\n");
      const startLine = Math.max(0, issue.line - 3);
      const endLine = Math.min(lines.length, issue.line + 3);
      const contextLines = lines.slice(startLine, endLine);
      return contextLines.join("\n");
    } catch (error) {
      return `// Error reading file: ${error.message}
`;
    }
  }
  /**
   * Fix magic numbers by replacing with named constants
   */
  async fixMagicNumber(issue, context) {
    const magicNumberMatch = context.match(/\b(\d+)\b/);
    if (!magicNumberMatch) {
      return this.generateGenericFix(issue, context);
    }
    const magicNumber = magicNumberMatch[0];
    const constantName = this.constantNameForNumber(magicNumber);
    const explanation = `Replace magic number ${magicNumber} with constant ${constantName}`;
    const afterCode = context.replace(new RegExp(`\\b${magicNumber}\\b`, "g"), constantName);
    const suggestedChanges = [{
      file: issue.file,
      operation: "insert",
      line: Math.max(1, issue.line - 2),
      content: `const ${constantName} = ${magicNumber}; // Magic number extracted`,
      description: "Add named constant for magic number"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Generate a constant name for a number
   */
  constantNameForNumber(number) {
    if (number === "1000") return "DEFAULT_TIMEOUT";
    if (number === "100") return "MAX_RETRIES";
    if (number === "5000") return "CACHE_SIZE";
    if (number === "200") return "MAX_CONNECTIONS";
    if (number === "30000") return "DEFAULT_DELAY";
    return `CONST_${number.toUpperCase()}`;
  }
  /**
   * Fix long functions by extracting smaller functions
   */
  async fixLongFunction(issue, context) {
    const functionNameMatch = context.match(/(?:function\s+(\w+)|(\w+)\s*\([^)]*\))/);
    const functionName = functionNameMatch ? functionNameMatch[1] || functionNameMatch[2] : "extracted";
    const explanation = `Extract part of the long function into a smaller function "${functionName}Extracted"`;
    const lines = context.split("\n");
    const extractedFunction = lines.slice(1, 4).join("\n");
    const afterCode = context.replace(extractedFunction, "");
    const suggestedChanges = [{
      file: issue.file,
      operation: "insert",
      line: Math.max(1, issue.line - 1),
      content: `
function ${functionName}Extracted() {
${extractedFunction}
}`,
      description: `Extract function ${functionName}Extracted from long function`
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix code duplication by extracting to a common function
   */
  async fixCodeDuplication(issue, context) {
    const explanation = "Extract duplicated code into a common utility function";
    const functionName = `extractedFunction${Date.now()}`;
    const functionCode = context.trim();
    const afterCode = context.replace(functionCode, `// Call ${functionName}() here`);
    const suggestedChanges = [{
      file: issue.file,
      operation: "insert",
      line: 1,
      content: `function ${functionName}() {
${functionCode}
}
`,
      description: `Extract duplicated code into ${functionName}()`
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix complex conditionals by using guard clauses
   */
  async fixComplexConditional(issue, context) {
    const explanation = "Refactor complex conditional using guard clauses";
    const conditionalMatch = context.match(/if\s*\(([^)]+)\)\s*\{([^}]*)\}/);
    if (!conditionalMatch) {
      return this.generateGenericFix(issue, context);
    }
    const condition = conditionalMatch[1];
    const body = conditionalMatch[2];
    const afterCode = `if (!${condition}) return;
${body}`;
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Replace complex conditional with guard clause"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix nested loops by using built-in methods
   */
  async fixNestedLoop(issue, context) {
    const explanation = "Replace nested loop with built-in array methods";
    const nestedLoopMatch = context.match(/for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/);
    if (!nestedLoopMatch) {
      return this.generateGenericFix(issue, context);
    }
    const afterCode = context.replace(
      /for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/,
      "array.flatMap()"
    );
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Replace nested loop with flatMap"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Remove debug code (console statements)
   */
  async fixDebugCode(issue, context) {
    const explanation = "Remove console.debug statement";
    const afterCode = context.replace(/console\.(log|warn|error|debug)\([^)]*\);\s*\n?/g, "");
    const suggestedChanges = [{
      file: issue.file,
      operation: "delete",
      line: issue.line,
      content: "",
      description: "Remove console statement"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Remove unused variables
   */
  async fixUnusedVariable(issue, context) {
    const explanation = "Remove unused variable";
    const varMatch = context.match(/(?:let|const|var)\s+(\w+)/);
    if (!varMatch) {
      return this.generateGenericFix(issue, context);
    }
    const varName = varMatch[1];
    const afterCode = context.replace(new RegExp(`\\b(let|const|var)\\s+${varName}\\s*[=;].*`, "g"), "");
    const suggestedChanges = [{
      file: issue.file,
      operation: "delete",
      line: issue.line,
      content: "",
      description: `Remove unused variable ${varName}`
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix complex imports by splitting them
   */
  async fixComplexImport(issue, context) {
    const explanation = "Split complex import into multiple statements";
    const importMatch = context.match(/import\s+{([^}]+)}\s+from/);
    if (!importMatch) {
      return this.generateGenericFix(issue, context);
    }
    const imports = importMatch[1].split(",").map((i) => i.trim());
    const firstImport = imports[0];
    const afterCode = context.replace(
      /import\s+{[^}]+}\s+from/,
      `import ${firstImport} from`
    );
    const additionalImports = imports.slice(1).map(
      (imp) => `import ${imp} from '${context.match(/from\s+['"]([^'"]+)['"]/)?.[1] || "module"}'`
    ).join("\n");
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Split complex import statement"
    }, {
      file: issue.file,
      operation: "insert",
      line: issue.line + 1,
      content: additionalImports,
      description: "Add remaining imports"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Fix null checks by using optional chaining
   */
  async fixNullCheck(issue, context) {
    const explanation = "Replace null check with optional chaining";
    const nullCheckMatch = context.match(/null\s*===?\s*(\w+)/);
    if (!nullCheckMatch) {
      return this.generateGenericFix(issue, context);
    }
    const variable = nullCheckMatch[1];
    const afterCode = context.replace(
      /null\s*===?\s*(\w+)/,
      `${variable}?.`
    );
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Replace null check with optional chaining"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Generate a generic fix for unknown issue types
   */
  async generateGenericFix(issue, context) {
    const explanation = "Generic refactoring suggestion";
    const afterCode = context.replace(issue.codeSnippet, "// TODO: Refactor this code");
    const suggestedChanges = [{
      file: issue.file,
      operation: "replace",
      line: issue.line,
      content: afterCode,
      description: "Generic placeholder for refactoring"
    }];
    return { afterCode, explanation, suggestedChanges };
  }
  /**
   * Calculate estimated savings from a refactoring
   */
  calculateSavings(beforeCode, afterCode) {
    const beforeLines = beforeCode.split("\n").length;
    const afterLines = afterCode.split("\n").length;
    const beforeChars = beforeCode.length;
    const afterChars = afterCode.length;
    const linesSaved = Math.max(0, beforeLines - afterLines);
    const charsSaved = Math.max(0, beforeChars - afterChars);
    const percentage = beforeLines > 0 ? Math.round(linesSaved / beforeLines * 100) : 0;
    return {
      lines: linesSaved,
      characters: charsSaved,
      percentage
    };
  }
  /**
   * Apply a file change to the lines array
   */
  async applyFileChange(change, lines, options) {
    const { file, operation, line, content, description } = change;
    switch (operation) {
      case "insert":
        lines.splice(line - 1, 0, content);
        if (options.verbose) {
          console.log(`\u2713 Inserted in ${file}: ${description}`);
        }
        break;
      case "delete":
        if (lines[line - 1]) {
          lines.splice(line - 1, 1);
          if (options.verbose) {
            console.log(`\u2713 Deleted from ${file}: ${description}`);
          }
        }
        break;
      case "replace":
        if (lines[line - 1]) {
          lines.splice(line - 1, 1, content);
          if (options.verbose) {
            console.log(`\u2713 Replaced in ${file}: ${description}`);
          }
        }
        break;
    }
  }
};

// src/FileProcessor.ts
import { readdir, readFile as readFile3, stat as stat2 } from "fs/promises";
import { join, extname as extname2, relative } from "path";
var FileProcessor = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Find all files to analyze based on config patterns
   */
  async findFiles(rootPath) {
    const files = [];
    const processedDirs = /* @__PURE__ */ new Set();
    const patterns = this.config.patterns || ["**/*.{js,ts,jsx,tsx}"];
    const ignorePatterns = this.config.ignore || [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/.git/**",
      "**/.next/**",
      "**/.nuxt/**",
      "**/coverage/**",
      "**/logs/**"
    ];
    for (const pattern of patterns) {
      const foundFiles = await this.findFilesByPattern(rootPath, pattern, ignorePatterns);
      files.push(...foundFiles);
    }
    const uniqueFiles = Array.from(new Set(files));
    if (this.config.maxFiles && uniqueFiles.length > this.config.maxFiles) {
      uniqueFiles.splice(this.config.maxFiles);
    }
    return uniqueFiles;
  }
  /**
   * Find files matching a specific pattern
   */
  async findFilesByPattern(rootPath, pattern, ignorePatterns) {
    const files = [];
    if (pattern.includes("**") || pattern.includes("*")) {
      await this.walkDirectory(rootPath, pattern, ignorePatterns, files);
    } else {
      const files2 = await this.findFilesByExtension(rootPath, pattern, ignorePatterns);
    }
    return files;
  }
  /**
   * Walk directory and collect files matching pattern
   */
  async walkDirectory(dir, pattern, ignorePatterns, files, currentDepth = 0) {
    if (currentDepth >= (this.config.depth || 10)) {
      return;
    }
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(process.cwd(), fullPath);
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
      console.warn(`Could not read directory ${dir}: ${error.message}`);
    }
  }
  /**
   * Find files by specific extension
   */
  async findFilesByExtension(rootPath, extension, ignorePatterns) {
    const files = [];
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
        } else if (entry.isFile() && extname2(fullPath) === extension) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${rootPath}: ${error.message}`);
    }
    return files;
  }
  /**
   * Check if a path should be ignored based on ignore patterns
   */
  shouldIgnorePath(path, ignorePatterns) {
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
  matchesPattern(path, pattern) {
    if (!pattern.includes("*") && !pattern.includes("?") && !pattern.includes("[") && !pattern.includes("{")) {
      return path === pattern || path.endsWith(pattern);
    }
    const regexPattern = this.globToRegex(pattern);
    const regex = new RegExp(regexPattern);
    return regex.test(path);
  }
  /**
   * Convert glob pattern to regex
   */
  globToRegex(glob) {
    let regex = glob;
    regex = regex.replace(/\*\*/g, "__DOUBLE_STAR__");
    regex = regex.replace(/\*/g, "__STAR__");
    regex = regex.replace(/\?/g, "__QUESTION__");
    regex = regex.replace(/\{([^}]+)\}/g, "__ALT_START__$1__ALT_END__");
    regex = regex.replace(/[-\/\\^$.+()|[\]{}]/g, "\\$&");
    regex = regex.replace(/__ALT_START__(.*?)__ALT_END__/g, (match, content) => {
      const alternatives = content.split(",").map((a) => a.trim()).join("|");
      return `(?:${alternatives})`;
    });
    regex = regex.replace(/__DOUBLE_STAR__/g, ".*");
    regex = regex.replace(/__STAR__/g, "[^/]*");
    regex = regex.replace(/__QUESTION__/g, "[^/]");
    return `^${regex}$`;
  }
  /**
   * Read file content with error handling
   */
  async readFileContent(filePath) {
    try {
      const content = await readFile3(filePath, "utf-8");
      return content;
    } catch (error) {
      throw new Error(`Could not read file ${filePath}: ${error.message}`);
    }
  }
  /**
   * Get file statistics
   */
  async getFileStats(filePath) {
    try {
      const stats = await stat2(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      throw new Error(`Could not get stats for ${filePath}: ${error.message}`);
    }
  }
  /**
   * Analyze file for patterns
   */
  async analyzePatterns(filePath) {
    const content = await this.readFileContent(filePath);
    const patterns = [];
    const patternDefinitions = [
      { regex: /import\s+{[^}]+}\s+from/g, type: "code" },
      { regex: /require\([^)]+\)/g, type: "code" },
      { regex: /console\.[\w]+\([^)]*\)/g, type: "code" },
      { regex: /TODO\s*:\s*/gm, type: "comment" },
      { regex: /FIXME\s*:\s*/gm, type: "comment" },
      { regex: /\bfunction\s+\w+\s*\(/g, type: "code" },
      { regex: /\b(class|interface|type)\s+\w+/g, type: "code" },
      { regex: /\b(let|const|var)\s+\w+/g, type: "code" },
      { regex: /\/\*[\s\S]*?\*\//g, type: "comment" },
      { regex: /\/\/.*$/gm, type: "comment" },
      { regex: /['"`][^'"`]*['"`]/g, type: "string" }
    ];
    for (const patternDef of patternDefinitions) {
      let match;
      while ((match = patternDef.regex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split("\n").length;
        const column = match.index - content.lastIndexOf("\n", match.index);
        patterns.push({
          file: filePath,
          matches: [{
            pattern: patternDef.regex.source,
            match: match[0],
            line,
            column,
            context: this.getContext(content, match.index, 50)
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
  getContext(content, index, radius) {
    const start = Math.max(0, index - radius);
    const end = Math.min(content.length, index + radius);
    return content.substring(start, end);
  }
  /**
   * Get file information
   */
  async getFileInfo(filePath) {
    const stats = await this.getFileStats(filePath);
    const content = await this.readFileContent(filePath);
    const extension = extname2(filePath);
    const lines = content.split("\n").length;
    const hasTests = filePath.includes(".test.") || filePath.includes(".spec.");
    const hasTypeScript = [".ts", ".tsx"].includes(extension);
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
  estimateComplexity(content) {
    let complexity = 1;
    const controlStructures = content.match(/\b(if|for|while|switch|case|try|catch)\b/g);
    if (controlStructures) {
      complexity += controlStructures.length;
    }
    const functions = content.match(/\b(function\s+\w+|\w+\s*\([^)]*\)\s*{|class\s+\w+)/g);
    if (functions) {
      complexity += functions.length;
    }
    const nestingMatches = content.match(/{/g);
    const maxNesting = nestingMatches ? nestingMatches.length / 10 : 0;
    complexity += maxNesting;
    return Math.round(complexity);
  }
  /**
   * Batch process multiple files
   */
  async batchProcess(filePaths) {
    const files = [];
    const errors = [];
    let processed = 0;
    let skipped = 0;
    for (const filePath of filePaths) {
      try {
        const fileInfo = await this.getFileInfo(filePath);
        const patterns = await this.analyzePatterns(filePath);
        files.push({
          ...fileInfo,
          patterns,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        processed++;
      } catch (error) {
        errors.push(`Error processing ${filePath}: ${error.message}`);
        skipped++;
      }
    }
    return { files, errors, processed, skipped };
  }
  /**
   * Create backup of files
   */
  async createBackup(filePaths, backupDir) {
    const backupFiles = [];
    try {
      const { mkdir: mkdir3 } = await import("fs/promises");
      await mkdir3(backupDir, { recursive: true });
    } catch (error) {
    }
    for (const filePath of filePaths) {
      try {
        const relativePath = relative(process.cwd(), filePath);
        const backupPath = join(backupDir, relativePath);
        const backupDirPath = dirname(backupPath);
        await mkdir(backupDirPath, { recursive: true });
        const { copyFile: copyFile2 } = await import("fs/promises");
        await copyFile2(filePath, backupPath);
        backupFiles.push(backupPath);
      } catch (error) {
        console.warn(`Could not backup ${filePath}: ${error.message}`);
      }
    }
    return backupFiles;
  }
};

// src/OutputFormatter.ts
var OutputFormatter = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Format analysis result based on configured output format
   */
  formatReport(result) {
    switch (this.config.outputFormat) {
      case "json":
        return this.formatJSON(result);
      case "markdown":
        return this.formatMarkdown(result);
      case "console":
      default:
        return this.formatConsole(result);
    }
  }
  /**
   * Format analysis result as JSON
   */
  formatJSON(result) {
    const report = {
      metadata: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        totalFiles: result.totalFiles,
        totalIssues: result.summary.totalIssues,
        fixableIssues: result.summary.fixableIssues,
        criticalIssues: result.summary.criticalIssues,
        estimatedSavings: result.summary.estimatedSavings,
        estimatedTime: result.summary.estimatedTime
      },
      issues: result.issues.map((issue) => ({
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
      suggestions: result.suggestions.map((suggestion) => ({
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
  formatMarkdown(result) {
    let markdown = `# AI Refactor Report

`;
    markdown += `Generated: ${(/* @__PURE__ */ new Date()).toISOString()}
`;
    markdown += `Files analyzed: ${result.totalFiles}

`;
    markdown += `## Summary

`;
    markdown += `- Total Issues: ${result.summary.totalIssues}
`;
    markdown += `- Fixable Issues: ${result.summary.fixableIssues}
`;
    markdown += `- Critical Issues: ${result.summary.criticalIssues}
`;
    markdown += `- Potential Savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)
`;
    markdown += `- Estimated Time: ${result.summary.estimatedTime}

`;
    const issuesByCategory = result.issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {});
    markdown += `## Issues by Category

`;
    Object.entries(issuesByCategory).sort(([, a], [, b]) => b - a).forEach(([category, count]) => {
      markdown += `- ${category}: ${count}
`;
    });
    markdown += "\n";
    if (result.issues.length > 0) {
      markdown += `## Detailed Issues

`;
      for (const issue of result.issues.slice(0, 10)) {
        markdown += `### ${issue.title}

`;
        markdown += `- **File:** ${issue.file}:${issue.line}
`;
        markdown += `- **Category:** ${issue.category}
`;
        markdown += `- **Severity:** ${issue.severity}
`;
        markdown += `- **Confidence:** ${Math.round(issue.confidence * 100)}%
`;
        markdown += `- **Fixable:** ${issue.fixable ? "Yes" : "No"}

`;
        if (issue.description) {
          markdown += `**Description:** ${issue.description}

`;
        }
        if (issue.codeSnippet) {
          markdown += `\`\`\`
${issue.codeSnippet}
\`\`\`

`;
        }
        if (issue.suggestion) {
          markdown += `**Suggestion:** ${issue.suggestion}

`;
        }
        if (issue.fixable) {
          markdown += `\u{1F527} **Fixable:** Yes

`;
        } else {
          markdown += `\u26A0\uFE0F **Requires manual review**

`;
        }
        markdown += `---

`;
      }
      if (result.issues.length > 10) {
        markdown += `... and ${result.issues.length - 10} more issues

`;
      }
    }
    if (result.suggestions.length > 0) {
      markdown += `## Refactoring Suggestions

`;
      for (const suggestion of result.suggestions.slice(0, 5)) {
        markdown += `### ${suggestion.issue.title}

`;
        markdown += `- **File:** ${suggestion.issue.file}:${suggestion.issue.line}
`;
        markdown += `- **Category:** ${suggestion.issue.category}
`;
        markdown += `- **Savings:** ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)
`;
        markdown += `- **Confidence:** ${Math.round(suggestion.confidence * 100)}%

`;
        if (suggestion.explanation) {
          markdown += `**Explanation:** ${suggestion.explanation}

`;
        }
        if (suggestion.beforeCode && suggestion.afterCode) {
          markdown += `**Before:**
\`\`\`
${suggestion.beforeCode}
\`\`\`

`;
          markdown += `**After:**
\`\`\`
${suggestion.afterCode}
\`\`\`

`;
        }
        markdown += `---

`;
      }
      if (result.suggestions.length > 5) {
        markdown += `... and ${result.suggestions.length - 5} more suggestions

`;
      }
    }
    if (result.warnings.length > 0) {
      markdown += `## Warnings

`;
      result.warnings.forEach((warning) => {
        markdown += `- ${warning}
`;
      });
      markdown += "\n";
    }
    if (result.errors.length > 0) {
      markdown += `## Errors

`;
      result.errors.forEach((error) => {
        markdown += `- ${error}
`;
      });
      markdown += "\n";
    }
    return markdown;
  }
  /**
   * Format analysis result for console output
   */
  formatConsole(result) {
    let output = "";
    output += "\u{1F50D} AI Refactor Analysis Report\n";
    output += "=".repeat(30) + "\n";
    output += `\u{1F4C1} Files analyzed: ${result.totalFiles}
`;
    output += `\u{1F50D} Issues found: ${result.summary.totalIssues}
`;
    output += `\u{1F527} Fixable issues: ${result.summary.fixableIssues}
`;
    output += `\u{1F680} Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)
`;
    output += `\u23F1\uFE0F  Estimated time: ${result.summary.estimatedTime}

`;
    if (result.issues.length > 0) {
      const issuesByCategory = result.issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {});
      output += "\u{1F4CA} Issues by Category:\n";
      Object.entries(issuesByCategory).sort(([, a], [, b]) => b - a).forEach(([category, count]) => {
        output += `  \u2022 ${category}: ${count}
`;
      });
      output += "\n";
    }
    if (result.issues.length > 0) {
      output += "\u26A0\uFE0F Top Issues:\n";
      output += "-".repeat(12) + "\n";
      for (const issue of result.issues.slice(0, 5)) {
        output += `  ${issue.severity.toUpperCase()} - ${issue.title}
`;
        output += `    ${issue.file}:${issue.line} (${issue.category})
`;
        if (issue.description) {
          output += `    ${issue.description}
`;
        }
        output += "\n";
      }
      if (result.issues.length > 5) {
        output += `  ... and ${result.issues.length - 5} more issues

`;
      }
    }
    if (result.suggestions.length > 0) {
      output += "\u{1F4A1} Refactoring Suggestions:\n";
      output += "-".repeat(24) + "\n";
      for (const suggestion of result.suggestions.slice(0, 3)) {
        output += `  ${suggestion.issue.title}
`;
        output += `    ${suggestion.issue.file}:${suggestion.issue.line}
`;
        output += `    ${suggestion.explanation}
`;
        output += `    Savings: ${suggestion.estimatedSavings.lines} lines
`;
        output += "    Apply: ai-refactor-x refactor --fix\n";
        output += "    Preview: ai-refactor-x suggest\n\n";
      }
      if (result.suggestions.length > 3) {
        output += `  ... and ${result.suggestions.length - 3} more suggestions

`;
      }
    }
    output += "\u{1F3AF} Recommendations:\n";
    output += "  ai-refactor-x refactor --fix\n";
    output += "  ai-refactor-x fix\n\n";
    if (result.suggestions.length > 0) {
      output += "To preview fixes, use:\n";
      output += "  ai-refactor-x suggest\n\n";
    }
    output += "For more help: ai-refactor-x --help\n";
    return output;
  }
};

// src/AIRefactor.ts
var execAsync2 = promisify2(exec2);
var AIRefactor = class {
  config;
  analyzer;
  fixer;
  fileProcessor;
  formatter;
  constructor(config = {}) {
    this.config = {
      patterns: ["**/*.{js,ts,jsx,tsx}"],
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/*.test.*", "**/*.spec.*"],
      depth: 10,
      maxFiles: 1e3,
      outputFormat: "console",
      aiProvider: "openai",
      model: "gpt-4",
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
  async analyze(path, config) {
    const finalConfig = { ...this.config, ...config };
    try {
      await stat3(path);
    } catch {
      throw new Error(`Analysis failed: Path '${path}' does not exist`);
    }
    const files = await this.fileProcessor.findFiles(path);
    const issues = [];
    const warnings = [];
    const errors = [];
    for (const file of files) {
      try {
        const fileIssues = await this.analyzer.analyzeFile(file);
        issues.push(...fileIssues);
      } catch (error) {
        const message = `Error analyzing ${file}: ${error.message}`;
        errors.push(message);
        warnings.push(`Skipped ${file} due to error`);
      }
    }
    const suggestions = [];
    const fixableIssues = issues.filter((issue) => issue.fixable);
    for (const issue of fixableIssues) {
      try {
        const suggestion = await this.fixer.generateSuggestion(issue, path);
        suggestions.push(suggestion);
      } catch (error) {
        warnings.push(`Could not generate fix for ${issue.title}: ${error.message}`);
      }
    }
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
  async refactor(path, options = {}) {
    const finalOptions = {
      fix: false,
      interactive: true,
      backup: true,
      dryRun: false,
      output: "",
      verbose: false,
      yes: false,
      ...options
    };
    const result = await this.analyze(path);
    if (finalOptions.dryRun) {
      return result;
    }
    if (finalOptions.backup) {
      await this.createBackup(path);
    }
    if (finalOptions.fix) {
      await this.applyFixes(result.suggestions, finalOptions);
    }
    return result;
  }
  /**
   * Fix specific issues
   */
  async fix(path, issues) {
    if (!issues) {
      const analysis = await this.analyze(path);
      issues = analysis.issues.filter((issue) => issue.fixable);
    }
    const result = {
      files: [],
      totalFiles: 0,
      issues,
      suggestions: [],
      summary: this.calculateSummary(issues, []),
      warnings: [],
      errors: []
    };
    await this.applyFixes(result.suggestions, { fix: true, backup: true, dryRun: false, verbose: true, interactive: false, output: "", yes: true });
    return result;
  }
  /**
   * Generate refactoring suggestions
   */
  async suggest(path, issues) {
    if (!issues) {
      const analysis = await this.analyze(path);
      issues = analysis.issues.filter((issue) => issue.fixable);
    }
    const suggestions = [];
    for (const issue of issues) {
      try {
        const suggestion = await this.fixer.generateSuggestion(issue, path);
        suggestions.push(suggestion);
      } catch (error) {
        console.warn(`Could not generate suggestion for ${issue.title}: ${error.message}`);
      }
    }
    return suggestions;
  }
  /**
   * Calculate summary statistics
   */
  calculateSummary(issues, suggestions) {
    const totalIssues = issues.length;
    const fixableIssues = issues.filter((issue) => issue.fixable).length;
    const criticalIssues = issues.filter((issue) => issue.severity === "critical").length;
    const totalLinesChanged = suggestions.reduce((sum, suggestion) => sum + suggestion.estimatedSavings.lines, 0);
    const totalCharactersChanged = suggestions.reduce((sum, suggestion) => sum + suggestion.estimatedSavings.characters, 0);
    const estimatedMinutes = Math.ceil(totalIssues * 2 + suggestions.length * 5);
    const estimatedTime = `${estimatedMinutes} minute${estimatedMinutes !== 1 ? "s" : ""}`;
    return {
      totalIssues,
      fixableIssues,
      criticalIssues,
      estimatedSavings: {
        lines: totalLinesChanged,
        characters: totalCharactersChanged,
        percentage: totalIssues > 0 ? Math.round(fixableIssues / totalIssues * 100) : 0
      },
      estimatedTime
    };
  }
  /**
   * Create backup of directory
   */
  async createBackup(path) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const backupPath = `${path}.backup.${timestamp}`;
    try {
      await execAsync2(`cp -r "${path}" "${backupPath}"`);
      console.log(`Backup created: ${backupPath}`);
    } catch (error) {
      console.warn(`Could not create backup: ${error.message}`);
    }
  }
  /**
   * Apply fixes to files
   */
  async applyFixes(suggestions, options) {
    for (const suggestion of suggestions) {
      try {
        await this.fixer.applySuggestion(suggestion, options);
        if (options.verbose) {
          console.log(`\u2713 Applied fix for: ${suggestion.issue.title}`);
          console.log(`  ${suggestion.explanation}`);
          console.log(`  Saved ~${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)`);
        }
      } catch (error) {
        console.error(`\u2717 Failed to apply fix for ${suggestion.issue.title}: ${error.message}`);
      }
    }
  }
  /**
   * Generate report
   */
  async generateReport(result, outputPath) {
    const report = this.formatter.formatReport(result);
    if (outputPath) {
      await writeFile2(outputPath, report);
      console.log(`Report saved to: ${outputPath}`);
    } else {
      console.log(report);
    }
  }
  /**
   * Format analysis result for console output
   */
  formatConsole(result) {
    let output = "\u{1F916} AI Refactor Analysis Report\n";
    output += "==================================================\n\n";
    output += "\u{1F4CA} Summary\n";
    output += "--------------------\n";
    output += `Files analyzed: ${result.totalFiles}
`;
    output += `Total issues: ${result.summary.totalIssues}
`;
    output += `Fixable issues: ${result.summary.fixableIssues}
`;
    output += `Critical issues: ${result.summary.criticalIssues}
`;
    output += `Estimated time: ${result.summary.estimatedTime}
`;
    output += `Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)

`;
    output += "\u{1F50D} Issues by Severity\n";
    const severityCount = { critical: 0, high: 0, medium: 0, low: 0 };
    result.issues.forEach((issue) => {
      severityCount[issue.severity]++;
    });
    const severityEmojis = { critical: "\u{1F534}", high: "\u{1F7E0}", medium: "\u{1F7E1}", low: "\u{1F7E2}" };
    Object.entries(severityCount).forEach(([severity, count]) => {
      if (count > 0) {
        output += `${severityEmojis[severity]} ${severity.toUpperCase()}: ${count} issues
`;
      }
    });
    return output;
  }
  /**
   * Format result for Markdown output
   */
  formatMarkdown(result) {
    let output = "# AI Refactor Analysis Report\n\n";
    output += `**Generated:** ${(/* @__PURE__ */ new Date()).toISOString()}
`;
    output += `**Files Analyzed:** ${result.totalFiles}

`;
    output += "## Summary\n\n";
    output += "| Metric | Value |\n";
    output += "|--------|-------|\n";
    output += `| Total Issues | ${result.summary.totalIssues} |
`;
    output += `| Fixable Issues | ${result.summary.fixableIssues} |
`;
    output += `| Critical Issues | ${result.summary.criticalIssues} |
`;
    output += `| Estimated Savings | ${result.summary.estimatedSavings.lines} lines |
`;
    output += `| Estimated Time | ${result.summary.estimatedTime} |
`;
    output += `| Savings Percentage | ${result.summary.estimatedSavings.percentage}% |

`;
    output += "## Issues Found\n\n";
    output += "| Severity | Category | File | Line | Description |\n";
    output += "|----------|----------|------|------|-------------|\n";
    result.issues.slice(0, 10).forEach((issue) => {
      const severityEmoji = { critical: "\u{1F534}", high: "\u{1F7E0}", medium: "\u{1F7E1}", low: "\u{1F7E2}" }[issue.severity];
      output += `| ${severityEmoji} | ${issue.category} | ${issue.file} | ${issue.line} | ${issue.title} |
`;
    });
    if (result.issues.length > 10) {
      output += `| ... | ... | ... | ... | ... (${result.issues.length - 10} more) |
`;
    }
    return output;
  }
  /**
   * Format suggestions for output
   */
  formatSuggestions(suggestions) {
    let output = "\u{1F527} Refactoring Suggestions\n";
    output += "==================================================\n\n";
    output += `Found ${suggestions.length} suggestions:

`;
    suggestions.forEach((suggestion, index) => {
      output += `${index + 1}. ${suggestion.issue.title}
`;
      output += `   File: ${suggestion.issue.file}:${suggestion.issue.line}
`;
      output += `   Severity: ${suggestion.issue.severity}
`;
      output += `   Confidence: ${Math.round(suggestion.confidence * 100)}%
`;
      output += `   Estimated savings: ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)
`;
      output += `   ${suggestion.explanation}

`;
    });
    return output;
  }
  /**
   * Format refactor result
   */
  formatRefactor(result) {
    let output = "\u{1F527} Refactoring Complete\n";
    output += "==================================================\n\n";
    output += "\u{1F4CA} Results\n";
    output += "--------------------\n";
    output += `Files processed: ${result.totalFiles}
`;
    output += `Total issues: ${result.summary.totalIssues}
`;
    output += `Fixed issues: ${result.summary.fixableIssues}
`;
    output += `Critical issues resolved: ${result.summary.criticalIssues}
`;
    output += `Lines saved: ${result.summary.estimatedSavings.lines} (${result.summary.estimatedSavings.percentage}%)
`;
    output += `Time saved: ${result.summary.estimatedTime}

`;
    if (result.warnings.length > 0) {
      output += "\u26A0\uFE0F Warnings\n";
      result.warnings.forEach((warning) => {
        output += `- ${warning}
`;
      });
      output += "\n";
    }
    if (result.errors.length > 0) {
      output += "\u274C Errors\n";
      result.errors.forEach((error) => {
        output += `- ${error}
`;
      });
    }
    return output;
  }
  /**
   * Format fix result
   */
  formatFix(result) {
    return this.formatRefactor(result);
  }
  /**
   * Format info result
   */
  formatInfo(result) {
    let output = "\u{1F4CA} Codebase Information\n";
    output += "==================================================\n\n";
    output += "\u{1F4C1} Overview\n";
    output += "--------------------\n";
    output += `Total files: ${result.totalFiles}
`;
    output += `Issues found: ${result.summary.totalIssues}
`;
    output += `Fixable issues: ${result.summary.fixableIssues}
`;
    output += `Critical issues: ${result.summary.criticalIssues}

`;
    output += "\u{1F4C8} By Category\n";
    output += "--------------------\n";
    const categories = {};
    result.issues.forEach((issue) => {
      categories[issue.category] = (categories[issue.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([category, count]) => {
      output += `${category}: ${count}
`;
    });
    return output;
  }
  /**
   * Format verbose info
   */
  formatVerboseInfo(result) {
    let output = this.formatInfo(result);
    output += "\n\u{1F50D} Detailed Issues\n";
    output += "--------------------\n";
    result.issues.forEach((issue) => {
      output += `
\u{1F4C4} ${issue.file}:${issue.line}
`;
      output += `   ${issue.title}
`;
      output += `   Severity: ${issue.severity}
`;
      output += `   Category: ${issue.category}
`;
      output += `   ${issue.description}
`;
      if (issue.suggestion) {
        output += `   Suggestion: ${issue.suggestion}
`;
      }
      output += `   Code: ${issue.codeSnippet}
`;
    });
    return output;
  }
};

// src/index.ts
var createRefactor = (config) => {
  return new AIRefactor(config);
};
var aiRefactor = new AIRefactor();
var analyze = async (path, config) => {
  return aiRefactor.analyze(path, config);
};
var refactor = async (path, options) => {
  return aiRefactor.refactor(path, options);
};
var fix = async (path, issues) => {
  return aiRefactor.fix(path, issues);
};
var suggest = async (path, issues) => {
  return aiRefactor.suggest(path, issues);
};
export {
  AIRefactor,
  aiRefactor,
  analyze,
  createRefactor,
  fix,
  refactor,
  suggest
};
//# sourceMappingURL=index.js.map