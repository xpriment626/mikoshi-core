/**
 * Tests for ConversationFactory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationFactory } from './conversation-factory';

describe('ConversationFactory', () => {
  let factory: ConversationFactory;

  beforeEach(() => {
    factory = new ConversationFactory(42); // Fixed seed for deterministic tests
  });

  describe('createConversation', () => {
    it('should create a valid conversation with default options', () => {
      const conversation = factory.createConversation();

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeTruthy();
      expect(conversation.format).toBe('custom');
      expect(conversation.agents).toHaveLength(3);
      expect(conversation.messages).toHaveLength(10);
      expect(conversation.startTime).toBeGreaterThan(0);
      expect(conversation.endTime).toBeGreaterThanOrEqual(conversation.startTime);
    });

    it('should create conversation with specified agent and message count', () => {
      const conversation = factory.createConversation({
        agentCount: 5,
        messageCount: 20,
      });

      expect(conversation.agents).toHaveLength(5);
      expect(conversation.messages).toHaveLength(20);
    });

    it('should create conversation with specific format', () => {
      const conversation = factory.createConversation({
        format: 'autogen',
      });

      expect(conversation.format).toBe('autogen');
    });

    it('should create messages with chronological timestamps when delays are simulated', () => {
      const conversation = factory.createConversation({
        simulateDelays: true,
        messageCount: 10,
      });

      for (let i = 1; i < conversation.messages.length; i++) {
        expect(conversation.messages[i].timestamp).toBeGreaterThanOrEqual(
          conversation.messages[i - 1].timestamp,
        );
      }
    });

    it('should create messages with same timestamp when delays are not simulated', () => {
      const conversation = factory.createConversation({
        simulateDelays: false,
        messageCount: 5,
        baseTimestamp: 1000,
      });

      const timestamps = conversation.messages.map((m) => m.timestamp);
      expect(new Set(timestamps).size).toBe(1);
      expect(timestamps[0]).toBe(1000);
    });

    it('should include metadata when specified', () => {
      const conversation = factory.createConversation({
        includeMetadata: true,
      });

      expect(conversation.metadata).toBeDefined();
      conversation.messages.forEach((message) => {
        expect(message.metadata).toBeDefined();
      });
    });

    it('should not include metadata when disabled', () => {
      const conversation = factory.createConversation({
        includeMetadata: false,
      });

      expect(conversation.metadata).toBeUndefined();
      conversation.messages.forEach((message) => {
        expect(message.metadata).toBeUndefined();
      });
    });
  });

  describe('createConversationWithViolation', () => {
    it('should create conversation with sequence violation', () => {
      const conversation = factory.createConversationWithViolation('sequence');

      expect(conversation).toBeDefined();
      expect(conversation.messages.length).toBeGreaterThan(0);
      // The violation is that messages are swapped, breaking chronological order
    });

    it('should create conversation with timing violation', () => {
      const conversation = factory.createConversationWithViolation('timing');

      expect(conversation).toBeDefined();
      // Check that there's an excessive delay
      const delays = [];
      for (let i = 1; i < conversation.messages.length; i++) {
        delays.push(conversation.messages[i].timestamp - conversation.messages[i - 1].timestamp);
      }
      expect(Math.max(...delays)).toBeGreaterThan(9000); // At least one 10s+ delay
    });

    it('should create conversation with content violation', () => {
      const conversation = factory.createConversationWithViolation('content');

      expect(conversation).toBeDefined();
      // Check that PII is injected (could be SSN, CC, or DOB)
      const hasPII = conversation.messages.some(
        (msg) =>
          msg.content.includes('SSN: 123-45-6789') ||
          msg.content.includes('CC: 4111-1111-1111-1111') ||
          msg.content.includes('DOB: 01/01/1990'),
      );
      expect(hasPII).toBe(true);
    });

    it('should create conversation with state violation', () => {
      const conversation = factory.createConversationWithViolation('state');

      expect(conversation).toBeDefined();
      // Check for inconsistent state metadata
      const states = conversation.messages.map((msg) => msg.metadata?.state);
      expect(states.includes('active')).toBe(true);
      expect(states.includes('inactive')).toBe(true);
    });
  });

  describe('createAgents', () => {
    it('should create specified number of agents', () => {
      const agents = factory.createAgents(4);

      expect(agents).toHaveLength(4);
      agents.forEach((agent) => {
        expect(agent.id).toBeTruthy();
        expect(agent.name).toBeTruthy();
        expect(agent.type).toBeTruthy();
        expect(agent.capabilities).toBeInstanceOf(Array);
      });
    });

    it('should assign different types to agents', () => {
      const agents = factory.createAgents(8);

      const types = new Set(agents.map((a) => a.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('should include metadata for agents', () => {
      const agents = factory.createAgents(2);

      agents.forEach((agent) => {
        expect(agent.metadata).toBeDefined();
        expect(agent.metadata?.version).toBe('1.0.0');
        expect(agent.metadata?.framework).toBeTruthy();
      });
    });
  });

  describe('createMessages', () => {
    it('should create messages for given agents', () => {
      const agents = factory.createAgents(2);
      const messages = factory.createMessages({
        agents,
        count: 6,
        baseTimestamp: 1000,
        simulateDelays: false,
        includeMetadata: false,
      });

      expect(messages).toHaveLength(6);
      messages.forEach((message) => {
        expect(agents.map((a) => a.id)).toContain(message.agentId);
      });
    });

    it('should create parent-child relationships', () => {
      const agents = factory.createAgents(2);
      const messages = factory.createMessages({
        agents,
        count: 5,
        baseTimestamp: 1000,
        simulateDelays: false,
        includeMetadata: false,
      });

      expect(messages[0].parentMessageId).toBeUndefined();
      for (let i = 1; i < messages.length; i++) {
        expect(messages[i].parentMessageId).toBe(messages[i - 1].id);
      }
    });
  });

  describe('createMessage', () => {
    it('should create a single message', () => {
      const message = factory.createMessage('agent1', 'Test content');

      expect(message.id).toBeTruthy();
      expect(message.agentId).toBe('agent1');
      expect(message.content).toBe('Test content');
      expect(message.timestamp).toBeGreaterThan(0);
      expect(message.role).toBe('assistant');
    });

    it('should generate content if not provided', () => {
      const message = factory.createMessage('agent1');

      expect(message.content).toBeTruthy();
      expect(message.content.length).toBeGreaterThan(0);
    });
  });

  describe('createConversationState', () => {
    it('should create state from conversation', () => {
      const conversation = factory.createConversation({
        agentCount: 3,
        messageCount: 15,
      });
      const state = factory.createConversationState(conversation);

      expect(state.activeAgents).toBeInstanceOf(Array);
      expect(state.messageCount).toBe(15);
      expect(state.lastMessageTime).toBe(
        conversation.messages[conversation.messages.length - 1].timestamp,
      );
      expect(state.variables).toBeDefined();
    });

    it('should identify active agents from recent messages', () => {
      const conversation = factory.createConversation({
        agentCount: 5,
        messageCount: 20,
      });
      const state = factory.createConversationState(conversation);

      // Active agents should be from last 10 messages
      const lastTenAgents = new Set(conversation.messages.slice(-10).map((m) => m.agentId));
      expect(state.activeAgents.length).toBe(lastTenAgents.size);
    });
  });

  describe('deterministic behavior', () => {
    it('should produce identical conversations with same seed', () => {
      const factory1 = new ConversationFactory(100);
      const factory2 = new ConversationFactory(100);

      const conv1 = factory1.createConversation({
        agentCount: 3,
        messageCount: 5,
        baseTimestamp: 1000000,
        simulateDelays: true,
        includeMetadata: true,
      });
      const conv2 = factory2.createConversation({
        agentCount: 3,
        messageCount: 5,
        baseTimestamp: 1000000,
        simulateDelays: true,
        includeMetadata: true,
      });

      // Compare structure
      expect(conv1.agents.length).toBe(conv2.agents.length);
      expect(conv1.messages.length).toBe(conv2.messages.length);
      expect(conv1.format).toBe(conv2.format);

      // Compare agent properties (except IDs which include timestamps)
      for (let i = 0; i < conv1.agents.length; i++) {
        expect(conv1.agents[i].name).toBe(conv2.agents[i].name);
        expect(conv1.agents[i].type).toBe(conv2.agents[i].type);
        expect(conv1.agents[i].capabilities).toEqual(conv2.agents[i].capabilities);
        expect(conv1.agents[i].metadata).toEqual(conv2.agents[i].metadata);
      }

      // Compare message content and structure
      for (let i = 0; i < conv1.messages.length; i++) {
        expect(conv1.messages[i].content).toBe(conv2.messages[i].content);
        expect(conv1.messages[i].role).toBe(conv2.messages[i].role);
        expect(conv1.messages[i].timestamp).toBe(conv2.messages[i].timestamp);
        // Metadata should be identical too
        if (conv1.messages[i].metadata && conv2.messages[i].metadata) {
          expect(conv1.messages[i].metadata?.processingTime).toBe(
            conv2.messages[i].metadata?.processingTime,
          );
          expect(conv1.messages[i].metadata?.retryCount).toBe(
            conv2.messages[i].metadata?.retryCount,
          );
          expect(conv1.messages[i].metadata?.confidence).toBe(
            conv2.messages[i].metadata?.confidence,
          );
          expect(conv1.messages[i].metadata?.tokens).toBe(conv2.messages[i].metadata?.tokens);
        }
      }

      // Compare metadata
      expect(conv1.metadata?.environment).toBe(conv2.metadata?.environment);
      expect(conv1.metadata?.region).toBe(conv2.metadata?.region);
      expect(conv1.metadata?.tags).toEqual(conv2.metadata?.tags);
    });

    it('should produce different conversations with different seeds', () => {
      const factory1 = new ConversationFactory(100);
      const factory2 = new ConversationFactory(200);

      const conv1 = factory1.createConversation({
        agentCount: 3,
        messageCount: 5,
        baseTimestamp: 1000000,
      });
      const conv2 = factory2.createConversation({
        agentCount: 3,
        messageCount: 5,
        baseTimestamp: 1000000,
      });

      // Messages should have different content
      let differentMessages = 0;
      for (let i = 0; i < conv1.messages.length; i++) {
        if (conv1.messages[i].content !== conv2.messages[i].content) {
          differentMessages++;
        }
      }
      expect(differentMessages).toBeGreaterThan(0);
    });

    it('should be reproducible across multiple runs', () => {
      const seed = 42;
      const results: string[] = [];

      for (let run = 0; run < 5; run++) {
        const factory = new ConversationFactory(seed);
        const conv = factory.createConversation({
          agentCount: 2,
          messageCount: 3,
          baseTimestamp: 1000000,
        });

        // Create a fingerprint of the conversation
        const fingerprint = conv.messages
          .map((m) => `${m.content}|${m.timestamp}|${m.role}`)
          .join('::');
        results.push(fingerprint);
      }

      // All runs should produce identical fingerprints
      expect(new Set(results).size).toBe(1);
    });

    it('should handle reset with new seed', () => {
      const factory = new ConversationFactory(100);

      const conv1 = factory.createConversation({
        messageCount: 3,
        baseTimestamp: 1000000,
      });

      factory.reset(100); // Reset to same seed

      const conv2 = factory.createConversation({
        messageCount: 3,
        baseTimestamp: 1000000,
      });

      // Should produce identical content
      for (let i = 0; i < conv1.messages.length; i++) {
        expect(conv1.messages[i].content).toBe(conv2.messages[i].content);
      }
    });
  });
});
