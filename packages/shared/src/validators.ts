/**
 * Shared validation functions
 */

import type { Conversation, Message, Agent } from '@mikoshi/types';

/**
 * Validate a conversation structure
 */
export function validateConversation(conversation: unknown): conversation is Conversation {
  if (!conversation || typeof conversation !== 'object') {
    return false;
  }

  const conv = conversation as any;

  return (
    typeof conv.id === 'string' &&
    typeof conv.format === 'string' &&
    Array.isArray(conv.agents) &&
    Array.isArray(conv.messages) &&
    typeof conv.startTime === 'number' &&
    conv.agents.every(validateAgent) &&
    conv.messages.every(validateMessage)
  );
}

/**
 * Validate an agent structure
 */
export function validateAgent(agent: unknown): agent is Agent {
  if (!agent || typeof agent !== 'object') {
    return false;
  }

  const a = agent as any;

  return (
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    typeof a.type === 'string'
  );
}

/**
 * Validate a message structure
 */
export function validateMessage(message: unknown): message is Message {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const msg = message as any;

  return (
    typeof msg.id === 'string' &&
    typeof msg.agentId === 'string' &&
    typeof msg.content === 'string' &&
    typeof msg.timestamp === 'number'
  );
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate JSON string
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date string
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate number range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate string length
 */
export function hasValidLength(
  str: string,
  minLength: number = 0,
  maxLength: number = Infinity
): boolean {
  return str.length >= minLength && str.length <= maxLength;
}

/**
 * Validate array has unique values
 */
export function hasUniqueValues<T>(array: T[]): boolean {
  return new Set(array).size === array.length;
}

/**
 * Validate object has required keys
 */
export function hasRequiredKeys<T extends object>(
  obj: T,
  requiredKeys: (keyof T)[]
): boolean {
  return requiredKeys.every((key) => key in obj);
}

/**
 * Validate PII patterns
 */
export function containsPII(text: string): {
  hasPII: boolean;
  types: string[];
} {
  const patterns = {
    ssn: /\d{3}-\d{2}-\d{4}/,
    creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    phone: /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/,
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  };

  const foundTypes: string[] = [];

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      foundTypes.push(type);
    }
  }

  return {
    hasPII: foundTypes.length > 0,
    types: foundTypes,
  };
}

/**
 * Validate semantic version
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * Validate file path
 */
export function isValidFilePath(path: string): boolean {
  // Basic validation - can be extended based on OS
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  return !invalidChars.test(path) && path.length > 0 && path.length < 260;
}

/**
 * Validate cron expression
 */
export function isValidCron(expression: string): boolean {
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(expression);
}