/**
 * Test helper utilities
 */

import type { 
  Conversation, 
  Message, 
  ChaosResult,
  ValidationResult,
  InvariantViolation,
} from '@mikoshi/types';

/**
 * Assert that a conversation is valid
 */
export function assertValidConversation(conversation: Conversation): void {
  expect(conversation).toBeDefined();
  expect(conversation.id).toBeTruthy();
  expect(conversation.agents).toBeInstanceOf(Array);
  expect(conversation.messages).toBeInstanceOf(Array);
  expect(conversation.startTime).toBeGreaterThan(0);
}

/**
 * Assert that messages are in chronological order
 */
export function assertChronologicalOrder(messages: Message[]): void {
  for (let i = 1; i < messages.length; i++) {
    expect(messages[i].timestamp).toBeGreaterThanOrEqual(
      messages[i - 1].timestamp
    );
  }
}

/**
 * Assert that chaos was applied correctly
 */
export function assertChaosApplied(
  original: Conversation,
  modified: Conversation,
  chaosResult: ChaosResult
): void {
  expect(chaosResult.affectedMessages).toBeGreaterThan(0);
  expect(modified.messages.length).toBeLessThanOrEqual(original.messages.length);
  
  // Check that seed produced deterministic results
  if (chaosResult.seed) {
    expect(chaosResult.seed).toBeDefined();
  }
}

/**
 * Assert validation results are consistent
 */
export function assertValidationResults(
  result: ValidationResult,
  expectedViolations: number = 0
): void {
  expect(result).toBeDefined();
  expect(result.violations).toBeInstanceOf(Array);
  expect(result.violations.length).toBe(expectedViolations);
  expect(result.passed).toBe(expectedViolations === 0);
  expect(result.summary.totalViolations).toBe(expectedViolations);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Create a mock conversation with specific properties
 */
export function createMockConversation(
  overrides: Partial<Conversation> = {}
): Conversation {
  return {
    id: 'mock_conv_1',
    format: 'custom',
    agents: [
      { id: 'agent1', name: 'Agent 1', type: 'worker' },
      { id: 'agent2', name: 'Agent 2', type: 'validator' },
    ],
    messages: [
      {
        id: 'msg1',
        agentId: 'agent1',
        content: 'Test message 1',
        timestamp: 1000,
      },
      {
        id: 'msg2',
        agentId: 'agent2',
        content: 'Test message 2',
        timestamp: 2000,
      },
    ],
    startTime: 1000,
    endTime: 2000,
    ...overrides,
  };
}

/**
 * Create a mock violation
 */
export function createMockViolation(
  overrides: Partial<InvariantViolation> = {}
): InvariantViolation {
  return {
    invariantId: 'inv_1',
    timestamp: Date.now(),
    description: 'Test violation',
    severity: 'error',
    ...overrides,
  };
}

/**
 * Compare two conversations for equality
 */
export function conversationsEqual(
  conv1: Conversation,
  conv2: Conversation
): boolean {
  if (conv1.id !== conv2.id) return false;
  if (conv1.messages.length !== conv2.messages.length) return false;
  if (conv1.agents.length !== conv2.agents.length) return false;
  
  for (let i = 0; i < conv1.messages.length; i++) {
    if (conv1.messages[i].id !== conv2.messages[i].id) return false;
    if (conv1.messages[i].content !== conv2.messages[i].content) return false;
  }
  
  return true;
}

/**
 * Calculate statistics for a set of chaos results
 */
export function calculateChaosStatistics(
  results: ChaosResult[]
): {
  totalAffected: number;
  averageAffected: number;
  minAffected: number;
  maxAffected: number;
} {
  if (results.length === 0) {
    return {
      totalAffected: 0,
      averageAffected: 0,
      minAffected: 0,
      maxAffected: 0,
    };
  }
  
  const affected = results.map((r) => r.affectedMessages);
  return {
    totalAffected: affected.reduce((a, b) => a + b, 0),
    averageAffected: affected.reduce((a, b) => a + b, 0) / affected.length,
    minAffected: Math.min(...affected),
    maxAffected: Math.max(...affected),
  };
}

/**
 * Verify deterministic chaos behavior
 */
export function verifyDeterministicChaos(
  results1: ChaosResult,
  results2: ChaosResult
): void {
  expect(results1.seed).toBe(results2.seed);
  expect(results1.affectedMessages).toBe(results2.affectedMessages);
  expect(results1.mode).toBe(results2.mode);
  expect(results1.statistics).toEqual(results2.statistics);
}

/**
 * Create a test timeout with cleanup
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
    
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Retry a test operation
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Measure operation performance
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await operation();
  const duration = performance.now() - startTime;
  
  return { result, duration };
}

/**
 * Create snapshot-safe object (remove timestamps, ids)
 */
export function toSnapshot(obj: any): any {
  const snapshot = JSON.parse(JSON.stringify(obj));
  
  function clean(item: any): any {
    if (Array.isArray(item)) {
      return item.map(clean);
    }
    
    if (item && typeof item === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(item)) {
        if (key === 'id' || key === 'timestamp' || key === 'startTime' || key === 'endTime') {
          cleaned[key] = '[DYNAMIC]';
        } else {
          cleaned[key] = clean(value);
        }
      }
      return cleaned;
    }
    
    return item;
  }
  
  return clean(snapshot);
}