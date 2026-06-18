"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// test/ai-refactor.test.js
var import_node_test = require("test");
var import_node_assert = __toESM(require("assert"), 1);
var import_promises = require("fs/promises");
var import_path = require("path");
var import_child_process = require("child_process");
var import_util = require("util");
var execAsync = (0, import_util.promisify)(import_child_process.exec);
var TEST_CODE = `
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
import_node_test.test.describe("ai-refactor-x", () => {
  let testDir;
  let testFile;
  import_node_test.test.beforeEach(async () => {
    testDir = (0, import_path.join)(process.cwd(), "test-tmp", Date.now().toString());
    await (0, import_promises.mkdir)(testDir, { recursive: true });
    testFile = (0, import_path.join)(testDir, "test.js");
    await (0, import_promises.writeFile)(testFile, TEST_CODE);
  });
  import_node_test.test.afterEach(async () => {
    try {
      await (0, import_promises.rm)(testDir, { recursive: true, force: true });
    } catch (error) {
    }
  });
  import_node_test.test.describe("Analysis", () => {
    (0, import_node_test.test)("should identify magic numbers", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      import_node_assert.default.ok(analysis.issues, "Should have issues");
      const magicNumberIssues = analysis.issues.filter((issue) => issue.category === "magic-number");
      import_node_assert.default.ok(magicNumberIssues.length > 0, "Should identify magic numbers");
      const hasMagicNumber100 = magicNumberIssues.some(
        (issue) => issue.codeSnippet.includes("100")
      );
      import_node_assert.default.ok(hasMagicNumber100, "Should identify magic number 100");
    });
    (0, import_node_test.test)("should identify TODO comments", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      const todoIssues = analysis.issues.filter((issue) => issue.category === "todo");
      import_node_assert.default.ok(todoIssues.length > 0, "Should identify TODO comments");
      const hasTodoWithTax = todoIssues.some(
        (issue) => issue.description.includes("tax")
      );
      import_node_assert.default.ok(hasTodoWithTax, "Should identify TODO with tax");
    });
    (0, import_node_test.test)("should identify console.log statements", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      const debugIssues = analysis.issues.filter((issue) => issue.category === "debug-code");
      import_node_assert.default.ok(debugIssues.length > 0, "Should identify console.log statements");
    });
    (0, import_node_test.test)("should identify unused variables", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      const unusedIssues = analysis.issues.filter((issue) => issue.category === "unused-variable");
      import_node_assert.default.ok(unusedIssues.length > 0, "Should identify unused variables");
    });
    (0, import_node_test.test)("should filter by severity", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --severity medium --format json`);
      const analysis = JSON.parse(result.stdout);
      import_node_assert.default.ok(analysis.issues, "Should have issues");
      import_node_assert.default.ok(analysis.issues.every((issue) => issue.severity === "medium"), "All issues should be medium severity");
    });
    (0, import_node_test.test)("should filter by category", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --category magic-number --format json`);
      const analysis = JSON.parse(result.stdout);
      import_node_assert.default.ok(analysis.issues, "Should have issues");
      import_node_assert.default.ok(analysis.issues.every((issue) => issue.category === "magic-number"), "All issues should be magic-number");
    });
  });
  import_node_test.test.describe("Suggestions", () => {
    (0, import_node_test.test)("should generate refactoring suggestions", async () => {
      const result = await runCommand(`node dist/cli.js suggest ${testDir} --format json`);
      const suggestions = JSON.parse(result.stdout);
      import_node_assert.default.ok(suggestions.suggestions, "Should have suggestions");
      import_node_assert.default.ok(suggestions.suggestions.length > 0, "Should generate suggestions");
      const firstSuggestion = suggestions.suggestions[0];
      import_node_assert.default.ok(firstSuggestion.id, "Should have suggestion ID");
      import_node_assert.default.ok(firstSuggestion.title, "Should have title");
      import_node_assert.default.ok(firstSuggestion.savings, "Should have savings info");
      import_node_assert.default.ok(firstSuggestion.explanation, "Should have explanation");
    });
    (0, import_node_test.test)("should save suggestions to file", async () => {
      const outputFile = (0, import_path.join)(testDir, "suggestions.json");
      const result = await runCommand(`node dist/cli.js suggest ${testDir} --save ${outputFile}`);
      import_node_assert.default.ok(result.exitCode === 0, "Command should succeed");
      import_node_assert.default.ok(existsSync(outputFile), "Should create output file");
      const savedData = await (0, import_promises.readFile)(outputFile, "utf-8");
      const suggestions = JSON.parse(savedData);
      import_node_assert.default.ok(suggestions.suggestions, "Should save suggestions");
      import_node_assert.default.ok(suggestions.total > 0, "Should save total count");
    });
  });
  import_node_test.test.describe("Info", () => {
    (0, import_node_test.test)("should provide codebase information", async () => {
      const result = await runCommand(`node dist/cli.js info ${testDir}`);
      const output = result.stdout;
      import_node_assert.default.ok(output.includes("Files analyzed"), "Should show file count");
      import_node_assert.default.ok(output.includes("Total issues"), "Should show issue count");
      import_node_assert.default.ok(output.includes("Fixable issues"), "Should show fixable count");
      import_node_assert.default.ok(output.includes("Estimated time"), "Should show time estimate");
      import_node_assert.default.ok(output.includes("Potential savings"), "Should show savings");
    });
    (0, import_node_test.test)("should show issues by category", async () => {
      const result = await runCommand(`node dist/cli.js info ${testDir}`);
      const output = result.stdout;
      import_node_assert.default.ok(output.includes("Issues by Category"), "Should show category breakdown");
    });
  });
  import_node_test.test.describe("Refactoring", () => {
    (0, import_node_test.test)("should apply fixes in dry-run mode", async () => {
      const result = await runCommand(`node dist/cli.js refactor ${testDir} --dry-run`);
      const output = result.stdout;
      import_node_assert.default.ok(output.includes("Summary"), "Should show summary");
      import_node_assert.default.ok(output.includes("Files analyzed"), "Should show file info");
      import_node_assert.default.ok(output.includes("Issues found"), "Should show issue count");
      import_node_assert.default.ok(output.includes("Potential savings"), "Should show savings");
      const originalContent = await (0, import_promises.readFile)(testFile, "utf-8");
      import_node_assert.default.strictEqual(originalContent, TEST_CODE, "File should be unchanged");
    });
    (0, import_node_test.test)("should apply fixes in auto-fix mode", async () => {
      const result = await runCommand(`node dist/cli.js refactor ${testDir} --fix --dry-run=false`);
      const output = result.stdout;
      import_node_assert.default.ok(output.includes("Refactoring complete"), "Should show completion message");
      import_node_assert.default.ok(output.includes("Fixed"), "Should show fixed count");
      import_node_assert.default.ok(output.includes("Saved"), "Should show savings count");
    });
    (0, import_node_test.test)("should create backup when fixing", async () => {
      const result = await runCommand(`node dist/cli.js refactor ${testFile} --fix --backup`);
      import_node_assert.default.ok(result.stdout.includes("backup"), "Should mention backup");
    });
  });
  import_node_test.test.describe("Output Formats", () => {
    (0, import_node_test.test)("should output JSON format", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const output = result.stdout;
      import_node_assert.default.ok(JSON.parse(output), "Should be valid JSON");
    });
    (0, import_node_test.test)("should output Markdown format", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format markdown`);
      const output = result.stdout;
      import_node_assert.default.ok(output.includes("# AI Refactor Analysis Report"), "Should be Markdown");
      import_node_assert.default.ok(output.includes("## Summary"), "Should have Markdown structure");
    });
    (0, import_node_test.test)("should output console format by default", async () => {
      const result = await runCommand(`node dist/cli.js analyze ${testDir}`);
      const output = result.stdout;
      import_node_assert.default.ok(output.includes("\u{1F50D}"), "Should have console emojis");
      import_node_assert.default.ok(output.includes("Files analyzed"), "Should have console info");
    });
  });
  import_node_test.test.describe("Configuration", () => {
    (0, import_node_test.test)("should respect file patterns", async () => {
      const otherFile = (0, import_path.join)(testDir, "other.ts");
      await (0, import_promises.writeFile)(otherFile, TEST_CODE);
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --pattern "**/*.js" --format json`);
      const analysis = JSON.parse(result.stdout);
      const jsFiles = analysis.files.filter((file) => file.endsWith(".js"));
      const tsFiles = analysis.files.filter((file) => file.endsWith(".ts"));
      import_node_assert.default.ok(jsFiles.length > 0, "Should find JS files");
      import_node_assert.default.strictEqual(tsFiles.length, 0, "Should not find TS files");
    });
    (0, import_node_test.test)("should respect ignore patterns", async () => {
      const nodeModulesDir = (0, import_path.join)(testDir, "node_modules", "test-package");
      await (0, import_promises.mkdir)(nodeModulesDir, { recursive: true });
      await (0, import_promises.writeFile)((0, import_path.join)(nodeModulesDir, "test.js"), TEST_CODE);
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --format json`);
      const analysis = JSON.parse(result.stdout);
      const nodeModulesFiles = analysis.files.filter((file) => file.includes("node_modules"));
      import_node_assert.default.strictEqual(nodeModulesFiles.length, 0, "Should not ignore node_modules files");
    });
    (0, import_node_test.test)("should load configuration file", async () => {
      const configFile = (0, import_path.join)(testDir, "ai-refactor-config.json");
      const config = {
        patterns: ["**/*.js"],
        outputFormat: "json",
        aiProvider: "local"
      };
      await (0, import_promises.writeFile)(configFile, JSON.stringify(config, null, 2));
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --config ${configFile}`);
      import_node_assert.default.ok(result.exitCode === 0, "Should succeed with config file");
    });
  });
  import_node_test.test.describe("Error Handling", () => {
    (0, import_node_test.test)("should handle non-existent paths", async () => {
      const result = await runCommand(`node dist/cli.js analyze /nonexistent/path`);
      import_node_assert.default.notStrictEqual(result.exitCode, 0, "Should fail with non-existent path");
      import_node_assert.default.ok(result.stderr.includes("failed"), "Should show error message");
    });
    (0, import_node_test.test)("should handle invalid JSON config", async () => {
      const configFile = (0, import_path.join)(testDir, "invalid-config.json");
      await (0, import_promises.writeFile)(configFile, "invalid json content");
      const result = await runCommand(`node dist/cli.js analyze ${testDir} --config ${configFile}`);
      import_node_assert.default.ok(result.exitCode === 0, "Should continue with defaults");
    });
    (0, import_node_test.test)("should handle empty directory", async () => {
      const emptyDir = (0, import_path.join)(testDir, "empty");
      await (0, import_promises.mkdir)(emptyDir);
      const result = await runCommand(`node dist/cli.js analyze ${emptyDir}`);
      import_node_assert.default.ok(result.exitCode === 0, "Should handle empty directory");
      import_node_assert.default.ok(result.stdout.includes("No issues found"), "Should show no issues message");
    });
  });
});
async function runCommand(command) {
  try {
    return await execAsync(command, { timeout: 3e4 });
  } catch (error) {
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      exitCode: error.code || 1
    };
  }
}
//# sourceMappingURL=ai-refactor.test.cjs.map