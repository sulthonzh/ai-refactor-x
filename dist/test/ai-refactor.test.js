import { test } from 'node:test';
import assert from 'node:assert';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test data
const TEST_CODE = `
// Test file for ai-refactor-x
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    // TODO: Add tax calculation
    total += items[i].price * 100; // Magic number - should be constant
  }
  return total;
}

function processData(data) {
  if (data == null) {
    return [];
  }
  
  const result = [];
  for (const item of data) {
    if (item.value > 100) {
      result.push(item.value * 2);
    }
  }
  
  return result;
}

function oldFunction() {
  console.log("Debug statement - should be removed");
  let unusedVariable = "not used";
  return "result";
}

export { calculateTotal, processData, oldFunction };
`;

const EXPECTED_FIXED_CODE = `
// Test file for ai-refactor-x
function calculateTotal(items) {
  const PRICE_MULTIPLIER = 100; // Magic number extracted
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    // TODO: Add tax calculation
    total += items[i].price * PRICE_MULTIPLIER;
  }
  return total;
}

function processData(data) {
  if (data == null) {
    return [];
  }
  
  const result = [];
  for (const item of data) {
    if (item.value > 100) {
      result.push(item.value * 2);
    }
  }
  
  return result;
}

function oldFunction() {
  let unusedVariable = "not used";
  return "result";
}

export { calculateTotal, processData, oldFunction };
`;

test.describe('ai-refactor-x', () => {
  let testDir;
  let testFile;

  test.beforeEach(async () => {
    // Create test directory
    testDir = join(process.cwd(), 'test-tmp', Date.now().toString());
    await mkdir(testDir, { recursive: true });
    
    // Create test file
    testFile = join(testDir, 'test.js');
    await writeFile(testFile, TEST_CODE);
  });

  test.afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test.describe('Analysis', () => {
    test('should identify magic numbers', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      
      assert.ok(analysis.issues, 'Should have issues');
      const magicNumberIssues = analysis.issues.filter(issue => issue.category === 'magic-number');
      assert.ok(magicNumberIssues.length > 0, 'Should identify magic numbers');
      
      // Check that the magic number 100 is found
      const hasMagicNumber100 = magicNumberIssues.some(issue => 
        issue.codeSnippet.includes('100')
      );
      assert.ok(hasMagicNumber100, 'Should identify magic number 100');
    });

    test('should identify TODO comments', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      
      const todoIssues = analysis.issues.filter(issue => issue.category === 'todo');
      assert.ok(todoIssues.length > 0, 'Should identify TODO comments');
      
      const hasTodoWithTax = todoIssues.some(issue => 
        issue.description.includes('tax')
      );
      assert.ok(hasTodoWithTax, 'Should identify TODO with tax');
    });

    test('should identify console.log statements', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      
      const debugIssues = analysis.issues.filter(issue => issue.category === 'debug-code');
      assert.ok(debugIssues.length > 0, 'Should identify console.log statements');
    });

    test('should identify unused variables', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      
      const unusedIssues = analysis.issues.filter(issue => issue.category === 'unused-variable');
      assert.ok(unusedIssues.length > 0, 'Should identify unused variables');
    });

    test('should filter by severity', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --severity medium --format json`);
      const analysis = JSON.parse(result.stdout);
      
      assert.ok(analysis.issues, 'Should have issues');
      assert.ok(analysis.issues.every(issue => issue.severity === 'medium'), 'All issues should be medium severity');
    });

    test('should filter by category', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --category magic-number --format json`);
      const analysis = JSON.parse(result.stdout);
      
      assert.ok(analysis.issues, 'Should have issues');
      assert.ok(analysis.issues.every(issue => issue.category === 'magic-number'), 'All issues should be magic-number');
    });
  });

  test.describe('Suggestions', () => {
    test('should generate refactoring suggestions', async () => {
      const result = await runCommand(`node dist/cli.js suggest ${testDir} --format json`);
      const suggestions = JSON.parse(result.stdout);
      
      assert.ok(suggestions.suggestions, 'Should have suggestions');
      assert.ok(suggestions.suggestions.length > 0, 'Should generate suggestions');
      
      const firstSuggestion = suggestions.suggestions[0];
      assert.ok(firstSuggestion.id, 'Should have suggestion ID');
      assert.ok(firstSuggestion.title, 'Should have title');
      assert.ok(firstSuggestion.savings, 'Should have savings info');
      assert.ok(firstSuggestion.explanation, 'Should have explanation');
    });

    test('should save suggestions to file', async () => {
      const outputFile = join(testDir, 'suggestions.json');
      const result = await runCommand(`node dist/cli.js suggest ${testDir} --save ${outputFile}`);
      
      assert.ok(result.exitCode === 0, 'Command should succeed');
      assert.ok(existsSync(outputFile), 'Should create output file');
      
      const savedData = await readFile(outputFile, 'utf-8');
      const suggestions = JSON.parse(savedData);
      
      assert.ok(suggestions.suggestions, 'Should save suggestions');
      assert.ok(suggestions.total > 0, 'Should save total count');
    });
  });

  test.describe('Info', () => {
    test('should provide codebase information', async () => {
      const result = await runCommand(`node dist/cli.js info ${testDir}`);
      const output = result.stdout;
      
      assert.ok(output.includes('Files analyzed'), 'Should show file count');
      assert.ok(output.includes('Total issues'), 'Should show issue count');
      assert.ok(output.includes('Fixable issues'), 'Should show fixable count');
      assert.ok(output.includes('Estimated time'), 'Should show time estimate');
      assert.ok(output.includes('Potential savings'), 'Should show savings');
    });

    test('should show issues by category', async () => {
      const result = await runCommand(`node dist/cli.js info ${testDir}`);
      const output = result.stdout;
      
      assert.ok(output.includes('Issues by Category'), 'Should show category breakdown');
    });
  });

  test.describe('Refactoring', () => {
    test('should apply fixes in dry-run mode', async () => {
      const result = await runCommand(`node dist/cli.js refactor ${testDir} --dry-run`);
      const output = result.stdout;
      
      assert.ok(output.includes('Summary'), 'Should show summary');
      assert.ok(output.includes('Files analyzed'), 'Should show file info');
      assert.ok(output.includes('Issues found'), 'Should show issue count');
      assert.ok(output.includes('Potential savings'), 'Should show savings');
      
      // File should not be modified
      const originalContent = await readFile(testFile, 'utf-8');
      assert.strictEqual(originalContent, TEST_CODE, 'File should be unchanged');
    });

    test('should apply fixes in auto-fix mode', async () => {
      const result = await runCommand(`node dist/cli.js refactor ${testDir} --fix --dry-run=false`);
      const output = result.stdout;
      
      assert.ok(output.includes('Refactoring complete'), 'Should show completion message');
      assert.ok(output.includes('Fixed'), 'Should show fixed count');
      assert.ok(output.includes('Saved'), 'Should show savings count');
    });

    test('should create backup when fixing', async () => {
      const result = await runCommand(`node dist/cli.js refactor ${testFile} --fix --backup`);
      
      // Look for backup file in the output
      assert.ok(result.stdout.includes('backup'), 'Should mention backup');
    });
  });

  test.describe('Output Formats', () => {
    test('should output JSON format', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const output = result.stdout;
      
      assert.ok(JSON.parse(output), 'Should be valid JSON');
    });

    test('should output Markdown format', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format markdown`);
      const output = result.stdout;
      
      assert.ok(output.includes('# AI Refactor Analysis Report'), 'Should be Markdown');
      assert.ok(output.includes('## Summary'), 'Should have Markdown structure');
    });

    test('should output console format by default', async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir}`);
      const output = result.stdout;
      
      assert.ok(output.includes('🔍'), 'Should have console emojis');
      assert.ok(output.includes('Files analyzed'), 'Should have console info');
    });
  });

  test.describe('Configuration', () => {
    test('should respect file patterns', async () => {
      // Create a different file to test pattern filtering
      const otherFile = join(testDir, 'other.ts');
      await writeFile(otherFile, TEST_CODE);
      
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --pattern "**/*.js" --format json`);
      const analysis = JSON.parse(result.stdout);
      
      // Should only find JavaScript files, not TypeScript
      const jsFiles = analysis.files.filter(file => file.endsWith('.js'));
      const tsFiles = analysis.files.filter(file => file.endsWith('.ts'));
      
      assert.ok(jsFiles.length > 0, 'Should find JS files');
      assert.strictEqual(tsFiles.length, 0, 'Should not find TS files');
    });

    test('should respect ignore patterns', async () => {
      // Create a node_modules directory
      const nodeModulesDir = join(testDir, 'node_modules', 'test-package');
      await mkdir(nodeModulesDir, { recursive: true });
      await writeFile(join(nodeModulesDir, 'test.js'), TEST_CODE);
      
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      
      // Should not find files in node_modules
      const nodeModulesFiles = analysis.files.filter(file => file.includes('node_modules'));
      assert.strictEqual(nodeModulesFiles.length, 0, 'Should not ignore node_modules files');
    });

    test('should load configuration file', async () => {
      const configFile = join(testDir, 'ai-refactor-config.json');
      const config = {
        patterns: ['**/*.js'],
        outputFormat: 'json',
        aiProvider: 'local'
      };
      await writeFile(configFile, JSON.stringify(config, null, 2));
      
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --config ${configFile}`);
      
      // Should use configuration from file
      assert.ok(result.exitCode === 0, 'Should succeed with config file');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle non-existent paths', async () => {
      const result = await runCommand(`node dist/cli.js analyze /nonexistent/path`);
      
      assert.notStrictEqual(result.exitCode, 0, 'Should fail with non-existent path');
      assert.ok(result.stderr.includes('failed'), 'Should show error message');
    });

    test('should handle invalid JSON config', async () => {
      const configFile = join(testDir, 'invalid-config.json');
      await writeFile(configFile, 'invalid json content');
      
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --config ${configFile}`);
      
      // Should warn about invalid config but continue with defaults
      assert.ok(result.exitCode === 0, 'Should continue with defaults');
    });

    test('should handle empty directory', async () => {
      const emptyDir = join(testDir, 'empty');
      await mkdir(emptyDir);
      
      const result = await runCommand(`node dist/cli.js analyze ${emptyDir}`);
      
      assert.ok(result.exitCode === 0, 'Should handle empty directory');
      assert.ok(result.stdout.includes('No issues found'), 'Should show no issues message');
    });
  });
});

// Helper function to run command
async function runCommand(command) {
  try {
    return await execAsync(command, { timeout: 30000 });
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1
    };
  }
}