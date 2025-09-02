/**
 * AutoGen format parser plugin
 *
 * Parses conversation logs from Microsoft AutoGen framework.
 * AutoGen uses a JSON-based format with specific structure for multi-agent conversations.
 */

import type { FormatParser, Conversation, Message, Agent } from '@mikoshi/types';
import { createUniqueId } from '@mikoshi/shared';

/**
 * AutoGen conversation format structure
 */
interface AutoGenConversation {
  messages: Array<{
    role: string;
    content: string;
    name?: string;
    function_call?: {
      name: string;
      arguments: string;
    };
    timestamp?: number;
  }>;
  agents?: Array<{
    name: string;
    role?: string;
    system_message?: string;
    max_consecutive_auto_reply?: number;
  }>;
  config?: {
    max_round?: number;
    human_input_mode?: string;
    code_execution_config?: object;
  };
}

/**
 * AutoGen format parser implementation
 */
export class AutoGenParser implements FormatParser {
  readonly id = 'autogen-parser';
  readonly name = 'AutoGen Parser';
  readonly formats = ['autogen', 'autogen-json'];

  /**
   * Detect if content matches AutoGen format
   */
  detect(content: string | object): boolean {
    try {
      const data = typeof content === 'string' ? JSON.parse(content) : content;

      // Check for AutoGen-specific markers
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Must have messages array
      if (!Array.isArray(data.messages)) {
        return false;
      }

      // Check message structure
      const hasAutoGenStructure = data.messages.every(
        (msg: any) =>
          typeof msg === 'object' &&
          typeof msg.role === 'string' &&
          typeof msg.content === 'string' &&
          ['system', 'user', 'assistant', 'function'].includes(msg.role),
      );

      if (!hasAutoGenStructure) {
        return false;
      }

      // Check for AutoGen-specific fields
      const hasAutoGenFields =
        data.agents?.some(
          (agent: any) => 'system_message' in agent || 'max_consecutive_auto_reply' in agent,
        ) ||
        data.config?.human_input_mode !== undefined ||
        data.messages.some((msg: any) => 'function_call' in msg);

      return hasAutoGenFields || data.messages.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Parse AutoGen format into Conversation
   */
  async parse(content: string | object): Promise<Conversation> {
    const data: AutoGenConversation =
      typeof content === 'string' ? JSON.parse(content) : (content as AutoGenConversation);

    // Extract or create agents
    const agents = this.extractAgents(data);

    // Parse messages
    const messages = this.parseMessages(data.messages, agents);

    // Calculate conversation metadata
    const startTime = messages[0]?.timestamp || Date.now();
    const endTime = messages[messages.length - 1]?.timestamp || startTime;

    return {
      id: createUniqueId('conv'),
      format: 'autogen',
      agents,
      messages,
      startTime,
      endTime,
      metadata: {
        source: 'autogen',
        config: data.config,
        originalMessageCount: data.messages.length,
      },
    };
  }

  /**
   * Serialize Conversation back to AutoGen format
   */
  async serialize(conversation: Conversation): Promise<object> {
    const autoGenMessages = conversation.messages.map((msg) => {
      const agent = conversation.agents.find((a) => a.id === msg.agentId);

      return {
        role: msg.role || 'assistant',
        content: msg.content,
        name: agent?.name,
        timestamp: msg.timestamp,
        ...(msg.metadata?.function_call && {
          function_call: msg.metadata.function_call,
        }),
      };
    });

    const autoGenAgents = conversation.agents.map((agent) => ({
      name: agent.name,
      role: agent.type,
      ...(agent.metadata?.system_message && {
        system_message: agent.metadata.system_message,
      }),
      ...(agent.metadata?.max_consecutive_auto_reply && {
        max_consecutive_auto_reply: agent.metadata.max_consecutive_auto_reply,
      }),
    }));

    return {
      messages: autoGenMessages,
      agents: autoGenAgents,
      config: conversation.metadata?.config,
    };
  }

  /**
   * Validate AutoGen format constraints
   */
  validate(content: string | object): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    try {
      const data = typeof content === 'string' ? JSON.parse(content) : content;

      if (!data || typeof data !== 'object') {
        errors.push('Content must be a valid object');
        return { valid: false, errors };
      }

      if (!Array.isArray(data.messages)) {
        errors.push('Content must have a messages array');
      } else {
        // Validate each message
        data.messages.forEach((msg: any, index: number) => {
          if (!msg.role) {
            errors.push(`Message ${index} missing role`);
          }
          if (!msg.content) {
            errors.push(`Message ${index} missing content`);
          }
          if (msg.role && !['system', 'user', 'assistant', 'function'].includes(msg.role)) {
            errors.push(`Message ${index} has invalid role: ${msg.role}`);
          }
        });
      }

      // Validate agents if present
      if (data.agents && !Array.isArray(data.agents)) {
        errors.push('Agents must be an array');
      }

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
   * Extract agents from AutoGen data
   */
  private extractAgents(data: AutoGenConversation): Agent[] {
    const agentMap = new Map<string, Agent>();

    // Process defined agents
    if (data.agents) {
      for (const agentData of data.agents) {
        const agent: Agent = {
          id: createUniqueId('agent'),
          name: agentData.name,
          type: agentData.role || 'assistant',
          capabilities: this.inferCapabilities(agentData),
          metadata: {
            system_message: agentData.system_message,
            max_consecutive_auto_reply: agentData.max_consecutive_auto_reply,
          },
        };
        agentMap.set(agent.name, agent);
      }
    }

    // Extract agents from messages
    for (const msg of data.messages) {
      const agentName = msg.name || msg.role;
      if (agentName && !agentMap.has(agentName)) {
        const agent: Agent = {
          id: createUniqueId('agent'),
          name: agentName,
          type: msg.role || 'assistant',
          capabilities: [],
          metadata: {
            inferred: true,
          },
        };
        agentMap.set(agentName, agent);
      }
    }

    // Ensure at least one agent exists
    if (agentMap.size === 0) {
      agentMap.set('default', {
        id: createUniqueId('agent'),
        name: 'default',
        type: 'assistant',
        capabilities: [],
        metadata: { inferred: true },
      });
    }

    return Array.from(agentMap.values());
  }

  /**
   * Parse AutoGen messages into Mikoshi messages
   */
  private parseMessages(
    autoGenMessages: AutoGenConversation['messages'],
    agents: Agent[],
  ): Message[] {
    const messages: Message[] = [];
    const agentByName = new Map(agents.map((a) => [a.name, a]));

    for (let i = 0; i < autoGenMessages.length; i++) {
      const autoGenMsg = autoGenMessages[i];
      const agentName = autoGenMsg.name || autoGenMsg.role;
      const agent = agentByName.get(agentName) || agents[0];

      const message: Message = {
        id: createUniqueId('msg'),
        agentId: agent.id,
        content: autoGenMsg.content,
        timestamp: autoGenMsg.timestamp || Date.now() + i * 1000,
        role: autoGenMsg.role as 'system' | 'user' | 'assistant',
        parentMessageId: i > 0 ? messages[i - 1].id : undefined,
        metadata: {
          originalRole: autoGenMsg.role,
          ...(autoGenMsg.function_call && {
            function_call: autoGenMsg.function_call,
          }),
        },
      };

      messages.push(message);
    }

    return messages;
  }

  /**
   * Infer agent capabilities from AutoGen config
   */
  private inferCapabilities(agentData: any): string[] {
    const capabilities: string[] = [];

    if (agentData.code_execution_config) {
      capabilities.push('code-execution');
    }

    if (agentData.function_map) {
      capabilities.push('function-calling');
    }

    if (agentData.system_message?.includes('search')) {
      capabilities.push('web-search');
    }

    if (
      agentData.system_message?.includes('data') ||
      agentData.system_message?.includes('analysis')
    ) {
      capabilities.push('data-analysis');
    }

    // Always include text generation for LLM agents
    if (agentData.llm_config) {
      capabilities.push('text-generation');
    }

    return capabilities.length > 0 ? capabilities : ['text-generation'];
  }
}
