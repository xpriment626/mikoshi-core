/**
 * Custom error classes for Mikoshi
 */

/**
 * Base error class for Mikoshi
 */
export class MikoshiError extends Error {
  public readonly code: string;
  public readonly timestamp: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'MIKOSHI_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MikoshiError';
    this.code = code;
    this.timestamp = Date.now();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
export class ValidationError extends MikoshiError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

/**
 * Parse error for conversation formats
 */
export class ParseError extends MikoshiError {
  public readonly format?: string;

  constructor(
    message: string,
    format?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'PARSE_ERROR', context);
    this.name = 'ParseError';
    this.format = format;
  }
}

/**
 * Chaos injection error
 */
export class ChaosError extends MikoshiError {
  public readonly mode?: string;

  constructor(
    message: string,
    mode?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'CHAOS_ERROR', context);
    this.name = 'ChaosError';
    this.mode = mode;
  }
}

/**
 * Invariant violation error
 */
export class InvariantViolationError extends MikoshiError {
  public readonly invariantId: string;
  public readonly severity: 'error' | 'warning' | 'info';

  constructor(
    message: string,
    invariantId: string,
    severity: 'error' | 'warning' | 'info' = 'error',
    context?: Record<string, unknown>
  ) {
    super(message, 'INVARIANT_VIOLATION', context);
    this.name = 'InvariantViolationError';
    this.invariantId = invariantId;
    this.severity = severity;
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends MikoshiError {
  public readonly timeout: number;

  constructor(
    message: string,
    timeout: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'TIMEOUT_ERROR', context);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends MikoshiError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', context);
    this.name = 'ConfigurationError';
  }
}

/**
 * Not implemented error
 */
export class NotImplementedError extends MikoshiError {
  constructor(feature: string, context?: Record<string, unknown>) {
    super(`Feature not implemented: ${feature}`, 'NOT_IMPLEMENTED', context);
    this.name = 'NotImplementedError';
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends MikoshiError {
  public readonly resource: string;

  constructor(
    resource: string,
    message?: string,
    context?: Record<string, unknown>
  ) {
    super(
      message || `Resource not found: ${resource}`,
      'NOT_FOUND',
      context
    );
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

/**
 * Agent error
 */
export class AgentError extends MikoshiError {
  public readonly agentId: string;
  public readonly failureType: string;

  constructor(
    message: string,
    agentId: string,
    failureType: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'AGENT_ERROR', context);
    this.name = 'AgentError';
    this.agentId = agentId;
    this.failureType = failureType;
  }
}

/**
 * Test execution error
 */
export class TestExecutionError extends MikoshiError {
  public readonly testId?: string;
  public readonly phase?: string;

  constructor(
    message: string,
    testId?: string,
    phase?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'TEST_EXECUTION_ERROR', context);
    this.name = 'TestExecutionError';
    this.testId = testId;
    this.phase = phase;
  }
}

/**
 * Error aggregator for multiple errors
 */
export class AggregateError extends MikoshiError {
  public readonly errors: Error[];

  constructor(errors: Error[], message?: string) {
    const errorMessage =
      message || `Multiple errors occurred: ${errors.length} errors`;
    super(errorMessage, 'AGGREGATE_ERROR');
    this.name = 'AggregateError';
    this.errors = errors;
  }

  public getErrorSummary(): string {
    return this.errors
      .map((err, idx) => `${idx + 1}. ${err.message}`)
      .join('\n');
  }
}

/**
 * Create an error with retry information
 */
export class RetryableError extends MikoshiError {
  public readonly retryable: boolean;
  public readonly retryAfter?: number;

  constructor(
    message: string,
    retryable: boolean = true,
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'RETRYABLE_ERROR', context);
    this.name = 'RetryableError';
    this.retryable = retryable;
    this.retryAfter = retryAfter;
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Check if error is retryable
   */
  static isRetryable(error: Error): boolean {
    if (error instanceof RetryableError) {
      return error.retryable;
    }
    
    // Network errors are typically retryable
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND')) {
      return true;
    }
    
    return false;
  }

  /**
   * Format error for logging
   */
  static format(error: Error): string {
    if (error instanceof MikoshiError) {
      return `[${error.code}] ${error.message}${
        error.context ? ` | Context: ${JSON.stringify(error.context)}` : ''
      }`;
    }
    return error.message;
  }

  /**
   * Extract error details
   */
  static getDetails(error: Error): Record<string, unknown> {
    if (error instanceof MikoshiError) {
      return {
        name: error.name,
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        context: error.context,
        stack: error.stack,
      };
    }
    
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
}