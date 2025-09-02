/**
 * Conversation fixtures for testing
 */

import type { Conversation } from '@mikoshi/types';
import { ConversationFactory } from '../factories/conversation-factory';

const factory = new ConversationFactory(42); // Fixed seed for reproducibility

/**
 * Valid conversation fixtures
 */
export const validConversations = {
  simple: factory.createConversation({
    agentCount: 2,
    messageCount: 5,
    seed: 100,
  }),

  complex: factory.createConversation({
    agentCount: 5,
    messageCount: 50,
    seed: 101,
  }),

  sequential: factory.createConversation({
    agentCount: 3,
    messageCount: 10,
    seed: 102,
  }),

  concurrent: factory.createConversation({
    agentCount: 4,
    messageCount: 20,
    simulateDelays: false,
    seed: 103,
  }),
};

/**
 * Conversation fixtures with known violations
 */
export const violationConversations = {
  sequenceViolation: factory.createConversationWithViolation('sequence', {
    agentCount: 3,
    messageCount: 10,
    seed: 200,
  }),

  timingViolation: factory.createConversationWithViolation('timing', {
    agentCount: 2,
    messageCount: 8,
    seed: 201,
  }),

  contentViolation: factory.createConversationWithViolation('content', {
    agentCount: 3,
    messageCount: 12,
    seed: 202,
  }),

  stateViolation: factory.createConversationWithViolation('state', {
    agentCount: 4,
    messageCount: 15,
    seed: 203,
  }),
};

/**
 * Edge case conversation fixtures
 */
export const edgeCaseConversations = {
  empty: {
    id: 'empty_conv',
    format: 'custom' as const,
    agents: [],
    messages: [],
    startTime: Date.now(),
  },

  singleMessage: factory.createConversation({
    agentCount: 1,
    messageCount: 1,
    seed: 300,
  }),

  largeConversation: factory.createConversation({
    agentCount: 10,
    messageCount: 1000,
    seed: 301,
  }),

  rapidFire: factory.createConversation({
    agentCount: 2,
    messageCount: 100,
    simulateDelays: false,
    seed: 302,
  }),

  longDelay: (() => {
    const conv = factory.createConversation({
      agentCount: 2,
      messageCount: 5,
      seed: 303,
    });
    // Add 60 second gap between messages
    conv.messages.forEach((msg, idx) => {
      if (idx > 0) {
        msg.timestamp = conv.messages[idx - 1].timestamp + 60000;
      }
    });
    return conv;
  })(),
};

/**
 * Format-specific conversation fixtures
 */
export const formatConversations = {
  autogen: {
    ...factory.createConversation({
      format: 'autogen',
      agentCount: 3,
      messageCount: 10,
      seed: 400,
    }),
    metadata: {
      framework: 'autogen',
      version: '0.2.0',
    },
  },

  langchain: {
    ...factory.createConversation({
      format: 'langchain',
      agentCount: 2,
      messageCount: 8,
      seed: 401,
    }),
    metadata: {
      framework: 'langchain',
      version: '0.1.0',
      chain_type: 'sequential',
    },
  },

  crew: {
    ...factory.createConversation({
      format: 'crew',
      agentCount: 4,
      messageCount: 12,
      seed: 402,
    }),
    metadata: {
      framework: 'crew',
      version: '1.0.0',
      crew_size: 4,
    },
  },
};

/**
 * Get a conversation fixture by name
 */
export function getConversationFixture(
  category: 'valid' | 'violation' | 'edge-case' | 'format',
  name: string
): Conversation {
  const fixtures = {
    valid: validConversations,
    violation: violationConversations,
    'edge-case': edgeCaseConversations,
    format: formatConversations,
  };

  const categoryFixtures = fixtures[category];
  if (!categoryFixtures) {
    throw new Error(`Unknown fixture category: ${category}`);
  }

  const fixture = (categoryFixtures as any)[name];
  if (!fixture) {
    throw new Error(`Unknown fixture: ${category}/${name}`);
  }

  return fixture;
}

/**
 * Get all fixtures in a category
 */
export function getAllFixturesInCategory(
  category: 'valid' | 'violation' | 'edge-case' | 'format'
): Conversation[] {
  const fixtures = {
    valid: validConversations,
    violation: violationConversations,
    'edge-case': edgeCaseConversations,
    format: formatConversations,
  };

  const categoryFixtures = fixtures[category];
  if (!categoryFixtures) {
    throw new Error(`Unknown fixture category: ${category}`);
  }

  return Object.values(categoryFixtures);
}