#!/usr/bin/env node

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';
import { AIRefactor } from './index.js';
import type { RefactorConfig, RefactorOptions } from './types.js';

// Simple argument parser
function parseArgs(args: string[]): { command: string; options: Record<string, any>; path?: string } {
  const result: { command: string; options: Record<string, any>; path?: string } = { 
    command: '', 
    options: {} 
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // Option with value
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        const key = arg.slice(2);
        const value = args[i + 1];
        result.options[key] = value;
        i++;
      } else {
        // Boolean flag
        const key = arg.slice(2);
        result.options[key] = true;
      }
    } else if (arg.startsWith('-')) {
      // Short option with value
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        const key = arg.slice(1);
        const value = args[i + 1];
        result.options[key] = value;
        i++;
      } else {
        // Boolean flag
        const key = arg.slice(1);
        result.options[key] = true;
      }
    } else if (!result.command) {
      result.command = arg;
    } else if (!result.path) {
      result.path = arg;
    } else {
      // Additional arguments as array
      if (!result.options._) {
        result.options._ = [];
      }
      result.options._.push(arg);
    }
  }
  
  return result;
}

// Build config from options
async function buildConfig(options: any): Promise<RefactorConfig> {
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
      console.error(`Warning: Could not read config file ${options.config}:`, error);
    }
  }
  
  return config;
}

// Main CLI logic
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
    console.error('Error:', error);
    process.exit(1);
  }
}

// Handle analyze command
async function handleAnalyze(path: string | undefined, options: any) {
  if (!path) {
    console.error('Error: Path is required for analyze command');
    process.exit(1);
  }
  
  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  
  if (options.verbose) {
    console.log(`Analyzing: ${path}`);
    if (options.pattern) console.log(`Pattern: ${options.pattern}`);
    if (options.ignore) console.log(`Ignore: ${options.ignore}`);
  }
  
  const result = await aiRefactor.analyze(path, config);
  
  if (options.saveReport) {
    await writeFile(options.saveReport, JSON.stringify(result, null, 2));
    console.log(`Report saved to: ${options.saveReport}`);
  }
  
  if (options.outputFormat === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else if (options.outputFormat === 'markdown') {
    console.log(aiRefactor.formatMarkdown(result));
  } else {
    // Console output
    console.log(aiRefactor.formatConsole(result));
  }
}

// Handle suggest command
async function handleSuggest(path: string | undefined, options: any) {
  if (!path) {
    console.error('Error: Path is required for suggest command');
    process.exit(1);
  }
  
  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  
  if (options.verbose) {
    console.log(`Generating suggestions for: ${path}`);
  }
  
  const result = await aiRefactor.suggest(path);
  
  if (options.saveReport) {
    await writeFile(options.saveReport, JSON.stringify(result, null, 2));
    console.log(`Suggestions saved to: ${options.saveReport}`);
  }
  
  if (options.outputFormat === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(aiRefactor.formatSuggestions(result));
  }
}

// Handle refactor command
async function handleRefactor(path: string | undefined, options: any) {
  if (!path) {
    console.error('Error: Path is required for refactor command');
    process.exit(1);
  }
  
  const refactorOptions: RefactorOptions = {
    fix: options.fix || false,
    interactive: options.interactive || false,
    backup: options.backup || false,
    dryRun: options.dryRun || false,
    output: options.output || '',
    verbose: options.verbose || false,
    yes: options.yes || false
  };
  
  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  
  if (options.verbose) {
    console.log(`Refactoring: ${path}`);
    if (refactorOptions.dryRun) console.log('Dry run mode - no changes will be made');
    if (refactorOptions.backup) console.log('Backup will be created');
  }
  
  const result = await aiRefactor.refactor(path, refactorOptions);
  
  if (options.outputFormat === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(aiRefactor.formatRefactor(result));
  }
}

// Handle fix command
async function handleFix(path: string | undefined, options: any) {
  if (!path) {
    console.error('Error: Path is required for fix command');
    process.exit(1);
  }
  
  const refactorOptions: RefactorOptions = {
    fix: true,
    interactive: options.interactive || false,
    backup: options.backup || false,
    dryRun: options.dryRun || false,
    output: options.output || '',
    verbose: options.verbose || false,
    yes: options.yes || false
  };
  
  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  
  if (options.verbose) {
    console.log(`Fixing: ${path}`);
    if (refactorOptions.dryRun) console.log('Dry run mode - no changes will be made');
    if (refactorOptions.backup) console.log('Backup will be created');
  }
  
  const result = await aiRefactor.fix(path);
  
  if (options.outputFormat === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(aiRefactor.formatFix(result));
  }
}

// Handle info command
async function handleInfo(path: string | undefined, options: any) {
  if (!path) {
    console.error('Error: Path is required for info command');
    process.exit(1);
  }
  
  const config = await buildConfig(options);
  const aiRefactor = new AIRefactor(config);
  
  if (options.verbose) {
    console.log(`Getting info for: ${path}`);
  }
  
  const result = await aiRefactor.analyze(path);
  
  if (options.outputFormat === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else if (options.verbose) {
    console.log(aiRefactor.formatVerboseInfo(result));
  } else {
    console.log(aiRefactor.formatInfo(result));
  }
}

// Show help
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

Global Options:
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

Analyze Options:
  --fixable                 Only show fixable issues
  --severity <level>        Filter by severity (critical|high|medium|low)
  --category <category>     Filter by category
  --save-report <file>      Save analysis report to file

Refactor Options:
  --fix                    Apply fixes automatically
  --interactive            Interactive mode with confirmation
  --backup                 Create backup before making changes
  --yes                    Auto-confirm all prompts

Examples:
  ai-refactor-x analyze ./src --format json --save-report report.json
  ai-refactor-x refactor ./src --fix --dry-run --verbose
  ai-refactor-x suggest ./src --output suggestions.json
  ai-refactor-x fix ./src --backup --interactive
  ai-refactor-x info ./src --verbose

For more information, see: https://github.com/sulthonzh/ai-refactor-x
`);
}

// Run main
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});