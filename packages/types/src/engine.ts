/**
 * Core engine interfaces for Mikoshi
 *
 * These interfaces define the contract for all engine components,
 * enabling proper abstraction, testability, and extensibility.
 */

import type { Conversation, Message, Agent } from './conversation';
import type { ChaosMode, ChaosResult } from './chaos';
import type { InvariantRule, ValidationResult } from './invariant';

/**
 * Event emitted during conversation replay
 */
export interface ReplayEvent {
  type: 'message' | 'state_change' | 'checkpoint' | 'error';
  timestamp: number;
  data: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Options for replay engine execution
 */
export interface ReplayOptions {
  /** Speed multiplier for replay (1 = realtime, 0 = instant) */
  speed?: number;
  /** Start replay from specific message index */
  startIndex?: number;
  /** End replay at specific message index */
  endIndex?: number;
  /** Enable reverse playback */
  reverse?: boolean;
  /** Checkpoint interval for long replays */
  checkpointInterval?: number;
  /** Enable streaming mode for large conversations */
  streaming?: boolean;
}

/**
 * Snapshot of replay state for persistence
 */
export interface ReplaySnapshot {
  conversationId: string;
  currentIndex: number;
  timestamp: number;
  state: Record<string, unknown>;
  checkpoints: Array<{
    index: number;
    timestamp: number;
    state: Record<string, unknown>;
  }>;
}

/**
 * ReplayEngine - Core interface for conversation replay
 *
 * Implements event sourcing pattern for deterministic replay
 * with support for forward/reverse playback and state snapshots.
 */
export interface ReplayEngine {
  /**
   * Load a conversation for replay
   */
  load(conversation: Conversation): Promise<void>;

  /**
   * Start replay with specified options
   */
  play(options?: ReplayOptions): AsyncGenerator<ReplayEvent>;

  /**
   * Pause current replay
   */
  pause(): void;

  /**
   * Resume paused replay
   */
  resume(): void;

  /**
   * Stop replay and reset state
   */
  stop(): void;

  /**
   * Seek to specific message index
   */
  seek(index: number): Promise<void>;

  /**
   * Get current replay position
   */
  getCurrentIndex(): number;

  /**
   * Create state snapshot
   */
  snapshot(): ReplaySnapshot;

  /**
   * Restore from snapshot
   */
  restore(snapshot: ReplaySnapshot): Promise<void>;

  /**
   * Register event handler
   */
  on(
    event: 'message' | 'state_change' | 'checkpoint' | 'error',
    handler: (event: ReplayEvent) => void,
  ): void;

  /**
   * Remove event handler
   */
  off(event: string, handler: (event: ReplayEvent) => void): void;
}

/**
 * Options for chaos injection
 */
export interface ChaosInjectionOptions {
  /** Random seed for deterministic chaos */
  seed: number;
  /** Chaos intensity (0-100) */
  intensity?: number;
  /** Specific chaos modes to apply */
  modes?: ChaosMode[];
  /** Enable chaos timeline recording */
  recordTimeline?: boolean;
  /** Custom probability distributions */
  distributions?: Record<string, (rng: unknown) => number>;
}

/**
 * Timeline entry for chaos events
 */
export interface ChaosTimelineEntry {
  timestamp: number;
  messageIndex: number;
  mode: string;
  action: string;
  details: Record<string, unknown>;
}

/**
 * ChaosInjector - Interface for deterministic chaos injection
 *
 * Applies various failure modes to conversations with
 * statistical guarantees and reproducibility via seeds.
 */
export interface ChaosInjector {
  /**
   * Configure chaos parameters
   */
  configure(options: ChaosInjectionOptions): void;

  /**
   * Apply chaos to a conversation
   */
  inject(conversation: Conversation): Promise<ChaosResult>;

  /**
   * Apply chaos to streaming messages
   */
  injectStream(messages: AsyncIterable<Message>): AsyncGenerator<Message>;

  /**
   * Validate chaos distribution statistically
   */
  validateDistribution(samples: number): Promise<
    {
      mode: string;
      expected: number;
      actual: number;
      chiSquare: number;
      passed: boolean;
    }[]
  >;

  /**
   * Get chaos timeline for visualization
   */
  getTimeline(): ChaosTimelineEntry[];

  /**
   * Reset injector state
   */
  reset(): void;

  /**
   * Generate chaos fingerprint for reproducibility
   */
  fingerprint(): string;
}

/**
 * Options for invariant validation
 */
export interface ValidationOptions {
  /** Stop on first violation */
  failFast?: boolean;
  /** Enable parallel validation */
  parallel?: boolean;
  /** Custom context for rules */
  context?: Record<string, unknown>;
  /** Validation timeout in ms */
  timeout?: number;
  /** Enable streaming validation */
  streaming?: boolean;
}

/**
 * Validation context passed to rules
 */
export interface ValidationContext {
  conversation: Conversation;
  currentMessage?: Message;
  previousMessages: Message[];
  agents: Map<string, Agent>;
  variables: Record<string, unknown>;
  metrics: {
    messageCount: number;
    duration: number;
    avgResponseTime: number;
  };
}

/**
 * InvariantValidator - Interface for rule-based validation
 *
 * Validates conversations against defined invariants with
 * support for complex rules and streaming validation.
 */
export interface InvariantValidator {
  /**
   * Register validation rules
   */
  addRule(rule: InvariantRule): void;

  /**
   * Register multiple rules
   */
  addRules(rules: InvariantRule[]): void;

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId: string): void;

  /**
   * Clear all rules
   */
  clearRules(): void;

  /**
   * Validate entire conversation
   */
  validate(conversation: Conversation, options?: ValidationOptions): Promise<ValidationResult>;

  /**
   * Validate streaming messages
   */
  validateStream(
    messages: AsyncIterable<Message>,
    options?: ValidationOptions,
  ): AsyncGenerator<ValidationResult>;

  /**
   * Check for rule conflicts
   */
  detectConflicts(): Array<{
    rule1: string;
    rule2: string;
    reason: string;
  }>;

  /**
   * Compile rules for performance
   */
  compile(): void;

  /**
   * Get validation statistics
   */
  getStats(): {
    rulesEvaluated: number;
    violationsFound: number;
    avgValidationTime: number;
  };
}

/**
 * Format parser plugin interface
 */
export interface FormatParser {
  /** Unique identifier for the parser */
  id: string;

  /** Human-readable name */
  name: string;

  /** Supported format identifiers */
  formats: string[];

  /**
   * Check if content matches this format
   */
  detect(content: string | object): boolean;

  /**
   * Parse content into Conversation
   */
  parse(content: string | object): Promise<Conversation>;

  /**
   * Serialize Conversation back to format
   */
  serialize(conversation: Conversation): Promise<string | object>;

  /**
   * Validate format-specific constraints
   */
  validate(content: string | object): { valid: boolean; errors?: string[] };
}

/**
 * Parser registry for managing format parsers
 */
export interface ParserRegistry {
  /**
   * Register a parser plugin
   */
  register(parser: FormatParser): void;

  /**
   * Unregister a parser
   */
  unregister(parserId: string): void;

  /**
   * Get parser by format
   */
  getParser(format: string): FormatParser | undefined;

  /**
   * Auto-detect format and get parser
   */
  detectFormat(content: string | object): FormatParser | undefined;

  /**
   * List all registered parsers
   */
  listParsers(): FormatParser[];

  /**
   * Parse with auto-detection
   */
  parse(content: string | object, format?: string): Promise<Conversation>;
}

/**
 * Test orchestrator for managing test execution
 */
export interface TestOrchestrator {
  /**
   * Schedule a test run
   */
  schedule(testConfig: {
    conversation: Conversation;
    chaosOptions?: ChaosInjectionOptions;
    validationRules?: InvariantRule[];
    variations?: number;
  }): Promise<string>; // Returns job ID

  /**
   * Execute test immediately
   */
  execute(jobId: string): AsyncGenerator<{
    phase: 'setup' | 'chaos' | 'validation' | 'complete';
    progress: number;
    details?: unknown;
  }>;

  /**
   * Get test status
   */
  getStatus(jobId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    results?: unknown;
  }>;

  /**
   * Cancel test execution
   */
  cancel(jobId: string): Promise<void>;

  /**
   * Get test results
   */
  getResults(jobId: string): Promise<{
    summary: {
      passed: boolean;
      duration: number;
      variationsRun: number;
      violationsFound: number;
    };
    chaos: ChaosResult[];
    validation: ValidationResult[];
    timeline: Array<{
      timestamp: number;
      event: string;
      details: unknown;
    }>;
  }>;
}

/**
 * Engine factory for creating engine instances
 */
export interface EngineFactory {
  createReplayEngine(config?: unknown): ReplayEngine;
  createChaosInjector(config?: unknown): ChaosInjector;
  createInvariantValidator(config?: unknown): InvariantValidator;
  createParserRegistry(config?: unknown): ParserRegistry;
  createTestOrchestrator(config?: unknown): TestOrchestrator;
}
