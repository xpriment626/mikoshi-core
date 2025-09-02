/**
 * Parser Registry - Extensible plugin system for conversation format parsers
 *
 * This implementation follows the Open/Closed principle by allowing
 * new parsers to be added without modifying existing code.
 */

import type { FormatParser, ParserRegistry as IParserRegistry, Conversation } from '@mikoshi/types';
import { MikoshiError } from '@mikoshi/shared';

/**
 * Parser registration error
 */
export class ParserRegistrationError extends MikoshiError {
  constructor(
    message: string,
    public parserId?: string,
  ) {
    super(message, 'PARSER_REGISTRATION_ERROR');
  }
}

/**
 * Parser execution error
 */
export class ParserExecutionError extends MikoshiError {
  constructor(
    message: string,
    public format?: string,
  ) {
    super(message, 'PARSER_EXECUTION_ERROR');
  }
}

/**
 * Default implementation of ParserRegistry
 *
 * Manages format parsers as plugins with auto-detection capabilities.
 */
export class ParserRegistry implements IParserRegistry {
  private parsers = new Map<string, FormatParser>();
  private formatMap = new Map<string, string>(); // format -> parser.id mapping

  /**
   * Register a parser plugin
   */
  register(parser: FormatParser): void {
    // Validate parser
    this.validateParser(parser);

    // Check for conflicts
    if (this.parsers.has(parser.id)) {
      throw new ParserRegistrationError(
        `Parser with ID '${parser.id}' is already registered`,
        parser.id,
      );
    }

    // Check format conflicts
    for (const format of parser.formats) {
      if (this.formatMap.has(format)) {
        const existingParserId = this.formatMap.get(format);
        const existingParser = this.parsers.get(existingParserId!);
        throw new ParserRegistrationError(
          `Format '${format}' is already handled by parser '${existingParser?.name}'`,
          parser.id,
        );
      }
    }

    // Register parser
    this.parsers.set(parser.id, parser);

    // Map formats to parser
    for (const format of parser.formats) {
      this.formatMap.set(format, parser.id);
    }
  }

  /**
   * Unregister a parser
   */
  unregister(parserId: string): void {
    const parser = this.parsers.get(parserId);
    if (!parser) {
      throw new ParserRegistrationError(`Parser with ID '${parserId}' not found`, parserId);
    }

    // Remove format mappings
    for (const format of parser.formats) {
      this.formatMap.delete(format);
    }

    // Remove parser
    this.parsers.delete(parserId);
  }

  /**
   * Get parser by format
   */
  getParser(format: string): FormatParser | undefined {
    const parserId = this.formatMap.get(format);
    if (!parserId) {
      return undefined;
    }

    return this.parsers.get(parserId);
  }

  /**
   * Auto-detect format and get parser
   */
  detectFormat(content: string | object): FormatParser | undefined {
    // Try each parser's detection in registration order
    // First match wins (can be improved with confidence scores)
    for (const parser of this.parsers.values()) {
      try {
        if (parser.detect(content)) {
          return parser;
        }
      } catch (error) {
        // Log but continue trying other parsers
        console.warn(`Parser ${parser.id} detection failed:`, error);
      }
    }

    return undefined;
  }

  /**
   * List all registered parsers
   */
  listParsers(): FormatParser[] {
    return Array.from(this.parsers.values());
  }

  /**
   * Parse with auto-detection or specified format
   */
  async parse(content: string | object, format?: string): Promise<Conversation> {
    let parser: FormatParser | undefined;

    if (format) {
      // Use specified format
      parser = this.getParser(format);
      if (!parser) {
        throw new ParserExecutionError(`No parser found for format '${format}'`, format);
      }
    } else {
      // Auto-detect format
      parser = this.detectFormat(content);
      if (!parser) {
        throw new ParserExecutionError(
          'Unable to auto-detect format. Please specify format explicitly.',
        );
      }
    }

    // Validate content before parsing
    const validation = parser.validate(content);
    if (!validation.valid) {
      throw new ParserExecutionError(
        `Content validation failed: ${validation.errors?.join(', ')}`,
        format,
      );
    }

    try {
      // Parse content
      const conversation = await parser.parse(content);

      // Validate parsed conversation
      this.validateConversation(conversation);

      return conversation;
    } catch (error) {
      if (error instanceof ParserExecutionError) {
        throw error;
      }

      throw new ParserExecutionError(
        `Failed to parse content: ${error instanceof Error ? error.message : String(error)}`,
        format,
      );
    }
  }

  /**
   * Validate parser implementation
   */
  private validateParser(parser: FormatParser): void {
    if (!parser.id || typeof parser.id !== 'string') {
      throw new ParserRegistrationError('Parser must have a valid ID');
    }

    if (!parser.name || typeof parser.name !== 'string') {
      throw new ParserRegistrationError('Parser must have a valid name');
    }

    if (!Array.isArray(parser.formats) || parser.formats.length === 0) {
      throw new ParserRegistrationError('Parser must support at least one format');
    }

    if (typeof parser.detect !== 'function') {
      throw new ParserRegistrationError('Parser must implement detect() method');
    }

    if (typeof parser.parse !== 'function') {
      throw new ParserRegistrationError('Parser must implement parse() method');
    }

    if (typeof parser.serialize !== 'function') {
      throw new ParserRegistrationError('Parser must implement serialize() method');
    }

    if (typeof parser.validate !== 'function') {
      throw new ParserRegistrationError('Parser must implement validate() method');
    }
  }

  /**
   * Validate parsed conversation
   */
  private validateConversation(conversation: Conversation): void {
    if (!conversation.id) {
      throw new ParserExecutionError('Parsed conversation must have an ID');
    }

    if (!Array.isArray(conversation.messages)) {
      throw new ParserExecutionError('Parsed conversation must have messages array');
    }

    if (!Array.isArray(conversation.agents)) {
      throw new ParserExecutionError('Parsed conversation must have agents array');
    }

    // Validate all messages have required fields
    for (const message of conversation.messages) {
      if (!message.id || !message.agentId || !message.content) {
        throw new ParserExecutionError('All messages must have id, agentId, and content');
      }
    }

    // Validate all agents are referenced
    const agentIds = new Set(conversation.agents.map((a) => a.id));
    for (const message of conversation.messages) {
      if (!agentIds.has(message.agentId)) {
        throw new ParserExecutionError(`Message references unknown agent: ${message.agentId}`);
      }
    }
  }

  /**
   * Clear all registered parsers
   */
  clear(): void {
    this.parsers.clear();
    this.formatMap.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    parserCount: number;
    formatCount: number;
    parsers: Array<{ id: string; name: string; formats: string[] }>;
  } {
    return {
      parserCount: this.parsers.size,
      formatCount: this.formatMap.size,
      parsers: Array.from(this.parsers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        formats: p.formats,
      })),
    };
  }
}
