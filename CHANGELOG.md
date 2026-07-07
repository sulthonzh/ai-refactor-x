# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-08

### Fixed
- **Critical:** `FileProcessor.findFilesByPattern()` variable shadowing — extension-based file discovery returned empty arrays due to inner `const files` shadowing outer variable
- **Critical:** `AIRefactor.fix()` was a no-op — suggestions array was always empty, `applyFixes()` had nothing to apply. Now generates suggestions from issues before applying
- `AIFixer.generateGenericFix()` no longer inserts `// TODO: Refactor this code` (a refactoring tool should not create TODOs)
- Removed unused imports: `readdir`, `join`, `extname`, `relative` from AIRefactor.ts; `access`, `mkdir` from AIFixer.ts

### Added
- STATUS.md with full exceptional checklist audit
- CHANGELOG.md

## [1.0.0] - 2026-06-22

### Added
- Zero-dependency static code analysis engine
- AI-powered refactoring suggestions (no API keys required)
- Issue detection: magic numbers, debug code, TODOs/FIXMEs, long functions, code duplication, complex conditionals, nested loops, unused variables, complex imports, null checks
- Per-category fix strategies with confidence scoring
- File processing with glob pattern matching and ignore rules
- Output formatting: JSON, Markdown, Console
- Full CLI: `analyze`, `refactor`, `fix`, `suggest`, `info` commands
- Programmatic API with configurable patterns, ignore rules, depth, and maxFiles
- Backup and restore capabilities
- TypeScript strict mode, ESM, Node >=18
