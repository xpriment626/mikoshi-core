/**
 * Rule and invariant fixtures for testing
 */

import type { Invariant } from '@mikoshi/types';
import { InvariantFactory } from '../factories/invariant-factory';

const factory = new InvariantFactory();

/**
 * Simple invariant rules
 */
export const simpleRules = {
  noEmptyMessages: factory.createContentInvariant({
    name: 'No Empty Messages',
    field: 'content',
    operator: 'not-equals',
    value: '',
    severity: 'warning',
  }),

  responseTime: factory.createTimingInvariant({
    name: 'Response Time Limit',
    maxLatency: 5000,
    severity: 'warning',
  }),

  agentOrder: factory.createSequenceInvariant({
    name: 'Agent Communication Order',
    pattern: ['coordinator', 'worker', 'validator'],
    ordering: 'strict',
    severity: 'error',
  }),

  requiredField: factory.createStateInvariant({
    name: 'Required Session ID',
    conditions: [{
      path: 'metadata.sessionId',
      operator: 'exists',
    }],
    severity: 'error',
  }),
};

/**
 * Complex invariant rules
 */
export const complexRules = {
  multiConditionState: factory.createStateInvariant({
    name: 'Complex State Validation',
    conditions: [
      { path: 'status', operator: 'equals', value: 'active' },
      { path: 'messageCount', operator: 'greater', value: 0 },
      { path: 'errors', operator: 'equals', value: [] },
    ],
    validation: 'all',
    severity: 'error',
  }),

  chainedSequence: factory.createSequenceInvariant({
    name: 'Multi-Step Process',
    pattern: ['initiate', 'process', 'validate', 'complete'],
    ordering: 'eventual',
    severity: 'error',
  }),

  piiDetection: factory.createContentInvariant({
    name: 'PII Detection - Comprehensive',
    field: 'content',
    operator: 'not-contains',
    value: /(\d{3}-\d{2}-\d{4})|(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    severity: 'error',
  }),

  complexTiming: factory.createTimingInvariant({
    name: 'Inter-Message Timing',
    minLatency: 10,
    maxLatency: 10000,
    between: ['request', 'response'],
    severity: 'warning',
  }),
};

/**
 * Invalid/malformed rules for error testing
 */
export const invalidRules = {
  emptyPattern: {
    id: 'invalid_1',
    name: 'Empty Pattern Rule',
    type: 'sequence' as const,
    rule: {
      type: 'sequence' as const,
      pattern: {
        events: [],
        ordering: 'strict' as const,
      },
    },
    severity: 'error' as const,
    enabled: true,
  },

  invalidOperator: {
    id: 'invalid_2',
    name: 'Invalid Operator Rule',
    type: 'content' as const,
    rule: {
      type: 'content' as const,
      checks: [{
        field: 'content',
        operator: 'invalid' as any,
        value: 'test',
      }],
    },
    severity: 'error' as const,
    enabled: true,
  },

  conflictingTiming: {
    id: 'invalid_3',
    name: 'Conflicting Timing Rule',
    type: 'timing' as const,
    rule: {
      type: 'timing' as const,
      constraints: [{
        minLatency: 5000,
        maxLatency: 1000, // Max less than min
      }],
    },
    severity: 'error' as const,
    enabled: true,
  },
};

/**
 * Common validation rule sets
 */
export const ruleSets = {
  basic: [
    simpleRules.noEmptyMessages,
    simpleRules.responseTime,
  ],

  strict: [
    simpleRules.noEmptyMessages,
    simpleRules.responseTime,
    simpleRules.agentOrder,
    simpleRules.requiredField,
    complexRules.piiDetection,
  ],

  performance: [
    simpleRules.responseTime,
    complexRules.complexTiming,
    factory.createTimingInvariant({
      name: 'P95 Response Time',
      maxLatency: 1000,
      severity: 'warning',
    }),
    factory.createTimingInvariant({
      name: 'P99 Response Time',
      maxLatency: 2000,
      severity: 'info',
    }),
  ],

  security: [
    complexRules.piiDetection,
    factory.createContentInvariant({
      name: 'No API Keys',
      field: 'content',
      operator: 'not-contains',
      value: /api[_-]?key[\s:=]+[\w-]{20,}/i,
      severity: 'error',
    }),
    factory.createContentInvariant({
      name: 'No Passwords',
      field: 'content',
      operator: 'not-contains',
      value: /password[\s:=]+\S+/i,
      severity: 'error',
    }),
  ],
};

/**
 * Get a rule fixture by name
 */
export function getRuleFixture(
  category: 'simple' | 'complex' | 'invalid',
  name: string
): Invariant {
  const fixtures = {
    simple: simpleRules,
    complex: complexRules,
    invalid: invalidRules,
  };

  const categoryFixtures = fixtures[category];
  if (!categoryFixtures) {
    throw new Error(`Unknown rule category: ${category}`);
  }

  const fixture = (categoryFixtures as any)[name];
  if (!fixture) {
    throw new Error(`Unknown rule: ${category}/${name}`);
  }

  return fixture;
}

/**
 * Get a predefined rule set
 */
export function getRuleSet(name: keyof typeof ruleSets): Invariant[] {
  const ruleSet = ruleSets[name];
  if (!ruleSet) {
    throw new Error(`Unknown rule set: ${name}`);
  }
  return ruleSet;
}