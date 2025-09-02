/**
 * Chaos injection types for testing multi-agent systems
 */

export type ChaosMode = 
  | 'message-loss'
  | 'delay'
  | 'reorder'
  | 'corruption'
  | 'agent-failure'
  | 'network-partition';

export interface ChaosConfiguration {
  mode: ChaosMode;
  seed?: number;
  probability?: number;
  parameters: ChaosParameters;
}

export type ChaosParameters = 
  | MessageLossParameters
  | DelayParameters
  | ReorderParameters
  | CorruptionParameters
  | AgentFailureParameters
  | NetworkPartitionParameters;

export interface MessageLossParameters {
  lossRate: number; // 0.0 to 1.0
  pattern?: 'random' | 'burst' | 'selective';
  targetAgents?: string[];
}

export interface DelayParameters {
  minDelay: number; // milliseconds
  maxDelay: number;
  distribution: 'uniform' | 'normal' | 'exponential';
  targetAgents?: string[];
}

export interface ReorderParameters {
  windowSize: number;
  maxDisplacement: number;
  preserveCausality: boolean;
}

export interface CorruptionParameters {
  corruptionRate: number; // 0.0 to 1.0
  corruptionType: 'truncate' | 'scramble' | 'replace' | 'inject';
  severity: 'low' | 'medium' | 'high';
}

export interface AgentFailureParameters {
  failureRate: number; // 0.0 to 1.0
  failureType: 'crash' | 'timeout' | 'slow' | 'byzantine';
  duration?: number;
  targetAgents?: string[];
}

export interface NetworkPartitionParameters {
  partitions: string[][];
  duration: number;
  allowPartialDelivery: boolean;
}

export interface ChaosResult {
  mode: ChaosMode;
  seed: number;
  affectedMessages: number;
  affectedAgents: string[];
  statistics: ChaosStatistics;
}

export interface ChaosStatistics {
  totalMessages: number;
  modifiedMessages: number;
  droppedMessages: number;
  delayedMessages: number;
  reorderedMessages: number;
  corruptedMessages: number;
  averageDelay?: number;
  maxDelay?: number;
}