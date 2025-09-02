/**
 * Factory for generating chaos configurations
 */

import type {
  ChaosConfiguration,
  ChaosMode,
  MessageLossParameters,
  DelayParameters,
  ReorderParameters,
  CorruptionParameters,
  AgentFailureParameters,
  NetworkPartitionParameters,
} from '@mikoshi/types';

export class ChaosFactory {
  /**
   * Create a message loss chaos configuration
   */
  createMessageLoss(options: {
    lossRate?: number;
    pattern?: 'random' | 'burst' | 'selective';
    targetAgents?: string[];
    seed?: number;
  } = {}): ChaosConfiguration {
    const parameters: MessageLossParameters = {
      lossRate: options.lossRate || 0.1,
      pattern: options.pattern || 'random',
      targetAgents: options.targetAgents,
    };

    return {
      mode: 'message-loss',
      seed: options.seed || Date.now(),
      probability: parameters.lossRate,
      parameters,
    };
  }

  /**
   * Create a delay injection chaos configuration
   */
  createDelay(options: {
    minDelay?: number;
    maxDelay?: number;
    distribution?: 'uniform' | 'normal' | 'exponential';
    targetAgents?: string[];
    seed?: number;
  } = {}): ChaosConfiguration {
    const parameters: DelayParameters = {
      minDelay: options.minDelay || 100,
      maxDelay: options.maxDelay || 2000,
      distribution: options.distribution || 'uniform',
      targetAgents: options.targetAgents,
    };

    return {
      mode: 'delay',
      seed: options.seed || Date.now(),
      parameters,
    };
  }

  /**
   * Create a message reordering chaos configuration
   */
  createReorder(options: {
    windowSize?: number;
    maxDisplacement?: number;
    preserveCausality?: boolean;
    seed?: number;
  } = {}): ChaosConfiguration {
    const parameters: ReorderParameters = {
      windowSize: options.windowSize || 5,
      maxDisplacement: options.maxDisplacement || 3,
      preserveCausality: options.preserveCausality !== false,
    };

    return {
      mode: 'reorder',
      seed: options.seed || Date.now(),
      parameters,
    };
  }

  /**
   * Create a message corruption chaos configuration
   */
  createCorruption(options: {
    corruptionRate?: number;
    corruptionType?: 'truncate' | 'scramble' | 'replace' | 'inject';
    severity?: 'low' | 'medium' | 'high';
    seed?: number;
  } = {}): ChaosConfiguration {
    const parameters: CorruptionParameters = {
      corruptionRate: options.corruptionRate || 0.05,
      corruptionType: options.corruptionType || 'scramble',
      severity: options.severity || 'medium',
    };

    return {
      mode: 'corruption',
      seed: options.seed || Date.now(),
      probability: parameters.corruptionRate,
      parameters,
    };
  }

  /**
   * Create an agent failure chaos configuration
   */
  createAgentFailure(options: {
    failureRate?: number;
    failureType?: 'crash' | 'timeout' | 'slow' | 'byzantine';
    duration?: number;
    targetAgents?: string[];
    seed?: number;
  } = {}): ChaosConfiguration {
    const parameters: AgentFailureParameters = {
      failureRate: options.failureRate || 0.1,
      failureType: options.failureType || 'crash',
      duration: options.duration || 5000,
      targetAgents: options.targetAgents,
    };

    return {
      mode: 'agent-failure',
      seed: options.seed || Date.now(),
      probability: parameters.failureRate,
      parameters,
    };
  }

  /**
   * Create a network partition chaos configuration
   */
  createNetworkPartition(options: {
    partitions?: string[][];
    duration?: number;
    allowPartialDelivery?: boolean;
    seed?: number;
  } = {}): ChaosConfiguration {
    const parameters: NetworkPartitionParameters = {
      partitions: options.partitions || [['agent1'], ['agent2', 'agent3']],
      duration: options.duration || 10000,
      allowPartialDelivery: options.allowPartialDelivery || false,
    };

    return {
      mode: 'network-partition',
      seed: options.seed || Date.now(),
      parameters,
    };
  }

  /**
   * Create a light chaos configuration for basic testing
   */
  createLightChaos(seed?: number): ChaosConfiguration[] {
    return [
      this.createMessageLoss({ lossRate: 0.05, seed }),
      this.createDelay({ minDelay: 50, maxDelay: 500, seed }),
    ];
  }

  /**
   * Create a moderate chaos configuration
   */
  createModerateChaos(seed?: number): ChaosConfiguration[] {
    return [
      this.createMessageLoss({ lossRate: 0.15, seed }),
      this.createDelay({ minDelay: 200, maxDelay: 2000, seed }),
      this.createReorder({ windowSize: 5, maxDisplacement: 2, seed }),
      this.createCorruption({ corruptionRate: 0.05, severity: 'low', seed }),
    ];
  }

  /**
   * Create an extreme chaos configuration for stress testing
   */
  createExtremeChaos(seed?: number): ChaosConfiguration[] {
    return [
      this.createMessageLoss({ lossRate: 0.3, pattern: 'burst', seed }),
      this.createDelay({ minDelay: 1000, maxDelay: 10000, distribution: 'exponential', seed }),
      this.createReorder({ windowSize: 10, maxDisplacement: 8, preserveCausality: false, seed }),
      this.createCorruption({ corruptionRate: 0.2, corruptionType: 'scramble', severity: 'high', seed }),
      this.createAgentFailure({ failureRate: 0.25, failureType: 'byzantine', seed }),
      this.createNetworkPartition({ duration: 15000, seed }),
    ];
  }

  /**
   * Create a deterministic chaos configuration for reproducible testing
   */
  createDeterministicChaos(): ChaosConfiguration[] {
    const fixedSeed = 12345;
    return [
      this.createMessageLoss({ lossRate: 0.1, seed: fixedSeed }),
      this.createDelay({ minDelay: 100, maxDelay: 1000, seed: fixedSeed + 1 }),
      this.createReorder({ windowSize: 3, seed: fixedSeed + 2 }),
    ];
  }

  /**
   * Create chaos configuration based on a specific scenario
   */
  createScenarioChaos(scenario: 'network-unreliable' | 'agents-unstable' | 'data-corruption'): ChaosConfiguration[] {
    switch (scenario) {
      case 'network-unreliable':
        return [
          this.createMessageLoss({ lossRate: 0.2, pattern: 'burst' }),
          this.createDelay({ minDelay: 500, maxDelay: 5000, distribution: 'exponential' }),
          this.createNetworkPartition({ duration: 8000 }),
        ];
      
      case 'agents-unstable':
        return [
          this.createAgentFailure({ failureRate: 0.3, failureType: 'crash' }),
          this.createAgentFailure({ failureRate: 0.2, failureType: 'timeout' }),
          this.createAgentFailure({ failureRate: 0.1, failureType: 'slow' }),
        ];
      
      case 'data-corruption':
        return [
          this.createCorruption({ corruptionRate: 0.15, corruptionType: 'truncate' }),
          this.createCorruption({ corruptionRate: 0.1, corruptionType: 'scramble' }),
          this.createReorder({ windowSize: 8, preserveCausality: false }),
        ];
      
      default:
        return this.createModerateChaos();
    }
  }
}