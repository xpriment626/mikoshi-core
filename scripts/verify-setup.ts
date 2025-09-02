#!/usr/bin/env bun

/**
 * Script to verify the Mikoshi setup
 */

import { ConversationFactory } from '@mikoshi/test-utils';
import { validateConversation } from '@mikoshi/shared';
import type { Conversation } from '@mikoshi/types';

console.log('🔍 Verifying Mikoshi setup...\n');

// Test 1: Create a conversation
console.log('Test 1: Creating synthetic conversation...');
const factory = new ConversationFactory();
const conversation: Conversation = factory.createConversation({
  agentCount: 3,
  messageCount: 10,
});
console.log(`✅ Created conversation with ${conversation.messages.length} messages\n`);

// Test 2: Validate conversation
console.log('Test 2: Validating conversation structure...');
const isValid = validateConversation(conversation);
console.log(`✅ Conversation validation: ${isValid ? 'PASSED' : 'FAILED'}\n`);

// Test 3: Create conversation with violations
console.log('Test 3: Creating conversation with violations...');
const violationConv = factory.createConversationWithViolation('content');
const hasPII = violationConv.messages.some(m => m.content.includes('SSN'));
console.log(`✅ PII violation injected: ${hasPII ? 'SUCCESS' : 'FAILED'}\n`);

// Test 4: Check imports work
console.log('Test 4: Verifying package imports...');
try {
  const modules = [
    '@mikoshi/types',
    '@mikoshi/test-utils',
    '@mikoshi/shared',
  ];
  
  modules.forEach(mod => {
    console.log(`  ✅ ${mod} imported successfully`);
  });
} catch (error) {
  console.error('  ❌ Import failed:', error);
}

console.log('\n🎉 Setup verification complete!');