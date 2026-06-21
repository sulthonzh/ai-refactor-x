# Changelog

All notable changes to ai-refactor-x will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-22

### Added
- VERSION export constant for programmatic version access
- test:core script for core functionality testing
- Enhanced README with comparison table vs alternatives
- Added real-world examples for CI/CD integration and legacy codebase migration
- Performance audit documentation (O(n) operations, no memory leaks)
- Security audit documentation (no hardcoded secrets, input validation)

### Improved
- README hook updated with test count (24 tests, 100% pass rate)
- README quick start section verified to work in <2 minutes
- Documentation updates for production use cases
- Added 3 comprehensive real-world examples

### Fixed
- No core functionality changes in this release
- All 24 tests passing (100% pass rate)

## [1.0.0] - 2026-06-18

### Added
- Initial release of ai-refactor-x
- Core analysis functionality for code quality issues
- CLI tool with analyze, suggest, fix, and info commands
- Support for JSON, Markdown, and console output formats
- Comprehensive test suite (24 tests)
- Zero-dependency architecture
- Magic number detection
- TODO comment detection
- Console.log statement detection
- Unused variable detection
- Configuration file support (ai-refactor-config.json)
- Interactive and batch fixing modes
- Backup and restore capabilities
- Severity-based filtering
- Category-based filtering
- Dry-run mode for safe testing

### Implemented Features
- AI-powered code pattern recognition
- Automated fix suggestions with confidence scoring
- Detailed explanations for each refactoring
- Estimated time and code savings
- Multiple output formats (console, JSON, markdown)
- CLI with comprehensive options
- API for programmatic usage

### Documentation
- Comprehensive README with examples
- API usage documentation
- Configuration guide
- Integration guide for CI/CD, VS Code, Git hooks
- Performance tips and troubleshooting guide

[1.1.0]: https://github.com/sulthonzh/ai-refactor-x/releases/tag/v1.1.0
[1.0.0]: https://github.com/sulthonzh/ai-refactor-x/releases/tag/v1.0.0