/**
 * Test execution and orchestration types
 */

import type { Conversation } from './conversation';
import type { ChaosConfiguration, ChaosResult } from './chaos';
import type { Invariant, ValidationResult } from './invariant';

export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  conversation: Conversation;
  chaosConfigurations: ChaosConfiguration[];
  invariants: Invariant[];
  expectedOutcome?: ExpectedOutcome;
  tags?: string[];
}

export interface ExpectedOutcome {
  shouldPass: boolean;
  expectedViolations?: string[];
  expectedErrors?: string[];
}

export interface TestExecution {
  id: string;
  scenarioId: string;
  startTime: number;
  endTime?: number;
  status: TestStatus;
  results: TestResults;
  metadata?: Record<string, unknown>;
}

export type TestStatus = 
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'error'
  | 'skipped';

export interface TestResults {
  chaosResults: ChaosResult[];
  validationResult: ValidationResult;
  performance: PerformanceMetrics;
  errors: TestError[];
}

export interface PerformanceMetrics {
  executionTime: number;
  messagesProcessed: number;
  throughput: number; // messages per second
  memoryUsage: {
    peak: number;
    average: number;
  };
}

export interface TestError {
  timestamp: number;
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export interface TestSuite {
  id: string;
  name: string;
  scenarios: TestScenario[];
  configuration: TestSuiteConfig;
}

export interface TestSuiteConfig {
  parallel: boolean;
  maxParallel?: number;
  timeout?: number;
  retryFailedTests?: boolean;
  maxRetries?: number;
  coverage?: CoverageConfig;
}

export interface CoverageConfig {
  enabled: boolean;
  thresholds: {
    branches: number;
    functions: number;
    lines: number;
    statements: number;
  };
}

export interface TestReport {
  suiteId: string;
  executions: TestExecution[];
  summary: TestSummary;
  coverage?: CoverageReport;
  generatedAt: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  error: number;
  skipped: number;
  duration: number;
  successRate: number;
}

export interface CoverageReport {
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
  statements: CoverageMetric;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}