#!/usr/bin/env node

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';
import { AIRefactor } from './index.js';
import type { RefactorConfig, RefactorOptions } from './types.js';

// ─── Helpers ──────────────────────────────────────────────

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

function parseValue(val: string): string | boolean {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
}

// ─── Argument Parser ──────────────────────────────────────

function parseArgs(args: string[]): { command: string; options: Record<string, any>; path?: string } {
  const result: { command: string; options: Record<string, any>; path?: string } = {
    command: '',
    options: {},
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const equalIdx = arg.indexOf('=');
      if (equalIdx > -1) {
        const key = kebabToCamel(arg.slice(2, equalIdx));
        result.options[key] = parseValue(arg.slice(equalIdx + 1));
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        const key = kebabToCamel(arg.slice(2));
        result.options[key] = args[i + 1];
        i++;
      } else {
        const key = kebabToCamel(arg.slice(2));
        result.options[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        const key = kebabToCamel(arg.slice(1));
        result.options[key] = args[i + 1];
        i++;
      } else {
        const key = kebabToCamel(arg.slice(1));
        result.options[key] = true;
      }
    } else if (!result.command) {
      result.command = arg;
    } else if (!result.path) {
      result.path = arg;
    }
  }

  return result;
}

// ─── Config Builder ───────────────────────────────────────

async function buildConfig(options: Record<string, any>): Promise<RefactorConfig> {
  const config: RefactorConfig = {};

  if (options.pattern) {
    config.patterns = Array.isArray(options.pattern) ? options.pattern : [options.pattern];
  }
  if (options.ignore) {
    config.ignore = Array.isArray(options.ignore) ? options.ignore : [options.ignore];
  }
  if (options.depth) {
    config.depth = parseInt(options.depth);
  }
  if (options.maxFiles) {
    config.maxFiles = parseInt(options.maxFiles);
  }
  if (options.outputFormat) {
    config.outputFormat = options.outputFormat;
  }
  if (options.aiProvider) {
    config.aiProvider = options.aiProvider;
  }
  if (options.model) {
    config.model = options.model;
  }

  if (options.config) {
    try {
      const configContent = await readFile(options.config, 'utf-8');
      const fileConfig = JSON.parse(configContent);
      Object.assign(config, fileConfig);
    } catch (error) {
      console.error(`Warning: Could not read config file ${options.config}: ${(error as Error).message}`);
    }
  }

  return config;
}

// ─── Command Handlers ─────────────────────────────────────

async function handleAnalyze(path: string | undefined, options: Record<string, any>) {
  if (!path) {
    console.error('Analysis failed: Path is required');
    process.exit(1);
  }

  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  const format = options.format || options.outputFormat || 'console';

  if (options.verbose && format !== 'json') {
    console.error(`Analyzing: ${path}`);
  }

  let result = await aiRefactor.analyze(path, config);

  // Apply filters
  if (options.severity) {
    result.issues = result.issues.filter(issue => issue.severity === options.severity);
  }
  if (options.category) {
    result.issues = result.issues.filter(issue => issue.category === options.category);
  }
  if (options.fixable) {
    result.issues = result.issues.filter(issue => issue.fixable);
  }

  if (options.saveReport) {
    const report = format === 'json' ? JSON.stringify(result, null, 2) : aiRefactor.formatConsole(result);
    await writeFile(options.saveReport, report);
    if (format !== 'json') {
      console.log(`Report saved to: ${options.saveReport}`);
    }
  }

  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else if (format === 'markdown') {
    console.log(aiRefactor.formatMarkdown(result));
  } else {
    if (result.issues.length === 0) {
      console.log('✅ No issues found!');
    } else {
      console.log(aiRefactor.formatConsole(result));
    }
  }
}

async function handleSuggest(path: string | undefined, options: Record<string, any>) {
  if (!path) {
    console.error('Error: Path is required for suggest command');
    process.exit(1);
  }

  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  const format = options.format || options.outputFormat || 'console';
  const savePath = options.save || options.saveReport;

  if (options.verbose && format !== 'json') {
    console.error(`Generating suggestions for: ${path}`);
  }

  const suggestions = await aiRefactor.suggest(path);

  const report = {
    suggestions: suggestions.map(s => ({
      id: s.id,
      title: s.issue.title,
      file: s.issue.file,
      line: s.issue.line,
      category: s.issue.category,
      severity: s.issue.severity,
      confidence: s.confidence,
      savings: s.estimatedSavings,
      explanation: s.explanation,
      beforeCode: s.beforeCode,
      afterCode: s.afterCode,
    })),
    total: suggestions.length,
    timestamp: new Date().toISOString(),
  };

  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(aiRefactor.formatSuggestions(suggestions));
  }

  if (savePath) {
    await writeFile(savePath, JSON.stringify(report, null, 2));
    if (format !== 'json') {
      console.log(`Suggestions saved to: ${savePath}`);
    }
  }
}

async function handleRefactor(path: string | undefined, options: Record<string, any>) {
  if (!path) {
    console.error('Error: Path is required for refactor command');
    process.exit(1);
  }

  const refactorOptions: RefactorOptions = {
    fix: options.fix || false,
    interactive: options.interactive || false,
    backup: options.backup !== undefined ? options.backup : false,
    dryRun: options.dryRun !== undefined ? options.dryRun : false,
    output: options.output || '',
    verbose: options.verbose || false,
    yes: options.yes || false,
  };

  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  const format = options.format || options.outputFormat || 'console';

  if (options.verbose && format !== 'json') {
    console.error(`Refactoring: ${path}`);
  }

  // Dry run mode
  if (refactorOptions.dryRun) {
    const result = await aiRefactor.analyze(path, config);
    console.log('📋 Summary:');
    console.log(`Files analyzed: ${result.totalFiles}`);
    console.log(`Issues found: ${result.summary.totalIssues}`);
    console.log(`Fixable issues: ${result.summary.fixableIssues}`);
    console.log(`Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)`);
    return;
  }

  // Fix mode
  if (refactorOptions.fix) {
    const result = await aiRefactor.refactor(path, refactorOptions);

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('✅ Refactoring complete!');
      console.log(`- Fixed ${result.summary.fixableIssues} issues`);
      console.log(`- Saved ${result.summary.estimatedSavings.lines} lines`);
      console.log(`- Time saved: ${result.summary.estimatedTime}`);
    }
    return;
  }

  // Default: show summary
  const result = await aiRefactor.analyze(path, config);
  console.log('📋 Summary:');
  console.log(`Files analyzed: ${result.totalFiles}`);
  console.log(`Issues found: ${result.summary.totalIssues}`);
}

async function handleFix(path: string | undefined, options: Record<string, any>) {
  if (!path) {
    console.error('Error: Path is required for fix command');
    process.exit(1);
  }

  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);

  const result = await aiRefactor.fix(path);

  console.log('✅ Fix complete!');
  console.log(`- Fixed ${result.summary.fixableIssues} issues`);
  console.log(`- Saved ${result.summary.estimatedSavings.lines} lines`);
}

async function handleInfo(path: string | undefined, options: Record<string, any>) {
  if (!path) {
    console.error('Error: Path is required for info command');
    process.exit(1);
  }

  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  const format = options.format || options.outputFormat || 'console';

  const result = await aiRefactor.analyze(path);

  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('📊 Codebase Information:');
    console.log(`Files analyzed: ${result.totalFiles}`);
    console.log(`Total issues: ${result.summary.totalIssues}`);
    console.log(`Fixable issues: ${result.summary.fixableIssues}`);
    console.log(`Estimated time to fix: ${result.summary.estimatedTime}`);
    console.log(`Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)`);

    const categories: Record<string, number> = {};
    result.issues.forEach(issue => {
      categories[issue.category] = (categories[issue.category] || 0) + 1;
    });

    console.log('\n📈 Issues by Category:');
    Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
  }
}

// ─── Help ─────────────────────────────────────────────────

function showHelp() {
  console.log(`
ai-refactor-x - Zero-dependency AI-powered code refactoring tool

Usage: ai-refactor-x <command> [path] [options]

Commands:
  analyze <path>        Analyze code and identify issues
  suggest <path>        Generate refactoring suggestions
  refactor <path>       Apply refactoring fixes
  fix <path>            Quick fix command
  info <path>           Get codebase information

Options:
  --format <format>         Output format (console|json|markdown)
  --output-format <format>  Alias for --format
  --severity <level>        Filter by severity (critical|high|medium|low)
  --category <category>     Filter by category
  --save <file>             Save suggestions to file
  --save-report <file>      Save analysis report to file
  --fix                     Apply fixes automatically
  --dry-run                 Show what would be fixed without changes
  --backup                  Create backup before changes
  --config <file>           Configuration file path
  -v, --verbose             Verbose output

Examples:
  ai-refactor-x analyze ./src --format json
  ai-refactor-x refactor ./src --fix --dry-run
  ai-refactor-x suggest ./src --save suggestions.json
  ai-refactor-x info ./src
`);
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  if (args[0] === '--version' || args[0] === '-v') {
    console.log('ai-refactor-x 1.0.0');
    return;
  }

  const parsed = parseArgs(args);

  try {
    switch (parsed.command) {
      case 'analyze':
        await handleAnalyze(parsed.path, parsed.options);
        break;
      case 'suggest':
        await handleSuggest(parsed.path, parsed.options);
        break;
      case 'refactor':
        await handleRefactor(parsed.path, parsed.options);
        break;
      case 'fix':
        await handleFix(parsed.path, parsed.options);
        break;
      case 'info':
        await handleInfo(parsed.path, parsed.options);
        break;
      default:
        console.error(`Unknown command: ${parsed.command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Command failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`Fatal: ${(error as Error).message}`);
  process.exit(1);
});
