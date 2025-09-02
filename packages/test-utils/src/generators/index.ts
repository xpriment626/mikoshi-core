/**
 * Property-based test generators using fast-check
 */

import * as fc from 'fast-check';
import type { 
  Message, 
  Agent, 
  Conversation,
  ChaosConfiguration,
  Invariant,
} from '@mikoshi/types';

/**
 * Generate arbitrary agent data
 */
export const arbitraryAgent = (): fc.Arbitrary<Agent> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    type: fc.oneof(
      fc.constant('coordinator'),
      fc.constant('worker'),
      fc.constant('validator'),
      fc.constant('observer')
    ),
    capabilities: fc.array(
      fc.oneof(
        fc.constant('text-generation'),
        fc.constant('code-execution'),
        fc.constant('data-analysis')
      ),
      { minLength: 0, maxLength: 5 }
    ),
    metadata: fc.option(fc.dictionary(fc.string(), fc.jsonValue())),
  });

/**
 * Generate arbitrary message data
 */
export const arbitraryMessage = (agentIds: string[]): fc.Arbitrary<Message> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    agentId: fc.constantFrom(...agentIds),
    content: fc.string({ minLength: 0, maxLength: 500 }),
    timestamp: fc.integer({ min: 0, max: Date.now() }),
    role: fc.option(
      fc.oneof(
        fc.constant('user'),
        fc.constant('assistant'),
        fc.constant('system'),
        fc.constant('function')
      )
    ),
    parentMessageId: fc.option(fc.string()),
    metadata: fc.option(fc.dictionary(fc.string(), fc.jsonValue())),
  });

/**
 * Generate arbitrary conversation data
 */
export const arbitraryConversation = (): fc.Arbitrary<Conversation> =>
  fc
    .tuple(
      fc.array(arbitraryAgent(), { minLength: 1, maxLength: 10 }),
      fc.integer({ min: 0, max: 100 })
    )
    .chain(([agents, messageCount]) =>
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        format: fc.oneof(
          fc.constant('autogen'),
          fc.constant('langchain'),
          fc.constant('crew'),
          fc.constant('custom')
        ),
        agents: fc.constant(agents),
        messages: fc.array(
          arbitraryMessage(agents.map((a) => a.id)),
          { minLength: 0, maxLength: messageCount }
        ),
        startTime: fc.integer({ min: 0, max: Date.now() }),
        endTime: fc.option(fc.integer({ min: 0, max: Date.now() })),
        metadata: fc.option(fc.dictionary(fc.string(), fc.jsonValue())),
      })
    );

/**
 * Generate message loss parameters
 */
export const arbitraryMessageLossConfig = (): fc.Arbitrary<ChaosConfiguration> =>
  fc.record({
    mode: fc.constant('message-loss'),
    seed: fc.option(fc.integer({ min: 0, max: 999999 })),
    probability: fc.float({ min: 0, max: 1 }),
    parameters: fc.record({
      lossRate: fc.float({ min: 0, max: 1 }),
      pattern: fc.oneof(
        fc.constant('random'),
        fc.constant('burst'),
        fc.constant('selective')
      ),
      targetAgents: fc.option(fc.array(fc.string())),
    }),
  });

/**
 * Generate delay parameters
 */
export const arbitraryDelayConfig = (): fc.Arbitrary<ChaosConfiguration> =>
  fc.record({
    mode: fc.constant('delay'),
    seed: fc.option(fc.integer({ min: 0, max: 999999 })),
    parameters: fc.record({
      minDelay: fc.integer({ min: 0, max: 5000 }),
      maxDelay: fc.integer({ min: 0, max: 10000 }),
      distribution: fc.oneof(
        fc.constant('uniform'),
        fc.constant('normal'),
        fc.constant('exponential')
      ),
      targetAgents: fc.option(fc.array(fc.string())),
    }),
  });

/**
 * Generate any chaos configuration
 */
export const arbitraryChaosConfig = (): fc.Arbitrary<ChaosConfiguration> =>
  fc.oneof(
    arbitraryMessageLossConfig(),
    arbitraryDelayConfig()
  );

/**
 * Generate sequence patterns for testing
 */
export const arbitrarySequencePattern = (): fc.Arbitrary<string[]> =>
  fc.array(
    fc.string({ minLength: 1, maxLength: 20 }),
    { minLength: 2, maxLength: 10 }
  );

/**
 * Generate timing constraints
 */
export const arbitraryTimingConstraints = (): fc.Arbitrary<{
  minLatency?: number;
  maxLatency?: number;
  timeout?: number;
}> =>
  fc.record({
    minLatency: fc.option(fc.integer({ min: 0, max: 1000 })),
    maxLatency: fc.option(fc.integer({ min: 0, max: 10000 })),
    timeout: fc.option(fc.integer({ min: 0, max: 30000 })),
  });

/**
 * Generate content patterns for validation
 */
export const arbitraryContentPattern = (): fc.Arbitrary<{
  field: string;
  operator: string;
  value: string;
}> =>
  fc.record({
    field: fc.oneof(fc.constant('content'), fc.constant('metadata.type')),
    operator: fc.oneof(
      fc.constant('contains'),
      fc.constant('not-contains'),
      fc.constant('equals'),
      fc.constant('matches')
    ),
    value: fc.string({ minLength: 1, maxLength: 100 }),
  });

/**
 * Generate test scenarios with specific properties
 */
export const arbitraryTestScenario = (): fc.Arbitrary<{
  conversation: Conversation;
  chaos: ChaosConfiguration[];
  expectedViolations: number;
}> =>
  fc.record({
    conversation: arbitraryConversation(),
    chaos: fc.array(arbitraryChaosConfig(), { minLength: 0, maxLength: 5 }),
    expectedViolations: fc.integer({ min: 0, max: 10 }),
  });

/**
 * Property: Message timestamps should be ordered
 */
export const orderedTimestamps = fc.property(
  arbitraryConversation(),
  (conversation) => {
    for (let i = 1; i < conversation.messages.length; i++) {
      if (conversation.messages[i].timestamp < conversation.messages[i - 1].timestamp) {
        return false;
      }
    }
    return true;
  }
);

/**
 * Property: Loss rate should match statistical distribution
 */
export const lossRateProperty = fc.property(
  fc.float({ min: 0, max: 1 }),
  fc.array(fc.boolean(), { minLength: 1000, maxLength: 1000 }),
  (targetRate, samples) => {
    const actualRate = samples.filter((s) => !s).length / samples.length;
    return Math.abs(actualRate - targetRate) < 0.05; // 5% tolerance
  }
);

/**
 * Property: Delays should be within specified bounds
 */
export const delayBoundsProperty = fc.property(
  fc.integer({ min: 0, max: 1000 }),
  fc.integer({ min: 1000, max: 5000 }),
  fc.array(fc.integer({ min: 0, max: 10000 }), { minLength: 100 }),
  (minDelay, maxDelay, delays) => {
    return delays.every((d) => d >= minDelay && d <= maxDelay);
  }
);