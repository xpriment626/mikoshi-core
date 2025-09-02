/**
 * Invariant and rule types for validation
 */

export type InvariantType = 
  | 'sequence'
  | 'content'
  | 'timing'
  | 'state'
  | 'custom';

export interface Invariant {
  id: string;
  name: string;
  description?: string;
  type: InvariantType;
  rule: InvariantRule;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export type InvariantRule = 
  | SequenceRule
  | ContentRule
  | TimingRule
  | StateRule
  | CustomRule;

export interface SequenceRule {
  type: 'sequence';
  pattern: SequencePattern;
}

export interface SequencePattern {
  events: SequenceEvent[];
  ordering: 'strict' | 'eventual' | 'concurrent';
  timeout?: number;
}

export interface SequenceEvent {
  agentId?: string;
  messagePattern?: string;
  metadata?: Record<string, unknown>;
}

export interface ContentRule {
  type: 'content';
  checks: ContentCheck[];
}

export interface ContentCheck {
  field: string;
  operator: 'contains' | 'not-contains' | 'matches' | 'equals' | 'not-equals';
  value: string | RegExp;
  caseSensitive?: boolean;
}

export interface TimingRule {
  type: 'timing';
  constraints: TimingConstraint[];
}

export interface TimingConstraint {
  between?: [string, string]; // [eventA, eventB]
  maxLatency?: number;
  minLatency?: number;
  timeout?: number;
}

export interface StateRule {
  type: 'state';
  conditions: StateCondition[];
  validation: 'all' | 'any';
}

export interface StateCondition {
  path: string;
  operator: 'exists' | 'equals' | 'greater' | 'less' | 'in' | 'not-in';
  value?: unknown;
  threshold?: number;
}

export interface CustomRule {
  type: 'custom';
  validator: string; // Function name or code
  parameters?: Record<string, unknown>;
}

export interface InvariantViolation {
  invariantId: string;
  timestamp: number;
  messageId?: string;
  agentId?: string;
  description: string;
  context?: Record<string, unknown>;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  conversationId: string;
  invariants: Invariant[];
  violations: InvariantViolation[];
  passed: boolean;
  summary: ValidationSummary;
}

export interface ValidationSummary {
  totalInvariants: number;
  passedInvariants: number;
  failedInvariants: number;
  totalViolations: number;
  violationsBySeverity: {
    error: number;
    warning: number;
    info: number;
  };
}