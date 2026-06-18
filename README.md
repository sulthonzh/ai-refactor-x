# ai-refactor-x

Zero-dependency AI-powered code refactoring tool that detects issues and provides automated fix suggestions.

## Features

🤖 **AI-Powered Analysis**: Uses intelligent pattern recognition to identify code quality issues and refactoring opportunities

🔍 **Comprehensive Issue Detection**:
- Magic numbers that should be constants
- Long functions that need breaking down
- Code duplication across files
- Complex conditional logic
- Nested loops and performance issues
- Unused variables and dead code
- Debug code in production
- Import/Export organization
- Null/Undefined handling

🔧 **Smart Refactoring Suggestions**:
- Automated fixes with confidence scoring
- Detailed explanations for each change
- Estimated time and code savings
- Backup and restore capabilities
- Interactive or batch fixing modes

📊 **Rich Reporting**:
- Console output with color-coded severity
- JSON output for CI/CD integration
- Markdown documentation generation
- Detailed issue breakdowns

⚡ **Zero Dependencies**: Pure Node.js implementation with zero external dependencies

🚀 **CLI Tool**: Full command-line interface for easy integration into development workflows

## Installation

```bash
npm install ai-refactor-x
```

Or use the CLI directly:

```bash
npx ai-refactor-x
```

## Quick Start

### Basic Analysis

```bash
# Analyze current directory
ai-refactor-x analyze .

# Analyze specific file
ai-refactor-x analyze src/index.js

# Filter issues by severity
ai-refactor-x analyze . --severity high

# Save report to file
ai-refactor-x analyze . --save-report analysis.json --format json
```

### Generate Refactoring Suggestions

```bash
# Get suggestions without applying fixes
ai-refactor-x suggest .

# Save suggestions to file
ai-refactor-x suggest . --save suggestions.json

# Interactive preview
ai-refactor-x suggest . --interactive
```

### Apply Fixes

```bash
# Dry run to see what would be fixed
ai-refactor-x refactor . --dry-run

# Apply fixes automatically
ai-refactor-x refactor . --fix

# Interactive mode with confirmation
ai-refactor-x refactor . --fix --interactive

# Quick fix command
ai-refactor-x fix src/
```

### Get Codebase Information

```bash
# Get overall statistics
ai-refactor-x info .

# Detailed breakdown
ai-refactor-x info . --verbose
```

## API Usage

```javascript
import { AIRefactor } from 'ai-refactor-x';

const aiRefactor = new AIRefactor({
  patterns: ['**/*.{js,ts,jsx,tsx}'],
  ignore: ['**/node_modules/**', '**/dist/**'],
  outputFormat: 'console'
});

// Analyze code
const result = await aiRefactor.analyze('./src');
console.log(`Found ${result.summary.totalIssues} issues`);

// Get suggestions
const suggestions = await aiRefactor.suggest('./src');
console.log(`Generated ${suggestions.length} fixes`);

// Apply fixes
const fixResult = await aiRefactor.fix('./src');
console.log(`Fixed ${fixResult.summary.fixableIssues} issues`);
```

## Configuration

### Command Line Options

```bash
ai-refactor-x analyze [path] [options]

Options:
  -p, --pattern <pattern>     File pattern to analyze (can be used multiple times)
  -i, --ignore <pattern>      Pattern to ignore (can be used multiple times)
  -d, --depth <number>        Maximum directory depth to analyze
  -m, --max-files <number>    Maximum number of files to analyze
  --output-format <format>   Output format (console|json|markdown)
  --ai-provider <provider>   AI provider (openai|anthropic|local)
  --model <model>            AI model to use
  --output <file>            Output file to save report
  --config <file>            Configuration file path
  -v, --verbose              Verbose output
  --dry-run                  Show what would be fixed without making changes
```

### Configuration File

Create a `ai-refactor-config.json` file:

```json
{
  "patterns": ["**/*.{js,ts,jsx,tsx}"],
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.test.*",
    "**/*.spec.*"
  ],
  "depth": 10,
  "maxFiles": 1000,
  "outputFormat": "console",
  "aiProvider": "openai",
  "model": "gpt-4"
}
```

## Issue Categories

### Code Quality Issues

- **Magic Numbers**: Replace hardcoded numbers with named constants
- **Long Functions**: Break down large functions into smaller, focused ones
- **Code Duplication**: Extract repeated code into common utilities
- **Unused Variables**: Remove dead code and unused declarations
- **Debug Code**: Remove console statements and debug code

### Performance Issues

- **Nested Loops**: Replace with built-in array methods where possible
- **Complex Conditionals**: Simplify boolean logic with guard clauses
- **Inefficient Algorithms**: Suggest algorithmic improvements

### Architecture Issues

- **Complex Imports**: Split large import statements
- **Deep Nesting**: Flatten deeply nested structures
- **Null Checks**: Replace with optional chaining

## Output Formats

### Console Output

```
🤖 AI Refactor Analysis Report
==================================================

📊 Summary
--------------------
Files analyzed: 15
Total issues: 23
Fixable issues: 18
Critical issues: 3
Estimated time: 46 minutes
Potential savings: 127 lines (12%)

🔍 Issues by Severity
🔴 CRITICAL: 3 issues
🟠 HIGH: 5 issues
🟡 MEDIUM: 8 issues
🟢 LOW: 7 issues
```

### JSON Output

```json
{
  "metadata": {
    "timestamp": "2026-06-18T07:47:00.000Z",
    "totalFiles": 15,
    "format": "json"
  },
  "summary": {
    "totalIssues": 23,
    "fixableIssues": 18,
    "criticalIssues": 3,
    "estimatedSavings": {
      "lines": 127,
      "characters": 2048,
      "percentage": 12
    },
    "estimatedTime": "46 minutes"
  },
  "issues": [...],
  "suggestions": [...]
}
```

### Markdown Output

```markdown
# AI Refactor Analysis Report

**Generated:** 2026-06-18T07:47:00.000Z
**Files Analyzed:** 15

## Summary

| Metric | Value |
|--------|-------|
| Total Issues | 23 |
| Fixable Issues | 18 |
| Critical Issues | 3 |
| Estimated Savings | 127 lines |
| Estimated Time | 46 minutes |
| Savings Percentage | 12% |

## Issues Found

| Severity | Category | File | Line | Description |
|----------|----------|------|------|-------------|
| 🔴 | magic-number | `src/utils.js` | 42 | Magic Number |
| 🟠 | long-function | `src/main.js` | 15 | Function Too Long |
| 🟡 | debug-code | `src/app.js` | 89 | Debug Code Found |
```

## Examples

### Example 1: Finding and Fixing Magic Numbers

**Before:**
```javascript
function calculateDiscount(price) {
  return price * 0.15; // Magic number
}
```

**After:**
```javascript
const DISCOUNT_RATE = 0.15; // Magic number extracted

function calculateDiscount(price) {
  return price * DISCOUNT_RATE;
}
```

### Example 2: Extracting Long Functions

**Before:**
```javascript
function processData(data) {
  // 50+ lines of complex logic
  let result = [];
  for (const item of data) {
    // Complex processing...
  }
  // More processing...
  return result;
}
```

**After:**
```javascript
function extractProcessingLogic(item) {
  // Extracted processing logic
  return processedItem;
}

function processData(data) {
  return data.map(extractProcessingLogic);
}
```

### Example 3: Removing Debug Code

**Before:**
```javascript
function authenticate(user) {
  console.log('Authenticating user:', user.email); // Debug code
  // Authentication logic...
}
```

**After:**
```javascript
function authenticate(user) {
  // Authentication logic...
}
```

## Integration

### CI/CD Pipeline

```yaml
# .github/workflows/code-quality.yml
name: Code Quality Check
on: [push, pull_request]

jobs:
  refactor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install ai-refactor-x
        run: npm install ai-refactor-x
        
      - name: Analyze code
        run: npx ai-refactor-x analyze . --output-format json --save-report quality-report.json
        
      - name: Upload quality report
        uses: actions/upload-artifact@v2
        with:
          name: quality-report
          path: quality-report.json
```

### VS Code Integration

Create a VS Code task in `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Analyze Code Quality",
      "type": "shell",
      "command": "npx ai-refactor-x analyze .",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Apply Refactoring",
      "type": "shell",
      "command": "npx ai-refactor-x refactor . --fix",
      "group": "build",
      "problemMatcher": []
    }
  ]
}
```

### Git Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run analysis on staged files
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|jsx|tsx)$')

if [ -n "$staged_files" ]; then
  echo "🤖 Running AI refactoring analysis..."
  
  # Write staged files to temporary directory
  temp_dir=$(mktemp -d)
  for file in $staged_files; do
    mkdir -p "$temp_dir/$(dirname "$file")"
    git show ":$file" > "$temp_dir/$file"
  done
  
  # Run analysis
  npx ai-refactor-x analyze "$temp_dir" --output-format json --save-report pre-commit-report.json
  
  # Check results
  issues=$(jq '.summary.totalIssues' pre-commit-report.json)
  if [ "$issues" -gt 0 ]; then
    echo "⚠️ Found $issues quality issues. Consider fixing them before committing."
    echo "Run 'ai-refactor-x fix .' to apply automatic fixes."
    exit 1
  fi
  
  # Cleanup
  rm -rf "$temp_dir"
  rm pre-commit-report.json
fi
```

## Advanced Features

### Custom Patterns

Define custom analysis patterns:

```bash
ai-refactor-x analyze . --pattern "**/*.js" --pattern "!**/test/**"
```

### Severity-Based Filtering

Focus on critical issues first:

```bash
# Only show critical and high severity issues
ai-refactor-x analyze . --severity high

# Interactive session with only critical issues
ai-refactor-x refactor . --fix --severity critical --interactive
```

### Batch Processing

Process multiple projects:

```bash
#!/bin/bash
# refactor-all.sh

projects=(
  "./frontend"
  "./backend"
  "./shared"
)

for project in "${projects[@]}"; do
  echo "🔧 Refactoring $project..."
  npx ai-refactor-x refactor "$project" --fix --backup
done
```

## Performance Tips

1. **Use file patterns** to limit analysis scope
2. **Set reasonable depth** limits for large codebases
3. **Enable ignore patterns** for build directories
4. **Use JSON output** for CI/CD integration
5. **Run in dry-run mode** before applying fixes

## Troubleshooting

### Common Issues

**Permission Denied**: Make sure you have read access to the target files and directories.

**Large Codebases**: Use `--max-files` and `--depth` to limit analysis scope.

**Memory Issues**: Process files in smaller batches or use specific file patterns.

**No Issues Found**: Check that your file patterns match your codebase structure.

### Debug Mode

Enable verbose output for troubleshooting:

```bash
ai-refactor-x analyze . --verbose
```

### Configuration Validation

Test your configuration:

```bash
ai-refactor-x analyze . --config ai-refactor-config.json --dry-run
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite: `npm test`
5. Submit a pull request

## License

MIT

## Changelog

### v1.0.0
- Initial release
- Core analysis functionality
- CLI tool with multiple commands
- Support for JSON, Markdown, and console output
- Comprehensive test suite
- Zero-dependency architecture

## Support

For issues and questions:
- GitHub Issues: https://github.com/sulthonzh/ai-refactor-x
- Documentation: https://github.com/sulthonzh/ai-refactor-x/blob/main/README.md