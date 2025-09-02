/**
 * Agent-specific types for the Mikoshi platform
 */

export type AgentStatus = 'active' | 'inactive' | 'failed' | 'timeout';

export interface AgentCapability {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface AgentDefinition {
  id: string;
  name: string;
  version?: string;
  description?: string;
  capabilities: AgentCapability[];
  configuration?: Record<string, unknown>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  initialDelay: number;
  maxDelay?: number;
}

export interface AgentInstance {
  definition: AgentDefinition;
  status: AgentStatus;
  startTime: number;
  endTime?: number;
  messagesSent: number;
  messagesReceived: number;
  errors: AgentError[];
}

export interface AgentError {
  timestamp: number;
  type: 'timeout' | 'crash' | 'validation' | 'unknown';
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}