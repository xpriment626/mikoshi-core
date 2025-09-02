/**
 * LangChain format parser plugin
 *
 * Parses conversation logs from LangChain framework.
 * LangChain uses various formats including memory exports and chain runs.
 */

import type { FormatParser, Conversation, Message, Agent } from '@mikoshi/types';
import { createUniqueId } from '@mikoshi/shared';

/**
 * LangChain conversation format structure
 */
interface LangChainConversation {
  chat_history?: Array<{
    type: 'human' | 'ai' | 'system' | 'function';
    data: {
      content: string;
      additional_kwargs?: Record<string, unknown>;
      type?: string;
      example?: boolean;
    };
    timestamp?: string | number;
  }>;
  memory?: {
    chat_memory?: {
      messages: Array<{
        type: string;
        content: string;
        role?: string;
        name?: string;
        additional_kwargs?: Record<string, unknown>;
      }>;
    };
    type?: string;
  };
  chains?: Array<{
    name: string;
    type: string;
    inputs?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
  }>;
  agents?: Array<{
    name: string;
    type: string;
    tools?: string[];
    memory?: object;
  }>;
}

/**
 * LangChain format parser implementation
 */
export class LangChainParser implements FormatParser {
  readonly id = 'langchain-parser';
  readonly name = 'LangChain Parser';
  readonly formats = ['langchain', 'langchain-json', 'langchain-memory'];

  /**
   * Detect if content matches LangChain format
   */
  detect(content: string | object): boolean {
    try {
      const data = typeof content === 'string' ? JSON.parse(content) : content;

      if (!data || typeof data !== 'object') {
        return false;
      }

      // Check for LangChain-specific structures
      const hasLangChainStructure =
        // Check for chat_history format
        (Array.isArray(data.chat_history) &&
          data.chat_history.every((msg: any) => msg.type && msg.data?.content)) ||
        // Check for memory format
        (data.memory?.chat_memory?.messages && Array.isArray(data.memory.chat_memory.messages)) ||
        // Check for chains format
        (Array.isArray(data.chains) &&
          data.chains.some((chain: any) => chain.type && chain.name)) ||
        // Check for simple message array with LangChain types
        (Array.isArray(data) &&
          data.every(
            (msg: any) => ['human', 'ai', 'system', 'function'].includes(msg.type) && msg.content,
          ));

      return hasLangChainStructure;
    } catch {
      return false;
    }
  }

  /**
   * Parse LangChain format into Conversation
   */
  async parse(content: string | object): Promise<Conversation> {
    const data = this.normalizeContent(content);

    // Extract agents
    const agents = this.extractAgents(data);

    // Parse messages
    const messages = this.parseMessages(data, agents);

    // Calculate conversation metadata
    const startTime = messages[0]?.timestamp || Date.now();
    const endTime = messages[messages.length - 1]?.timestamp || startTime;

    return {
      id: createUniqueId('conv'),
      format: 'langchain',
      agents,
      messages,
      startTime,
      endTime,
      metadata: {
        source: 'langchain',
        memoryType: data.memory?.type,
        chainCount: data.chains?.length || 0,
        originalMessageCount: messages.length,
      },
    };
  }

  /**
   * Serialize Conversation back to LangChain format
   */
  async serialize(conversation: Conversation): Promise<object> {
    const chatHistory = conversation.messages.map((msg) => {
      const agent = conversation.agents.find((a) => a.id === msg.agentId);

      return {
        type: this.roleToLangChainType(msg.role || 'assistant', agent?.type),
        data: {
          content: msg.content,
          additional_kwargs: msg.metadata || {},
        },
        timestamp: msg.timestamp,
      };
    });

    const langChainAgents = conversation.agents.map((agent) => ({
      name: agent.name,
      type: agent.type,
      tools: agent.capabilities,
      metadata: agent.metadata,
    }));

    return {
      chat_history: chatHistory,
      agents: langChainAgents,
      memory: {
        type: 'chat',
        chat_memory: {
          messages: chatHistory.map((h) => ({
            type: h.type,
            content: h.data.content,
            additional_kwargs: h.data.additional_kwargs,
          })),
        },
      },
    };
  }

  /**
   * Validate LangChain format constraints
   */
  validate(content: string | object): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    try {
      const data = this.normalizeContent(content);

      // Extract messages for validation
      let messages: any[] = [];

      if (data.chat_history) {
        messages = data.chat_history;
      } else if (data.memory?.chat_memory?.messages) {
        messages = data.memory.chat_memory.messages;
      } else if (Array.isArray(data)) {
        messages = data;
      }

      if (messages.length === 0) {
        errors.push('No messages found in content');
      }

      // Validate message structure
      messages.forEach((msg: any, index: number) => {
        if (data.chat_history) {
          // Validate chat_history format
          if (!msg.type) {
            errors.push(`Message ${index} missing type`);
          }
          if (!msg.data?.content) {
            errors.push(`Message ${index} missing data.content`);
          }
        } else {
          // Validate simple format
          if (!msg.content && !msg.data?.content) {
            errors.push(`Message ${index} missing content`);
          }
        }
      });

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      errors.push(
        `Failed to parse content: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { valid: false, errors };
    }
  }

  /**
   * Normalize various LangChain formats to a consistent structure
   */
  private normalizeContent(content: string | object): LangChainConversation {
    const data = typeof content === 'string' ? JSON.parse(content) : content;

    // If it's a simple array, convert to chat_history format
    if (Array.isArray(data)) {
      return {
        chat_history: data.map((msg) => ({
          type: msg.type || 'ai',
          data: {
            content: msg.content || msg.data?.content || '',
            additional_kwargs: msg.additional_kwargs || msg.metadata || {},
          },
          timestamp: msg.timestamp,
        })),
      };
    }

    return data as LangChainConversation;
  }

  /**
   * Extract agents from LangChain data
   */
  private extractAgents(data: LangChainConversation): Agent[] {
    const agentMap = new Map<string, Agent>();

    // Process defined agents
    if (data.agents) {
      for (const agentData of data.agents) {
        const agent: Agent = {
          id: createUniqueId('agent'),
          name: agentData.name,
          type: agentData.type,
          capabilities: agentData.tools || [],
          metadata: {
            memory: agentData.memory,
          },
        };
        agentMap.set(agent.name, agent);
      }
    }

    // Process chains as potential agents
    if (data.chains) {
      for (const chain of data.chains) {
        if (!agentMap.has(chain.name)) {
          const agent: Agent = {
            id: createUniqueId('agent'),
            name: chain.name,
            type: chain.type,
            capabilities: this.inferCapabilitiesFromChain(chain),
            metadata: {
              chainType: chain.type,
              inferred: true,
            },
          };
          agentMap.set(agent.name, agent);
        }
      }
    }

    // Extract from messages
    const messages = data.chat_history || data.memory?.chat_memory?.messages || [];
    const messageTypes = new Set<string>();

    for (const msg of messages) {
      const type = msg.type || (msg as any).role;
      if (type) {
        messageTypes.add(type);
      }
    }

    // Create agents for each message type if no agents defined
    if (agentMap.size === 0) {
      for (const type of messageTypes) {
        const agentName = this.typeToAgentName(type);
        if (!agentMap.has(agentName)) {
          agentMap.set(agentName, {
            id: createUniqueId('agent'),
            name: agentName,
            type: type === 'human' ? 'user' : 'assistant',
            capabilities: type === 'ai' ? ['text-generation'] : [],
            metadata: { inferred: true },
          });
        }
      }
    }

    // Ensure at least one agent exists
    if (agentMap.size === 0) {
      agentMap.set('assistant', {
        id: createUniqueId('agent'),
        name: 'assistant',
        type: 'assistant',
        capabilities: ['text-generation'],
        metadata: { inferred: true },
      });
    }

    return Array.from(agentMap.values());
  }

  /**
   * Parse LangChain messages into Mikoshi messages
   */
  private parseMessages(data: LangChainConversation, agents: Agent[]): Message[] {
    const messages: Message[] = [];

    // Get message source
    const sourceMessages = data.chat_history || data.memory?.chat_memory?.messages || [];

    if (sourceMessages.length === 0) {
      return messages;
    }

    // Map agents by type for quick lookup
    const agentByType = new Map<string, Agent>();
    for (const agent of agents) {
      if (agent.metadata?.inferred) {
        const type =
          agent.name === 'human' ? 'human' : agent.name === 'assistant' ? 'ai' : agent.type;
        agentByType.set(type, agent);
      }
    }

    // Use first agent as fallback
    const defaultAgent = agents[0];

    for (let i = 0; i < sourceMessages.length; i++) {
      const sourceMsg = sourceMessages[i];
      const msgType = sourceMsg.type || (sourceMsg as any).role || 'ai';
      const agent = agentByType.get(msgType) || defaultAgent;

      const content = (sourceMsg as any).data?.content || (sourceMsg as any).content || '';

      const message: Message = {
        id: createUniqueId('msg'),
        agentId: agent.id,
        content,
        timestamp: this.parseTimestamp(sourceMsg.timestamp) || Date.now() + i * 1000,
        role: this.langChainTypeToRole(msgType),
        parentMessageId: i > 0 ? messages[i - 1].id : undefined,
        metadata: {
          originalType: msgType,
          ...((sourceMsg as any).data?.additional_kwargs ||
            (sourceMsg as any).additional_kwargs ||
            {}),
        },
      };

      messages.push(message);
    }

    return messages;
  }

  /**
   * Convert LangChain type to agent name
   */
  private typeToAgentName(type: string): string {
    switch (type) {
      case 'human':
        return 'human';
      case 'ai':
        return 'assistant';
      case 'system':
        return 'system';
      case 'function':
        return 'function';
      default:
        return type;
    }
  }

  /**
   * Convert LangChain type to Mikoshi role
   */
  private langChainTypeToRole(type: string): 'system' | 'user' | 'assistant' {
    switch (type) {
      case 'human':
        return 'user';
      case 'ai':
        return 'assistant';
      case 'system':
        return 'system';
      case 'function':
        return 'assistant';
      default:
        return 'assistant';
    }
  }

  /**
   * Convert Mikoshi role to LangChain type
   */
  private roleToLangChainType(role: 'system' | 'user' | 'assistant', agentType?: string): string {
    if (agentType === 'user' || role === 'user') {
      return 'human';
    }
    if (role === 'system') {
      return 'system';
    }
    return 'ai';
  }

  /**
   * Infer capabilities from chain type
   */
  private inferCapabilitiesFromChain(chain: any): string[] {
    const capabilities: string[] = [];
    const chainType = chain.type?.toLowerCase() || '';

    if (chainType.includes('retrieval') || chainType.includes('search')) {
      capabilities.push('web-search');
    }

    if (chainType.includes('sql') || chainType.includes('data')) {
      capabilities.push('data-analysis');
    }

    if (chainType.includes('api') || chainType.includes('tool')) {
      capabilities.push('api-calls');
    }

    if (chainType.includes('conversation') || chainType.includes('chat')) {
      capabilities.push('text-generation');
    }

    return capabilities.length > 0 ? capabilities : ['text-generation'];
  }

  /**
   * Parse timestamp from various formats
   */
  private parseTimestamp(timestamp: string | number | undefined): number | undefined {
    if (!timestamp) {
      return undefined;
    }

    if (typeof timestamp === 'number') {
      return timestamp;
    }

    const parsed = Date.parse(timestamp);
    return isNaN(parsed) ? undefined : parsed;
  }
}
