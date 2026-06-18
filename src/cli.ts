#!/usr/bin/env node

import { Command } from 'commander';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { existsSync } from 'fs';
import { AIRefactor } from './index.js';
import type { RefactorConfig, RefactorOptions } from './types.js';

const program = new Command();

program
  .name('ai-refactor-x')
  .description('Zero-dependency AI-powered code refactoring tool')
  .version('1.0.0');

// Global options
program
  .option('-p, --pattern <pattern>', 'File pattern to analyze (can be used multiple times)', (value, previous: string[]) => {
    return [...previous, value];
  }, [])
  .option('-i, --ignore <pattern>', 'Pattern to ignore (can be used multiple times)', (value, previous: string[]) => {
    return [...previous, value];
  }, [])
  .option('-d, --depth <number>', 'Maximum directory depth to analyze', parseInt)
  .option('-m, --max-files <number>', 'Maximum number of files to analyze', parseInt)
  .option('--output-format <format>', 'Output format (console|json|markdown)', 'console')
  .option('--ai-provider <provider>', 'AI provider (openai|anthropic|local)', 'openai')
  .option('--model <model>', 'AI model to use', 'gpt-4')
  .option('--output <file>', 'Output file to save report')
  .option('--config <file>', 'Configuration file path')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be fixed without making changes');

// Analyze command
program
  .command('analyze')
  .argument('<path>', 'Path to analyze (file or directory)')
  .description('Analyze code and identify issues')
  .option('--fixable', 'Only show fixable issues')
  .option('--severity <level>', 'Filter by severity (critical|high|medium|low)')
  .option('--category <category>', 'Filter by category')
  .option('--format <format>', 'Output format (console|json|markdown)', 'console')
  .option('--save-report <file>', 'Save analysis report to file')
  .action(async (path: string, options: Record<string, any>) => {
    try {
      const config = await buildConfig(options);
      const aiRefactor = new AIRefactor(config);

      if (options.verbose && options.format !== 'json') {
        console.error('🔍 Analyzing:', path);
        console.error('Configuration:', JSON.stringify(config, null, 2));
      }

      const result = await aiRefactor.analyze(path, config);

      // Filter results if requested
      if (options.fixable) {
        result.issues = result.issues.filter(issue => issue.fixable);
        result.suggestions = result.suggestions.filter(suggestion => suggestion.issue.fixable);
      }

      if (options.severity) {
        result.issues = result.issues.filter(issue => issue.severity === options.severity);
        result.suggestions = result.suggestions.filter(suggestion => suggestion.issue.severity === options.severity);
      }

      if (options.category) {
        result.issues = result.issues.filter(issue => issue.category === options.category);
        result.suggestions = result.suggestions.filter(suggestion => suggestion.issue.category === options.category);
      }

      // Output result
      if (options.saveReport) {
        const report = formatReport(result, options.format);
        await writeFile(options.saveReport, report);
        if (options.format !== 'json') {
          console.log(`📄 Report saved to: ${options.saveReport}`);
        }
      } else {
        outputResult(result, options.format, options.verbose);
      }

      // Exit with appropriate code
      process.exit(result.issues.length === 0 ? 0 : 1);

    } catch (error) {
      console.error('❌ Analysis failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Refactor command
program
  .command('refactor')
  .argument('<path>', 'Path to refactor (file or directory)')
  .description('Apply refactoring fixes to code')
  .option('--fix', 'Apply fixes automatically')
  .option('--interactive', 'Interactive mode for applying fixes')
  .option('--backup', 'Create backup before making changes (default: true)', true)
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('--yes', 'Auto-confirm all fixes')
  .option('--suggestions-only', 'Only show suggestions without applying')
  .action(async (path: string, options: Record<string, any>) => {
    try {
      const config = await buildConfig(options);
      const aiRefactor = new AIRefactor(config);

      if (options.verbose && !process.env.JSON_OUTPUT_MODE) {
        console.error('🔧 Refactoring:', path);
        console.error('Options:', JSON.stringify({
          fix: options.fix,
          interactive: options.interactive,
          backup: options.backup,
          dryRun: options.dryRun,
          yes: options.yes,
          suggestionsOnly: options.suggestionsOnly
        }, null, 2));
      }

      // Dry run mode
      if (options.dryRun || options.suggestionsOnly) {
        const result = await aiRefactor.analyze(path, config);
        console.error('📋 Summary:');
        console.error(`- Files analyzed: ${result.totalFiles}`);
        console.error(`- Issues found: ${result.summary.totalIssues}`);
        console.error(`- Fixable issues: ${result.summary.fixableIssues}`);
        console.error(`- Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)`);

        if (options.suggestionsOnly) {
          console.error('\n💡 Suggestions:');
          for (const suggestion of result.suggestions.slice(0, 5)) {
            console.error(`- ${suggestion.issue.title} (${suggestion.issue.file}:${suggestion.issue.line})`);
            console.error(`  ${suggestion.explanation}`);
            console.error(`  Savings: ${suggestion.estimatedSavings.lines} lines`);
          }
          if (result.suggestions.length > 5) {
            console.error(`... and ${result.suggestions.length - 5} more suggestions`);
          }
        }

        return;
      }

      // Interactive mode
      if (options.interactive) {
        const result = await aiRefactor.analyze(path, config);

        console.error('📋 Analysis complete:');
        console.error(`Found ${result.summary.totalIssues} issues (${result.summary.fixableIssues} fixable)`);

        for (const suggestion of result.suggestions) {
          console.error(`\n💡 ${suggestion.issue.title}`);
          console.error(`   ${suggestion.explanation}`);
          console.error(`   Savings: ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)`);
          console.error(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
          console.error(`   File: ${suggestion.issue.file}:${suggestion.issue.line}`);

          if (!options.yes) {
            const answer = await prompt('Apply this fix? (y/N): ');
            if (answer.toLowerCase() !== 'y') {
              continue;
            }
          }

          try {
            await aiRefactor.fix(path, [suggestion.issue]);
            console.error(`✅ Applied fix: ${suggestion.issue.title}`);
          } catch (error) {
            console.error(`❌ Failed to apply fix: ${(error as Error).message}`);
          }
        }

        return;
      }

      // Auto-fix mode
      if (options.fix) {
        const result = await aiRefactor.refactor(path, {
          fix: true,
          interactive: false,
          backup: options.backup,
          dryRun: false,
          verbose: options.verbose,
          output: '',
          yes: options.yes
        });

        console.error('✅ Refactoring complete!');
        console.error(`- Fixed ${result.summary.fixableIssues} issues`);
        console.error(`- Saved ${result.summary.estimatedSavings.lines} lines`);
        console.error(`- Time saved: ${result.summary.estimatedTime}`);

        if (result.warnings.length > 0) {
          console.error('\n⚠️ Warnings:');
          for (const warning of result.warnings) {
            console.error(`- ${warning}`);
          }
        }

        if (result.errors.length > 0) {
          console.error('\n❌ Errors:');
          for (const error of result.errors) {
            console.error(`- ${error}`);
          }
        }
      }

    } catch (error) {
      console.error('❌ Refactoring failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Fix command
program
  .command('fix')
  .argument('<path>', 'Path to fix (file or directory)')
  .description('Quick fix command for issues')
  .option('--backup', 'Create backup before making changes', true)
  .option('--interactive', 'Interactive mode')
  .action(async (path: string, options: Record<string, any>) => {
    try {
      const config = await buildConfig(options);
      const aiRefactor = new AIRefactor(config);

      if (options.verbose && !process.env.JSON_OUTPUT_MODE) {
        console.error('🔧 Quick fix:', path);
      }

      const result = await aiRefactor.fix(path);

      console.error('✅ Fix complete!');
      console.error(`- Fixed ${result.summary.fixableIssues} issues`);
      console.error(`- Saved ${result.summary.estimatedSavings.lines} lines`);
      console.error(`- Time saved: ${result.summary.estimatedTime}`);

    } catch (error) {
      console.error('❌ Fix failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Suggest command
program
  .command('suggest')
  .argument('<path>', 'Path to get suggestions for')
  .description('Get refactoring suggestions without applying them')
  .option('--save <file>', 'Save suggestions to file')
  .option('--format <format>', 'Output format (console|json|markdown)', 'console')
  .action(async (path: string, options: Record<string, any>) => {
    try {
      const config = await buildConfig(options);
      const aiRefactor = new AIRefactor(config);

      if (options.verbose && options.format !== 'json') {
        console.error('💡 Getting suggestions for:', path);
      }

      const suggestions = await aiRefactor.suggest(path);

      if (options.format === 'json') {
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
            afterCode: s.afterCode
          })),
          total: suggestions.length,
          timestamp: new Date().toISOString()
        };
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.error('📋 Refactoring Suggestions:');
        console.error(`Found ${suggestions.length} suggestions\n`);

        for (const suggestion of suggestions) {
          console.error(`💡 ${suggestion.issue.title}`);
          console.error(`   File: ${suggestion.issue.file}:${suggestion.issue.line}`);
          console.error(`   Category: ${suggestion.issue.category}`);
          console.error(`   Severity: ${suggestion.issue.severity}`);
          console.error(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
          console.error(`   Savings: ${suggestion.estimatedSavings.lines} lines (${suggestion.estimatedSavings.percentage}%)`);
          console.error(`   Explanation: ${suggestion.explanation}\n`);
        }
      }

      if (options.save) {
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
            afterCode: s.afterCode
          })),
          total: suggestions.length,
          timestamp: new Date().toISOString()
        };

        await writeFile(options.save, JSON.stringify(report, null, 2));
        if (options.format !== 'json') {
          console.error(`📄 Suggestions saved to: ${options.save}`);
        }
      }

    } catch (error) {
      console.error('❌ Failed to get suggestions:', (error as Error).message);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .argument('<path>', 'Path to get information about')
  .description('Get information about a codebase')
  .option('--format <format>', 'Output format (console|json|markdown)', 'console')
  .action(async (path: string, options: Record<string, any>) => {
    try {
      const config = await buildConfig(options);
      const aiRefactor = new AIRefactor(config);

      const result = await aiRefactor.analyze(path, config);

      if (options.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('📊 Codebase Information:');
        console.error(`Files analyzed: ${result.totalFiles}`);
        console.error(`Total issues: ${result.summary.totalIssues}`);
        console.error(`Fixable issues: ${result.summary.fixableIssues}`);
        console.error(`Critical issues: ${result.summary.criticalIssues}`);
        console.error(`Estimated time to fix: ${result.summary.estimatedTime}`);
        console.error(`Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)`);

        const categories = result.issues.reduce((acc, issue) => {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.error('\n📈 Issues by Category:');
        Object.entries(categories)
          .sort(([,a], [,b]) => b - a)
          .forEach(([category, count]) => {
            console.error(`  ${category}: ${count}`);
          });
      }

    } catch (error) {
      console.error('❌ Failed to get info:', (error as Error).message);
      process.exit(1);
    }
  });

// Helper functions

async function buildConfig(options: any): Promise<RefactorConfig> {
  const config: RefactorConfig = {
    patterns: options.pattern || ['**/*.{js,ts,jsx,tsx}'],
    ignore: options.ignore || ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*'],
    depth: options.depth,
    maxFiles: options.maxFiles,
    outputFormat: options.outputFormat || 'console',
    aiProvider: options.aiProvider || 'openai',
    model: options.model || 'gpt-4'
  };

  if (options.config) {
    try {
      const configData = await readFile(join(process.cwd(), options.config), 'utf-8');
      const fileConfig = JSON.parse(configData);
      Object.assign(config, fileConfig);
    } catch (error) {
      if (options.verbose) {
        console.warn(`Could not load config file: ${(error as Error).message}`);
      }
    }
  }

  return config;
}

function formatReport(result: any, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2);
    case 'markdown':
      return formatMarkdownReport(result);
    default:
      return formatConsoleReport(result);
  }
}

function formatConsoleReport(result: any): string {
  let output = '';
  output += `📊 Analysis Report\n`;
  output += `Files: ${result.totalFiles}\n`;
  output += `Issues: ${result.summary.totalIssues}\n`;
  output += `Fixable: ${result.summary.fixableIssues}\n`;
  output += `Savings: ${result.summary.estimatedSavings.lines} lines\n`;
  return output;
}

function formatMarkdownReport(result: any): string {
  let markdown = `# AI Refactor Report\n\n`;
  markdown += `Files: ${result.totalFiles}\n`;
  markdown += `Issues: ${result.summary.totalIssues}\n`;
  markdown += `Fixable: ${result.summary.fixableIssues}\n`;
  return markdown;
}

function outputResult(result: any, format: string, verbose: boolean): void {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (format === 'markdown') {
    console.log(formatMarkdownReport(result));
    return;
  }

  console.error(`📊 Analysis Complete!`);
  console.error(`📁 Files analyzed: ${result.totalFiles}`);
  console.error(`🔍 Issues found: ${result.summary.totalIssues}`);
  console.error(`🔧 Fixable issues: ${result.summary.fixableIssues}`);
  console.error(`🚀 Potential savings: ${result.summary.estimatedSavings.lines} lines (${result.summary.estimatedSavings.percentage}%)`);
  console.error(`⏱️  Estimated time: ${result.summary.estimatedTime}`);

  if (result.warnings.length > 0 && verbose) {
    console.error('\n⚠️ Warnings:');
    result.warnings.forEach((warning: string) => console.error(`  ${warning}`));
  }

  if (result.errors.length > 0 && verbose) {
    console.error('\n❌ Errors:');
    result.errors.forEach((error: string) => console.error(`  ${error}`));
  }
}

async function prompt(question: string): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

program.parse(process.argv);