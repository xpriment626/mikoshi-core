/**
 * Factory for generating synthetic conversation test data
 */

import type {
  Conversation,
  Message,
  Agent,
  ConversationFormat,
  ConversationState,
} from '@mikoshi/types';
import { SeededRandom, type RandomGenerator } from '@mikoshi/shared';

export interface ConversationFactoryOptions {
  format?: ConversationFormat;
  agentCount?: number;
  messageCount?: number;
  seed?: number;
  includeMetadata?: boolean;
  simulateDelays?: boolean;
  baseTimestamp?: number;
}

export class ConversationFactory {
  private static idCounter = 0;
  private rng: RandomGenerator;

  constructor(seed: number = Date.now()) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Generate a complete conversation with specified options
   */
  createConversation(options: ConversationFactoryOptions = {}): Conversation {
    const {
      format = 'custom',
      agentCount = 3,
      messageCount = 10,
      includeMetadata = true,
      simulateDelays = true,
      baseTimestamp = Date.now(),
    } = options;

    const agents = this.createAgents(agentCount);
    const messages = this.createMessages({
      agents,
      count: messageCount,
      baseTimestamp,
      simulateDelays,
      includeMetadata,
    });

    return {
      id: this.generateId('conv'),
      format,
      agents,
      messages,
      startTime: baseTimestamp,
      endTime: messages[messages.length - 1]?.timestamp || baseTimestamp,
      metadata: includeMetadata ? this.generateMetadata() : undefined,
    };
  }

  /**
   * Create a conversation with a specific violation pattern
   */
  createConversationWithViolation(
    violationType: 'sequence' | 'timing' | 'content' | 'state',
    options: ConversationFactoryOptions = {},
  ): Conversation {
    const conversation = this.createConversation(options);

    switch (violationType) {
      case 'sequence':
        this.injectSequenceViolation(conversation);
        break;
      case 'timing':
        this.injectTimingViolation(conversation);
        break;
      case 'content':
        this.injectContentViolation(conversation);
        break;
      case 'state':
        this.injectStateViolation(conversation);
        break;
    }

    return conversation;
  }

  /**
   * Create multiple agents with different capabilities
   */
  createAgents(count: number): Agent[] {
    const agentTypes = ['coordinator', 'worker', 'validator', 'observer'];
    const agents: Agent[] = [];

    for (let i = 0; i < count; i++) {
      agents.push({
        id: this.generateId('agent'),
        name: `Agent-${i + 1}`,
        type: agentTypes[i % agentTypes.length],
        capabilities: this.generateCapabilities(),
        metadata: {
          version: '1.0.0',
          framework: this.rng.choice(['autogen', 'langchain', 'crew']),
        },
      });
    }

    return agents;
  }

  /**
   * Create a series of messages between agents
   */
  createMessages(options: {
    agents: Agent[];
    count: number;
    baseTimestamp: number;
    simulateDelays: boolean;
    includeMetadata: boolean;
  }): Message[] {
    const { agents, count, baseTimestamp, simulateDelays, includeMetadata } = options;
    const messages: Message[] = [];
    let currentTime = baseTimestamp;

    for (let i = 0; i < count; i++) {
      const agent = agents[i % agents.length];
      const delay = simulateDelays ? this.rng.nextInt(100, 2000) : 0;
      currentTime += delay;

      messages.push({
        id: this.generateId('msg'),
        agentId: agent.id,
        content: this.generateMessageContent(agent.type),
        timestamp: currentTime,
        role: this.rng.choice(['user', 'assistant', 'system'] as const),
        parentMessageId: i > 0 ? messages[i - 1].id : undefined,
        metadata: includeMetadata ? this.generateMessageMetadata() : undefined,
      });
    }

    return messages;
  }

  /**
   * Create a single message
   */
  createMessage(agentId: string, content?: string): Message {
    return {
      id: this.generateId('msg'),
      agentId,
      content: content || this.generateMessageContent(),
      timestamp: Date.now(),
      role: 'assistant',
    };
  }

  /**
   * Create conversation state snapshot
   */
  createConversationState(conversation: Conversation): ConversationState {
    const activeAgents = [...new Set(conversation.messages.slice(-10).map((m) => m.agentId))];

    return {
      activeAgents,
      messageCount: conversation.messages.length,
      lastMessageTime: conversation.messages[conversation.messages.length - 1]?.timestamp || 0,
      variables: {
        topic: this.rng.choice(['planning', 'execution', 'validation', 'reporting']),
        phase: this.rng.choice(['initial', 'processing', 'finalizing']),
        priority: this.rng.nextInt(1, 5),
      },
    };
  }

  // Helper methods

  private injectSequenceViolation(conversation: Conversation): void {
    // Swap two messages to create out-of-order sequence
    if (conversation.messages.length >= 2) {
      const idx1 = this.rng.nextInt(0, Math.floor(conversation.messages.length / 2));
      const idx2 = idx1 + this.rng.nextInt(1, Math.floor(conversation.messages.length / 2));
      if (idx2 < conversation.messages.length) {
        [conversation.messages[idx1], conversation.messages[idx2]] = [
          conversation.messages[idx2],
          conversation.messages[idx1],
        ];
      }
    }
  }

  private injectTimingViolation(conversation: Conversation): void {
    // Add excessive delay between messages
    if (conversation.messages.length >= 2) {
      const idx = this.rng.nextInt(1, conversation.messages.length - 1);
      conversation.messages[idx].timestamp += this.rng.nextInt(5000, 15000); // Add 5-15 second delay
    }
  }

  private injectContentViolation(conversation: Conversation): void {
    // Inject PII or forbidden content
    if (conversation.messages.length > 0) {
      const idx = this.rng.nextInt(0, conversation.messages.length - 1);
      const piiTypes = [' SSN: 123-45-6789', ' CC: 4111-1111-1111-1111', ' DOB: 01/01/1990'];
      conversation.messages[idx].content += this.rng.choice(piiTypes);
    }
  }

  private injectStateViolation(conversation: Conversation): void {
    // Create inconsistent state
    if (conversation.messages.length > 0) {
      conversation.messages.forEach((msg, idx) => {
        if (idx % 2 === 0) {
          msg.metadata = { ...msg.metadata, state: 'active' };
        } else {
          msg.metadata = { ...msg.metadata, state: 'inactive' };
        }
      });
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${++ConversationFactory.idCounter}_${Date.now()}`;
  }

  private generateCapabilities(): string[] {
    const allCapabilities = [
      'text-generation',
      'code-execution',
      'data-analysis',
      'web-search',
      'file-operations',
      'api-calls',
    ];

    const count = this.rng.nextInt(2, 5);
    return this.rng.shuffle([...allCapabilities]).slice(0, count);
  }

  private generateMessageContent(_agentType?: string): string {
    const templates = [
      'Processing request for {task}',
      'Analysis complete: {result}',
      'Initiating {action} on {target}',
      'Status update: {status}',
      'Error encountered: {error}',
      'Validation passed for {item}',
      'Requesting approval for {operation}',
      'Completed {task} successfully',
    ];

    const template = this.rng.choice(templates);
    return template
      .replace('{task}', this.rng.choice(['data processing', 'validation', 'optimization']))
      .replace('{result}', this.rng.choice(['success', 'partial', 'pending']))
      .replace('{action}', this.rng.choice(['scan', 'analyze', 'transform']))
      .replace('{target}', this.rng.choice(['dataset', 'model', 'pipeline']))
      .replace('{status}', this.rng.choice(['running', 'completed', 'waiting']))
      .replace('{error}', this.rng.choice(['timeout', 'invalid input', 'resource limit']))
      .replace('{item}', this.rng.choice(['configuration', 'parameters', 'constraints']))
      .replace('{operation}', this.rng.choice(['deployment', 'rollback', 'scaling']));
  }

  private generateMetadata(): Record<string, unknown> {
    return {
      version: '1.0.0',
      environment: this.rng.choice(['dev', 'staging', 'prod']),
      region: this.rng.choice(['us-east-1', 'eu-west-1', 'ap-southeast-1']),
      sessionId: this.generateId('session'),
      tags: this.rng.shuffle(['test', 'automated', 'synthetic', 'validation']).slice(0, 2),
    };
  }

  private generateMessageMetadata(): Record<string, unknown> {
    return {
      processingTime: this.rng.nextInt(10, 500),
      retryCount: this.rng.nextInt(0, 3),
      confidence: this.rng.next(),
      tokens: this.rng.nextInt(10, 200),
    };
  }

  /**
   * Get the internal random generator for advanced use cases
   */
  getRng(): RandomGenerator {
    return this.rng;
  }

  /**
   * Reset the factory with a new seed
   */
  reset(seed: number): void {
    this.rng = new SeededRandom(seed);
  }
}
