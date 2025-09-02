# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mikoshi is a no-code testing and validation platform for multi-agent AI systems. It enables testing multi-agent conversations with chaos injection (message loss, delays, reordering) and invariant validation.

## Conventions

- Always think about commits especially when working on long-running tasks. You never want to be committing hundreds of changes in one go. Batch cahnges into logical commits.
- We always work using planning docs in the steering/backlog/ directory. Whenever you compelete a set of subtasks, strikethrough the completed elements in the plan and adjust the planning document so that agents after you can have clean continuity.

## Common Commands

```bash
# Development
bun install                  # Install dependencies
bun test                     # Run all tests across packages
bun test:unit               # Run unit tests only
bun test:coverage           # Run tests with coverage report (must be >80%)
bun lint                    # Run ESLint across all packages
bun format                  # Format code with Prettier
bun build                   # Build all packages

# Package-specific testing (run from root)
bun test packages/types
bun test packages/test-utils
bun test packages/shared

# Run specific test file
bun test packages/test-utils/src/factories/conversation-factory.test.ts
```

## Architecture & Package Relationships

This is a Bun workspace monorepo using Turbo for task orchestration. Packages have strict dependency order:

```
@mikoshi/types (core type definitions)
    ↓
@mikoshi/shared (utilities, constants)
    ↓
@mikoshi/test-utils (factories, fixtures, test helpers)
    ↓
@mikoshi/core (replay engine, chaos injector, validator) [NOT YET IMPLEMENTED]
    ↓
@mikoshi/api & @mikoshi/web [NOT YET IMPLEMENTED]
```

### Key Architectural Patterns

1. **Factory Pattern**: All test data generation uses factories (ConversationFactory, ChaosFactory, InvariantFactory)
2. **Type-First Development**: All packages depend on @mikoshi/types for shared type definitions
3. **Test-First Development**: Write tests before implementation, maintain >80% coverage
4. **Deterministic Testing**: All randomness must be seed-based for reproducibility

## CRITICAL KNOWN ISSUES (Day 3-4 Priority)

### 1. Broken Determinism in ConversationFactory

**File**: `packages/test-utils/src/factories/conversation-factory.ts`
**Issue**: Constructor accepts `seed` parameter but all methods use `Math.random()` instead of seeded random
**Impact**: Tests are not reproducible, chaos injection is not deterministic
**Fix**: Implement SeededRandom class using LCG algorithm

### 2. Missing Core Architecture

**Issue**: No interfaces defined for ReplayEngine, ChaosInjector, InvariantValidator
**Impact**: Implementation will lack proper abstraction and extensibility
**Fix**: Define interfaces in @mikoshi/types before implementation

### 3. No Plugin System

**Issue**: Format parsers are hardcoded instead of using plugin architecture
**Impact**: Cannot extend to support new conversation formats
**Fix**: Implement parser registry pattern

### 4. Type Safety Gaps

**Issue**: Chaos parameters use loose discriminated unions without proper type guards
**Impact**: Runtime errors when wrong parameters passed to chaos modes
**Fix**: Implement proper type guards and validation

## Project Timeline Context

- **Day 1-2**: ✅ Foundation complete (monorepo, types, test-utils)
- **Day 3-4**: 🚨 REVISED - Must fix critical foundation issues before proceeding
- **Day 5-6**: Replay Engine (postponed from Day 3-4)
- **Day 7-14**: Chaos injector, validators, API, minimal frontend

See `/steering/backlog/planning_01.md` for detailed timeline and architectural decisions.

## Testing Strategy

1. **Unit Tests**: Core logic, >90% coverage required
2. **Property-Based Tests**: Use fast-check for edge case generation
3. **Integration Tests**: Component interaction testing
4. **Self-Testing**: Mikoshi must test its own capabilities

### Test File Organization

```
packages/*/src/
├── component.ts           # Implementation
├── component.test.ts      # Unit tests (colocated)
└── component.integration.test.ts  # Integration tests
```

## Development Workflow

1. All changes require tests
2. Pre-commit hooks run linting and tests automatically
3. Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
4. Run `bun test:coverage` before committing to ensure >80% coverage

## Key Technical Decisions

- **Runtime**: Bun (not Node.js) for speed
- **Test Runner**: Vitest (not Jest) for TypeScript support
- **Monorepo Tool**: Turbo for task orchestration
- **Package Manager**: Bun workspaces
- **API Framework**: REST (not GraphQL) for MVP simplicity
- **Frontend**: Next.js 14 with minimal scope (no visual builder for MVP)
