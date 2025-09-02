/**
 * Chaos scenario fixtures for testing
 */

import type { ChaosConfiguration } from '@mikoshi/types';
import { ChaosFactory } from '../factories/chaos-factory';

const factory = new ChaosFactory();

/**
 * Deterministic chaos scenarios with fixed seeds
 */
export const deterministicScenarios = {
  lightChaos: factory.createLightChaos(1000),
  moderateChaos: factory.createModerateChaos(1001),
  extremeChaos: factory.createExtremeChaos(1002),
  
  messageLoss10: factory.createMessageLoss({
    lossRate: 0.1,
    pattern: 'random',
    seed: 2000,
  }),
  
  messageLoss50: factory.createMessageLoss({
    lossRate: 0.5,
    pattern: 'burst',
    seed: 2001,
  }),
  
  uniformDelay: factory.createDelay({
    minDelay: 100,
    maxDelay: 1000,
    distribution: 'uniform',
    seed: 2002,
  }),
  
  exponentialDelay: factory.createDelay({
    minDelay: 50,
    maxDelay: 5000,
    distribution: 'exponential',
    seed: 2003,
  }),
  
  smallReorder: factory.createReorder({
    windowSize: 3,
    maxDisplacement: 1,
    preserveCausality: true,
    seed: 2004,
  }),
  
  largeReorder: factory.createReorder({
    windowSize: 10,
    maxDisplacement: 8,
    preserveCausality: false,
    seed: 2005,
  }),
};

/**
 * Statistical chaos scenarios for distribution testing
 */
export const statisticalScenarios = {
  tenPercentLoss: Array.from({ length: 10 }, (_, i) =>
    factory.createMessageLoss({
      lossRate: 0.1,
      seed: 3000 + i,
    })
  ),
  
  fiftyPercentLoss: Array.from({ length: 10 }, (_, i) =>
    factory.createMessageLoss({
      lossRate: 0.5,
      seed: 3100 + i,
    })
  ),
  
  normalDistributionDelay: Array.from({ length: 10 }, (_, i) =>
    factory.createDelay({
      minDelay: 100,
      maxDelay: 2000,
      distribution: 'normal',
      seed: 3200 + i,
    })
  ),
  
  mixedChaos: Array.from({ length: 5 }, (_, i) => [
    factory.createMessageLoss({ lossRate: 0.15, seed: 3300 + i * 3 }),
    factory.createDelay({ minDelay: 200, maxDelay: 1500, seed: 3301 + i * 3 }),
    factory.createReorder({ windowSize: 5, seed: 3302 + i * 3 }),
  ]).flat(),
};

/**
 * Scenario-based chaos configurations
 */
export const scenarioBasedChaos = {
  networkUnreliable: factory.createScenarioChaos('network-unreliable'),
  agentsUnstable: factory.createScenarioChaos('agents-unstable'),
  dataCorruption: factory.createScenarioChaos('data-corruption'),
  
  cascadingFailure: [
    factory.createAgentFailure({
      failureRate: 0.2,
      failureType: 'crash',
      targetAgents: ['agent1'],
      seed: 4000,
    }),
    factory.createAgentFailure({
      failureRate: 0.4,
      failureType: 'timeout',
      targetAgents: ['agent2'],
      seed: 4001,
    }),
    factory.createMessageLoss({
      lossRate: 0.3,
      pattern: 'burst',
      seed: 4002,
    }),
  ],
  
  splitBrain: [
    factory.createNetworkPartition({
      partitions: [['agent1', 'agent2'], ['agent3', 'agent4']],
      duration: 10000,
      allowPartialDelivery: false,
      seed: 4100,
    }),
    factory.createDelay({
      minDelay: 1000,
      maxDelay: 3000,
      seed: 4101,
    }),
  ],
  
  byzantineFailure: [
    factory.createAgentFailure({
      failureRate: 0.15,
      failureType: 'byzantine',
      seed: 4200,
    }),
    factory.createCorruption({
      corruptionRate: 0.1,
      corruptionType: 'scramble',
      severity: 'high',
      seed: 4201,
    }),
  ],
};

/**
 * Edge case chaos scenarios
 */
export const edgeCaseChaos = {
  noLoss: factory.createMessageLoss({
    lossRate: 0.0,
    seed: 5000,
  }),
  
  totalLoss: factory.createMessageLoss({
    lossRate: 1.0,
    seed: 5001,
  }),
  
  zeroDelay: factory.createDelay({
    minDelay: 0,
    maxDelay: 0,
    seed: 5002,
  }),
  
  maxDelay: factory.createDelay({
    minDelay: 99999,
    maxDelay: 100000,
    seed: 5003,
  }),
  
  noReorder: factory.createReorder({
    windowSize: 1,
    maxDisplacement: 0,
    seed: 5004,
  }),
  
  noCorruption: factory.createCorruption({
    corruptionRate: 0.0,
    seed: 5005,
  }),
  
  totalCorruption: factory.createCorruption({
    corruptionRate: 1.0,
    corruptionType: 'scramble',
    severity: 'high',
    seed: 5006,
  }),
};

/**
 * Get a chaos scenario by name
 */
export function getChaosScenario(
  category: 'deterministic' | 'statistical' | 'scenario' | 'edge',
  name: string
): ChaosConfiguration | ChaosConfiguration[] {
  const scenarios = {
    deterministic: deterministicScenarios,
    statistical: statisticalScenarios,
    scenario: scenarioBasedChaos,
    edge: edgeCaseChaos,
  };

  const categoryScenarios = scenarios[category];
  if (!categoryScenarios) {
    throw new Error(`Unknown chaos category: ${category}`);
  }

  const scenario = (categoryScenarios as any)[name];
  if (!scenario) {
    throw new Error(`Unknown chaos scenario: ${category}/${name}`);
  }

  return scenario;
}

/**
 * Create a reproducible chaos test suite
 */
export function createChaosTestSuite(baseSeed: number = 10000): {
  light: ChaosConfiguration[];
  moderate: ChaosConfiguration[];
  extreme: ChaosConfiguration[];
} {
  return {
    light: factory.createLightChaos(baseSeed),
    moderate: factory.createModerateChaos(baseSeed + 1000),
    extreme: factory.createExtremeChaos(baseSeed + 2000),
  };
}