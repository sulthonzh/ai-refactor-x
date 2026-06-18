import { AIRefactor } from './AIRefactor.js';
import type {
  RefactorConfig,
  AnalysisResult,
  RefactorOptions,
  CodeIssue,
  RefactoringSuggestion
} from './types.js';

export { AIRefactor };

// Create default instance
export const createRefactor = (config?: RefactorConfig) => {
  return new AIRefactor(config);
};

// Default instance
export const aiRefactor = new AIRefactor();

// Convenience functions
export const analyze = async (path: string, config?: RefactorConfig) => {
  return aiRefactor.analyze(path, config);
};

export const refactor = async (path: string, options?: RefactorOptions) => {
  return aiRefactor.refactor(path, options);
};

export const fix = async (path: string, issues?: CodeIssue[]) => {
  return aiRefactor.fix(path, issues);
};

export const suggest = async (path: string, issues?: CodeIssue[]) => {
  return aiRefactor.suggest(path, issues);
};