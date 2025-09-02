# 🧪 Mikoshi

Hey, you're here early! Welcome to the construction site of Mikoshi - the testing platform that puts your AI agents through digital purgatory so they don't break in production.

## What's Mikoshi?

Think Postman for AI agents - but instead of just testing if they work, we actively try to break them (professionally).
Your multi-agent AI system might work perfectly in development, but what happens when:

- 🌊 Messages arrive out of order?
- 💀 An agent times out mid-conversation?
- 🔀 Network issues cause 30% packet loss?
- 🧨 Payloads get corrupted in transit?

Mikoshi lets you replay agent conversations under chaos conditions to find these bugs before your customers do.

## Project Structure

This is a monorepo managed with Bun workspaces and Turbo. The project consists of:

### Packages

- **@mikoshi/types** - TypeScript type definitions
- **@mikoshi/test-utils** - Testing utilities, factories, and fixtures
- **@mikoshi/shared** - Shared utilities and constants

### Apps (To be implemented)

- **@mikoshi/core** - Core engine (replay, chaos, validation)
- **@mikoshi/api** - REST API server
- **@mikoshi/web** - Next.js web interface

## Setup

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git

### Installation

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests with coverage
bun test:coverage

# Run linting
bun lint

# Format code
bun format
```

## Development

### Test-First Development

This project follows test-first development principles:

1. Write tests before implementation
2. Aim for >80% test coverage
3. Use property-based testing for edge cases
4. Run tests in pre-commit hooks

### Testing Infrastructure

- **Vitest** - Primary test runner
- **Fast-check** - Property-based testing
- **Test Utils** - Factories and fixtures for synthetic data
- **Coverage** - Configured with 80% threshold

### Key Features

#### Conversation Factory

Generate synthetic conversation data for testing:

```typescript
import { ConversationFactory } from '@mikoshi/test-utils';

const factory = new ConversationFactory();
const conversation = factory.createConversation({
  agentCount: 3,
  messageCount: 10,
});
```

#### Chaos Testing

Create deterministic chaos scenarios:

```typescript
import { ChaosFactory } from '@mikoshi/test-utils';

const chaos = new ChaosFactory();
const config = chaos.createMessageLoss({
  lossRate: 0.1,
  seed: 12345, // Deterministic
});
```

#### Invariant Rules

Define validation rules:

```typescript
import { InvariantFactory } from '@mikoshi/test-utils';

const factory = new InvariantFactory();
const rule = factory.createSequenceInvariant({
  pattern: ['request', 'process', 'response'],
  ordering: 'strict',
});
```

## Scripts

- `bun test` - Run all tests
- `bun test:unit` - Run unit tests
- `bun test:coverage` - Run tests with coverage report
- `bun lint` - Run ESLint
- `bun format` - Format code with Prettier
- `bun build` - Build all packages
- `bun clean` - Clean build artifacts

## Project Status

### Completed (Day 1-2)

- ✅ Monorepo setup with TypeScript and Bun
- ✅ Vitest configuration with coverage (>80%)
- ✅ Test utilities package
- ✅ Conversation factory for synthetic data
- ✅ Fixture directory structure
- ✅ Shared types and utilities
- ✅ Build tools and linting
- ✅ Pre-commit hooks

### Next Steps (Day 3-4)

- [ ] Replay Engine Development
- [ ] Conversation parser for multiple formats
- [ ] Message flow processor
- [ ] State tracking system

## License

Private
