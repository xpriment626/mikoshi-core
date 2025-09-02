/**
 * Custom matchers for Vitest testing
 */

import type { 
  Conversation, 
  Message, 
  InvariantViolation,
  ChaosResult 
} from '@mikoshi/types';

declare global {
  namespace Vi {
    interface Assertion {
      toBeValidConversation(): void;
      toHaveMessageCount(count: number): void;
      toHaveViolations(count: number): void;
      toBeChronological(): void;
      toBeDeterministic(other: ChaosResult): void;
    }
  }
}

/**
 * Check if a conversation is valid
 */
export function toBeValidConversation(received: any) {
  const pass = 
    received &&
    typeof received === 'object' &&
    'id' in received &&
    'agents' in received &&
    'messages' in received &&
    Array.isArray(received.agents) &&
    Array.isArray(received.messages) &&
    typeof received.startTime === 'number';

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${JSON.stringify(received)} not to be a valid conversation`
        : `Expected ${JSON.stringify(received)} to be a valid conversation`,
  };
}

/**
 * Check message count
 */
export function toHaveMessageCount(received: Conversation, expected: number) {
  const actual = received.messages.length;
  const pass = actual === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected conversation not to have ${expected} messages`
        : `Expected conversation to have ${expected} messages, but has ${actual}`,
  };
}

/**
 * Check violation count
 */
export function toHaveViolations(received: InvariantViolation[], expected: number) {
  const actual = received.length;
  const pass = actual === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected not to have ${expected} violations`
        : `Expected to have ${expected} violations, but has ${actual}`,
  };
}

/**
 * Check if messages are in chronological order
 */
export function toBeChronological(received: Message[]) {
  let pass = true;
  let failedAt = -1;

  for (let i = 1; i < received.length; i++) {
    if (received[i].timestamp < received[i - 1].timestamp) {
      pass = false;
      failedAt = i;
      break;
    }
  }

  return {
    pass,
    message: () =>
      pass
        ? `Expected messages not to be in chronological order`
        : `Expected messages to be in chronological order, but message at index ${failedAt} (timestamp: ${received[failedAt].timestamp}) comes before message at index ${failedAt - 1} (timestamp: ${received[failedAt - 1].timestamp})`,
  };
}

/**
 * Check if chaos results are deterministic
 */
export function toBeDeterministic(received: ChaosResult, expected: ChaosResult) {
  const pass = 
    received.seed === expected.seed &&
    received.affectedMessages === expected.affectedMessages &&
    received.mode === expected.mode &&
    JSON.stringify(received.statistics) === JSON.stringify(expected.statistics);

  return {
    pass,
    message: () =>
      pass
        ? `Expected chaos results not to be deterministic`
        : `Expected chaos results to be deterministic\nReceived: ${JSON.stringify(received, null, 2)}\nExpected: ${JSON.stringify(expected, null, 2)}`,
  };
}

/**
 * Register custom matchers with Vitest
 */
export function registerCustomMatchers() {
  if (typeof expect !== 'undefined' && expect.extend) {
    expect.extend({
      toBeValidConversation,
      toHaveMessageCount,
      toHaveViolations,
      toBeChronological,
      toBeDeterministic,
    });
  }
}