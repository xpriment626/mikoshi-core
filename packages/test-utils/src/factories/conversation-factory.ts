/**
 * Factory for generating synthetic conversation test data
 */

import type { 
  Conversation, 
  Message, 
  Agent, 
  ConversationFormat,
  ConversationState 
} from '@mikoshi/types';

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
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
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
    options: ConversationFactoryOptions = {}
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
          framework: this.selectRandom(['autogen', 'langchain', 'crew']),
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
      const delay = simulateDelays ? this.randomInt(100, 2000) : 0;
      currentTime += delay;

      messages.push({
        id: this.generateId('msg'),
        agentId: agent.id,
        content: this.generateMessageContent(agent.type),
        timestamp: currentTime,
        role: this.selectRandom(['user', 'assistant', 'system']),
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
    const activeAgents = [...new Set(
      conversation.messages
        .slice(-10)
        .map(m => m.agentId)
    )];

    return {
      activeAgents,
      messageCount: conversation.messages.length,
      lastMessageTime: conversation.messages[conversation.messages.length - 1]?.timestamp || 0,
      variables: {
        topic: this.selectRandom(['planning', 'execution', 'validation', 'reporting']),
        phase: this.selectRandom(['initial', 'processing', 'finalizing']),
        priority: this.randomInt(1, 5),
      },
    };
  }

  // Helper methods
  
  private injectSequenceViolation(conversation: Conversation): void {
    // Swap two messages to create out-of-order sequence
    if (conversation.messages.length >= 2) {
      const idx1 = Math.floor(conversation.messages.length / 3);
      const idx2 = idx1 + 1;
      [conversation.messages[idx1], conversation.messages[idx2]] = 
        [conversation.messages[idx2], conversation.messages[idx1]];
    }
  }

  private injectTimingViolation(conversation: Conversation): void {
    // Add excessive delay between messages
    if (conversation.messages.length >= 2) {
      const idx = Math.floor(conversation.messages.length / 2);
      conversation.messages[idx].timestamp += 10000; // Add 10 second delay
    }
  }

  private injectContentViolation(conversation: Conversation): void {
    // Inject PII or forbidden content
    if (conversation.messages.length > 0) {
      const idx = Math.floor(conversation.messages.length / 2);
      conversation.messages[idx].content += ' SSN: 123-45-6789';
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
    
    const count = this.randomInt(2, 5);
    return this.shuffle(allCapabilities).slice(0, count);
  }

  private generateMessageContent(agentType?: string): string {
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

    const template = this.selectRandom(templates);
    return template
      .replace('{task}', this.selectRandom(['data processing', 'validation', 'optimization']))
      .replace('{result}', this.selectRandom(['success', 'partial', 'pending']))
      .replace('{action}', this.selectRandom(['scan', 'analyze', 'transform']))
      .replace('{target}', this.selectRandom(['dataset', 'model', 'pipeline']))
      .replace('{status}', this.selectRandom(['running', 'completed', 'waiting']))
      .replace('{error}', this.selectRandom(['timeout', 'invalid input', 'resource limit']))
      .replace('{item}', this.selectRandom(['configuration', 'parameters', 'constraints']))
      .replace('{operation}', this.selectRandom(['deployment', 'rollback', 'scaling']));
  }

  private generateMetadata(): Record<string, unknown> {
    return {
      version: '1.0.0',
      environment: this.selectRandom(['dev', 'staging', 'prod']),
      region: this.selectRandom(['us-east-1', 'eu-west-1', 'ap-southeast-1']),
      sessionId: this.generateId('session'),
      tags: this.shuffle(['test', 'automated', 'synthetic', 'validation']).slice(0, 2),
    };
  }

  private generateMessageMetadata(): Record<string, unknown> {
    return {
      processingTime: this.randomInt(10, 500),
      retryCount: this.randomInt(0, 3),
      confidence: Math.random(),
      tokens: this.randomInt(10, 200),
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}