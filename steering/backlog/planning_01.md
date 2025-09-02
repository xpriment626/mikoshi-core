# Mikoshi Development Plan with Testing Integration

## Executive Summary

This document outlines the comprehensive development plan for Mikoshi, a no-code testing and validation platform for multi-agent AI systems. The plan emphasizes test-first development with integrated quality assurance at every phase.

**CRITICAL UPDATE (Day 3)**: Architectural review has identified critical foundation issues that must be addressed before proceeding with the Replay Engine. Day 3-4 has been revised to fix these issues first.

## Implementation Strategy (2-Week MVP)

### Week 1: Core Engine with Test-First Development

**~~Day 1-2: Foundation & Testing Infrastructure~~** ✅

- ~~Set up monorepo with TypeScript and Bun~~
- ~~Configure Vitest as primary test runner~~
- ~~Create test utilities package for fixtures and helpers~~
- ~~Build conversation factory for synthetic test data~~
- ~~Set up test coverage requirements (>80%)~~

**Day 3-4: Fix Critical Foundation Issues** ⚠️ REVISED

**Critical Issues Identified by Architecture Review:**

1. **Broken Determinism**: ConversationFactory accepts seed but uses Math.random() instead - catastrophic for reproducible testing
2. **Missing Core Architecture**: No interfaces defined for engine components
3. **No Plugin System**: Format parsers are hardcoded instead of extensible
4. **Type Safety Gaps**: Chaos parameters lack proper type safety

**Revised Day 3-4 Tasks:** ✅

- ~~**Fix Deterministic Randomness** (CRITICAL PRIORITY)~~
  - ~~Implement SeededRandom class using LCG algorithm~~
  - ~~Update ConversationFactory to use SeededRandom~~
  - ~~Add statistical tests to verify determinism~~
  - ~~Ensure all random operations are reproducible~~
- ~~**Define Core Architecture**~~
  - ~~Create engine interfaces (ReplayEngine, ChaosInjector, InvariantValidator)~~
  - ~~Establish event sourcing pattern for conversation replay~~
  - ~~Design streaming support for large conversations~~
  - ~~Define plugin architecture for format parsers~~
- ~~**Implement Parser Registry**~~
  - ~~Create extensible parser plugin system~~
  - ~~Implement at least 2 format parsers (AutoGen, LangChain)~~
  - ~~Add format auto-detection logic~~
  - ~~Include validation and error handling~~
- ~~**Add Property-Based Testing**~~
  - ~~Properly integrate fast-check library~~
  - ~~Create property tests for core components~~
  - ~~Generate edge cases automatically~~
  - ~~Validate chaos distribution properties~~

**Quality Gates Before Day 5:** ✅

- ✅ SeededRandom working with statistical tests
- ✅ Core interfaces defined and reviewed
- ✅ Parser registry with 2+ format parsers
- ✅ Property-based tests passing
- ✅ Performance baseline established

_Note: Original Replay Engine work postponed to Day 5-6_

**Day 5-6: Replay Engine Implementation** (Originally Day 3-4)

- Implement event-sourced ReplayEngine using interfaces from Day 3-4
- Build streaming conversation parser with plugin registry
- Create deterministic replay mechanism using SeededRandom
- Implement state tracking with snapshot capability
- Add support for both forward and reverse playback
- Use async generators for streaming large conversations (10k+ messages)
- Implement parser auto-detection based on conversation structure
- Create checkpoint system for long-running replays
  **Testing:**
- Property-based tests for replay determinism
- Test with 10k+ message conversations
- Verify memory efficiency with streaming
- Test parser plugin hot-swapping

**Day 7: Chaos Injector with Deterministic Randomness** (Condensed from original 2 days)

- Implement ChaosInjector using SeededRandom for all operations
- Build statistical distribution validators (Chi-square tests)
- Create chaos composition system (multiple modes simultaneously)
- Implement chaos replay capability and fingerprinting
- Add chaos intensity scaling (0-100%)
- Build chaos timeline visualization data
  **Testing:**
- Statistical validation of distributions
- Verify seed reproducibility across 1000 runs
- Test chaos composition edge cases
- Benchmark performance impact

### Week 2: API & UI with Integration Testing

**Day 8: Invariant Validator & Rule Engine** (Moved earlier, condensed)

- Implement InvariantValidator interface from Day 3-4
- Build plain English rule parser with AST (using PEG parser)
- Create rule composition system with conflict detection
- Implement streaming validation (don't wait for full conversation)
- Support both sync and async validators
- Build rule caching and compilation
  **Testing:**
- Property-based testing for rule parser
- Test with contradictory rules
- Verify streaming validation accuracy
- Test performance with 100+ rules

**Day 9-10: REST API & Test Orchestrator** (Sticking with REST for MVP)

- Build REST API (not GraphQL for simplicity)
- Implement job queue (BullMQ or similar)
- Create Test Orchestrator with parallel execution
- Build result aggregation pipeline
- Define core endpoints:
  - POST /conversations/upload
  - POST /tests/create
  - GET /tests/{id}/status
  - GET /tests/{id}/results
  - POST /tests/{id}/replay
    **Testing:**
- Contract testing with OpenAPI
- Load test with 100 concurrent uploads
- Test job recovery after crash
- Verify result consistency

**Day 11-12: Minimal Frontend** (Reduced scope - no visual builder for MVP)

- Create Next.js 14 app with upload interface
- Simple results dashboard (table view only)
- Basic timeline visualization
- Export to JSON/CSV only (no PDF for MVP)
- Drag-drop file upload with format auto-detection
- Results table with filtering
- Polling for updates (no real-time WebSockets)
  **Scope Reductions:**
- NO visual test builder (v2)
- NO fancy animations
- NO real-time updates
- NO PDF export
  **Testing:**
- Playwright E2E for critical paths only
- Skip visual regression testing for MVP

**Day 13: Integration Testing & Self-Testing Demo**

- Full integration test suite
- Mikoshi testing its own test runs
- Create compelling demo scenarios:
  - Upload conversation → Inject chaos → Validate invariants
  - Mikoshi testing its own API calls
  - Detecting injected violations correctly
  - Showing deterministic replay with same seed
- Performance benchmarking:
  - 10k message conversation < 5 seconds
  - 100 parallel tests < 30 seconds
  - API response < 500ms p99
  - Frontend interaction < 100ms

**Day 14: Documentation, Demo Prep & Buffer**

- API documentation
- Demo script and video creation
- Known issues documentation
- Deployment guide
- Buffer time for:
  - Critical bug fixes from Day 13
  - Performance optimizations
  - Demo environment setup
  - Final testing pass

## Dependency Graph

```
Day 3-4 (Foundation Fix)
    ├── Day 5-6 (Replay Engine)
    │       ├── Day 7 (Chaos Injector)
    │       └── Day 8 (Invariant Validator)
    │               └── Day 9-10 (API/Orchestrator)
    │                       ├── Day 11-12 (Frontend)
    │                       └── Day 13 (Integration)
    └── Day 14 (Buffer/Documentation)
```

## Risk Areas & Mitigation

### High Risk Areas

1. **Parser Plugin System Complexity** (Day 3-4)
   - Mitigation: Start with 2 hardcoded parsers, make pluggable later

2. **Streaming Performance** (Day 5-6)
   - Mitigation: Implement simple version first, optimize if needed

3. **Rule Parser Complexity** (Day 8)
   - Mitigation: Start with simple rules, add complexity incrementally

4. **Frontend Scope Creep** (Day 11-12)
   - Mitigation: Strictly enforce "table view only" for MVP

### Timeline Slip Risks

- Day 5-6: Replay Engine might take 3 days instead of 2
- Day 9-10: API complexity often underestimated
- Day 11-12: Frontend always takes longer than expected

## Must-Have vs Nice-to-Have for MVP

### Must-Have (Non-negotiable)

- ✅ Deterministic chaos injection with seeds
- ✅ At least 3 chaos modes working
- ✅ At least 5 invariant rules working
- ✅ File upload and format detection
- ✅ Basic results display
- ✅ Self-testing demonstration
- ✅ Reproducible test runs

### Nice-to-Have (Can ship without)

- Visual test builder (postpone to v2)
- Real-time updates (polling is fine)
- PDF export (JSON/CSV only)
- GraphQL API (REST is simpler)
- Multiple parser plugins (2 is enough)
- Fancy UI animations
- Historical trending
- Multi-tenancy

## Recovery Plan if Behind Schedule

If by Day 10 we're more than 1 day behind:

1. **Cut:** Visual test builder completely
2. **Cut:** Multiple format parsers (just one)
3. **Cut:** Export functionality
4. **Simplify:** API to just 3 endpoints
5. **Simplify:** Frontend to upload + raw JSON results
6. **Focus:** Just on deterministic chaos demo

## Detailed Task Breakdown

### Phase 1: Foundation & Testing Infrastructure

#### ~~1.1 Project Setup with Testing Framework~~ ✅

- ~~Initialize monorepo structure with TypeScript~~
- ~~Configure Bun/Node.js environment~~
- ~~**Set up Vitest as primary test runner**~~
- ~~**Configure test coverage requirements (>80%)**~~
- ~~**Install testing libraries (fast-check, @testing-library/react, Playwright)**~~
- ~~Set up shared types and utilities packages~~
- ~~**Create test utilities package for fixtures and helpers**~~
- ~~Configure build tools and linting~~
- ~~Set up pre-commit hooks for test execution~~

#### ~~1.2 Test Data Generation System~~ ✅

- ~~**Create conversation factory for synthetic data generation**~~
- ~~**Build fixture library structure**~~
  ```
  test/fixtures/
  ├── conversations/
  │   ├── valid/           # Known good conversations
  │   ├── violations/       # Conversations with specific rule violations
  │   ├── edge-cases/      # Boundary conditions
  │   └── formats/          # Different framework formats
  ├── rules/
  │   ├── simple/          # Basic invariant rules
  │   ├── complex/         # Multi-condition rules
  │   └── invalid/         # Malformed rules for error testing
  └── chaos-scenarios/
      ├── deterministic/   # Reproducible chaos patterns
      └── statistical/     # Probability distributions
  ```
- ~~**Implement deterministic test scenario generator**~~
- ~~**Create known-violation conversation samples**~~
- ~~**Build property-based test generators**~~

#### ~~1.3 Core Data Models with Tests~~ ✅

- ~~Design conversation schema (JSON/YAML)~~
- ~~**Write schema validation tests**~~
- ~~Create agent message types~~
- ~~**Test message type conversions**~~
- ~~Define invariant/rule structures~~
- ~~**Test rule serialization/deserialization**~~
- ~~Implement type-safe validation~~
- ~~**Add boundary condition tests**~~

### Phase 2: Core Engine Development

#### 2.1 Replay Engine with Test Coverage

- Build conversation parser
- **Unit test each format parser**
  - AutoGen format tests
  - LangChain format tests
  - Crew format tests
  - Custom format mapping tests
- Implement message flow processor
- **Test edge cases**
  - Empty conversations
  - Malformed data
  - Huge conversations (10k+ messages)
  - Circular references
- Create state tracking system
- **Test state transitions with property-based testing**

#### 2.2 Chaos Injector with Validation

- Build message loss simulator
  - **Test statistical distribution of losses**
  - **Verify deterministic behavior with seeds**
  - **Validate percentage accuracy over large samples**
- Implement delay injection
  - **Test delay ranges and distributions**
  - **Verify timing consistency**
  - **Test boundary conditions (0ms, max delay)**
- Create message reordering logic
  - **Test reordering patterns**
  - **Verify reproducibility with seeds**
  - **Test preservation of causal relationships**
- Add payload corruption simulator
  - **Test corruption patterns**
  - **Verify data integrity checks**
- Implement agent failure simulation
  - **Test timeout behaviors**
  - **Verify crash recovery scenarios**

#### 2.3 Invariant Validator with Test Suite

- Implement rule parsing engine
  - **Test plain English rule parsing**
  - **Test rule composition**
  - **Test error handling for malformed rules**
- Build sequence validators
  - **Test sequence violation detection**
  - **Test complex ordering constraints**
  - **Property-based testing for all permutations**
- Create content validators
  - **Test PII detection accuracy**
  - **Test regex pattern matching**
  - **Add false positive/negative tests**
- Implement timing validators
  - **Test latency detection**
  - **Test timeout violations**
  - **Test clock skew handling**
- Add state validators
  - **Test state consistency checks**
  - **Test invariant preservation**
  - **Test rollback scenarios**

### Phase 3: Integration Layer

#### 3.1 Test Orchestrator with Meta-Testing

- Create test execution pipeline
  - **Test parallel execution capability**
  - **Test resource management**
  - **Test failure isolation**
- Build test variation generator
  - **Verify seed-based reproducibility**
  - **Test permutation coverage**
  - **Test optimization algorithms**
- Implement result aggregation
  - **Test result accuracy**
  - **Test statistical analysis**
  - **Test report generation**
- **Add self-testing capability**
  - Mikoshi tests its own agent communications
  - Verify resilience to own chaos modes
  - Validate own invariant rules

#### 3.2 API Development with Contract Testing

- Design RESTful endpoints
  - **Create OpenAPI specification**
  - **Generate contract tests from spec**
- Implement conversation upload API
  - **Test file size limits**
  - **Test format validation**
  - **Test concurrent uploads**
- Create test execution endpoints
  - **Test async job handling**
  - **Test progress reporting**
  - **Test cancellation**
- Build results retrieval API
  - **Test pagination**
  - **Test filtering**
  - **Test export formats**
- **Add load testing**
  - Test 1000 concurrent requests
  - Test rate limiting
  - Test circuit breakers

### Phase 4: Frontend Development with Testing

#### 4.1 UI Framework with Testing Setup

- Set up Next.js 14 project
- **Configure React Testing Library**
- **Set up snapshot testing**
- **Configure Playwright for E2E**
- Create component library
- **Test each component in isolation**
- **Add accessibility testing**
- **Test responsive behavior**

#### 4.2 Upload Interface with E2E Tests

- Build drag-and-drop upload
  - **Test file validation**
  - **Test error handling**
  - **Test progress indication**
- Create format detection UI
  - **Test auto-detection accuracy**
  - **Test manual override**
  - **Test format conversion**
- **Add Playwright E2E tests**
  - Test complete upload flow
  - Test error scenarios
  - Test large file handling

#### 4.3 Visual Test Builder with Interaction Tests

- Create agent canvas interface
  - **Test drag-and-drop interactions**
  - **Test zoom/pan controls**
  - **Test touch interactions**
- Build message flow connections
  - **Test connection validation**
  - **Test auto-routing**
  - **Test deletion/modification**
- **Test visual workflow serialization**
  - Test save/load functionality
  - Test version compatibility
  - Test export formats

#### 4.4 Results Dashboard with Visual Testing

- Create timeline visualization
  - **Snapshot test all states**
  - **Test interaction responsiveness**
  - **Test data density handling**
- Build violation highlighting
  - **Test highlight accuracy**
  - **Test color accessibility**
  - **Test filtering/search**
- **Test export functionality**
  - Test PDF generation
  - Test CSV export
  - Test data integrity

### Phase 5: Quality Assurance & Hardening

#### 5.1 Comprehensive Test Suite

- **Run full regression suite**
  - All unit tests
  - All integration tests
  - All E2E tests
- **Property-based testing**
  - Test all validators with generated inputs
  - Test chaos modes with random seeds
  - Test API with fuzz testing
- **Chaos testing on Mikoshi itself**
  - Apply own chaos modes
  - Verify self-resilience
  - Document failure modes
- **Performance benchmarking**
  - Establish baseline metrics
  - Test scalability limits
  - Optimize bottlenecks
- **Security testing**
  - Input validation testing
  - XSS prevention testing
  - Authentication/authorization testing

#### 5.2 Test Observability

- **Implement test metrics collection**
  - Test execution time
  - Test success rate
  - Code coverage trends
- **Create test effectiveness dashboard**
  - Bug detection rate
  - False positive rate
  - Test execution efficiency
- **Add flaky test detection**
  - Track intermittent failures
  - Identify root causes
  - Implement retry logic
- **Generate coverage reports**
  - Line coverage
  - Branch coverage
  - Function coverage

#### 5.3 CI/CD with Automated Testing

- **Set up GitHub Actions pipeline**

  ```yaml
  name: Comprehensive Testing
  on: [push, pull_request]

  jobs:
    unit-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: bun test:unit

    integration-tests:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:15
      steps:
        - uses: actions/checkout@v3
        - run: bun test:integration

    e2e-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: bun test:e2e

    chaos-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: bun test:chaos
  ```

- **Configure parallel test execution**
- **Add test result artifacts**
- **Implement test gating**
- **Add performance regression detection**

## Testing Strategy

### Test-First Development Principles

1. **Write Tests Before Code**
   - Define expected behavior in tests
   - Use tests as specification
   - Ensure comprehensive coverage

2. **Deterministic Testing**
   - Use seeds for reproducible chaos
   - Capture and replay failing scenarios
   - Version test fixtures

3. **Property-Based Testing**
   - Generate edge cases automatically
   - Test invariants over ranges
   - Discover unexpected failures

4. **Meta-Testing**
   - Use Mikoshi to test itself
   - Validate own assumptions
   - Ensure dogfooding

### Testing Pyramid

```
        /\
       /E2E\      (10%) - Critical user journeys
      /------\
     /Integration\ (30%) - Component interactions
    /------------\
   /   Unit Tests  \ (60%) - Core logic validation
  /------------------\
```

### Test Coverage Requirements

- **Unit Tests**: >90% coverage for core logic
- **Integration Tests**: All API endpoints and workflows
- **E2E Tests**: Critical user journeys
- **Performance Tests**: All scalability requirements
- **Security Tests**: All input validation and auth

## Success Metrics

### Code Quality Metrics

- Unit test coverage >80%
- Zero flaky tests
- All chaos modes deterministic with seeds
- Statistical validation passing
- Property tests finding <1% new bugs after launch

### Reliability Metrics

- Can detect 100% of known bugs in fixtures
- Self-testing finds 0 violations
- 100% format detection accuracy
- <5% false positive rate on rules
- Zero critical bugs in production

### Performance Metrics

- Process 10k message conversation <5s
- Run 100 parallel tests <10s
- UI response time <100ms
- API response time <500ms
- 99.9% uptime SLA

### Testing Efficiency

- Test execution time <5 minutes for full suite
- Parallel test execution with 4x speedup
- Test maintenance cost <10% of development time
- Bug detection within 1 commit of introduction

## Risk Mitigation Through Testing

### Technical Risks

- **Risk**: Chaos modes not truly random
- **Mitigation**: Statistical validation tests with large samples

- **Risk**: Invariant rules have false positives
- **Mitigation**: Property-based testing with generated inputs

- **Risk**: Performance degradation over time
- **Mitigation**: Continuous performance benchmarking in CI

### Quality Risks

- **Risk**: Bugs in production
- **Mitigation**: 80%+ test coverage, staging environment testing

- **Risk**: Flaky tests reducing confidence
- **Mitigation**: Flaky test detection and quarantine system

- **Risk**: Test suite becomes slow
- **Mitigation**: Parallel execution, test optimization, selective running

## Testing Tools & Technologies

### Core Testing Stack

- **Vitest**: Fast unit test runner with TypeScript support
- **Fast-check**: Property-based testing library
- **Playwright**: E2E browser testing
- **React Testing Library**: Component testing
- **Supertest**: API endpoint testing

### Supporting Tools

- **Coverage**: c8 for code coverage
- **Benchmarking**: tinybench for performance
- **Mocking**: msw for network mocking
- **Fixtures**: Custom fixture generator
- **Reporting**: Custom test reporter with metrics

## Deliverables Timeline

### Week 1 Deliverables

- ✅ Test infrastructure fully configured
- ✅ Core engine with 90% test coverage
- ✅ 5 working invariant rules (fully tested)
- ✅ 3 chaos modes (validated statistically)
- ✅ Synthetic test data generation system
- ✅ 500+ unit tests passing

### Week 2 Deliverables

- ✅ Basic web interface with E2E tests
- ✅ Upload functionality with error handling
- ✅ Results display with snapshot tests
- ✅ API with contract tests
- ✅ Self-testing demonstration
- ✅ 100+ integration tests passing
- ✅ 20+ E2E tests passing

### Post-MVP Deliverables (Month 1)

- ✅ Complete test documentation
- ✅ Performance optimization based on benchmarks
- ✅ Security audit completion
- ✅ Load testing at scale
- ✅ Continuous monitoring setup

## Conclusion

This plan integrates testing as a first-class concern throughout development, ensuring Mikoshi is reliable, performant, and maintainable from day one. The test-first approach will catch bugs early, provide living documentation, and give confidence for rapid iteration and deployment.
