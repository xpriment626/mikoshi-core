/**
 * Factory for generating test invariants and rules
 */

import type {
  Invariant,
  InvariantType,
  SequenceRule,
  ContentRule,
  TimingRule,
  StateRule,
  CustomRule,
} from '@mikoshi/types';

export class InvariantFactory {
  private static idCounter = 0;

  /**
   * Create a sequence invariant rule
   */
  createSequenceInvariant(options: {
    name?: string;
    pattern: string[];
    ordering?: 'strict' | 'eventual' | 'concurrent';
    severity?: 'error' | 'warning' | 'info';
  }): Invariant {
    const rule: SequenceRule = {
      type: 'sequence',
      pattern: {
        events: options.pattern.map(p => ({
          messagePattern: p,
        })),
        ordering: options.ordering || 'strict',
      },
    };

    return {
      id: this.generateId('inv'),
      name: options.name || `Sequence: ${options.pattern.join(' -> ')}`,
      type: 'sequence',
      rule,
      severity: options.severity || 'error',
      enabled: true,
    };
  }

  /**
   * Create a content validation invariant
   */
  createContentInvariant(options: {
    name?: string;
    field: string;
    operator: 'contains' | 'not-contains' | 'matches' | 'equals' | 'not-equals';
    value: string | RegExp;
    severity?: 'error' | 'warning' | 'info';
  }): Invariant {
    const rule: ContentRule = {
      type: 'content',
      checks: [{
        field: options.field,
        operator: options.operator,
        value: options.value,
        caseSensitive: false,
      }],
    };

    return {
      id: this.generateId('inv'),
      name: options.name || `Content: ${options.field} ${options.operator} ${options.value}`,
      type: 'content',
      rule,
      severity: options.severity || 'warning',
      enabled: true,
    };
  }

  /**
   * Create a timing constraint invariant
   */
  createTimingInvariant(options: {
    name?: string;
    maxLatency?: number;
    minLatency?: number;
    timeout?: number;
    between?: [string, string];
    severity?: 'error' | 'warning' | 'info';
  }): Invariant {
    const rule: TimingRule = {
      type: 'timing',
      constraints: [{
        maxLatency: options.maxLatency,
        minLatency: options.minLatency,
        timeout: options.timeout,
        between: options.between,
      }],
    };

    return {
      id: this.generateId('inv'),
      name: options.name || `Timing: latency constraints`,
      type: 'timing',
      rule,
      severity: options.severity || 'warning',
      enabled: true,
    };
  }

  /**
   * Create a state validation invariant
   */
  createStateInvariant(options: {
    name?: string;
    conditions: Array<{
      path: string;
      operator: 'exists' | 'equals' | 'greater' | 'less' | 'in' | 'not-in';
      value?: unknown;
    }>;
    validation?: 'all' | 'any';
    severity?: 'error' | 'warning' | 'info';
  }): Invariant {
    const rule: StateRule = {
      type: 'state',
      conditions: options.conditions,
      validation: options.validation || 'all',
    };

    return {
      id: this.generateId('inv'),
      name: options.name || `State: ${options.conditions.length} conditions`,
      type: 'state',
      rule,
      severity: options.severity || 'error',
      enabled: true,
    };
  }

  /**
   * Create a custom validation invariant
   */
  createCustomInvariant(options: {
    name?: string;
    validator: string;
    parameters?: Record<string, unknown>;
    severity?: 'error' | 'warning' | 'info';
  }): Invariant {
    const rule: CustomRule = {
      type: 'custom',
      validator: options.validator,
      parameters: options.parameters,
    };

    return {
      id: this.generateId('inv'),
      name: options.name || `Custom: ${options.validator}`,
      type: 'custom',
      rule,
      severity: options.severity || 'error',
      enabled: true,
    };
  }

  /**
   * Create a PII detection invariant
   */
  createPIIDetectionInvariant(): Invariant {
    return this.createContentInvariant({
      name: 'PII Detection - SSN',
      field: 'content',
      operator: 'not-contains',
      value: /\d{3}-\d{2}-\d{4}/,
      severity: 'error',
    });
  }

  /**
   * Create a response time invariant
   */
  createResponseTimeInvariant(maxMs: number = 5000): Invariant {
    return this.createTimingInvariant({
      name: `Response Time < ${maxMs}ms`,
      maxLatency: maxMs,
      severity: 'warning',
    });
  }

  /**
   * Create an agent ordering invariant
   */
  createAgentOrderingInvariant(agents: string[]): Invariant {
    return this.createSequenceInvariant({
      name: `Agent Order: ${agents.join(' -> ')}`,
      pattern: agents,
      ordering: 'strict',
      severity: 'error',
    });
  }

  /**
   * Create a set of common invariants
   */
  createCommonInvariants(): Invariant[] {
    return [
      this.createPIIDetectionInvariant(),
      this.createResponseTimeInvariant(5000),
      this.createContentInvariant({
        name: 'No Empty Messages',
        field: 'content',
        operator: 'not-equals',
        value: '',
        severity: 'warning',
      }),
      this.createStateInvariant({
        name: 'Valid Agent Status',
        conditions: [
          {
            path: 'status',
            operator: 'in',
            value: ['active', 'inactive', 'failed'],
          },
        ],
        severity: 'error',
      }),
      this.createTimingInvariant({
        name: 'No Message Timeout',
        timeout: 30000,
        severity: 'error',
      }),
    ];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${++InvariantFactory.idCounter}_${Date.now()}`;
  }
}