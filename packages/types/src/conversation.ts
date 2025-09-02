/**
 * Core conversation types for the Mikoshi platform
 */

export type ConversationFormat = 'autogen' | 'langchain' | 'crew' | 'custom';

export interface Message {
  id: string;
  agentId: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  parentMessageId?: string;
  role?: 'user' | 'assistant' | 'system' | 'function';
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  format: ConversationFormat;
  agents: Agent[];
  messages: Message[];
  startTime: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationSnapshot {
  conversationId: string;
  timestamp: number;
  state: ConversationState;
  messages: Message[];
}

export interface ConversationState {
  activeAgents: string[];
  messageCount: number;
  lastMessageTime: number;
  variables?: Record<string, unknown>;
}